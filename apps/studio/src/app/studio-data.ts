import type { LifecycleState, MissionStatus, MissionType, RelationshipType } from "@kf/core";

export const navigationItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Manufacturing Line", href: "/manufacturing-line" },
  { label: "Mission Centre", href: "/missions" },
  { label: "Projects", href: "/projects" },
  { label: "Sources", href: "/sources" },
  { label: "Knowledge Objects", href: "/knowledge-objects" },
  { label: "Review", href: "/review" },
  { label: "Ontology", href: "/ontology" },
  { label: "Graph", href: "/ontology#graph-quality" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "RFQ Workflow", href: "/rfq-workflow" },
  { label: "PKA Builder", href: "/pka-builder" },
  { label: "Runtime Import", href: "/runtime-import" },
  { label: "Runtime Handoff", href: "/runtime-handoff" },
  { label: "Runtime Q&A", href: "/runtime-qa" },
  { label: "AI Workbench", href: "#ai-workbench" },
  { label: "Settings", href: "#settings" }
];

export const workspace = {
  organisation: "KF Local Organisation",
  workspace: "Foundation Workspace",
  activeProjectId: "kf-qs-rfq-pilot",
  activeProjectName: "QS/RFQ from BOQ PKA Pilot",
  owner: "platform_admin"
};

export const sourceCategories = [
  "standard",
  "SOP",
  "company_document",
  "expert_interview",
  "historical_case",
  "analytical_model",
  "template",
  "external_data_reference",
  "architecture_note"
] as const;

export type SourceCategory = (typeof sourceCategories)[number];

export const knowledgeObjectTypes = [
  "concept",
  "rule",
  "procedure",
  "formula",
  "template",
  "case_reference",
  "checklist_item",
  "definition"
] as const;

export type KnowledgeObjectType = (typeof knowledgeObjectTypes)[number];

export type ProjectSummary = {
  id: string;
  name: string;
  domain: string;
  status: LifecycleState;
  owner: string;
  workspace: string;
  objective: string;
  sourceCount: number;
  knowledgeObjectCount: number;
  readiness: string;
};

export const projects: ProjectSummary[] = [
  {
    id: "kf-qs-rfq-pilot",
    name: "QS/RFQ from BOQ PKA Pilot",
    domain: "Quantity Surveying",
    status: "draft",
    owner: "knowledge_architect",
    workspace: workspace.workspace,
    objective: "Manufacture a governed proof-of-concept PKA for Request for Quotation from Bill of Quantity workflows.",
    sourceCount: 3,
    knowledgeObjectCount: 0,
    readiness: "Foundation"
  },
  {
    id: "kf-finance-reference",
    name: "Finance PKA Reference",
    domain: "Finance",
    status: "draft",
    owner: "knowledge_engineer",
    workspace: workspace.workspace,
    objective: "Hold AIFA-aligned finance PKA anatomy examples without mixing runtime business data into the Base PKA.",
    sourceCount: 2,
    knowledgeObjectCount: 0,
    readiness: "Architecture"
  }
];

export type SourceSummary = {
  id: string;
  projectId: string;
  title: string;
  category: SourceCategory;
  domain: string;
  owner: string;
  version: string;
  reliability: string;
  reviewStatus: LifecycleState;
  usagePolicy: string;
  processingStatus: MissionStatus;
  boundary: "base_pka_input" | "client_adaptation_input";
  storagePath?: string;
  createdAt: string;
};

