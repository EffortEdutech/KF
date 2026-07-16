-- Add Sprint 3 pipeline extraction chunks and KO suggestion records.
CREATE TABLE "SourceChunk" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "locator" TEXT,
    "content" TEXT NOT NULL,
    "tokenEstimate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceChunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeSuggestion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceChunkId" TEXT,
    "title" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DECIMAL(5,2),
    "suggestedTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceExcerpt" TEXT,
    "evidenceLocator" TEXT,
    "reviewNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "acceptedKnowledgeObjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SourceChunk_projectId_sourceId_idx" ON "SourceChunk"("projectId", "sourceId");
CREATE UNIQUE INDEX "SourceChunk_sourceId_chunkIndex_key" ON "SourceChunk"("sourceId", "chunkIndex");
CREATE INDEX "KnowledgeSuggestion_projectId_status_idx" ON "KnowledgeSuggestion"("projectId", "status");
CREATE INDEX "KnowledgeSuggestion_sourceId_status_idx" ON "KnowledgeSuggestion"("sourceId", "status");

ALTER TABLE "SourceChunk" ADD CONSTRAINT "SourceChunk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SourceChunk" ADD CONSTRAINT "SourceChunk_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KnowledgeSuggestion" ADD CONSTRAINT "KnowledgeSuggestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KnowledgeSuggestion" ADD CONSTRAINT "KnowledgeSuggestion_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KnowledgeSuggestion" ADD CONSTRAINT "KnowledgeSuggestion_sourceChunkId_fkey" FOREIGN KEY ("sourceChunkId") REFERENCES "SourceChunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KnowledgeSuggestion" ADD CONSTRAINT "KnowledgeSuggestion_acceptedKnowledgeObjectId_fkey" FOREIGN KEY ("acceptedKnowledgeObjectId") REFERENCES "KnowledgeObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
