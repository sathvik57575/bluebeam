import { Prisma } from "@/generated/prisma/client";
import { embeddingToVectorLiteral, getEmbedding } from "@/lib/gemini";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostData } from "@/lib/types";

const SEARCH_RESULT_LIMIT = 20;

export type HybridSearchResult = PostData & {
  matchType: "keyword" | "semantic";
};

/** Stores an embedding without allowing a failed embedding to affect the post flow. */
export async function generateAndStorePostEmbedding(postId: string, content: string) {
  const embedding = await getEmbedding(content);
  if (!embedding) {
    console.warn(`Skipping embedding generation for post ${postId}: embedding unavailable.`);
    return;
  }

  try {
    await prisma.$executeRaw(
      Prisma.sql`UPDATE "posts" SET "embedding" = ${embeddingToVectorLiteral(embedding)}::vector WHERE "id" = ${postId}`,
    );
  } catch (error) {
    console.error(`Unable to store embedding for post ${postId}:`, error);
  }
}

/**
 * Keeps the current PostgreSQL full-text search intact, then augments it with
 * pgvector cosine similarity. Returned records retain their source internally.
 */
export async function hybridSearchPosts(query: string, userId: string): Promise<HybridSearchResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const searchQuery = trimmedQuery.split(/\s+/).join(" & ");
  const keywordPosts = await prisma.post.findMany({
    where: {
      OR: [
        { content: { search: searchQuery } },
        { user: { displayName: { search: searchQuery } } },
        { user: { username: { search: searchQuery } } },
      ],
    },
    include: getPostDataInclude(userId),
    orderBy: { createdAt: "desc" },
    take: SEARCH_RESULT_LIMIT,
  });

  const keywordResults: HybridSearchResult[] = keywordPosts.map((post) => ({
    ...post,
    matchType: "keyword",
  }));

  const embedding = await getEmbedding(trimmedQuery);
  if (!embedding) {
    console.warn(`Skipping semantic search for query ${JSON.stringify(trimmedQuery)}: embedding unavailable.`);
    return keywordResults;
  }

  try {
    const nearestPosts = await prisma.$queryRaw<{ id: string; distance: number }[]>(
      Prisma.sql`
        SELECT "id", "embedding" <=> ${embeddingToVectorLiteral(embedding)}::vector AS "distance"
        FROM "posts"
        WHERE "embedding" IS NOT NULL
        ORDER BY "embedding" <=> ${embeddingToVectorLiteral(embedding)}::vector ASC
        LIMIT ${SEARCH_RESULT_LIMIT}
      `,
    );

    const semanticIds = nearestPosts.map(({ id }) => id);
    if (semanticIds.length === 0) return keywordResults;

    const postsById = new Map(
      (
        await prisma.post.findMany({
          where: { id: { in: semanticIds } },
          include: getPostDataInclude(userId),
        })
      ).map((post) => [post.id, post]),
    );

    const keywordIds = new Set(keywordPosts.map((post) => post.id));
    const semanticResults = semanticIds.flatMap((id) => {
      const post = postsById.get(id);
      return post && !keywordIds.has(id) ? [{ ...post, matchType: "semantic" as const }] : [];
    });

    return [...keywordResults, ...semanticResults].slice(0, SEARCH_RESULT_LIMIT);
  } catch (error) {
    console.error("Semantic search failed; returning keyword results only:", error);
    return keywordResults;
  }
}