export const sources: SourceSummary[] = [
  {
    id: "src-boq-sample",
    projectId: "kf-qs-rfq-pilot",
    title: "Sample Bill of Quantity",
    category: "company_document",
    domain: "Quantity Surveying",
    owner: "knowledge_engineer",
    version: "0.1",
    reliability: "internal sample",
    reviewStatus: "draft",
    usagePolicy: "Local development only",
    processingStatus: "created",
    boundary: "base_pka_input",
    storagePath: "storage/sources/src-boq-sample/source.md",
    createdAt: "2026-07-15"
  },
  {
    id: "src-rfq-template",
    projectId: "kf-qs-rfq-pilot",
    title: "RFQ Template Structure",
    category: "template",
    domain: "Procurement",
    owner: "knowledge_architect",
    version: "0.1",
    reliability: "draft reference",
    reviewStatus: "draft",
    usagePolicy: "Reusable PKA component candidate",
    processingStatus: "queued",
    boundary: "base_pka_input",
    storagePath: "storage/sources/src-rfq-template/source.md",
    createdAt: "2026-07-15"
  },
  {
    id: "src-aifa-pka-runtime",
    projectId: "kf-finance-reference",
    title: "AIFA PKA Runtime Alignment Notes",
    category: "architecture_note",
    domain: "Finance",
    owner: "platform_admin",
    version: "1.0",
    reliability: "architecture input",
    reviewStatus: "under_review",
    usagePolicy: "Architecture reference only",
    processingStatus: "ready",
    boundary: "client_adaptation_input",
    storagePath: "docs/implementation/PKA Anatomy and Runtime Boundary.md",
    createdAt: "2026-07-15"
  }
];

export type MissionSummary = {
  id: string;
  type: MissionType;
  title: string;
  status: MissionStatus;
  projectId: string;
  assignedTo: string;
  stage: string;
  priority: "low" | "normal" | "high";
};

export type SourceEvidenceSummary = {
  id: string;
  sourceId: string;
  sourceTitle: string;
  excerpt?: string;
  locator?: string;
  confidence?: number;
};

export type RfqEvidenceCategory =
  | "issued_evidence"
  | "missing_evidence"
  | "assumption"
  | "addendum"
  | "subcontractor_return"
  | "commercial_exception";

export const rfqEvidenceCategories = [
  "issued_evidence",
  "missing_evidence",
  "assumption",
  "addendum",
  "subcontractor_return",
  "commercial_exception"
] as const satisfies RfqEvidenceCategory[];

export type RfqEvidenceStatus =
  | "draft"
  | "under_review"
  | "accepted"
  | "clarification_required"
  | "superseded";

export const rfqEvidenceStatuses = [
  "draft",
  "under_review",
  "accepted",
  "clarification_required",
  "superseded"
] as const satisfies RfqEvidenceStatus[];

export type RfqEvidenceRegisterEntrySummary = {
  id: string;
  projectId: string;
  sourceId?: string;
  sourceTitle?: string;
  knowledgeObjectId?: string;
  knowledgeObjectTitle?: string;
  registerCode: string;
  boqItemRef?: string;
  tradeSection: string;
  category: RfqEvidenceCategory;
  status: RfqEvidenceStatus;
  questionOrEvidence: string;
  requiredResponseOwner: string;
  evidenceReference?: string;
  commercialImpact?: string;
  pricingBasisChange: boolean;
  workflowGate: "prepare" | "review" | "approve_issue" | "clarify" | "receive_compare";
  createdAt: string;
};

export type SourceChunkSummary = {
  id: string;
  projectId: string;
  sourceId: string;
  sourceTitle: string;
  chunkIndex: number;
  locator?: string;
  content: string;
  tokenEstimate?: number;
  createdAt: string;
};

export type KnowledgeSuggestionStatus = "pending" | "accepted" | "rejected" | "deferred";

export type KnowledgeSuggestionSummary = {
  id: string;
  projectId: string;
  sourceId?: string;
  sourceTitle?: string;
  sourceChunkId?: string;
  title: string;
  objectType: KnowledgeObjectType;
  domain: string;
  description: string;
  confidence?: number;
  suggestedTags: string[];
  evidenceExcerpt?: string;
  evidenceLocator?: string;
  reviewNotes?: string;
  status: KnowledgeSuggestionStatus;
  acceptedKnowledgeObjectId?: string;
  createdAt: string;
};

export type RelationshipSuggestionStatus = "pending" | "accepted" | "rejected" | "deferred";

