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
  governanceStatus: string;
  licenseOrUsagePolicy: string;
};

export type PkaComponentKind =
  | "knowledge_object"
  | "ontology"
  | "relationship_graph"
  | "source_reference_index"
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

export const pkaPackageFolders = [
  "ontology",
  "knowledge-objects",
  "graph",
  "sources",
  "prompts",
  "rules",
  "workflows",
  "templates",
  "runtime",
  "governance"
] as const;
