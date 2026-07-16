import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { FakeModelProvider } from "@kf/ai";
import type { LifecycleState, MissionStatus, MissionType, RelationshipType, Role } from "@kf/core";
import { relationshipTypes } from "@kf/core";
import { getPrismaClient } from "@kf/db";
import type { PkaComponentManifestEntry } from "@kf/pka";
import { pkaPackageFolders } from "@kf/pka";
import type {
  GovernanceEventSummary,
  KnowledgeSuggestionSummary,
  KnowledgeObjectSummary,
  KnowledgeObjectVersionSnapshotSummary,
  KnowledgeRelationshipSummary,
  MissionSummary,
  ProjectSummary,
  RelationshipSuggestionSummary,
  ReviewSummary,
  SourceChunkSummary,
  SourceEvidenceSummary,
  SourceSummary
} from "./studio-data";
import {
  knowledgeObjectTypes,
  missions as seedMissions,
  projects as seedProjects,
  sources as seedSources,
  workspace
} from "./studio-data";

export type ProjectInput = {
  name: string;
  domain: string;
  owner: string;
  objective: string;
};

export type SourceInput = {
  projectId: string;
  title: string;
  category: SourceSummary["category"];
  domain: string;
  owner: string;
  version: string;
  reliability: string;
  usagePolicy: string;
  boundary: SourceSummary["boundary"];
  storagePath?: string;
};

export type PipelineIngestionInput = {
  sourceId: string;
  actor?: string;
};

export type PipelineIngestionResult = {
  mission: MissionSummary;
  chunks: SourceChunkSummary[];
  suggestions: KnowledgeSuggestionSummary[];
  relationshipSuggestions: RelationshipSuggestionSummary[];
};

export type KnowledgeSuggestionFilter = {
  projectId?: string;
  sourceId?: string;
  status?: KnowledgeSuggestionSummary["status"] | "all";
};

export type AcceptKnowledgeSuggestionInput = {
  suggestionId: string;
  actor?: string;
};

export type KnowledgeSuggestionStatusInput = {
  suggestionId: string;
  status: Extract<KnowledgeSuggestionSummary["status"], "rejected" | "deferred">;
  actor?: string;
  reviewNotes?: string;
};

export type RelationshipSuggestionFilter = {
  projectId?: string;
  sourceId?: string;
  status?: RelationshipSuggestionSummary["status"] | "all";
};

export type AcceptRelationshipSuggestionInput = {
  relationshipSuggestionId: string;
  actor?: string;
};

export type RelationshipSuggestionStatusInput = {
  relationshipSuggestionId: string;
  status: Extract<RelationshipSuggestionSummary["status"], "rejected" | "deferred">;
  actor?: string;
  reviewNotes?: string;
};

export type PipelineRetryInput = {
  sourceId: string;
  actor?: string;
};

export type FailedIngestionFixtureInput = {
  sourceId: string;
  actor?: string;
  fixtureType?: "manual_failure" | "unsupported_file" | "empty_artifact";
};

export type PipelineQualityMetrics = {
  projectId?: string;
  sourceId?: string;
  sourceCount: number;
  chunkCount: number;
  knowledgeSuggestionCount: number;
  relationshipSuggestionCount: number;
  pendingSuggestionCount: number;
  acceptedSuggestionCount: number;
  deferredSuggestionCount: number;
  rejectedSuggestionCount: number;
  failedJobCount: number;
  retriedJobCount: number;
  failedSourceCount: number;
  retriedSourceCount: number;
  acceptanceRate: number;
  deferOrRejectRate: number;
};

export type MissionInput = {
  type: MissionType;
  title: string;
  projectId: string;
  assignedTo: string;
  stage: string;
  priority: MissionSummary["priority"];
  status?: MissionStatus;
};

export type KnowledgeObjectInput = {
  projectId: string;
  title: string;
  objectType: KnowledgeObjectSummary["objectType"];
  domain: string;
  description: string;
  owner: string;
  author: string;
  tags: string[];
  confidence?: number;
  sourceId?: string;
  evidenceExcerpt?: string;
  evidenceLocator?: string;
  evidenceConfidence?: number;
};

export type KnowledgeObjectUpdateInput = {
  id: string;
  title: string;
  objectType: KnowledgeObjectSummary["objectType"];
  domain: string;
  description: string;
  owner: string;
  author: string;
  tags: string[];
  confidence?: number;
};

export type KnowledgeObjectStatusInput = {
  id: string;
  status: Extract<LifecycleState, "draft" | "under_review" | "approved" | "deprecated">;
  reviewer?: string;
};

export type ReviewDecision = Extract<
  LifecycleState,
  "approved" | "changes_requested" | "rejected"
>;

export type ReviewDecisionInput = {
  knowledgeObjectId: string;
  reviewer: string;
  decision: ReviewDecision;
  notes?: string;
};

export type ReviewFilter = {
  knowledgeObjectId?: string;
  projectId?: string;
  decision?: ReviewDecision | "all";
  reviewer?: string;
};

export type KnowledgeRelationshipInput = {
  projectId: string;
  fromId: string;
  toId: string;
  type: RelationshipType;
  confidence?: number;
  provenanceNote?: string;
};

export type SourceEvidenceInput = {
  knowledgeObjectId: string;
  sourceId: string;
  excerpt?: string;
  locator?: string;
  confidence?: number;
  actor?: string;
};

export type KnowledgeRelationshipProvenanceInput = {
  relationshipId: string;
  provenanceNote: string;
  confidence?: number;
  status?: Extract<LifecycleState, "draft" | "under_review" | "approved">;
  actor?: string;
};

export type KnowledgeRelationshipEvidenceInput = {
  relationshipId: string;
  sourceId: string;
  excerpt?: string;
  locator?: string;
  confidence?: number;
  actor?: string;
};

export type PkaPackageSummary = {
  id: string;
  projectId: string;
  packageId: string;
  name: string;
  version: string;
  domain: string;
  status: LifecycleState;
  manifest: Record<string, unknown>;
  exportPath?: string;
  replacementOfPackageId?: string;
  replacementSequence: number;
  publishedAt?: string;
  createdAt: string;
};

export type PkaPackageInput = {
  projectId: string;
  name: string;
  version: string;
  publisher: string;
  confirmReplacement?: boolean;
};

export type PkaPackageReleaseStatusInput = {
  packageRecordId: string;
  status: Extract<LifecycleState, "under_review" | "changes_requested" | "approved" | "rejected">;
  actor: string;
  notes?: string;
};

export type PkaPackagePublishInput = {
  packageRecordId: string;
  actor?: string;
  notes?: string;
};

export type PkaPackageReplacementSummary = {
  packageId: string;
  requiresConfirmation: boolean;
  blockedByPublished: boolean;
  existingPackage?: PkaPackageSummary;
  semanticChanges: string[];
  changedFiles: string[];
  addedFiles: string[];
  removedFiles: string[];
  unchangedFiles: string[];
};

export type PackageValidationItem = {
  id: string;
  level: "ready" | "warning" | "info";
  title: string;
  detail: string;
};

export type PkaManifestPreview = {
  packageId: string;
  name: string;
  version: string;
  domain: string;
  description: string;
  publisher: string;
  governanceStatus: LifecycleState;
  requiredRuntimeCapabilities: string[];
  objectTypes: readonly string[];
  relationshipTypes: readonly string[];
  knowledgeObjectCount: number;
  relationshipCount: number;
  sourceReferenceCount: number;
};

export type PkaExportFile = {
  path: string;
  kind: "json" | "placeholder";
  status: "ready" | "placeholder";
  description: string;
  contents: Record<string, unknown>;
};

export type PkaPackageExportPreview = {
  packageId: string;
  exportRoot: string;
  archivePath: string;
  zipArchivePath: string;
  folders: readonly string[];
  componentIndex: PkaComponentManifestEntry[];
  files: PkaExportFile[];
};

export type PkaPersistedExportFile = {
  path: string;
  size: number;
  updatedAt: string;
};

export type KnowledgeRelationshipFilter = {
  projectId?: string;
  knowledgeObjectId?: string;
  relationshipType?: RelationshipType | "all";
  qualityState?: RelationshipQualityState;
};

export type KnowledgeObjectFilter = {
  projectId?: string;
  status?: KnowledgeObjectSummary["status"] | "all";
  objectType?: KnowledgeObjectSummary["objectType"] | "all";
  query?: string;
};

export type ReadinessHint = {
  id: string;
  level: "ready" | "warning" | "info";
  title: string;
  detail: string;
};

export const releaseBlockerTypes = [
  { id: "all", label: "All blockers" },
  { id: "missing-source-evidence", label: "Missing evidence" },
  { id: "not-approved-for-release", label: "Approval status" },
  { id: "missing-ownership-metadata", label: "Ownership metadata" },
  { id: "missing-tags", label: "Missing tags" },
  { id: "missing-confidence", label: "Missing confidence" },
  { id: "isolated-knowledge-object", label: "Isolated KO" },
  { id: "weak-relationship-confidence", label: "Weak relationship" },
  { id: "missing-relationship-provenance", label: "Relationship provenance" },
  { id: "no-package-knowledge-objects", label: "No package KOs" }
] as const;

export type ReleaseBlockerType = (typeof releaseBlockerTypes)[number]["id"];

export type GovernanceMetrics = {
  totalKnowledgeObjects: number;
  underReviewCount: number;
  changesRequestedCount: number;
  rejectedCount: number;
  approvedCount: number;
  releaseBlockerCount: number;
};

export type RelationshipQualityState =
  | "all"
  | "ready"
  | "needs_review"
  | "weak_confidence"
  | "missing_provenance";

type WorkspaceStore = {
  projects: ProjectSummary[];
  sources: SourceSummary[];
  missions: MissionSummary[];
  sourceChunks: SourceChunkSummary[];
  knowledgeSuggestions: KnowledgeSuggestionSummary[];
  relationshipSuggestions: RelationshipSuggestionSummary[];
  knowledgeObjects: KnowledgeObjectSummary[];
  knowledgeRelationships: KnowledgeRelationshipSummary[];
  auditLogs: GovernanceEventSummary[];
  versionSnapshots: KnowledgeObjectVersionSnapshotSummary[];
  reviews: ReviewSummary[];
  pkaPackages: PkaPackageSummary[];
};

type PrismaProject = {
  id: string;
  name: string;
  domain: string;
  description: string | null;
  status: string;
  createdBy: {
    role: string;
  };
  workspace: {
    name: string;
  };
  _count: {
    sources: number;
    knowledgeObjects: number;
  };
};

type PrismaSource = {
  id: string;
  projectId: string;
  title: string;
  sourceType: string;
  owner: string;
  version: string | null;
  domain: string;
  reliability: string | null;
  reviewStatus: string;
  usagePolicy: string | null;
  storagePath: string | null;
  processingStatus: string;
  metadata: unknown;
  createdAt: Date;
};

type PrismaMission = {
  id: string;
  projectId: string | null;
  type: string;
  status: string;
  objective: string;
  assignedTo: {
    role: string;
  } | null;
  stage: string | null;
  priority: number;
};

type PrismaKnowledgeObject = {
  id: string;
  projectId: string;
  title: string;
  objectType: string;
  domain: string;
  description: string;
  status: string;
  version: string;
  confidence: { toNumber(): number } | number | string | null;
  approvalStatus: string;
  owner: string | null;
  author: string | null;
  contributor: string | null;
  reviewer: string | null;
  tags: string[];
  createdAt: Date;
  evidenceLinks: PrismaSourceEvidence[];
  outgoingRelationships: PrismaKnowledgeRelationship[];
  incomingRelationships: PrismaKnowledgeRelationship[];
};

type PrismaSourceEvidence = {
  id: string;
  sourceId: string;
  excerpt: string | null;
  locator: string | null;
  confidence: { toNumber(): number } | number | string | null;
  source: {
    title: string;
  };
};

type PrismaSourceChunk = {
  id: string;
  projectId: string;
  sourceId: string;
  chunkIndex: number;
  locator: string | null;
  content: string;
  tokenEstimate: number | null;
  createdAt: Date;
  source: {
    title: string;
  };
};

type PrismaKnowledgeSuggestion = {
  id: string;
  projectId: string;
  sourceId: string | null;
  sourceChunkId: string | null;
  title: string;
  objectType: string;
  domain: string;
  description: string;
  confidence: { toNumber(): number } | number | string | null;
  suggestedTags: string[];
  evidenceExcerpt: string | null;
  evidenceLocator: string | null;
  reviewNotes: string | null;
  status: string;
  acceptedKnowledgeObjectId: string | null;
  createdAt: Date;
  source: {
    title: string;
  } | null;
};

type PrismaRelationshipSuggestion = {
  id: string;
  projectId: string;
  sourceId: string | null;
  sourceChunkId: string | null;
  fromSuggestionId: string;
  toSuggestionId: string;
  type: string;
  rationale: string;
  confidence: { toNumber(): number } | number | string | null;
  evidenceExcerpt: string | null;
  evidenceLocator: string | null;
  reviewNotes: string | null;
  status: string;
  acceptedRelationshipId: string | null;
  createdAt: Date;
  source: {
    title: string;
  } | null;
  fromSuggestion: {
    title: string;
    acceptedKnowledgeObjectId: string | null;
  };
  toSuggestion: {
    title: string;
    acceptedKnowledgeObjectId: string | null;
  };
};

type PrismaKnowledgeRelationship = {
  id: string;
  projectId: string;
  fromId: string;
  toId: string;
  type: string;
  status: string;
  provenance: unknown;
  confidence: { toNumber(): number } | number | string | null;
  createdAt: Date;
  from: {
    title: string;
  };
  to: {
    title: string;
  };
};

type PrismaAuditLog = {
  id: string;
  actorId: string | null;
  action: string;
  subjectType: string;
  subjectId: string;
  metadata: unknown;
  createdAt: Date;
};

type PrismaKnowledgeObjectVersion = {
  id: string;
  knowledgeObjectId: string;
  version: string;
  title: string;
  objectType: string;
  domain: string;
  description: string;
  status: string;
  confidence: { toNumber(): number } | number | string | null;
  tags: string[];
  actorId: string | null;
  snapshotReason: string;
  createdAt: Date;
};

type PrismaReview = {
  id: string;
  knowledgeObjectId: string;
  reviewerId: string;
  decision: string;
  notes: string | null;
  createdAt: Date;
  knowledgeObject: {
    projectId: string;
    title: string;
  };
  reviewer: {
    role: string;
  };
};

type PrismaPkaPackage = {
  id: string;
  projectId: string;
  packageId: string;
  name: string;
  version: string;
  domain: string;
  status: string;
  manifest: unknown;
  exportPath: string | null;
  replacementOfPackageId: string | null;
  replacementSequence: number;
  publishedAt: Date | null;
  createdAt: Date;
};

type AuditLogInput = {
  action: string;
  subjectType: string;
  subjectId: string;
  actorId?: string;
  detail: string;
  metadata?: Record<string, unknown>;
};

export type GovernanceHistoryFilter = {
  subjectId?: string;
};

type KnowledgeObjectSnapshotInput = {
  knowledgeObjectId: string;
  version: string;
  title: string;
  objectType: KnowledgeObjectSummary["objectType"];
  domain: string;
  description: string;
  status: LifecycleState;
  confidence?: number;
  tags: string[];
  snapshotReason: string;
  actorId?: string;
};

declare global {
  var kfWorkspaceStore: WorkspaceStore | undefined;
}

const localOrgId = "org-kf-local";
const localWorkspaceId = "ws-foundation";
const userIdsByRole = {
  platform_admin: "user-platform-admin",
  knowledge_architect: "user-knowledge-architect",
  knowledge_engineer: "user-knowledge-engineer",
  domain_expert: "user-domain-expert",
  reviewer: "user-reviewer",
  publisher: "user-publisher",
  runtime_consumer: "user-runtime-consumer"
} as const;

type LocalWorkspaceContext = {
  organizationId: string;
  workspaceId: string;
  userIdByRole: Record<string, string>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
}

function usePrismaStore() {
  return Boolean(process.env.DATABASE_URL);
}

function isLocalDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return false;
  }

  try {
    const parsed = new URL(databaseUrl);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function priorityToNumber(priority: MissionSummary["priority"]) {
  if (priority === "high") {
    return 1;
  }
  if (priority === "low") {
    return 5;
  }
  return 3;
}

function numberToPriority(priority: number): MissionSummary["priority"] {
  if (priority <= 1) {
    return "high";
  }
  if (priority >= 5) {
    return "low";
  }
  return "normal";
}

function metadataBoundary(metadata: unknown): SourceSummary["boundary"] {
  if (
    metadata &&
    typeof metadata === "object" &&
    "boundary" in metadata &&
    metadata.boundary === "client_adaptation_input"
  ) {
    return "client_adaptation_input";
  }
  return "base_pka_input";
}

function decimalToNumber(value: PrismaKnowledgeObject["confidence"]) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return value.toNumber();
}

function normaliseConfidence(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return undefined;
  }

  return Math.min(100, Math.max(0, value));
}

function parseTags(tags: string[]) {
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

function editableKnowledgeObject(status: LifecycleState) {
  return status === "draft" || status === "under_review" || status === "changes_requested";
}

function provenanceRecord(provenance: unknown): Record<string, unknown> {
  return provenance && typeof provenance === "object" && !Array.isArray(provenance)
    ? { ...(provenance as Record<string, unknown>) }
    : {};
}

function provenanceNote(provenance: unknown) {
  const record = provenanceRecord(provenance);
  if (typeof record.note === "string") {
    return record.note;
  }

  return undefined;
}

function relationshipEvidence(provenance: unknown) {
  const evidence = provenanceRecord(provenance).sourceEvidence;

  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    return {};
  }

  const record = evidence as Record<string, unknown>;

  return {
    evidenceSourceId: typeof record.sourceId === "string" ? record.sourceId : undefined,
    evidenceSourceTitle: typeof record.sourceTitle === "string" ? record.sourceTitle : undefined,
    evidenceExcerpt: typeof record.excerpt === "string" ? record.excerpt : undefined,
    evidenceLocator: typeof record.locator === "string" ? record.locator : undefined,
    evidenceConfidence: typeof record.confidence === "number" ? record.confidence : undefined
  };
}

function metadataDetail(metadata: unknown) {
  if (
    metadata &&
    typeof metadata === "object" &&
    "detail" in metadata &&
    typeof metadata.detail === "string"
  ) {
    return metadata.detail;
  }

  return "Governance event recorded.";
}

function metadataString(metadata: unknown, key: string) {
  if (
    metadata &&
    typeof metadata === "object" &&
    key in metadata &&
    typeof metadata[key as keyof typeof metadata] === "string"
  ) {
    return metadata[key as keyof typeof metadata] as string;
  }

  return undefined;
}

function metadataMatchesSubject(metadata: unknown, subjectId: string) {
  if (!metadata || typeof metadata !== "object") {
    return false;
  }

  return Object.values(metadata).some((value) => value === subjectId);
}

function bumpPatchVersion(version: string) {
  const parts = version.split(".").map((part) => Number(part));

  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) {
    return "0.1.1";
  }

  parts[2] += 1;
  return parts.join(".");
}

