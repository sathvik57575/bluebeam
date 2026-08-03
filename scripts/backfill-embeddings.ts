import { PrismaClient } from "../src/generated/prisma/client";
import { embeddingToVectorLiteral, getEmbedding } from "../src/lib/gemini";

const prisma = new PrismaClient();
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 1_000;

async function main() {
  const posts = await prisma.$queryRaw<{ id: string; content: string }[]>`
    SELECT "id", "content"
    FROM "posts"
    WHERE "embedding" IS NULL
    ORDER BY "createdAt" ASC
  `;

  console.log(`Found ${posts.length} posts without embeddings.`);

  for (let index = 0; index < posts.length; index += BATCH_SIZE) {
    const batch = posts.slice(index, index + BATCH_SIZE);
    let completed = 0;

    for (const post of batch) {
      const embedding = await getEmbedding(post.content);
      if (!embedding) continue;

      await prisma.$executeRaw`
        UPDATE "posts"
        SET "embedding" = ${embeddingToVectorLiteral(embedding)}::vector
        WHERE "id" = ${post.id}
      `;
      completed += 1;
    }

    console.log(`Processed ${Math.min(index + batch.length, posts.length)}/${posts.length} posts (${completed} stored in this batch).`);

    if (index + BATCH_SIZE < posts.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
}

main()
  .catch((error) => {
    console.error("Embedding backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
