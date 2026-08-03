CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "posts"
ADD COLUMN "embedding" vector(768);

CREATE INDEX "posts_embedding_hnsw_idx"
ON "posts"
USING hnsw ("embedding" vector_cosine_ops);