async function ensureLocalWorkspace(): Promise<LocalWorkspaceContext> {
  if (!usePrismaStore()) {
    return {
      organizationId: localOrgId,
      workspaceId: localWorkspaceId,
      userIdByRole: userIdsByRole
    };
  }

  const prisma = getPrismaClient();

  const organization = await prisma.organization.upsert({
    where: { slug: "kf-local" },
    create: {
      id: localOrgId,
      name: workspace.organisation,
      slug: "kf-local"
    },
    update: {
      name: workspace.organisation
    },
    select: { id: true }
  });

  const workspaceRecord = await prisma.workspace.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "foundation"
      }
    },
    create: {
      id: localWorkspaceId,
      organizationId: organization.id,
      name: workspace.workspace,
      slug: "foundation"
    },
    update: {
      name: workspace.workspace
    },
    select: { id: true }
  });

  const userIdByRole: Record<string, string> = {};

  for (const [role, id] of Object.entries(userIdsByRole)) {
    const user = await prisma.user.upsert({
      where: { email: `${role.replaceAll("_", ".")}@kf.local` },
      create: {
        id,
        organizationId: organization.id,
        workspaceId: workspaceRecord.id,
        email: `${role.replaceAll("_", ".")}@kf.local`,
        displayName: role,
        role: role as keyof typeof userIdsByRole
      },
      update: {
        organizationId: organization.id,
        workspaceId: workspaceRecord.id,
        displayName: role,
        role: role as keyof typeof userIdsByRole
      },
      select: { id: true }
    });

    userIdByRole[role] = user.id;
  }

  for (const project of seedProjects) {
    await prisma.project.upsert({
      where: { id: project.id },
      create: {
        id: project.id,
        workspaceId: workspaceRecord.id,
        createdById: userIdByRole[project.owner] ?? userIdByRole.platform_admin,
        name: project.name,
        domain: project.domain,
        description: project.objective,
        status: project.status
      },
      update: {
        name: project.name,
        domain: project.domain,
        description: project.objective,
        status: project.status
      }
    });
  }

  for (const mission of seedMissions) {
    await prisma.mission.upsert({
      where: { id: mission.id },
      create: {
        id: mission.id,
        workspaceId: workspaceRecord.id,
        projectId: mission.projectId,
        createdById: userIdByRole.platform_admin,
        assignedToId: userIdByRole[mission.assignedTo] ?? userIdByRole.platform_admin,
        type: mission.type,
        status: mission.status,
        objective: mission.title,
        stage: mission.stage,
        priority: priorityToNumber(mission.priority)
      },
      update: {
        projectId: mission.projectId,
        assignedToId: userIdByRole[mission.assignedTo] ?? userIdByRole.platform_admin,
        status: mission.status,
        objective: mission.title,
        stage: mission.stage,
        priority: priorityToNumber(mission.priority)
      }
    });
  }

  for (const source of seedSources) {
    await prisma.source.upsert({
      where: { id: source.id },
      create: {
        id: source.id,
        projectId: source.projectId,
        title: source.title,
        sourceType: source.category,
        owner: source.owner,
        version: source.version,
        domain: source.domain,
        reliability: source.reliability,
        reviewStatus: source.reviewStatus,
        usagePolicy: source.usagePolicy,
        storagePath: source.storagePath,
        processingStatus: source.processingStatus,
        metadata: {
          boundary: source.boundary
        }
      },
      update: {
        title: source.title,
        sourceType: source.category,
        owner: source.owner,
        version: source.version,
        domain: source.domain,
        reliability: source.reliability,
        reviewStatus: source.reviewStatus,
        usagePolicy: source.usagePolicy,
        storagePath: source.storagePath,
        processingStatus: source.processingStatus,
        metadata: {
          boundary: source.boundary
        }
      }
    });
  }

  return {
    organizationId: organization.id,
    workspaceId: workspaceRecord.id,
    userIdByRole
  };
}

function workspaceStore() {
  globalThis.kfWorkspaceStore ??= {
    projects: seedProjects.map((project) => ({ ...project })),
    sources: seedSources.map((source) => ({ ...source })),
    missions: seedMissions.map((mission) => ({ ...mission })),
    sourceChunks: [],
    knowledgeSuggestions: [],
    relationshipSuggestions: [],
    knowledgeObjects: [],
    knowledgeRelationships: [],
    auditLogs: [],
    versionSnapshots: [],
    reviews: [],
    pkaPackages: []
  };

  globalThis.kfWorkspaceStore.missions ??= seedMissions.map((mission) => ({ ...mission }));
  globalThis.kfWorkspaceStore.projects ??= seedProjects.map((project) => ({ ...project }));
  globalThis.kfWorkspaceStore.sources ??= seedSources.map((source) => ({ ...source }));
  globalThis.kfWorkspaceStore.sourceChunks ??= [];
  globalThis.kfWorkspaceStore.knowledgeSuggestions ??= [];
  globalThis.kfWorkspaceStore.relationshipSuggestions ??= [];
  globalThis.kfWorkspaceStore.knowledgeObjects ??= [];
  globalThis.kfWorkspaceStore.knowledgeRelationships ??= [];
  globalThis.kfWorkspaceStore.auditLogs ??= [];
  globalThis.kfWorkspaceStore.versionSnapshots ??= [];
  globalThis.kfWorkspaceStore.reviews ??= [];
  globalThis.kfWorkspaceStore.pkaPackages ??= [];

  return globalThis.kfWorkspaceStore;
}

export function resetWorkspaceStoreForTests() {
  globalThis.kfWorkspaceStore = undefined;
}

export async function resetWorkspaceForRuntimeTests() {
  if (usePrismaStore()) {
    if (process.env.KF_ALLOW_DATABASE_TEST_RESET !== "1" && !isLocalDatabaseUrl()) {
      throw new Error("Database-backed runtime reset requires a local database or KF_ALLOW_DATABASE_TEST_RESET=1.");
    }

    const prisma = getPrismaClient();

    await prisma.review.deleteMany();
    await prisma.knowledgeObjectVersion.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.relationshipSuggestion.deleteMany();
    await prisma.knowledgeRelationship.deleteMany();
    await prisma.sourceEvidence.deleteMany();
    await prisma.knowledgeSuggestion.deleteMany();
    await prisma.sourceChunk.deleteMany();
    await prisma.pkaPackage.deleteMany();
    await prisma.knowledgeObject.deleteMany();
    await prisma.source.deleteMany({
      where: {
        id: {
          notIn: seedSources.map((source) => source.id)
        }
      }
    });
    await prisma.mission.deleteMany({
      where: {
        id: {
          notIn: seedMissions.map((mission) => mission.id)
        }
      }
    });
    await prisma.project.deleteMany({
      where: {
        id: {
          notIn: seedProjects.map((project) => project.id)
        }
      }
    });

    await ensureLocalWorkspace();
    return;
  }

  resetWorkspaceStoreForTests();
}

function mapProject(project: PrismaProject): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    domain: project.domain,
    status: project.status as ProjectSummary["status"],
    owner: project.createdBy.role,
    workspace: project.workspace.name,
    objective: project.description ?? "",
    sourceCount: project._count.sources,
    knowledgeObjectCount: project._count.knowledgeObjects,
    readiness: "Foundation"
  };
}

function mapSource(source: PrismaSource): SourceSummary {
  return {
    id: source.id,
    projectId: source.projectId,
    title: source.title,
    category: source.sourceType as SourceSummary["category"],
    domain: source.domain,
    owner: source.owner,
    version: source.version ?? "0.1",
    reliability: source.reliability ?? "",
    reviewStatus: source.reviewStatus as SourceSummary["reviewStatus"],
    usagePolicy: source.usagePolicy ?? "",
    processingStatus: source.processingStatus as SourceSummary["processingStatus"],
    boundary: metadataBoundary(source.metadata),
    storagePath: source.storagePath ?? undefined,
    createdAt: source.createdAt.toISOString().slice(0, 10)
  };
}

function mapMission(mission: PrismaMission): MissionSummary {
  return {
    id: mission.id,
    type: mission.type as MissionSummary["type"],
    title: mission.objective,
    status: mission.status as MissionSummary["status"],
    projectId: mission.projectId ?? workspace.activeProjectId,
    assignedTo: mission.assignedTo?.role ?? "platform_admin",
    stage: mission.stage ?? "",
    priority: numberToPriority(mission.priority)
  };
}

function mapEvidenceLink(evidence: PrismaSourceEvidence): SourceEvidenceSummary {
  return {
    id: evidence.id,
    sourceId: evidence.sourceId,
    sourceTitle: evidence.source.title,
    excerpt: evidence.excerpt ?? undefined,
    locator: evidence.locator ?? undefined,
    confidence: decimalToNumber(evidence.confidence)
  };
}

function mapSourceChunk(chunk: PrismaSourceChunk): SourceChunkSummary {
  return {
    id: chunk.id,
    projectId: chunk.projectId,
    sourceId: chunk.sourceId,
    sourceTitle: chunk.source.title,
    chunkIndex: chunk.chunkIndex,
    locator: chunk.locator ?? undefined,
    content: chunk.content,
    tokenEstimate: chunk.tokenEstimate ?? undefined,
    createdAt: chunk.createdAt.toISOString().slice(0, 10)
  };
}

function mapKnowledgeSuggestion(suggestion: PrismaKnowledgeSuggestion): KnowledgeSuggestionSummary {
  return {
    id: suggestion.id,
    projectId: suggestion.projectId,
    sourceId: suggestion.sourceId ?? undefined,
    sourceTitle: suggestion.source?.title,
    sourceChunkId: suggestion.sourceChunkId ?? undefined,
    title: suggestion.title,
    objectType: suggestion.objectType as KnowledgeSuggestionSummary["objectType"],
    domain: suggestion.domain,
    description: suggestion.description,
    confidence: decimalToNumber(suggestion.confidence),
    suggestedTags: suggestion.suggestedTags,
    evidenceExcerpt: suggestion.evidenceExcerpt ?? undefined,
    evidenceLocator: suggestion.evidenceLocator ?? undefined,
    reviewNotes: suggestion.reviewNotes ?? undefined,
    status: suggestion.status as KnowledgeSuggestionSummary["status"],
    acceptedKnowledgeObjectId: suggestion.acceptedKnowledgeObjectId ?? undefined,
    createdAt: suggestion.createdAt.toISOString().slice(0, 10)
  };
}

function mapRelationshipSuggestion(suggestion: PrismaRelationshipSuggestion): RelationshipSuggestionSummary {
  return {
    id: suggestion.id,
    projectId: suggestion.projectId,
    sourceId: suggestion.sourceId ?? undefined,
    sourceTitle: suggestion.source?.title,
    sourceChunkId: suggestion.sourceChunkId ?? undefined,
    fromSuggestionId: suggestion.fromSuggestionId,
    fromSuggestionTitle: suggestion.fromSuggestion.title,
    fromAcceptedKnowledgeObjectId: suggestion.fromSuggestion.acceptedKnowledgeObjectId ?? undefined,
    toSuggestionId: suggestion.toSuggestionId,
    toSuggestionTitle: suggestion.toSuggestion.title,
    toAcceptedKnowledgeObjectId: suggestion.toSuggestion.acceptedKnowledgeObjectId ?? undefined,
    type: suggestion.type as RelationshipType,
    rationale: suggestion.rationale,
    confidence: decimalToNumber(suggestion.confidence),
    evidenceExcerpt: suggestion.evidenceExcerpt ?? undefined,
    evidenceLocator: suggestion.evidenceLocator ?? undefined,
    reviewNotes: suggestion.reviewNotes ?? undefined,
    status: suggestion.status as RelationshipSuggestionSummary["status"],
    acceptedRelationshipId: suggestion.acceptedRelationshipId ?? undefined,
    createdAt: suggestion.createdAt.toISOString().slice(0, 10)
  };
}

function mapKnowledgeRelationship(relationship: PrismaKnowledgeRelationship): KnowledgeRelationshipSummary {
  const evidence = relationshipEvidence(relationship.provenance);

  return {
    id: relationship.id,
    projectId: relationship.projectId,
    fromId: relationship.fromId,
    fromTitle: relationship.from.title,
    toId: relationship.toId,
    toTitle: relationship.to.title,
    type: relationship.type as RelationshipType,
    status: relationship.status as LifecycleState,
    confidence: decimalToNumber(relationship.confidence),
    provenanceNote: provenanceNote(relationship.provenance),
    ...evidence,
    createdAt: relationship.createdAt.toISOString().slice(0, 10)
  };
}

function mapAuditLog(auditLog: PrismaAuditLog): GovernanceEventSummary {
  return {
    id: auditLog.id,
    actorId: auditLog.actorId ?? undefined,
    action: auditLog.action,
    subjectType: auditLog.subjectType,
    subjectId: auditLog.subjectId,
    detail: metadataDetail(auditLog.metadata),
    createdAt: auditLog.createdAt.toISOString().slice(0, 10)
  };
}

function mapVersionSnapshot(auditLog: PrismaAuditLog): KnowledgeObjectVersionSnapshotSummary {
  return {
    id: auditLog.id,
    knowledgeObjectId: metadataString(auditLog.metadata, "knowledgeObjectId") ?? auditLog.subjectId,
    version: metadataString(auditLog.metadata, "version") ?? "unknown",
    title: metadataString(auditLog.metadata, "title") ?? "Untitled Knowledge Object snapshot",
    objectType: (metadataString(auditLog.metadata, "objectType") ?? "concept") as KnowledgeObjectSummary["objectType"],
    domain: metadataString(auditLog.metadata, "domain") ?? "unknown",
    description: metadataString(auditLog.metadata, "description") ?? "",
    status: (metadataString(auditLog.metadata, "status") ?? "draft") as LifecycleState,
    confidence: undefined,
    tags: [],
    snapshotReason: metadataString(auditLog.metadata, "snapshotReason") ?? "audit-backed snapshot",
    actorId: auditLog.actorId ?? undefined,
    createdAt: auditLog.createdAt.toISOString().slice(0, 10)
  };
}

function mapKnowledgeObjectVersion(
  version: PrismaKnowledgeObjectVersion
): KnowledgeObjectVersionSnapshotSummary {
  return {
    id: version.id,
    knowledgeObjectId: version.knowledgeObjectId,
    version: version.version,
    title: version.title,
    objectType: version.objectType as KnowledgeObjectSummary["objectType"],
    domain: version.domain,
    description: version.description,
    status: version.status as LifecycleState,
    confidence: decimalToNumber(version.confidence),
    tags: version.tags,
    snapshotReason: version.snapshotReason,
    actorId: version.actorId ?? undefined,
    createdAt: version.createdAt.toISOString().slice(0, 10)
  };
}

function mapReview(review: PrismaReview): ReviewSummary {
  return {
    id: review.id,
    knowledgeObjectId: review.knowledgeObjectId,
    knowledgeObjectTitle: review.knowledgeObject.title,
    reviewerId: review.reviewerId,
    reviewerRole: review.reviewer.role,
    decision: review.decision as LifecycleState,
    notes: review.notes ?? undefined,
    createdAt: review.createdAt.toISOString().slice(0, 10)
  };
}

function mapPkaPackage(pkaPackage: PrismaPkaPackage): PkaPackageSummary {
  return {
    id: pkaPackage.id,
    projectId: pkaPackage.projectId,
    packageId: pkaPackage.packageId,
    name: pkaPackage.name,
    version: pkaPackage.version,
    domain: pkaPackage.domain,
    status: pkaPackage.status as LifecycleState,
    manifest:
      pkaPackage.manifest && typeof pkaPackage.manifest === "object"
        ? (pkaPackage.manifest as Record<string, unknown>)
        : {},
    exportPath: pkaPackage.exportPath ?? undefined,
    replacementOfPackageId: pkaPackage.replacementOfPackageId ?? undefined,
    replacementSequence: pkaPackage.replacementSequence,
    publishedAt: pkaPackage.publishedAt?.toISOString().slice(0, 10),
    createdAt: pkaPackage.createdAt.toISOString().slice(0, 10)
  };
}

function mapKnowledgeObject(knowledgeObject: PrismaKnowledgeObject): KnowledgeObjectSummary {
  return {
    id: knowledgeObject.id,
    projectId: knowledgeObject.projectId,
    title: knowledgeObject.title,
    objectType: knowledgeObject.objectType as KnowledgeObjectSummary["objectType"],
    domain: knowledgeObject.domain,
    description: knowledgeObject.description,
    status: knowledgeObject.status as KnowledgeObjectSummary["status"],
    version: knowledgeObject.version,
    confidence: decimalToNumber(knowledgeObject.confidence),
    approvalStatus: knowledgeObject.approvalStatus as KnowledgeObjectSummary["approvalStatus"],
    owner: knowledgeObject.owner ?? undefined,
    author: knowledgeObject.author ?? undefined,
    contributor: knowledgeObject.contributor ?? undefined,
    reviewer: knowledgeObject.reviewer ?? undefined,
    tags: knowledgeObject.tags,
    evidenceLinks: knowledgeObject.evidenceLinks.map(mapEvidenceLink),
    outgoingRelationships: knowledgeObject.outgoingRelationships.map(mapKnowledgeRelationship),
    incomingRelationships: knowledgeObject.incomingRelationships.map(mapKnowledgeRelationship),
    createdAt: knowledgeObject.createdAt.toISOString().slice(0, 10)
  };
}

