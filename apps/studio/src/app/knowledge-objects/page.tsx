import Link from "next/link";
import { lifecycleStates, relationshipTypes } from "@kf/core";
import {
  createKnowledgeObjectAction,
  createKnowledgeRelationshipAction,
  updateKnowledgeObjectAction,
  updateKnowledgeObjectStatusAction
} from "../source-actions";
import { knowledgeObjectTypes } from "../studio-data";
import {
  getKnowledgeObject,
  getProjectReadinessHints,
  getRelationshipReadinessHints,
  type KnowledgeRelationshipFilter,
  type KnowledgeObjectFilter,
  listGovernanceHistory,
  listKnowledgeObjectVersionSnapshots,
  listKnowledgeObjects,
  listKnowledgeRelationships,
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
    relType?: string;
    relQuality?: string;
  }>;
};

const relationshipQualityStates: Exclude<KnowledgeRelationshipFilter["qualityState"], undefined>[] = [
  "all",
  "ready",
  "needs_review",
  "weak_confidence",
  "missing_provenance"
];

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
  const selectedRelationshipType: KnowledgeRelationshipFilter["relationshipType"] = relationshipTypes.includes(
    params?.relType as (typeof relationshipTypes)[number]
  )
    ? (params?.relType as (typeof relationshipTypes)[number])
    : "all";
  const selectedRelationshipQuality: KnowledgeRelationshipFilter["qualityState"] = relationshipQualityStates.includes(
    params?.relQuality as Exclude<KnowledgeRelationshipFilter["qualityState"], undefined>
  )
    ? (params?.relQuality as Exclude<KnowledgeRelationshipFilter["qualityState"], undefined>)
    : "all";
  const filters: KnowledgeObjectFilter = {
    projectId: activeProject?.id,
    status: selectedStatus,
    objectType: selectedObjectType,
    query: params?.q
  };
  const knowledgeObjects = await listKnowledgeObjects(filters);
  const projectKnowledgeObjects = activeProject
    ? await listKnowledgeObjects({ projectId: activeProject.id })
    : [];
  const requestedKnowledgeObject = params?.koId ? await getKnowledgeObject(params.koId) : undefined;
  const selectedKnowledgeObject =
    requestedKnowledgeObject ?? knowledgeObjects[0];
  const selectedRelationships = selectedKnowledgeObject
    ? await listKnowledgeRelationships({
        projectId: selectedKnowledgeObject.projectId,
        knowledgeObjectId: selectedKnowledgeObject.id,
        relationshipType: selectedRelationshipType,
        qualityState: selectedRelationshipQuality
      })
    : [];
  const selectedAllRelationships = selectedKnowledgeObject
    ? await listKnowledgeRelationships({
        projectId: selectedKnowledgeObject.projectId,
        knowledgeObjectId: selectedKnowledgeObject.id
      })
    : [];
  const governanceHistory = selectedKnowledgeObject
    ? await listGovernanceHistory({ subjectId: selectedKnowledgeObject.id })
    : [];
  const versionSnapshots = selectedKnowledgeObject
    ? await listKnowledgeObjectVersionSnapshots(selectedKnowledgeObject.id)
    : [];
  const reviewQueueCandidates = activeProject
    ? await listKnowledgeObjects({ projectId: activeProject.id, status: "under_review" })
    : [];
  const relationshipHints = getRelationshipReadinessHints(selectedKnowledgeObject, selectedAllRelationships);
  const editableSelectedKnowledgeObject =
    selectedKnowledgeObject?.status === "draft" || selectedKnowledgeObject?.status === "under_review";
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
              <form action={updateKnowledgeObjectStatusAction} className="inline-form">
                <input type="hidden" name="knowledgeObjectId" value={selectedKnowledgeObject.id} />
                <input type="hidden" name="reviewer" value="reviewer" />
                <select
                  key={`${selectedKnowledgeObject.id}-${selectedKnowledgeObject.status}`}
                  name="status"
                  defaultValue={selectedKnowledgeObject.status}
                  aria-label={`Lifecycle status for ${selectedKnowledgeObject.title}`}
                >
                  <option value="draft">draft</option>
                  <option value="under_review">under_review</option>
                  <option value="approved">approved</option>
                  <option value="deprecated">deprecated</option>
                </select>
                <button type="submit">Update lifecycle</button>
              </form>
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
        <article className="panel panel-strong">
          <p className="eyebrow">Governed editing</p>
          <h3>Draft / under-review edits</h3>
          {selectedKnowledgeObject && editableSelectedKnowledgeObject ? (
            <form action={updateKnowledgeObjectAction} className="source-form" key={`edit-${selectedKnowledgeObject.id}`}>
              <input type="hidden" name="knowledgeObjectId" value={selectedKnowledgeObject.id} />
              <label className="field-wide">
                Title
                <input name="title" defaultValue={selectedKnowledgeObject.title} required />
              </label>
              <label>
                Type
                <select name="objectType" defaultValue={selectedKnowledgeObject.objectType}>
                  {knowledgeObjectTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Domain
                <input name="domain" defaultValue={selectedKnowledgeObject.domain} required />
              </label>
              <label>
                Owner
                <input name="owner" defaultValue={selectedKnowledgeObject.owner ?? "knowledge_engineer"} required />
              </label>
              <label>
                Author
                <input name="author" defaultValue={selectedKnowledgeObject.author ?? "knowledge_engineer"} required />
              </label>
              <label>
                Confidence
                <input
                  name="confidence"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={selectedKnowledgeObject.confidence ?? ""}
                />
              </label>
              <label className="field-wide">
                Tags
                <input name="tags" defaultValue={selectedKnowledgeObject.tags.join(", ")} />
              </label>
              <label className="field-wide">
                Description
                <textarea name="description" defaultValue={selectedKnowledgeObject.description} required />
              </label>
              <button type="submit">Save KO edit</button>
            </form>
          ) : (
            <div className="empty-state compact-empty">
              <strong>{selectedKnowledgeObject ? "Editing locked" : "No KO selected"}</strong>
              <span>
                {selectedKnowledgeObject
                  ? "Only draft and under-review Knowledge Objects can be edited in this Sprint 2 slice."
                  : "Select or create a Knowledge Object before editing."}
              </span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Relationship creation</p>
          <h3>Link Knowledge Objects</h3>
          {selectedKnowledgeObject && projectKnowledgeObjects.length > 1 ? (
            <form
              action={createKnowledgeRelationshipAction}
              className="source-form"
              key={`relationship-${selectedKnowledgeObject.id}`}
            >
              <input type="hidden" name="projectId" value={selectedKnowledgeObject.projectId} />
              <input type="hidden" name="fromId" value={selectedKnowledgeObject.id} />
              <div className="field-wide form-static">
                <span>From</span>
                <strong>{selectedKnowledgeObject.title}</strong>
              </div>
              <label className="field-wide">
                To
                <select
                  name="toId"
                  defaultValue={
                    projectKnowledgeObjects.find((knowledgeObject) => knowledgeObject.id !== selectedKnowledgeObject.id)
                      ?.id ?? ""
                  }
                >
                  {projectKnowledgeObjects
                    .filter((knowledgeObject) => knowledgeObject.id !== selectedKnowledgeObject.id)
                    .map((knowledgeObject) => (
                      <option key={knowledgeObject.id} value={knowledgeObject.id}>
                        {knowledgeObject.title}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Relationship
                <select name="relationshipType" defaultValue="supports">
                  {relationshipTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Confidence
                <input name="relationshipConfidence" type="number" min="0" max="100" step="0.01" defaultValue="60" />
              </label>
              <label className="field-wide">
                Provenance note
                <textarea
                  name="provenanceNote"
                  defaultValue="Manual relationship created during Sprint 2 repository review."
                />
              </label>
              <button type="submit">Create relationship</button>
            </form>
          ) : (
            <div className="empty-state compact-empty">
              <strong>Need at least two KOs</strong>
              <span>Create another Knowledge Object in this project before linking relationships.</span>
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
          <p className="eyebrow">Relationship panel</p>
          <h3>Connected knowledge</h3>
          <form className="filter-bar compact-filter" aria-label="Relationship filters">
            {activeProject ? <input type="hidden" name="projectId" value={activeProject.id} /> : null}
            {selectedKnowledgeObject ? <input type="hidden" name="koId" value={selectedKnowledgeObject.id} /> : null}
            {selectedStatus !== "all" ? <input type="hidden" name="status" value={selectedStatus} /> : null}
            {selectedObjectType !== "all" ? <input type="hidden" name="type" value={selectedObjectType} /> : null}
            {params?.q ? <input type="hidden" name="q" value={params.q} /> : null}
            <label className="filter-field">
              Edge type
              <select name="relType" defaultValue={selectedRelationshipType}>
                <option value="all">all</option>
                {relationshipTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              Quality
              <select name="relQuality" defaultValue={selectedRelationshipQuality}>
                {relationshipQualityStates.map((qualityState) => (
                  <option key={qualityState} value={qualityState}>
                    {qualityState}
                  </option>
                ))}
              </select>
            </label>
            <button className="filter-button" type="submit">
              Filter edges
            </button>
          </form>
          <div className="readiness-list" aria-label="Relationship quality hints">
            {relationshipHints.map((hint) => (
              <div className={`readiness-item readiness-${hint.level}`} key={hint.id}>
                <strong>{hint.title}</strong>
                <span>{hint.detail}</span>
              </div>
            ))}
          </div>
          {selectedRelationships.length > 0 ? (
            <div className="readiness-list" aria-label="Knowledge Object relationships">
              {selectedRelationships.map((relationship) => (
                <div className="readiness-item readiness-info" key={relationship.id}>
                  <strong>
                    {relationship.fromTitle} {relationship.type} {relationship.toTitle}
                  </strong>
                  <span>Status: {relationship.status}</span>
                  <span>Confidence: {relationship.confidence ?? "not set"}</span>
                  <span>{relationship.provenanceNote ?? "No provenance note captured."}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No relationships yet</strong>
              <span>
                {selectedAllRelationships.length > 0
                  ? "No relationships match the current type/quality filters."
                  : "Link Knowledge Objects to begin the inspectable PKA graph."}
              </span>
            </div>
          )}
        </article>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Governance history</p>
          <h3>{selectedKnowledgeObject?.title ?? "No Knowledge Object selected"}</h3>
          {governanceHistory.length > 0 ? (
            <div className="timeline-list" aria-label="Knowledge Object governance history">
              {governanceHistory.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <strong>{event.action}</strong>
                  <span>{event.detail}</span>
                  <span>
                    {event.createdAt}
                    {event.actorId ? ` by ${event.actorId}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No governance events yet</strong>
              <span>Edit, transition, or relate this KO to create its first audit event.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Version snapshots</p>
          <h3>{selectedKnowledgeObject?.version ?? "No version selected"}</h3>
          {versionSnapshots.length > 0 ? (
            <div className="timeline-list" aria-label="Knowledge Object version snapshots">
              {versionSnapshots.map((snapshot) => (
                <div className="timeline-item" key={snapshot.id}>
                  <strong>{snapshot.version}</strong>
                  <span>{snapshot.title}</span>
                  <span>
                    {snapshot.createdAt}
                    {snapshot.actorId ? ` by ${snapshot.actorId}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No version snapshots yet</strong>
              <span>The first editable KO save will capture the previous version before applying changes.</span>
            </div>
          )}
        </article>
      </section>

      <section className="board">
        <article className="panel">
          <p className="eyebrow">Sprint 4 planning</p>
          <h3>Review queue preview</h3>
          {reviewQueueCandidates.length > 0 ? (
            <div className="readiness-list" aria-label="Sprint 4 review queue preview">
              {reviewQueueCandidates.map((knowledgeObject) => (
                <div className="readiness-item readiness-info" key={knowledgeObject.id}>
                  <strong>{knowledgeObject.title}</strong>
                  <span>{knowledgeObject.objectType} in {knowledgeObject.domain}</span>
                  <span>{knowledgeObject.evidenceLinks.length} evidence link(s), {knowledgeObject.outgoingRelationships.length + knowledgeObject.incomingRelationships.length} relationship edge(s)</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No under-review KOs queued</strong>
              <span>Move draft Knowledge Objects to under_review to seed the Sprint 4 review queue.</span>
            </div>
          )}
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
