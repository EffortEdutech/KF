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

export const pkaPackageFolders = [
  "ontology",
  "knowledge-objects",
  "graph",
  "sources",
  "prompts",
  "rules",
  "workflows",
  "runtime",
  "governance"
] as const;
