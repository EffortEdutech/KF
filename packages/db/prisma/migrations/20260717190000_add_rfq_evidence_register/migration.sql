-- Add the first table-backed placeholder for QS/RFQ evidence controls.
-- The Studio currently uses an in-memory service surface for the pilot, while
-- this table preserves the intended persistence boundary for the next DB slice.

CREATE TABLE "RfqEvidenceRegisterEntry" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceId" TEXT,
  "knowledgeObjectId" TEXT,
  "registerCode" TEXT NOT NULL,
  "boqItemRef" TEXT,
  "tradeSection" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "questionOrEvidence" TEXT NOT NULL,
  "requiredResponseOwner" TEXT NOT NULL,
  "evidenceReference" TEXT,
  "commercialImpact" TEXT,
  "pricingBasisChange" BOOLEAN NOT NULL DEFAULT false,
  "workflowGate" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RfqEvidenceRegisterEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RfqEvidenceRegisterEntry_projectId_registerCode_key"
  ON "RfqEvidenceRegisterEntry"("projectId", "registerCode");

CREATE INDEX "RfqEvidenceRegisterEntry_projectId_category_status_idx"
  ON "RfqEvidenceRegisterEntry"("projectId", "category", "status");

CREATE INDEX "RfqEvidenceRegisterEntry_sourceId_idx"
  ON "RfqEvidenceRegisterEntry"("sourceId");

CREATE INDEX "RfqEvidenceRegisterEntry_knowledgeObjectId_idx"
  ON "RfqEvidenceRegisterEntry"("knowledgeObjectId");

ALTER TABLE "RfqEvidenceRegisterEntry"
  ADD CONSTRAINT "RfqEvidenceRegisterEntry_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RfqEvidenceRegisterEntry"
  ADD CONSTRAINT "RfqEvidenceRegisterEntry_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RfqEvidenceRegisterEntry"
  ADD CONSTRAINT "RfqEvidenceRegisterEntry_knowledgeObjectId_fkey"
  FOREIGN KEY ("knowledgeObjectId") REFERENCES "KnowledgeObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
