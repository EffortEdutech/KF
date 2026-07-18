export type PkaManifest = {
  packageId: string;
  name: string;
  version: string;
  domain: string;
  description: string;
  publisher: string;
  createdDate: string;
  updatedDate: string;
  requiredRuntimeCapabilities: string[];
  retrievalCapabilities: PkaRetrievalCapability[];
  contextBundleSchemaVersion: string;
  governanceStatus: string;
  licenseOrUsagePolicy: string;
};

export type PkaRetrievalCapability =
  | "knowledge_object_search"
  | "graph_traversal"
  | "source_evidence_retrieval"
  | "rule_retrieval"
  | "workflow_retrieval"
  | "template_retrieval"
  | "context_bundle_generation"
  | "mcp_tool_exposure"
  | "approved_only_filtering"
  | "permission_filtered_retrieval";

export type PkaGovernanceMode =
  | "approved_only"
  | "published_only"
  | "review_context"
  | "draft_allowed";

export type PkaComponentKind =
  | "knowledge_object"
  | "ontology"
  | "relationship_graph"
  | "source_reference_index"
  | "evidence_register"
  | "rule"
  | "workflow"
  | "template"
  | "formula"
  | "prompt_library"
  | "case_library"
  | "runtime_configuration"
  | "governance_record";

export type PkaComponentManifestEntry = {
  id: string;
  kind: PkaComponentKind;
  path: string;
  version: string;
  governanceStatus: string;
  sourceRefs: string[];
};

export type PkaContextKnowledgeObject = {
  id: string;
  title: string;
  type: string;
  status: string;
  summary: string;
  confidence?: number;
  sourceRefs: string[];
};

export type PkaContextRelationship = {
  fromId: string;
  toId: string;
  type: string;
  confidence?: number;
  provenanceRefs: string[];
};

export type PkaContextComponentRef = {
  id: string;
  kind: Extract<
    PkaComponentKind,
    "rule" | "workflow" | "template" | "formula" | "prompt_library" | "case_library"
  >;
  title: string;
  status: string;
  path?: string;
  summary?: string;
  sourceRefs: string[];
};

export type PkaContextSourceEvidence = {
  sourceId: string;
  title: string;
  excerpt?: string;
  locator?: string;
  usagePolicy?: string;
};

export type PkaContextBundle = {
  query: string;
  pka: Pick<PkaManifest, "packageId" | "version" | "domain"> & {
    name?: string;
  };
  retrievedAt: string;
  governanceMode: PkaGovernanceMode;
  knowledgeObjects: PkaContextKnowledgeObject[];
  relationships: PkaContextRelationship[];
  rules: PkaContextComponentRef[];
  workflows: PkaContextComponentRef[];
  templates: PkaContextComponentRef[];
  sourceEvidence: PkaContextSourceEvidence[];
  runtimeInstructions: string[];
  limitations: string[];
};

export const pkaPackageFolders = [
  "ontology",
  "knowledge-objects",
  "graph",
  "sources",
  "prompts",
  "rules",
  "formulas",
  "cases",
  "workflows",
  "templates",
  "runtime",
  "governance"
] as const;
