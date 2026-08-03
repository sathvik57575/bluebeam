CREATE TABLE "recommendation_cache" (
  "userId" TEXT NOT NULL,
  "postIds" JSONB NOT NULL,
  "computedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "recommendation_cache_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "recommendation_cache_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
