-- CreateTable
CREATE TABLE "RateLimitHit" (
    "key" TEXT NOT NULL,
    "totalHits" INTEGER NOT NULL DEFAULT 0,
    "resetTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "RateLimitHit_resetTime_idx" ON "RateLimitHit"("resetTime");
