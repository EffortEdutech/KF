import type { MissionStatus, MissionType } from "@kf/core";
import type { MissionSummary, ProjectSummary, SourceSummary } from "./studio-data";
import {
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

export type MissionInput = {
  type: MissionType;
  title: string;
  projectId: string;
  assignedTo: string;
  stage: string;
  priority: MissionSummary["priority"];
  status?: MissionStatus;
};

type WorkspaceStore = {
  projects: ProjectSummary[];
  sources: SourceSummary[];
  missions: MissionSummary[];
};

declare global {
  var kfWorkspaceStore: WorkspaceStore | undefined;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
}

function workspaceStore() {
  globalThis.kfWorkspaceStore ??= {
    projects: seedProjects.map((project) => ({ ...project })),
    sources: seedSources.map((source) => ({ ...source })),
    missions: seedMissions.map((mission) => ({ ...mission }))
  };

  globalThis.kfWorkspaceStore.missions ??= seedMissions.map((mission) => ({ ...mission }));
  globalThis.kfWorkspaceStore.projects ??= seedProjects.map((project) => ({ ...project }));
  globalThis.kfWorkspaceStore.sources ??= seedSources.map((source) => ({ ...source }));

  return globalThis.kfWorkspaceStore;
}

export function resetWorkspaceStoreForTests() {
  globalThis.kfWorkspaceStore = undefined;
}

export function listProjects() {
  return [...workspaceStore().projects];
}

export function listSources() {
  return [...workspaceStore().sources];
}

export function listMissions() {
  return [...workspaceStore().missions];
}

export function getActiveProject() {
  return listProjects().find((project) => project.id === workspace.activeProjectId) ?? listProjects()[0];
}

export function getProjectSourceCount(projectId: string) {
  return workspaceStore().sources.filter((source) => source.projectId === projectId).length;
}

export function createProject(input: ProjectInput) {
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

export function createSource(input: SourceInput) {
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

export function createMission(input: MissionInput) {
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

export function updateMissionStatus(id: string, status: MissionStatus) {
  const mission = workspaceStore().missions.find((item) => item.id === id);

  if (!mission) {
    throw new Error(`Mission not found: ${id}`);
  }

  mission.status = status;

  return mission;
}
