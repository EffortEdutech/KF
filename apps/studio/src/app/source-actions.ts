"use server";

import { lifecycleStates, missionStatuses, missionTypes, relationshipTypes } from "@kf/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  acceptRelationshipSuggestion,
  acceptKnowledgeSuggestion,
  addSourceEvidenceToKnowledgeObject,
  assemblePkaPackage,
  attachSourceEvidenceToKnowledgeRelationship,
  createKnowledgeRelationship,
  createInvalidPkaReadbackFixtures,
  createFailedIngestionFixture,
  createKnowledgeObject,
  createManufacturingWorkOrderTrace,
  createMission,
  createProject,
  createReviewDecision,
  createRuntimeHandoffReadbackFixtures,
  createRuntimePkaImportFixtures,
  createSource,
  importRuntimePkaArchive,
  publishPkaPackage,
  recordRuntimeHandoffFeedback,
  recordRuntimePkaImportDecision,
  recordRfqWorkflowGateAction,
  repairSourceArtifact,
  retrySourceIngestion,
  runQsRfqPilotVerticalSlice,
  runSourceIngestion,
  updateKnowledgeSuggestionStatus,
  updatePkaPackageReleaseStatus,
  updateKnowledgeRelationshipProvenance,
  updateKnowledgeRelationshipReleaseExclusion,
  updateKnowledgeObject,
  updateKnowledgeObjectStatus,
  updateRelationshipSuggestionStatus,
  updateRfqEvidenceRegisterEntryStatus,
  updateRfqWorkflowGateAction,
  updateMissionStatus
} from "./workspace-store";
import { knowledgeObjectTypes, sourceCategories } from "./studio-data";
import type { KnowledgeObjectSummary, MissionSummary, RfqEvidenceRegisterEntrySummary, SourceSummary } from "./studio-data";
import type { LifecycleState, MissionStatus, MissionType, RelationshipType } from "@kf/core";
import type { RuntimeHandoffFeedbackDecision } from "./workspace-store";

function readRequired(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function readRuntimeHandoffFeedbackDecision(value: string): RuntimeHandoffFeedbackDecision {
  if (
    value === "provenance_ok_for_pilot" ||
    value === "needs_multi_source_lifecycle" ||
    value === "needs_installation_review_records"
  ) {
    return value;
  }

  return "provenance_ok_for_pilot";
}

function readCategory(value: string): SourceSummary["category"] {
  if (sourceCategories.includes(value as SourceSummary["category"])) {
    return value as SourceSummary["category"];
  }
  return "company_document";
}

function readBoundary(value: string): SourceSummary["boundary"] {
  return value === "client_adaptation_input" ? "client_adaptation_input" : "base_pka_input";
}

function readMissionType(value: string): MissionType {
  if (missionTypes.includes(value as MissionType)) {
    return value as MissionType;
  }
  return "discovery";
}

function readMissionStatus(value: string): MissionStatus {
  if (missionStatuses.includes(value as MissionStatus)) {
    return value as MissionStatus;
  }
  return "created";
}

function readPriority(value: string): MissionSummary["priority"] {
  if (value === "low" || value === "high") {
    return value;
  }
  return "normal";
}

function readKnowledgeObjectType(value: string): KnowledgeObjectSummary["objectType"] {
  if (knowledgeObjectTypes.includes(value as KnowledgeObjectSummary["objectType"])) {
    return value as KnowledgeObjectSummary["objectType"];
  }
  return "concept";
}

function readLifecycleStatus(value: string): LifecycleState {
  if (lifecycleStates.includes(value as LifecycleState)) {
    return value as LifecycleState;
  }
  return "draft";
}

function readGovernanceStatus(value: string): "draft" | "under_review" | "approved" | "deprecated" {
  if (value === "under_review" || value === "approved" || value === "deprecated") {
    return value;
  }
  return "draft";
}

function readRelationshipType(value: string): RelationshipType {
  if (relationshipTypes.includes(value as RelationshipType)) {
    return value as RelationshipType;
  }
  return "supports";
}

function readReviewDecision(value: string): "approved" | "changes_requested" | "rejected" {
  if (value === "approved" || value === "rejected") {
    return value;
  }
  return "changes_requested";
}

function readPackageReleaseStatus(
  value: string
): "under_review" | "changes_requested" | "approved" | "rejected" {
  if (value === "approved" || value === "changes_requested" || value === "rejected") {
    return value;
  }
  return "under_review";
}

function readRfqEvidenceRegisterStatus(
  value: string
): "accepted" | "clarification_required" | "superseded" {
  if (value === "accepted" || value === "superseded") {
    return value;
  }

  return "clarification_required";
}

function readRfqWorkflowGateActionType(
  value: string
): "attach_missing_evidence" | "request_clarification" | "resolve_commercial_exception" {
  if (value === "request_clarification" || value === "resolve_commercial_exception") {
    return value;
  }

  return "attach_missing_evidence";
}

function readRfqWorkflowGateActionStatus(value: string): "open" | "in_progress" | "resolved" | "blocked" {
  if (value === "in_progress" || value === "resolved" || value === "blocked") {
    return value;
  }

  return "open";
}

function readRfqWorkflowGate(value: string): RfqEvidenceRegisterEntrySummary["workflowGate"] {
  if (value === "review" || value === "approve_issue" || value === "clarify" || value === "receive_compare") {
    return value;
  }

  return "prepare";
}

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function revalidateStudioSurfaces() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/missions");
  revalidatePath("/projects");
  revalidatePath("/sources");
  revalidatePath("/knowledge-objects");
  revalidatePath("/review");
  revalidatePath("/pipeline");
  revalidatePath("/manufacturing-line");
  revalidatePath("/rfq-workflow");
  revalidatePath("/pka-builder");
  revalidatePath("/pka-builder/export");
  revalidatePath("/pka-builder/readback");
  revalidatePath("/runtime-import");
  revalidatePath("/runtime-handoff");
  revalidatePath("/runtime-qa");
  revalidatePath("/ontology");
}

