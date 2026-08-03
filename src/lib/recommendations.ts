import { Prisma } from "@/generated/prisma/client";
import { embeddingToVectorLiteral } from "@/lib/gemini";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostData, PostsPage } from "@/lib/types";

const RECOMMENDATION_LIMIT = 100;
const CACHE_TTL_MS = 15 * 60 * 1_000;

/**
 * Uses the embeddings of up to 50 recently liked posts as a user's taste
 * profile. A user needs three embedded likes before it is useful.
 */
export async function getUserTasteVector(userId: string): Promise<number[] | null> {
  const rows = await prisma.$queryRaw<{ likeCount: number; embedding: string | null }[]>(
    Prisma.sql`
      WITH recent_likes AS (
        SELECT p."embedding"
        FROM "likes" l
        INNER JOIN "posts" p ON p."id" = l."postId"
        WHERE l."userId" = ${userId}
          AND p."embedding" IS NOT NULL
        ORDER BY l."createdAt" DESC
        LIMIT 50
      )
      SELECT COUNT(*)::int AS "likeCount", AVG("embedding")::text AS "embedding"
      FROM recent_likes
    `,
  );

  const result = rows[0];
  if (!result || result.likeCount < 3 || !result.embedding) return null;

  try {
    const vector = JSON.parse(result.embedding) as unknown;
    if (
      !Array.isArray(vector) ||
      vector.length !== 768 ||
      vector.some((value) => typeof value !== "number" || !Number.isFinite(value))
    ) {
      console.error("Postgres returned an invalid user taste vector.");
      return null;
    }

    return vector;
  } catch (error) {
    console.error("Unable to parse user taste vector:", error);
    return null;
  }
}

export async function getForYouFeed(
  userId: string,
  cursor?: string,
  limit = 10,
): Promise<PostsPage> {
  const posts = await prisma.post.findMany({
    include: getPostDataInclude(userId),
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
  });

  return {
    posts: posts.slice(0, limit),
    nextCursor: posts.length > limit ? posts[limit].id : null,
  };
}

function parseRecommendationOffset(cursor?: string): number {
  if (!cursor?.startsWith("offset:")) return 0;
  const offset = Number.parseInt(cursor.slice("offset:".length), 10);
  return Number.isFinite(offset) && offset > 0 ? offset : 0;
}

async function getCachedRecommendationIds(userId: string): Promise<string[] | null> {
  const cached = await prisma.recommendationCache.findUnique({ where: { userId } });
  if (cached && Date.now() - cached.computedAt.getTime() < CACHE_TTL_MS) {
    if (Array.isArray(cached.postIds) && cached.postIds.every((id) => typeof id === "string")) {
      // Empty entries can come from a previously too-narrow freshness window.
      // Recompute them so the fallback pool below can fill the feed.
      if (cached.postIds.length > 0) return cached.postIds;
    }

    // A malformed or empty cache entry should never break the feed; replace it below.
    await prisma.recommendationCache.delete({ where: { userId } });
  }

  const tasteVector = await getUserTasteVector(userId);
  if (!tasteVector) return null;

  const rows = await prisma.$queryRaw<{ id: string }[]>(
    Prisma.sql`
      SELECT p."id"
      FROM "posts" p
      WHERE p."embedding" IS NOT NULL
        AND p."userId" <> ${userId}
        AND NOT EXISTS (
          SELECT 1
          FROM "likes" l
          WHERE l."postId" = p."id" AND l."userId" = ${userId}
        )
      ORDER BY p."embedding" <=> ${embeddingToVectorLiteral(tasteVector)}::vector ASC
      LIMIT ${RECOMMENDATION_LIMIT}
    `,
  );
  const postIds = rows.map((row) => row.id);
  await prisma.recommendationCache.upsert({
    where: { userId },
    create: { userId, postIds, computedAt: new Date() },
    update: { postIds, computedAt: new Date() },
  });
  return postIds;
}

export async function invalidateRecommendedFeed(userId: string) {
  await prisma.recommendationCache.deleteMany({ where: { userId } });
}

/**
 * Recommendation pages use a cached ranking and an offset cursor. Vector
 * rankings are intentionally not paginated by createdAt because that can
 * reorder results while a user is scrolling.
 */
export async function getRecommendedFeed(
  userId: string,
  cursor?: string,
  limit = 10,
): Promise<PostsPage> {
  const postIds = await getCachedRecommendationIds(userId);

  // A missing taste vector is a cold start: retain the exact For You feed.
  if (postIds === null) {
    return getForYouFeed(userId, cursor, limit);
  }

  const offset = parseRecommendationOffset(cursor);
  const pageIds = postIds.slice(offset, offset + limit);
  const postsById = new Map<string, PostData>(
    (
      await prisma.post.findMany({
        where: { id: { in: pageIds } },
        include: getPostDataInclude(userId),
      })
    ).map((post) => [post.id, post]),
  );
  const posts = pageIds.flatMap((id) => {
    const post = postsById.get(id);
    return post ? [post] : [];
  });
  const nextOffset = offset + limit;

  return {
    posts,
    nextCursor: nextOffset < postIds.length ? `offset:${nextOffset}` : null,
  };
}