function filterKnowledgeObjects(
  knowledgeObjects: KnowledgeObjectSummary[],
  filters: KnowledgeObjectFilter = {}
) {
  const query = filters.query?.trim().toLowerCase();

  return knowledgeObjects.filter((knowledgeObject) => {
    if (filters.projectId && knowledgeObject.projectId !== filters.projectId) {
      return false;
    }

    if (filters.status && filters.status !== "all" && knowledgeObject.status !== filters.status) {
      return false;
    }

    if (
      filters.objectType &&
      filters.objectType !== "all" &&
      knowledgeObject.objectType !== filters.objectType
    ) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      knowledgeObject.title,
      knowledgeObject.description,
      knowledgeObject.domain,
      knowledgeObject.objectType,
      knowledgeObject.tags.join(" ")
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

function relationshipMatchesQuality(
  relationship: KnowledgeRelationshipSummary,
  qualityState: RelationshipQualityState = "all"
) {
  if (qualityState === "all") {
    return true;
  }

  const hasUsableConfidence = relationship.confidence !== undefined && relationship.confidence >= 50;
  const hasProvenance = Boolean(relationship.provenanceNote?.trim());

  if (qualityState === "ready") {
    return relationship.status === "approved" && hasUsableConfidence && hasProvenance;
  }

  if (qualityState === "needs_review") {
    return relationship.status !== "approved";
  }

  if (qualityState === "weak_confidence") {
    return !hasUsableConfidence;
  }

  return !hasProvenance;
}

function filterKnowledgeRelationships(
  relationships: KnowledgeRelationshipSummary[],
  filters: KnowledgeRelationshipFilter = {}
) {
  return relationships.filter((relationship) => {
    if (filters.projectId && relationship.projectId !== filters.projectId) {
      return false;
    }

    if (
      filters.knowledgeObjectId &&
      relationship.fromId !== filters.knowledgeObjectId &&
      relationship.toId !== filters.knowledgeObjectId
    ) {
      return false;
    }

    if (
      filters.relationshipType &&
      filters.relationshipType !== "all" &&
      relationship.type !== filters.relationshipType
    ) {
      return false;
    }

    return relationshipMatchesQuality(relationship, filters.qualityState);
  });
}

function filterKnowledgeSuggestions(
  suggestions: KnowledgeSuggestionSummary[],
  filters: KnowledgeSuggestionFilter = {}
) {
  return suggestions.filter((suggestion) => {
    if (filters.projectId && suggestion.projectId !== filters.projectId) {
      return false;
    }

    if (filters.sourceId && suggestion.sourceId !== filters.sourceId) {
      return false;
    }

    if (filters.status && filters.status !== "all" && suggestion.status !== filters.status) {
      return false;
    }

    return true;
  });
}

function filterRelationshipSuggestions(
  suggestions: RelationshipSuggestionSummary[],
  filters: RelationshipSuggestionFilter = {}
) {
  return suggestions.filter((suggestion) => {
    if (filters.projectId && suggestion.projectId !== filters.projectId) {
      return false;
    }

    if (filters.sourceId && suggestion.sourceId !== filters.sourceId) {
      return false;
    }

    if (filters.status && filters.status !== "all" && suggestion.status !== filters.status) {
      return false;
    }

    return true;
  });
}

function sourceTextForIngestion(source: SourceSummary) {
  return [
    `${source.title} is a ${source.category} source for ${source.domain}.`,
    `Reliability is ${source.reliability || "not yet assessed"} and usage policy is ${source.usagePolicy || "not specified"}.`,
    "Knowledge Factory should extract governed concepts, rules, procedures, checklist items, templates, and source-backed review notes.",
    source.boundary === "client_adaptation_input"
      ? "This source is marked as client adaptation input and must not be treated as reusable Base PKA knowledge without review."
      : "This source is marked as a Base PKA input and can propose reusable professional knowledge after review."
  ].join("\n");
}

function safeWorkspacePath(path: string) {
  const cwd = process.cwd();
  const workspaceRoot = cwd.endsWith(`${"apps"}\\studio`) || cwd.endsWith("apps/studio")
    ? resolve(cwd, "..", "..")
    : cwd;
  const resolved = resolve(workspaceRoot, path);
  return resolved.startsWith(workspaceRoot) ? resolved : undefined;
}

async function readTextArtifact(path: string): Promise<string | undefined> {
  const resolved = safeWorkspacePath(path);

  if (!resolved) {
    return undefined;
  }

  const extension = extname(resolved).toLowerCase();
  if (extension && extension !== ".md" && extension !== ".txt") {
    return undefined;
  }

  try {
    const artifactStat = await stat(resolved);
    if (artifactStat.isFile()) {
      return extension === ".md" || extension === ".txt" ? readFile(resolved, "utf8") : undefined;
    }

    if (artifactStat.isDirectory()) {
      const entries = await readdir(resolved);
      const textEntry = entries.find((entry) => {
        const entryExtension = extname(entry).toLowerCase();
        return entryExtension === ".md" || entryExtension === ".txt";
      });

      return textEntry ? readFile(resolve(resolved, textEntry), "utf8") : undefined;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

type SourceExtractionResult =
  | { ok: true; text: string; mode: "artifact" | "metadata_fallback" }
  | { ok: false; reason: "unsupported_artifact_type" | "empty_artifact"; detail: string };

async function extractSourceText(source: SourceSummary): Promise<SourceExtractionResult> {
  if (!source.storagePath || source.storagePath.includes(".env")) {
    return { ok: true, text: sourceTextForIngestion(source), mode: "metadata_fallback" };
  }

  const resolved = safeWorkspacePath(source.storagePath);

  if (!resolved) {
    return { ok: true, text: sourceTextForIngestion(source), mode: "metadata_fallback" };
  }

  const extension = extname(resolved).toLowerCase();

  try {
    const artifactStat = await stat(resolved);

    if (artifactStat.isFile()) {
      if (extension && extension !== ".md" && extension !== ".txt") {
        return {
          ok: false,
          reason: "unsupported_artifact_type",
          detail: `Unsupported source artifact type for ${source.title}: ${extension || "unknown"}`
        };
      }

      const artifactText = await readTextArtifact(source.storagePath);

      if (!artifactText?.trim()) {
        return {
          ok: false,
          reason: "empty_artifact",
          detail: `Source artifact is empty for ${source.title}.`
        };
      }

      return {
        ok: true,
        mode: "artifact",
        text: [`Source artifact: ${source.title}`, `Domain: ${source.domain}`, artifactText.trim()].join("\n\n")
      };
    }

    if (artifactStat.isDirectory()) {
      const artifactText = await readTextArtifact(source.storagePath);

      if (!artifactText?.trim()) {
        return { ok: true, text: sourceTextForIngestion(source), mode: "metadata_fallback" };
      }

      return {
        ok: true,
        mode: "artifact",
        text: [`Source artifact: ${source.title}`, `Domain: ${source.domain}`, artifactText.trim()].join("\n\n")
      };
    }
  } catch {
    return { ok: true, text: sourceTextForIngestion(source), mode: "metadata_fallback" };
  }

  return { ok: true, text: sourceTextForIngestion(source), mode: "metadata_fallback" };
}

function chunkSourceText(content: string, maxLength = 260) {
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > maxLength && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [content.slice(0, maxLength)];
}

function objectTypeForChunk(index: number): KnowledgeSuggestionSummary["objectType"] {
  const types: KnowledgeSuggestionSummary["objectType"][] = ["concept", "rule", "procedure", "checklist_item"];
  return types[index % types.length];
}

function suggestionTitleForChunk(source: SourceSummary, objectType: KnowledgeSuggestionSummary["objectType"], index: number) {
  const label = objectType.replaceAll("_", " ");
  return `${source.title} ${label} ${index + 1}`;
}

async function buildSuggestionFromChunk(source: SourceSummary, chunk: SourceChunkSummary) {
  const provider = new FakeModelProvider();
  const objectType = objectTypeForChunk(chunk.chunkIndex);
  const title = suggestionTitleForChunk(source, objectType, chunk.chunkIndex);
  const response = await provider.generate({
    capability: "drafting",
    prompt: `Suggest a ${objectType} Knowledge Object from ${source.title}`,
    context: chunk.content
  });

  return {
    title,
    objectType,
    domain: source.domain,
    description: `${response.content}. Source-backed draft: ${chunk.content}`,
    confidence: normaliseConfidence(62 + chunk.chunkIndex * 7),
    suggestedTags: [
      "pipeline-suggestion",
      slugify(source.domain),
      slugify(source.category),
      objectType
    ],
    evidenceExcerpt: chunk.content,
    evidenceLocator: chunk.locator,
    reviewNotes: response.uncertainty ?? "Deterministic suggestion requires human review."
  };
}

async function buildRelationshipSuggestionFromSuggestions(
  source: SourceSummary,
  fromSuggestion: KnowledgeSuggestionSummary,
  toSuggestion: KnowledgeSuggestionSummary
) {
  const provider = new FakeModelProvider();
  const response = await provider.generate({
    capability: "relationship_suggestion",
    prompt: `Suggest a relationship between ${fromSuggestion.title} and ${toSuggestion.title}`,
    context: `${fromSuggestion.evidenceExcerpt ?? fromSuggestion.description}\n${toSuggestion.evidenceExcerpt ?? toSuggestion.description}`
  });

  return {
    type: "supports" as RelationshipType,
    rationale: `${response.content}. ${fromSuggestion.title} supports ${toSuggestion.title} because both were extracted from ${source.title}.`,
    confidence: normaliseConfidence(58),
    evidenceExcerpt: fromSuggestion.evidenceExcerpt ?? toSuggestion.evidenceExcerpt,
    evidenceLocator: fromSuggestion.evidenceLocator ?? toSuggestion.evidenceLocator,
    reviewNotes: "Deterministic relationship suggestion requires human review before becoming a graph edge."
  };
}

function approvedSource(source: SourceSummary) {
  return ["expert_validated", "approved", "published"].includes(source.reviewStatus);
}

export function getSourceReadinessHints(source: SourceSummary): ReadinessHint[] {
  const hints: ReadinessHint[] = [];

  if (!source.storagePath) {
    hints.push({
      id: "missing-storage-reference",
      level: "warning",
      title: "Storage reference missing",
      detail: "Add a source artifact path before extraction or evidence linking begins."
    });
  }

  if (!approvedSource(source)) {
    hints.push({
      id: "source-not-approved",
      level: "warning",
      title: "Governance review pending",
      detail: "This source can support draft work, but approved PKA release should wait for review."
    });
  }

  if (!source.usagePolicy.trim()) {
    hints.push({
      id: "missing-usage-policy",
      level: "warning",
      title: "Usage policy missing",
      detail: "Confirm licensing and reuse limits before manufacturing reusable knowledge."
    });
  }

  if (source.boundary === "client_adaptation_input") {
    hints.push({
      id: "client-adaptation-boundary",
      level: "info",
      title: "Runtime/client adaptation input",
      detail: "Keep this separate from Base PKA manufacturing unless it is promoted by governance."
    });
  }

  if (hints.length === 0) {
    hints.push({
      id: "source-ready",
      level: "ready",
      title: "Source intake ready",
      detail: "Metadata, usage policy, artifact reference, and review status are ready for Sprint 2 evidence work."
    });
  }

  return hints;
}

export async function getProjectReadinessHints(project: ProjectSummary): Promise<ReadinessHint[]> {
  const projectSources = await listSourcesByProject(project.id);
  const hints: ReadinessHint[] = [];

  if (projectSources.length === 0) {
    hints.push({
      id: "no-sources",
      level: "warning",
      title: "No sources registered",
      detail: "Register at least one trusted source before creating governed Knowledge Objects."
    });
  }

  if (projectSources.length > 0 && !projectSources.some(approvedSource)) {
    hints.push({
      id: "no-approved-sources",
      level: "warning",
      title: "Source approval pending",
      detail: "Draft Knowledge Objects can start, but release readiness needs approved or expert-validated sources."
    });
  }

  if (project.knowledgeObjectCount === 0) {
    hints.push({
      id: "no-knowledge-objects",
      level: "info",
      title: "Knowledge Objects not started",
      detail: "Sprint 2 will add the repository for creating source-backed Knowledge Object drafts."
    });
  }

  if (hints.length === 0) {
    hints.push({
      id: "project-ready",
      level: "ready",
      title: "Project ready for repository work",
      detail: "Source intake and first Knowledge Objects are present for the next governance checks."
    });
  }

  return hints;
}

export async function listProjects() {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const projects = await getPrismaClient().project.findMany({
      include: {
        createdBy: { select: { role: true } },
        workspace: { select: { name: true } },
        _count: { select: { sources: true, knowledgeObjects: true } }
      },
      orderBy: { updatedAt: "desc" }
    });
    return projects.map(mapProject);
  }

  return [...workspaceStore().projects];
}

export async function listSources() {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const sources = await getPrismaClient().source.findMany({
      orderBy: { updatedAt: "desc" }
    });
    return sources.map(mapSource);
  }

  return [...workspaceStore().sources];
}

export async function listSourcesByProject(projectId: string) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const sources = await getPrismaClient().source.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" }
    });
    return sources.map(mapSource);
  }

  return workspaceStore().sources.filter((source) => source.projectId === projectId);
}

export async function listSourceChunks(filters: { projectId?: string; sourceId?: string } = {}) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const chunks = await getPrismaClient().sourceChunk.findMany({
      where: {
        projectId: filters.projectId,
        sourceId: filters.sourceId
      },
      include: {
        source: { select: { title: true } }
      },
      orderBy: [{ sourceId: "asc" }, { chunkIndex: "asc" }]
    });
    return chunks.map(mapSourceChunk);
  }

  return workspaceStore()
    .sourceChunks.filter((chunk) => {
      if (filters.projectId && chunk.projectId !== filters.projectId) {
        return false;
      }
      if (filters.sourceId && chunk.sourceId !== filters.sourceId) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.chunkIndex - b.chunkIndex);
}

export async function listKnowledgeSuggestions(filters: KnowledgeSuggestionFilter = {}) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const suggestions = await getPrismaClient().knowledgeSuggestion.findMany({
      where: {
        projectId: filters.projectId,
        sourceId: filters.sourceId,
        status: filters.status && filters.status !== "all" ? filters.status : undefined
      },
      include: {
        source: { select: { title: true } }
      },
      orderBy: { updatedAt: "desc" }
    });
    return suggestions.map(mapKnowledgeSuggestion);
  }

  return filterKnowledgeSuggestions(workspaceStore().knowledgeSuggestions, filters);
}

export async function listRelationshipSuggestions(filters: RelationshipSuggestionFilter = {}) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const suggestions = await getPrismaClient().relationshipSuggestion.findMany({
      where: {
        projectId: filters.projectId,
        sourceId: filters.sourceId,
        status: filters.status && filters.status !== "all" ? filters.status : undefined
      },
      include: {
        source: { select: { title: true } },
        fromSuggestion: { select: { title: true, acceptedKnowledgeObjectId: true } },
        toSuggestion: { select: { title: true, acceptedKnowledgeObjectId: true } }
      },
      orderBy: { updatedAt: "desc" }
    });
    return suggestions.map(mapRelationshipSuggestion);
  }

  return filterRelationshipSuggestions(workspaceStore().relationshipSuggestions, filters);
}

export async function getPipelineQualityMetrics(filters: { projectId?: string; sourceId?: string } = {}) {
  const [sources, chunks, knowledgeSuggestions, relationshipSuggestions, missions] = await Promise.all([
    filters.projectId ? listSourcesByProject(filters.projectId) : listSources(),
    listSourceChunks(filters),
    listKnowledgeSuggestions({ ...filters, status: "all" }),
    listRelationshipSuggestions({ ...filters, status: "all" }),
    listMissions()
  ]);
  const filteredSources = filters.sourceId
    ? sources.filter((source) => source.id === filters.sourceId)
    : sources;
  const filteredMissions = missions.filter((mission) => {
    if (mission.stage !== "pipeline-ingestion") {
      return false;
    }

    if (filters.projectId && mission.projectId !== filters.projectId) {
      return false;
    }

    return true;
  });
  const pendingSuggestionCount =
    knowledgeSuggestions.filter((suggestion) => suggestion.status === "pending").length +
    relationshipSuggestions.filter((suggestion) => suggestion.status === "pending").length;
  const acceptedSuggestionCount =
    knowledgeSuggestions.filter((suggestion) => suggestion.status === "accepted").length +
    relationshipSuggestions.filter((suggestion) => suggestion.status === "accepted").length;
  const deferredSuggestionCount =
    knowledgeSuggestions.filter((suggestion) => suggestion.status === "deferred").length +
    relationshipSuggestions.filter((suggestion) => suggestion.status === "deferred").length;
  const rejectedSuggestionCount =
    knowledgeSuggestions.filter((suggestion) => suggestion.status === "rejected").length +
    relationshipSuggestions.filter((suggestion) => suggestion.status === "rejected").length;
  const totalSuggestionCount = knowledgeSuggestions.length + relationshipSuggestions.length;

  return {
    projectId: filters.projectId,
    sourceId: filters.sourceId,
    sourceCount: filteredSources.length,
    chunkCount: chunks.length,
    knowledgeSuggestionCount: knowledgeSuggestions.length,
    relationshipSuggestionCount: relationshipSuggestions.length,
    pendingSuggestionCount,
    acceptedSuggestionCount,
    deferredSuggestionCount,
    rejectedSuggestionCount,
    failedJobCount: filteredMissions.filter((mission) => mission.status === "failed").length,
    retriedJobCount: filteredMissions.filter((mission) => mission.status === "retried").length,
    failedSourceCount: filteredSources.filter((source) => source.processingStatus === "failed").length,
    retriedSourceCount: filteredSources.filter((source) => source.processingStatus === "retried").length,
    acceptanceRate: totalSuggestionCount > 0 ? Math.round((acceptedSuggestionCount / totalSuggestionCount) * 100) : 0,
    deferOrRejectRate:
      totalSuggestionCount > 0
        ? Math.round(((deferredSuggestionCount + rejectedSuggestionCount) / totalSuggestionCount) * 100)
        : 0
  } satisfies PipelineQualityMetrics;
}

export async function listMissions() {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const missions = await getPrismaClient().mission.findMany({
      include: {
        assignedTo: { select: { role: true } }
      },
      orderBy: { updatedAt: "desc" }
    });
    return missions.map(mapMission);
  }

  return [...workspaceStore().missions];
}