function readOptionalNumber(formData: FormData, key: string) {
  const value = readOptionalString(formData, key);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readTags(formData: FormData) {
  return (readOptionalString(formData, "tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function readStringList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export async function createSourceAction(formData: FormData) {
  await createSource({
    projectId: readRequired(formData, "projectId"),
    title: readRequired(formData, "title"),
    category: readCategory(readRequired(formData, "category")),
    domain: readRequired(formData, "domain"),
    owner: readRequired(formData, "owner"),
    version: readRequired(formData, "version"),
    reliability: readRequired(formData, "reliability"),
    usagePolicy: readRequired(formData, "usagePolicy"),
    boundary: readBoundary(readRequired(formData, "boundary")),
    storagePath: formData.get("storagePath")?.toString().trim()
  });

  revalidateStudioSurfaces();
}

export async function runSourceIngestionAction(formData: FormData) {
  await runSourceIngestion({
    sourceId: readRequired(formData, "sourceId"),
    actor: readOptionalString(formData, "actor") ?? "knowledge_engineer"
  });

  revalidateStudioSurfaces();
}

export async function runQsRfqPilotVerticalSliceAction(formData: FormData) {
  const result = await runQsRfqPilotVerticalSlice(readOptionalString(formData, "actor") ?? "knowledge_engineer");

  revalidateStudioSurfaces();
  redirect(`/runtime-qa?projectId=${result.projectId}`);
}

export async function runManufacturingLineValidationAction(formData: FormData) {
  const projectId = readRequired(formData, "projectId");
  const result = await runQsRfqPilotVerticalSlice(readOptionalString(formData, "actor") ?? "knowledge_engineer");

  revalidateStudioSurfaces();
  redirect(`/manufacturing-line?projectId=${projectId || result.projectId}`);
}

export async function createManufacturingWorkOrderTraceAction(formData: FormData) {
  const projectId = readRequired(formData, "projectId");
  await createManufacturingWorkOrderTrace({
    projectId,
    workOrderId: readRequired(formData, "workOrderId"),
    actor: readOptionalString(formData, "actor"),
    status: readMissionStatus(readOptionalString(formData, "status") ?? "queued")
  });

  revalidateStudioSurfaces();
  redirect(`/manufacturing-line?projectId=${projectId}`);
}

export async function retrySourceIngestionAction(formData: FormData) {
  await retrySourceIngestion({
    sourceId: readRequired(formData, "sourceId"),
    actor: readOptionalString(formData, "actor") ?? "knowledge_engineer"
  });

  revalidateStudioSurfaces();
}

export async function createFailedIngestionFixtureAction(formData: FormData) {
  const fixtureType = readOptionalString(formData, "fixtureType");
  await createFailedIngestionFixture({
    sourceId: readRequired(formData, "sourceId"),
    actor: readOptionalString(formData, "actor") ?? "knowledge_engineer",
    fixtureType:
      fixtureType === "unsupported_file" || fixtureType === "empty_artifact"
        ? fixtureType
        : "manual_failure"
  });

  revalidateStudioSurfaces();
}

export async function repairSourceArtifactAction(formData: FormData) {
  await repairSourceArtifact({
    sourceId: readRequired(formData, "sourceId"),
    actor: readOptionalString(formData, "actor") ?? "knowledge_engineer",
    repairText: readOptionalString(formData, "repairText"),
    repairPath: readOptionalString(formData, "repairPath")
  });

  revalidateStudioSurfaces();
}

export async function updateRfqEvidenceRegisterStatusAction(formData: FormData) {
  await updateRfqEvidenceRegisterEntryStatus({
    entryId: readRequired(formData, "entryId"),
    status: readRfqEvidenceRegisterStatus(readRequired(formData, "status")),
    actor: readOptionalString(formData, "actor") ?? "reviewer",
    notes: readOptionalString(formData, "notes")
  });

  revalidateStudioSurfaces();
}

export async function recordRfqWorkflowGateActionAction(formData: FormData) {
  await recordRfqWorkflowGateAction({
    projectId: readRequired(formData, "projectId"),
    gate: readRfqWorkflowGate(readRequired(formData, "gate")),
    actionType: readRfqWorkflowGateActionType(readRequired(formData, "actionType")),
    owner: readRequired(formData, "owner"),
    dueDate: readOptionalString(formData, "dueDate"),
    status: readRfqWorkflowGateActionStatus(readRequired(formData, "status")),
    actor: readOptionalString(formData, "actor") ?? "reviewer",
    notes: readOptionalString(formData, "notes"),
    evidenceEntryIds: readStringList(formData, "evidenceEntryIds")
  });

  revalidateStudioSurfaces();
}

export async function updateRfqWorkflowGateActionAction(formData: FormData) {
  await updateRfqWorkflowGateAction({
    actionId: readRequired(formData, "actionId"),
    status: readRfqWorkflowGateActionStatus(readRequired(formData, "status")),
    owner: readOptionalString(formData, "owner"),
    dueDate: readOptionalString(formData, "dueDate"),
    actor: readOptionalString(formData, "actor") ?? "reviewer",
    notes: readOptionalString(formData, "notes"),
    evidenceEntryIds: readStringList(formData, "evidenceEntryIds")
  });

  revalidateStudioSurfaces();
}

export async function acceptKnowledgeSuggestionAction(formData: FormData) {
  await acceptKnowledgeSuggestion({
    suggestionId: readRequired(formData, "suggestionId"),
    actor: readOptionalString(formData, "actor") ?? "knowledge_engineer"
  });

  revalidateStudioSurfaces();
}

export async function updateKnowledgeSuggestionStatusAction(formData: FormData) {
  const status = readRequired(formData, "status");
  await updateKnowledgeSuggestionStatus({
    suggestionId: readRequired(formData, "suggestionId"),
    status: status === "deferred" ? "deferred" : "rejected",
    actor: readOptionalString(formData, "actor") ?? "reviewer",
    reviewNotes: readOptionalString(formData, "reviewNotes")
  });

  revalidateStudioSurfaces();
}

export async function acceptRelationshipSuggestionAction(formData: FormData) {
  await acceptRelationshipSuggestion({
    relationshipSuggestionId: readRequired(formData, "relationshipSuggestionId"),
    actor: readOptionalString(formData, "actor") ?? "knowledge_engineer"
  });

  revalidateStudioSurfaces();
}

export async function updateRelationshipSuggestionStatusAction(formData: FormData) {
  const status = readRequired(formData, "status");
  await updateRelationshipSuggestionStatus({
    relationshipSuggestionId: readRequired(formData, "relationshipSuggestionId"),
    status: status === "deferred" ? "deferred" : "rejected",
    actor: readOptionalString(formData, "actor") ?? "reviewer",
    reviewNotes: readOptionalString(formData, "reviewNotes")
  });

  revalidateStudioSurfaces();
}

export async function createKnowledgeObjectAction(formData: FormData) {
  await createKnowledgeObject({
    projectId: readRequired(formData, "projectId"),
    title: readRequired(formData, "title"),
    objectType: readKnowledgeObjectType(readRequired(formData, "objectType")),
    domain: readRequired(formData, "domain"),
    description: readRequired(formData, "description"),
    owner: readRequired(formData, "owner"),
    author: readRequired(formData, "author"),
    tags: readTags(formData),
    confidence: readOptionalNumber(formData, "confidence"),
    sourceId: readOptionalString(formData, "sourceId"),
    evidenceExcerpt: readOptionalString(formData, "evidenceExcerpt"),
    evidenceLocator: readOptionalString(formData, "evidenceLocator"),
    evidenceConfidence: readOptionalNumber(formData, "evidenceConfidence")
  });

  revalidateStudioSurfaces();
}

export async function updateKnowledgeObjectAction(formData: FormData) {
  await updateKnowledgeObject({
    id: readRequired(formData, "knowledgeObjectId"),
    title: readRequired(formData, "title"),
    objectType: readKnowledgeObjectType(readRequired(formData, "objectType")),
    domain: readRequired(formData, "domain"),
    description: readRequired(formData, "description"),
    owner: readRequired(formData, "owner"),
    author: readRequired(formData, "author"),
    tags: readTags(formData),
    confidence: readOptionalNumber(formData, "confidence")
  });

  revalidateStudioSurfaces();
}

export async function updateKnowledgeObjectStatusAction(formData: FormData) {
  await updateKnowledgeObjectStatus({
    id: readRequired(formData, "knowledgeObjectId"),
    status: readGovernanceStatus(readLifecycleStatus(readRequired(formData, "status"))),
    reviewer: readOptionalString(formData, "reviewer")
  });

  revalidateStudioSurfaces();
}

export async function reviewKnowledgeObjectAction(formData: FormData) {
  await createReviewDecision({
    knowledgeObjectId: readRequired(formData, "knowledgeObjectId"),
    reviewer: readRequired(formData, "reviewer"),
    decision: readReviewDecision(readRequired(formData, "decision")),
    notes: readOptionalString(formData, "notes")
  });

  revalidateStudioSurfaces();
}

export async function createKnowledgeRelationshipAction(formData: FormData) {
  await createKnowledgeRelationship({
    projectId: readRequired(formData, "projectId"),
    fromId: readRequired(formData, "fromId"),
    toId: readRequired(formData, "toId"),
    type: readRelationshipType(readRequired(formData, "relationshipType")),
    confidence: readOptionalNumber(formData, "relationshipConfidence"),
    provenanceNote: readOptionalString(formData, "provenanceNote")
  });

  revalidateStudioSurfaces();
}

export async function addSourceEvidenceAction(formData: FormData) {
  await addSourceEvidenceToKnowledgeObject({
    knowledgeObjectId: readRequired(formData, "knowledgeObjectId"),
    sourceId: readRequired(formData, "sourceId"),
    excerpt: readOptionalString(formData, "evidenceExcerpt"),
    locator: readOptionalString(formData, "evidenceLocator"),
    confidence: readOptionalNumber(formData, "evidenceConfidence"),
    actor: readOptionalString(formData, "actor") ?? "knowledge_engineer"
  });

  revalidateStudioSurfaces();
}

export async function updateKnowledgeRelationshipProvenanceAction(formData: FormData) {
  await updateKnowledgeRelationshipProvenance({
    relationshipId: readRequired(formData, "relationshipId"),
    provenanceNote: readRequired(formData, "provenanceNote"),
    confidence: readOptionalNumber(formData, "relationshipConfidence"),
    status: readGovernanceStatus(readLifecycleStatus(readRequired(formData, "status"))) as "draft" | "under_review" | "approved",
    actor: readOptionalString(formData, "actor") ?? "knowledge_engineer"
  });

  revalidateStudioSurfaces();
}

export async function attachRelationshipEvidenceAction(formData: FormData) {
  await attachSourceEvidenceToKnowledgeRelationship({
    relationshipId: readRequired(formData, "relationshipId"),
    sourceId: readRequired(formData, "sourceId"),
    excerpt: readOptionalString(formData, "relationshipEvidenceExcerpt"),
    locator: readOptionalString(formData, "relationshipEvidenceLocator"),
    confidence: readOptionalNumber(formData, "relationshipEvidenceConfidence"),
    actor: readOptionalString(formData, "actor") ?? "knowledge_engineer"
  });

  revalidateStudioSurfaces();
}

export async function updateKnowledgeRelationshipReleaseExclusionAction(formData: FormData) {
  await updateKnowledgeRelationshipReleaseExclusion({
    relationshipId: readRequired(formData, "relationshipId"),
    excluded: readRequired(formData, "excluded") === "yes",
    reason: readOptionalString(formData, "releaseExclusionReason"),
    actor: readOptionalString(formData, "actor") ?? "reviewer"
  });

  revalidateStudioSurfaces();
}

export async function assemblePkaPackageAction(formData: FormData) {
  await assemblePkaPackage({
    projectId: readRequired(formData, "projectId"),
    name: readRequired(formData, "name"),
    version: readRequired(formData, "version"),
    publisher: readRequired(formData, "publisher"),
    confirmReplacement: formData.get("confirmReplacement") === "yes"
  });

  revalidateStudioSurfaces();
}

export async function publishPkaPackageAction(formData: FormData) {
  await publishPkaPackage({
    packageRecordId: readRequired(formData, "packageRecordId"),
    actor: readOptionalString(formData, "actor") ?? "publisher",
    notes: readOptionalString(formData, "notes")
  });

  revalidateStudioSurfaces();
}

export async function updatePkaPackageReleaseStatusAction(formData: FormData) {
  const status = readRequired(formData, "status");

  await updatePkaPackageReleaseStatus({
    packageRecordId: readRequired(formData, "packageRecordId"),
    status: readPackageReleaseStatus(status),
    actor: readOptionalString(formData, "actor") ?? (status === "approved" ? "publisher" : "reviewer"),
    notes: readOptionalString(formData, "notes")
  });

  revalidateStudioSurfaces();
}

export async function createInvalidPkaReadbackFixturesAction(formData: FormData) {
  await createInvalidPkaReadbackFixtures(readRequired(formData, "packageId"));

  revalidateStudioSurfaces();
}

export async function createRuntimePkaImportFixturesAction(formData: FormData) {
  await createRuntimePkaImportFixtures(readRequired(formData, "packageId"));

  revalidateStudioSurfaces();
}

export async function createRuntimeHandoffReadbackFixturesAction(formData: FormData) {
  await createRuntimeHandoffReadbackFixtures(readRequired(formData, "packageId"));

  revalidateStudioSurfaces();
}

export async function recordRuntimeHandoffFeedbackAction(formData: FormData) {
  await recordRuntimeHandoffFeedback({
    packageId: readRequired(formData, "packageId"),
    runtimeApp: readRequired(formData, "runtimeApp"),
    decision: readRuntimeHandoffFeedbackDecision(readRequired(formData, "decision")),
    actor: readOptionalString(formData, "actor") ?? "runtime_consumer",
    notes: readOptionalString(formData, "notes")
  });

  revalidateStudioSurfaces();
}

export async function importRuntimePkaArchiveAction(formData: FormData) {
  const packageId = readRequired(formData, "packageId");
  const projectId = readRequired(formData, "projectId");
  const archiveFile = formData.get("archiveFile");

  if (!(archiveFile instanceof File) || archiveFile.size === 0) {
    throw new Error("archiveFile is required");
  }

  if (archiveFile.size > 1024 * 1024) {
    throw new Error("Runtime import archive must be 1 MB or smaller for the local harness.");
  }

  const archivePath = await importRuntimePkaArchive({
    packageId,
    fileName: archiveFile.name,
    contents: await archiveFile.text()
  });

  revalidateStudioSurfaces();
  redirect(
    `/runtime-import?projectId=${projectId}&packageId=${packageId}&archivePath=${encodeURIComponent(archivePath)}`
  );
}

export async function recordRuntimePkaImportDecisionAction(formData: FormData) {
  await recordRuntimePkaImportDecision({
    packageId: readRequired(formData, "packageId"),
    archivePath: readRequired(formData, "archivePath"),
    actor: readOptionalString(formData, "actor") ?? "runtime_consumer"
  });

  revalidateStudioSurfaces();
}

export async function createProjectAction(formData: FormData) {
  await createProject({
    name: readRequired(formData, "name"),
    domain: readRequired(formData, "domain"),
    owner: readRequired(formData, "owner"),
    objective: readRequired(formData, "objective")
  });

  revalidateStudioSurfaces();
}

export async function createMissionAction(formData: FormData) {
  await createMission({
    type: readMissionType(readRequired(formData, "type")),
    title: readRequired(formData, "title"),
    projectId: readRequired(formData, "projectId"),
    assignedTo: readRequired(formData, "assignedTo"),
    stage: readRequired(formData, "stage"),
    priority: readPriority(readRequired(formData, "priority")),
    status: readMissionStatus(readRequired(formData, "status"))
  });

  revalidateStudioSurfaces();
}

export async function updateMissionStatusAction(formData: FormData) {
  await updateMissionStatus(
    readRequired(formData, "missionId"),
    readMissionStatus(readRequired(formData, "status"))
  );

  revalidateStudioSurfaces();
}
