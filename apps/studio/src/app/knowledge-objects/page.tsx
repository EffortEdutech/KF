import Link from "next/link";
import { lifecycleStates } from "@kf/core";
import { createKnowledgeObjectAction } from "../source-actions";
import { knowledgeObjectTypes } from "../studio-data";
import {
  getKnowledgeObject,
  getProjectReadinessHints,
  type KnowledgeObjectFilter,
  listKnowledgeObjects,
  listProjects,
  listSources,
  listSourcesByProject
} from "../workspace-store";

type KnowledgeObjectsPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    status?: string;
    type?: string;
    q?: string;
    koId?: string;
  }>;
};

export default async function KnowledgeObjectsPage({ searchParams }: KnowledgeObjectsPageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const requestedProject = projects.find((project) => project.id === params?.projectId);
  const activeProject = requestedProject ?? projects[0];
  const projectSources = activeProject ? await listSourcesByProject(activeProject.id) : [];
  const allSources = await listSources();
  const selectedStatus: KnowledgeObjectFilter["status"] = lifecycleStates.includes(
    params?.status as (typeof lifecycleStates)[number]
  )
    ? (params?.status as (typeof lifecycleStates)[number])
    : "all";
  const selectedObjectType: KnowledgeObjectFilter["objectType"] = knowledgeObjectTypes.includes(
    params?.type as (typeof knowledgeObjectTypes)[number]
  )
    ? (params?.type as (typeof knowledgeObjectTypes)[number])
    : "all";
  const filters: KnowledgeObjectFilter = {
    projectId: activeProject?.id,
    status: selectedStatus,
    objectType: selectedObjectType,
    query: params?.q
  };
  const knowledgeObjects = await listKnowledgeObjects(filters);
  const requestedKnowledgeObject = params?.koId ? await getKnowledgeObject(params.koId) : undefined;
  const selectedKnowledgeObject =
    requestedKnowledgeObject ?? knowledgeObjects[0];
  const activeProjectHints = activeProject ? await getProjectReadinessHints(activeProject) : [];
  const totalKnowledgeObjects = projects.reduce(
    (total, project) => total + project.knowledgeObjectCount,
    0
  );
  const draftCount = knowledgeObjects.filter((knowledgeObject) => knowledgeObject.status === "draft").length;
  const approvedCount = knowledgeObjects.filter((knowledgeObject) =>
    ["expert_validated", "approved", "published"].includes(knowledgeObject.status)
  ).length;

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Knowledge Objects</p>
          <h2>Repository MVP</h2>
          <p className="lede">
            Create source-backed draft Knowledge Objects, inspect their evidence, and keep governance status visible.
          </p>
        </div>
        <span className="status">{knowledgeObjects.length} shown</span>
      </header>

      {params?.projectId && !requestedProject ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>Project filter not found</strong>
          <span>The requested project does not exist. Showing the first available project instead.</span>
        </section>
      ) : null}

      {params?.koId && !requestedKnowledgeObject ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>Knowledge Object not found</strong>
          <span>The requested Knowledge Object ID does not exist in this workspace.</span>
        </section>
      ) : null}

      <section className="metrics" aria-label="Knowledge Object repository metrics">
        <div className="metric">
          <span>Total Knowledge Objects</span>
          <strong>{totalKnowledgeObjects}</strong>
        </div>
        <div className="metric">
          <span>Filtered drafts</span>
          <strong>{draftCount}</strong>
        </div>
        <div className="metric">
          <span>Validated or approved</span>
          <strong>{approvedCount}</strong>
        </div>
        <div className="metric">
          <span>Project sources</span>
          <strong>{projectSources.length}</strong>
        </div>
      </section>

      <section className="filter-bar" aria-label="Knowledge Object filters">
        <Link className={!params?.projectId ? "filter-chip active" : "filter-chip"} href="/knowledge-objects">
          First project
        </Link>
        {projects.map((project) => (
          <Link
            className={project.id === activeProject?.id ? "filter-chip active" : "filter-chip"}
            href={`/knowledge-objects?projectId=${project.id}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <form className="filter-bar" aria-label="Knowledge Object search filters">
        {activeProject ? <input type="hidden" name="projectId" value={activeProject.id} /> : null}
        <label className="filter-field">
          Status
          <select name="status" defaultValue={filters.status}>
            <option value="all">all</option>
            {lifecycleStates.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          Type
          <select name="type" defaultValue={filters.objectType}>
            <option value="all">all</option>
            {knowledgeObjectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field filter-search">
          Search
          <input name="q" defaultValue={params?.q ?? ""} placeholder="title, domain, tag, description" />
        </label>
        <button className="filter-button" type="submit">
          Apply filters
        </button>
      </form>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Manual creation</p>
          <h3>Draft Knowledge Object</h3>
          {activeProject ? (
            <form action={createKnowledgeObjectAction} className="source-form">
              <input type="hidden" name="projectId" value={activeProject.id} />
              <label className="field-wide">
                Title
                <input name="title" defaultValue="RFQ package completeness rule" required />
              </label>
              <label>
                Type
                <select name="objectType" defaultValue="rule">
                  {knowledgeObjectTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Domain
                <input name="domain" defaultValue={activeProject.domain} required />
              </label>
              <label>
                Owner
                <input name="owner" defaultValue="knowledge_engineer" required />
              </label>
              <label>
                Author
                <input name="author" defaultValue="knowledge_engineer" required />
              </label>
              <label>
                Confidence
                <input name="confidence" type="number" min="0" max="100" step="0.01" defaultValue="65" />
              </label>
              <label>
                Tags
                <input name="tags" defaultValue="rfq, boq, procurement" />
              </label>
              <label className="field-wide">
                Description
                <textarea
                  name="description"
                  defaultValue="An RFQ package should include clear BOQ scope, trade package boundary, pricing basis, submission requirements, and commercial clarification rules."
                  required
                />
              </label>
              <label className="field-wide">
                Source evidence
                <select name="sourceId" defaultValue={projectSources[0]?.id ?? ""}>
                  <option value="">expert/manual input without source link</option>
                  {projectSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-wide">
                Evidence excerpt
                <textarea
                  name="evidenceExcerpt"
                  defaultValue="BOQ and RFQ documentation must define measurable scope and commercial submission requirements."
                />
              </label>
              <label>
                Evidence locator
                <input name="evidenceLocator" defaultValue="section/page reference pending" />
              </label>
              <label>
                Evidence confidence
                <input name="evidenceConfidence" type="number" min="0" max="100" step="0.01" defaultValue="70" />
              </label>
              <button type="submit">Create draft KO</button>
            </form>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No project available</strong>
              <span>Create a project before adding Knowledge Objects.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Knowledge Object detail</p>
          {selectedKnowledgeObject ? (
            <>
              <h3>{selectedKnowledgeObject.title}</h3>
              <p>{selectedKnowledgeObject.description}</p>
              <dl className="detail-list">
                <div>
                  <dt>Object ID</dt>
                  <dd>{selectedKnowledgeObject.id}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{selectedKnowledgeObject.status}</dd>
                </div>
                <div>
                  <dt>Approval</dt>
                  <dd>{selectedKnowledgeObject.approvalStatus}</dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{selectedKnowledgeObject.version}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{selectedKnowledgeObject.confidence ?? "not set"}</dd>
                </div>
                <div>
                  <dt>Tags</dt>
                  <dd>{selectedKnowledgeObject.tags.join(", ") || "none"}</dd>
                </div>
              </dl>
              <div className="readiness-list" aria-label="Source evidence links">
                {selectedKnowledgeObject.evidenceLinks.length > 0 ? (
                  selectedKnowledgeObject.evidenceLinks.map((evidence) => (
                    <div className="readiness-item readiness-info" key={evidence.id}>
                      <strong>{evidence.sourceTitle}</strong>
                      <span>{evidence.excerpt || "No excerpt captured yet."}</span>
                      <span>{evidence.locator ? `Locator: ${evidence.locator}` : "Locator pending"}</span>
                    </div>
                  ))
                ) : (
                  <div className="readiness-item readiness-warning">
                    <strong>No source evidence link</strong>
                    <span>This KO is marked as expert/manual input until evidence is attached.</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No Knowledge Object selected</strong>
              <span>Create a draft KO or adjust filters to inspect repository detail.</span>
            </div>
          )}
        </article>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Project readiness</p>
          <h3>{activeProject?.name ?? "No active project"}</h3>
          {activeProject ? (
            <div className="readiness-list" aria-label="Knowledge Object readiness hints">
              {activeProjectHints.map((hint) => (
                <div className={`readiness-item readiness-${hint.level}`} key={hint.id}>
                  <strong>{hint.title}</strong>
                  <span>{hint.detail}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No project available</strong>
              <span>Create a project and register sources before the repository workflow begins.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Sprint 2 boundary</p>
          <h3>Draft-first governance</h3>
          <p>
            This first slice creates draft Knowledge Objects only. Editing, relationship management,
            approval transitions, and release locks remain explicit Sprint 2 follow-up tasks.
          </p>
        </article>
      </section>

      <section className="table-panel" aria-label="Knowledge Object list">
        <div className="table-row ko-row table-head">
          <span>Knowledge Object</span>
          <span>Type</span>
          <span>Status</span>
          <span>Evidence</span>
          <span>Owner</span>
        </div>
        {knowledgeObjects.map((knowledgeObject) => (
          <div
            className={`table-row ko-row ${
              knowledgeObject.id === selectedKnowledgeObject?.id ? "row-selected" : ""
            }`}
            key={knowledgeObject.id}
          >
            <strong>
              <Link
                className="inline-link"
                href={`/knowledge-objects?projectId=${knowledgeObject.projectId}&koId=${knowledgeObject.id}`}
              >
                {knowledgeObject.title}
              </Link>
            </strong>
            <span>{knowledgeObject.objectType}</span>
            <span className="pill">{knowledgeObject.status}</span>
            <span>
              {knowledgeObject.evidenceLinks.length > 0
                ? `${knowledgeObject.evidenceLinks.length} linked`
                : "manual/expert"}
            </span>
            <span>{knowledgeObject.owner ?? "unassigned"}</span>
          </div>
        ))}
        {knowledgeObjects.length === 0 ? (
          <div className="table-empty">
            <strong>No Knowledge Objects found</strong>
            <span>Create the first draft KO or adjust the filters for this project.</span>
          </div>
        ) : null}
      </section>
    </>
  );
}