export async function listKnowledgeObjects(filters: KnowledgeObjectFilter = {}) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const query = filters.query?.trim();
    const knowledgeObjects = await getPrismaClient().knowledgeObject.findMany({
      where: {
        projectId: filters.projectId,
        status: filters.status && filters.status !== "all" ? filters.status : undefined,
        objectType: filters.objectType && filters.objectType !== "all" ? filters.objectType : undefined,
        OR: query
          ? [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { domain: { contains: query, mode: "insensitive" } },
              { tags: { has: query } }
            ]
          : undefined
      },
      include: {
        evidenceLinks: {
          include: {
            source: { select: { title: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        outgoingRelationships: {
          include: {
            from: { select: { title: true } },
            to: { select: { title: true } }
          },
          orderBy: { updatedAt: "desc" }
        },
        incomingRelationships: {
          include: {
            from: { select: { title: true } },
            to: { select: { title: true } }
          },
          orderBy: { updatedAt: "desc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return knowledgeObjects.map(mapKnowledgeObject);
  }

  return filterKnowledgeObjects([...workspaceStore().knowledgeObjects], filters);
}

export async function getKnowledgeObject(id: string) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const knowledgeObject = await getPrismaClient().knowledgeObject.findUnique({
      where: { id },
      include: {
        evidenceLinks: {
          include: {
            source: { select: { title: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        outgoingRelationships: {
          include: {
            from: { select: { title: true } },
            to: { select: { title: true } }
          },
          orderBy: { updatedAt: "desc" }
        },
        incomingRelationships: {
          include: {
            from: { select: { title: true } },
            to: { select: { title: true } }
          },
          orderBy: { updatedAt: "desc" }
        }
      }
    });

    return knowledgeObject ? mapKnowledgeObject(knowledgeObject) : undefined;
  }

  return workspaceStore().knowledgeObjects.find((knowledgeObject) => knowledgeObject.id === id);
}

export async function listKnowledgeRelationships(filters: KnowledgeRelationshipFilter = {}) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const relationships = await getPrismaClient().knowledgeRelationship.findMany({
      where: {
        projectId: filters.projectId,
        type:
          filters.relationshipType && filters.relationshipType !== "all"
            ? filters.relationshipType
            : undefined,
        OR: filters.knowledgeObjectId
          ? [{ fromId: filters.knowledgeObjectId }, { toId: filters.knowledgeObjectId }]
          : undefined
      },
      include: {
        from: { select: { title: true } },
        to: { select: { title: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    return filterKnowledgeRelationships(relationships.map(mapKnowledgeRelationship), {
      qualityState: filters.qualityState
    });
  }

  return filterKnowledgeRelationships(workspaceStore().knowledgeRelationships, filters);
}

export async function listPkaPackages(projectId?: string) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const packages = await getPrismaClient().pkaPackage.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      take: 10
    });

    return packages.map(mapPkaPackage);
  }

  return workspaceStore().pkaPackages.filter((pkaPackage) =>
    projectId ? pkaPackage.projectId === projectId : true
  );
}

export async function listRelationshipGovernanceHistory(relationshipId: string) {
  return listGovernanceHistory({ subjectId: relationshipId });
}

export async function getPkaManifestPreview(projectId: string): Promise<PkaManifestPreview | undefined> {
  const exportPreview = await buildPkaPackageExportPreview({ projectId });
  const manifest = exportPreview?.files.find((file) => file.path === "manifest.json")?.contents;

  return manifest as PkaManifestPreview | undefined;
}

function packageComponentIndex(input: {
  packageId: string;
  version: string;
  releaseObjects: KnowledgeObjectSummary[];
  relationships: KnowledgeRelationshipSummary[];
  sources: SourceSummary[];
}): PkaComponentManifestEntry[] {
  return [
    {
      id: `${input.packageId}-knowledge-objects`,
      kind: "knowledge_object",
      path: "knowledge-objects/index.json",
      version: input.version,
      governanceStatus: input.releaseObjects.length > 0 ? "approved" : "draft",
      sourceRefs: input.releaseObjects.flatMap((knowledgeObject) =>
        knowledgeObject.evidenceLinks.map((evidence) => evidence.sourceId)
      )
    },
    {
      id: `${input.packageId}-ontology`,
      kind: "ontology",
      path: "ontology/index.json",
      version: input.version,
      governanceStatus: "draft",
      sourceRefs: []
    },
    {
      id: `${input.packageId}-graph`,
      kind: "relationship_graph",
      path: "graph/relationships.json",
      version: input.version,
      governanceStatus: input.relationships.every((relationship) => relationship.status === "approved")
        ? "approved"
        : "draft",
      sourceRefs: input.relationships.flatMap((relationship) =>
        relationship.evidenceSourceId ? [relationship.evidenceSourceId] : []
      )
    },
    {
      id: `${input.packageId}-sources`,
      kind: "source_reference_index",
      path: "sources/index.json",
      version: input.version,
      governanceStatus: input.sources.length > 0 ? "draft" : "draft",
      sourceRefs: input.sources.map((source) => source.id)
    },
    {
      id: `${input.packageId}-runtime`,
      kind: "runtime_configuration",
      path: "runtime/config.json",
      version: input.version,
      governanceStatus: "placeholder",
      sourceRefs: []
    },
    {
      id: `${input.packageId}-prompts`,
      kind: "prompt_library",
      path: "prompts/index.json",
      version: input.version,
      governanceStatus: "placeholder",
      sourceRefs: []
    },
    {
      id: `${input.packageId}-rules`,
      kind: "rule",
      path: "rules/index.json",
      version: input.version,
      governanceStatus: "placeholder",
      sourceRefs: []
    },
    {
      id: `${input.packageId}-formulas`,
      kind: "formula",
      path: "formulas/index.json",
      version: input.version,
      governanceStatus: "placeholder",
      sourceRefs: []
    },
    {
      id: `${input.packageId}-cases`,
      kind: "case_library",
      path: "cases/index.json",
      version: input.version,
      governanceStatus: "placeholder",
      sourceRefs: []
    },
    {
      id: `${input.packageId}-workflows`,
      kind: "workflow",
      path: "workflows/index.json",
      version: input.version,
      governanceStatus: "placeholder",
      sourceRefs: []
    },
    {
      id: `${input.packageId}-templates`,
      kind: "template",
      path: "templates/index.json",
      version: input.version,
      governanceStatus: "placeholder",
      sourceRefs: []
    },
    {
      id: `${input.packageId}-governance`,
      kind: "governance_record",
      path: "governance/index.json",
      version: input.version,
      governanceStatus: "draft",
      sourceRefs: []
    }
  ];
}

function releaseDecisionDetail(status: PkaPackageReleaseStatusInput["status"], notes?: string) {
  const label =
    status === "under_review"
      ? "Submitted PKA package for release review"
      : status === "changes_requested"
        ? "Requested changes for PKA package release"
        : status === "approved"
          ? "Approved PKA package release"
          : "Rejected PKA package release";

  return notes ? `${label}. Notes: ${notes}` : label;
}

function packageReleaseSummary(packageRecord: PkaPackageSummary, events: GovernanceEventSummary[]) {
  const decisionEvents = events
    .filter((event) => event.subjectId === packageRecord.id && event.action.startsWith("pka_package."))
    .map((event) => ({
      action: event.action,
      actorId: event.actorId,
      detail: event.detail,
      createdAt: event.createdAt
    }));

  return {
    packageRecordId: packageRecord.id,
    packageId: packageRecord.packageId,
    version: packageRecord.version,
    status: packageRecord.status,
    replacementOfPackageId: packageRecord.replacementOfPackageId,
    replacementSequence: packageRecord.replacementSequence,
    publishedAt: packageRecord.publishedAt,
    decisionCount: decisionEvents.length,
    decisions: decisionEvents
  };
}

async function buildPkaPackageExportPreview(input: {
  projectId: string;
  name?: string;
  version?: string;
  publisher?: string;
}): Promise<PkaPackageExportPreview | undefined> {
  const project = (await listProjects()).find((item) => item.id === input.projectId);

  if (!project) {
    return undefined;
  }

  const version = input.version ?? "0.1.0";
  const packageId = `pka-${slugify(project.name)}-${version.replace(/[^a-zA-Z0-9]+/g, "-")}`;
  const [knowledgeObjects, relationships, sources, governanceEvents, pkaPackages] = await Promise.all([
    listKnowledgeObjects({ projectId: input.projectId }),
    listKnowledgeRelationships({ projectId: input.projectId }),
    listSourcesByProject(input.projectId),
    listGovernanceHistory(),
    listPkaPackages(input.projectId)
  ]);
  const packageReleaseSummaries = pkaPackages
    .filter((pkaPackage) => pkaPackage.packageId === packageId)
    .map((pkaPackage) => packageReleaseSummary(pkaPackage, governanceEvents));
  const releaseObjects = knowledgeObjects.filter((knowledgeObject) =>
    approvedKnowledgeObject(knowledgeObject.status)
  );
  const generatedAt = new Date().toISOString();
  const componentIndex = packageComponentIndex({
    packageId,
    version,
    releaseObjects,
    relationships,
    sources
  });
  const manifest = {
    packageId,
    name: input.name ?? `${project.name} Base PKA`,
    version,
    domain: project.domain,
    description: project.objective,
    publisher: input.publisher ?? "publisher",
    governanceStatus: "draft",
    createdDate: generatedAt,
    updatedDate: generatedAt,
    requiredRuntimeCapabilities: ["knowledge_object_lookup", "relationship_traversal", "source_citation"],
    retrievalCapabilities: ["knowledge_object_search", "graph_traversal", "source_evidence_retrieval"],
    contextBundleSchemaVersion: "0.1.0",
    licenseOrUsagePolicy: "internal development use",
    objectTypes: knowledgeObjectTypes,
    relationshipTypes,
    knowledgeObjectCount: releaseObjects.length,
    relationshipCount: relationships.length,
    sourceReferenceCount: sources.length,
    packageStructure: pkaPackageFolders,
    componentIndex
  };

  return {
    packageId,
    exportRoot: `storage/exports/${packageId}`,
    archivePath: "package-archive.json",
    zipArchivePath: "package.zip",
    folders: pkaPackageFolders,
    componentIndex,
    files: [
      {
        path: "manifest.json",
        kind: "json",
        status: "ready",
        description: "Top-level PKA manifest and package contract.",
        contents: manifest
      },
      {
        path: "ontology/index.json",
        kind: "json",
        status: "ready",
        description: "Fixed MVP ontology vocabulary for object and relationship types.",
        contents: {
          objectTypes: knowledgeObjectTypes,
          relationshipTypes
        }
      },
      {
        path: "knowledge-objects/index.json",
        kind: "json",
        status: "ready",
        description: "Approved Knowledge Objects included in this package preview.",
        contents: {
          count: releaseObjects.length,
          items: releaseObjects.map((knowledgeObject) => ({
            id: knowledgeObject.id,
            title: knowledgeObject.title,
            objectType: knowledgeObject.objectType,
            status: knowledgeObject.status,
            version: knowledgeObject.version,
            sourceRefs: knowledgeObject.evidenceLinks.map((evidence) => evidence.sourceId)
          }))
        }
      },
      {
        path: "graph/relationships.json",
        kind: "json",
        status: "ready",
        description: "Relationship edges with provenance and relationship source evidence where available.",
        contents: {
          count: relationships.length,
          items: relationships.map((relationship) => ({
            id: relationship.id,
            fromId: relationship.fromId,
            toId: relationship.toId,
            type: relationship.type,
            status: relationship.status,
            confidence: relationship.confidence,
            provenanceNote: relationship.provenanceNote,
            evidenceSourceId: relationship.evidenceSourceId
          }))
        }
      },
      {
        path: "sources/index.json",
        kind: "json",
        status: "ready",
        description: "Source reference index for package traceability.",
        contents: {
          count: sources.length,
          items: sources.map((source) => ({
            id: source.id,
            title: source.title,
            category: source.category,
            reliability: source.reliability,
            usagePolicy: source.usagePolicy,
            boundary: source.boundary
          }))
        }
      },
      {
        path: "governance/index.json",
        kind: "json",
        status: "ready",
        description: "Governance event index for package auditability.",
        contents: {
          count: governanceEvents.length,
          releaseDecisionSummary: {
            count: packageReleaseSummaries.length,
            items: packageReleaseSummaries
          },
          items: governanceEvents.slice(0, 20)
        }
      },
      ...[
        "runtime/config.json",
        "prompts/index.json",
        "rules/index.json",
        "formulas/index.json",
        "cases/index.json",
        "workflows/index.json",
        "templates/index.json"
      ].map((path) => ({
        path,
        kind: "placeholder" as const,
        status: "placeholder" as const,
        description: "Reserved package component index; implementation details arrive in later Sprint 6 slices.",
        contents: {
          status: "placeholder",
          items: []
        }
      }))
    ]
  };
}

export async function getPkaPackageExportPreview(projectId: string) {
  return buildPkaPackageExportPreview({ projectId });
}

function workspaceRootPath() {
  const cwd = process.cwd();
  const normalized = cwd.replace(/\\/g, "/");

  if (normalized.endsWith("/apps/studio")) {
    return resolve(cwd, "..", "..");
  }

  return cwd;
}

function resolvePkaExportPath(packageId: string, relativePath = "") {
  const exportRoot = resolve(workspaceRootPath(), "storage", "exports", packageId);
  const targetPath = resolve(exportRoot, relativePath);

  if (targetPath !== exportRoot && !targetPath.startsWith(`${exportRoot}\\`) && !targetPath.startsWith(`${exportRoot}/`)) {
    throw new Error("Invalid PKA export path.");
  }

  return targetPath;
}

export function buildPkaPackageArchive(preview: PkaPackageExportPreview) {
  return {
    packageId: preview.packageId,
    exportRoot: preview.exportRoot,
    archiveFormat: "kf-json-archive",
    generatedAt: new Date().toISOString(),
    files: preview.files.map((file) => ({
      path: file.path,
      kind: file.kind,
      status: file.status,
      description: file.description,
      contents: file.contents
    }))
  };
}

const crc32Table = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function zipDateParts(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return { dosTime, dosDate };
}

function buildZipFile(entries: Array<{ path: string; contents: Buffer }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const { dosTime, dosDate } = zipDateParts();

  for (const entry of entries) {
    const fileName = Buffer.from(entry.path.replace(/\\/g, "/"), "utf8");
    const checksum = crc32(entry.contents);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(entry.contents.length, 18);
    localHeader.writeUInt32LE(entry.contents.length, 22);
    localHeader.writeUInt16LE(fileName.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, fileName, entry.contents);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(entry.contents.length, 20);
    centralHeader.writeUInt32LE(entry.contents.length, 24);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, fileName);

    offset += localHeader.length + fileName.length + entry.contents.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

export function buildPkaPackageZip(preview: PkaPackageExportPreview) {
  const archive = buildPkaPackageArchive(preview);
  const entries = [
    ...preview.files.map((file) => ({
      path: file.path,
      contents: Buffer.from(`${JSON.stringify(file.contents, null, 2)}\n`, "utf8")
    })),
    {
      path: preview.archivePath,
      contents: Buffer.from(`${JSON.stringify(archive, null, 2)}\n`, "utf8")
    }
  ];

  return buildZipFile(entries);
}

export async function persistPkaPackageExportPreview(preview: PkaPackageExportPreview) {
  const exportRoot = resolvePkaExportPath(preview.packageId);

  await mkdir(exportRoot, { recursive: true });

  for (const folder of preview.folders) {
    await mkdir(resolvePkaExportPath(preview.packageId, folder), { recursive: true });
  }

  for (const file of preview.files) {
    const filePath = resolvePkaExportPath(preview.packageId, file.path);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(file.contents, null, 2)}\n`, "utf8");
  }

  const archivePath = resolvePkaExportPath(preview.packageId, preview.archivePath);
  await writeFile(archivePath, `${JSON.stringify(buildPkaPackageArchive(preview), null, 2)}\n`, "utf8");
  const zipArchivePath = resolvePkaExportPath(preview.packageId, preview.zipArchivePath);
  await writeFile(zipArchivePath, buildPkaPackageZip(preview));

  return {
    exportRoot,
    archivePath,
    zipArchivePath
  };
}

async function refreshPersistedPkaPackageExport(input: {
  projectId: string;
  name: string;
  version: string;
  publisher?: string;
}) {
  const preview = await buildPkaPackageExportPreview(input);

  if (preview) {
    await persistPkaPackageExportPreview(preview);
  }
}

export async function listPersistedPkaExportFiles(packageId: string) {
  const exportRoot = resolvePkaExportPath(packageId);
  const files: PkaPersistedExportFile[] = [];

  async function walk(directory: string) {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      const details = await stat(absolutePath);
      files.push({
        path: absolutePath.slice(exportRoot.length + 1).replace(/\\/g, "/"),
        size: details.size,
        updatedAt: details.mtime.toISOString()
      });
    }
  }

  try {
    await walk(exportRoot);
  } catch {
    return [];
  }

  return files.sort((left, right) => left.path.localeCompare(right.path));
}

export async function readPersistedPkaExportFile(packageId: string, relativePath: string) {
  const filePath = resolvePkaExportPath(packageId, relativePath);
  const contents = await readFile(filePath, "utf8");

  return {
    path: relativePath,
    contents
  };
}

export async function getPkaPackageReplacementSummary(input: {
  projectId: string;
  name?: string;
  version?: string;
  publisher?: string;
}): Promise<PkaPackageReplacementSummary | undefined> {
  const exportPreview = await buildPkaPackageExportPreview(input);

  if (!exportPreview) {
    return undefined;
  }

  const existingPackage = (await listPkaPackages(input.projectId)).find(
    (pkaPackage) => pkaPackage.packageId === exportPreview.packageId
  );
  const persistedFiles = await listPersistedPkaExportFiles(exportPreview.packageId);
  const persistedPaths = new Set(persistedFiles.map((file) => file.path));
  const previewFileContents = new Map(
    exportPreview.files.map((file) => [file.path, `${JSON.stringify(file.contents, null, 2)}\n`])
  );
  const changedFiles: string[] = [];
  const addedFiles: string[] = [];
  const unchangedFiles: string[] = [];

  for (const [path, previewContents] of previewFileContents) {
    if (!persistedPaths.has(path)) {
      addedFiles.push(path);
      continue;
    }

    const persistedFile = await readPersistedPkaExportFile(exportPreview.packageId, path).catch(() => undefined);
    if (persistedFile?.contents === previewContents) {
      unchangedFiles.push(path);
    } else {
      changedFiles.push(path);
    }
  }

  const removedFiles = [...persistedPaths].filter(
    (path) =>
      !previewFileContents.has(path) &&
      path !== exportPreview.archivePath &&
      path !== exportPreview.zipArchivePath
  );
  const currentManifest = exportPreview.files.find((file) => file.path === "manifest.json")?.contents;
  const previousManifest = existingPackage?.manifest;
  const semanticChanges: string[] = [];

  if (!previousManifest) {
    semanticChanges.push("New package baseline");
  } else if (currentManifest) {
    const comparisons = [
      ["Knowledge Objects", previousManifest.knowledgeObjectCount, currentManifest.knowledgeObjectCount],
      ["Relationships", previousManifest.relationshipCount, currentManifest.relationshipCount],
      ["Source references", previousManifest.sourceReferenceCount, currentManifest.sourceReferenceCount],
      [
        "Runtime capabilities",
        Array.isArray(previousManifest.requiredRuntimeCapabilities)
          ? previousManifest.requiredRuntimeCapabilities.join(", ")
          : undefined,
        Array.isArray(currentManifest.requiredRuntimeCapabilities)
          ? currentManifest.requiredRuntimeCapabilities.join(", ")
          : undefined
      ],
      [
        "Package folders",
        Array.isArray(previousManifest.packageStructure) ? previousManifest.packageStructure.join(", ") : undefined,
        Array.isArray(currentManifest.packageStructure) ? currentManifest.packageStructure.join(", ") : undefined
      ],
      [
        "Component entries",
        Array.isArray(previousManifest.componentIndex) ? previousManifest.componentIndex.length : undefined,
        Array.isArray(currentManifest.componentIndex) ? currentManifest.componentIndex.length : undefined
      ]
    ] as const;

    for (const [label, previousValue, currentValue] of comparisons) {
      if (previousValue !== currentValue) {
        semanticChanges.push(`${label}: ${previousValue ?? "missing"} -> ${currentValue ?? "missing"}`);
      }
    }
  }

  if (semanticChanges.length === 0) {
    semanticChanges.push("No semantic package changes detected");
  }

  return {
    packageId: exportPreview.packageId,
    existingPackage,
    requiresConfirmation: Boolean(existingPackage && existingPackage.status !== "published"),
    blockedByPublished: existingPackage?.status === "published",
    semanticChanges,
    changedFiles,
    addedFiles,
    removedFiles,
    unchangedFiles
  };
}

export function validatePkaManifest(manifest: Partial<PkaManifestPreview> | undefined): PackageValidationItem[] {
  if (!manifest) {
    return [
      {
        id: "manifest-missing",
        level: "warning",
        title: "Manifest missing",
        detail: "A package manifest is required before export or runtime inspection."
      }
    ];
  }

  const requiredFields = [
    manifest.packageId,
    manifest.name,
    manifest.version,
    manifest.domain,
    manifest.description,
    manifest.publisher,
    manifest.governanceStatus
  ];
  const hasRuntimeCapabilities =
    Array.isArray(manifest.requiredRuntimeCapabilities) && manifest.requiredRuntimeCapabilities.length > 0;
  const hasOntology =
    Array.isArray(manifest.objectTypes) &&
    manifest.objectTypes.length > 0 &&
    Array.isArray(manifest.relationshipTypes) &&
    manifest.relationshipTypes.length > 0;
  const hasCounts =
    typeof manifest.knowledgeObjectCount === "number" &&
    typeof manifest.relationshipCount === "number" &&
    typeof manifest.sourceReferenceCount === "number";

  return [
    {
      id: "manifest-required-fields",
      level: requiredFields.every((field) => typeof field === "string" && field.trim().length > 0)
        ? "ready"
        : "warning",
      title: "Manifest required fields",
      detail:
        "Package ID, name, version, domain, description, publisher, and governance status must be present."
    },
    {
      id: "manifest-runtime-capabilities",
      level: hasRuntimeCapabilities ? "ready" : "warning",
      title: "Runtime capabilities",
      detail: hasRuntimeCapabilities
        ? `${manifest.requiredRuntimeCapabilities?.length ?? 0} runtime capability/capabilities declared.`
        : "Declare the runtime capabilities required by apps that consume this PKA."
    },
    {
      id: "manifest-ontology-contract",
      level: hasOntology ? "ready" : "warning",
      title: "Ontology contract",
      detail: hasOntology
        ? "Object and relationship vocabularies are represented in the manifest."
        : "Object and relationship vocabularies must be represented in the manifest."
    },
    {
      id: "manifest-content-counts",
      level: hasCounts ? "ready" : "warning",
      title: "Content counts",
      detail: hasCounts
        ? "Knowledge Object, relationship, and source reference counts are available."
        : "Knowledge Object, relationship, and source reference counts are required for inspection."
    }
  ];
}

export async function getPkaPackageValidationReport(projectId: string): Promise<PackageValidationItem[]> {
  const project = (await listProjects()).find((item) => item.id === projectId);

  if (!project) {
    return [
      {
        id: "project-missing",
        level: "warning",
        title: "Project missing",
        detail: "Select a valid project before assembling a package."
      }
    ];
  }

  const knowledgeObjects = await listKnowledgeObjects({ projectId });
  const relationships = await listKnowledgeRelationships({ projectId });
  const sources = await listSourcesByProject(projectId);
  const releaseReadinessHints = await getPkaReleaseReadinessHints(projectId);
  const blockers = releaseReadinessHints.filter((hint) => hint.level === "warning");
  const manifestPreview = await getPkaManifestPreview(projectId);
  const releasableObjects = knowledgeObjects.filter((knowledgeObject) =>
    approvedKnowledgeObject(knowledgeObject.status)
  );
  const items: PackageValidationItem[] = [];

  items.push(...validatePkaManifest(manifestPreview));

  items.push({
    id: "approved-knowledge-objects",
    level: releasableObjects.length > 0 ? "ready" : "warning",
    title: "Approved Knowledge Objects",
    detail:
      releasableObjects.length > 0
        ? `${releasableObjects.length} release-grade Knowledge Object(s) are available.`
        : "Approve at least one Knowledge Object before package assembly."
  });

  items.push({
    id: "source-reference-index",
    level: sources.length > 0 ? "ready" : "warning",
    title: "Source reference index",
    detail:
      sources.length > 0
        ? `${sources.length} source reference(s) can be indexed.`
        : "Register source references before package assembly."
  });

  items.push({
    id: "graph-relationships",
    level: relationships.length > 0 ? "ready" : "info",
    title: "Graph relationships",
    detail:
      relationships.length > 0
        ? `${relationships.length} relationship edge(s) can be included.`
        : "No relationship edges are available yet; the package can be inspected but graph traversal will be thin."
  });

  items.push({
    id: "relationship-source-evidence",
    level: relationships.length === 0 || relationships.every((relationship) => relationship.evidenceSourceId)
      ? "ready"
      : "info",
    title: "Relationship source evidence",
    detail:
      relationships.length === 0
        ? "No relationship edges exist yet."
        : relationships.every((relationship) => relationship.evidenceSourceId)
          ? "Relationship edges include structured source evidence attachment."
          : "Some relationship edges still rely on provenance notes without structured source evidence attachment."
  });

  items.push({
    id: "release-blockers",
    level: blockers.length === 0 ? "ready" : "warning",
    title: "Release blockers",
    detail:
      blockers.length === 0
        ? "No release-blocking governance checks remain."
        : `${blockers.length} release-blocking governance check(s) remain.`
  });

  return items;
}

export async function listGovernanceHistory(filters: GovernanceHistoryFilter = {}) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const auditLogs = await getPrismaClient().auditLog.findMany({
      where: filters.subjectId
        ? {
            OR: [
              { subjectId: filters.subjectId },
              { metadata: { path: ["fromId"], equals: filters.subjectId } },
              { metadata: { path: ["toId"], equals: filters.subjectId } },
              { metadata: { path: ["knowledgeObjectId"], equals: filters.subjectId } }
            ]
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return auditLogs.map(mapAuditLog);
  }

  return workspaceStore().auditLogs.filter((event) => {
    if (!filters.subjectId) {
      return true;
    }

    if (event.subjectId === filters.subjectId) {
      return true;
    }

    return metadataMatchesSubject((event as GovernanceEventSummary & { metadata?: unknown }).metadata, filters.subjectId);
  });
}

export async function listKnowledgeObjectVersionSnapshots(
  knowledgeObjectId: string
): Promise<KnowledgeObjectVersionSnapshotSummary[]> {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const versions = await getPrismaClient().knowledgeObjectVersion.findMany({
      where: {
        knowledgeObjectId
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    return versions.map(mapKnowledgeObjectVersion);
  }

  return workspaceStore().versionSnapshots.filter(
    (snapshot) => snapshot.knowledgeObjectId === knowledgeObjectId
  );
}

export async function listReviewQueue(projectId?: string) {
  return listKnowledgeObjects({ projectId, status: "under_review" });
}

export async function listReviews(filters: ReviewFilter = {}) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const reviews = await getPrismaClient().review.findMany({
      where: {
        knowledgeObjectId: filters.knowledgeObjectId,
        decision: filters.decision && filters.decision !== "all" ? filters.decision : undefined,
        reviewer: filters.reviewer ? { role: filters.reviewer as Role } : undefined,
        knowledgeObject: filters.projectId ? { projectId: filters.projectId } : undefined
      },
      include: {
        knowledgeObject: { select: { projectId: true, title: true } },
        reviewer: { select: { role: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return reviews.map(mapReview);
  }

  return workspaceStore().reviews.filter((review) => {
    if (filters.knowledgeObjectId && review.knowledgeObjectId !== filters.knowledgeObjectId) {
      return false;
    }

    if (filters.decision && filters.decision !== "all" && review.decision !== filters.decision) {
      return false;
    }

    if (filters.reviewer && review.reviewerRole !== filters.reviewer && review.reviewerId !== filters.reviewer) {
      return false;
    }

    if (filters.projectId) {
      const knowledgeObject = workspaceStore().knowledgeObjects.find(
        (item) => item.id === review.knowledgeObjectId
      );

      return knowledgeObject?.projectId === filters.projectId;
    }

    return true;
  });
}

export function releaseBlockerTypeFromHintId(hintId: string): ReleaseBlockerType | undefined {
  return releaseBlockerTypes.find(
    (type) => type.id !== "all" && (hintId === type.id || hintId.endsWith(`-${type.id}`))
  )?.id;
}

export function filterReleaseReadinessHints(
  hints: ReadinessHint[],
  blockerType: ReleaseBlockerType = "all"
) {
  if (blockerType === "all") {
    return hints;
  }

  return hints.filter((hint) => releaseBlockerTypeFromHintId(hint.id) === blockerType);
}

export function getRelationshipReadinessHints(
  knowledgeObject: KnowledgeObjectSummary | undefined,
  relationships: KnowledgeRelationshipSummary[]
): ReadinessHint[] {
  if (!knowledgeObject) {
    return [
      {
        id: "no-selected-ko",
        level: "info",
        title: "No Knowledge Object selected",
        detail: "Select a Knowledge Object before checking relationship quality."
      }
    ];
  }

  const hints: ReadinessHint[] = [];

  if (relationships.length === 0) {
    hints.push({
      id: "isolated-knowledge-object",
      level: "warning",
      title: "Isolated Knowledge Object",
      detail: "Add at least one relationship so this KO can participate in the PKA graph."
    });
  }

  if (relationships.some((relationship) => relationship.status !== "approved")) {
    hints.push({
      id: "draft-relationships",
      level: "info",
      title: "Draft relationship edges",
      detail: "Relationship edges exist but still need review before package release."
    });
  }

  if (relationships.some((relationship) => relationship.confidence === undefined || relationship.confidence < 50)) {
    hints.push({
      id: "weak-relationship-confidence",
      level: "warning",
      title: "Weak relationship confidence",
      detail: "One or more relationship edges have low or missing confidence."
    });
  }

  if (relationships.some((relationship) => !relationship.provenanceNote)) {
    hints.push({
      id: "missing-relationship-provenance",
      level: "warning",
      title: "Relationship provenance missing",
      detail: "Every relationship should explain why the edge exists."
    });
  }

  if (hints.length === 0) {
    hints.push({
      id: "relationships-ready",
      level: "ready",
      title: "Relationship quality ready",
      detail: "This KO has relationship edges with provenance and usable confidence."
    });
  }

  return hints;
}

function approvedKnowledgeObject(status: LifecycleState) {
  return ["expert_validated", "approved", "published"].includes(status);
}

export function getKnowledgeObjectReviewReadinessHints(
  knowledgeObject: KnowledgeObjectSummary | undefined,
  relationships: KnowledgeRelationshipSummary[]
): ReadinessHint[] {
  if (!knowledgeObject) {
    return [
      {
        id: "no-review-target",
        level: "info",
        title: "No review target",
        detail: "Select an under-review Knowledge Object before checking governance readiness."
      }
    ];
  }

  const hints: ReadinessHint[] = [];

  if (knowledgeObject.evidenceLinks.length === 0) {
    hints.push({
      id: "missing-source-evidence",
      level: "warning",
      title: "Source evidence missing",
      detail: "Add a source evidence link or document why this is accepted as expert/manual input."
    });
  }

  if (!approvedKnowledgeObject(knowledgeObject.status)) {
    hints.push({
      id: "not-approved-for-release",
      level: "warning",
      title: "Not approved for release",
      detail: `Current status is ${knowledgeObject.status}; PKA release requires approved, expert_validated, or published KOs.`
    });
  }

  if (!knowledgeObject.owner || !knowledgeObject.author) {
    hints.push({
      id: "missing-ownership-metadata",
      level: "warning",
      title: "Ownership metadata incomplete",
      detail: "Owner and author fields are required before professional release."
    });
  }

  if (knowledgeObject.tags.length === 0) {
    hints.push({
      id: "missing-tags",
      level: "warning",
      title: "Tags missing",
      detail: "Add tags so package assembly and runtime retrieval can classify this KO."
    });
  }

  if (knowledgeObject.confidence === undefined) {
    hints.push({
      id: "missing-confidence",
      level: "warning",
      title: "Confidence missing",
      detail: "Add confidence before review approval or PKA export."
    });
  }

  for (const relationshipHint of getRelationshipReadinessHints(knowledgeObject, relationships)) {
    if (relationshipHint.level === "warning") {
      hints.push(relationshipHint);
    }
  }

  if (hints.length === 0) {
    hints.push({
      id: "review-ready",
      level: "ready",
      title: "Review readiness clear",
      detail: "Evidence, metadata, approval status, and relationship quality are ready for packaging checks."
    });
  }

  return hints;
}

export async function getProjectGovernanceMetrics(projectId?: string): Promise<GovernanceMetrics> {
  const knowledgeObjects = await listKnowledgeObjects({ projectId });
  let releaseBlockerCount = 0;

  for (const knowledgeObject of knowledgeObjects) {
    const relationships = await listKnowledgeRelationships({
      projectId: knowledgeObject.projectId,
      knowledgeObjectId: knowledgeObject.id
    });
    releaseBlockerCount += getKnowledgeObjectReviewReadinessHints(knowledgeObject, relationships).filter(
      (hint) => hint.level === "warning"
    ).length;
  }

  return {
    totalKnowledgeObjects: knowledgeObjects.length,
    underReviewCount: knowledgeObjects.filter((item) => item.status === "under_review").length,
    changesRequestedCount: knowledgeObjects.filter((item) => item.status === "changes_requested").length,
    rejectedCount: knowledgeObjects.filter((item) => item.status === "rejected").length,
    approvedCount: knowledgeObjects.filter((item) => approvedKnowledgeObject(item.status)).length,
    releaseBlockerCount
  };
}

export async function getPkaReleaseReadinessHints(projectId: string): Promise<ReadinessHint[]> {
  const knowledgeObjects = await listKnowledgeObjects({ projectId });
  const hints: ReadinessHint[] = [];

  if (knowledgeObjects.length === 0) {
    return [
      {
        id: "no-package-knowledge-objects",
        level: "warning",
        title: "No Knowledge Objects available",
        detail: "A PKA cannot be released until approved Knowledge Objects exist."
      }
    ];
  }

  for (const knowledgeObject of knowledgeObjects) {
    const relationships = await listKnowledgeRelationships({
      projectId,
      knowledgeObjectId: knowledgeObject.id
    });

    const blockers = getKnowledgeObjectReviewReadinessHints(knowledgeObject, relationships).filter(
      (hint) => hint.level === "warning"
    );

    for (const blocker of blockers) {
      hints.push({
        ...blocker,
        id: `${knowledgeObject.id}-${blocker.id}`,
        title: `${knowledgeObject.title}: ${blocker.title}`
      });
    }
  }

  if (hints.length === 0) {
    hints.push({
      id: "pka-release-ready",
      level: "ready",
      title: "PKA release checks clear",
      detail: "All Knowledge Objects in this project satisfy the current governance release checks."
    });
  }

  return hints;
}

export async function getActiveProject() {
  const projects = await listProjects();
  return projects.find((project) => project.id === workspace.activeProjectId) ?? projects[0];
}

export async function getProjectSourceCount(projectId: string) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    return getPrismaClient().source.count({ where: { projectId } });
  }

  return workspaceStore().sources.filter((source) => source.projectId === projectId).length;
}

async function markSourceProcessingStatus(sourceId: string, status: MissionStatus) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    await getPrismaClient().source.update({
      where: { id: sourceId },
      data: { processingStatus: status }
    });
    return;
  }

  const sourceRecord = workspaceStore().sources.find((item) => item.id === sourceId);
  if (sourceRecord) {
    sourceRecord.processingStatus = status;
  }
}

async function setSourceStoragePath(sourceId: string, storagePath: string) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    await getPrismaClient().source.update({
      where: { id: sourceId },
      data: { storagePath }
    });
    return;
  }

  const sourceRecord = workspaceStore().sources.find((item) => item.id === sourceId);
  if (sourceRecord) {
    sourceRecord.storagePath = storagePath;
  }
}

async function createPipelineFixtureArtifact(source: SourceSummary, fixtureType: FailedIngestionFixtureInput["fixtureType"]) {
  if (fixtureType !== "unsupported_file" && fixtureType !== "empty_artifact") {
    return undefined;
  }

  const fixturePath =
    fixtureType === "unsupported_file"
      ? `storage/pipeline-fixtures/${source.id}-unsupported.pdf`
      : `storage/pipeline-fixtures/${source.id}-empty.txt`;
  const absolutePath = resolve(workspaceRootPath(), fixturePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(
    absolutePath,
    fixtureType === "unsupported_file" ? "Deterministic unsupported artifact fixture.\n" : "",
    "utf8"
  );
  await setSourceStoragePath(source.id, fixturePath);

  return fixturePath;
}

export async function runSourceIngestion(input: PipelineIngestionInput): Promise<PipelineIngestionResult> {
  const source = (await listSources()).find((item) => item.id === input.sourceId);

  if (!source) {
    throw new Error(`Source not found: ${input.sourceId}`);
  }

  const existingChunks = await listSourceChunks({ sourceId: source.id });
  const existingSuggestions = await listKnowledgeSuggestions({ sourceId: source.id, status: "all" });
  const existingRelationshipSuggestions = await listRelationshipSuggestions({ sourceId: source.id, status: "all" });

  if (existingChunks.length > 0 || existingSuggestions.length > 0) {
    const mission = await createMission({
      type: "intelligence",
      title: `Reuse source ingestion: ${source.title}`,
      projectId: source.projectId,
      assignedTo: input.actor ?? "knowledge_engineer",
      stage: "pipeline-ingestion",
      priority: "normal",
      status: "completed"
    });

    return {
      mission,
      chunks: existingChunks,
      suggestions: existingSuggestions,
      relationshipSuggestions: existingRelationshipSuggestions
    };
  }

  const extraction = await extractSourceText(source);

  if (!extraction.ok) {
    await markSourceProcessingStatus(source.id, "failed");
    const mission = await createMission({
      type: "intelligence",
      title: `Failed source ingestion: ${source.title}`,
      projectId: source.projectId,
      assignedTo: input.actor ?? "knowledge_engineer",
      stage: "pipeline-ingestion",
      priority: "normal",
      status: "failed"
    });

    await recordAuditLog({
      action: "pipeline.source_ingestion_failed",
      subjectType: "Source",
      subjectId: source.id,
      actorId: input.actor ?? "knowledge_engineer",
      detail: extraction.detail,
      metadata: {
        sourceId: source.id,
        failureReason: extraction.reason,
        storagePath: source.storagePath,
        missionId: mission.id
      }
    });

    return {
      mission,
      chunks: [],
      suggestions: [],
      relationshipSuggestions: []
    };
  }

  const rawChunks = chunkSourceText(extraction.text);

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const prisma = getPrismaClient();
    const createdChunks: SourceChunkSummary[] = [];
    const createdSuggestions: KnowledgeSuggestionSummary[] = [];
    const createdRelationshipSuggestions: RelationshipSuggestionSummary[] = [];

    for (const [index, content] of rawChunks.entries()) {
      const chunk = await prisma.sourceChunk.create({
        data: {
          projectId: source.projectId,
          sourceId: source.id,
          chunkIndex: index,
          locator: `deterministic:${index + 1}`,
          content,
          tokenEstimate: Math.ceil(content.length / 4)
        },
        include: {
          source: { select: { title: true } }
        }
      });
      const mappedChunk = mapSourceChunk(chunk);
      const suggestionDraft = await buildSuggestionFromChunk(source, mappedChunk);
      const suggestion = await prisma.knowledgeSuggestion.create({
        data: {
          projectId: source.projectId,
          sourceId: source.id,
          sourceChunkId: chunk.id,
          title: suggestionDraft.title,
          objectType: suggestionDraft.objectType,
          domain: suggestionDraft.domain,
          description: suggestionDraft.description,
          confidence: suggestionDraft.confidence,
          suggestedTags: suggestionDraft.suggestedTags,
          evidenceExcerpt: suggestionDraft.evidenceExcerpt,
          evidenceLocator: suggestionDraft.evidenceLocator,
          reviewNotes: suggestionDraft.reviewNotes,
          status: "pending"
        },
        include: {
          source: { select: { title: true } }
        }
      });

      createdChunks.push(mappedChunk);
      createdSuggestions.push(mapKnowledgeSuggestion(suggestion));
    }

    if (createdSuggestions.length >= 2) {
      const relationshipDraft = await buildRelationshipSuggestionFromSuggestions(
        source,
        createdSuggestions[0],
        createdSuggestions[1]
      );
      const relationshipSuggestion = await prisma.relationshipSuggestion.create({
        data: {
          projectId: source.projectId,
          sourceId: source.id,
          sourceChunkId: createdSuggestions[0].sourceChunkId,
          fromSuggestionId: createdSuggestions[0].id,
          toSuggestionId: createdSuggestions[1].id,
          type: relationshipDraft.type,
          rationale: relationshipDraft.rationale,
          confidence: relationshipDraft.confidence,
          evidenceExcerpt: relationshipDraft.evidenceExcerpt,
          evidenceLocator: relationshipDraft.evidenceLocator,
          reviewNotes: relationshipDraft.reviewNotes,
          status: "pending"
        },
        include: {
          source: { select: { title: true } },
          fromSuggestion: { select: { title: true, acceptedKnowledgeObjectId: true } },
          toSuggestion: { select: { title: true, acceptedKnowledgeObjectId: true } }
        }
      });
      createdRelationshipSuggestions.push(mapRelationshipSuggestion(relationshipSuggestion));
    }

    await prisma.source.update({
      where: { id: source.id },
      data: { processingStatus: "ready" }
    });

    const mission = await createMission({
      type: "intelligence",
      title: `Run source ingestion: ${source.title}`,
      projectId: source.projectId,
      assignedTo: input.actor ?? "knowledge_engineer",
      stage: "pipeline-ingestion",
      priority: "normal",
      status: "completed"
    });

    await recordAuditLog({
      action: "pipeline.source_ingested",
      subjectType: "Source",
      subjectId: source.id,
      actorId: input.actor ?? "knowledge_engineer",
      detail: `Created ${createdChunks.length} source chunk(s), ${createdSuggestions.length} KO suggestion(s), and ${createdRelationshipSuggestions.length} relationship suggestion(s).`,
      metadata: {
        sourceId: source.id,
        chunkCount: createdChunks.length,
        suggestionCount: createdSuggestions.length,
        relationshipSuggestionCount: createdRelationshipSuggestions.length,
        extractionMode: extraction.mode,
        missionId: mission.id
      }
    });

    return {
      mission,
      chunks: createdChunks,
      suggestions: createdSuggestions,
      relationshipSuggestions: createdRelationshipSuggestions
    };
  }

  const createdAt = new Date().toISOString().slice(0, 10);
  const createdChunks: SourceChunkSummary[] = [];
  const createdSuggestions: KnowledgeSuggestionSummary[] = [];
  const createdRelationshipSuggestions: RelationshipSuggestionSummary[] = [];

  for (const [index, content] of rawChunks.entries()) {
    const chunk: SourceChunkSummary = {
      id: `chunk-${slugify(source.title)}-${index + 1}-${Date.now().toString(36)}`,
      projectId: source.projectId,
      sourceId: source.id,
      sourceTitle: source.title,
      chunkIndex: index,
      locator: `deterministic:${index + 1}`,
      content,
      tokenEstimate: Math.ceil(content.length / 4),
      createdAt
    };
    const suggestionDraft = await buildSuggestionFromChunk(source, chunk);
    const suggestion: KnowledgeSuggestionSummary = {
      id: `sug-${slugify(suggestionDraft.title)}-${Date.now().toString(36)}`,
      projectId: source.projectId,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceChunkId: chunk.id,
      title: suggestionDraft.title,
      objectType: suggestionDraft.objectType,
      domain: suggestionDraft.domain,
      description: suggestionDraft.description,
      confidence: suggestionDraft.confidence,
      suggestedTags: suggestionDraft.suggestedTags,
      evidenceExcerpt: suggestionDraft.evidenceExcerpt,
      evidenceLocator: suggestionDraft.evidenceLocator,
      reviewNotes: suggestionDraft.reviewNotes,
      status: "pending",
      createdAt
    };

    createdChunks.push(chunk);
    createdSuggestions.push(suggestion);
  }

  if (createdSuggestions.length >= 2) {
    const relationshipDraft = await buildRelationshipSuggestionFromSuggestions(
      source,
      createdSuggestions[0],
      createdSuggestions[1]
    );
    createdRelationshipSuggestions.push({
      id: `relsug-${slugify(`${createdSuggestions[0].title}-${createdSuggestions[1].title}`)}-${Date.now().toString(36)}`,
      projectId: source.projectId,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceChunkId: createdSuggestions[0].sourceChunkId,
      fromSuggestionId: createdSuggestions[0].id,
      fromSuggestionTitle: createdSuggestions[0].title,
      fromAcceptedKnowledgeObjectId: createdSuggestions[0].acceptedKnowledgeObjectId,
      toSuggestionId: createdSuggestions[1].id,
      toSuggestionTitle: createdSuggestions[1].title,
      toAcceptedKnowledgeObjectId: createdSuggestions[1].acceptedKnowledgeObjectId,
      type: relationshipDraft.type,
      rationale: relationshipDraft.rationale,
      confidence: relationshipDraft.confidence,
      evidenceExcerpt: relationshipDraft.evidenceExcerpt,
      evidenceLocator: relationshipDraft.evidenceLocator,
      reviewNotes: relationshipDraft.reviewNotes,
      status: "pending",
      createdAt
    });
  }

  workspaceStore().sourceChunks.unshift(...createdChunks);
  workspaceStore().knowledgeSuggestions.unshift(...createdSuggestions);
  workspaceStore().relationshipSuggestions.unshift(...createdRelationshipSuggestions);
  const sourceRecord = workspaceStore().sources.find((item) => item.id === source.id);
  if (sourceRecord) {
    sourceRecord.processingStatus = "ready";
  }

  const mission = await createMission({
    type: "intelligence",
    title: `Run source ingestion: ${source.title}`,
    projectId: source.projectId,
    assignedTo: input.actor ?? "knowledge_engineer",
    stage: "pipeline-ingestion",
    priority: "normal",
    status: "completed"
  });

  await recordAuditLog({
    action: "pipeline.source_ingested",
    subjectType: "Source",
    subjectId: source.id,
    actorId: input.actor ?? "knowledge_engineer",
    detail: `Created ${createdChunks.length} source chunk(s), ${createdSuggestions.length} KO suggestion(s), and ${createdRelationshipSuggestions.length} relationship suggestion(s).`,
    metadata: {
      sourceId: source.id,
      chunkCount: createdChunks.length,
      suggestionCount: createdSuggestions.length,
      relationshipSuggestionCount: createdRelationshipSuggestions.length,
      extractionMode: extraction.mode,
      missionId: mission.id
    }
  });

  return {
    mission,
    chunks: createdChunks,
    suggestions: createdSuggestions,
    relationshipSuggestions: createdRelationshipSuggestions
  };
}

export async function retrySourceIngestion(input: PipelineRetryInput): Promise<PipelineIngestionResult> {
  const source = (await listSources()).find((item) => item.id === input.sourceId);

  if (!source) {
    throw new Error(`Source not found: ${input.sourceId}`);
  }

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const prisma = getPrismaClient();
    await prisma.relationshipSuggestion.deleteMany({ where: { sourceId: source.id } });
    await prisma.knowledgeSuggestion.deleteMany({ where: { sourceId: source.id } });
    await prisma.sourceChunk.deleteMany({ where: { sourceId: source.id } });
    await prisma.source.update({
      where: { id: source.id },
      data: { processingStatus: "retried" }
    });
  } else {
    const store = workspaceStore();
    store.relationshipSuggestions = store.relationshipSuggestions.filter(
      (suggestion) => suggestion.sourceId !== source.id
    );
    store.knowledgeSuggestions = store.knowledgeSuggestions.filter((suggestion) => suggestion.sourceId !== source.id);
    store.sourceChunks = store.sourceChunks.filter((chunk) => chunk.sourceId !== source.id);
    const sourceRecord = store.sources.find((item) => item.id === source.id);
    if (sourceRecord) {
      sourceRecord.processingStatus = "retried";
    }
  }

  await createMission({
    type: "intelligence",
    title: `Retry source ingestion: ${source.title}`,
    projectId: source.projectId,
    assignedTo: input.actor ?? "knowledge_engineer",
    stage: "pipeline-ingestion",
    priority: "normal",
    status: "retried"
  });

  await recordAuditLog({
    action: "pipeline.source_retry_requested",
    subjectType: "Source",
    subjectId: source.id,
    actorId: input.actor ?? "knowledge_engineer",
    detail: `Cleared previous pipeline artifacts for retry: ${source.title}`,
    metadata: {
      sourceId: source.id
    }
  });

  return runSourceIngestion(input);
}

export async function createFailedIngestionFixture(input: FailedIngestionFixtureInput) {
  const source = (await listSources()).find((item) => item.id === input.sourceId);

  if (!source) {
    throw new Error(`Source not found: ${input.sourceId}`);
  }

  const fixtureType = input.fixtureType ?? "manual_failure";
  const fixturePath = await createPipelineFixtureArtifact(source, fixtureType);
  await markSourceProcessingStatus(source.id, "failed");

  const mission = await createMission({
    type: "intelligence",
    title: `Failed ingestion fixture (${fixtureType}): ${source.title}`,
    projectId: source.projectId,
    assignedTo: input.actor ?? "knowledge_engineer",
    stage: "pipeline-ingestion",
    priority: "normal",
    status: "failed"
  });

  await recordAuditLog({
    action: "pipeline.ingestion_failed_fixture",
    subjectType: "Source",
    subjectId: source.id,
    actorId: input.actor ?? "knowledge_engineer",
    detail: `Created ${fixtureType.replaceAll("_", " ")} ingestion fixture for recovery testing: ${source.title}`,
    metadata: {
      sourceId: source.id,
      fixtureType,
      fixturePath,
      missionId: mission.id
    }
  });

  return mission;
}

export async function acceptKnowledgeSuggestion(input: AcceptKnowledgeSuggestionInput) {
  const suggestion = (await listKnowledgeSuggestions({ status: "all" })).find(
    (item) => item.id === input.suggestionId
  );

  if (!suggestion) {
    throw new Error(`Knowledge suggestion not found: ${input.suggestionId}`);
  }

  if (suggestion.status === "accepted" && suggestion.acceptedKnowledgeObjectId) {
    const existingKnowledgeObject = await getKnowledgeObject(suggestion.acceptedKnowledgeObjectId);
    if (existingKnowledgeObject) {
      return {
        suggestion,
        knowledgeObject: existingKnowledgeObject
      };
    }
  }

  if (suggestion.status !== "pending") {
    throw new Error("Only pending suggestions can create draft Knowledge Objects.");
  }

  const knowledgeObject = await createKnowledgeObject({
    projectId: suggestion.projectId,
    title: suggestion.title,
    objectType: suggestion.objectType,
    domain: suggestion.domain,
    description: suggestion.description,
    owner: input.actor ?? "knowledge_engineer",
    author: "ai_fake_provider",
    tags: suggestion.suggestedTags,
    confidence: suggestion.confidence,
    sourceId: suggestion.sourceId,
    evidenceExcerpt: suggestion.evidenceExcerpt,
    evidenceLocator: suggestion.evidenceLocator,
    evidenceConfidence: suggestion.confidence
  });

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const updatedSuggestion = await getPrismaClient().knowledgeSuggestion.update({
      where: { id: suggestion.id },
      data: {
        status: "accepted",
        acceptedKnowledgeObjectId: knowledgeObject.id
      },
      include: {
        source: { select: { title: true } }
      }
    });

    await getPrismaClient().knowledgeObject.update({
      where: { id: knowledgeObject.id },
      data: {
        status: "ai_generated",
        approvalStatus: "ai_generated",
        metadata: {
          evidenceMode: suggestion.sourceId ? "source_linked" : "expert_manual_input",
          generationMode: "deterministic_fake_provider",
          suggestionId: suggestion.id,
          sourceChunkId: suggestion.sourceChunkId
        }
      }
    });

    await recordAuditLog({
      action: "pipeline.suggestion_accepted",
      subjectType: "KnowledgeSuggestion",
      subjectId: suggestion.id,
      actorId: input.actor ?? "knowledge_engineer",
      detail: `Created draft Knowledge Object from suggestion: ${knowledgeObject.title}`,
      metadata: {
        suggestionId: suggestion.id,
        knowledgeObjectId: knowledgeObject.id,
        sourceId: suggestion.sourceId
      }
    });

    return {
      suggestion: mapKnowledgeSuggestion(updatedSuggestion),
      knowledgeObject: (await getKnowledgeObject(knowledgeObject.id)) ?? knowledgeObject
    };
  }

  knowledgeObject.status = "ai_generated";
  knowledgeObject.approvalStatus = "ai_generated";
  const storedSuggestion = workspaceStore().knowledgeSuggestions.find((item) => item.id === suggestion.id);
  if (storedSuggestion) {
    storedSuggestion.status = "accepted";
    storedSuggestion.acceptedKnowledgeObjectId = knowledgeObject.id;
  }
  for (const relationshipSuggestion of workspaceStore().relationshipSuggestions) {
    if (relationshipSuggestion.fromSuggestionId === suggestion.id) {
      relationshipSuggestion.fromAcceptedKnowledgeObjectId = knowledgeObject.id;
    }
    if (relationshipSuggestion.toSuggestionId === suggestion.id) {
      relationshipSuggestion.toAcceptedKnowledgeObjectId = knowledgeObject.id;
    }
  }

  await recordAuditLog({
    action: "pipeline.suggestion_accepted",
    subjectType: "KnowledgeSuggestion",
    subjectId: suggestion.id,
    actorId: input.actor ?? "knowledge_engineer",
    detail: `Created draft Knowledge Object from suggestion: ${knowledgeObject.title}`,
    metadata: {
      suggestionId: suggestion.id,
      knowledgeObjectId: knowledgeObject.id,
      sourceId: suggestion.sourceId
    }
  });

  return {
    suggestion: storedSuggestion ?? suggestion,
    knowledgeObject
  };
}

export async function updateKnowledgeSuggestionStatus(input: KnowledgeSuggestionStatusInput) {
  const suggestion = (await listKnowledgeSuggestions({ status: "all" })).find(
    (item) => item.id === input.suggestionId
  );

  if (!suggestion) {
    throw new Error(`Knowledge suggestion not found: ${input.suggestionId}`);
  }

  if (suggestion.status !== "pending") {
    throw new Error("Only pending KO suggestions can be rejected or deferred.");
  }

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const updatedSuggestion = await getPrismaClient().knowledgeSuggestion.update({
      where: { id: suggestion.id },
      data: {
        status: input.status,
        reviewNotes: input.reviewNotes ?? suggestion.reviewNotes
      },
      include: {
        source: { select: { title: true } }
      }
    });

    await recordAuditLog({
      action: `pipeline.suggestion_${input.status}`,
      subjectType: "KnowledgeSuggestion",
      subjectId: suggestion.id,
      actorId: input.actor ?? "reviewer",
      detail: `Marked KO suggestion as ${input.status}: ${suggestion.title}`,
      metadata: {
        suggestionId: suggestion.id,
        sourceId: suggestion.sourceId,
        reviewNotes: input.reviewNotes
      }
    });

    return mapKnowledgeSuggestion(updatedSuggestion);
  }

  const storedSuggestion = workspaceStore().knowledgeSuggestions.find((item) => item.id === suggestion.id);

  if (storedSuggestion) {
    storedSuggestion.status = input.status;
    storedSuggestion.reviewNotes = input.reviewNotes ?? storedSuggestion.reviewNotes;
  }

  await recordAuditLog({
    action: `pipeline.suggestion_${input.status}`,
    subjectType: "KnowledgeSuggestion",
    subjectId: suggestion.id,
    actorId: input.actor ?? "reviewer",
    detail: `Marked KO suggestion as ${input.status}: ${suggestion.title}`,
    metadata: {
      suggestionId: suggestion.id,
      sourceId: suggestion.sourceId,
      reviewNotes: input.reviewNotes
    }
  });

  return storedSuggestion ?? suggestion;
}

export async function acceptRelationshipSuggestion(input: AcceptRelationshipSuggestionInput) {
  const suggestion = (await listRelationshipSuggestions({ status: "all" })).find(
    (item) => item.id === input.relationshipSuggestionId
  );

  if (!suggestion) {
    throw new Error(`Relationship suggestion not found: ${input.relationshipSuggestionId}`);
  }

  if (suggestion.status === "accepted" && suggestion.acceptedRelationshipId) {
    const existingRelationship = (await listKnowledgeRelationships({ projectId: suggestion.projectId })).find(
      (relationship) => relationship.id === suggestion.acceptedRelationshipId
    );
    if (existingRelationship) {
      return {
        suggestion,
        relationship: existingRelationship
      };
    }
  }

  if (suggestion.status !== "pending") {
    throw new Error("Only pending relationship suggestions can create graph edges.");
  }

  const fromSuggestion = (await listKnowledgeSuggestions({ status: "all" })).find(
    (item) => item.id === suggestion.fromSuggestionId
  );
  const toSuggestion = (await listKnowledgeSuggestions({ status: "all" })).find(
    (item) => item.id === suggestion.toSuggestionId
  );
  const fromId = fromSuggestion?.acceptedKnowledgeObjectId ?? suggestion.fromAcceptedKnowledgeObjectId;
  const toId = toSuggestion?.acceptedKnowledgeObjectId ?? suggestion.toAcceptedKnowledgeObjectId;

  if (!fromId || !toId) {
    throw new Error("Accept both endpoint KO suggestions before accepting a relationship suggestion.");
  }

  const relationship = await createKnowledgeRelationship({
    projectId: suggestion.projectId,
    fromId,
    toId,
    type: suggestion.type,
    confidence: suggestion.confidence,
    provenanceNote: suggestion.rationale
  });

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const updatedSuggestion = await getPrismaClient().relationshipSuggestion.update({
      where: { id: suggestion.id },
      data: {
        status: "accepted",
        acceptedRelationshipId: relationship.id
      },
      include: {
        source: { select: { title: true } },
        fromSuggestion: { select: { title: true, acceptedKnowledgeObjectId: true } },
        toSuggestion: { select: { title: true, acceptedKnowledgeObjectId: true } }
      }
    });

    await recordAuditLog({
      action: "pipeline.relationship_suggestion_accepted",
      subjectType: "RelationshipSuggestion",
      subjectId: suggestion.id,
      actorId: input.actor ?? "knowledge_engineer",
      detail: `Created draft relationship from suggestion: ${relationship.fromTitle} ${relationship.type} ${relationship.toTitle}`,
      metadata: {
        relationshipSuggestionId: suggestion.id,
        relationshipId: relationship.id,
        fromId,
        toId,
        sourceId: suggestion.sourceId
      }
    });

    return {
      suggestion: mapRelationshipSuggestion(updatedSuggestion),
      relationship
    };
  }

  const storedSuggestion = workspaceStore().relationshipSuggestions.find((item) => item.id === suggestion.id);
  if (storedSuggestion) {
    storedSuggestion.status = "accepted";
    storedSuggestion.acceptedRelationshipId = relationship.id;
  }

  await recordAuditLog({
    action: "pipeline.relationship_suggestion_accepted",
    subjectType: "RelationshipSuggestion",
    subjectId: suggestion.id,
    actorId: input.actor ?? "knowledge_engineer",
    detail: `Created draft relationship from suggestion: ${relationship.fromTitle} ${relationship.type} ${relationship.toTitle}`,
    metadata: {
      relationshipSuggestionId: suggestion.id,
      relationshipId: relationship.id,
      fromId,
      toId,
      sourceId: suggestion.sourceId
    }
  });

  return {
    suggestion: storedSuggestion ?? suggestion,
    relationship
  };
}

export async function updateRelationshipSuggestionStatus(input: RelationshipSuggestionStatusInput) {
  const suggestion = (await listRelationshipSuggestions({ status: "all" })).find(
    (item) => item.id === input.relationshipSuggestionId
  );

  if (!suggestion) {
    throw new Error(`Relationship suggestion not found: ${input.relationshipSuggestionId}`);
  }

  if (suggestion.status !== "pending") {
    throw new Error("Only pending relationship suggestions can be rejected or deferred.");
  }

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const updatedSuggestion = await getPrismaClient().relationshipSuggestion.update({
      where: { id: suggestion.id },
      data: {
        status: input.status,
        reviewNotes: input.reviewNotes ?? suggestion.reviewNotes
      },
      include: {
        source: { select: { title: true } },
        fromSuggestion: { select: { title: true, acceptedKnowledgeObjectId: true } },
        toSuggestion: { select: { title: true, acceptedKnowledgeObjectId: true } }
      }
    });

    await recordAuditLog({
      action: `pipeline.relationship_suggestion_${input.status}`,
      subjectType: "RelationshipSuggestion",
      subjectId: suggestion.id,
      actorId: input.actor ?? "reviewer",
      detail: `Marked relationship suggestion as ${input.status}: ${suggestion.fromSuggestionTitle} ${suggestion.type} ${suggestion.toSuggestionTitle}`,
      metadata: {
        relationshipSuggestionId: suggestion.id,
        status: input.status,
        reviewNotes: input.reviewNotes
      }
    });

    return mapRelationshipSuggestion(updatedSuggestion);
  }

  const storedSuggestion = workspaceStore().relationshipSuggestions.find((item) => item.id === suggestion.id);
  if (!storedSuggestion) {
    throw new Error(`Relationship suggestion not found: ${suggestion.id}`);
  }

  storedSuggestion.status = input.status;
  storedSuggestion.reviewNotes = input.reviewNotes ?? storedSuggestion.reviewNotes;

  await recordAuditLog({
    action: `pipeline.relationship_suggestion_${input.status}`,
    subjectType: "RelationshipSuggestion",
    subjectId: suggestion.id,
    actorId: input.actor ?? "reviewer",
    detail: `Marked relationship suggestion as ${input.status}: ${suggestion.fromSuggestionTitle} ${suggestion.type} ${suggestion.toSuggestionTitle}`,
    metadata: {
      relationshipSuggestionId: suggestion.id,
      status: input.status,
      reviewNotes: input.reviewNotes
    }
  });

  return storedSuggestion;
}

export async function createProject(input: ProjectInput) {
  if (usePrismaStore()) {
    const context = await ensureLocalWorkspace();
    const prisma = getPrismaClient();
    const project = await prisma.project.create({
      data: {
        workspaceId: context.workspaceId,
        createdById: context.userIdByRole[input.owner] ?? context.userIdByRole.platform_admin,
        name: input.name,
        domain: input.domain,
        description: input.objective,
        status: "draft"
      },
      include: {
        createdBy: { select: { role: true } },
        workspace: { select: { name: true } },
        _count: { select: { sources: true, knowledgeObjects: true } }
      }
    });

    await createMission({
      type: "discovery",
      title: `Create project: ${project.name}`,
      projectId: project.id,
      assignedTo: input.owner,
      stage: "workspace",
      priority: "normal",
      status: "completed"
    });

    return mapProject(project);
  }

  const id = `kf-${slugify(input.name)}-${Date.now().toString(36)}`;

  const project: ProjectSummary = {
    id,
    name: input.name,
    domain: input.domain,
    status: "draft",
    owner: input.owner,
    workspace: workspace.workspace,
    objective: input.objective,
    sourceCount: 0,
    knowledgeObjectCount: 0,
    readiness: "Foundation"
  };

  workspaceStore().projects.unshift(project);
  createMission({
    type: "discovery",
    title: `Create project: ${project.name}`,
    projectId: project.id,
    assignedTo: input.owner,
    stage: "workspace",
    priority: "normal",
    status: "completed"
  });

  return project;
}

export async function createSource(input: SourceInput) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const source = await getPrismaClient().source.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        sourceType: input.category,
        owner: input.owner,
        version: input.version,
        domain: input.domain,
        reliability: input.reliability,
        reviewStatus: "draft",
        usagePolicy: input.usagePolicy,
        storagePath: input.storagePath,
        processingStatus: "created",
        metadata: {
          boundary: input.boundary
        }
      }
    });

    await createMission({
      type: "acquisition",
      title: `Register source: ${source.title}`,
      projectId: source.projectId,
      assignedTo: input.owner,
      stage: "source-management",
      priority: "normal",
      status: "completed"
    });

    return mapSource(source);
  }

  const id = `src-${slugify(input.title)}-${Date.now().toString(36)}`;

  const source: SourceSummary = {
    id,
    projectId: input.projectId,
    title: input.title,
    category: input.category,
    domain: input.domain,
    owner: input.owner,
    version: input.version,
    reliability: input.reliability,
    reviewStatus: "draft",
    usagePolicy: input.usagePolicy,
    processingStatus: "created",
    boundary: input.boundary,
    storagePath: input.storagePath || `storage/sources/${id}`,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  workspaceStore().sources.unshift(source);
  createMission({
    type: "acquisition",
    title: `Register source: ${source.title}`,
    projectId: source.projectId,
    assignedTo: input.owner,
    stage: "source-management",
    priority: "normal",
    status: "completed"
  });

  return source;
}

export async function createKnowledgeObject(input: KnowledgeObjectInput) {
  const confidence = normaliseConfidence(input.confidence);
  const evidenceConfidence = normaliseConfidence(input.evidenceConfidence);
  const tags = parseTags(input.tags);

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const knowledgeObject = await getPrismaClient().knowledgeObject.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        objectType: input.objectType,
        domain: input.domain,
        description: input.description,
        status: "draft",
        approvalStatus: "draft",
        version: "0.1.0",
        confidence,
        owner: input.owner,
        author: input.author,
        tags,
        metadata: {
          evidenceMode: input.sourceId ? "source_linked" : "expert_manual_input"
        },
        evidenceLinks: input.sourceId
          ? {
              create: {
                sourceId: input.sourceId,
                excerpt: input.evidenceExcerpt,
                locator: input.evidenceLocator,
                confidence: evidenceConfidence
              }
            }
          : undefined
      },
      include: {
        evidenceLinks: {
          include: {
            source: { select: { title: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        outgoingRelationships: {
          include: {
            from: { select: { title: true } },
            to: { select: { title: true } }
          },
          orderBy: { updatedAt: "desc" }
        },
        incomingRelationships: {
          include: {
            from: { select: { title: true } },
            to: { select: { title: true } }
          },
          orderBy: { updatedAt: "desc" }
        }
      }
    });

    await createMission({
      type: "manufacturing",
      title: `Create Knowledge Object: ${knowledgeObject.title}`,
      projectId: knowledgeObject.projectId,
      assignedTo: input.owner,
      stage: "knowledge-object-repository",
      priority: "normal",
      status: "completed"
    });

    return mapKnowledgeObject(knowledgeObject);
  }

  const source = input.sourceId
    ? workspaceStore().sources.find((item) => item.id === input.sourceId)
    : undefined;
  const id = `ko-${slugify(input.title)}-${Date.now().toString(36)}`;
  const knowledgeObject: KnowledgeObjectSummary = {
    id,
    projectId: input.projectId,
    title: input.title,
    objectType: input.objectType,
    domain: input.domain,
    description: input.description,
    status: "draft",
    version: "0.1.0",
    confidence,
    approvalStatus: "draft",
    owner: input.owner,
    author: input.author,
    tags,
    evidenceLinks: source
      ? [
          {
            id: `ev-${slugify(input.title)}-${Date.now().toString(36)}`,
            sourceId: source.id,
            sourceTitle: source.title,
            excerpt: input.evidenceExcerpt,
            locator: input.evidenceLocator,
            confidence: evidenceConfidence
          }
        ]
      : [],
    outgoingRelationships: [],
    incomingRelationships: [],
    createdAt: new Date().toISOString().slice(0, 10)
  };

  workspaceStore().knowledgeObjects.unshift(knowledgeObject);
  const project = workspaceStore().projects.find((item) => item.id === knowledgeObject.projectId);
  if (project) {
    project.knowledgeObjectCount += 1;
  }
  await createMission({
    type: "manufacturing",
    title: `Create Knowledge Object: ${knowledgeObject.title}`,
    projectId: knowledgeObject.projectId,
    assignedTo: input.owner,
    stage: "knowledge-object-repository",
    priority: "normal",
    status: "completed"
  });

  return knowledgeObject;
}

export async function addSourceEvidenceToKnowledgeObject(input: SourceEvidenceInput) {
  const confidence = normaliseConfidence(input.confidence);

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const evidence = await getPrismaClient().sourceEvidence.create({
      data: {
        knowledgeObjectId: input.knowledgeObjectId,
        sourceId: input.sourceId,
        excerpt: input.excerpt,
        locator: input.locator,
        confidence
      },
      include: {
        source: { select: { title: true } }
      }
    });

    await recordAuditLog({
      action: "knowledge_object.evidence_added",
      subjectType: "KnowledgeObject",
      subjectId: input.knowledgeObjectId,
      actorId: input.actor ?? "knowledge_engineer",
      detail: `Added source evidence link: ${evidence.source.title}`,
      metadata: {
        knowledgeObjectId: input.knowledgeObjectId,
        sourceId: input.sourceId,
        evidenceId: evidence.id
      }
    });

    return mapEvidenceLink(evidence);
  }

  const knowledgeObject = workspaceStore().knowledgeObjects.find(
    (item) => item.id === input.knowledgeObjectId
  );
  const source = workspaceStore().sources.find((item) => item.id === input.sourceId);

  if (!knowledgeObject || !source) {
    throw new Error("Knowledge Object and source are required for evidence remediation.");
  }

  const evidence: SourceEvidenceSummary = {
    id: `ev-${slugify(`${knowledgeObject.title}-${source.title}`)}-${Date.now().toString(36)}`,
    sourceId: source.id,
    sourceTitle: source.title,
    excerpt: input.excerpt,
    locator: input.locator,
    confidence
  };

  knowledgeObject.evidenceLinks.unshift(evidence);
  await recordAuditLog({
    action: "knowledge_object.evidence_added",
    subjectType: "KnowledgeObject",
    subjectId: knowledgeObject.id,
    actorId: input.actor ?? "knowledge_engineer",
    detail: `Added source evidence link: ${source.title}`,
    metadata: {
      knowledgeObjectId: knowledgeObject.id,
      sourceId: source.id,
      evidenceId: evidence.id
    }
  });

  return evidence;
}

async function recordAuditLog(input: AuditLogInput) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const auditLog = await getPrismaClient().auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        metadata: {
          ...input.metadata,
          detail: input.detail
        }
      }
    });

    return mapAuditLog(auditLog);
  }

  const auditLog: GovernanceEventSummary & { metadata?: Record<string, unknown> } = {
    id: `aud-${slugify(input.action)}-${Date.now().toString(36)}`,
    actorId: input.actorId,
    action: input.action,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    detail: input.detail,
    metadata: input.metadata,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  workspaceStore().auditLogs.unshift(auditLog);

  return auditLog;
}

async function recordKnowledgeObjectVersionSnapshot(input: KnowledgeObjectSnapshotInput) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const version = await getPrismaClient().knowledgeObjectVersion.create({
      data: {
        knowledgeObjectId: input.knowledgeObjectId,
        version: input.version,
        title: input.title,
        objectType: input.objectType,
        domain: input.domain,
        description: input.description,
        status: input.status,
        confidence: input.confidence,
        tags: input.tags,
        actorId: input.actorId,
        snapshotReason: input.snapshotReason
      }
    });

    await recordAuditLog({
      action: "knowledge_object.version_snapshot",
      subjectType: "KnowledgeObject",
      subjectId: input.knowledgeObjectId,
      actorId: input.actorId,
      detail: `Captured version ${input.version} before Knowledge Object edit: ${input.title}`,
      metadata: {
        knowledgeObjectId: input.knowledgeObjectId,
        version: input.version,
        title: input.title,
        status: input.status,
        snapshotReason: input.snapshotReason
      }
    });

    return mapKnowledgeObjectVersion(version);
  }

  const snapshot: KnowledgeObjectVersionSnapshotSummary = {
    id: `ver-${slugify(input.knowledgeObjectId)}-${Date.now().toString(36)}`,
    knowledgeObjectId: input.knowledgeObjectId,
    version: input.version,
    title: input.title,
    objectType: input.objectType,
    domain: input.domain,
    description: input.description,
    status: input.status,
    confidence: input.confidence,
    tags: input.tags,
    snapshotReason: input.snapshotReason,
    actorId: input.actorId,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  workspaceStore().versionSnapshots.unshift(snapshot);

  await recordAuditLog({
    action: "knowledge_object.version_snapshot",
    subjectType: "KnowledgeObject",
    subjectId: input.knowledgeObjectId,
    actorId: input.actorId,
    detail: `Captured version ${input.version} before Knowledge Object edit: ${input.title}`,
    metadata: {
      knowledgeObjectId: input.knowledgeObjectId,
      version: input.version,
      title: input.title,
      objectType: input.objectType,
      domain: input.domain,
      description: input.description,
      status: input.status,
      snapshotReason: input.snapshotReason
    }
  });

  return snapshot;
}

export async function updateKnowledgeObject(input: KnowledgeObjectUpdateInput) {
  const confidence = normaliseConfidence(input.confidence);
  const tags = parseTags(input.tags);

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const existing = await getPrismaClient().knowledgeObject.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        title: true,
        objectType: true,
        domain: true,
        description: true,
        status: true,
        version: true,
        confidence: true,
        tags: true
      }
    });

    if (!existing) {
      throw new Error(`Knowledge Object not found: ${input.id}`);
    }

    if (!editableKnowledgeObject(existing.status as LifecycleState)) {
      throw new Error(`Knowledge Object is locked for editing: ${input.id}`);
    }

    await recordKnowledgeObjectVersionSnapshot({
      knowledgeObjectId: existing.id,
      version: existing.version,
      title: existing.title,
      objectType: existing.objectType as KnowledgeObjectSummary["objectType"],
      domain: existing.domain,
      description: existing.description,
      status: existing.status as LifecycleState,
      confidence: decimalToNumber(existing.confidence),
      tags: existing.tags,
      snapshotReason: "before_edit",
      actorId: input.owner
    });

    const knowledgeObject = await getPrismaClient().knowledgeObject.update({
      where: { id: input.id },
      data: {
        title: input.title,
        objectType: input.objectType,
        domain: input.domain,
        description: input.description,
        version: bumpPatchVersion(existing.version),
        confidence,
        owner: input.owner,
        author: input.author,
        tags
      },
      include: {
        evidenceLinks: {
          include: {
            source: { select: { title: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        outgoingRelationships: {
          include: {
            from: { select: { title: true } },
            to: { select: { title: true } }
          },
          orderBy: { updatedAt: "desc" }
        },
        incomingRelationships: {
          include: {
            from: { select: { title: true } },
            to: { select: { title: true } }
          },
          orderBy: { updatedAt: "desc" }
        }
      }
    });

    const mappedKnowledgeObject = mapKnowledgeObject(knowledgeObject);
    await recordAuditLog({
      action: "knowledge_object.updated",
      subjectType: "KnowledgeObject",
      subjectId: mappedKnowledgeObject.id,
      actorId: input.owner,
      detail: `Edited Knowledge Object: ${mappedKnowledgeObject.title}`,
      metadata: {
        knowledgeObjectId: mappedKnowledgeObject.id,
        status: mappedKnowledgeObject.status
      }
    });

    return mappedKnowledgeObject;
  }

  const knowledgeObject = workspaceStore().knowledgeObjects.find((item) => item.id === input.id);

  if (!knowledgeObject) {
    throw new Error(`Knowledge Object not found: ${input.id}`);
  }

  if (!editableKnowledgeObject(knowledgeObject.status)) {
    throw new Error(`Knowledge Object is locked for editing: ${input.id}`);
  }

  await recordKnowledgeObjectVersionSnapshot({
    knowledgeObjectId: knowledgeObject.id,
    version: knowledgeObject.version,
    title: knowledgeObject.title,
    objectType: knowledgeObject.objectType,
    domain: knowledgeObject.domain,
    description: knowledgeObject.description,
    status: knowledgeObject.status,
    confidence: knowledgeObject.confidence,
    tags: knowledgeObject.tags,
    snapshotReason: "before_edit",
    actorId: input.owner
  });

  knowledgeObject.title = input.title;
  knowledgeObject.objectType = input.objectType;
  knowledgeObject.domain = input.domain;
  knowledgeObject.description = input.description;
  knowledgeObject.version = bumpPatchVersion(knowledgeObject.version);
  knowledgeObject.confidence = confidence;
  knowledgeObject.owner = input.owner;
  knowledgeObject.author = input.author;
  knowledgeObject.tags = tags;
  await recordAuditLog({
    action: "knowledge_object.updated",
    subjectType: "KnowledgeObject",
    subjectId: knowledgeObject.id,
    actorId: input.owner,
    detail: `Edited Knowledge Object: ${knowledgeObject.title}`,
    metadata: {
      knowledgeObjectId: knowledgeObject.id,
      status: knowledgeObject.status
    }
  });

  return knowledgeObject;
}

export async function updateKnowledgeObjectStatus(input: KnowledgeObjectStatusInput) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const knowledgeObject = await getPrismaClient().knowledgeObject.update({
      where: { id: input.id },
      data: {
        status: input.status,
        approvalStatus: input.status,
        reviewer: input.reviewer,
        approvedAt: input.status === "approved" ? new Date() : undefined
      },
      include: {
        evidenceLinks: {
          include: {
            source: { select: { title: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        outgoingRelationships: {
          include: {
            from: { select: { title: true } },
            to: { select: { title: true } }
          },
          orderBy: { updatedAt: "desc" }
        },
        incomingRelationships: {
          include: {
            from: { select: { title: true } },
            to: { select: { title: true } }
          },
          orderBy: { updatedAt: "desc" }
        }
      }
    });

    await createMission({
      type: "validation",
      title: `Transition Knowledge Object: ${knowledgeObject.title} -> ${input.status}`,
      projectId: knowledgeObject.projectId,
      assignedTo: input.reviewer ?? "reviewer",
      stage: "knowledge-object-governance",
      priority: "normal",
      status: "completed"
    });

    const mappedKnowledgeObject = mapKnowledgeObject(knowledgeObject);
    await recordAuditLog({
      action: "knowledge_object.transitioned",
      subjectType: "KnowledgeObject",
      subjectId: mappedKnowledgeObject.id,
      actorId: input.reviewer ?? "reviewer",
      detail: `Transitioned Knowledge Object to ${input.status}: ${mappedKnowledgeObject.title}`,
      metadata: {
        knowledgeObjectId: mappedKnowledgeObject.id,
        status: input.status
      }
    });

    return mappedKnowledgeObject;
  }

  const knowledgeObject = workspaceStore().knowledgeObjects.find((item) => item.id === input.id);

  if (!knowledgeObject) {
    throw new Error(`Knowledge Object not found: ${input.id}`);
  }

  knowledgeObject.status = input.status;
  knowledgeObject.approvalStatus = input.status;
  knowledgeObject.reviewer = input.reviewer;
  await recordAuditLog({
    action: "knowledge_object.transitioned",
    subjectType: "KnowledgeObject",
    subjectId: knowledgeObject.id,
    actorId: input.reviewer ?? "reviewer",
    detail: `Transitioned Knowledge Object to ${input.status}: ${knowledgeObject.title}`,
    metadata: {
      knowledgeObjectId: knowledgeObject.id,
      status: input.status
    }
  });

  await createMission({
    type: "validation",
    title: `Transition Knowledge Object: ${knowledgeObject.title} -> ${input.status}`,
    projectId: knowledgeObject.projectId,
    assignedTo: input.reviewer ?? "reviewer",
    stage: "knowledge-object-governance",
    priority: "normal",
    status: "completed"
  });

  return knowledgeObject;
}

export async function createReviewDecision(input: ReviewDecisionInput) {
  if (usePrismaStore()) {
    const context = await ensureLocalWorkspace();
    const reviewerId = context.userIdByRole[input.reviewer] ?? context.userIdByRole.reviewer;
    const prisma = getPrismaClient();
    const knowledgeObject = await prisma.knowledgeObject.update({
      where: { id: input.knowledgeObjectId },
      data: {
        status: input.decision,
        approvalStatus: input.decision,
        reviewer: input.reviewer,
        approvedAt: input.decision === "approved" ? new Date() : null
      },
      include: {
        evidenceLinks: {
          include: {
            source: { select: { title: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        outgoingRelationships: {
          include: {
            from: { select: { title: true } },
            to: { select: { title: true } }
          },
          orderBy: { updatedAt: "desc" }
        },
        incomingRelationships: {
          include: {
            from: { select: { title: true } },
            to: { select: { title: true } }
          },
          orderBy: { updatedAt: "desc" }
        }
      }
    });

    const review = await prisma.review.create({
      data: {
        knowledgeObjectId: input.knowledgeObjectId,
        reviewerId,
        decision: input.decision,
        notes: input.notes
      },
      include: {
        knowledgeObject: { select: { projectId: true, title: true } },
        reviewer: { select: { role: true } }
      }
    });

    await recordAuditLog({
      action: "knowledge_object.reviewed",
      subjectType: "KnowledgeObject",
      subjectId: input.knowledgeObjectId,
      actorId: input.reviewer,
      detail: `Review decision ${input.decision}: ${knowledgeObject.title}`,
      metadata: {
        knowledgeObjectId: input.knowledgeObjectId,
        decision: input.decision,
        notes: input.notes
      }
    });

    await createMission({
      type: "validation",
      title: `Review Knowledge Object: ${knowledgeObject.title} -> ${input.decision}`,
      projectId: knowledgeObject.projectId,
      assignedTo: input.reviewer,
      stage: "review-queue",
      priority: "normal",
      status: "completed"
    });

    return {
      knowledgeObject: mapKnowledgeObject(knowledgeObject),
      review: mapReview(review)
    };
  }

  const knowledgeObject = workspaceStore().knowledgeObjects.find(
    (item) => item.id === input.knowledgeObjectId
  );

  if (!knowledgeObject) {
    throw new Error(`Knowledge Object not found: ${input.knowledgeObjectId}`);
  }

  knowledgeObject.status = input.decision;
  knowledgeObject.approvalStatus = input.decision;
  knowledgeObject.reviewer = input.reviewer;

  const review: ReviewSummary = {
    id: `rev-${slugify(knowledgeObject.title)}-${Date.now().toString(36)}`,
    knowledgeObjectId: knowledgeObject.id,
    knowledgeObjectTitle: knowledgeObject.title,
    reviewerId: input.reviewer,
    reviewerRole: input.reviewer,
    decision: input.decision,
    notes: input.notes,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  workspaceStore().reviews.unshift(review);

  await recordAuditLog({
    action: "knowledge_object.reviewed",
    subjectType: "KnowledgeObject",
    subjectId: knowledgeObject.id,
    actorId: input.reviewer,
    detail: `Review decision ${input.decision}: ${knowledgeObject.title}`,
    metadata: {
      knowledgeObjectId: knowledgeObject.id,
      decision: input.decision,
      notes: input.notes
    }
  });

  await createMission({
    type: "validation",
    title: `Review Knowledge Object: ${knowledgeObject.title} -> ${input.decision}`,
    projectId: knowledgeObject.projectId,
    assignedTo: input.reviewer,
    stage: "review-queue",
    priority: "normal",
    status: "completed"
  });

  return {
    knowledgeObject,
    review
  };
}

export async function createKnowledgeRelationship(input: KnowledgeRelationshipInput) {
  const confidence = normaliseConfidence(input.confidence);

  if (input.fromId === input.toId) {
    throw new Error("A Knowledge Object cannot relate to itself");
  }

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const [from, to] = await Promise.all([
      getPrismaClient().knowledgeObject.findUnique({
        where: { id: input.fromId },
        select: { id: true, projectId: true, title: true }
      }),
      getPrismaClient().knowledgeObject.findUnique({
        where: { id: input.toId },
        select: { id: true, projectId: true, title: true }
      })
    ]);

    if (!from || !to) {
      throw new Error("Both relationship endpoints must exist");
    }

    if (from.projectId !== input.projectId || to.projectId !== input.projectId) {
      throw new Error("Relationship endpoints must belong to the selected project");
    }

    const relationship = await getPrismaClient().knowledgeRelationship.create({
      data: {
        projectId: input.projectId,
        fromId: input.fromId,
        toId: input.toId,
        type: input.type,
        status: "draft",
        confidence,
        provenance: {
          note: input.provenanceNote
        }
      },
      include: {
        from: { select: { title: true } },
        to: { select: { title: true } }
      }
    });

    await createMission({
      type: "manufacturing",
      title: `Link Knowledge Objects: ${from.title} ${input.type} ${to.title}`,
      projectId: input.projectId,
      assignedTo: "knowledge_engineer",
      stage: "knowledge-relationship-graph",
      priority: "normal",
      status: "completed"
    });

    const mappedRelationship = mapKnowledgeRelationship(relationship);
    await recordAuditLog({
      action: "knowledge_relationship.created",
      subjectType: "KnowledgeRelationship",
      subjectId: mappedRelationship.id,
      actorId: "knowledge_engineer",
      detail: `Linked Knowledge Objects: ${from.title} ${input.type} ${to.title}`,
      metadata: {
        relationshipId: mappedRelationship.id,
        fromId: from.id,
        toId: to.id,
        relationshipType: input.type
      }
    });

    return mappedRelationship;
  }

  const from = workspaceStore().knowledgeObjects.find((item) => item.id === input.fromId);
  const to = workspaceStore().knowledgeObjects.find((item) => item.id === input.toId);

  if (!from || !to) {
    throw new Error("Both relationship endpoints must exist");
  }

  if (from.projectId !== input.projectId || to.projectId !== input.projectId) {
    throw new Error("Relationship endpoints must belong to the selected project");
  }

  const relationship: KnowledgeRelationshipSummary = {
    id: `rel-${slugify(`${from.title}-${input.type}-${to.title}`)}-${Date.now().toString(36)}`,
    projectId: input.projectId,
    fromId: input.fromId,
    fromTitle: from.title,
    toId: input.toId,
    toTitle: to.title,
    type: input.type,
    status: "draft",
    confidence,
    provenanceNote: input.provenanceNote,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  workspaceStore().knowledgeRelationships.unshift(relationship);
  from.outgoingRelationships.unshift(relationship);
  to.incomingRelationships.unshift(relationship);
  await recordAuditLog({
    action: "knowledge_relationship.created",
    subjectType: "KnowledgeRelationship",
    subjectId: relationship.id,
    actorId: "knowledge_engineer",
    detail: `Linked Knowledge Objects: ${from.title} ${input.type} ${to.title}`,
    metadata: {
      relationshipId: relationship.id,
      fromId: from.id,
      toId: to.id,
      relationshipType: input.type
    }
  });

  await createMission({
    type: "manufacturing",
    title: `Link Knowledge Objects: ${from.title} ${input.type} ${to.title}`,
    projectId: input.projectId,
    assignedTo: "knowledge_engineer",
    stage: "knowledge-relationship-graph",
    priority: "normal",
    status: "completed"
  });

  return relationship;
}

export async function updateKnowledgeRelationshipProvenance(input: KnowledgeRelationshipProvenanceInput) {
  const confidence = normaliseConfidence(input.confidence);
  const status = input.status ?? "draft";

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const existingRelationship = await getPrismaClient().knowledgeRelationship.findUnique({
      where: { id: input.relationshipId },
      select: { provenance: true }
    });
    const relationship = await getPrismaClient().knowledgeRelationship.update({
      where: { id: input.relationshipId },
      data: {
        confidence,
        status,
        provenance: {
          ...provenanceRecord(existingRelationship?.provenance),
          note: input.provenanceNote
        }
      },
      include: {
        from: { select: { title: true } },
        to: { select: { title: true } }
      }
    });

    const mappedRelationship = mapKnowledgeRelationship(relationship);
    await recordAuditLog({
      action: "knowledge_relationship.provenance_updated",
      subjectType: "KnowledgeRelationship",
      subjectId: mappedRelationship.id,
      actorId: input.actor ?? "knowledge_engineer",
      detail: `Updated relationship provenance: ${mappedRelationship.fromTitle} ${mappedRelationship.type} ${mappedRelationship.toTitle}`,
      metadata: {
        relationshipId: mappedRelationship.id,
        fromId: mappedRelationship.fromId,
        toId: mappedRelationship.toId,
        relationshipType: mappedRelationship.type
      }
    });

    return mappedRelationship;
  }

  const relationship = workspaceStore().knowledgeRelationships.find(
    (item) => item.id === input.relationshipId
  );

  if (!relationship) {
    throw new Error(`Knowledge relationship not found: ${input.relationshipId}`);
  }

  relationship.confidence = confidence;
  relationship.status = status;
  relationship.provenanceNote = input.provenanceNote;

  await recordAuditLog({
    action: "knowledge_relationship.provenance_updated",
    subjectType: "KnowledgeRelationship",
    subjectId: relationship.id,
    actorId: input.actor ?? "knowledge_engineer",
    detail: `Updated relationship provenance: ${relationship.fromTitle} ${relationship.type} ${relationship.toTitle}`,
    metadata: {
      relationshipId: relationship.id,
      fromId: relationship.fromId,
      toId: relationship.toId,
      relationshipType: relationship.type
    }
  });

  return relationship;
}

export async function attachSourceEvidenceToKnowledgeRelationship(input: KnowledgeRelationshipEvidenceInput) {
  const confidence = normaliseConfidence(input.confidence);

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const [relationshipRecord, source] = await Promise.all([
      getPrismaClient().knowledgeRelationship.findUnique({
        where: { id: input.relationshipId },
        select: { provenance: true }
      }),
      getPrismaClient().source.findUnique({
        where: { id: input.sourceId },
        select: { title: true }
      })
    ]);

    if (!relationshipRecord || !source) {
      throw new Error("Knowledge relationship and source are required for relationship evidence remediation.");
    }

    const relationship = await getPrismaClient().knowledgeRelationship.update({
      where: { id: input.relationshipId },
      data: {
        provenance: {
          ...provenanceRecord(relationshipRecord.provenance),
          sourceEvidence: {
            sourceId: input.sourceId,
            sourceTitle: source.title,
            excerpt: input.excerpt,
            locator: input.locator,
            confidence
          }
        }
      },
      include: {
        from: { select: { title: true } },
        to: { select: { title: true } }
      }
    });

    const mappedRelationship = mapKnowledgeRelationship(relationship);
    await recordAuditLog({
      action: "knowledge_relationship.evidence_attached",
      subjectType: "KnowledgeRelationship",
      subjectId: mappedRelationship.id,
      actorId: input.actor ?? "knowledge_engineer",
      detail: `Attached relationship source evidence: ${source.title}`,
      metadata: {
        relationshipId: mappedRelationship.id,
        sourceId: input.sourceId,
        fromId: mappedRelationship.fromId,
        toId: mappedRelationship.toId,
        relationshipType: mappedRelationship.type
      }
    });

    return mappedRelationship;
  }

  const relationship = workspaceStore().knowledgeRelationships.find(
    (item) => item.id === input.relationshipId
  );
  const source = workspaceStore().sources.find((item) => item.id === input.sourceId);

  if (!relationship || !source) {
    throw new Error("Knowledge relationship and source are required for relationship evidence remediation.");
  }

  relationship.evidenceSourceId = source.id;
  relationship.evidenceSourceTitle = source.title;
  relationship.evidenceExcerpt = input.excerpt;
  relationship.evidenceLocator = input.locator;
  relationship.evidenceConfidence = confidence;

  await recordAuditLog({
    action: "knowledge_relationship.evidence_attached",
    subjectType: "KnowledgeRelationship",
    subjectId: relationship.id,
    actorId: input.actor ?? "knowledge_engineer",
    detail: `Attached relationship source evidence: ${source.title}`,
    metadata: {
      relationshipId: relationship.id,
      sourceId: source.id,
      fromId: relationship.fromId,
      toId: relationship.toId,
      relationshipType: relationship.type
    }
  });

  return relationship;
}

export async function assemblePkaPackage(input: PkaPackageInput) {
  const project = (await listProjects()).find((item) => item.id === input.projectId);

  if (!project) {
    throw new Error(`Project not found: ${input.projectId}`);
  }

  const releaseReadinessHints = await getPkaReleaseReadinessHints(input.projectId);
  const blockers = releaseReadinessHints.filter((hint) => hint.level === "warning");

  if (blockers.length > 0) {
    throw new Error("PKA package assembly is blocked by governance readiness checks.");
  }

  const exportPreview = await buildPkaPackageExportPreview({
    projectId: input.projectId,
    name: input.name,
    version: input.version,
    publisher: input.publisher
  });
  const manifest = exportPreview?.files.find((file) => file.path === "manifest.json")?.contents;

  if (!exportPreview || !manifest) {
    throw new Error("PKA package export preview could not be assembled.");
  }
  const packages = await listPkaPackages(input.projectId);
  const existingPackage = packages.find((pkaPackage) => pkaPackage.packageId === exportPreview.packageId);
  const previousPackage = packages.find((pkaPackage) => pkaPackage.packageId !== exportPreview.packageId);

  if (existingPackage?.status === "published") {
    throw new Error("Published PKA package exports are immutable. Create a new package version instead.");
  }

  if (existingPackage && !input.confirmReplacement) {
    throw new Error("Confirm replacement before overwriting an existing draft package version.");
  }

  const persistedManifest = JSON.parse(JSON.stringify(manifest));
  await persistPkaPackageExportPreview(exportPreview);

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const pkaPackage = existingPackage
      ? await getPrismaClient().pkaPackage.update({
          where: { id: existingPackage.id },
          data: {
            name: input.name,
            domain: project.domain,
            status: "draft",
            manifest: persistedManifest,
            exportPath: exportPreview.exportRoot,
            replacementSequence: existingPackage.replacementSequence + 1
          }
        })
      : await getPrismaClient().pkaPackage.create({
          data: {
            projectId: input.projectId,
            packageId: exportPreview.packageId,
            name: input.name,
            version: input.version,
            domain: project.domain,
            status: "draft",
            manifest: persistedManifest,
            exportPath: exportPreview.exportRoot,
            replacementOfPackageId: previousPackage?.packageId
          }
        });

    await createMission({
      type: "publishing",
      title: `${existingPackage ? "Replace" : "Assemble"} PKA package: ${input.name} ${input.version}`,
      projectId: input.projectId,
      assignedTo: input.publisher,
      stage: "pka-builder",
      priority: "normal",
      status: "completed"
    });

    await recordAuditLog({
      action: existingPackage ? "pka_package.replaced" : "pka_package.assembled",
      subjectType: "PkaPackage",
      subjectId: pkaPackage.id,
      actorId: input.publisher,
      detail: `${existingPackage ? "Replaced" : "Assembled"} draft PKA package: ${pkaPackage.packageId}`,
      metadata: {
        packageId: pkaPackage.packageId,
        version: pkaPackage.version,
        replacementSequence: pkaPackage.replacementSequence
      }
    });

    await refreshPersistedPkaPackageExport({
      projectId: pkaPackage.projectId,
      name: pkaPackage.name,
      version: pkaPackage.version,
      publisher: input.publisher
    });

    return mapPkaPackage(pkaPackage);
  }

  const pkaPackage: PkaPackageSummary = existingPackage
    ? {
        ...existingPackage,
        name: input.name,
        domain: project.domain,
        status: "draft",
        manifest: persistedManifest as Record<string, unknown>,
        exportPath: exportPreview.exportRoot,
        replacementSequence: existingPackage.replacementSequence + 1
      }
    : {
        id: `pkg-${slugify(input.name)}-${Date.now().toString(36)}`,
        projectId: input.projectId,
        packageId: exportPreview.packageId,
        name: input.name,
        version: input.version,
        domain: project.domain,
        status: "draft",
        manifest: persistedManifest as Record<string, unknown>,
        exportPath: exportPreview.exportRoot,
        replacementOfPackageId: previousPackage?.packageId,
        replacementSequence: 0,
        createdAt: new Date().toISOString().slice(0, 10)
      };

  if (existingPackage) {
    const packageIndex = workspaceStore().pkaPackages.findIndex((item) => item.id === existingPackage.id);
    if (packageIndex >= 0) {
      workspaceStore().pkaPackages.splice(packageIndex, 1);
    }
  }
  workspaceStore().pkaPackages.unshift(pkaPackage);
  await createMission({
    type: "publishing",
    title: `${existingPackage ? "Replace" : "Assemble"} PKA package: ${input.name} ${input.version}`,
    projectId: input.projectId,
    assignedTo: input.publisher,
    stage: "pka-builder",
    priority: "normal",
    status: "completed"
  });

  await recordAuditLog({
    action: existingPackage ? "pka_package.replaced" : "pka_package.assembled",
    subjectType: "PkaPackage",
    subjectId: pkaPackage.id,
    actorId: input.publisher,
    detail: `${existingPackage ? "Replaced" : "Assembled"} draft PKA package: ${pkaPackage.packageId}`,
    metadata: {
      packageId: pkaPackage.packageId,
      version: pkaPackage.version,
      replacementSequence: pkaPackage.replacementSequence
    }
  });

  await refreshPersistedPkaPackageExport({
    projectId: pkaPackage.projectId,
    name: pkaPackage.name,
    version: pkaPackage.version,
    publisher: input.publisher
  });

  return pkaPackage;
}

export async function updatePkaPackageReleaseStatus(input: PkaPackageReleaseStatusInput) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();

    const existingPackage = await getPrismaClient().pkaPackage.findUnique({
      where: { id: input.packageRecordId }
    });

    if (!existingPackage) {
      throw new Error(`PKA package not found: ${input.packageRecordId}`);
    }

    if (existingPackage.status === "published") {
      throw new Error("Published PKA package exports are immutable.");
    }

    if (input.status === "approved" && existingPackage.status !== "under_review") {
      throw new Error("Submit package for release review before approval.");
    }

    if (
      (input.status === "changes_requested" || input.status === "rejected") &&
      existingPackage.status !== "under_review"
    ) {
      throw new Error("Only packages under release review can receive changes requested or rejected decisions.");
    }

    const pkaPackage = await getPrismaClient().pkaPackage.update({
      where: { id: input.packageRecordId },
      data: {
        status: input.status
      }
    });

    await recordAuditLog({
      action: `pka_package.${input.status}`,
      subjectType: "PkaPackage",
      subjectId: pkaPackage.id,
      actorId: input.actor,
      detail: `${releaseDecisionDetail(input.status, input.notes)}: ${pkaPackage.packageId}`,
      metadata: {
        packageId: pkaPackage.packageId,
        version: pkaPackage.version,
        notes: input.notes
      }
    });

    await refreshPersistedPkaPackageExport({
      projectId: pkaPackage.projectId,
      name: pkaPackage.name,
      version: pkaPackage.version,
      publisher: input.actor
    });

    return mapPkaPackage(pkaPackage);
  }

  const pkaPackage = workspaceStore().pkaPackages.find((item) => item.id === input.packageRecordId);

  if (!pkaPackage) {
    throw new Error(`PKA package not found: ${input.packageRecordId}`);
  }

  if (pkaPackage.status === "published") {
    throw new Error("Published PKA package exports are immutable.");
  }

  if (input.status === "approved" && pkaPackage.status !== "under_review") {
    throw new Error("Submit package for release review before approval.");
  }

  if ((input.status === "changes_requested" || input.status === "rejected") && pkaPackage.status !== "under_review") {
    throw new Error("Only packages under release review can receive changes requested or rejected decisions.");
  }

  pkaPackage.status = input.status;

  await recordAuditLog({
    action: `pka_package.${input.status}`,
    subjectType: "PkaPackage",
    subjectId: pkaPackage.id,
    actorId: input.actor,
    detail: `${releaseDecisionDetail(input.status, input.notes)}: ${pkaPackage.packageId}`,
    metadata: {
      packageId: pkaPackage.packageId,
      version: pkaPackage.version,
      notes: input.notes
    }
  });

  await refreshPersistedPkaPackageExport({
    projectId: pkaPackage.projectId,
    name: pkaPackage.name,
    version: pkaPackage.version,
    publisher: input.actor
  });

  return pkaPackage;
}

export async function publishPkaPackage(input: PkaPackagePublishInput | string) {
  const packageRecordId = typeof input === "string" ? input : input.packageRecordId;
  const actor = typeof input === "string" ? "publisher" : input.actor ?? "publisher";
  const notes = typeof input === "string" ? undefined : input.notes;

  if (usePrismaStore()) {
    await ensureLocalWorkspace();

    const existingPackage = await getPrismaClient().pkaPackage.findUnique({
      where: { id: packageRecordId }
    });

    if (!existingPackage) {
      throw new Error(`PKA package not found: ${packageRecordId}`);
    }

    if (existingPackage.status !== "approved") {
      throw new Error("Approve PKA package release before publishing.");
    }

    const pkaPackage = await getPrismaClient().pkaPackage.update({
      where: { id: packageRecordId },
      data: {
        status: "published",
        publishedAt: new Date()
      }
    });

    await recordAuditLog({
      action: "pka_package.published",
      subjectType: "PkaPackage",
      subjectId: pkaPackage.id,
      actorId: actor,
      detail: `Published PKA package: ${pkaPackage.packageId}`,
      metadata: {
        packageId: pkaPackage.packageId,
        version: pkaPackage.version,
        notes
      }
    });

    await refreshPersistedPkaPackageExport({
      projectId: pkaPackage.projectId,
      name: pkaPackage.name,
      version: pkaPackage.version,
      publisher: actor
    });

    return mapPkaPackage(pkaPackage);
  }

  const pkaPackage = workspaceStore().pkaPackages.find((item) => item.id === packageRecordId);

  if (!pkaPackage) {
    throw new Error(`PKA package not found: ${packageRecordId}`);
  }

  if (pkaPackage.status !== "approved") {
    throw new Error("Approve PKA package release before publishing.");
  }

  pkaPackage.status = "published";
  pkaPackage.publishedAt = new Date().toISOString().slice(0, 10);

  await recordAuditLog({
    action: "pka_package.published",
    subjectType: "PkaPackage",
    subjectId: pkaPackage.id,
    actorId: actor,
    detail: `Published PKA package: ${pkaPackage.packageId}`,
    metadata: {
      packageId: pkaPackage.packageId,
      version: pkaPackage.version,
      notes
    }
  });

  await refreshPersistedPkaPackageExport({
    projectId: pkaPackage.projectId,
    name: pkaPackage.name,
    version: pkaPackage.version,
    publisher: actor
  });

  return pkaPackage;
}

export async function createMission(input: MissionInput) {
  if (usePrismaStore()) {
    const context = await ensureLocalWorkspace();
    const mission = await getPrismaClient().mission.create({
      data: {
        workspaceId: context.workspaceId,
        projectId: input.projectId,
        createdById: context.userIdByRole.platform_admin,
        assignedToId: context.userIdByRole[input.assignedTo] ?? context.userIdByRole.platform_admin,
        type: input.type,
        status: input.status ?? "created",
        objective: input.title,
        stage: input.stage,
        priority: priorityToNumber(input.priority)
      },
      include: {
        assignedTo: { select: { role: true } }
      }
    });

    return mapMission(mission);
  }

  const mission: MissionSummary = {
    id: `mis-${slugify(input.title)}-${Date.now().toString(36)}`,
    type: input.type,
    title: input.title,
    status: input.status ?? "created",
    projectId: input.projectId,
    assignedTo: input.assignedTo,
    stage: input.stage,
    priority: input.priority
  };

  workspaceStore().missions.unshift(mission);

  return mission;
}

export async function updateMissionStatus(id: string, status: MissionStatus) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const mission = await getPrismaClient().mission.update({
      where: { id },
      data: { status },
      include: {
        assignedTo: { select: { role: true } }
      }
    });

    return mapMission(mission);
  }

  const mission = workspaceStore().missions.find((item) => item.id === id);

  if (!mission) {
    throw new Error(`Mission not found: ${id}`);
  }

  mission.status = status;

  return mission;
}