export type RelationshipSuggestionSummary = {
  id: string;
  projectId: string;
  sourceId?: string;
  sourceTitle?: string;
  sourceChunkId?: string;
  fromSuggestionId: string;
  fromSuggestionTitle: string;
  fromAcceptedKnowledgeObjectId?: string;
  toSuggestionId: string;
  toSuggestionTitle: string;
  toAcceptedKnowledgeObjectId?: string;
  type: import("@kf/core").RelationshipType;
  rationale: string;
  confidence?: number;
  evidenceExcerpt?: string;
  evidenceLocator?: string;
  reviewNotes?: string;
  status: RelationshipSuggestionStatus;
  acceptedRelationshipId?: string;
  createdAt: string;
};

export type KnowledgeRelationshipSummary = {
  id: string;
  projectId: string;
  fromId: string;
  fromTitle: string;
  toId: string;
  toTitle: string;
  type: RelationshipType;
  status: LifecycleState;
  confidence?: number;
  provenanceNote?: string;
  releaseExcluded?: boolean;
  releaseExclusionReason?: string;
  evidenceSourceId?: string;
  evidenceSourceTitle?: string;
  evidenceExcerpt?: string;
  evidenceLocator?: string;
  evidenceConfidence?: number;
  createdAt: string;
};

export type GovernanceEventSummary = {
  id: string;
  action: string;
  subjectType: string;
  subjectId: string;
  actorId?: string;
  detail: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type KnowledgeObjectVersionSnapshotSummary = {
  id: string;
  knowledgeObjectId: string;
  version: string;
  title: string;
  objectType: KnowledgeObjectType;
  domain: string;
  description: string;
  status: LifecycleState;
  confidence?: number;
  tags: string[];
  snapshotReason: string;
  actorId?: string;
  createdAt: string;
};

export type ReviewSummary = {
  id: string;
  knowledgeObjectId: string;
  knowledgeObjectTitle: string;
  reviewerId: string;
  reviewerRole: string;
  decision: LifecycleState;
  notes?: string;
  createdAt: string;
};

export type KnowledgeObjectSummary = {
  id: string;
  projectId: string;
  title: string;
  objectType: KnowledgeObjectType;
  domain: string;
  description: string;
  status: LifecycleState;
  version: string;
  confidence?: number;
  approvalStatus: LifecycleState;
  owner?: string;
  author?: string;
  contributor?: string;
  reviewer?: string;
  tags: string[];
  evidenceLinks: SourceEvidenceSummary[];
  outgoingRelationships: KnowledgeRelationshipSummary[];
  incomingRelationships: KnowledgeRelationshipSummary[];
  createdAt: string;
};

export const missions: MissionSummary[] = [
  {
    id: "mis-s1-shell",
    type: "discovery",
    title: "Establish Sprint 1 Studio workspace shell",
    status: "running",
    projectId: "kf-qs-rfq-pilot",
    assignedTo: "knowledge_architect",
    stage: "workspace",
    priority: "high"
  },
  {
    id: "mis-s1-sources",
    type: "acquisition",
    title: "Register first pilot source materials",
    status: "queued",
    projectId: "kf-qs-rfq-pilot",
    assignedTo: "knowledge_engineer",
    stage: "source-management",
    priority: "normal"
  },
  {
    id: "mis-s1-boundary",
    type: "validation",
    title: "Preserve Base PKA and runtime-vault boundaries",
    status: "ready",
    projectId: "kf-finance-reference",
    assignedTo: "reviewer",
    stage: "architecture",
    priority: "normal"
  }
];

export const recentActivity = [
  "PKA Anatomy and Runtime Boundary accepted for implementation planning.",
  "Sprint 1 started with Studio shell, Dashboard, Mission Centre, Projects, and Sources.",
  "QS/RFQ from BOQ remains the first Base PKA pilot target.",
  "AIFA alignment captured as runtime-product guidance, not KF runtime logic."
];
