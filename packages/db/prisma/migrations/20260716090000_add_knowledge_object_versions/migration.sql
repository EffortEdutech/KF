-- CreateTable
CREATE TABLE "KnowledgeObjectVersion" (
    "id" TEXT NOT NULL,
    "knowledgeObjectId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "LifecycleState" NOT NULL,
    "confidence" DECIMAL(5,2),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "actorId" TEXT,
    "snapshotReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeObjectVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeObjectVersion_knowledgeObjectId_createdAt_idx" ON "KnowledgeObjectVersion"("knowledgeObjectId", "createdAt");

-- AddForeignKey
ALTER TABLE "KnowledgeObjectVersion" ADD CONSTRAINT "KnowledgeObjectVersion_knowledgeObjectId_fkey" FOREIGN KEY ("knowledgeObjectId") REFERENCES "KnowledgeObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
