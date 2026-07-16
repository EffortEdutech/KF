-- Add Sprint 3 relationship suggestion records. These are AI/deterministic candidates,
-- not governed graph edges until explicitly accepted by a human workflow.
CREATE TABLE "RelationshipSuggestion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceChunkId" TEXT,
    "fromSuggestionId" TEXT NOT NULL,
    "toSuggestionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidence" DECIMAL(5,2),
    "evidenceExcerpt" TEXT,
    "evidenceLocator" TEXT,
    "reviewNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "acceptedRelationshipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RelationshipSuggestion_projectId_status_idx" ON "RelationshipSuggestion"("projectId", "status");
CREATE INDEX "RelationshipSuggestion_sourceId_status_idx" ON "RelationshipSuggestion"("sourceId", "status");

ALTER TABLE "RelationshipSuggestion" ADD CONSTRAINT "RelationshipSuggestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RelationshipSuggestion" ADD CONSTRAINT "RelationshipSuggestion_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RelationshipSuggestion" ADD CONSTRAINT "RelationshipSuggestion_sourceChunkId_fkey" FOREIGN KEY ("sourceChunkId") REFERENCES "SourceChunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RelationshipSuggestion" ADD CONSTRAINT "RelationshipSuggestion_fromSuggestionId_fkey" FOREIGN KEY ("fromSuggestionId") REFERENCES "KnowledgeSuggestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RelationshipSuggestion" ADD CONSTRAINT "RelationshipSuggestion_toSuggestionId_fkey" FOREIGN KEY ("toSuggestionId") REFERENCES "KnowledgeSuggestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RelationshipSuggestion" ADD CONSTRAINT "RelationshipSuggestion_acceptedRelationshipId_fkey" FOREIGN KEY ("acceptedRelationshipId") REFERENCES "KnowledgeRelationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;
