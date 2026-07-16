"use server";

import { lifecycleStates, missionStatuses, missionTypes, relationshipTypes } from "@kf/core";
import { revalidatePath } from "next/cache";
import {
  acceptRelationshipSuggestion,
  acceptKnowledgeSuggestion,
  addSourceEvidenceToKnowledgeObject,
  assemblePkaPackage,
  attachSourceEvidenceToKnowledgeRelationship,
  createKnowledgeRelationship,
  createFailedIngestionFixture,
  createKnowledgeObject,
  createMission,
  createProject,
  createReviewDecision,
  createSource,
  publishPkaPackage,
  retrySourceIngestion,
  runSourceIngestion,
  updateKnowledgeSuggestionStatus,
  updatePkaPackageReleaseStatus,
  updateKnowledgeRelationshipProvenance,
  updateKnowledgeObject,
  updateKnowledgeObjectStatus,
  updateRelationshipSuggestionStatus,
  updateMissionStatus
} from "./workspace-store";
import { knowledgeObjectTypes, sourceCategories } from "./studio-data";
import type { KnowledgeObjectSummary, MissionSummary, SourceSummary } from "./studio-data";
import type { LifecycleState, MissionStatus, MissionType, RelationshipType } from "@kf/core";

function readRequired(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }
  return value.trim();
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
  revalidatePath("/pka-builder");
  revalidatePath("/pka-builder/export");
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
