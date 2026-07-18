import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { FakeModelProvider } from "@kf/ai";
import type { LifecycleState, MissionStatus, MissionType, RelationshipType, Role } from "@kf/core";
import { relationshipTypes } from "@kf/core";
import { getPrismaClient } from "@kf/db";
import type { PkaComponentManifestEntry, PkaContextBundle } from "@kf/pka";
import { pkaPackageFolders } from "@kf/pka";
import type {
  GovernanceEventSummary,
  RfqEvidenceCategory,
  RfqEvidenceRegisterEntrySummary,
  RfqEvidenceStatus,
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

export type RepairSourceArtifactInput = {
  sourceId: string;
  actor?: string;
  repairText?: string;
  repairPath?: string;
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

export type ManufacturingLineStageId =
  | "source_intake"
  | "preparation_extraction"
  | "ko_manufacturing"
  | "relationship_evidence"
  | "human_governance"
  | "pka_assembly"
  | "release_publication"
  | "runtime_handoff"
  | "consumption_validation"
  | "continuous_improvement";

export type ManufacturingLineStageStatus = "ready" | "building" | "blocked";

export type ManufacturingLineStage = {
  id: ManufacturingLineStageId;
  stageNumber: number;
  title: string;
  status: ManufacturingLineStageStatus;
  capability: string;
  genericRequirement: string;
  validationArticle: string;
  metric: string;
  detail: string;
  href: string;
};

export type ManufacturingLineRunReport = {
  projectId: string;
  projectName: string;
  status: ManufacturingLineStageStatus;
  validationArticle: string;
  summary: {
    readyStageCount: number;
    buildingStageCount: number;
    blockedStageCount: number;
    sourceCount: number;
    chunkCount: number;
    approvedKnowledgeObjectCount: number;
    approvedRelationshipCount: number;
    latestPackageStatus?: LifecycleState;
    latestPackageId?: string;
    runtimeImportStatus?: RuntimePkaImportReport["status"];
    runtimeHandoffDecision?: RuntimeHandoffInstallDecision;
    runtimeQaReady: boolean;
  };
  stages: ManufacturingLineStage[];
  nextActions: string[];
};

export type PkaManufacturingClosureDisposition =
  | "accepted_for_release"
  | "rework_required"
  | "release_blocked";

export type PkaManufacturingClosureReason = {
  id: string;
  severity: "blocker" | "rework" | "ready";
  title: string;
  detail: string;
  stageId: ManufacturingLineStageId;
  stageTitle: string;
  workOrderId: string;
  workOrderTitle: string;
  href: string;
  recommendedAction: string;
};

export type PkaManufacturingClosureReport = {
  projectId: string;
  projectName: string;
  packageId?: string;
  packageStatus?: LifecycleState;
  disposition: PkaManufacturingClosureDisposition;
  dispositionLabel: string;
  summary: {
    readyStageCount: number;
    blockedStageCount: number;
    completeWorkOrderCount: number;
    blockedWorkOrderCount: number;
    qualityScore: number;
    qualityBand: PkaProductQualityBand;
    releaseBlockerCount: number;
    packageValidationWarningCount: number;
    runtimeImportStatus?: RuntimePkaImportReport["status"];
    runtimeHandoffDecision?: RuntimeHandoffInstallDecision;
  };
  acceptedSignals: string[];
  reasons: PkaManufacturingClosureReason[];
  reworkRoutes: PkaManufacturingClosureReason[];
};

export type ManufacturingWorkOrderPhase =
  | "source_to_ko"
  | "graph_governance"
  | "ko_to_package"
  | "runtime_validation"
  | "continuous_improvement";

export type ManufacturingWorkOrderStatus =
  | "not_started"
  | "ready_to_run"
  | "running"
  | "waiting_for_approval"
  | "blocked"
  | "complete";

export type ManufacturingWorkOrder = {
  id: string;
  phase: ManufacturingWorkOrderPhase;
  title: string;
  status: ManufacturingWorkOrderStatus;
  objective: string;
  ownerRole: Role;
  stageRange: string;
  inputSignal: string;
  outputSignal: string;
  approvalCheckpoint: string;
  runControlLabel: string;
  href: string;
  missionStage: string;
  missionCount: number;
  openMissionCount: number;
  nextAction: string;
};

export type ManufacturingWorkOrderReport = {
  projectId: string;
  projectName: string;
  summary: {
    totalWorkOrders: number;
    completeCount: number;
    readyToRunCount: number;
    blockedCount: number;
    openMissionCount: number;
    approvalCheckpointCount: number;
  };
  sourceToKnowledgeObject: ManufacturingWorkOrder;
  knowledgeObjectToPackage: ManufacturingWorkOrder;
  workOrders: ManufacturingWorkOrder[];
};

export type ManufacturingWorkOrderTraceInput = {
  projectId: string;
  workOrderId: string;
  actor?: string;
  status?: MissionStatus;
};

export type PipelineSuggestionReviewReport = {
  projectId?: string;
  sourceId?: string;
  totalSuggestions: number;
  knowledgeSuggestionCount: number;
  relationshipSuggestionCount: number;
  pendingCount: number;
  acceptedCount: number;
  deferredCount: number;
  rejectedCount: number;
  lowConfidenceCount: number;
  missingEvidenceCount: number;
  reviewNotesCount: number;
  averageConfidence?: number;
  recommendedAction: string;
};

export type PipelineSourceCoverageItem = {
  sourceId: string;
  sourceTitle: string;
  storagePath?: string;
  processingStatus: MissionStatus;
  extractionProfile:
    | "markdown_artifact"
    | "text_artifact"
    | "artifact_directory"
    | "metadata_fallback"
    | "unsupported_artifact"
    | "empty_fixture";
  chunkCount: number;
  totalTokenEstimate: number;
  averageChunkTokens: number;
  suggestionCount: number;
  relationshipSuggestionCount: number;
  coveredChunkCount: number;
  uncoveredChunkCount: number;
  coverageRate: number;
  isMultiChunk: boolean;
};

export type PipelineSourceCoverageReport = {
  projectId?: string;
  extractionProfile?: PipelineSourceCoverageItem["extractionProfile"] | "all";
  sourceCount: number;
  ingestedSourceCount: number;
  artifactSourceCount: number;
  metadataFallbackSourceCount: number;
  unsupportedSourceCount: number;
  emptySourceCount: number;
  multiChunkSourceCount: number;
  totalChunks: number;
  totalTokenEstimate: number;
  totalSuggestions: number;
  averageChunksPerIngestedSource: number;
  profileCounts: Record<PipelineSourceCoverageItem["extractionProfile"], number>;
  items: PipelineSourceCoverageItem[];
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

export type PkaComponentManufacturingRequirement =
  | "required"
  | "conditional"
  | "optional_placeholder";

export type PkaComponentManufacturingStatus =
  | "manufactured"
  | "intentional_placeholder"
  | "missing_required"
  | "not_required_yet";

export type PkaComponentManufacturingItem = {
  id: string;
  kind: PkaComponentManifestEntry["kind"];
  path: string;
  requirement: PkaComponentManufacturingRequirement;
  status: PkaComponentManufacturingStatus;
  title: string;
  detail: string;
  manufacturingBoundary: string;
  dedicatedRecordDecision: "knowledge_object_backed" | "component_contract_file" | "defer_dedicated_record";
  promotionTrigger: string;
};

export type PkaComponentManufacturingReport = {
  projectId: string;
  packageId?: string;
  ready: boolean;
  manufacturedCount: number;
  intentionalPlaceholderCount: number;
  missingRequiredCount: number;
  notRequiredYetCount: number;
  items: PkaComponentManufacturingItem[];
};

export type PkaProductQualityCategory =
  | "source_quality"
  | "governance_coverage"
  | "relationship_evidence"
  | "package_completeness"
  | "runtime_handoff";

export type PkaProductQualityBand = "release_grade" | "pilot_ready" | "needs_work" | "blocked";

export type PkaProductQualityItem = {
  id: string;
  category: PkaProductQualityCategory;
  title: string;
  score: number;
  weight: number;
  level: PackageValidationItem["level"];
  signal: string;
  detail: string;
  recommendedAction: string;
};

export type PkaProductQualityReport = {
  projectId: string;
  packageId?: string;
  score: number;
  band: PkaProductQualityBand;
  releaseGrade: boolean;
  summary: {
    sourceCount: number;
    sourceCategoryCount: number;
    newestSourceDate?: string;
    approvedKnowledgeObjectCount: number;
    relationshipCount: number;
    sourceBackedRelationshipCount: number;
    packageValidationWarningCount: number;
    runtimeImportStatus?: RuntimePkaImportReport["status"];
    runtimeHandoffDecision?: RuntimeHandoffInstallDecision;
  };
  items: PkaProductQualityItem[];
  topRisks: string[];
};

export type RelationshipEvidenceClosureStatus =
  | "release_grade"
  | "needs_rework"
  | "excluded_from_release";

export type RelationshipEvidenceClosureItem = {
  relationshipId: string;
  label: string;
  status: RelationshipEvidenceClosureStatus;
  relationshipType: RelationshipType;
  lifecycleStatus: LifecycleState;
  confidence?: number;
  evidenceSourceTitle?: string;
  provenanceNote?: string;
  releaseExcluded: boolean;
  releaseExclusionReason?: string;
  reasons: string[];
  recommendedAction: string;
  href: string;
};

export type RelationshipEvidenceClosureReport = {
  projectId: string;
  ready: boolean;
  totalRelationshipCount: number;
  releaseGradeCount: number;
  needsReworkCount: number;
  excludedFromReleaseCount: number;
  packageRelevantRelationshipCount: number;
  items: RelationshipEvidenceClosureItem[];
};

export type KnowledgeRelationshipReleaseExclusionInput = {
  relationshipId: string;
  excluded: boolean;
  reason?: string;
  actor?: string;
};

export type RuntimePkaImportFixtureKind =
  | "valid"
  | "missing_governance"
  | "malformed_archive"
  | "capability_mismatch"
  | "missing_prompt"
  | "missing_rule"
  | "missing_workflow"
  | "missing_template";

export type RuntimePkaImportReport = {
  packageId: string;
  archivePath: string;
  status: "importable" | "blocked";
  supportedRuntimeCapabilities: string[];
  requiredRuntimeCapabilities: string[];
  loaded: {
    ontologyObjectTypes: number;
    knowledgeObjects: number;
    relationships: number;
    sources: number;
    runtimeConfigEntries: number;
    promptEntries: number;
    ruleEntries: number;
    workflowEntries: number;
    templateEntries: number;
  };
  items: PackageValidationItem[];
};

export type RuntimeHandoffInstallDecision = "installable" | "blocked" | "installation_review_required";

export type RuntimeHandoffReadbackItem = {
  id: string;
  decision: "pass" | "blocked" | "installation_review_required" | "feedback_requested";
  title: string;
  detail: string;
};

export type RuntimeHandoffReadbackReport = {
  packageId: string;
  packageName?: string;
  handoffPath: string;
  decision: RuntimeHandoffInstallDecision;
  blockedCount: number;
  reviewRequiredCount: number;
  feedbackQuestionCount: number;
  summary?: string;
  audience: string[];
  relationshipEvidencePolicy?: {
    currentShape?: string;
    dedicatedTableStatus?: string;
    promoteWhen: string[];
  };
  feedbackQuestions: string[];
  nextDeveloperSlice: string[];
  items: RuntimeHandoffReadbackItem[];
};

export type RuntimeHandoffFeedbackDecision =
  | "provenance_ok_for_pilot"
  | "needs_multi_source_lifecycle"
  | "needs_installation_review_records";

export type RuntimeHandoffFeedbackInput = {
  packageId: string;
  actor?: string;
  runtimeApp: string;
  decision: RuntimeHandoffFeedbackDecision;
  notes?: string;
};

export type RuntimeHandoffFeedbackRecord = {
  id: string;
  packageId: string;
  runtimeApp: string;
  decision: RuntimeHandoffFeedbackDecision;
  actorId?: string;
  notes?: string;
  createdAt: string;
};

export type RuntimeHandoffFeedbackSummary = {
  packageId: string;
  totalFeedbackCount: number;
  provenanceOkCount: number;
  multiSourceLifecycleRequestCount: number;
  installationReviewRecordRequestCount: number;
  multiSourceLifecycleThreshold: number;
  repeatedMultiSourceLifecycleFeedback: boolean;
  relationshipEvidenceDecision:
    | "keep_provenance_for_pilot"
    | "monitor_multi_source_lifecycle_feedback"
    | "investigate_dedicated_relationship_evidence_table";
  handoffFeedbackPersistenceDecision:
    | "audit_backed_records_for_pilot"
    | "promote_to_dedicated_app_developer_review_table_later";
  items: RuntimeHandoffFeedbackRecord[];
};

export type RuntimeConsumerProfileId = "generic_runtime" | "aifa" | "lados";

export type RuntimeConsumptionDecision = RuntimeHandoffInstallDecision;

export type RuntimeConsumerProfileReport = {
  id: RuntimeConsumerProfileId;
  label: string;
  decision: RuntimeConsumptionDecision;
  supportedCapabilities: string[];
  requiredCapabilities: string[];
  unsupportedCapabilities: string[];
  contextBoundary: string;
  installerChecklist: string[];
  nextAction: string;
};

export type RuntimeConsumptionContractReport = {
  packageId: string;
  packageName?: string;
  packageDomain?: string;
  handoffDecision: RuntimeHandoffInstallDecision;
  importStatus?: RuntimePkaImportReport["status"];
  genericChecklist: RuntimeHandoffReadbackItem[];
  profiles: RuntimeConsumerProfileReport[];
};

export const runtimeHandoffFixturePaths = {
  missing_required_file: "runtime/app-developer-handoff-missing-required-file.json",
  review_required: "runtime/app-developer-handoff-review-required.json"
} as const;

export type RuntimeHandoffFixtureKind = keyof typeof runtimeHandoffFixturePaths;

const runtimeHandoffMultiSourceLifecycleThreshold = 2;

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

export type RuntimeQaFixtureQuestion = {
  id: string;
  question: string;
  expectedCitationRequirement: string;
  requiredContextTypes: string[];
};

export type RuntimeQaContextBundlePreview = PkaContextBundle & {
  packageRecordId?: string;
  packageStatus?: LifecycleState;
  fixtureQuestions: RuntimeQaFixtureQuestion[];
};

export type RuntimeQaAnswerReadinessReport = {
  projectId: string;
  ready: boolean;
  missingCitationCount: number;
  missingPublishedPackageCount: number;
  missingApprovedKnowledgeObjectCount: number;
  missingGovernedRelationshipCount: number;
  items: ReadinessHint[];
};

export type RuntimeQaFixtureEvaluation = {
  id: string;
  question: string;
  status: "ready" | "blocked";
  requiredContextTypes: string[];
  missingContextTypes: string[];
  citedKnowledgeObjectTitles: string[];
  citedSourceEvidence: string[];
  citedRelationshipCount: number;
  deterministicAnswer: string;
};

export type RuntimeQaFixtureEvaluationReport = {
  projectId: string;
  ready: boolean;
  evaluations: RuntimeQaFixtureEvaluation[];
};

export type RfqEvidenceRegisterReport = {
  projectId: string;
  ready: boolean;
  totalEntries: number;
  acceptedEntryCount: number;
  clarificationRequiredCount: number;
  categoryCounts: Record<RfqEvidenceCategory, number>;
  statusCounts: Record<RfqEvidenceStatus, number>;
  workflowGateReadiness: Array<{
    gate: RfqEvidenceRegisterEntrySummary["workflowGate"];
    status: "ready" | "warning";
    requiredCategories: RfqEvidenceCategory[];
    presentCategories: RfqEvidenceCategory[];
    detail: string;
  }>;
};

export type RfqWorkflowGateReport = {
  projectId: string;
  ready: boolean;
  gates: Array<{
    gate: RfqEvidenceRegisterEntrySummary["workflowGate"];
    title: string;
    status: "ready" | "warning" | "blocked";
    detail: string;
    activeEntryCount: number;
    acceptedEntryCount: number;
    clarificationRequiredCount: number;
    missingEvidenceCount: number;
    commercialExceptionCount: number;
    supersededEntryCount: number;
    requiredCategories: RfqEvidenceCategory[];
    presentCategories: RfqEvidenceCategory[];
    remediationPrompts: string[];
    followUp?: {
      actionId: string;
      actionType: RfqWorkflowGateActionType;
      owner: string;
      dueDate?: string;
      status: RfqWorkflowGateActionStatus;
      notes?: string;
      updatedAt: string;
    };
    entries: Array<{
      id: string;
      registerCode: string;
      tradeSection: string;
      category: RfqEvidenceCategory;
      status: RfqEvidenceStatus;
      questionOrEvidence: string;
    }>;
  }>;
};

export type RfqWorkflowGateActionType =
  | "attach_missing_evidence"
  | "request_clarification"
  | "resolve_commercial_exception";

export type RfqWorkflowGateActionStatus = "open" | "in_progress" | "resolved" | "blocked";
export type RfqWorkflowGateActionDueState =
  | "no_due_date"
  | "due_future"
  | "due_today"
  | "overdue"
  | "closed";

export type RfqWorkflowGateActionInput = {
  projectId: string;
  gate: RfqEvidenceRegisterEntrySummary["workflowGate"];
  actionType: RfqWorkflowGateActionType;
  owner: string;
  dueDate?: string;
  status: RfqWorkflowGateActionStatus;
  actor?: string;
  notes?: string;
  evidenceEntryIds?: string[];
};

export type RfqWorkflowGateActionUpdateInput = {
  actionId: string;
  status: RfqWorkflowGateActionStatus;
  actor?: string;
  owner?: string;
  dueDate?: string;
  notes?: string;
  evidenceEntryIds?: string[];
};

export type RfqWorkflowGateActionRecord = {
  id: string;
  projectId: string;
  gate: RfqEvidenceRegisterEntrySummary["workflowGate"];
  actionType: RfqWorkflowGateActionType;
  owner: string;
  dueDate?: string;
  status: RfqWorkflowGateActionStatus;
  dueState: RfqWorkflowGateActionDueState;
  ageDays: number;
  dueInDays?: number;
  overdueDays?: number;
  notes?: string;
  evidenceEntryIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type RfqWorkflowGateActionFilter = {
  projectId?: string;
  gate?: RfqEvidenceRegisterEntrySummary["workflowGate"] | "all";
  owner?: string;
  status?: RfqWorkflowGateActionStatus | "all";
  dueState?: RfqWorkflowGateActionDueState | "all";
  evidenceEntryId?: string;
};

export type RfqEvidenceRegisterFilter = {
  projectId?: string;
  category?: RfqEvidenceCategory | "all";
  status?: RfqEvidenceStatus | "all";
  tradeSection?: string;
  workflowGate?: RfqEvidenceRegisterEntrySummary["workflowGate"] | "all";
  entryId?: string;
};

export type RfqEvidenceRegisterReviewInput = {
  entryId: string;
  status: Extract<RfqEvidenceStatus, "accepted" | "clarification_required" | "superseded">;
  actor?: string;
  notes?: string;
};

export type QsRfqPilotSourcePack = {
  projectId: string;
  title: string;
  sourceIds: string[];
  objective: string;
  artifacts: Array<{
    sourceId: string;
    title: string;
    storagePath: string;
    purpose: string;
  }>;
  operatorRecipe: string[];
};

export type QsRfqPilotRunResult = {
  projectId: string;
  sourcePack: QsRfqPilotSourcePack;
  mode: "created" | "reused_existing";
  ingestedSourceIds: string[];
  acceptedKnowledgeObjectIds: string[];
  acceptedRelationshipIds: string[];
  packageRecordId?: string;
  packageId?: string;
  packageStatus?: LifecycleState;
  runtimeImportStatus?: RuntimePkaImportReport["status"];
  evidenceRegisterReady: boolean;
  runtimeQaReady: boolean;
  fixtureEvaluationReady: boolean;
};

export type QsRfqPilotRunInput = {
  actor?: string;
  mode?: "reuse_existing" | "replace_version";
};

export type QsRfqPilotRunReport = {
  projectId: string;
  title: string;
  status: "ready" | "incomplete";
  summary: {
    sourceCount: number;
    ingestedSourceCount: number;
    approvedKnowledgeObjectCount: number;
    approvedRelationshipCount: number;
    latestPackageStatus?: LifecycleState;
    latestPackageId?: string;
    runtimeQaReady: boolean;
    fixtureEvaluationReady: boolean;
  };
  stages: ReadinessHint[];
};

export type PkaPersistedExportFile = {
  path: string;
  size: number;
  updatedAt: string;
};

export const runtimePkaImportFixtureArchivePaths: Record<RuntimePkaImportFixtureKind, string> = {
  valid: "runtime-valid-package-archive.json",
  missing_governance: "runtime-missing-governance-archive.json",
  malformed_archive: "runtime-malformed-package-archive.json",
  capability_mismatch: "runtime-capability-mismatch-archive.json",
  missing_prompt: "runtime-missing-prompt-package-archive.json",
  missing_rule: "runtime-missing-rule-package-archive.json",
  missing_workflow: "runtime-missing-workflow-package-archive.json",
  missing_template: "runtime-missing-template-package-archive.json"
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
  rfqEvidenceRegisterEntries: RfqEvidenceRegisterEntrySummary[];
  rfqWorkflowGateActions: RfqWorkflowGateActionRecord[];
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

type PrismaRfqEvidenceRegisterEntry = {
  id: string;
  projectId: string;
  sourceId: string | null;
  knowledgeObjectId: string | null;
  registerCode: string;
  boqItemRef: string | null;
  tradeSection: string;
  category: string;
  status: string;
  questionOrEvidence: string;
  requiredResponseOwner: string;
  evidenceReference: string | null;
  commercialImpact: string | null;
  pricingBasisChange: boolean;
  workflowGate: string;
  createdAt: Date;
  source: {
    title: string;
  } | null;
  knowledgeObject: {
    title: string;
  } | null;
};

type PrismaRfqWorkflowGateAction = {
  id: string;
  projectId: string;
  gate: string;
  actionType: string;
  owner: string;
  dueDate: Date | null;
  status: string;
  notes: string | null;
  evidenceEntryIds: string[];
  createdAt: Date;
  updatedAt: Date;
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
  limit?: number;
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

function localUniqueId(prefix: string, seed: string) {
  return `${prefix}-${slugify(seed)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

function relationshipReleaseClosure(provenance: unknown) {
  const releaseClosure = provenanceRecord(provenance).releaseClosure;

  if (!releaseClosure || typeof releaseClosure !== "object" || Array.isArray(releaseClosure)) {
    return {};
  }

  const record = releaseClosure as Record<string, unknown>;

  return {
    releaseExcluded: record.excludedFromRelease === true,
    releaseExclusionReason: typeof record.reason === "string" ? record.reason : undefined
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
    pkaPackages: [],
    rfqEvidenceRegisterEntries: [],
    rfqWorkflowGateActions: []
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
  globalThis.kfWorkspaceStore.rfqEvidenceRegisterEntries ??= [];
  globalThis.kfWorkspaceStore.rfqWorkflowGateActions ??= [];

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
    await prisma.rfqWorkflowGateAction.deleteMany();
    await prisma.rfqEvidenceRegisterEntry.deleteMany();
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
  const releaseClosure = relationshipReleaseClosure(relationship.provenance);

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
    ...releaseClosure,
    ...evidence,
    createdAt: relationship.createdAt.toISOString().slice(0, 10)
  };
}

function mapAuditLog(auditLog: PrismaAuditLog): GovernanceEventSummary {
  const metadata =
    auditLog.metadata && typeof auditLog.metadata === "object"
      ? (auditLog.metadata as Record<string, unknown>)
      : undefined;

  return {
    id: auditLog.id,
    actorId: auditLog.actorId ?? undefined,
    action: auditLog.action,
    subjectType: auditLog.subjectType,
    subjectId: auditLog.subjectId,
    detail: metadataDetail(auditLog.metadata),
    metadata,
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

function mapRfqEvidenceRegisterEntry(entry: PrismaRfqEvidenceRegisterEntry): RfqEvidenceRegisterEntrySummary {
  return {
    id: entry.id,
    projectId: entry.projectId,
    sourceId: entry.sourceId ?? undefined,
    sourceTitle: entry.source?.title,
    knowledgeObjectId: entry.knowledgeObjectId ?? undefined,
    knowledgeObjectTitle: entry.knowledgeObject?.title,
    registerCode: entry.registerCode,
    boqItemRef: entry.boqItemRef ?? undefined,
    tradeSection: entry.tradeSection,
    category: entry.category as RfqEvidenceCategory,
    status: entry.status as RfqEvidenceStatus,
    questionOrEvidence: entry.questionOrEvidence,
    requiredResponseOwner: entry.requiredResponseOwner,
    evidenceReference: entry.evidenceReference ?? undefined,
    commercialImpact: entry.commercialImpact ?? undefined,
    pricingBasisChange: entry.pricingBasisChange,
    workflowGate: entry.workflowGate as RfqEvidenceRegisterEntrySummary["workflowGate"],
    createdAt: entry.createdAt.toISOString().slice(0, 10)
  };
}

function startOfUtcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function parseDateOnly(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return undefined;
  }

  return Date.UTC(year, month - 1, day);
}

function withRfqWorkflowGateActionAge(
  action: Omit<RfqWorkflowGateActionRecord, "dueState" | "ageDays" | "dueInDays" | "overdueDays">
): RfqWorkflowGateActionRecord {
  const today = startOfUtcDay(new Date());
  const createdDay = parseDateOnly(action.createdAt) ?? today;
  const dueDay = parseDateOnly(action.dueDate);
  const ageDays = Math.max(0, Math.floor((today - createdDay) / 86_400_000));

  if (action.status === "resolved") {
    return {
      ...action,
      dueState: "closed",
      ageDays
    };
  }

  if (dueDay === undefined) {
    return {
      ...action,
      dueState: "no_due_date",
      ageDays
    };
  }

  const dueDeltaDays = Math.floor((dueDay - today) / 86_400_000);

  if (dueDeltaDays < 0) {
    return {
      ...action,
      dueState: "overdue",
      ageDays,
      overdueDays: Math.abs(dueDeltaDays)
    };
  }

  if (dueDeltaDays === 0) {
    return {
      ...action,
      dueState: "due_today",
      ageDays,
      dueInDays: 0
    };
  }

  return {
    ...action,
    dueState: "due_future",
    ageDays,
    dueInDays: dueDeltaDays
  };
}

function mapRfqWorkflowGateAction(action: PrismaRfqWorkflowGateAction): RfqWorkflowGateActionRecord {
  return withRfqWorkflowGateActionAge({
    id: action.id,
    projectId: action.projectId,
    gate: action.gate as RfqEvidenceRegisterEntrySummary["workflowGate"],
    actionType: action.actionType as RfqWorkflowGateActionType,
    owner: action.owner,
    dueDate: action.dueDate?.toISOString().slice(0, 10),
    status: action.status as RfqWorkflowGateActionStatus,
    notes: action.notes ?? undefined,
    evidenceEntryIds: action.evidenceEntryIds,
    createdAt: action.createdAt.toISOString().slice(0, 10),
    updatedAt: action.updatedAt.toISOString().slice(0, 10)
  });
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
    return relationshipReleaseGrade(relationship);
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

function relationshipReleaseGrade(relationship: KnowledgeRelationshipSummary) {
  return (
    relationship.status === "approved" &&
    relationship.confidence !== undefined &&
    relationship.confidence >= 50 &&
    Boolean(relationship.provenanceNote?.trim()) &&
    Boolean(relationship.evidenceSourceId)
  );
}

function relationshipClosureItem(
  relationship: KnowledgeRelationshipSummary,
  projectId: string
): RelationshipEvidenceClosureItem {
  const releaseExcluded = relationship.releaseExcluded === true;
  const reasons: string[] = [];

  if (releaseExcluded) {
    reasons.push(relationship.releaseExclusionReason ?? "Relationship is intentionally excluded from this PKA release.");
  } else {
    if (relationship.status !== "approved") {
      reasons.push("Relationship is not approved.");
    }

    if (relationship.confidence === undefined || relationship.confidence < 50) {
      reasons.push("Relationship confidence is below the release threshold.");
    }

    if (!relationship.provenanceNote?.trim()) {
      reasons.push("Relationship provenance note is missing.");
    }

    if (!relationship.evidenceSourceId) {
      reasons.push("Structured relationship source evidence is missing.");
    }
  }

  const status: RelationshipEvidenceClosureStatus = releaseExcluded
    ? "excluded_from_release"
    : reasons.length === 0 && relationshipReleaseGrade(relationship)
      ? "release_grade"
      : "needs_rework";

  return {
    relationshipId: relationship.id,
    label: `${relationship.fromTitle} ${relationship.type} ${relationship.toTitle}`,
    status,
    relationshipType: relationship.type,
    lifecycleStatus: relationship.status,
    confidence: relationship.confidence,
    evidenceSourceTitle: relationship.evidenceSourceTitle,
    provenanceNote: relationship.provenanceNote,
    releaseExcluded,
    releaseExclusionReason: relationship.releaseExclusionReason,
    reasons,
    recommendedAction:
      status === "release_grade"
        ? "Keep this relationship in the release graph."
        : status === "excluded_from_release"
          ? "Keep this working edge outside the package release until it is promoted."
          : "Repair provenance, source evidence, confidence, and approval status, or exclude this edge from release.",
    href: `/ontology?projectId=${projectId}&relId=${relationship.id}`
  };
}

export async function getRelationshipEvidenceClosureReport(
  projectId: string
): Promise<RelationshipEvidenceClosureReport> {
  const relationships = await listKnowledgeRelationships({ projectId });
  const items = relationships.map((relationship) => relationshipClosureItem(relationship, projectId));
  const releaseGradeCount = items.filter((item) => item.status === "release_grade").length;
  const needsReworkCount = items.filter((item) => item.status === "needs_rework").length;
  const excludedFromReleaseCount = items.filter((item) => item.status === "excluded_from_release").length;

  return {
    projectId,
    ready: needsReworkCount === 0,
    totalRelationshipCount: items.length,
    releaseGradeCount,
    needsReworkCount,
    excludedFromReleaseCount,
    packageRelevantRelationshipCount: releaseGradeCount,
    items
  };
}

async function listReleasePackageRelationships(projectId: string) {
  const relationships = await listKnowledgeRelationships({ projectId });
  return relationships.filter((relationship) => relationshipReleaseGrade(relationship));
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

const qsRfqPilotProjectId = "kf-qs-rfq-pilot";
const qsRfqPilotSourceIds = ["src-boq-sample", "src-rfq-template"] as const;
const qsRfqPilotSuggestionTitles = new Set([
  "BOQ item evidence required before RFQ issue",
  "RFQ BOQ scope completeness check",
  "Provisional BOQ quantity assumption rule",
  "Structural BOQ RFQ evidence requirement",
  "RFQ package issue template",
  "RFQ return requirements checklist",
  "Tender clarification log procedure",
  "RFQ clarification and evidence register"
]);
const rfqEvidenceCategories: RfqEvidenceCategory[] = [
  "issued_evidence",
  "missing_evidence",
  "assumption",
  "addendum",
  "subcontractor_return",
  "commercial_exception"
];
const rfqEvidenceStatuses: RfqEvidenceStatus[] = [
  "draft",
  "under_review",
  "accepted",
  "clarification_required",
  "superseded"
];

const qsRfqPilotArtifacts: Record<(typeof qsRfqPilotSourceIds)[number], string> = {
  "src-boq-sample": "storage/sources/src-boq-sample/source.md",
  "src-rfq-template": "storage/sources/src-rfq-template/source.md"
};

const qsRfqPilotArtifactContents: Record<(typeof qsRfqPilotSourceIds)[number], string> = {
  "src-boq-sample": [
    "# Sample BOQ for RFQ Package",
    "",
    "BOQ section: Architectural finishes package. Item A1 floor tiles to toilet areas, unit m2, provisional quantity 120, includes tile adhesive, grout, skirting trim, movement joints, and protection after laying.",
    "Before issuing an RFQ, the BOQ item must be checked against drawings, specifications, quantity basis, unit, inclusions, exclusions, and provisional assumptions.",
    "Evidence required for RFQ issue includes BOQ item code, description, unit, quantity, drawing reference, specification clause, pricing basis, and clarification log for missing scope.",
    "If drawings or specifications are missing, the RFQ must mark the assumption and request subcontractor clarification instead of treating provisional quantity as certified final quantity.",
    "",
    "BOQ section: Structural concrete substructure package. Item S1 reinforced concrete pad footing, unit m3, provisional quantity 45, includes concrete grade C30/37, reinforcement fixing coordination, formwork to sides, blinding concrete, cube test allowance, curing, and disposal of excavated unsuitable material where instructed.",
    "Before issuing the structural RFQ, the QS must check foundation layout drawings, structural details, geotechnical assumptions, concrete specification, rebar schedule responsibility, temporary works exclusions, testing requirements, and whether excavation support is priced separately.",
    "Structural BOQ evidence required for quotation comparison includes drawing revision, specification clause, footing dimensions or take-off basis, reinforcement assumption, concrete grade, testing allowance, disposal scope, and clarification status for ground condition risk."
  ].join("\n"),
  "src-rfq-template": [
    "# RFQ Template Structure",
    "",
    "An RFQ package should include trade scope summary, BOQ extract, drawings and specifications list, pricing return format, submission deadline, commercial terms, exclusions schedule, and clarification response process.",
    "The RFQ checklist requires each quoted BOQ item to carry item code, description, unit, quantity, rate column, amount formula, assumptions, exclusions, lead time, validity period, and evidence attachments.",
    "Tender clarifications must be logged with question, originator, response, date, affected BOQ item, affected drawing or specification, and whether an addendum is required.",
    "The procurement team should not issue an RFQ package until missing drawings, missing specifications, scope exclusions, alternative proposal rules, and return-document requirements are identified.",
    "",
    "Clarification and evidence register example: register ID RFQ-CLR-001, source BOQ item A1/S1, question raised by subcontractor, required response owner QS, evidence reference drawing/specification/addendum, commercial impact, due date, response status, and whether the response changes the pricing basis.",
    "The evidence register must separate issued evidence, missing evidence, assumptions, addenda, and subcontractor-return documents so the runtime can cite approved package knowledge without mixing it with client vault state or live tender correspondence."
  ].join("\n")
};

export function getQsRfqPilotSourcePack(): QsRfqPilotSourcePack {
  return {
    projectId: qsRfqPilotProjectId,
    title: "QS/RFQ from BOQ Pilot Source Pack",
    sourceIds: [...qsRfqPilotSourceIds],
    objective:
      "Manufacture a small governed Base PKA that helps a runtime understand RFQ package completeness from BOQ material.",
    artifacts: [
      {
        sourceId: "src-boq-sample",
        title: "Sample BOQ for RFQ Package",
        storagePath: qsRfqPilotArtifacts["src-boq-sample"],
        purpose: "Provides BOQ item, measurement basis, inclusion/exclusion, and evidence requirements."
      },
      {
        sourceId: "src-rfq-template",
        title: "RFQ Template Structure",
        storagePath: qsRfqPilotArtifacts["src-rfq-template"],
        purpose: "Provides RFQ return requirements, clarification log rules, and issue-readiness checks."
      }
    ],
    operatorRecipe: [
      "Prepare the local pilot source artifacts.",
      "Run deterministic ingestion for the BOQ and RFQ template sources.",
      "Accept the source-backed KO suggestions needed for package completeness.",
      "Accept relationship suggestions and add cross-source RFQ workflow support relationships.",
      "Approve pilot KOs and governed relationships with reviewer accountability.",
      "Assemble, review, approve, and publish the QS/RFQ Base PKA.",
      "Validate runtime import and inspect deterministic Runtime Q&A context readiness."
    ]
  };
}

function rfqEvidenceRegisterDrafts(
  knowledgeObjects: KnowledgeObjectSummary[]
): Omit<RfqEvidenceRegisterEntrySummary, "id" | "createdAt">[] {
  const knowledgeObjectByTitle = new Map(knowledgeObjects.map((knowledgeObject) => [knowledgeObject.title, knowledgeObject]));
  const firstEvidence = (title: string) => knowledgeObjectByTitle.get(title)?.evidenceLinks[0];

  return [
    {
      projectId: qsRfqPilotProjectId,
      sourceId: firstEvidence("BOQ item evidence required before RFQ issue")?.sourceId,
      sourceTitle: firstEvidence("BOQ item evidence required before RFQ issue")?.sourceTitle,
      knowledgeObjectId: knowledgeObjectByTitle.get("BOQ item evidence required before RFQ issue")?.id,
      knowledgeObjectTitle: "BOQ item evidence required before RFQ issue",
      registerCode: "RFQ-EV-001",
      boqItemRef: "A1",
      tradeSection: "Architectural finishes",
      category: "issued_evidence",
      status: "accepted",
      questionOrEvidence:
        "BOQ item code, description, unit, quantity, drawing/specification reference, pricing basis, and clarification status are required before RFQ issue.",
      requiredResponseOwner: "knowledge_engineer",
      evidenceReference: firstEvidence("BOQ item evidence required before RFQ issue")?.locator,
      commercialImpact: "Incomplete evidence weakens quotation comparability and may cause scope exclusions.",
      pricingBasisChange: false,
      workflowGate: "prepare"
    },
    {
      projectId: qsRfqPilotProjectId,
      sourceId: firstEvidence("RFQ BOQ scope completeness check")?.sourceId,
      sourceTitle: firstEvidence("RFQ BOQ scope completeness check")?.sourceTitle,
      knowledgeObjectId: knowledgeObjectByTitle.get("RFQ BOQ scope completeness check")?.id,
      knowledgeObjectTitle: "RFQ BOQ scope completeness check",
      registerCode: "RFQ-EV-002",
      boqItemRef: "A1",
      tradeSection: "Architectural finishes",
      category: "assumption",
      status: "under_review",
      questionOrEvidence:
        "Check inclusions, exclusions, provisional assumptions, and related-scope items before sending the RFQ to subcontractors.",
      requiredResponseOwner: "reviewer",
      evidenceReference: firstEvidence("RFQ BOQ scope completeness check")?.locator,
      commercialImpact: "Unreviewed assumptions may shift scope risk into subcontractor exclusions.",
      pricingBasisChange: true,
      workflowGate: "review"
    },
    {
      projectId: qsRfqPilotProjectId,
      sourceId: firstEvidence("Provisional BOQ quantity assumption rule")?.sourceId,
      sourceTitle: firstEvidence("Provisional BOQ quantity assumption rule")?.sourceTitle,
      knowledgeObjectId: knowledgeObjectByTitle.get("Provisional BOQ quantity assumption rule")?.id,
      knowledgeObjectTitle: "Provisional BOQ quantity assumption rule",
      registerCode: "RFQ-EV-003",
      boqItemRef: "A1/S1",
      tradeSection: "Cross-trade assumption",
      category: "assumption",
      status: "clarification_required",
      questionOrEvidence:
        "If drawings or specifications are missing, mark the quantity or scope as provisional and request clarification.",
      requiredResponseOwner: "domain_expert",
      evidenceReference: firstEvidence("Provisional BOQ quantity assumption rule")?.locator,
      commercialImpact: "Provisional quantities must not be treated as certified final quantities.",
      pricingBasisChange: true,
      workflowGate: "clarify"
    },
    {
      projectId: qsRfqPilotProjectId,
      sourceId: firstEvidence("Structural BOQ RFQ evidence requirement")?.sourceId,
      sourceTitle: firstEvidence("Structural BOQ RFQ evidence requirement")?.sourceTitle,
      knowledgeObjectId: knowledgeObjectByTitle.get("Structural BOQ RFQ evidence requirement")?.id,
      knowledgeObjectTitle: "Structural BOQ RFQ evidence requirement",
      registerCode: "RFQ-EV-004",
      boqItemRef: "S1",
      tradeSection: "Structural concrete substructure",
      category: "issued_evidence",
      status: "accepted",
      questionOrEvidence:
        "Structural concrete BOQ items need drawing revision, specification clause, take-off basis, testing allowance, disposal scope, and ground-risk clarification.",
      requiredResponseOwner: "domain_expert",
      evidenceReference: firstEvidence("Structural BOQ RFQ evidence requirement")?.locator,
      commercialImpact: "Ground-risk and testing gaps can materially affect subcontract quotations.",
      pricingBasisChange: true,
      workflowGate: "review"
    },
    {
      projectId: qsRfqPilotProjectId,
      sourceId: firstEvidence("Tender clarification log procedure")?.sourceId,
      sourceTitle: firstEvidence("Tender clarification log procedure")?.sourceTitle,
      knowledgeObjectId: knowledgeObjectByTitle.get("Tender clarification log procedure")?.id,
      knowledgeObjectTitle: "Tender clarification log procedure",
      registerCode: "RFQ-EV-005",
      boqItemRef: "A1/S1",
      tradeSection: "Tender clarification",
      category: "addendum",
      status: "under_review",
      questionOrEvidence:
        "Clarifications must track question, originator, response, affected BOQ item, affected drawing/specification, and addendum requirement.",
      requiredResponseOwner: "reviewer",
      evidenceReference: firstEvidence("Tender clarification log procedure")?.locator,
      commercialImpact: "Uncontrolled clarification responses can change pricing basis without governance.",
      pricingBasisChange: true,
      workflowGate: "clarify"
    },
    {
      projectId: qsRfqPilotProjectId,
      sourceId: firstEvidence("RFQ clarification and evidence register")?.sourceId,
      sourceTitle: firstEvidence("RFQ clarification and evidence register")?.sourceTitle,
      knowledgeObjectId: knowledgeObjectByTitle.get("RFQ clarification and evidence register")?.id,
      knowledgeObjectTitle: "RFQ clarification and evidence register",
      registerCode: "RFQ-EV-006",
      boqItemRef: "A1/S1",
      tradeSection: "RFQ evidence control",
      category: "missing_evidence",
      status: "clarification_required",
      questionOrEvidence:
        "Separate issued evidence, missing evidence, assumptions, addenda, and subcontractor-return documents before runtime citation.",
      requiredResponseOwner: "knowledge_engineer",
      evidenceReference: firstEvidence("RFQ clarification and evidence register")?.locator,
      commercialImpact: "Missing-evidence items should block final RFQ issue until clarified or approved as assumptions.",
      pricingBasisChange: true,
      workflowGate: "approve_issue"
    },
    {
      projectId: qsRfqPilotProjectId,
      sourceId: firstEvidence("RFQ return requirements checklist")?.sourceId,
      sourceTitle: firstEvidence("RFQ return requirements checklist")?.sourceTitle,
      knowledgeObjectId: knowledgeObjectByTitle.get("RFQ return requirements checklist")?.id,
      knowledgeObjectTitle: "RFQ return requirements checklist",
      registerCode: "RFQ-EV-007",
      boqItemRef: "quotation-return",
      tradeSection: "Subcontractor return",
      category: "subcontractor_return",
      status: "under_review",
      questionOrEvidence:
        "Quotation returns should include rate, amount formula, assumptions, exclusions, lead time, validity, and evidence attachments.",
      requiredResponseOwner: "reviewer",
      evidenceReference: firstEvidence("RFQ return requirements checklist")?.locator,
      commercialImpact: "Incomplete return documents reduce quotation comparability.",
      pricingBasisChange: false,
      workflowGate: "receive_compare"
    },
    {
      projectId: qsRfqPilotProjectId,
      sourceId: firstEvidence("RFQ package issue template")?.sourceId,
      sourceTitle: firstEvidence("RFQ package issue template")?.sourceTitle,
      knowledgeObjectId: knowledgeObjectByTitle.get("RFQ package issue template")?.id,
      knowledgeObjectTitle: "RFQ package issue template",
      registerCode: "RFQ-EV-008",
      boqItemRef: "package",
      tradeSection: "Commercial package",
      category: "commercial_exception",
      status: "under_review",
      questionOrEvidence:
        "Commercial terms, exclusions schedule, alternative proposal rules, and return-document requirements must be identified before issue.",
      requiredResponseOwner: "publisher",
      evidenceReference: firstEvidence("RFQ package issue template")?.locator,
      commercialImpact: "Commercial exceptions may require explicit negotiation or package exclusion before award recommendation.",
      pricingBasisChange: true,
      workflowGate: "approve_issue"
    }
  ];
}

async function prepareQsRfqPilotSourceArtifacts() {
  for (const sourceId of qsRfqPilotSourceIds) {
    const storagePath = qsRfqPilotArtifacts[sourceId];
    const absolutePath = safeWorkspacePath(storagePath);

    if (!absolutePath) {
      throw new Error(`Unsafe pilot artifact path: ${storagePath}`);
    }

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, `${qsRfqPilotArtifactContents[sourceId]}\n`, "utf8");
    await setSourceStoragePath(sourceId, storagePath);
  }
}

function safeWorkspacePath(path: string) {
  const cwd = process.cwd();
  const workspaceRoot = cwd.endsWith(`${"apps"}\\studio`) || cwd.endsWith("apps/studio")
    ? resolve(/* turbopackIgnore: true */ cwd, "..", "..")
    : cwd;
  const resolved = resolve(/* turbopackIgnore: true */ workspaceRoot, path);
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

      return textEntry ? readFile(resolve(/* turbopackIgnore: true */ resolved, textEntry), "utf8") : undefined;
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

function sourceExtractionProfile(source: SourceSummary): PipelineSourceCoverageItem["extractionProfile"] {
  if (!source.storagePath) {
    return "metadata_fallback";
  }

  const extension = extname(source.storagePath).toLowerCase();

  if (source.storagePath.endsWith("-empty.txt")) {
    return "empty_fixture";
  }

  if (extension === ".md") {
    return "markdown_artifact";
  }

  if (extension === ".txt") {
    return "text_artifact";
  }

  if (extension) {
    return "unsupported_artifact";
  }

  return "artifact_directory";
}

function objectTypeForChunk(index: number): KnowledgeSuggestionSummary["objectType"] {
  const types: KnowledgeSuggestionSummary["objectType"][] = ["concept", "rule", "procedure", "checklist_item"];
  return types[index % types.length];
}

function suggestionTitleForChunk(source: SourceSummary, objectType: KnowledgeSuggestionSummary["objectType"], index: number) {
  const label = objectType.replaceAll("_", " ");
  return `${source.title} ${label} ${index + 1}`;
}

function buildQsRfqPilotSuggestionFromChunk(source: SourceSummary, chunk: SourceChunkSummary) {
  const pilotSuggestions: Record<string, Array<{
    title: string;
    objectType: KnowledgeSuggestionSummary["objectType"];
    description: string;
    confidence: number;
    tags: string[];
    reviewNotes: string;
  }>> = {
    "src-boq-sample": [
      {
        title: "BOQ item evidence required before RFQ issue",
        objectType: "rule",
        description:
          "Before issuing an RFQ, each BOQ item should carry item code, description, unit, quantity, drawing or specification reference, pricing basis, and clarification status.",
        confidence: 86,
        tags: ["qs", "boq", "rfq", "evidence", "pilot"],
        reviewNotes: "QS pilot fixture. Human reviewer must confirm project-specific drawings and specification references."
      },
      {
        title: "RFQ BOQ scope completeness check",
        objectType: "checklist_item",
        description:
          "Check BOQ scope against drawings, specifications, inclusions, exclusions, provisional assumptions, and related-scope items before sending the RFQ to subcontractors.",
        confidence: 84,
        tags: ["qs", "boq", "scope-completeness", "rfq", "pilot"],
        reviewNotes: "QS pilot fixture. Treat provisional quantities as assumptions until verified by a human QS."
      },
      {
        title: "Provisional BOQ quantity assumption rule",
        objectType: "rule",
        description:
          "If drawings or specifications are missing, the RFQ should mark the quantity or scope as provisional and request clarification instead of treating it as certified final quantity.",
        confidence: 82,
        tags: ["qs", "boq", "assumption", "clarification", "pilot"],
        reviewNotes: "QS pilot fixture. Contract and tender instructions remain the root records."
      },
      {
        title: "Structural BOQ RFQ evidence requirement",
        objectType: "rule",
        description:
          "Structural concrete BOQ items should carry drawing revision, specification clause, take-off basis, testing allowance, disposal scope, and ground-risk clarification before quotation comparison.",
        confidence: 84,
        tags: ["qs", "boq", "structural", "evidence", "pilot"],
        reviewNotes: "QS pilot fixture. Structural trade assumptions need human QS and engineer review before production use."
      }
    ],
    "src-rfq-template": [
      {
        title: "RFQ package issue template",
        objectType: "template",
        description:
          "A basic RFQ package should include trade scope summary, BOQ extract, drawings/specifications list, pricing return format, deadline, commercial terms, exclusions schedule, and clarification process.",
        confidence: 86,
        tags: ["qs", "rfq", "template", "procurement", "pilot"],
        reviewNotes: "QS pilot fixture. Template is a Base PKA component candidate and not client runtime state."
      },
      {
        title: "RFQ return requirements checklist",
        objectType: "checklist_item",
        description:
          "Each quotation return should provide item code, description, unit, quantity, rate, amount formula, assumptions, exclusions, lead time, validity period, and evidence attachments.",
        confidence: 85,
        tags: ["qs", "rfq", "return-requirements", "checklist", "pilot"],
        reviewNotes: "QS pilot fixture. Review against company procurement policy before production use."
      },
      {
        title: "Tender clarification log procedure",
        objectType: "procedure",
        description:
          "Record each clarification with question, originator, response, date, affected BOQ item, affected drawing/specification, and whether an addendum is required.",
        confidence: 83,
        tags: ["qs", "rfq", "clarification", "procedure", "pilot"],
        reviewNotes: "QS pilot fixture. Human reviewer should confirm authority and response ownership."
      },
      {
        title: "RFQ clarification and evidence register",
        objectType: "template",
        description:
          "The RFQ register should separate issued evidence, missing evidence, assumptions, addenda, and subcontractor-return documents for governed runtime citation.",
        confidence: 84,
        tags: ["qs", "rfq", "evidence-register", "clarification", "pilot"],
        reviewNotes: "QS pilot fixture. Runtime apps must not treat live tender correspondence as Base PKA knowledge."
      }
    ]
  };

  const sourceSuggestions = pilotSuggestions[source.id];
  const pilotSuggestion = sourceSuggestions?.[chunk.chunkIndex];

  if (!pilotSuggestion) {
    return undefined;
  }

  return {
    title: pilotSuggestion.title,
    objectType: pilotSuggestion.objectType,
    domain: source.domain,
    description: `${pilotSuggestion.description} Source-backed excerpt: ${chunk.content}`,
    confidence: pilotSuggestion.confidence,
    suggestedTags: pilotSuggestion.tags,
    evidenceExcerpt: chunk.content,
    evidenceLocator: chunk.locator,
    reviewNotes: pilotSuggestion.reviewNotes
  };
}

async function buildSuggestionFromChunk(source: SourceSummary, chunk: SourceChunkSummary) {
  const pilotSuggestion = buildQsRfqPilotSuggestionFromChunk(source, chunk);

  if (pilotSuggestion) {
    return pilotSuggestion;
  }

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
  if (qsRfqPilotSourceIds.includes(source.id as (typeof qsRfqPilotSourceIds)[number])) {
    const type: RelationshipType = source.id === "src-boq-sample" ? "supports" : "used_in";

    return {
      type,
      rationale:
        `${fromSuggestion.title} ${type.replaceAll("_", " ")} ${toSuggestion.title} as part of the QS/RFQ pilot evidence chain for RFQ package completeness.`,
      confidence: normaliseConfidence(82),
      evidenceExcerpt: fromSuggestion.evidenceExcerpt ?? toSuggestion.evidenceExcerpt,
      evidenceLocator: fromSuggestion.evidenceLocator ?? toSuggestion.evidenceLocator,
      reviewNotes: "QS pilot relationship fixture requires reviewer approval before package release."
    };
  }

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

export async function getPipelineSuggestionReviewReport(
  filters: { projectId?: string; sourceId?: string } = {}
): Promise<PipelineSuggestionReviewReport> {
  const [knowledgeSuggestions, relationshipSuggestions] = await Promise.all([
    listKnowledgeSuggestions({ ...filters, status: "all" }),
    listRelationshipSuggestions({ ...filters, status: "all" })
  ]);
  const allSuggestions = [...knowledgeSuggestions, ...relationshipSuggestions];
  const confidenceValues = allSuggestions
    .map((suggestion) => suggestion.confidence)
    .filter((confidence): confidence is number => typeof confidence === "number");
  const pendingCount = allSuggestions.filter((suggestion) => suggestion.status === "pending").length;
  const acceptedCount = allSuggestions.filter((suggestion) => suggestion.status === "accepted").length;
  const deferredCount = allSuggestions.filter((suggestion) => suggestion.status === "deferred").length;
  const rejectedCount = allSuggestions.filter((suggestion) => suggestion.status === "rejected").length;
  const lowConfidenceCount = allSuggestions.filter(
    (suggestion) => typeof suggestion.confidence === "number" && suggestion.confidence < 70
  ).length;
  const missingEvidenceCount = allSuggestions.filter((suggestion) => !suggestion.evidenceExcerpt?.trim()).length;
  const reviewNotesCount = allSuggestions.filter((suggestion) => suggestion.reviewNotes?.trim()).length;
  const averageConfidence =
    confidenceValues.length > 0
      ? Math.round(confidenceValues.reduce((total, confidence) => total + confidence, 0) / confidenceValues.length)
      : undefined;
  const recommendedAction =
    allSuggestions.length === 0
      ? "Run ingestion before reviewing suggestions."
      : pendingCount > 0
        ? "Review pending suggestions before accepting them into governed draft records."
        : lowConfidenceCount > 0 || missingEvidenceCount > 0
          ? "Inspect low-confidence or missing-evidence suggestions before release planning."
          : "Suggestion review queue is deterministic and ready for downstream governance.";

  return {
    projectId: filters.projectId,
    sourceId: filters.sourceId,
    totalSuggestions: allSuggestions.length,
    knowledgeSuggestionCount: knowledgeSuggestions.length,
    relationshipSuggestionCount: relationshipSuggestions.length,
    pendingCount,
    acceptedCount,
    deferredCount,
    rejectedCount,
    lowConfidenceCount,
    missingEvidenceCount,
    reviewNotesCount,
    averageConfidence,
    recommendedAction
  };
}

function normalizeRfqEvidenceRegisterFilter(
  filters?: string | RfqEvidenceRegisterFilter
): RfqEvidenceRegisterFilter {
  return typeof filters === "string" ? { projectId: filters } : filters ?? {};
}

function filterRfqEvidenceRegisterEntries(
  entries: RfqEvidenceRegisterEntrySummary[],
  filters: RfqEvidenceRegisterFilter = {}
) {
  const tradeSection = filters.tradeSection?.trim().toLowerCase();

  return entries.filter((entry) => {
    if (filters.projectId && entry.projectId !== filters.projectId) {
      return false;
    }
    if (filters.entryId && entry.id !== filters.entryId) {
      return false;
    }
    if (filters.category && filters.category !== "all" && entry.category !== filters.category) {
      return false;
    }
    if (filters.status && filters.status !== "all" && entry.status !== filters.status) {
      return false;
    }
    if (filters.workflowGate && filters.workflowGate !== "all" && entry.workflowGate !== filters.workflowGate) {
      return false;
    }
    if (tradeSection && !entry.tradeSection.toLowerCase().includes(tradeSection)) {
      return false;
    }

    return true;
  });
}

export async function listRfqEvidenceRegisterEntries(filters?: string | RfqEvidenceRegisterFilter) {
  const normalizedFilters = normalizeRfqEvidenceRegisterFilter(filters);

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const entries = await getPrismaClient().rfqEvidenceRegisterEntry.findMany({
      where: {
        projectId: normalizedFilters.projectId,
        id: normalizedFilters.entryId,
        category:
          normalizedFilters.category && normalizedFilters.category !== "all"
            ? normalizedFilters.category
            : undefined,
        status:
          normalizedFilters.status && normalizedFilters.status !== "all"
            ? normalizedFilters.status
            : undefined,
        workflowGate:
          normalizedFilters.workflowGate && normalizedFilters.workflowGate !== "all"
            ? normalizedFilters.workflowGate
            : undefined,
        tradeSection: normalizedFilters.tradeSection
          ? { contains: normalizedFilters.tradeSection, mode: "insensitive" }
          : undefined
      },
      include: {
        source: { select: { title: true } },
        knowledgeObject: { select: { title: true } }
      },
      orderBy: [{ registerCode: "asc" }]
    });

    return entries.map(mapRfqEvidenceRegisterEntry);
  }

  return filterRfqEvidenceRegisterEntries(workspaceStore().rfqEvidenceRegisterEntries, normalizedFilters);
}

async function upsertRfqEvidenceRegisterEntry(
  input: Omit<RfqEvidenceRegisterEntrySummary, "id" | "createdAt">,
  actor = "knowledge_engineer"
) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const prisma = getPrismaClient();
    const existing = await prisma.rfqEvidenceRegisterEntry.findUnique({
      where: {
        projectId_registerCode: {
          projectId: input.projectId,
          registerCode: input.registerCode
        }
      },
      select: { id: true }
    });
    const entry = await prisma.rfqEvidenceRegisterEntry.upsert({
      where: {
        projectId_registerCode: {
          projectId: input.projectId,
          registerCode: input.registerCode
        }
      },
      create: {
        projectId: input.projectId,
        sourceId: input.sourceId,
        knowledgeObjectId: input.knowledgeObjectId,
        registerCode: input.registerCode,
        boqItemRef: input.boqItemRef,
        tradeSection: input.tradeSection,
        category: input.category,
        status: input.status,
        questionOrEvidence: input.questionOrEvidence,
        requiredResponseOwner: input.requiredResponseOwner,
        evidenceReference: input.evidenceReference,
        commercialImpact: input.commercialImpact,
        pricingBasisChange: input.pricingBasisChange,
        workflowGate: input.workflowGate,
        metadata: {
          createdBy: actor,
          sourceTitle: input.sourceTitle,
          knowledgeObjectTitle: input.knowledgeObjectTitle
        }
      },
      update: {
        sourceId: input.sourceId,
        knowledgeObjectId: input.knowledgeObjectId,
        boqItemRef: input.boqItemRef,
        tradeSection: input.tradeSection,
        category: input.category,
        status: input.status,
        questionOrEvidence: input.questionOrEvidence,
        requiredResponseOwner: input.requiredResponseOwner,
        evidenceReference: input.evidenceReference,
        commercialImpact: input.commercialImpact,
        pricingBasisChange: input.pricingBasisChange,
        workflowGate: input.workflowGate,
        metadata: {
          updatedBy: actor,
          sourceTitle: input.sourceTitle,
          knowledgeObjectTitle: input.knowledgeObjectTitle
        }
      },
      include: {
        source: { select: { title: true } },
        knowledgeObject: { select: { title: true } }
      }
    });
    const mappedEntry = mapRfqEvidenceRegisterEntry(entry);

    await recordAuditLog({
      action: existing ? "rfq_evidence_register.updated" : "rfq_evidence_register.created",
      subjectType: "RfqEvidenceRegisterEntry",
      subjectId: mappedEntry.id,
      actorId: actor,
      detail: `${existing ? "Updated" : "Created"} RFQ evidence register entry ${mappedEntry.registerCode}: ${mappedEntry.tradeSection}`,
      metadata: {
        projectId: mappedEntry.projectId,
        registerCode: mappedEntry.registerCode,
        category: mappedEntry.category,
        status: mappedEntry.status,
        workflowGate: mappedEntry.workflowGate,
        knowledgeObjectId: mappedEntry.knowledgeObjectId
      }
    });

    return mappedEntry;
  }

  const store = workspaceStore();
  const existingIndex = store.rfqEvidenceRegisterEntries.findIndex(
    (entry) => entry.projectId === input.projectId && entry.registerCode === input.registerCode
  );
  const entry: RfqEvidenceRegisterEntrySummary = {
    ...(existingIndex >= 0
      ? store.rfqEvidenceRegisterEntries[existingIndex]
      : {
          id: localUniqueId("rfqev", input.registerCode),
          createdAt: new Date().toISOString().slice(0, 10)
        }),
    ...input
  };

  if (existingIndex >= 0) {
    store.rfqEvidenceRegisterEntries[existingIndex] = entry;
  } else {
    store.rfqEvidenceRegisterEntries.unshift(entry);
  }

  await recordAuditLog({
    action: existingIndex >= 0 ? "rfq_evidence_register.updated" : "rfq_evidence_register.created",
    subjectType: "RfqEvidenceRegisterEntry",
    subjectId: entry.id,
    actorId: actor,
    detail: `${existingIndex >= 0 ? "Updated" : "Created"} RFQ evidence register entry ${entry.registerCode}: ${entry.tradeSection}`,
    metadata: {
      projectId: entry.projectId,
      registerCode: entry.registerCode,
      category: entry.category,
      status: entry.status,
      workflowGate: entry.workflowGate,
      knowledgeObjectId: entry.knowledgeObjectId
    }
  });

  return entry;
}

export async function updateRfqEvidenceRegisterEntryStatus(input: RfqEvidenceRegisterReviewInput) {
  const actor = input.actor ?? "reviewer";

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const entry = await getPrismaClient().rfqEvidenceRegisterEntry.update({
      where: { id: input.entryId },
      data: {
        status: input.status,
        metadata: {
          lastReviewActor: actor,
          lastReviewNotes: input.notes,
          lastReviewStatus: input.status,
          lastReviewedAt: new Date().toISOString()
        }
      },
      include: {
        source: { select: { title: true } },
        knowledgeObject: { select: { title: true } }
      }
    });
    const mappedEntry = mapRfqEvidenceRegisterEntry(entry);

    await recordAuditLog({
      action: `rfq_evidence_register.${input.status}`,
      subjectType: "RfqEvidenceRegisterEntry",
      subjectId: mappedEntry.id,
      actorId: actor,
      detail: `Marked RFQ evidence register entry ${mappedEntry.registerCode} as ${input.status.replaceAll("_", " ")}.`,
      metadata: {
        projectId: mappedEntry.projectId,
        registerCode: mappedEntry.registerCode,
        status: mappedEntry.status,
        notes: input.notes
      }
    });

    return mappedEntry;
  }

  const entry = workspaceStore().rfqEvidenceRegisterEntries.find((item) => item.id === input.entryId);

  if (!entry) {
    throw new Error(`RFQ evidence register entry not found: ${input.entryId}`);
  }

  entry.status = input.status;
  await recordAuditLog({
    action: `rfq_evidence_register.${input.status}`,
    subjectType: "RfqEvidenceRegisterEntry",
    subjectId: entry.id,
    actorId: actor,
    detail: `Marked RFQ evidence register entry ${entry.registerCode} as ${input.status.replaceAll("_", " ")}.`,
    metadata: {
      projectId: entry.projectId,
      registerCode: entry.registerCode,
      status: entry.status,
      notes: input.notes
    }
  });

  return entry;
}

async function ensureQsRfqPilotEvidenceRegister(actor = "knowledge_engineer") {
  const approvedPilotObjects = (await listKnowledgeObjects({ projectId: qsRfqPilotProjectId })).filter(
    (knowledgeObject) =>
      approvedKnowledgeObject(knowledgeObject.status) && qsRfqPilotSuggestionTitles.has(knowledgeObject.title)
  );
  const entries: RfqEvidenceRegisterEntrySummary[] = [];

  for (const draft of rfqEvidenceRegisterDrafts(approvedPilotObjects)) {
    entries.push(await upsertRfqEvidenceRegisterEntry(draft, actor));
  }

  return entries;
}

export async function getRfqEvidenceRegisterReport(projectId: string): Promise<RfqEvidenceRegisterReport> {
  const entries = await listRfqEvidenceRegisterEntries({ projectId });
  const activeEntries = entries.filter((entry) => entry.status !== "superseded");
  const categoryCounts = Object.fromEntries(rfqEvidenceCategories.map((category) => [category, 0])) as Record<
    RfqEvidenceCategory,
    number
  >;
  const statusCounts = Object.fromEntries(rfqEvidenceStatuses.map((status) => [status, 0])) as Record<
    RfqEvidenceStatus,
    number
  >;

  for (const entry of entries) {
    categoryCounts[entry.category] += 1;
    statusCounts[entry.status] += 1;
  }

  const workflowGateRequirements: Array<{
    gate: RfqEvidenceRegisterEntrySummary["workflowGate"];
    requiredCategories: RfqEvidenceCategory[];
  }> = [
    { gate: "prepare", requiredCategories: ["issued_evidence"] },
    { gate: "review", requiredCategories: ["issued_evidence", "assumption"] },
    { gate: "approve_issue", requiredCategories: ["missing_evidence", "commercial_exception"] },
    { gate: "clarify", requiredCategories: ["assumption", "addendum"] },
    { gate: "receive_compare", requiredCategories: ["subcontractor_return"] }
  ];
  const workflowGateReadiness = workflowGateRequirements.map((requirement) => {
    const presentCategories = Array.from(
      new Set(
        activeEntries
          .filter((entry) => entry.workflowGate === requirement.gate)
          .map((entry) => entry.category)
      )
    );
    const missingCategories = requirement.requiredCategories.filter(
      (category) => !presentCategories.includes(category)
    );

    return {
      gate: requirement.gate,
      status: missingCategories.length === 0 ? ("ready" as const) : ("warning" as const),
      requiredCategories: requirement.requiredCategories,
      presentCategories,
      detail:
        missingCategories.length === 0
          ? `${requirement.gate.replaceAll("_", " ")} gate has required evidence categories.`
          : `${requirement.gate.replaceAll("_", " ")} gate is missing ${missingCategories.join(", ")}.`
    };
  });

  return {
    projectId,
    ready: activeEntries.length > 0 && workflowGateReadiness.every((gate) => gate.status === "ready"),
    totalEntries: entries.length,
    acceptedEntryCount: entries.filter((entry) => entry.status === "accepted").length,
    clarificationRequiredCount: entries.filter((entry) => entry.status === "clarification_required").length,
    categoryCounts,
    statusCounts,
    workflowGateReadiness
  };
}

const rfqWorkflowGateDefinitions: Array<{
  gate: RfqEvidenceRegisterEntrySummary["workflowGate"];
  title: string;
  requiredCategories: RfqEvidenceCategory[];
}> = [
  { gate: "prepare", title: "Prepare RFQ package", requiredCategories: ["issued_evidence"] },
  { gate: "review", title: "Review package completeness", requiredCategories: ["issued_evidence", "assumption"] },
  { gate: "approve_issue", title: "Approve and issue RFQ", requiredCategories: ["missing_evidence", "commercial_exception"] },
  { gate: "clarify", title: "Manage tender clarifications", requiredCategories: ["assumption", "addendum"] },
  { gate: "receive_compare", title: "Receive and compare quotation", requiredCategories: ["subcontractor_return"] }
];

function rfqEvidenceCategoryLabel(category: RfqEvidenceCategory) {
  return category.replaceAll("_", " ");
}

function rfqWorkflowGateActionLabel(actionType: RfqWorkflowGateActionType) {
  if (actionType === "attach_missing_evidence") {
    return "Attach missing evidence";
  }
  if (actionType === "request_clarification") {
    return "Request clarification";
  }
  return "Resolve commercial exception";
}

function rfqWorkflowGateActionSummary(events: GovernanceEventSummary[]) {
  return events
    .filter((event) => event.subjectType === "RfqWorkflowGate")
    .filter((event) => event.action.startsWith("rfq_workflow_gate."))
    .map((event) => ({
      actionId: event.id,
      action: event.action,
      projectId: metadataString(event.metadata, "projectId"),
      gate: metadataString(event.metadata, "gate"),
      actionType: metadataString(event.metadata, "actionType") as RfqWorkflowGateActionType | undefined,
      owner: metadataString(event.metadata, "owner"),
      dueDate: metadataString(event.metadata, "dueDate"),
      status: metadataString(event.metadata, "status") as RfqWorkflowGateActionStatus | undefined,
      actorId: event.actorId,
      detail: event.detail,
      notes: metadataString(event.metadata, "notes"),
      createdAt: event.createdAt
    }));
}

function rfqWorkflowGateActionRiskSummary(actions: RfqWorkflowGateActionRecord[]) {
  const unresolvedActions = actions.filter((action) => action.status !== "resolved");
  const blockedActions = unresolvedActions.filter((action) => action.status === "blocked");
  const overdueActions = unresolvedActions.filter((action) => action.dueState === "overdue");
  const dueTodayActions = unresolvedActions.filter((action) => action.dueState === "due_today");

  return {
    unresolvedCount: unresolvedActions.length,
    blockedCount: blockedActions.length,
    overdueCount: overdueActions.length,
    dueTodayCount: dueTodayActions.length,
    blocksPublish: blockedActions.length > 0,
    items: [...blockedActions, ...overdueActions]
      .filter((action, index, actionsByRisk) => actionsByRisk.findIndex((item) => item.id === action.id) === index)
      .map((action) => ({
        actionId: action.id,
        gate: action.gate,
        actionType: action.actionType,
        owner: action.owner,
        status: action.status,
        dueDate: action.dueDate,
        dueState: action.dueState,
        overdueDays: action.overdueDays,
        ageDays: action.ageDays,
        notes: action.notes,
        evidenceEntryIds: action.evidenceEntryIds
      }))
  };
}

async function assertNoBlockedRfqWorkflowGateActionsBeforePublish(projectId: string) {
  const blockedActions = await listRfqWorkflowGateActions({
    projectId,
    status: "blocked"
  });

  if (blockedActions.length > 0) {
    throw new Error(
      `Resolve ${blockedActions.length} blocked RFQ workflow gate action(s) before publishing the PKA package.`
    );
  }
}

function filterRfqWorkflowGateActions(
  actions: RfqWorkflowGateActionRecord[],
  filters: RfqWorkflowGateActionFilter = {}
) {
  const owner = filters.owner?.trim().toLowerCase();

  return actions.filter((action) => {
    if (filters.projectId && action.projectId !== filters.projectId) {
      return false;
    }
    if (filters.gate && filters.gate !== "all" && action.gate !== filters.gate) {
      return false;
    }
    if (filters.status && filters.status !== "all" && action.status !== filters.status) {
      return false;
    }
    if (filters.dueState && filters.dueState !== "all" && action.dueState !== filters.dueState) {
      return false;
    }
    if (owner && !action.owner.toLowerCase().includes(owner)) {
      return false;
    }
    if (filters.evidenceEntryId && !action.evidenceEntryIds.includes(filters.evidenceEntryId)) {
      return false;
    }

    return true;
  });
}

export async function listRfqWorkflowGateActions(
  filters: RfqWorkflowGateActionFilter = {}
): Promise<RfqWorkflowGateActionRecord[]> {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const actions = await getPrismaClient().rfqWorkflowGateAction.findMany({
      where: {
        projectId: filters.projectId,
        gate: filters.gate && filters.gate !== "all" ? filters.gate : undefined,
        status: filters.status && filters.status !== "all" ? filters.status : undefined,
        owner: filters.owner ? { contains: filters.owner, mode: "insensitive" } : undefined,
        evidenceEntryIds: filters.evidenceEntryId ? { has: filters.evidenceEntryId } : undefined
      },
      orderBy: { updatedAt: "desc" }
    });

    return filterRfqWorkflowGateActions(actions.map(mapRfqWorkflowGateAction), {
      dueState: filters.dueState
    });
  }

  return filterRfqWorkflowGateActions(
    workspaceStore().rfqWorkflowGateActions.map((action) =>
      withRfqWorkflowGateActionAge({
        id: action.id,
        projectId: action.projectId,
        gate: action.gate,
        actionType: action.actionType,
        owner: action.owner,
        dueDate: action.dueDate,
        status: action.status,
        notes: action.notes,
        evidenceEntryIds: action.evidenceEntryIds,
        createdAt: action.createdAt,
        updatedAt: action.updatedAt
      })
    ),
    filters
  );
}

export async function recordRfqWorkflowGateAction(input: RfqWorkflowGateActionInput) {
  const actor = input.actor ?? "reviewer";
  const detail = `${rfqWorkflowGateActionLabel(input.actionType)} for ${input.gate.replaceAll("_", " ")} gate assigned to ${input.owner}${input.dueDate ? ` by ${input.dueDate}` : ""}.`;
  let actionRecord: RfqWorkflowGateActionRecord;

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const action = await getPrismaClient().rfqWorkflowGateAction.create({
      data: {
        projectId: input.projectId,
        gate: input.gate,
        actionType: input.actionType,
        owner: input.owner,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        status: input.status,
        notes: input.notes,
        evidenceEntryIds: input.evidenceEntryIds ?? [],
        metadata: {
          actor,
          evidenceEntryIds: input.evidenceEntryIds ?? []
        }
      }
    });
    actionRecord = mapRfqWorkflowGateAction(action);
  } else {
    actionRecord = withRfqWorkflowGateActionAge({
      id: localUniqueId("rfqgate", `${input.projectId}-${input.gate}`),
      projectId: input.projectId,
      gate: input.gate,
      actionType: input.actionType,
      owner: input.owner,
      dueDate: input.dueDate,
      status: input.status,
      notes: input.notes,
      evidenceEntryIds: input.evidenceEntryIds ?? [],
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10)
    });
    workspaceStore().rfqWorkflowGateActions.unshift(actionRecord);
  }

  await recordAuditLog({
    action: `rfq_workflow_gate.${input.status}`,
    subjectType: "RfqWorkflowGate",
    subjectId: actionRecord.id,
    actorId: actor,
    detail,
    metadata: {
      actionId: actionRecord.id,
      projectId: input.projectId,
      gate: input.gate,
      actionType: input.actionType,
      owner: input.owner,
      dueDate: input.dueDate,
      status: input.status,
      notes: input.notes,
      evidenceEntryIds: input.evidenceEntryIds ?? []
    }
  });

  return actionRecord;
}

export async function updateRfqWorkflowGateAction(input: RfqWorkflowGateActionUpdateInput) {
  const actor = input.actor ?? "reviewer";
  let actionRecord: RfqWorkflowGateActionRecord;

  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const action = await getPrismaClient().rfqWorkflowGateAction.update({
      where: { id: input.actionId },
      data: {
        status: input.status,
        owner: input.owner,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        notes: input.notes,
        evidenceEntryIds: input.evidenceEntryIds,
        metadata: {
          updatedBy: actor,
          evidenceEntryIds: input.evidenceEntryIds
        }
      }
    });
    actionRecord = mapRfqWorkflowGateAction(action);
  } else {
    const action = workspaceStore().rfqWorkflowGateActions.find((item) => item.id === input.actionId);

    if (!action) {
      throw new Error(`RFQ workflow gate action not found: ${input.actionId}`);
    }

    action.status = input.status;
    action.owner = input.owner ?? action.owner;
    action.dueDate = input.dueDate ?? action.dueDate;
    action.notes = input.notes ?? action.notes;
    action.evidenceEntryIds = input.evidenceEntryIds ?? action.evidenceEntryIds;
    action.updatedAt = new Date().toISOString().slice(0, 10);
    actionRecord = withRfqWorkflowGateActionAge({
      id: action.id,
      projectId: action.projectId,
      gate: action.gate,
      actionType: action.actionType,
      owner: action.owner,
      dueDate: action.dueDate,
      status: action.status,
      notes: action.notes,
      evidenceEntryIds: action.evidenceEntryIds,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt
    });
  }

  await recordAuditLog({
    action: `rfq_workflow_gate.${input.status}`,
    subjectType: "RfqWorkflowGate",
    subjectId: actionRecord.id,
    actorId: actor,
    detail: `Updated RFQ workflow gate action ${actionRecord.gate.replaceAll("_", " ")} to ${input.status.replaceAll("_", " ")}.`,
    metadata: {
      actionId: actionRecord.id,
      projectId: actionRecord.projectId,
      gate: actionRecord.gate,
      actionType: actionRecord.actionType,
      owner: actionRecord.owner,
      dueDate: actionRecord.dueDate,
      status: actionRecord.status,
      notes: actionRecord.notes,
      evidenceEntryIds: actionRecord.evidenceEntryIds
    }
  });

  return actionRecord;
}

export async function getRfqWorkflowGateReport(projectId: string): Promise<RfqWorkflowGateReport> {
  const entries = await listRfqEvidenceRegisterEntries({ projectId });
  const gateActions = await listRfqWorkflowGateActions({ projectId });
  const gates = rfqWorkflowGateDefinitions.map((definition) => {
    const gateEntries = entries.filter((entry) => entry.workflowGate === definition.gate);
    const activeEntries = gateEntries.filter((entry) => entry.status !== "superseded");
    const presentCategories = Array.from(new Set(activeEntries.map((entry) => entry.category)));
    const missingCategories = definition.requiredCategories.filter(
      (category) => !presentCategories.includes(category)
    );
    const unresolvedStatusEntries = activeEntries.filter((entry) =>
      ["draft", "under_review", "clarification_required"].includes(entry.status)
    );
    const unresolvedMissingEvidence = activeEntries.filter(
      (entry) => entry.category === "missing_evidence" && entry.status !== "accepted"
    );
    const unresolvedCommercialExceptions = activeEntries.filter(
      (entry) => entry.category === "commercial_exception" && entry.status !== "accepted"
    );
    const remediationPrompts: string[] = [];
    const latestAction = gateActions.find((event) => event.gate === definition.gate);

    if (missingCategories.length > 0) {
      remediationPrompts.push(
        `Add or accept ${missingCategories.map(rfqEvidenceCategoryLabel).join(", ")} records before this gate can proceed.`
      );
    }
    if (unresolvedStatusEntries.length > 0) {
      remediationPrompts.push(
        `Resolve reviewer decisions for ${unresolvedStatusEntries
          .map((entry) => entry.registerCode)
          .join(", ")}.`
      );
    }
    if (unresolvedMissingEvidence.length > 0) {
      remediationPrompts.push(
        `Attach evidence, confirm an assumption, or request clarification for missing-evidence item(s): ${unresolvedMissingEvidence
          .map((entry) => entry.registerCode)
          .join(", ")}.`
      );
    }
    if (unresolvedCommercialExceptions.length > 0) {
      remediationPrompts.push(
        `Escalate commercial exception item(s) ${unresolvedCommercialExceptions
          .map((entry) => entry.registerCode)
          .join(", ")} for reviewer or publisher decision before RFQ issue.`
      );
    }

    const status =
      missingCategories.length > 0 ||
      unresolvedMissingEvidence.length > 0 ||
      unresolvedCommercialExceptions.length > 0 ||
      activeEntries.some((entry) => entry.status === "clarification_required") ||
      latestAction?.status === "blocked"
        ? ("blocked" as const)
        : unresolvedStatusEntries.length > 0 || latestAction?.status === "open" || latestAction?.status === "in_progress"
          ? ("warning" as const)
          : ("ready" as const);

    return {
      gate: definition.gate,
      title: definition.title,
      status,
      detail:
        status === "ready"
          ? `${definition.title} gate is ready from active evidence records.`
          : `${definition.title} gate needs ${remediationPrompts.length} remediation action(s).`,
      activeEntryCount: activeEntries.length,
      acceptedEntryCount: activeEntries.filter((entry) => entry.status === "accepted").length,
      clarificationRequiredCount: activeEntries.filter((entry) => entry.status === "clarification_required").length,
      missingEvidenceCount: activeEntries.filter((entry) => entry.category === "missing_evidence").length,
      commercialExceptionCount: activeEntries.filter((entry) => entry.category === "commercial_exception").length,
      supersededEntryCount: gateEntries.length - activeEntries.length,
      requiredCategories: definition.requiredCategories,
      presentCategories,
      remediationPrompts,
      followUp:
        latestAction?.actionType && latestAction.owner && latestAction.status
          ? {
              actionId: latestAction.id,
              actionType: latestAction.actionType,
              owner: latestAction.owner,
              dueDate: latestAction.dueDate,
              status: latestAction.status,
              notes: latestAction.notes,
              updatedAt: latestAction.updatedAt
            }
          : undefined,
      entries: activeEntries.map((entry) => ({
        id: entry.id,
        registerCode: entry.registerCode,
        tradeSection: entry.tradeSection,
        category: entry.category,
        status: entry.status,
        questionOrEvidence: entry.questionOrEvidence
      }))
    };
  });

  return {
    projectId,
    ready: gates.every((gate) => gate.status === "ready"),
    gates
  };
}

export async function getPipelineSourceCoverageReport(
  filters: { projectId?: string; extractionProfile?: PipelineSourceCoverageItem["extractionProfile"] | "all" } = {}
): Promise<PipelineSourceCoverageReport> {
  const [sources, chunks, knowledgeSuggestions, relationshipSuggestions] = await Promise.all([
    filters.projectId ? listSourcesByProject(filters.projectId) : listSources(),
    listSourceChunks({ projectId: filters.projectId }),
    listKnowledgeSuggestions({ projectId: filters.projectId, status: "all" }),
    listRelationshipSuggestions({ projectId: filters.projectId, status: "all" })
  ]);

  const allItems = sources.map((source) => {
    const sourceChunks = chunks.filter((chunk) => chunk.sourceId === source.id);
    const sourceSuggestions = knowledgeSuggestions.filter((suggestion) => suggestion.sourceId === source.id);
    const sourceRelationshipSuggestions = relationshipSuggestions.filter((suggestion) => suggestion.sourceId === source.id);
    const coveredChunkIds = new Set(
      [...sourceSuggestions, ...sourceRelationshipSuggestions]
        .map((suggestion) => suggestion.sourceChunkId)
        .filter((sourceChunkId): sourceChunkId is string => Boolean(sourceChunkId))
    );
    const totalTokenEstimate = sourceChunks.reduce((total, chunk) => total + (chunk.tokenEstimate ?? 0), 0);
    const coveredChunkCount = sourceChunks.filter((chunk) => coveredChunkIds.has(chunk.id)).length;
    const uncoveredChunkCount = Math.max(0, sourceChunks.length - coveredChunkCount);

    return {
      sourceId: source.id,
      sourceTitle: source.title,
      storagePath: source.storagePath,
      processingStatus: source.processingStatus,
      extractionProfile: sourceExtractionProfile(source),
      chunkCount: sourceChunks.length,
      totalTokenEstimate,
      averageChunkTokens:
        sourceChunks.length > 0 ? Math.round(totalTokenEstimate / sourceChunks.length) : 0,
      suggestionCount: sourceSuggestions.length,
      relationshipSuggestionCount: sourceRelationshipSuggestions.length,
      coveredChunkCount,
      uncoveredChunkCount,
      coverageRate: sourceChunks.length > 0 ? Math.round((coveredChunkCount / sourceChunks.length) * 100) : 0,
      isMultiChunk: sourceChunks.length > 1
    } satisfies PipelineSourceCoverageItem;
  });
  const items =
    filters.extractionProfile && filters.extractionProfile !== "all"
      ? allItems.filter((item) => item.extractionProfile === filters.extractionProfile)
      : allItems;
  const profileCounts = allItems.reduce(
    (counts, item) => {
      counts[item.extractionProfile] += 1;
      return counts;
    },
    {
      markdown_artifact: 0,
      text_artifact: 0,
      artifact_directory: 0,
      metadata_fallback: 0,
      unsupported_artifact: 0,
      empty_fixture: 0
    } satisfies Record<PipelineSourceCoverageItem["extractionProfile"], number>
  );

  const ingestedSourceCount = items.filter((item) => item.chunkCount > 0).length;
  const artifactSourceCount = items.filter((item) =>
    ["markdown_artifact", "text_artifact", "artifact_directory"].includes(item.extractionProfile)
  ).length;
  const totalChunks = items.reduce((total, item) => total + item.chunkCount, 0);

  return {
    projectId: filters.projectId,
    extractionProfile: filters.extractionProfile ?? "all",
    sourceCount: items.length,
    ingestedSourceCount,
    artifactSourceCount,
    metadataFallbackSourceCount: items.filter((item) => item.extractionProfile === "metadata_fallback").length,
    unsupportedSourceCount: items.filter((item) => item.extractionProfile === "unsupported_artifact").length,
    emptySourceCount: items.filter((item) => item.extractionProfile === "empty_fixture").length,
    multiChunkSourceCount: items.filter((item) => item.isMultiChunk).length,
    totalChunks,
    totalTokenEstimate: items.reduce((total, item) => total + item.totalTokenEstimate, 0),
    totalSuggestions: items.reduce(
      (total, item) => total + item.suggestionCount + item.relationshipSuggestionCount,
      0
    ),
    averageChunksPerIngestedSource:
      ingestedSourceCount > 0 ? Math.round((totalChunks / ingestedSourceCount) * 10) / 10 : 0,
    profileCounts,
    items
  };
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

export function listRuntimeQaFixtureQuestions(): RuntimeQaFixtureQuestion[] {
  return [
    {
      id: "runtime-qa-rfq-package-completeness",
      question: "What should be checked before issuing an RFQ package from a BOQ?",
      expectedCitationRequirement:
        "Answer must cite at least one approved Knowledge Object and one source evidence excerpt.",
      requiredContextTypes: ["knowledge_object", "source_evidence"]
    },
    {
      id: "runtime-qa-relationship-support",
      question: "Which approved knowledge supports the RFQ completeness workflow?",
      expectedCitationRequirement:
        "Answer must cite one approved Knowledge Object and any available governed relationship edge.",
      requiredContextTypes: ["knowledge_object", "relationship"]
    },
    {
      id: "runtime-qa-boundary-check",
      question: "Can draft pipeline suggestions be used as runtime answer context?",
      expectedCitationRequirement:
        "Answer must cite the runtime instruction that limits context to published packages and approved knowledge.",
      requiredContextTypes: ["runtime_instruction"]
    }
  ];
}

function latestPublishedPackage(packages: PkaPackageSummary[]) {
  return packages.find((pkaPackage) => pkaPackage.status === "published");
}

export async function getRuntimeQaContextBundlePreview(projectId: string): Promise<RuntimeQaContextBundlePreview> {
  const [packages, knowledgeObjects, relationships] = await Promise.all([
    listPkaPackages(projectId),
    listKnowledgeObjects({ projectId }),
    listKnowledgeRelationships({ projectId })
  ]);
  const publishedPackage = latestPublishedPackage(packages);
  const approvedKnowledgeObjects = knowledgeObjects.filter((knowledgeObject) =>
    approvedKnowledgeObject(knowledgeObject.status)
  );
  const approvedIds = new Set(approvedKnowledgeObjects.map((knowledgeObject) => knowledgeObject.id));
  const approvedRelationships = relationships.filter(
    (relationship) =>
      approvedKnowledgeObject(relationship.status) &&
      approvedIds.has(relationship.fromId) &&
      approvedIds.has(relationship.toId)
  );
  const sourceEvidenceById = new Map<string, SourceEvidenceSummary>();

  for (const knowledgeObject of approvedKnowledgeObjects) {
    for (const evidence of knowledgeObject.evidenceLinks) {
      sourceEvidenceById.set(evidence.id, evidence);
    }
  }

  const manifest = publishedPackage?.manifest ?? {};

  return {
    query: "deterministic runtime Q&A context preview",
    pka: {
      packageId:
        typeof manifest.packageId === "string"
          ? manifest.packageId
          : publishedPackage?.packageId ?? "unpublished-package",
      version:
        typeof manifest.version === "string"
          ? manifest.version
          : publishedPackage?.version ?? "0.0.0",
      domain:
        typeof manifest.domain === "string"
          ? manifest.domain
          : approvedKnowledgeObjects[0]?.domain ?? "unknown",
      name:
        typeof manifest.name === "string"
          ? manifest.name
          : publishedPackage?.name
    },
    packageRecordId: publishedPackage?.id,
    packageStatus: publishedPackage?.status,
    retrievedAt: new Date().toISOString(),
    governanceMode: "published_only",
    knowledgeObjects: approvedKnowledgeObjects.map((knowledgeObject) => ({
      id: knowledgeObject.id,
      title: knowledgeObject.title,
      type: knowledgeObject.objectType,
      status: knowledgeObject.status,
      summary: knowledgeObject.description,
      confidence: knowledgeObject.confidence,
      sourceRefs: knowledgeObject.evidenceLinks.map((evidence) => evidence.sourceId)
    })),
    relationships: approvedRelationships.map((relationship) => ({
      fromId: relationship.fromId,
      toId: relationship.toId,
      type: relationship.type,
      confidence: relationship.confidence,
      provenanceRefs: [
        relationship.provenanceNote,
        relationship.evidenceSourceId,
        relationship.evidenceLocator
      ].filter((value): value is string => Boolean(value))
    })),
    rules: [],
    workflows: [],
    templates: [],
    sourceEvidence: Array.from(sourceEvidenceById.values()).map((evidence) => ({
      sourceId: evidence.sourceId,
      title: evidence.sourceTitle,
      excerpt: evidence.excerpt,
      locator: evidence.locator
    })),
    runtimeInstructions: [
      "Use published package context only.",
      "Use approved, expert_validated, or published Knowledge Objects only.",
      "Every answer must cite source evidence when source evidence is available.",
      "Do not use draft KOs, unapproved suggestions, client vault state, or runtime user data."
    ],
    limitations: [
      "This is a deterministic context preview, not an AI answer.",
      "No provider, model router, Ollama adapter, embedding, or retrieval ranking is executed.",
      publishedPackage ? "Published package metadata is available." : "No published package is available yet."
    ],
    fixtureQuestions: listRuntimeQaFixtureQuestions()
  };
}

export async function getRuntimeQaAnswerReadinessReport(
  projectId: string
): Promise<RuntimeQaAnswerReadinessReport> {
  const contextBundle = await getRuntimeQaContextBundlePreview(projectId);
  const items: ReadinessHint[] = [];

  if (!contextBundle.packageRecordId) {
    items.push({
      id: "runtime-qa-missing-published-package",
      level: "warning",
      title: "Published package missing",
      detail: "Runtime Q&A requires a published package before answer context can be considered ready."
    });
  }

  if (contextBundle.knowledgeObjects.length === 0) {
    items.push({
      id: "runtime-qa-missing-approved-knowledge-objects",
      level: "warning",
      title: "Approved Knowledge Objects missing",
      detail: "Runtime Q&A requires approved, expert_validated, or published Knowledge Objects."
    });
  }

  const citationRequired = contextBundle.fixtureQuestions.some((fixture) =>
    fixture.requiredContextTypes.includes("source_evidence")
  );
  if (citationRequired && contextBundle.sourceEvidence.length === 0) {
    items.push({
      id: "runtime-qa-missing-citations",
      level: "warning",
      title: "Citation candidates missing",
      detail: "At least one fixture question requires source evidence citation, but the context bundle has no source evidence."
    });
  }

  const relationshipRequired = contextBundle.fixtureQuestions.some((fixture) =>
    fixture.requiredContextTypes.includes("relationship")
  );
  if (relationshipRequired && contextBundle.relationships.length === 0) {
    items.push({
      id: "runtime-qa-missing-governed-relationships",
      level: "warning",
      title: "Governed relationship context missing",
      detail: "At least one fixture question requires governed relationship context between approved Knowledge Objects."
    });
  }

  if (items.length === 0) {
    items.push({
      id: "runtime-qa-answer-context-ready",
      level: "ready",
      title: "Runtime Q&A answer context ready",
      detail: "Published package, approved knowledge, source citations, and governed relationship context are available."
    });
  }

  return {
    projectId,
    ready: items.every((item) => item.level !== "warning"),
    missingCitationCount: items.filter((item) => item.id === "runtime-qa-missing-citations").length,
    missingPublishedPackageCount: items.filter((item) => item.id === "runtime-qa-missing-published-package").length,
    missingApprovedKnowledgeObjectCount: items.filter(
      (item) => item.id === "runtime-qa-missing-approved-knowledge-objects"
    ).length,
    missingGovernedRelationshipCount: items.filter(
      (item) => item.id === "runtime-qa-missing-governed-relationships"
    ).length,
    items
  };
}

function deterministicRuntimeAnswerForFixture(
  fixture: RuntimeQaFixtureQuestion,
  contextBundle: RuntimeQaContextBundlePreview,
  missingContextTypes: string[]
) {
  if (missingContextTypes.length > 0) {
    return `Blocked deterministically. Missing context: ${missingContextTypes.join(", ")}.`;
  }

  const firstKo = contextBundle.knowledgeObjects[0];
  const secondKo = contextBundle.knowledgeObjects[1] ?? firstKo;
  const firstEvidence = contextBundle.sourceEvidence[0];
  const firstRelationship = contextBundle.relationships[0];

  if (fixture.id === "runtime-qa-rfq-package-completeness") {
    return [
      "Before issuing an RFQ package from a BOQ, check that BOQ item code, description, unit, quantity, drawing/specification references, pricing basis, assumptions, exclusions, and clarification status are complete.",
      `Cites KO: ${firstKo.title}.`,
      `Cites source evidence: ${firstEvidence.title}${firstEvidence.locator ? ` (${firstEvidence.locator})` : ""}.`
    ].join(" ");
  }

  if (fixture.id === "runtime-qa-relationship-support") {
    return [
      `${firstKo.title} and ${secondKo.title} form the governed support path for the RFQ completeness workflow.`,
      firstRelationship
        ? `Cites relationship: ${firstRelationship.fromId} ${firstRelationship.type} ${firstRelationship.toId}.`
        : "No relationship citation available."
    ].join(" ");
  }

  return [
    "Draft pipeline suggestions cannot be used as runtime answer context.",
    `Cites runtime instruction: ${contextBundle.runtimeInstructions[3] ?? contextBundle.runtimeInstructions[0]}.`
  ].join(" ");
}

export async function getRuntimeQaFixtureEvaluationReport(
  projectId: string
): Promise<RuntimeQaFixtureEvaluationReport> {
  const contextBundle = await getRuntimeQaContextBundlePreview(projectId);
  const evaluations = contextBundle.fixtureQuestions.map((fixture) => {
    const missingContextTypes = fixture.requiredContextTypes.filter((contextType) => {
      if (contextType === "knowledge_object") {
        return contextBundle.knowledgeObjects.length === 0;
      }

      if (contextType === "source_evidence") {
        return contextBundle.sourceEvidence.length === 0;
      }

      if (contextType === "relationship") {
        return contextBundle.relationships.length === 0;
      }

      if (contextType === "runtime_instruction") {
        return contextBundle.runtimeInstructions.length === 0;
      }

      return true;
    });

    const status: RuntimeQaFixtureEvaluation["status"] =
      missingContextTypes.length === 0 ? "ready" : "blocked";

    return {
      id: fixture.id,
      question: fixture.question,
      status,
      requiredContextTypes: fixture.requiredContextTypes,
      missingContextTypes,
      citedKnowledgeObjectTitles: contextBundle.knowledgeObjects.slice(0, 2).map((knowledgeObject) => knowledgeObject.title),
      citedSourceEvidence: contextBundle.sourceEvidence
        .slice(0, 2)
        .map((evidence) => `${evidence.title}${evidence.locator ? ` / ${evidence.locator}` : ""}`),
      citedRelationshipCount: contextBundle.relationships.length,
      deterministicAnswer: deterministicRuntimeAnswerForFixture(fixture, contextBundle, missingContextTypes)
    };
  });

  return {
    projectId,
    ready: evaluations.every((evaluation) => evaluation.status === "ready"),
    evaluations
  };
}

function manufacturingStageStatus(ready: boolean, blocked: boolean): ManufacturingLineStageStatus {
  if (blocked) {
    return "blocked";
  }

  return ready ? "ready" : "building";
}

function manufacturingValidationArticle(projectId: string) {
  return projectId === qsRfqPilotProjectId
    ? "QS/RFQ from BOQ Base PKA"
    : "No validation article assigned yet";
}

export async function getManufacturingLineRunReport(projectId: string): Promise<ManufacturingLineRunReport> {
  const project = (await listProjects()).find((item) => item.id === projectId);
  if (!project) {
    throw new Error("Project is required for Manufacturing Line reporting.");
  }

  const [
    sources,
    sourceChunks,
    knowledgeObjects,
    relationships,
    packages,
    pipelineMetrics,
    relationshipClosure,
    releaseReadinessHints,
    packageValidation,
    runtimeQaReadiness,
    fixtureEvaluation
  ] = await Promise.all([
    listSourcesByProject(projectId),
    listSourceChunks({ projectId }),
    listKnowledgeObjects({ projectId }),
    listKnowledgeRelationships({ projectId }),
    listPkaPackages(projectId),
    getPipelineQualityMetrics({ projectId }),
    getRelationshipEvidenceClosureReport(projectId),
    getPkaReleaseReadinessHints(projectId),
    getPkaPackageValidationReport(projectId),
    getRuntimeQaAnswerReadinessReport(projectId),
    getRuntimeQaFixtureEvaluationReport(projectId)
  ]);
  const approvedKnowledgeObjects = knowledgeObjects.filter((knowledgeObject) =>
    approvedKnowledgeObject(knowledgeObject.status)
  );
  const approvedRelationships = relationships.filter((relationship) => relationship.status === "approved");
  const packageRecord = latestPublishedPackage(packages) ?? packages[0];
  const publishedPackage = packageRecord?.status === "published" ? packageRecord : undefined;
  const runtimeImport = publishedPackage
    ? await validateRuntimePkaImportReadback(publishedPackage.packageId)
    : undefined;
  const runtimeHandoff = publishedPackage
    ? await validateRuntimeAppDeveloperHandoff(publishedPackage.packageId)
    : undefined;
  const handoffFeedback = publishedPackage
    ? await listRuntimeHandoffFeedback(publishedPackage.packageId)
    : undefined;
  const releaseBlockerCount = releaseReadinessHints.filter((hint) => hint.level === "warning").length;
  const packageValidationBlockerCount = packageValidation.filter((item) => item.level === "warning").length;
  const validationArticle = manufacturingValidationArticle(projectId);
  const stageInputs = [
    {
      id: "source_intake" as const,
      title: "Source Intake",
      ready: sources.length > 0,
      blocked: sources.length === 0,
      capability: "Register trusted source materials.",
      genericRequirement: "Every PKA project declares source inputs with ownership, usage policy, provenance, and processing status.",
      metric: `${sources.length} source(s) registered`,
      detail:
        sources.length > 0
          ? "Source records are available for the selected PKA project."
          : "Register at least one trusted source before manufacturing can begin.",
      href: `/sources?projectId=${projectId}`
    },
    {
      id: "preparation_extraction" as const,
      title: "Preparation and Extraction",
      ready: sourceChunks.length > 0 && pipelineMetrics.acceptedSuggestionCount > 0,
      blocked: sources.length > 0 && sourceChunks.length === 0,
      capability: "Prepare source artifacts and create reviewable candidates.",
      genericRequirement: "Extraction creates traceable chunks, KO suggestions, and relationship suggestions while AI output remains draft.",
      metric: `${sourceChunks.length} chunk(s), ${pipelineMetrics.acceptedSuggestionCount} accepted suggestion(s)`,
      detail:
        sourceChunks.length > 0
          ? "The manufacturing pipeline has prepared source chunks and suggestion decisions."
          : "Run ingestion to prepare source chunks and deterministic candidates.",
      href: `/pipeline?projectId=${projectId}`
    },
    {
      id: "ko_manufacturing" as const,
      title: "Knowledge Object Manufacturing",
      ready: approvedKnowledgeObjects.length > 0,
      blocked: knowledgeObjects.length === 0,
      capability: "Convert candidates into governed Knowledge Objects.",
      genericRequirement: "KOs become reusable manufactured components with lifecycle, ownership, metadata, and source evidence.",
      metric: `${approvedKnowledgeObjects.length}/${knowledgeObjects.length} release-grade KO(s)`,
      detail:
        approvedKnowledgeObjects.length > 0
          ? "Approved or release-grade Knowledge Objects are ready for PKA assembly."
          : "Accept, evidence, and approve Knowledge Objects before package release.",
      href: `/knowledge-objects?projectId=${projectId}`
    },
    {
      id: "relationship_evidence" as const,
      title: "Relationship and Evidence Manufacturing",
      ready: relationshipClosure.releaseGradeCount > 0 && relationshipClosure.needsReworkCount === 0,
      blocked: approvedKnowledgeObjects.length > 1 && relationships.length === 0,
      capability: "Create governed relationships with provenance and evidence.",
      genericRequirement: "Relationships support graph inspection, retrieval, package export, and governance review.",
      metric: `${relationshipClosure.releaseGradeCount}/${relationshipClosure.totalRelationshipCount} release-grade relationship(s)`,
      detail:
        relationshipClosure.ready && relationshipClosure.releaseGradeCount > 0
          ? "Package-relevant relationships are release-grade or intentionally excluded from release."
          : relationships.length > 0
            ? "Repair or explicitly exclude non-release-grade relationship edges before factory closure."
          : "Create governed KO relationships before runtime graph traversal can be trusted.",
      href: `/ontology?projectId=${projectId}`
    },
    {
      id: "human_governance" as const,
      title: "Human Governance",
      ready: releaseBlockerCount === 0 && approvedKnowledgeObjects.length > 0,
      blocked: releaseBlockerCount > 0,
      capability: "Review, approve, version, and audit manufactured knowledge.",
      genericRequirement: "No PKA can publish with release-blocking governance gaps.",
      metric: `${releaseBlockerCount} release blocker(s)`,
      detail:
        releaseBlockerCount === 0
          ? "Release-blocking governance checks are clear."
          : "Resolve Review and release-readiness blockers before publication.",
      href: `/review?projectId=${projectId}&queueStatus=all&blockerType=all`
    },
    {
      id: "pka_assembly" as const,
      title: "PKA Assembly",
      ready: Boolean(packageRecord) && packageValidationBlockerCount === 0,
      blocked: approvedKnowledgeObjects.length > 0 && !packageRecord,
      capability: "Assemble approved components into a structured Base PKA package.",
      genericRequirement: "Package structure is generic, inspectable, versioned, and runtime-boundary aware.",
      metric: packageRecord ? `${packageRecord.packageId} / ${packageRecord.status}` : "no package",
      detail:
        packageRecord && packageValidationBlockerCount === 0
          ? "The selected PKA project has an assembled package with passing local validation."
          : "Assemble and validate a package after governance blockers are clear.",
      href: `/pka-builder?projectId=${projectId}`
    },
    {
      id: "release_publication" as const,
      title: "Release and Publication",
      ready: Boolean(publishedPackage),
      blocked: Boolean(packageRecord) && packageRecord?.status !== "published",
      capability: "Separate draft assembly from release approval and immutable publication.",
      genericRequirement: "Published PKA versions are retained and cannot be overwritten.",
      metric: publishedPackage ? `${publishedPackage.packageId} published` : packageRecord?.status ?? "not started",
      detail: publishedPackage
        ? "An immutable published package is available for handoff and consumption validation."
        : "Submit, approve, and publish the package through the release workflow.",
      href: `/pka-builder?projectId=${projectId}`
    },
    {
      id: "runtime_handoff" as const,
      title: "Runtime Handoff",
      ready: runtimeHandoff?.decision === "installable",
      blocked: Boolean(publishedPackage) && runtimeHandoff?.decision === "blocked",
      capability: "Expose package handoff checks for runtime/app developers.",
      genericRequirement: "Runtime apps receive package contracts and focused governed context, not client vault state.",
      metric: runtimeHandoff?.decision ?? "waiting for published package",
      detail:
        runtimeHandoff?.decision === "installable"
          ? "The app-developer handoff is installable and feedback-ready."
          : "Publish a package with a valid runtime handoff before runtime developers consume it.",
      href: `/runtime-handoff?projectId=${projectId}`
    },
    {
      id: "consumption_validation" as const,
      title: "Consumption Validation",
      ready: runtimeImport?.status === "importable" && runtimeQaReadiness.ready && fixtureEvaluation.ready,
      blocked: Boolean(publishedPackage) && runtimeImport?.status === "blocked",
      capability: "Validate package consumption before AI/runtime execution.",
      genericRequirement: "Import/readback and deterministic Q&A readiness pass without Ollama or model calls.",
      metric: `${runtimeImport?.status ?? "no import"} / ${runtimeQaReadiness.ready ? "Q&A ready" : "Q&A blocked"}`,
      detail:
        runtimeImport?.status === "importable" && runtimeQaReadiness.ready && fixtureEvaluation.ready
          ? "Runtime import and deterministic Q&A readiness are validated."
          : "Run package readback/import and clear runtime Q&A context blockers.",
      href: `/runtime-import?projectId=${projectId}`
    },
    {
      id: "continuous_improvement" as const,
      title: "Continuous Improvement",
      ready: Boolean(handoffFeedback && handoffFeedback.totalFeedbackCount > 0),
      blocked: false,
      capability: "Route feedback and quality signals into future manufacturing revisions.",
      genericRequirement: "PKA improvements return through KF governance instead of mutating runtime/client state.",
      metric: `${handoffFeedback?.totalFeedbackCount ?? 0} handoff feedback record(s)`,
      detail:
        handoffFeedback && handoffFeedback.totalFeedbackCount > 0
          ? `${handoffFeedback.relationshipEvidenceDecision.replaceAll("_", " ")}.`
          : "Record runtime/app-developer feedback after handoff inspection.",
      href: `/runtime-handoff?projectId=${projectId}`
    }
  ];
  const stages: ManufacturingLineStage[] = stageInputs.map((stage, index) => {
    const status = manufacturingStageStatus(stage.ready, stage.blocked);

    return {
      id: stage.id,
      stageNumber: index + 1,
      title: stage.title,
      status,
      capability: stage.capability,
      genericRequirement: stage.genericRequirement,
      validationArticle,
      metric: stage.metric,
      detail: stage.detail,
      href: stage.href
    };
  });
  const readyStageCount = stages.filter((stage) => stage.status === "ready").length;
  const buildingStageCount = stages.filter((stage) => stage.status === "building").length;
  const blockedStageCount = stages.filter((stage) => stage.status === "blocked").length;

  return {
    projectId,
    projectName: project.name,
    status:
      blockedStageCount > 0
        ? "blocked"
        : readyStageCount === stages.length
          ? "ready"
          : "building",
    validationArticle,
    summary: {
      readyStageCount,
      buildingStageCount,
      blockedStageCount,
      sourceCount: sources.length,
      chunkCount: sourceChunks.length,
      approvedKnowledgeObjectCount: approvedKnowledgeObjects.length,
      approvedRelationshipCount: approvedRelationships.length,
      latestPackageStatus: packageRecord?.status,
      latestPackageId: packageRecord?.packageId,
      runtimeImportStatus: runtimeImport?.status,
      runtimeHandoffDecision: runtimeHandoff?.decision,
      runtimeQaReady: runtimeQaReadiness.ready && fixtureEvaluation.ready
    },
    stages,
    nextActions: stages
      .filter((stage) => stage.status !== "ready")
      .slice(0, 3)
      .map((stage) => `${stage.title}: ${stage.detail}`)
  };
}

const closedMissionStatuses: MissionStatus[] = ["completed", "verified", "closed", "cancelled"];

function manufacturingWorkOrderStatus(input: {
  complete: boolean;
  blocked: boolean;
  waitingForApproval: boolean;
  running: boolean;
  ready: boolean;
}): ManufacturingWorkOrderStatus {
  if (input.blocked) {
    return "blocked";
  }

  if (input.complete) {
    return "complete";
  }

  if (input.waitingForApproval) {
    return "waiting_for_approval";
  }

  if (input.running) {
    return "running";
  }

  return input.ready ? "ready_to_run" : "not_started";
}

function manufacturingWorkOrderDefinition(workOrderId: string) {
  const definitions = [
    {
      id: "source-to-ko",
      title: "Source-to-KO work order",
      ownerRole: "knowledge_engineer" as const,
      missionStage: "manufacturing:source-to-ko"
    },
    {
      id: "graph-governance",
      title: "Relationship and governance work order",
      ownerRole: "reviewer" as const,
      missionStage: "manufacturing:graph-governance"
    },
    {
      id: "ko-to-package",
      title: "KO-to-package work order",
      ownerRole: "publisher" as const,
      missionStage: "manufacturing:ko-to-package"
    },
    {
      id: "runtime-validation",
      title: "Runtime validation work order",
      ownerRole: "runtime_consumer" as const,
      missionStage: "manufacturing:runtime-validation"
    },
    {
      id: "continuous-improvement",
      title: "Continuous improvement work order",
      ownerRole: "knowledge_architect" as const,
      missionStage: "manufacturing:continuous-improvement"
    }
  ];

  return definitions.find((definition) => definition.id === workOrderId);
}

function workOrderMissionCounts(missions: MissionSummary[], missionStage: string) {
  const matchingMissions = missions.filter((mission) => mission.stage === missionStage);

  return {
    missionCount: matchingMissions.length,
    openMissionCount: matchingMissions.filter((mission) => !closedMissionStatuses.includes(mission.status)).length,
    running: matchingMissions.some((mission) => mission.status === "running")
  };
}

export async function getManufacturingWorkOrderReport(projectId: string): Promise<ManufacturingWorkOrderReport> {
  const project = (await listProjects()).find((item) => item.id === projectId);
  if (!project) {
    throw new Error("Project is required for Manufacturing Work Order reporting.");
  }

  const [
    sources,
    sourceChunks,
    knowledgeObjects,
    relationships,
    packages,
    pipelineMetrics,
    relationshipClosure,
    releaseReadinessHints,
    runtimeQaReadiness,
    fixtureEvaluation,
    missions
  ] = await Promise.all([
    listSourcesByProject(projectId),
    listSourceChunks({ projectId }),
    listKnowledgeObjects({ projectId }),
    listKnowledgeRelationships({ projectId }),
    listPkaPackages(projectId),
    getPipelineQualityMetrics({ projectId }),
    getRelationshipEvidenceClosureReport(projectId),
    getPkaReleaseReadinessHints(projectId),
    getRuntimeQaAnswerReadinessReport(projectId),
    getRuntimeQaFixtureEvaluationReport(projectId),
    listMissions()
  ]);
  const approvedKnowledgeObjects = knowledgeObjects.filter((knowledgeObject) =>
    approvedKnowledgeObject(knowledgeObject.status)
  );
  const approvedRelationships = relationships.filter((relationship) => relationship.status === "approved");
  const packageRecord = latestPublishedPackage(packages) ?? packages[0];
  const publishedPackage = packageRecord?.status === "published" ? packageRecord : undefined;
  const runtimeImport = publishedPackage
    ? await validateRuntimePkaImportReadback(publishedPackage.packageId)
    : undefined;
  const runtimeHandoff = publishedPackage
    ? await validateRuntimeAppDeveloperHandoff(publishedPackage.packageId)
    : undefined;
  const handoffFeedback = publishedPackage
    ? await listRuntimeHandoffFeedback(publishedPackage.packageId)
    : undefined;
  const releaseBlockerCount = releaseReadinessHints.filter((hint) => hint.level === "warning").length;

  const sourceToKoMission = workOrderMissionCounts(missions, "manufacturing:source-to-ko");
  const graphGovernanceMission = workOrderMissionCounts(missions, "manufacturing:graph-governance");
  const koToPackageMission = workOrderMissionCounts(missions, "manufacturing:ko-to-package");
  const runtimeValidationMission = workOrderMissionCounts(missions, "manufacturing:runtime-validation");
  const continuousImprovementMission = workOrderMissionCounts(missions, "manufacturing:continuous-improvement");

  const sourceToKnowledgeObject: ManufacturingWorkOrder = {
    id: "source-to-ko",
    phase: "source_to_ko",
    title: "Source-to-KO work order",
    status: manufacturingWorkOrderStatus({
      complete: approvedKnowledgeObjects.length > 0 && sourceChunks.length > 0,
      blocked: sources.length === 0,
      waitingForApproval: knowledgeObjects.length > 0 && approvedKnowledgeObjects.length === 0,
      running: sourceToKoMission.running,
      ready: sources.length > 0
    }),
    objective: "Turn registered sources into source-backed Knowledge Object candidates and release-grade KOs.",
    ownerRole: "knowledge_engineer",
    stageRange: "Source Intake -> Preparation and Extraction -> KO Manufacturing",
    inputSignal: `${sources.length} source(s), ${sourceChunks.length} chunk(s), ${pipelineMetrics.pendingSuggestionCount} pending suggestion(s)`,
    outputSignal: `${approvedKnowledgeObjects.length}/${knowledgeObjects.length} release-grade KO(s)`,
    approvalCheckpoint: "AI/deterministic suggestions stay draft until a human accepts and approves the resulting KO.",
    runControlLabel: "Open Pipeline",
    href: `/pipeline?projectId=${projectId}`,
    missionStage: "manufacturing:source-to-ko",
    missionCount: sourceToKoMission.missionCount,
    openMissionCount: sourceToKoMission.openMissionCount,
    nextAction:
      sources.length === 0
        ? "Register source inputs."
        : approvedKnowledgeObjects.length > 0
          ? "Continue evidence and relationship manufacturing."
          : "Run ingestion, accept suitable candidates, and send KOs for review."
  };
  const graphGovernance: ManufacturingWorkOrder = {
    id: "graph-governance",
    phase: "graph_governance",
    title: "Relationship and governance work order",
    status: manufacturingWorkOrderStatus({
      complete: relationshipClosure.releaseGradeCount > 0 && relationshipClosure.needsReworkCount === 0 && releaseBlockerCount === 0,
      blocked: approvedKnowledgeObjects.length < 2,
      waitingForApproval: relationships.length > 0 && (releaseBlockerCount > 0 || relationshipClosure.needsReworkCount > 0),
      running: graphGovernanceMission.running,
      ready: approvedKnowledgeObjects.length >= 2
    }),
    objective: "Create governed relationships and clear human-review release blockers.",
    ownerRole: "reviewer",
    stageRange: "Relationship and Evidence Manufacturing -> Human Governance",
    inputSignal: `${approvedKnowledgeObjects.length} release-grade KO(s), ${relationships.length} graph edge(s)`,
    outputSignal: `${relationshipClosure.releaseGradeCount} release-grade relationship(s), ${relationshipClosure.needsReworkCount} rework edge(s), ${releaseBlockerCount} release blocker(s)`,
    approvalCheckpoint: "Reviewers must approve KOs, relationship provenance, evidence coverage, and release-blocking checks.",
    runControlLabel: "Open Review",
    href: `/review?projectId=${projectId}&queueStatus=all&blockerType=all`,
    missionStage: "manufacturing:graph-governance",
    missionCount: graphGovernanceMission.missionCount,
    openMissionCount: graphGovernanceMission.openMissionCount,
    nextAction:
      approvedKnowledgeObjects.length < 2
        ? "Approve enough KOs to create governed graph relationships."
        : relationshipClosure.needsReworkCount > 0
          ? "Repair or explicitly exclude relationship edges that are not release-grade."
          : releaseBlockerCount > 0
            ? "Resolve review and release-readiness blockers."
          : "Move the governed set into package assembly."
  };
  const knowledgeObjectToPackage: ManufacturingWorkOrder = {
    id: "ko-to-package",
    phase: "ko_to_package",
    title: "KO-to-package work order",
    status: manufacturingWorkOrderStatus({
      complete: Boolean(publishedPackage),
      blocked: approvedKnowledgeObjects.length === 0,
      waitingForApproval: Boolean(packageRecord) && packageRecord?.status !== "published",
      running: koToPackageMission.running,
      ready: approvedKnowledgeObjects.length > 0
    }),
    objective: "Assemble release-grade KOs, relationships, sources, governance, and component indexes into a Base PKA.",
    ownerRole: "publisher",
    stageRange: "PKA Assembly -> Release and Publication",
    inputSignal: `${approvedKnowledgeObjects.length} release-grade KO(s), ${approvedRelationships.length} approved relationship(s)`,
    outputSignal: packageRecord ? `${packageRecord.packageId} / ${packageRecord.status}` : "no package assembled",
    approvalCheckpoint: "Draft package assembly is separate from release approval and immutable publication.",
    runControlLabel: "Open PKA Builder",
    href: `/pka-builder?projectId=${projectId}`,
    missionStage: "manufacturing:ko-to-package",
    missionCount: koToPackageMission.missionCount,
    openMissionCount: koToPackageMission.openMissionCount,
    nextAction: publishedPackage
      ? "Validate runtime handoff and consumption."
      : packageRecord
        ? "Complete package release review and publish when approved."
        : "Assemble the first package draft."
  };
  const runtimeValidation: ManufacturingWorkOrder = {
    id: "runtime-validation",
    phase: "runtime_validation",
    title: "Runtime validation work order",
    status: manufacturingWorkOrderStatus({
      complete: runtimeImport?.status === "importable" && runtimeHandoff?.decision === "installable" && runtimeQaReadiness.ready && fixtureEvaluation.ready,
      blocked: !publishedPackage || runtimeImport?.status === "blocked" || runtimeHandoff?.decision === "blocked",
      waitingForApproval: runtimeHandoff?.decision === "installation_review_required",
      running: runtimeValidationMission.running,
      ready: Boolean(publishedPackage)
    }),
    objective: "Prove a runtime/app developer can read the published PKA contract before model execution.",
    ownerRole: "runtime_consumer",
    stageRange: "Runtime Handoff -> Consumption Validation",
    inputSignal: publishedPackage ? `${publishedPackage.packageId} published` : "no published package",
    outputSignal: `${runtimeHandoff?.decision ?? "no handoff"} / ${runtimeImport?.status ?? "no import"} / ${
      runtimeQaReadiness.ready && fixtureEvaluation.ready ? "Q&A ready" : "Q&A blocked"
    }`,
    approvalCheckpoint: "Runtime import and handoff checks must pass before any app treats the PKA as installable.",
    runControlLabel: "Open Runtime Handoff",
    href: `/runtime-handoff?projectId=${projectId}`,
    missionStage: "manufacturing:runtime-validation",
    missionCount: runtimeValidationMission.missionCount,
    openMissionCount: runtimeValidationMission.openMissionCount,
    nextAction: publishedPackage
      ? "Run handoff, import, and deterministic Q&A readiness checks."
      : "Publish a governed package before runtime validation."
  };
  const continuousImprovement: ManufacturingWorkOrder = {
    id: "continuous-improvement",
    phase: "continuous_improvement",
    title: "Continuous improvement work order",
    status: manufacturingWorkOrderStatus({
      complete: Boolean(handoffFeedback && handoffFeedback.totalFeedbackCount > 0),
      blocked: false,
      waitingForApproval: Boolean(handoffFeedback?.repeatedMultiSourceLifecycleFeedback),
      running: continuousImprovementMission.running,
      ready: Boolean(publishedPackage)
    }),
    objective: "Capture feedback and route future revisions back through the manufacturing line.",
    ownerRole: "knowledge_architect",
    stageRange: "Continuous Improvement",
    inputSignal: `${handoffFeedback?.totalFeedbackCount ?? 0} handoff feedback record(s)`,
    outputSignal: handoffFeedback?.relationshipEvidenceDecision.replaceAll("_", " ") ?? "no feedback decision",
    approvalCheckpoint: "Schema or component changes wait for documented feedback triggers and architecture review.",
    runControlLabel: "Open Runtime Handoff",
    href: `/runtime-handoff?projectId=${projectId}`,
    missionStage: "manufacturing:continuous-improvement",
    missionCount: continuousImprovementMission.missionCount,
    openMissionCount: continuousImprovementMission.openMissionCount,
    nextAction: publishedPackage
      ? "Record and review app-developer feedback after package handoff."
      : "Finish publication before continuous-improvement feedback is meaningful."
  };
  const workOrders = [
    sourceToKnowledgeObject,
    graphGovernance,
    knowledgeObjectToPackage,
    runtimeValidation,
    continuousImprovement
  ];

  return {
    projectId,
    projectName: project.name,
    summary: {
      totalWorkOrders: workOrders.length,
      completeCount: workOrders.filter((workOrder) => workOrder.status === "complete").length,
      readyToRunCount: workOrders.filter((workOrder) => workOrder.status === "ready_to_run").length,
      blockedCount: workOrders.filter((workOrder) => workOrder.status === "blocked").length,
      openMissionCount: workOrders.reduce((total, workOrder) => total + workOrder.openMissionCount, 0),
      approvalCheckpointCount: workOrders.length
    },
    sourceToKnowledgeObject,
    knowledgeObjectToPackage,
    workOrders
  };
}

function closureWorkOrderForStage(
  stageId: ManufacturingLineStageId,
  workOrders: ManufacturingWorkOrder[]
): ManufacturingWorkOrder {
  const workOrderIdByStage: Record<ManufacturingLineStageId, string> = {
    source_intake: "source-to-ko",
    preparation_extraction: "source-to-ko",
    ko_manufacturing: "source-to-ko",
    relationship_evidence: "graph-governance",
    human_governance: "graph-governance",
    pka_assembly: "ko-to-package",
    release_publication: "ko-to-package",
    runtime_handoff: "runtime-validation",
    consumption_validation: "runtime-validation",
    continuous_improvement: "continuous-improvement"
  };

  return workOrders.find((workOrder) => workOrder.id === workOrderIdByStage[stageId]) ?? workOrders[0];
}

function closureReasonFromStage(
  stage: ManufacturingLineStage,
  workOrders: ManufacturingWorkOrder[],
  severity: PkaManufacturingClosureReason["severity"]
): PkaManufacturingClosureReason {
  const workOrder = closureWorkOrderForStage(stage.id, workOrders);

  return {
    id: `stage-${stage.id}`,
    severity,
    title: `${stage.title}: ${severity === "blocker" ? "release blocked" : "rework required"}`,
    detail: stage.detail,
    stageId: stage.id,
    stageTitle: stage.title,
    workOrderId: workOrder.id,
    workOrderTitle: workOrder.title,
    href: stage.href,
    recommendedAction: workOrder.nextAction
  };
}

function uniqueClosureReasons(reasons: PkaManufacturingClosureReason[]) {
  const seen = new Set<string>();

  return reasons.filter((reason) => {
    if (seen.has(reason.id)) {
      return false;
    }

    seen.add(reason.id);
    return true;
  });
}

export async function getPkaManufacturingClosureReport(projectId: string): Promise<PkaManufacturingClosureReport> {
  const [lineReport, workOrderReport, productQuality, releaseReadinessHints, packageValidation] = await Promise.all([
    getManufacturingLineRunReport(projectId),
    getManufacturingWorkOrderReport(projectId),
    getPkaProductQualityReport(projectId),
    getPkaReleaseReadinessHints(projectId),
    getPkaPackageValidationReport(projectId)
  ]);
  const latestPackageStatus = lineReport.summary.latestPackageStatus;
  const packageValidationWarnings = packageValidation.filter((item) => item.level === "warning");
  const releaseBlockers = releaseReadinessHints.filter((hint) => hint.level === "warning");
  const releaseClosureStages = lineReport.stages.filter((stage) => stage.id !== "continuous_improvement");
  const reasons: PkaManufacturingClosureReason[] = [];

  for (const stage of releaseClosureStages) {
    if (stage.status === "blocked") {
      reasons.push(closureReasonFromStage(stage, workOrderReport.workOrders, "blocker"));
    }

    if (stage.status === "building") {
      reasons.push(closureReasonFromStage(stage, workOrderReport.workOrders, "rework"));
    }
  }

  for (const workOrder of workOrderReport.workOrders.filter((item) => item.id !== "continuous-improvement")) {
    if (workOrder.status === "blocked") {
      reasons.push({
        id: `work-order-${workOrder.id}`,
        severity: "blocker",
        title: `${workOrder.title}: blocked`,
        detail: workOrder.outputSignal,
        stageId:
          workOrder.id === "source-to-ko"
            ? "preparation_extraction"
            : workOrder.id === "graph-governance"
              ? "human_governance"
              : workOrder.id === "runtime-validation"
                ? "runtime_handoff"
                : "pka_assembly",
        stageTitle: workOrder.stageRange,
        workOrderId: workOrder.id,
        workOrderTitle: workOrder.title,
        href: workOrder.href,
        recommendedAction: workOrder.nextAction
      });
    }

    if (workOrder.status === "waiting_for_approval") {
      reasons.push({
        id: `work-order-${workOrder.id}-approval`,
        severity: "rework",
        title: `${workOrder.title}: approval checkpoint open`,
        detail: workOrder.approvalCheckpoint,
        stageId:
          workOrder.id === "graph-governance"
            ? "human_governance"
            : workOrder.id === "runtime-validation"
              ? "runtime_handoff"
              : "release_publication",
        stageTitle: workOrder.stageRange,
        workOrderId: workOrder.id,
        workOrderTitle: workOrder.title,
        href: workOrder.href,
        recommendedAction: workOrder.nextAction
      });
    }
  }

  releaseBlockers.slice(0, 5).forEach((hint) => {
    const workOrder = closureWorkOrderForStage("human_governance", workOrderReport.workOrders);
    reasons.push({
      id: `release-${hint.id}`,
      severity: "blocker",
      title: hint.title,
      detail: hint.detail,
      stageId: "human_governance",
      stageTitle: "Human Governance",
      workOrderId: workOrder.id,
      workOrderTitle: workOrder.title,
      href: `/review?projectId=${projectId}&queueStatus=all&blockerType=all`,
      recommendedAction: "Resolve the release-readiness blocker in Review before closure."
    });
  });

  packageValidationWarnings.slice(0, 5).forEach((item) => {
    const workOrder = closureWorkOrderForStage("pka_assembly", workOrderReport.workOrders);
    reasons.push({
      id: `package-${item.id}`,
      severity: "blocker",
      title: item.title,
      detail: item.detail,
      stageId: "pka_assembly",
      stageTitle: "PKA Assembly",
      workOrderId: workOrder.id,
      workOrderTitle: workOrder.title,
      href: `/pka-builder?projectId=${projectId}`,
      recommendedAction: "Repair package validation warnings before final closure."
    });
  });

  if (!productQuality.releaseGrade) {
    const workOrder = closureWorkOrderForStage("human_governance", workOrderReport.workOrders);
    reasons.push({
      id: "quality-not-release-grade",
      severity: latestPackageStatus === "published" ? "rework" : "blocker",
      title: `Product quality is ${productQuality.band.replaceAll("_", " ")}`,
      detail: productQuality.topRisks[0] ?? "Improve source, governance, relationship, package, or handoff quality signals.",
      stageId: "human_governance",
      stageTitle: "Human Governance",
      workOrderId: workOrder.id,
      workOrderTitle: workOrder.title,
      href: `/pka-builder?projectId=${projectId}`,
      recommendedAction: "Use the PKA Product Quality report to close the highest-risk quality gaps."
    });
  }

  const uniqueReasons = uniqueClosureReasons(reasons);
  const blockerCount = uniqueReasons.filter((reason) => reason.severity === "blocker").length;
  const reworkCount = uniqueReasons.filter((reason) => reason.severity === "rework").length;
  const disposition: PkaManufacturingClosureDisposition =
    blockerCount > 0 ? "release_blocked" : reworkCount > 0 ? "rework_required" : "accepted_for_release";

  return {
    projectId,
    projectName: lineReport.projectName,
    packageId: lineReport.summary.latestPackageId,
    packageStatus: latestPackageStatus,
    disposition,
    dispositionLabel:
      disposition === "accepted_for_release"
        ? "Accepted for release"
        : disposition === "release_blocked"
          ? "Release blocked"
          : "Rework required",
    summary: {
      readyStageCount: releaseClosureStages.filter((stage) => stage.status === "ready").length,
      blockedStageCount: releaseClosureStages.filter((stage) => stage.status === "blocked").length,
      completeWorkOrderCount: workOrderReport.workOrders.filter(
        (workOrder) => workOrder.id !== "continuous-improvement" && workOrder.status === "complete"
      ).length,
      blockedWorkOrderCount: workOrderReport.workOrders.filter(
        (workOrder) => workOrder.id !== "continuous-improvement" && workOrder.status === "blocked"
      ).length,
      qualityScore: productQuality.score,
      qualityBand: productQuality.band,
      releaseBlockerCount: releaseBlockers.length,
      packageValidationWarningCount: packageValidationWarnings.length,
      runtimeImportStatus: lineReport.summary.runtimeImportStatus,
      runtimeHandoffDecision: lineReport.summary.runtimeHandoffDecision
    },
    acceptedSignals:
      disposition === "accepted_for_release"
        ? [
            "Manufacturing stages 1-9 are release-ready.",
            "Work orders through runtime validation are complete.",
            "Product quality is release-grade.",
            "Package validation, handoff, import, and deterministic Q&A readiness are clear."
          ]
        : [],
    reasons: uniqueReasons,
    reworkRoutes: uniqueReasons.filter((reason) => reason.severity !== "ready")
  };
}

export async function createManufacturingWorkOrderTrace(input: ManufacturingWorkOrderTraceInput) {
  const project = (await listProjects()).find((item) => item.id === input.projectId);
  const definition = manufacturingWorkOrderDefinition(input.workOrderId);

  if (!project) {
    throw new Error(`Project not found: ${input.projectId}`);
  }

  if (!definition) {
    throw new Error(`Manufacturing work order not found: ${input.workOrderId}`);
  }

  const mission = await createMission({
    type: "manufacturing",
    title: `Work order: ${definition.title}`,
    projectId: input.projectId,
    assignedTo: input.actor ?? definition.ownerRole,
    stage: definition.missionStage,
    priority: "normal",
    status: input.status ?? "queued"
  });

  await recordAuditLog({
    action: "manufacturing.work_order_trace_created",
    subjectType: "Project",
    subjectId: input.projectId,
    actorId: input.actor ?? definition.ownerRole,
    detail: `Created generic manufacturing work-order trace: ${definition.title}`,
    metadata: {
      workOrderId: definition.id,
      missionId: mission.id,
      missionStage: definition.missionStage
    }
  });

  return mission;
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
  rfqEvidenceEntries: RfqEvidenceRegisterEntrySummary[];
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
      id: `${input.packageId}-rfq-evidence-register`,
      kind: "evidence_register",
      path: "sources/rfq-evidence-register.json",
      version: input.version,
      governanceStatus: input.rfqEvidenceEntries.length > 0 ? "approved" : "draft",
      sourceRefs: input.rfqEvidenceEntries
        .map((entry) => entry.sourceId)
        .filter((sourceId): sourceId is string => Boolean(sourceId))
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
      id: `${input.packageId}-rfq-package-issue-workflow`,
      kind: "workflow",
      path: "workflows/rfq-package-issue-workflow.json",
      version: input.version,
      governanceStatus: input.rfqEvidenceEntries.length > 0 ? "draft" : "placeholder",
      sourceRefs: input.rfqEvidenceEntries
        .map((entry) => entry.sourceId)
        .filter((sourceId): sourceId is string => Boolean(sourceId))
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

function componentReadinessClass(status: PkaComponentManufacturingStatus): PackageValidationItem["level"] {
  return status === "missing_required" ? "warning" : status === "manufactured" ? "ready" : "info";
}

function componentManufacturingItem(input: Omit<PkaComponentManufacturingItem, "id">): PkaComponentManufacturingItem {
  return {
    id: `component-${input.path.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    ...input
  };
}

export async function getPkaComponentManufacturingReport(projectId: string): Promise<PkaComponentManufacturingReport> {
  const exportPreview = await buildPkaPackageExportPreview({ projectId });

  if (!exportPreview) {
    return {
      projectId,
      ready: false,
      manufacturedCount: 0,
      intentionalPlaceholderCount: 0,
      missingRequiredCount: 1,
      notRequiredYetCount: 0,
      items: [
        componentManufacturingItem({
          kind: "governance_record",
          path: "manifest.json",
          requirement: "required",
          status: "missing_required",
          title: "Package component contract",
          detail: "Select a project before component manufacturing can be inspected.",
          manufacturingBoundary: "Package assembly must create a manifest and component index before release.",
          dedicatedRecordDecision: "component_contract_file",
          promotionTrigger: "Always required for every Base PKA."
        })
      ]
    };
  }

  const filesByPath = new Map(exportPreview.files.map((file) => [file.path, file]));
  const componentByPath = new Map(exportPreview.componentIndex.map((component) => [component.path, component]));
  const hasFile = (path: string) => filesByPath.has(path);
  const componentStatus = (path: string) => componentByPath.get(path)?.governanceStatus;
  const readyStatus = (path: string) =>
    hasFile(path) && componentStatus(path) !== "placeholder" ? "manufactured" : "missing_required";
  const placeholderStatus = (path: string) =>
    hasFile(path) ? "intentional_placeholder" : "missing_required";
  const items: PkaComponentManufacturingItem[] = [
    componentManufacturingItem({
      kind: "knowledge_object",
      path: "knowledge-objects/index.json",
      requirement: "required",
      status: readyStatus("knowledge-objects/index.json"),
      title: "Knowledge Object index",
      detail: "Release-grade KOs are the primary manufactured components inside a Base PKA.",
      manufacturingBoundary: "Keep professional concepts, rules, checklist items, and evidence controls as governed KOs until they need independent component lifecycle.",
      dedicatedRecordDecision: "knowledge_object_backed",
      promotionTrigger: "Promote only when a component needs its own lifecycle, reuse boundary, or version history beyond a KO."
    }),
    componentManufacturingItem({
      kind: "ontology",
      path: "ontology/index.json",
      requirement: "required",
      status: readyStatus("ontology/index.json"),
      title: "Ontology vocabulary",
      detail: "Object and relationship vocabularies are packaged for graph inspection and runtime traversal.",
      manufacturingBoundary: "Fixed MVP vocabulary remains package metadata; a dedicated ontology table waits for configurable vocabularies.",
      dedicatedRecordDecision: "component_contract_file",
      promotionTrigger: "Promote when operators can edit ontology terms independently of code."
    }),
    componentManufacturingItem({
      kind: "relationship_graph",
      path: "graph/relationships.json",
      requirement: "required",
      status: readyStatus("graph/relationships.json"),
      title: "Relationship graph",
      detail: "Governed KO relationships are packaged with provenance and source evidence pointers.",
      manufacturingBoundary: "Relationships are dedicated records already; relationship evidence stays in provenance until lifecycle feedback reopens the table decision.",
      dedicatedRecordDecision: "component_contract_file",
      promotionTrigger: "Promote relationship evidence only after repeated multi-source lifecycle feedback."
    }),
    componentManufacturingItem({
      kind: "source_reference_index",
      path: "sources/index.json",
      requirement: "required",
      status: readyStatus("sources/index.json"),
      title: "Source reference index",
      detail: "Source references preserve provenance, reliability, usage policy, and Base PKA boundary.",
      manufacturingBoundary: "Source records are dedicated records; package exports contain references, not client vault state.",
      dedicatedRecordDecision: "component_contract_file",
      promotionTrigger: "Always required for governed package traceability."
    }),
    componentManufacturingItem({
      kind: "governance_record",
      path: "governance/index.json",
      requirement: "required",
      status: readyStatus("governance/index.json"),
      title: "Governance record index",
      detail: "Release decisions, review evidence, and package risk summaries are exported for auditability.",
      manufacturingBoundary: "Governance stays audit-backed; dedicated review tables are added only when audit records become too thin.",
      dedicatedRecordDecision: "component_contract_file",
      promotionTrigger: "Always required before publish and runtime handoff."
    }),
    componentManufacturingItem({
      kind: "workflow",
      path: "workflows/rfq-package-issue-workflow.json",
      requirement: "conditional",
      status: hasFile("workflows/rfq-package-issue-workflow.json") ? "manufactured" : "not_required_yet",
      title: "Workflow contract",
      detail: "The QS/RFQ validation article manufactures a workflow contract file for RFQ package issue readiness.",
      manufacturingBoundary: "KF packages governed workflow structure only; runtime workflow execution belongs to the consuming app.",
      dedicatedRecordDecision: "component_contract_file",
      promotionTrigger: "Promote to dedicated workflow records when multiple PKAs need reusable workflow authoring/versioning."
    }),
    componentManufacturingItem({
      kind: "runtime_configuration",
      path: "runtime/config.json",
      requirement: "optional_placeholder",
      status: placeholderStatus("runtime/config.json"),
      title: "Runtime configuration boundary",
      detail: "Runtime configuration is an intentional empty boundary until an app-developer contract needs concrete settings.",
      manufacturingBoundary: "KF may declare package configuration, but client runtime state remains outside the Base PKA.",
      dedicatedRecordDecision: "defer_dedicated_record",
      promotionTrigger: "Promote when a runtime needs governed configuration values packaged with the Base PKA."
    }),
    componentManufacturingItem({
      kind: "prompt_library",
      path: "prompts/index.json",
      requirement: "optional_placeholder",
      status: placeholderStatus("prompts/index.json"),
      title: "Prompt library boundary",
      detail: "Prompt components stay intentionally empty while deterministic manufacturing does not call models.",
      manufacturingBoundary: "Prompts become governed package components only after the provider/model-router path is approved.",
      dedicatedRecordDecision: "defer_dedicated_record",
      promotionTrigger: "Promote when prompts need review, reuse, versioning, or app-specific installation checks."
    }),
    componentManufacturingItem({
      kind: "rule",
      path: "rules/index.json",
      requirement: "optional_placeholder",
      status: placeholderStatus("rules/index.json"),
      title: "Rule library boundary",
      detail: "Professional rules remain Knowledge Objects for now unless they need executable or reusable rule packaging.",
      manufacturingBoundary: "Keep rules as KOs until a rule requires independent validation or runtime evaluation.",
      dedicatedRecordDecision: "knowledge_object_backed",
      promotionTrigger: "Promote when a rule must be executed, parameterized, or versioned separately from its explanatory KO."
    }),
    componentManufacturingItem({
      kind: "template",
      path: "templates/index.json",
      requirement: "optional_placeholder",
      status: placeholderStatus("templates/index.json"),
      title: "Template library boundary",
      detail: "Templates stay as placeholder index entries until an output template must be manufactured.",
      manufacturingBoundary: "Template text can remain in KOs until it becomes a reusable file/component.",
      dedicatedRecordDecision: "defer_dedicated_record",
      promotionTrigger: "Promote when a runtime app needs a governed reusable template file."
    }),
    componentManufacturingItem({
      kind: "formula",
      path: "formulas/index.json",
      requirement: "optional_placeholder",
      status: placeholderStatus("formulas/index.json"),
      title: "Formula library boundary",
      detail: "Formula components are reserved for future computed professional logic.",
      manufacturingBoundary: "Formula explanations remain KOs; executable formula assets need separate governance later.",
      dedicatedRecordDecision: "defer_dedicated_record",
      promotionTrigger: "Promote when formulas need executable validation, test cases, or runtime calculation."
    }),
    componentManufacturingItem({
      kind: "case_library",
      path: "cases/index.json",
      requirement: "optional_placeholder",
      status: placeholderStatus("cases/index.json"),
      title: "Case library boundary",
      detail: "Case-library components are intentionally empty until curated cases become part of a Base PKA.",
      manufacturingBoundary: "Historical/client cases must respect Base PKA vs client-adapted PKA boundaries.",
      dedicatedRecordDecision: "defer_dedicated_record",
      promotionTrigger: "Promote when anonymized cases are approved as reusable Base PKA knowledge."
    })
  ];

  return {
    projectId,
    packageId: exportPreview.packageId,
    ready: items.every((item) => item.status !== "missing_required"),
    manufacturedCount: items.filter((item) => item.status === "manufactured").length,
    intentionalPlaceholderCount: items.filter((item) => item.status === "intentional_placeholder").length,
    missingRequiredCount: items.filter((item) => item.status === "missing_required").length,
    notRequiredYetCount: items.filter((item) => item.status === "not_required_yet").length,
    items
  };
}

function boundedScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function qualityLevel(score: number): PackageValidationItem["level"] {
  return score >= 80 ? "ready" : score >= 55 ? "info" : "warning";
}

function productQualityBand(score: number, warningCount: number): PkaProductQualityBand {
  if (warningCount > 0 && score < 70) {
    return "blocked";
  }

  if (score >= 85 && warningCount === 0) {
    return "release_grade";
  }

  return score >= 70 ? "pilot_ready" : "needs_work";
}

function newestSourceDate(sources: SourceSummary[]) {
  return sources
    .map((source) => source.createdAt)
    .filter(Boolean)
    .sort()
    .at(-1);
}

export async function getPkaProductQualityReport(projectId: string): Promise<PkaProductQualityReport> {
  const [
    sources,
    sourceCoverage,
    knowledgeObjects,
    relationships,
    packages,
    governanceMetrics,
    relationshipClosure,
    releaseReadinessHints,
    packageValidation,
    componentManufacturing,
    runtimeQaReadiness,
    fixtureEvaluation
  ] = await Promise.all([
    listSourcesByProject(projectId),
    getPipelineSourceCoverageReport({ projectId }),
    listKnowledgeObjects({ projectId }),
    listKnowledgeRelationships({ projectId }),
    listPkaPackages(projectId),
    getProjectGovernanceMetrics(projectId),
    getRelationshipEvidenceClosureReport(projectId),
    getPkaReleaseReadinessHints(projectId),
    getPkaPackageValidationReport(projectId),
    getPkaComponentManufacturingReport(projectId),
    getRuntimeQaAnswerReadinessReport(projectId),
    getRuntimeQaFixtureEvaluationReport(projectId)
  ]);
  const approvedKnowledgeObjects = knowledgeObjects.filter((knowledgeObject) =>
    approvedKnowledgeObject(knowledgeObject.status)
  );
  const sourceBackedKnowledgeObjects = approvedKnowledgeObjects.filter(
    (knowledgeObject) => knowledgeObject.evidenceLinks.length > 0
  );
  const sourceCategoryCount = new Set(sources.map((source) => source.category)).size;
  const newestDate = newestSourceDate(sources);
  const failedSourceCount = sourceCoverage.unsupportedSourceCount + sourceCoverage.emptySourceCount;
  const sourceScore = boundedScore(
    (sources.length > 0 ? 30 : 0) +
      Math.min(sourceCategoryCount, 3) * 15 +
      (sourceCoverage.ingestedSourceCount >= sources.length && sources.length > 0 ? 20 : 0) +
      (failedSourceCount === 0 ? 5 : 0)
  );
  const releaseBlockerCount = releaseReadinessHints.filter((hint) => hint.level === "warning").length;
  const governanceCoverage =
    knowledgeObjects.length > 0 ? approvedKnowledgeObjects.length / knowledgeObjects.length : 0;
  const evidenceCoverage =
    approvedKnowledgeObjects.length > 0 ? sourceBackedKnowledgeObjects.length / approvedKnowledgeObjects.length : 0;
  const governanceScore = boundedScore(
    governanceCoverage * 45 +
      evidenceCoverage * 35 +
      (governanceMetrics.releaseBlockerCount === 0 && releaseBlockerCount === 0 ? 20 : 0)
  );
  const relationshipDensity =
    approvedKnowledgeObjects.length > 1
      ? relationshipClosure.releaseGradeCount / Math.max(1, approvedKnowledgeObjects.length - 1)
      : relationshipClosure.releaseGradeCount > 0
        ? 1
        : 0;
  const relationshipEvidenceCoverage =
    relationshipClosure.totalRelationshipCount > 0
      ? relationshipClosure.releaseGradeCount / relationshipClosure.totalRelationshipCount
      : 0;
  const relationshipScore = boundedScore(
    Math.min(relationshipDensity, 1) * 45 +
      relationshipEvidenceCoverage * 35 +
      (relationshipClosure.needsReworkCount === 0 && relationshipClosure.releaseGradeCount > 0 ? 20 : 0)
  );
  const packageWarnings = packageValidation.filter((item) => item.level === "warning");
  const packageScore = boundedScore(
    100 -
      packageWarnings.length * 12 +
      (componentManufacturing.ready ? 10 : -10) +
      (packages.some((pkaPackage) => pkaPackage.status === "published") ? 10 : 0)
  );
  const latestPackage = latestPublishedPackage(packages) ?? packages[0];
  const publishedPackage = latestPackage?.status === "published" ? latestPackage : undefined;
  const runtimeImport = publishedPackage
    ? await validateRuntimePkaImportReadback(publishedPackage.packageId)
    : undefined;
  const runtimeHandoff = publishedPackage
    ? await validateRuntimeAppDeveloperHandoff(publishedPackage.packageId)
    : undefined;
  const runtimeScore = boundedScore(
    (runtimeImport?.status === "importable" ? 35 : 0) +
      (runtimeHandoff?.decision === "installable" ? 35 : runtimeHandoff?.decision === "installation_review_required" ? 15 : 0) +
      (runtimeQaReadiness.ready ? 15 : 0) +
      (fixtureEvaluation.ready ? 15 : 0)
  );
  const items: PkaProductQualityItem[] = [
    {
      id: "quality-source-diversity-freshness",
      category: "source_quality",
      title: "Source diversity and freshness",
      score: sourceScore,
      weight: 20,
      level: qualityLevel(sourceScore),
      signal: `${sources.length} source(s), ${sourceCategoryCount} category/categories, newest ${newestDate ?? "unknown"}`,
      detail: `${sourceCoverage.ingestedSourceCount}/${sources.length} source(s) are ingested; ${failedSourceCount} failed source profile(s).`,
      recommendedAction:
        sourceScore >= 80 ? "Maintain source register and usage policy." : "Add or repair source artifacts before relying on this PKA."
    },
    {
      id: "quality-governance-coverage",
      category: "governance_coverage",
      title: "Governance coverage",
      score: governanceScore,
      weight: 25,
      level: qualityLevel(governanceScore),
      signal: `${approvedKnowledgeObjects.length}/${knowledgeObjects.length} release-grade KO(s), ${releaseBlockerCount} blocker(s)`,
      detail: `${sourceBackedKnowledgeObjects.length}/${approvedKnowledgeObjects.length} release-grade KO(s) include source evidence.`,
      recommendedAction:
        governanceScore >= 80 ? "Governance coverage is fit for package release." : "Clear review blockers and attach evidence to release-grade KOs."
    },
    {
      id: "quality-relationship-evidence",
      category: "relationship_evidence",
      title: "Relationship density and evidence",
      score: relationshipScore,
      weight: 20,
      level: qualityLevel(relationshipScore),
      signal: `${relationshipClosure.releaseGradeCount} release-grade edge(s), ${relationshipClosure.needsReworkCount} rework edge(s), ${relationshipClosure.excludedFromReleaseCount} excluded`,
      detail: `Relationship density is ${Math.round(relationshipDensity * 100)}% against the approved KO set.`,
      recommendedAction:
        relationshipScore >= 80 ? "Graph quality supports retrieval and runtime context." : "Repair or exclude non-release-grade relationships before factory closure."
    },
    {
      id: "quality-package-completeness",
      category: "package_completeness",
      title: "Package completeness",
      score: packageScore,
      weight: 20,
      level: qualityLevel(packageScore),
      signal: `${packageWarnings.length} package warning(s), ${componentManufacturing.missingRequiredCount} missing required component(s)`,
      detail: `${componentManufacturing.manufacturedCount} manufactured component(s), ${componentManufacturing.intentionalPlaceholderCount} intentional placeholder(s).`,
      recommendedAction:
        packageScore >= 80 ? "Package structure is inspectable and component boundaries are classified." : "Resolve package warnings and missing required component files."
    },
    {
      id: "quality-runtime-handoff",
      category: "runtime_handoff",
      title: "Runtime handoff readiness",
      score: runtimeScore,
      weight: 15,
      level: qualityLevel(runtimeScore),
      signal: `${runtimeHandoff?.decision ?? "no handoff"} / ${runtimeImport?.status ?? "no import"}`,
      detail: `${runtimeQaReadiness.ready ? "Runtime Q&A ready" : "Runtime Q&A blocked"}; ${
        fixtureEvaluation.ready ? "fixture evaluation ready" : "fixture evaluation blocked"
      }.`,
      recommendedAction:
        runtimeScore >= 80 ? "Runtime handoff can be used for deterministic app-developer validation." : "Publish and validate handoff/import/Q&A readiness before app consumption."
    }
  ];
  const weightedScore = boundedScore(
    items.reduce((total, item) => total + item.score * item.weight, 0) /
      items.reduce((total, item) => total + item.weight, 0)
  );
  const band = productQualityBand(weightedScore, packageWarnings.length + releaseBlockerCount);
  const topRisks = items
    .filter((item) => item.level === "warning")
    .map((item) => `${item.title}: ${item.recommendedAction}`)
    .slice(0, 3);

  return {
    projectId,
    packageId: latestPackage?.packageId,
    score: weightedScore,
    band,
    releaseGrade: band === "release_grade",
    summary: {
      sourceCount: sources.length,
      sourceCategoryCount,
      newestSourceDate: newestDate,
      approvedKnowledgeObjectCount: approvedKnowledgeObjects.length,
    relationshipCount: relationshipClosure.packageRelevantRelationshipCount,
    sourceBackedRelationshipCount: relationshipClosure.releaseGradeCount,
      packageValidationWarningCount: packageWarnings.length,
      runtimeImportStatus: runtimeImport?.status,
      runtimeHandoffDecision: runtimeHandoff?.decision
    },
    items,
    topRisks
  };
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

function rfqEvidenceReviewDecisionSummary(events: GovernanceEventSummary[]) {
  const decisionEvents = events
    .filter((event) => event.subjectType === "RfqEvidenceRegisterEntry")
    .filter((event) => event.action.startsWith("rfq_evidence_register."))
    .map((event) => ({
      action: event.action,
      actorId: event.actorId,
      detail: event.detail,
      createdAt: event.createdAt
    }));

  return {
    count: decisionEvents.length,
    items: decisionEvents
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
  const [
    knowledgeObjects,
    relationships,
    sources,
    governanceEvents,
    pkaPackages,
    rfqEvidenceEntries,
    rfqWorkflowGateActions
  ] = await Promise.all([
    listKnowledgeObjects({ projectId: input.projectId }),
    listKnowledgeRelationships({ projectId: input.projectId }),
    listSourcesByProject(input.projectId),
    listGovernanceHistory({ limit: 100 }),
    listPkaPackages(input.projectId),
    listRfqEvidenceRegisterEntries(input.projectId),
    listRfqWorkflowGateActions({ projectId: input.projectId })
  ]);
  const [rfqEvidenceReport, rfqWorkflowGateReport] = await Promise.all([
    getRfqEvidenceRegisterReport(input.projectId),
    getRfqWorkflowGateReport(input.projectId)
  ]);
  const packageReleaseSummaries = pkaPackages
    .filter((pkaPackage) => pkaPackage.packageId === packageId)
    .map((pkaPackage) => packageReleaseSummary(pkaPackage, governanceEvents));
  const rfqEvidenceDecisionSummary = rfqEvidenceReviewDecisionSummary(governanceEvents);
  const rfqWorkflowGateActionRisk = rfqWorkflowGateActionRiskSummary(rfqWorkflowGateActions);
  const releaseObjects = knowledgeObjects.filter((knowledgeObject) =>
    approvedKnowledgeObject(knowledgeObject.status)
  );
  const releaseRelationships = relationships.filter((relationship) => relationshipReleaseGrade(relationship));
  const generatedAt = new Date().toISOString();
  const componentIndex = packageComponentIndex({
    packageId,
    version,
    releaseObjects,
    relationships: releaseRelationships,
    sources,
    rfqEvidenceEntries
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
    evidenceRegisterEntryCount: rfqEvidenceEntries.length,
    knowledgeObjectCount: releaseObjects.length,
    relationshipCount: releaseRelationships.length,
    sourceReferenceCount: sources.length,
    packageStructure: pkaPackageFolders,
    componentIndex
  };
  const rfqWorkflowComponent = {
    id: `${packageId}-rfq-package-issue-workflow`,
    title: "RFQ package issue workflow placeholder",
    status: "placeholder",
    purpose:
      "Defines the first app-developer boundary for turning governed QS/RFQ knowledge into runtime workflow behavior.",
    stages: [
      {
        id: "prepare",
        label: "Prepare RFQ package",
        checklistGates: ["BOQ extract attached", "trade scope summary drafted", "evidence register opened"]
      },
      {
        id: "review",
        label: "Review package completeness",
        checklistGates: ["drawings listed", "specification clauses listed", "assumptions and exclusions identified"]
      },
      {
        id: "approve_issue",
        label: "Approve and issue",
        checklistGates: ["reviewer approval recorded", "clarification channel named", "return requirements fixed"]
      },
      {
        id: "clarify",
        label: "Manage tender clarifications",
        checklistGates: ["clarification owner assigned", "affected BOQ item recorded", "addendum decision captured"]
      },
      {
        id: "receive_compare",
        label: "Receive and compare quotation",
        checklistGates: ["return documents checked", "assumptions normalized", "commercial exceptions logged"]
      }
    ],
    runtimeBoundary:
      "Base PKA supplies governed workflow structure only. Live quotations, tender correspondence, client evidence vaults, and award decisions belong to runtime/client state.",
    evidenceGateReadiness: rfqEvidenceReport.workflowGateReadiness,
    gateReport: rfqWorkflowGateReport
  };
  const appDeveloperHandoff = {
    id: `${packageId}-app-developer-handoff`,
    title: "App developer package handoff index",
    status: "ready",
    audience: ["AIFA developer", "LADOS developer", "QS/RFQ runtime developer"],
    summary:
      "Load manifest.json first, validate required runtime capabilities, then use approved Knowledge Objects, governed relationships, and source citations as runtime context.",
    requiredFiles: [
      "manifest.json",
      "knowledge-objects/index.json",
      "graph/relationships.json",
      "sources/index.json",
      "sources/rfq-evidence-register.json",
      "governance/index.json"
    ],
    optionalPlaceholderBoundaries: [
      "runtime/config.json",
      "prompts/index.json",
      "rules/index.json",
      "formulas/index.json",
      "cases/index.json",
      "workflows/index.json",
      "workflows/rfq-package-issue-workflow.json",
      "templates/index.json"
    ],
    runtimeDo: [
      "Retrieve focused context bundles instead of sending whole package archives to an AI model.",
      "Cite approved Knowledge Objects and source evidence in user-facing answers.",
      "Treat placeholder workflow/rule/template components as contracts until implemented records exist."
    ],
    runtimeDoNot: [
      "Do not mix Base PKA knowledge with client vault state without creating a client-adapted PKA instance.",
      "Do not treat draft suggestions or unpublished packages as answer context.",
      "Do not send sensitive organizational knowledge to external AI providers unless configured and approved."
    ],
    installReadbackChecklist: [
      {
        file: "manifest.json",
        expectation: "Validate package identity, version, domain, governance status, and runtime capabilities first."
      },
      {
        file: "knowledge-objects/index.json",
        expectation: "Load approved Knowledge Objects only as governed context candidates."
      },
      {
        file: "graph/relationships.json",
        expectation: "Use governed relationship edges for traversal and read relationship source evidence from provenance fields."
      },
      {
        file: "sources/rfq-evidence-register.json",
        expectation: "Inspect RFQ evidence categories, statuses, trade sections, and workflow gates before enabling RFQ issue flows."
      },
      {
        file: "governance/index.json",
        expectation:
          "Require release decisions, RFQ evidence decisions, workflow gate summaries, gate action summaries, and blocked/overdue risk summaries."
      },
      {
        file: "workflows/rfq-package-issue-workflow.json",
        expectation: "Treat as a pilot workflow contract, not a complete runtime workflow engine."
      }
    ],
    governanceRequirements: {
      requiredGovernanceFields: [
        "releaseDecisionSummary",
        "rfqEvidenceDecisionSummary",
        "rfqWorkflowGateSummary",
        "rfqWorkflowGateActionSummary",
        "rfqWorkflowGateActionRisk"
      ],
      blockedActionPolicy:
        "KF hard-blocks publish when unresolved RFQ workflow gate actions have status blocked. Runtime apps should reject or require installation review if blockedCount is greater than zero.",
      overdueActionPolicy:
        "Overdue RFQ workflow gate actions are not automatically invalid, but runtime apps should expose them to the runtime owner before package use."
    },
    relationshipEvidencePolicy: {
      currentShape: "KnowledgeRelationship.provenance.sourceEvidence",
      dedicatedTableStatus: "deferred_for_pilot",
      promoteWhen: [
        "a relationship needs multiple independent source evidence links",
        "relationship evidence needs its own review lifecycle",
        "relationship evidence needs separate version history",
        "runtime apps need a dedicated graph-evidence export index"
      ]
    },
    feedbackQuestions: [
      "Can the runtime consume relationship evidence from graph/relationships.json provenance without a separate table?",
      "Does RFQ package issue need multiple evidence links per relationship, or are KO/source evidence links enough for the pilot?",
      "Should overdue RFQ actions block installation in the consuming app, or only show as owner warnings?",
      "Which handoff fields are missing for AIFA/LADOS package installation screens?"
    ],
    nextDeveloperSlice: [
      "Build a consuming-app readback harness that loads runtime/app-developer-handoff.json.",
      "Show required files, governance requirements, RFQ risk policy, and relationship evidence policy as installer checks.",
      "Map each failed check to blocked or installation_review_required before any runtime Q&A or workflow execution."
    ]
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
          count: releaseRelationships.length,
          items: releaseRelationships.map((relationship) => ({
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
        path: "sources/rfq-evidence-register.json",
        kind: "json",
        status: "ready",
        description: "Structured QS/RFQ evidence register for package issue and future workflow gate readiness.",
        contents: {
          count: rfqEvidenceEntries.length,
          ready: rfqEvidenceReport.ready,
          categoryCounts: rfqEvidenceReport.categoryCounts,
          statusCounts: rfqEvidenceReport.statusCounts,
          workflowGateReadiness: rfqEvidenceReport.workflowGateReadiness,
          workflowGateReport: rfqWorkflowGateReport,
          items: rfqEvidenceEntries.map((entry) => ({
            id: entry.id,
            registerCode: entry.registerCode,
            boqItemRef: entry.boqItemRef,
            tradeSection: entry.tradeSection,
            category: entry.category,
            status: entry.status,
            questionOrEvidence: entry.questionOrEvidence,
            requiredResponseOwner: entry.requiredResponseOwner,
            evidenceReference: entry.evidenceReference,
            commercialImpact: entry.commercialImpact,
            pricingBasisChange: entry.pricingBasisChange,
            workflowGate: entry.workflowGate,
            knowledgeObjectId: entry.knowledgeObjectId,
            sourceId: entry.sourceId
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
          rfqEvidenceDecisionSummary,
          rfqWorkflowGateSummary: rfqWorkflowGateReport,
          rfqWorkflowGateActionSummary: {
            count: rfqWorkflowGateActions.length,
            items: rfqWorkflowGateActions
          },
          rfqWorkflowGateActionRisk,
          items: governanceEvents.slice(0, 20)
        }
      },
      {
        path: "workflows/rfq-package-issue-workflow.json",
        kind: "json",
        status: "ready",
        description: "First RFQ workflow component placeholder with explicit stage and checklist gates.",
        contents: rfqWorkflowComponent
      },
      {
        path: "runtime/app-developer-handoff.json",
        kind: "json",
        status: "ready",
        description: "Concise package handoff index for app/runtime developers.",
        contents: appDeveloperHandoff
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
    return resolve(/* turbopackIgnore: true */ cwd, "..", "..");
  }

  return cwd;
}

function resolvePkaExportPath(packageId: string, relativePath = "") {
  const exportRoot = resolve(/* turbopackIgnore: true */ workspaceRootPath(), "storage", "exports", packageId);
  const targetPath = resolve(/* turbopackIgnore: true */ exportRoot, relativePath);

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
      const absolutePath = resolve(/* turbopackIgnore: true */ directory, entry.name);
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

export async function validatePersistedPkaPackageReadback(
  packageId: string,
  paths: { archivePath?: string; zipPath?: string } = {}
): Promise<PackageValidationItem[]> {
  const archivePath = paths.archivePath ?? "package-archive.json";
  const zipPath = paths.zipPath ?? "package.zip";
  const items: PackageValidationItem[] = [];

  try {
    const archiveFile = await readPersistedPkaExportFile(packageId, archivePath);
    const archive = JSON.parse(archiveFile.contents) as {
      files?: Array<{
        path: string;
        contents?: {
          releaseDecisionSummary?: { items?: unknown[] };
          rfqEvidenceDecisionSummary?: { items?: unknown[] };
          rfqWorkflowGateSummary?: { gates?: unknown[] };
          rfqWorkflowGateActionSummary?: { items?: unknown[] };
          rfqWorkflowGateActionRisk?: { blockedCount?: number; overdueCount?: number; items?: unknown[] };
        };
      }>;
    };
    const governanceFile = archive.files?.find((file) => file.path === "governance/index.json");
    const hasSummary = Boolean(governanceFile?.contents?.releaseDecisionSummary?.items?.length);
    const hasRfqGateSummary = Boolean(governanceFile?.contents?.rfqWorkflowGateSummary?.gates?.length);
    const hasRfqGateActionSummary = Boolean(
      Array.isArray(governanceFile?.contents?.rfqWorkflowGateActionSummary?.items)
    );
    const hasRfqGateActionRisk = Boolean(
      governanceFile?.contents?.rfqWorkflowGateActionRisk &&
        typeof governanceFile.contents.rfqWorkflowGateActionRisk.blockedCount === "number" &&
        typeof governanceFile.contents.rfqWorkflowGateActionRisk.overdueCount === "number" &&
        Array.isArray(governanceFile.contents.rfqWorkflowGateActionRisk.items)
    );
    items.push({
      id: `persisted-archive-readback-${archivePath}`,
      level: hasSummary && hasRfqGateSummary && hasRfqGateActionSummary && hasRfqGateActionRisk ? "ready" : "warning",
      title: "Persisted JSON archive readback",
      detail:
        hasSummary && hasRfqGateSummary && hasRfqGateActionSummary && hasRfqGateActionRisk
          ? `${archivePath} includes governance release, RFQ workflow gate, gate action, and blocked-action risk summaries.`
          : `${archivePath} is missing governance release, RFQ workflow gate, gate action, or blocked-action risk summaries.`
    });
  } catch {
    items.push({
      id: `persisted-archive-readback-${archivePath}`,
      level: "warning",
      title: "Persisted JSON archive readback",
      detail: `${archivePath} could not be read as a valid package archive.`
    });
  }

  try {
    const zipContents = await readFile(resolvePkaExportPath(packageId, zipPath));
    const zipText = zipContents.toString("utf8");
    const hasSummary =
      zipText.includes("governance/index.json") &&
      zipText.includes("releaseDecisionSummary") &&
      zipText.includes("rfqWorkflowGateSummary") &&
      zipText.includes("rfqWorkflowGateActionSummary") &&
      zipText.includes("rfqWorkflowGateActionRisk");
    items.push({
      id: `persisted-zip-readback-${zipPath}`,
      level: hasSummary ? "ready" : "warning",
      title: "Persisted ZIP readback",
      detail: hasSummary
        ? `${zipPath} includes governance release, RFQ workflow, gate action, and blocked-action risk summaries.`
        : `${zipPath} is missing governance release, RFQ workflow, gate action, or blocked-action risk summaries.`
    });
  } catch {
    items.push({
      id: `persisted-zip-readback-${zipPath}`,
      level: "warning",
      title: "Persisted ZIP readback",
      detail: `${zipPath} could not be read as a package ZIP archive.`
    });
  }

  return items;
}

export async function createInvalidPkaReadbackFixtures(packageId: string) {
  const invalidArchivePath = "invalid-package-archive.json";
  const invalidZipPath = "invalid-package.zip";
  await mkdir(resolvePkaExportPath(packageId), { recursive: true });
  await writeFile(
    resolvePkaExportPath(packageId, invalidArchivePath),
    `${JSON.stringify(
      {
        packageId,
        archiveFormat: "kf-json-archive",
        files: [{ path: "manifest.json", contents: { packageId, invalidFixture: true } }]
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  await writeFile(resolvePkaExportPath(packageId, invalidZipPath), Buffer.from("invalid package zip fixture\n"));

  return {
    archivePath: invalidArchivePath,
    zipPath: invalidZipPath
  };
}

type RuntimePkaArchiveFile = {
  path: string;
  contents?: Record<string, unknown>;
};

type RuntimePkaArchive = {
  packageId?: string;
  archiveFormat?: string;
  files?: RuntimePkaArchiveFile[];
};

const supportedRuntimeImportCapabilities = [
  "knowledge_object_lookup",
  "relationship_traversal",
  "source_citation"
];

function archiveFile(archive: RuntimePkaArchive, path: string) {
  return archive.files?.find((file) => file.path === path);
}

function archiveWithoutFile(archive: RuntimePkaArchive, path: string) {
  return {
    ...archive,
    files: archive.files?.filter((file) => file.path !== path)
  };
}

function archiveCount(file: RuntimePkaArchiveFile | undefined) {
  const count = file?.contents?.count;
  return typeof count === "number" ? count : 0;
}

function archiveObjectTypeCount(file: RuntimePkaArchiveFile | undefined) {
  const objectTypes = file?.contents?.objectTypes;
  return Array.isArray(objectTypes) ? objectTypes.length : 0;
}

function archiveItemsCount(file: RuntimePkaArchiveFile | undefined) {
  const items = file?.contents?.items;
  return Array.isArray(items) ? items.length : 0;
}

function componentBoundaryItem(file: RuntimePkaArchiveFile | undefined, label: string, boundaryDetail: string) {
  return {
    id: `runtime-import-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    level: file ? "ready" as const : "warning" as const,
    title: `${label} component`,
    detail: file ? boundaryDetail : `${label} component index is required for runtime package inspection.`
  };
}

function manifestRuntimeCapabilities(manifestFile: RuntimePkaArchiveFile | undefined) {
  const capabilities = manifestFile?.contents?.requiredRuntimeCapabilities;
  return Array.isArray(capabilities)
    ? capabilities.filter((capability): capability is string => typeof capability === "string")
    : [];
}

function safeArchiveFileName(fileName: string) {
  if (fileName.includes(".env")) {
    throw new Error("Runtime import archive cannot reference environment files.");
  }

  const baseName = fileName
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!baseName || !baseName.endsWith(".json")) {
    throw new Error("Runtime import archive must be a JSON archive file.");
  }

  return `${Date.now().toString(36)}-${baseName}`;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function runtimeHandoffObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function runtimeHandoffDecision(items: RuntimeHandoffReadbackItem[]): RuntimeHandoffInstallDecision {
  if (items.some((item) => item.decision === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.decision === "installation_review_required")) {
    return "installation_review_required";
  }

  return "installable";
}

function runtimeHandoffCheck(
  input: Pick<RuntimeHandoffReadbackItem, "id" | "title" | "detail"> & {
    passed: boolean;
    failureDecision: Extract<RuntimeHandoffReadbackItem["decision"], "blocked" | "installation_review_required">;
  }
): RuntimeHandoffReadbackItem {
  return {
    id: input.id,
    title: input.title,
    detail: input.detail,
    decision: input.passed ? "pass" : input.failureDecision
  };
}

export async function createRuntimeHandoffReadbackFixtures(packageId: string) {
  const handoffFile = await readPersistedPkaExportFile(packageId, "runtime/app-developer-handoff.json");
  const handoff = runtimeHandoffObject(JSON.parse(handoffFile.contents));
  const requiredFiles = stringArray(handoff.requiredFiles);
  const governanceRequirements = runtimeHandoffObject(handoff.governanceRequirements);

  const missingRequiredFileFixture = {
    ...handoff,
    status: "fixture_blocked",
    fixturePurpose:
      "Negative consuming-app handoff fixture: package installation must block when a handoff-required file is absent.",
    requiredFiles: [...requiredFiles, "sources/missing-runtime-required-file.json"]
  };
  const reviewRequiredFixture = {
    ...handoff,
    status: "fixture_review_required",
    fixturePurpose:
      "Negative consuming-app handoff fixture: package installation should require runtime owner review for policy-only warnings.",
    governanceRequirements: {
      ...governanceRequirements,
      requireRuntimeOwnerReview: true
    },
    forceInstallationReviewRequired: true
  };

  await writeFile(
    resolvePkaExportPath(packageId, runtimeHandoffFixturePaths.missing_required_file),
    `${JSON.stringify(missingRequiredFileFixture, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    resolvePkaExportPath(packageId, runtimeHandoffFixturePaths.review_required),
    `${JSON.stringify(reviewRequiredFixture, null, 2)}\n`,
    "utf8"
  );

  return runtimeHandoffFixturePaths;
}

export async function validateRuntimeAppDeveloperHandoff(
  packageId: string,
  handoffPath = "runtime/app-developer-handoff.json"
): Promise<RuntimeHandoffReadbackReport> {
  const packageRecord = (await listPkaPackages()).find((pkaPackage) => pkaPackage.packageId === packageId);
  const persistedFiles = await listPersistedPkaExportFiles(packageId);
  const persistedFilePaths = new Set(persistedFiles.map((file) => file.path));
  const items: RuntimeHandoffReadbackItem[] = [];
  let handoff: Record<string, unknown>;

  try {
    const handoffFile = await readPersistedPkaExportFile(packageId, handoffPath);
    handoff = runtimeHandoffObject(JSON.parse(handoffFile.contents));
    items.push({
      id: "runtime-handoff-readable",
      decision: "pass",
      title: "Handoff file",
      detail: `${handoffPath} is readable JSON.`
    });
  } catch {
    const blockedItem: RuntimeHandoffReadbackItem = {
      id: "runtime-handoff-readable",
      decision: "blocked",
      title: "Handoff file",
      detail: `${handoffPath} is missing or cannot be parsed.`
    };

    return {
      packageId,
      packageName: packageRecord?.name,
      handoffPath,
      decision: "blocked",
      blockedCount: 1,
      reviewRequiredCount: 0,
      feedbackQuestionCount: 0,
      audience: [],
      feedbackQuestions: [],
      nextDeveloperSlice: [],
      items: [blockedItem]
    };
  }

  const requiredFiles = stringArray(handoff.requiredFiles);
  const missingRequiredFiles = requiredFiles.filter((path) => !persistedFilePaths.has(path));
  items.push(
    runtimeHandoffCheck({
      id: "runtime-handoff-required-files",
      title: "Required package files",
      passed: missingRequiredFiles.length === 0,
      failureDecision: "blocked",
      detail:
        missingRequiredFiles.length === 0
          ? `${requiredFiles.length} handoff-required file(s) are present.`
          : `Missing handoff-required file(s): ${missingRequiredFiles.join(", ")}.`
    })
  );

  let governance: Record<string, unknown> = {};
  try {
    governance = runtimeHandoffObject(
      JSON.parse((await readPersistedPkaExportFile(packageId, "governance/index.json")).contents)
    );
  } catch {
    // Required file check already captures missing governance; keep field validation explicit.
  }

  const governanceRequirements = runtimeHandoffObject(handoff.governanceRequirements);
  const requiredGovernanceFields = stringArray(governanceRequirements.requiredGovernanceFields);
  const missingGovernanceFields = requiredGovernanceFields.filter((field) => !(field in governance));
  items.push(
    runtimeHandoffCheck({
      id: "runtime-handoff-governance-fields",
      title: "Governance requirements",
      passed: missingGovernanceFields.length === 0,
      failureDecision: "blocked",
      detail:
        missingGovernanceFields.length === 0
          ? `${requiredGovernanceFields.length} required governance field(s) are present.`
          : `Missing governance field(s): ${missingGovernanceFields.join(", ")}.`
    })
  );

  const risk = runtimeHandoffObject(governance.rfqWorkflowGateActionRisk);
  const blockedCount = typeof risk.blockedCount === "number" ? risk.blockedCount : 0;
  const overdueCount = typeof risk.overdueCount === "number" ? risk.overdueCount : 0;
  items.push({
    id: "runtime-handoff-blocked-actions",
    title: "RFQ blocked gate actions",
    decision: blockedCount > 0 ? "blocked" : "pass",
    detail:
      blockedCount > 0
        ? `${blockedCount} blocked RFQ workflow gate action(s) require a corrected package before installation.`
        : "No blocked RFQ workflow gate actions are present in the handoff risk summary."
  });
  items.push({
    id: "runtime-handoff-overdue-actions",
    title: "RFQ overdue gate actions",
    decision: overdueCount > 0 ? "installation_review_required" : "pass",
    detail:
      overdueCount > 0
        ? `${overdueCount} overdue RFQ workflow gate action(s) require runtime owner review before installation.`
        : "No overdue RFQ workflow gate actions require runtime owner review."
  });

  if (handoff.forceInstallationReviewRequired === true) {
    items.push({
      id: "runtime-handoff-runtime-owner-review",
      title: "Runtime owner review",
      decision: "installation_review_required",
      detail: "This handoff requests runtime owner review before installation."
    });
  }

  const relationshipEvidencePolicy = runtimeHandoffObject(handoff.relationshipEvidencePolicy);
  const promoteWhen = stringArray(relationshipEvidencePolicy.promoteWhen);
  const feedbackQuestions = stringArray(handoff.feedbackQuestions);
  items.push({
    id: "runtime-handoff-relationship-evidence-feedback",
    title: "Relationship evidence feedback",
    decision: "feedback_requested",
    detail:
      feedbackQuestions.length > 0
        ? `${feedbackQuestions.length} relationship/package feedback question(s) are ready for pilot review.`
        : "No relationship evidence feedback questions were provided in the handoff."
  });

  const decision = runtimeHandoffDecision(items);

  return {
    packageId,
    packageName: packageRecord?.name,
    handoffPath,
    decision,
    blockedCount: items.filter((item) => item.decision === "blocked").length,
    reviewRequiredCount: items.filter((item) => item.decision === "installation_review_required").length,
    feedbackQuestionCount: feedbackQuestions.length,
    summary: typeof handoff.summary === "string" ? handoff.summary : undefined,
    audience: stringArray(handoff.audience),
    relationshipEvidencePolicy: {
      currentShape:
        typeof relationshipEvidencePolicy.currentShape === "string"
          ? relationshipEvidencePolicy.currentShape
          : undefined,
      dedicatedTableStatus:
        typeof relationshipEvidencePolicy.dedicatedTableStatus === "string"
          ? relationshipEvidencePolicy.dedicatedTableStatus
          : undefined,
      promoteWhen
    },
    feedbackQuestions,
    nextDeveloperSlice: stringArray(handoff.nextDeveloperSlice),
    items
  };
}

function profileDecision(input: {
  handoffDecision: RuntimeHandoffInstallDecision;
  importStatus?: RuntimePkaImportReport["status"];
  unsupportedCapabilities: string[];
  forceReview?: boolean;
}): RuntimeConsumptionDecision {
  if (input.handoffDecision === "blocked" || input.importStatus === "blocked") {
    return "blocked";
  }

  if (input.forceReview || input.handoffDecision === "installation_review_required" || input.unsupportedCapabilities.length > 0) {
    return "installation_review_required";
  }

  return "installable";
}

function profileNextAction(decision: RuntimeConsumptionDecision) {
  if (decision === "installable") {
    return "Install for deterministic context retrieval; keep model calls behind the runtime provider policy.";
  }

  if (decision === "installation_review_required") {
    return "Route to runtime owner review before enabling package use.";
  }

  return "Block installation and request a corrected package export.";
}

function runtimeConsumerProfileReport(input: {
  id: RuntimeConsumerProfileId;
  label: string;
  handoffDecision: RuntimeHandoffInstallDecision;
  importStatus?: RuntimePkaImportReport["status"];
  supportedCapabilities: string[];
  requiredCapabilities: string[];
  contextBoundary: string;
  installerChecklist: string[];
  forceReview?: boolean;
}): RuntimeConsumerProfileReport {
  const unsupportedCapabilities = input.requiredCapabilities.filter(
    (capability) => !input.supportedCapabilities.includes(capability)
  );
  const decision = profileDecision({
    handoffDecision: input.handoffDecision,
    importStatus: input.importStatus,
    unsupportedCapabilities,
    forceReview: input.forceReview
  });

  return {
    id: input.id,
    label: input.label,
    decision,
    supportedCapabilities: input.supportedCapabilities,
    requiredCapabilities: input.requiredCapabilities,
    unsupportedCapabilities,
    contextBoundary: input.contextBoundary,
    installerChecklist: input.installerChecklist,
    nextAction: profileNextAction(decision)
  };
}

export async function getRuntimeConsumptionContractReport(
  packageId: string,
  handoffPath = "runtime/app-developer-handoff.json"
): Promise<RuntimeConsumptionContractReport> {
  const packageRecord = (await listPkaPackages()).find((pkaPackage) => pkaPackage.packageId === packageId);
  const handoff = await validateRuntimeAppDeveloperHandoff(packageId, handoffPath);
  const runtimeImport = await validateRuntimePkaImportReadback(packageId).catch(() => undefined);
  const requiredCapabilities = runtimeImport?.requiredRuntimeCapabilities ?? [];
  const packageDomain = packageRecord?.domain;
  const aifaRequiresReview = Boolean(packageDomain && !/bookkeeping|finance|account/i.test(packageDomain));
  const profiles: RuntimeConsumerProfileReport[] = [
    runtimeConsumerProfileReport({
      id: "generic_runtime",
      label: "Generic PKA runtime",
      handoffDecision: handoff.decision,
      importStatus: runtimeImport?.status,
      supportedCapabilities: ["knowledge_object_lookup", "relationship_traversal", "source_citation"],
      requiredCapabilities,
      contextBoundary:
        "Load the Base PKA as governed package content; keep runtime facts, user sessions, and client vault state outside the package.",
      installerChecklist: [
        "Validate manifest, governance, component indexes, and archive readback.",
        "Use approved/published knowledge only for production context.",
        "Return focused context bundles instead of sending full package archives to a model."
      ]
    }),
    runtimeConsumerProfileReport({
      id: "aifa",
      label: "AIFA mobile app",
      handoffDecision: handoff.decision,
      importStatus: runtimeImport?.status,
      supportedCapabilities: ["knowledge_object_lookup", "relationship_traversal", "source_citation"],
      requiredCapabilities,
      forceReview: aifaRequiresReview,
      contextBoundary:
        "AIFA keeps ledgers, transactions, bookkeeping state, chat memory, and client learning outside the Base PKA.",
      installerChecklist: [
        "Confirm the package domain is appropriate for AIFA before installation.",
        "Use PKA guidance as professional reasoning context, not as ledger/runtime data.",
        "Require installation review for non-finance/non-bookkeeping packages."
      ]
    }),
    runtimeConsumerProfileReport({
      id: "lados",
      label: "LADOS runtime",
      handoffDecision: handoff.decision,
      importStatus: runtimeImport?.status,
      supportedCapabilities: ["knowledge_object_lookup", "relationship_traversal", "source_citation"],
      requiredCapabilities,
      contextBoundary:
        "LADOS may orchestrate workflows and tools, but project facts, mission state, permissions, and client vault data remain runtime-owned.",
      installerChecklist: [
        "Expose installed PKA retrieval through runtime tools or MCP-compatible interfaces.",
        "Keep workflow execution disabled until the runtime explicitly supports the component contract.",
        "Log retrieval decisions and preserve source citations."
      ]
    })
  ];

  return {
    packageId,
    packageName: packageRecord?.name,
    packageDomain,
    handoffDecision: handoff.decision,
    importStatus: runtimeImport?.status,
    genericChecklist: handoff.items,
    profiles
  };
}

function runtimeHandoffFeedbackRecord(event: GovernanceEventSummary): RuntimeHandoffFeedbackRecord | undefined {
  if (!event.action.startsWith("runtime_handoff_feedback.")) {
    return undefined;
  }

  const metadata = (event as GovernanceEventSummary & { metadata?: unknown }).metadata;
  const metadataObject = runtimeHandoffObject(metadata);
  const runtimeApp = typeof metadataObject.runtimeApp === "string" ? metadataObject.runtimeApp : undefined;
  const decision =
    typeof metadataObject.decision === "string" &&
    ["provenance_ok_for_pilot", "needs_multi_source_lifecycle", "needs_installation_review_records"].includes(
      metadataObject.decision
    )
      ? (metadataObject.decision as RuntimeHandoffFeedbackDecision)
      : undefined;

  if (!runtimeApp || !decision) {
    return undefined;
  }

  return {
    id: event.id,
    packageId: event.subjectId,
    runtimeApp,
    decision,
    actorId: event.actorId,
    notes: typeof metadataObject.notes === "string" ? metadataObject.notes : event.detail,
    createdAt: event.createdAt
  };
}

export async function listRuntimeHandoffFeedback(packageId: string): Promise<RuntimeHandoffFeedbackSummary> {
  const events = await listGovernanceHistory({ subjectId: packageId, limit: 100 });
  const items = events
    .map(runtimeHandoffFeedbackRecord)
    .filter((item): item is RuntimeHandoffFeedbackRecord => Boolean(item));
  const multiSourceLifecycleRequestCount = items.filter(
    (item) => item.decision === "needs_multi_source_lifecycle"
  ).length;
  const installationReviewRecordRequestCount = items.filter(
    (item) => item.decision === "needs_installation_review_records"
  ).length;
  const repeatedMultiSourceLifecycleFeedback =
    multiSourceLifecycleRequestCount >= runtimeHandoffMultiSourceLifecycleThreshold;

  return {
    packageId,
    totalFeedbackCount: items.length,
    provenanceOkCount: items.filter((item) => item.decision === "provenance_ok_for_pilot").length,
    multiSourceLifecycleRequestCount,
    installationReviewRecordRequestCount,
    multiSourceLifecycleThreshold: runtimeHandoffMultiSourceLifecycleThreshold,
    repeatedMultiSourceLifecycleFeedback,
    relationshipEvidenceDecision:
      repeatedMultiSourceLifecycleFeedback
        ? "investigate_dedicated_relationship_evidence_table"
        : multiSourceLifecycleRequestCount > 0
          ? "monitor_multi_source_lifecycle_feedback"
        : "keep_provenance_for_pilot",
    handoffFeedbackPersistenceDecision:
      installationReviewRecordRequestCount > 0
        ? "promote_to_dedicated_app_developer_review_table_later"
        : "audit_backed_records_for_pilot",
    items
  };
}

export async function recordRuntimeHandoffFeedback(input: RuntimeHandoffFeedbackInput) {
  const runtimeApp = input.runtimeApp.trim();
  const notes = input.notes?.trim();

  if (!runtimeApp) {
    throw new Error("runtimeApp is required for runtime handoff feedback.");
  }

  const action = `runtime_handoff_feedback.${input.decision}`;
  await recordAuditLog({
    action,
    subjectType: "PkaPackage",
    subjectId: input.packageId,
    actorId: input.actor ?? "runtime_consumer",
    detail: notes
      ? `${runtimeApp}: ${notes}`
      : `${runtimeApp} recorded runtime handoff feedback: ${input.decision}.`,
    metadata: {
      packageId: input.packageId,
      runtimeApp,
      decision: input.decision,
      notes
    }
  });

  return listRuntimeHandoffFeedback(input.packageId);
}

export async function validateRuntimePkaImportReadback(
  packageId: string,
  archivePath = "package-archive.json"
): Promise<RuntimePkaImportReport> {
  const items: PackageValidationItem[] = [];
  let archive: RuntimePkaArchive | undefined;

  try {
    const archiveFileContents = await readPersistedPkaExportFile(packageId, archivePath);
    archive = JSON.parse(archiveFileContents.contents) as RuntimePkaArchive;
    items.push({
      id: "runtime-import-archive-readable",
      level: archive.archiveFormat === "kf-json-archive" && Array.isArray(archive.files) ? "ready" : "warning",
      title: "Archive structure",
      detail:
        archive.archiveFormat === "kf-json-archive" && Array.isArray(archive.files)
          ? `${archivePath} is a readable KF JSON archive.`
          : `${archivePath} is not a complete KF JSON archive.`
    });
  } catch {
    return {
      packageId,
      archivePath,
      status: "blocked",
      supportedRuntimeCapabilities: supportedRuntimeImportCapabilities,
      requiredRuntimeCapabilities: [],
      loaded: {
        ontologyObjectTypes: 0,
        knowledgeObjects: 0,
        relationships: 0,
        sources: 0,
        runtimeConfigEntries: 0,
        promptEntries: 0,
        ruleEntries: 0,
        workflowEntries: 0,
        templateEntries: 0
      },
      items: [
        {
          id: "runtime-import-archive-readable",
          level: "warning",
          title: "Archive structure",
          detail: `${archivePath} could not be parsed as a KF package archive.`
        }
      ]
    };
  }

  const manifestFile = archiveFile(archive, "manifest.json");
  const ontologyFile = archiveFile(archive, "ontology/index.json");
  const governanceFile = archiveFile(archive, "governance/index.json");
  const knowledgeObjectFile = archiveFile(archive, "knowledge-objects/index.json");
  const relationshipFile = archiveFile(archive, "graph/relationships.json");
  const sourceFile = archiveFile(archive, "sources/index.json");
  const runtimeConfigFile = archiveFile(archive, "runtime/config.json");
  const promptsFile = archiveFile(archive, "prompts/index.json");
  const rulesFile = archiveFile(archive, "rules/index.json");
  const workflowsFile = archiveFile(archive, "workflows/index.json");
  const templatesFile = archiveFile(archive, "templates/index.json");
  const requiredRuntimeCapabilities = manifestRuntimeCapabilities(manifestFile);
  const unsupportedCapabilities = requiredRuntimeCapabilities.filter(
    (capability) => !supportedRuntimeImportCapabilities.includes(capability)
  );
  const requiredFiles = [
    "manifest.json",
    "ontology/index.json",
    "knowledge-objects/index.json",
    "graph/relationships.json",
    "sources/index.json",
    "runtime/config.json",
    "prompts/index.json",
    "rules/index.json",
    "workflows/index.json",
    "templates/index.json",
    "governance/index.json"
  ];
  const missingFiles = requiredFiles.filter((path) => !archiveFile(archive, path));
  const governanceSummaryItems = governanceFile?.contents?.releaseDecisionSummary;
  const rfqWorkflowGateSummary = governanceFile?.contents?.rfqWorkflowGateSummary;
  const rfqWorkflowGateActionSummary = governanceFile?.contents?.rfqWorkflowGateActionSummary;
  const rfqWorkflowGateActionRisk = governanceFile?.contents?.rfqWorkflowGateActionRisk;
  const hasGovernanceSummary =
    governanceSummaryItems &&
    typeof governanceSummaryItems === "object" &&
    "items" in governanceSummaryItems &&
    Array.isArray((governanceSummaryItems as { items?: unknown[] }).items) &&
    Boolean((governanceSummaryItems as { items?: unknown[] }).items?.length);
  const hasRfqWorkflowGateSummary =
    rfqWorkflowGateSummary &&
    typeof rfqWorkflowGateSummary === "object" &&
    "gates" in rfqWorkflowGateSummary &&
    Array.isArray((rfqWorkflowGateSummary as { gates?: unknown[] }).gates) &&
    Boolean((rfqWorkflowGateSummary as { gates?: unknown[] }).gates?.length);
  const hasRfqWorkflowGateActionSummary =
    rfqWorkflowGateActionSummary &&
    typeof rfqWorkflowGateActionSummary === "object" &&
    "items" in rfqWorkflowGateActionSummary &&
    Array.isArray((rfqWorkflowGateActionSummary as { items?: unknown[] }).items);
  const hasRfqWorkflowGateActionRisk =
    rfqWorkflowGateActionRisk &&
    typeof rfqWorkflowGateActionRisk === "object" &&
    "blockedCount" in rfqWorkflowGateActionRisk &&
    "overdueCount" in rfqWorkflowGateActionRisk &&
    "items" in rfqWorkflowGateActionRisk &&
    typeof (rfqWorkflowGateActionRisk as { blockedCount?: unknown }).blockedCount === "number" &&
    typeof (rfqWorkflowGateActionRisk as { overdueCount?: unknown }).overdueCount === "number" &&
    Array.isArray((rfqWorkflowGateActionRisk as { items?: unknown[] }).items);

  items.push(
    {
      id: "runtime-import-manifest",
      level: manifestFile ? "ready" : "warning",
      title: "Manifest contract",
      detail: manifestFile
        ? "manifest.json is present for runtime package identity and capability checks."
        : "manifest.json is required before a runtime can import the package."
    },
    {
      id: "runtime-import-capabilities",
      level: unsupportedCapabilities.length === 0 ? "ready" : "warning",
      title: "Runtime capabilities",
      detail:
        unsupportedCapabilities.length === 0
          ? `${requiredRuntimeCapabilities.length} required runtime capability/capabilities are supported by this harness.`
          : `Unsupported runtime capabilities: ${unsupportedCapabilities.join(", ")}.`
    },
    {
      id: "runtime-import-components",
      level: missingFiles.length === 0 ? "ready" : "warning",
      title: "Component indexes",
      detail:
        missingFiles.length === 0
          ? "Required component indexes are present for import."
          : `Missing component indexes: ${missingFiles.join(", ")}.`
    },
    {
      id: "runtime-import-ontology",
      level: archiveObjectTypeCount(ontologyFile) > 0 ? "ready" : "warning",
      title: "Ontology index",
      detail:
        archiveObjectTypeCount(ontologyFile) > 0
          ? `${archiveObjectTypeCount(ontologyFile)} object type(s) available for runtime classification.`
          : "ontology/index.json must expose object types before runtime graph loading."
    },
    {
      id: "runtime-import-runtime-config",
      level: runtimeConfigFile ? "ready" : "warning",
      title: "Runtime configuration placeholder",
      detail: runtimeConfigFile
        ? "runtime/config.json is present as the placeholder runtime configuration boundary."
        : "runtime/config.json is required so runtime configuration stays separate from client state."
    },
    componentBoundaryItem(
      promptsFile,
      "Prompt library",
      "prompts/index.json is present as the placeholder prompt library boundary."
    ),
    componentBoundaryItem(
      rulesFile,
      "Rule library",
      "rules/index.json is present as the placeholder rule library boundary."
    ),
    componentBoundaryItem(
      workflowsFile,
      "Workflow library",
      "workflows/index.json is present as the placeholder workflow library boundary."
    ),
    componentBoundaryItem(
      templatesFile,
      "Template library",
      "templates/index.json is present as the placeholder template library boundary."
    ),
    {
      id: "runtime-import-governance",
      level: hasGovernanceSummary ? "ready" : "warning",
      title: "Governance release summary",
      detail: hasGovernanceSummary
        ? "governance/index.json includes release decision summaries."
        : "governance/index.json must include release decision summaries before runtime import."
    },
    {
      id: "runtime-import-rfq-workflow-governance",
      level: hasRfqWorkflowGateSummary && hasRfqWorkflowGateActionSummary && hasRfqWorkflowGateActionRisk ? "ready" : "warning",
      title: "RFQ workflow governance",
      detail:
        hasRfqWorkflowGateSummary && hasRfqWorkflowGateActionSummary && hasRfqWorkflowGateActionRisk
          ? "governance/index.json includes RFQ workflow gate, gate action, and blocked-action risk summaries for package handoff."
          : "governance/index.json must include RFQ workflow gate, gate action, and blocked-action risk summaries before RFQ runtime handoff."
    }
  );

  return {
    packageId,
    archivePath,
    status: items.some((item) => item.level === "warning") ? "blocked" : "importable",
    supportedRuntimeCapabilities: supportedRuntimeImportCapabilities,
    requiredRuntimeCapabilities,
    loaded: {
      ontologyObjectTypes: archiveObjectTypeCount(ontologyFile),
      knowledgeObjects: archiveCount(knowledgeObjectFile),
      relationships: archiveCount(relationshipFile),
      sources: archiveCount(sourceFile),
      runtimeConfigEntries: archiveItemsCount(runtimeConfigFile),
      promptEntries: archiveItemsCount(promptsFile),
      ruleEntries: archiveItemsCount(rulesFile),
      workflowEntries: archiveItemsCount(workflowsFile),
      templateEntries: archiveItemsCount(templatesFile)
    },
    items
  };
}

export async function recordRuntimePkaImportDecision(input: {
  packageId: string;
  archivePath: string;
  actor?: string;
}) {
  const report = await validateRuntimePkaImportReadback(input.packageId, input.archivePath);

  await recordAuditLog({
    action: `runtime_import.${report.status}`,
    subjectType: "PkaPackageRuntimeImport",
    subjectId: input.packageId,
    actorId: input.actor ?? "runtime_consumer",
    detail: `Runtime import ${report.status}: ${input.archivePath}`,
    metadata: {
      packageId: input.packageId,
      archivePath: input.archivePath,
      status: report.status,
      warningCount: report.items.filter((item) => item.level === "warning").length,
      requiredRuntimeCapabilities: report.requiredRuntimeCapabilities,
      supportedRuntimeCapabilities: report.supportedRuntimeCapabilities,
      loaded: report.loaded
    }
  });

  return report;
}

export async function importRuntimePkaArchive(input: {
  packageId: string;
  fileName: string;
  contents: string;
}) {
  if (Buffer.byteLength(input.contents, "utf8") > 1024 * 1024) {
    throw new Error("Runtime import archive must be 1 MB or smaller for the local harness.");
  }

  const parsed = JSON.parse(input.contents) as RuntimePkaArchive;
  if (parsed.archiveFormat !== "kf-json-archive" || !Array.isArray(parsed.files)) {
    throw new Error("Runtime import archive must be a KF JSON archive with a files array.");
  }

  const archivePath = `imports/${safeArchiveFileName(input.fileName)}`;
  const fullPath = resolvePkaExportPath(input.packageId, archivePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");

  return archivePath;
}

export async function createRuntimePkaImportFixtures(packageId: string) {
  const sourceArchive = JSON.parse(
    (await readPersistedPkaExportFile(packageId, "package-archive.json")).contents
  ) as RuntimePkaArchive;
  const validArchive = JSON.parse(JSON.stringify(sourceArchive)) as RuntimePkaArchive;
  const missingGovernanceArchive = JSON.parse(JSON.stringify(sourceArchive)) as RuntimePkaArchive;
  const capabilityMismatchArchive = JSON.parse(JSON.stringify(sourceArchive)) as RuntimePkaArchive;
  const missingPromptArchive = archiveWithoutFile(
    JSON.parse(JSON.stringify(sourceArchive)) as RuntimePkaArchive,
    "prompts/index.json"
  );
  const missingRuleArchive = archiveWithoutFile(
    JSON.parse(JSON.stringify(sourceArchive)) as RuntimePkaArchive,
    "rules/index.json"
  );
  const missingWorkflowArchive = archiveWithoutFile(
    JSON.parse(JSON.stringify(sourceArchive)) as RuntimePkaArchive,
    "workflows/index.json"
  );
  const missingTemplateArchive = archiveWithoutFile(
    JSON.parse(JSON.stringify(sourceArchive)) as RuntimePkaArchive,
    "templates/index.json"
  );

  const missingGovernanceFile = archiveFile(missingGovernanceArchive, "governance/index.json");
  if (missingGovernanceFile?.contents) {
    delete missingGovernanceFile.contents.releaseDecisionSummary;
  }

  const mismatchManifestFile = archiveFile(capabilityMismatchArchive, "manifest.json");
  if (mismatchManifestFile?.contents) {
    mismatchManifestFile.contents.requiredRuntimeCapabilities = [
      ...manifestRuntimeCapabilities(mismatchManifestFile),
      "unsupported_realtime_workflow_execution"
    ];
  }

  await mkdir(resolvePkaExportPath(packageId), { recursive: true });
  await writeFile(
    resolvePkaExportPath(packageId, runtimePkaImportFixtureArchivePaths.valid),
    `${JSON.stringify(validArchive, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    resolvePkaExportPath(packageId, runtimePkaImportFixtureArchivePaths.missing_governance),
    `${JSON.stringify(missingGovernanceArchive, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    resolvePkaExportPath(packageId, runtimePkaImportFixtureArchivePaths.capability_mismatch),
    `${JSON.stringify(capabilityMismatchArchive, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    resolvePkaExportPath(packageId, runtimePkaImportFixtureArchivePaths.missing_prompt),
    `${JSON.stringify(missingPromptArchive, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    resolvePkaExportPath(packageId, runtimePkaImportFixtureArchivePaths.missing_rule),
    `${JSON.stringify(missingRuleArchive, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    resolvePkaExportPath(packageId, runtimePkaImportFixtureArchivePaths.missing_workflow),
    `${JSON.stringify(missingWorkflowArchive, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    resolvePkaExportPath(packageId, runtimePkaImportFixtureArchivePaths.missing_template),
    `${JSON.stringify(missingTemplateArchive, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    resolvePkaExportPath(packageId, runtimePkaImportFixtureArchivePaths.malformed_archive),
    "{ invalid runtime package archive\n",
    "utf8"
  );

  return runtimePkaImportFixtureArchivePaths;
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

export function validatePkaPackageReadback(preview: PkaPackageExportPreview | undefined): PackageValidationItem[] {
  if (!preview) {
    return [
      {
        id: "package-readback-missing",
        level: "warning",
        title: "Package readback",
        detail: "A package export preview is required before archive and ZIP readback validation."
      }
    ];
  }

  const archive = buildPkaPackageArchive(preview);
  const governanceArchiveFile = archive.files.find((file) => file.path === "governance/index.json");
  const archiveHasGovernanceSummary = Boolean(
    governanceArchiveFile &&
      typeof governanceArchiveFile.contents === "object" &&
      governanceArchiveFile.contents &&
      "releaseDecisionSummary" in governanceArchiveFile.contents &&
      "rfqWorkflowGateSummary" in governanceArchiveFile.contents &&
      "rfqWorkflowGateActionSummary" in governanceArchiveFile.contents &&
      "rfqWorkflowGateActionRisk" in governanceArchiveFile.contents
  );
  const zipText = buildPkaPackageZip(preview).toString("utf8");
  const zipHasGovernanceSummary =
    zipText.includes("governance/index.json") &&
    zipText.includes("releaseDecisionSummary") &&
    zipText.includes("rfqWorkflowGateSummary") &&
    zipText.includes("rfqWorkflowGateActionSummary") &&
    zipText.includes("rfqWorkflowGateActionRisk");

  return [
    {
      id: "package-archive-readback",
      level: archiveHasGovernanceSummary ? "ready" : "warning",
      title: "JSON archive readback",
      detail: archiveHasGovernanceSummary
        ? "package-archive.json contains governance release, RFQ workflow, gate action, and blocked-action risk summaries."
        : "package-archive.json must include governance/index.json with release, RFQ workflow, gate action, and blocked-action risk summaries."
    },
    {
      id: "package-zip-readback",
      level: zipHasGovernanceSummary ? "ready" : "warning",
      title: "ZIP archive readback",
      detail: zipHasGovernanceSummary
        ? "package.zip contains governance/index.json with release, RFQ workflow, gate action, and blocked-action risk summaries."
        : "package.zip must include governance/index.json with release, RFQ workflow, gate action, and blocked-action risk summaries."
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
  const rfqWorkflowGateActions = await listRfqWorkflowGateActions({ projectId });
  const rfqWorkflowGateActionRisks = rfqWorkflowGateActionRiskSummary(rfqWorkflowGateActions);
  const releaseReadinessHints = await getPkaReleaseReadinessHints(projectId);
  const blockers = releaseReadinessHints.filter((hint) => hint.level === "warning");
  const manifestPreview = await getPkaManifestPreview(projectId);
  const exportPreview = await getPkaPackageExportPreview(projectId);
  const componentManufacturingReport = await getPkaComponentManufacturingReport(projectId);
  const releasableObjects = knowledgeObjects.filter((knowledgeObject) =>
    approvedKnowledgeObject(knowledgeObject.status)
  );
  const items: PackageValidationItem[] = [];

  items.push(...validatePkaManifest(manifestPreview));
  items.push(...validatePkaPackageReadback(exportPreview));
  items.push({
    id: "component-manufacturing-readiness",
    level: componentManufacturingReport.ready ? "ready" : "warning",
    title: "Component manufacturing readiness",
    detail: componentManufacturingReport.ready
      ? `${componentManufacturingReport.manufacturedCount} manufactured component(s) and ${componentManufacturingReport.intentionalPlaceholderCount} intentional placeholder(s) are classified.`
      : `${componentManufacturingReport.missingRequiredCount} required component(s) are missing.`
  });
  items.push(
    ...componentManufacturingReport.items
      .filter((item) => item.status !== "manufactured")
      .map((item) => ({
        id: item.id,
        level: componentReadinessClass(item.status),
        title: item.title,
        detail: item.status === "intentional_placeholder"
          ? `${item.detail} Promotion trigger: ${item.promotionTrigger}`
          : item.detail
      }))
  );

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
    id: "rfq-workflow-blocked-actions",
    level: rfqWorkflowGateActionRisks.blockedCount === 0 ? "ready" : "warning",
    title: "RFQ blocked gate actions",
    detail:
      rfqWorkflowGateActionRisks.blockedCount === 0
        ? "No unresolved blocked RFQ workflow gate actions remain before publish."
        : `${rfqWorkflowGateActionRisks.blockedCount} blocked RFQ workflow gate action(s) remain; publishing is hard-blocked until they are resolved.`
  });

  items.push({
    id: "rfq-workflow-overdue-actions",
    level: rfqWorkflowGateActionRisks.overdueCount === 0 ? "ready" : "info",
    title: "RFQ overdue gate actions",
    detail:
      rfqWorkflowGateActionRisks.overdueCount === 0
        ? "No unresolved overdue RFQ workflow gate actions remain."
        : `${rfqWorkflowGateActionRisks.overdueCount} overdue RFQ workflow gate action(s) should be closed or re-dated before handoff.`
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
  const limit = Math.max(1, Math.min(filters.limit ?? 20, 100));

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
      take: limit
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
  }).slice(0, limit);
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
  const absolutePath = resolve(/* turbopackIgnore: true */ workspaceRootPath(), fixturePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(
    absolutePath,
    fixtureType === "unsupported_file" ? "Deterministic unsupported artifact fixture.\n" : "",
    "utf8"
  );
  await setSourceStoragePath(source.id, fixturePath);

  return fixturePath;
}

async function validateRepairArtifactPath(path: string) {
  if (path.includes(".env")) {
    throw new Error("Repair artifact path cannot reference environment files.");
  }

  const resolved = safeWorkspacePath(path);
  if (!resolved) {
    throw new Error("Repair artifact path must stay inside the KF workspace.");
  }

  const extension = extname(resolved).toLowerCase();
  if (extension !== ".md" && extension !== ".txt") {
    throw new Error("Repair artifact path must point to a Markdown or plain-text file.");
  }

  const content = await readFile(resolved, "utf8");
  if (!content.trim()) {
    throw new Error("Repair artifact path points to an empty text file.");
  }

  return path;
}

export async function repairSourceArtifact(input: RepairSourceArtifactInput) {
  const source = (await listSources()).find((item) => item.id === input.sourceId);

  if (!source) {
    throw new Error(`Source not found: ${input.sourceId}`);
  }

  const repairedPath = input.repairPath?.trim()
    ? await validateRepairArtifactPath(input.repairPath.trim())
    : `storage/pipeline-fixtures/${source.id}-repaired.txt`;

  if (!input.repairPath?.trim()) {
    const absolutePath = resolve(/* turbopackIgnore: true */ workspaceRootPath(), repairedPath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(
      absolutePath,
      (
        input.repairText?.trim() ||
        [
          `${source.title} repaired deterministic artifact.`,
          `Domain: ${source.domain}.`,
          "This repaired source describes the governed source intake, extraction, suggestion, and review workflow.",
          "The artifact is intentionally plain text so deterministic ingestion can create chunks and source-backed suggestions."
        ].join("\n")
      ).trim() + "\n",
      "utf8"
    );
  }

  await setSourceStoragePath(source.id, repairedPath);
  await markSourceProcessingStatus(source.id, "retried");

  const mission = await createMission({
    type: "intelligence",
    title: `Repair source artifact: ${source.title}`,
    projectId: source.projectId,
    assignedTo: input.actor ?? "knowledge_engineer",
    stage: "pipeline-ingestion",
    priority: "normal",
    status: "retried"
  });

  await recordAuditLog({
    action: "pipeline.source_artifact_repaired",
    subjectType: "Source",
    subjectId: source.id,
    actorId: input.actor ?? "knowledge_engineer",
    detail: `Repaired source artifact with deterministic text fixture: ${source.title}`,
    metadata: {
      sourceId: source.id,
      repairedPath,
      repairMode: input.repairPath?.trim() ? "safe_path" : input.repairText?.trim() ? "inline_text" : "deterministic_default",
      missionId: mission.id
    }
  });

  return mission;
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
      id: `sug-${slugify(suggestionDraft.title)}-${index + 1}-${Date.now().toString(36)}`,
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
    id: localUniqueId("aud", input.action),
    actorId: input.actorId,
    action: input.action,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    detail: input.detail,
    metadata: {
      ...input.metadata,
      detail: input.detail
    },
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

export async function updateKnowledgeRelationshipReleaseExclusion(
  input: KnowledgeRelationshipReleaseExclusionInput
) {
  if (usePrismaStore()) {
    await ensureLocalWorkspace();
    const existingRelationship = await getPrismaClient().knowledgeRelationship.findUnique({
      where: { id: input.relationshipId },
      select: { provenance: true }
    });
    const provenance = provenanceRecord(existingRelationship?.provenance);
    const relationship = await getPrismaClient().knowledgeRelationship.update({
      where: { id: input.relationshipId },
      data: {
        provenance: {
          ...provenance,
          releaseClosure: {
            excludedFromRelease: input.excluded,
            reason: input.reason
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
      action: input.excluded
        ? "knowledge_relationship.excluded_from_release"
        : "knowledge_relationship.release_exclusion_removed",
      subjectType: "KnowledgeRelationship",
      subjectId: mappedRelationship.id,
      actorId: input.actor ?? "reviewer",
      detail: `${input.excluded ? "Excluded relationship from release" : "Removed release exclusion"}: ${mappedRelationship.fromTitle} ${mappedRelationship.type} ${mappedRelationship.toTitle}`,
      metadata: {
        relationshipId: mappedRelationship.id,
        excludedFromRelease: input.excluded,
        reason: input.reason
      }
    });

    return mappedRelationship;
  }

  const relationship = workspaceStore().knowledgeRelationships.find((item) => item.id === input.relationshipId);

  if (!relationship) {
    throw new Error(`Knowledge relationship not found: ${input.relationshipId}`);
  }

  relationship.releaseExcluded = input.excluded;
  relationship.releaseExclusionReason = input.reason;

  await recordAuditLog({
    action: input.excluded
      ? "knowledge_relationship.excluded_from_release"
      : "knowledge_relationship.release_exclusion_removed",
    subjectType: "KnowledgeRelationship",
    subjectId: relationship.id,
    actorId: input.actor ?? "reviewer",
    detail: `${input.excluded ? "Excluded relationship from release" : "Removed release exclusion"}: ${relationship.fromTitle} ${relationship.type} ${relationship.toTitle}`,
    metadata: {
      relationshipId: relationship.id,
      excludedFromRelease: input.excluded,
      reason: input.reason
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

    await assertNoBlockedRfqWorkflowGateActionsBeforePublish(existingPackage.projectId);

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

  await assertNoBlockedRfqWorkflowGateActionsBeforePublish(pkaPackage.projectId);

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

function nextQsRfqPilotPackageVersion(packages: PkaPackageSummary[]) {
  const patchVersions = packages
    .map((pkaPackage) => pkaPackage.version.match(/^0\.1\.(\d+)$/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));
  const nextPatch = patchVersions.length > 0 ? Math.max(...patchVersions) + 1 : 0;

  return `0.1.${nextPatch}`;
}

function normaliseQsRfqPilotRunInput(input: string | QsRfqPilotRunInput = {}): Required<QsRfqPilotRunInput> {
  if (typeof input === "string") {
    return {
      actor: input,
      mode: "reuse_existing"
    };
  }

  return {
    actor: input.actor ?? "knowledge_engineer",
    mode: input.mode ?? "reuse_existing"
  };
}

function latestPublishedQsRfqPilotPackage(packages: PkaPackageSummary[]) {
  return packages.find((pkaPackage) => pkaPackage.name === "QS/RFQ From BOQ Base PKA" && pkaPackage.status === "published");
}

async function qsRfqPilotPackageHasCurrentHandoff(packageId: string) {
  const files = await listPersistedPkaExportFiles(packageId);
  const paths = new Set(files.map((file) => file.path));

  return (
    paths.has("workflows/rfq-package-issue-workflow.json") &&
    paths.has("runtime/app-developer-handoff.json") &&
    paths.has("sources/rfq-evidence-register.json")
  );
}

async function buildQsRfqPilotRunReport(sourcePack = getQsRfqPilotSourcePack()): Promise<QsRfqPilotRunReport> {
  const [sourceChunks, knowledgeObjects, relationships, packages, runtimeQaReadiness, fixtureEvaluation, evidenceRegisterReport] =
    await Promise.all([
      listSourceChunks({ projectId: sourcePack.projectId }),
      listKnowledgeObjects({ projectId: sourcePack.projectId }),
      listKnowledgeRelationships({ projectId: sourcePack.projectId }),
      listPkaPackages(sourcePack.projectId),
      getRuntimeQaAnswerReadinessReport(sourcePack.projectId),
      getRuntimeQaFixtureEvaluationReport(sourcePack.projectId),
      getRfqEvidenceRegisterReport(sourcePack.projectId)
    ]);
  const latestPublishedPackage = latestPublishedQsRfqPilotPackage(packages);
  const packageHasCurrentHandoff = latestPublishedPackage
    ? await qsRfqPilotPackageHasCurrentHandoff(latestPublishedPackage.packageId)
    : false;
  const approvedKnowledgeObjects = knowledgeObjects.filter((knowledgeObject) =>
    approvedKnowledgeObject(knowledgeObject.status)
  );
  const approvedRelationships = relationships.filter((relationship) => relationship.status === "approved");
  const ingestedSourceIds = new Set(
    sourceChunks
      .filter((chunk) => sourcePack.sourceIds.includes(chunk.sourceId))
      .map((chunk) => chunk.sourceId)
  );
  const stages: ReadinessHint[] = [
    {
      id: "pilot-sources",
      level: ingestedSourceIds.size === sourcePack.sourceIds.length ? "ready" : "warning",
      title: "Source intake",
      detail: `${ingestedSourceIds.size}/${sourcePack.sourceIds.length} pilot source(s) ingested.`
    },
    {
      id: "pilot-knowledge-objects",
      level: approvedKnowledgeObjects.length >= 4 ? "ready" : "warning",
      title: "Approved Knowledge Objects",
      detail: `${approvedKnowledgeObjects.length} approved pilot KO(s) available for package and runtime context.`
    },
    {
      id: "pilot-relationships",
      level: approvedRelationships.length >= 3 ? "ready" : "warning",
      title: "Governed relationships",
      detail: `${approvedRelationships.length} approved graph edge(s) available for package traversal.`
    },
    {
      id: "pilot-package",
      level: latestPublishedPackage && packageHasCurrentHandoff ? "ready" : "warning",
      title: "Published package handoff",
      detail: latestPublishedPackage
        ? `${latestPublishedPackage.packageId} is ${latestPublishedPackage.status}; workflow and handoff files ${
            packageHasCurrentHandoff ? "are present" : "need regeneration"
          }.`
        : "No published QS/RFQ pilot package yet."
    },
    {
      id: "pilot-rfq-evidence-register",
      level: evidenceRegisterReport.ready ? "ready" : "warning",
      title: "RFQ evidence register",
      detail: evidenceRegisterReport.ready
        ? `${evidenceRegisterReport.totalEntries} evidence register entries prepare future workflow gates.`
        : "Structured RFQ evidence register entries are not ready yet."
    },
    {
      id: "pilot-runtime-qa",
      level: runtimeQaReadiness.ready && fixtureEvaluation.ready ? "ready" : "warning",
      title: "Runtime Q&A contract",
      detail: runtimeQaReadiness.ready && fixtureEvaluation.ready
        ? "Runtime Q&A context and deterministic fixture evaluation are ready."
        : "Runtime Q&A still has package, approval, citation, or relationship blockers."
    }
  ];

  return {
    projectId: sourcePack.projectId,
    title: "QS/RFQ Pilot Run Report",
    status: stages.every((stage) => stage.level === "ready") ? "ready" : "incomplete",
    summary: {
      sourceCount: sourcePack.sourceIds.length,
      ingestedSourceCount: ingestedSourceIds.size,
      approvedKnowledgeObjectCount: approvedKnowledgeObjects.length,
      approvedRelationshipCount: approvedRelationships.length,
      latestPackageStatus: latestPublishedPackage?.status,
      latestPackageId: latestPublishedPackage?.packageId,
      runtimeQaReady: runtimeQaReadiness.ready,
      fixtureEvaluationReady: fixtureEvaluation.ready
    },
    stages
  };
}

export async function getQsRfqPilotRunReport() {
  return buildQsRfqPilotRunReport();
}

export async function runQsRfqPilotVerticalSlice(
  input: string | QsRfqPilotRunInput = {}
): Promise<QsRfqPilotRunResult> {
  const { actor, mode } = normaliseQsRfqPilotRunInput(input);
  const sourcePack = getQsRfqPilotSourcePack();
  await ensureLocalWorkspace();
  await prepareQsRfqPilotSourceArtifacts();

  const reusableReport = await buildQsRfqPilotRunReport(sourcePack);
  const reusablePackage = reusableReport.summary.latestPackageId
    ? (await listPkaPackages(sourcePack.projectId)).find(
        (pkaPackage) => pkaPackage.packageId === reusableReport.summary.latestPackageId
      )
    : undefined;

  if (mode === "reuse_existing" && reusableReport.status === "ready" && reusablePackage) {
    const runtimeImport = await validateRuntimePkaImportReadback(reusablePackage.packageId);
    const evidenceRegisterReport = await getRfqEvidenceRegisterReport(sourcePack.projectId);
    const approvedKnowledgeObjects = (await listKnowledgeObjects({ projectId: sourcePack.projectId })).filter(
      (knowledgeObject) => approvedKnowledgeObject(knowledgeObject.status)
    );
    const approvedRelationships = (await listKnowledgeRelationships({ projectId: sourcePack.projectId })).filter(
      (relationship) => relationship.status === "approved"
    );

    return {
      projectId: sourcePack.projectId,
      sourcePack,
      mode: "reused_existing",
      ingestedSourceIds: sourcePack.sourceIds,
      acceptedKnowledgeObjectIds: approvedKnowledgeObjects.map((knowledgeObject) => knowledgeObject.id),
      acceptedRelationshipIds: approvedRelationships.map((relationship) => relationship.id),
      packageRecordId: reusablePackage.id,
      packageId: reusablePackage.packageId,
      packageStatus: reusablePackage.status,
      runtimeImportStatus: runtimeImport.status,
      evidenceRegisterReady: evidenceRegisterReport.ready,
      runtimeQaReady: reusableReport.summary.runtimeQaReady,
      fixtureEvaluationReady: reusableReport.summary.fixtureEvaluationReady
    };
  }

  const ingestedSourceIds: string[] = [];
  const acceptedKnowledgeObjectIds = new Set<string>();
  const acceptedRelationshipIds = new Set<string>();

  for (const sourceId of sourcePack.sourceIds) {
    const ingestionResult = await runSourceIngestion({ sourceId, actor });
    ingestedSourceIds.push(sourceId);

    const suggestions = (await listKnowledgeSuggestions({ sourceId, status: "all" })).filter((suggestion) =>
      qsRfqPilotSuggestionTitles.has(suggestion.title)
    );
    for (const suggestion of suggestions) {
      if (suggestion.acceptedKnowledgeObjectId) {
        acceptedKnowledgeObjectIds.add(suggestion.acceptedKnowledgeObjectId);
        continue;
      }

      if (suggestion.status === "pending") {
        const accepted = await acceptKnowledgeSuggestion({
          suggestionId: suggestion.id,
          actor
        });
        acceptedKnowledgeObjectIds.add(accepted.knowledgeObject.id);
      }
    }

    const relationshipSuggestions = await listRelationshipSuggestions({ sourceId, status: "all" });
    for (const suggestion of relationshipSuggestions) {
      if (suggestion.acceptedRelationshipId) {
        acceptedRelationshipIds.add(suggestion.acceptedRelationshipId);
        continue;
      }

      const refreshedSuggestion = (await listRelationshipSuggestions({ sourceId, status: "all" })).find(
        (item) => item.id === suggestion.id
      );

      if (refreshedSuggestion?.status === "pending") {
        const accepted = await acceptRelationshipSuggestion({
          relationshipSuggestionId: refreshedSuggestion.id,
          actor
        });
        acceptedRelationshipIds.add(accepted.relationship.id);
      }
    }

    void ingestionResult;
  }

  const pilotKnowledgeObjects = (await listKnowledgeObjects({ projectId: sourcePack.projectId })).filter(
    (knowledgeObject) => acceptedKnowledgeObjectIds.has(knowledgeObject.id)
  );
  const boqKnowledgeObject = pilotKnowledgeObjects.find((knowledgeObject) =>
    knowledgeObject.tags.includes("boq")
  );
  const rfqKnowledgeObject = pilotKnowledgeObjects.find((knowledgeObject) =>
    knowledgeObject.tags.includes("rfq")
  );

  if (boqKnowledgeObject && rfqKnowledgeObject) {
    const existingCrossRelationship = (await listKnowledgeRelationships({ projectId: sourcePack.projectId })).find(
      (relationship) =>
        relationship.fromId === boqKnowledgeObject.id &&
        relationship.toId === rfqKnowledgeObject.id &&
        relationship.type === "supports"
    );
    const crossRelationship =
      existingCrossRelationship ??
      (await createKnowledgeRelationship({
        projectId: sourcePack.projectId,
        fromId: boqKnowledgeObject.id,
        toId: rfqKnowledgeObject.id,
        type: "supports",
        confidence: 86,
        provenanceNote:
          "QS/RFQ pilot cross-source relationship: BOQ evidence supports RFQ package issue requirements."
      }));

    acceptedRelationshipIds.add(crossRelationship.id);
  }

  const knowledgeObjectByTitle = new Map(pilotKnowledgeObjects.map((knowledgeObject) => [knowledgeObject.title, knowledgeObject]));
  const pilotRelationshipSpecs: Array<{
    fromTitle: string;
    toTitle: string;
    type: RelationshipType;
    confidence: number;
    provenanceNote: string;
  }> = [
    {
      fromTitle: "Provisional BOQ quantity assumption rule",
      toTitle: "RFQ BOQ scope completeness check",
      type: "requires",
      confidence: 84,
      provenanceNote:
        "QS/RFQ pilot: provisional BOQ assumptions require RFQ scope completeness review before package issue."
    },
    {
      fromTitle: "Structural BOQ RFQ evidence requirement",
      toTitle: "RFQ BOQ scope completeness check",
      type: "supports",
      confidence: 86,
      provenanceNote:
        "QS/RFQ pilot: structural BOQ evidence supports RFQ package completeness checks for substructure trade scope."
    },
    {
      fromTitle: "RFQ package issue template",
      toTitle: "RFQ return requirements checklist",
      type: "requires",
      confidence: 85,
      provenanceNote:
        "QS/RFQ pilot: the RFQ issue template requires quotation return requirements before package handoff."
    },
    {
      fromTitle: "Tender clarification log procedure",
      toTitle: "RFQ clarification and evidence register",
      type: "supports",
      confidence: 84,
      provenanceNote:
        "QS/RFQ pilot: tender clarification logging supports the RFQ evidence register control boundary."
    },
    {
      fromTitle: "RFQ clarification and evidence register",
      toTitle: "RFQ package issue template",
      type: "used_in",
      confidence: 85,
      provenanceNote:
        "QS/RFQ pilot: the evidence register is used in RFQ package issue readiness and future workflow gates."
    }
  ];

  for (const spec of pilotRelationshipSpecs) {
    const fromKnowledgeObject = knowledgeObjectByTitle.get(spec.fromTitle);
    const toKnowledgeObject = knowledgeObjectByTitle.get(spec.toTitle);

    if (!fromKnowledgeObject || !toKnowledgeObject) {
      continue;
    }

    const existingRelationship = (await listKnowledgeRelationships({ projectId: sourcePack.projectId })).find(
      (relationship) =>
        relationship.fromId === fromKnowledgeObject.id &&
        relationship.toId === toKnowledgeObject.id &&
        relationship.type === spec.type
    );
    const relationship =
      existingRelationship ??
      (await createKnowledgeRelationship({
        projectId: sourcePack.projectId,
        fromId: fromKnowledgeObject.id,
        toId: toKnowledgeObject.id,
        type: spec.type,
        confidence: spec.confidence,
        provenanceNote: spec.provenanceNote
      }));

    acceptedRelationshipIds.add(relationship.id);
  }

  for (const relationship of await listKnowledgeRelationships({ projectId: sourcePack.projectId })) {
    if (!acceptedRelationshipIds.has(relationship.id)) {
      continue;
    }

    if (
      relationship.status !== "approved" ||
      relationship.confidence === undefined ||
      relationship.confidence < 50 ||
      !relationship.provenanceNote
    ) {
      await updateKnowledgeRelationshipProvenance({
        relationshipId: relationship.id,
        provenanceNote:
          relationship.provenanceNote ??
          "QS/RFQ pilot relationship reviewed for RFQ package completeness evidence.",
        confidence: relationship.confidence ?? 84,
        status: "approved",
        actor: "reviewer"
      });
    }
  }

  for (const knowledgeObjectId of acceptedKnowledgeObjectIds) {
    const currentKnowledgeObject = (await listKnowledgeObjects({ projectId: sourcePack.projectId })).find(
      (knowledgeObject) => knowledgeObject.id === knowledgeObjectId
    );

    if (currentKnowledgeObject && !approvedKnowledgeObject(currentKnowledgeObject.status)) {
      await updateKnowledgeObjectStatus({
        id: knowledgeObjectId,
        status: "approved",
        reviewer: "reviewer"
      });
    }
  }

  const evidenceRegisterEntries = await ensureQsRfqPilotEvidenceRegister(actor);

  const packages = await listPkaPackages(sourcePack.projectId);
  const version = nextQsRfqPilotPackageVersion(packages);
  const assembledPackage = await assemblePkaPackage({
    projectId: sourcePack.projectId,
    name: "QS/RFQ From BOQ Base PKA",
    version,
    publisher: "publisher",
    confirmReplacement: true
  });
  const submittedPackage = await updatePkaPackageReleaseStatus({
    packageRecordId: assembledPackage.id,
    status: "under_review",
    actor: "publisher",
    notes: "QS/RFQ pilot package submitted for release review."
  });
  const approvedPackage = await updatePkaPackageReleaseStatus({
    packageRecordId: submittedPackage.id,
    status: "approved",
    actor: "reviewer",
    notes: "QS/RFQ pilot package approved for deterministic runtime validation."
  });
  const publishedPackage = await publishPkaPackage({
    packageRecordId: approvedPackage.id,
    actor: "publisher",
    notes: "Published QS/RFQ pilot Base PKA for local runtime contract demo."
  });
  const runtimeImport = await recordRuntimePkaImportDecision({
    packageId: publishedPackage.packageId,
    archivePath: "package-archive.json",
    actor: "runtime_consumer"
  });
  const evidenceRegisterReport = await getRfqEvidenceRegisterReport(sourcePack.projectId);
  const runtimeQaReadiness = await getRuntimeQaAnswerReadinessReport(sourcePack.projectId);
  const fixtureEvaluation = await getRuntimeQaFixtureEvaluationReport(sourcePack.projectId);

  await recordAuditLog({
    action: "pilot.qs_rfq_vertical_slice_completed",
    subjectType: "Project",
    subjectId: sourcePack.projectId,
    actorId: actor,
    detail:
      "Completed QS/RFQ pilot vertical slice from source artifacts to published package, runtime import, and deterministic Q&A readiness.",
    metadata: {
      sourceIds: ingestedSourceIds,
      knowledgeObjectIds: Array.from(acceptedKnowledgeObjectIds),
      relationshipIds: Array.from(acceptedRelationshipIds),
      evidenceRegisterEntryIds: evidenceRegisterEntries.map((entry) => entry.id),
      packageId: publishedPackage.packageId,
      runtimeImportStatus: runtimeImport.status
    }
  });

  return {
    projectId: sourcePack.projectId,
    sourcePack,
    mode: "created",
    ingestedSourceIds,
    acceptedKnowledgeObjectIds: Array.from(acceptedKnowledgeObjectIds),
    acceptedRelationshipIds: Array.from(acceptedRelationshipIds),
    packageRecordId: publishedPackage.id,
    packageId: publishedPackage.packageId,
    packageStatus: publishedPackage.status,
    runtimeImportStatus: runtimeImport.status,
    evidenceRegisterReady: evidenceRegisterReport.ready,
    runtimeQaReady: runtimeQaReadiness.ready,
    fixtureEvaluationReady: fixtureEvaluation.ready
  };
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
