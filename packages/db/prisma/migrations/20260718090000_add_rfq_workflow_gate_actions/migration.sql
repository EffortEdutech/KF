-- Add durable RFQ workflow gate action records for QS/RFQ pilot remediation follow-up.
CREATE TABLE "RfqWorkflowGateAction" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "gate" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'open',
  "notes" TEXT,
  "evidenceEntryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RfqWorkflowGateAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RfqWorkflowGateAction_projectId_gate_status_idx" ON "RfqWorkflowGateAction"("projectId", "gate", "status");
CREATE INDEX "RfqWorkflowGateAction_projectId_owner_idx" ON "RfqWorkflowGateAction"("projectId", "owner");

ALTER TABLE "RfqWorkflowGateAction"
  ADD CONSTRAINT "RfqWorkflowGateAction_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
