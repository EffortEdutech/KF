import type { SourceSummary } from "./studio-data";
import { sources as seedSources, workspace } from "./studio-data";

type SourceInput = {
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

declare global {
  var kfSourceStore: SourceSummary[] | undefined;
}

function sourceStore() {
  globalThis.kfSourceStore ??= [...seedSources];
  return globalThis.kfSourceStore;
}

export function listSources() {
  return [...sourceStore()];
}

export function createSource(input: SourceInput) {
  const id = `src-${input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36)}-${Date.now().toString(36)}`;

  const source: SourceSummary = {
    id,
    projectId: workspace.activeProjectId,
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

  sourceStore().unshift(source);

  return source;
}

