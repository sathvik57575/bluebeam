ALTER TABLE "likes"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "likes_userId_createdAt_idx"
ON "likes" ("userId", "createdAt" DESC);
