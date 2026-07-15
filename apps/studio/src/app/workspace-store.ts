import type { MissionStatus, MissionType } from "@kf/core";
import { getPrismaClient } from "@kf/db";
import type {
  KnowledgeObjectSummary,
  MissionSummary,
  ProjectSummary,
  SourceEvidenceSummary,
  SourceSummary
} from "./studio-data";
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

type WorkspaceStore = {
  projects: ProjectSummary[];
  sources: SourceSummary[];
  missions: MissionSummary[];
  knowledgeObjects: KnowledgeObjectSummary[];
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
    knowledgeObjects: []
  };

  globalThis.kfWorkspaceStore.missions ??= seedMissions.map((mission) => ({ ...mission }));
  globalThis.kfWorkspaceStore.projects ??= seedProjects.map((project) => ({ ...project }));
  globalThis.kfWorkspaceStore.sources ??= seedSources.map((source) => ({ ...source }));
  globalThis.kfWorkspaceStore.knowledgeObjects ??= [];

  return globalThis.kfWorkspaceStore;
}

export function resetWorkspaceStoreForTests() {
  globalThis.kfWorkspaceStore = undefined;
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
        }
      }
    });

    return knowledgeObject ? mapKnowledgeObject(knowledgeObject) : undefined;
  }

  return workspaceStore().knowledgeObjects.find((knowledgeObject) => knowledgeObject.id === id);
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
