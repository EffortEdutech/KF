import type { LifecycleState, MissionStatus, MissionType } from "@kf/core";

export const navigationItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Mission Centre", href: "/missions" },
  { label: "Projects", href: "/projects" },
  { label: "Sources", href: "/sources" },
  { label: "Knowledge Objects", href: "#knowledge-objects" },
  { label: "Ontology", href: "#ontology" },
  { label: "Graph", href: "#graph" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Review", href: "#review" },
  { label: "PKA Builder", href: "#pka-builder" },
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
  title: string;
  category: string;
  domain: string;
  owner: string;
  version: string;
  reliability: string;
  reviewStatus: LifecycleState;
  usagePolicy: string;
  processingStatus: MissionStatus;
  boundary: "base_pka_input" | "client_adaptation_input";
};

export const sources: SourceSummary[] = [
  {
    id: "src-boq-sample",
    title: "Sample Bill of Quantity",
    category: "company_document",
    domain: "Quantity Surveying",
    owner: "knowledge_engineer",
    version: "0.1",
    reliability: "internal sample",
    reviewStatus: "draft",
    usagePolicy: "Local development only",
    processingStatus: "created",
    boundary: "base_pka_input"
  },
  {
    id: "src-rfq-template",
    title: "RFQ Template Structure",
    category: "template",
    domain: "Procurement",
    owner: "knowledge_architect",
    version: "0.1",
    reliability: "draft reference",
    reviewStatus: "draft",
    usagePolicy: "Reusable PKA component candidate",
    processingStatus: "queued",
    boundary: "base_pka_input"
  },
  {
    id: "src-aifa-pka-runtime",
    title: "AIFA PKA Runtime Alignment Notes",
    category: "architecture_note",
    domain: "Finance",
    owner: "platform_admin",
    version: "1.0",
    reliability: "architecture input",
    reviewStatus: "under_review",
    usagePolicy: "Architecture reference only",
    processingStatus: "ready",
    boundary: "client_adaptation_input"
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

