import Link from "next/link";
import {
  acceptKnowledgeSuggestionAction,
  acceptRelationshipSuggestionAction,
  createFailedIngestionFixtureAction,
  retrySourceIngestionAction,
  runSourceIngestionAction,
  updateKnowledgeSuggestionStatusAction,
  updateRelationshipSuggestionStatusAction
} from "../source-actions";
import {
  getPipelineQualityMetrics,
  listKnowledgeObjects,
  listKnowledgeSuggestions,
  listMissions,
  listProjects,
  listRelationshipSuggestions,
  listSourceChunks,
  listSourcesByProject
} from "../workspace-store";

type PipelinePageProps = {
  searchParams?: Promise<{
    projectId?: string;
    sourceId?: string;
    status?: string;
  }>;
};

const suggestionStatuses = ["all", "pending", "accepted", "rejected", "deferred"] as const;
const pipelineHref = (input: { projectId?: string; sourceId?: string; status?: string }) => {
  const params = new URLSearchParams();
  if (input.projectId) {
    params.set("projectId", input.projectId);
  }
  if (input.sourceId) {
    params.set("sourceId", input.sourceId);
  }
  if (input.status) {
    params.set("status", input.status);
  }

  return `/pipeline?${params.toString()}`;
};

export default async function PipelinePage({ searchParams }: PipelinePageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const requestedProject = projects.find((project) => project.id === params?.projectId);
  const activeProject = requestedProject ?? projects[0];
  const sources = activeProject ? await listSourcesByProject(activeProject.id) : [];
  const selectedSource = sources.find((source) => source.id === params?.sourceId) ?? sources[0];
  const selectedStatus = suggestionStatuses.includes(params?.status as (typeof suggestionStatuses)[number])
    ? (params?.status as (typeof suggestionStatuses)[number])
    : "all";
  const chunks = await listSourceChunks({
    projectId: activeProject?.id,
    sourceId: selectedSource?.id
  });
  const suggestions = await listKnowledgeSuggestions({
    projectId: activeProject?.id,
    sourceId: selectedSource?.id,
    status: selectedStatus
  });
  const relationshipSuggestions = await listRelationshipSuggestions({
    projectId: activeProject?.id,
    sourceId: selectedSource?.id,
    status: selectedStatus
  });
  const missions = await listMissions();
  const projectPipelineMetrics = await getPipelineQualityMetrics({ projectId: activeProject?.id });
  const selectedSourcePipelineMetrics = await getPipelineQualityMetrics({
    projectId: activeProject?.id,
    sourceId: selectedSource?.id
  });
  const failedPipelineMissions = missions.filter(
    (mission) =>
      mission.stage === "pipeline-ingestion" &&
      mission.status === "failed" &&
      (!activeProject || mission.projectId === activeProject.id)
  );
  const projectKnowledgeObjects = activeProject
    ? await listKnowledgeObjects({ projectId: activeProject.id })
    : [];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Pipeline</p>
          <h2>Manufacturing Pipeline</h2>
          <p className="lede">
            Run deterministic source ingestion, inspect source chunks, and create source-backed draft Knowledge Objects.
          </p>
        </div>
        <span className="status">{suggestions.length + relationshipSuggestions.length} suggestion(s)</span>
      </header>

      {params?.projectId && !requestedProject ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>Project filter not found</strong>
          <span>The requested project does not exist. Showing the first available project instead.</span>
        </section>
      ) : null}

      <section className="metrics" aria-label="Pipeline metrics">
        <Link className="metric metric-link" href={pipelineHref({ projectId: activeProject?.id })}>
          <span>Project sources</span>
          <strong>{sources.length}</strong>
        </Link>
        <Link className="metric metric-link" href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id })}>
          <span>Source chunks</span>
          <strong>{chunks.length}</strong>
        </Link>
        <Link
          className="metric metric-link"
          href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "pending" })}
        >
          <span>Pending suggestions</span>
          <strong>{projectPipelineMetrics.pendingSuggestionCount}</strong>
        </Link>
        <div className="metric">
          <span>Project KOs</span>
          <strong>{projectKnowledgeObjects.length}</strong>
        </div>
        <Link
          className="metric metric-link"
          href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "accepted" })}
        >
          <span>Accepted ratio</span>
          <strong>{projectPipelineMetrics.acceptanceRate}%</strong>
        </Link>
        <Link
          className="metric metric-link"
          href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "deferred" })}
        >
          <span>Defer/reject ratio</span>
          <strong>{projectPipelineMetrics.deferOrRejectRate}%</strong>
        </Link>
      </section>

      {failedPipelineMissions.length > 0 ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>{failedPipelineMissions.length} failed pipeline job(s)</strong>
          <span>
            Open the source below and use retry after correcting the artifact reference or source metadata.
          </span>
        </section>
      ) : null}

      <section className="filter-bar" aria-label="Pipeline project filters">
        {projects.map((project) => (
          <Link
            className={project.id === activeProject?.id ? "filter-chip active" : "filter-chip"}
            href={`/pipeline?projectId=${project.id}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Source ingestion</p>
          <h3>{activeProject?.name ?? "No active project"}</h3>
          {selectedSource ? (
            <>
              <form className="source-form" action={runSourceIngestionAction}>
                <input type="hidden" name="sourceId" value={selectedSource.id} />
                <input type="hidden" name="actor" value="knowledge_engineer" />
                <label className="field-wide">
                  Source
                  <select name="selectedSource" defaultValue={selectedSource.id} disabled>
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.title}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit">Run ingestion</button>
              </form>
              {chunks.length > 0 || suggestions.length > 0 || relationshipSuggestions.length > 0 ? (
                <form className="inline-form action-row" action={retrySourceIngestionAction}>
                  <input type="hidden" name="sourceId" value={selectedSource.id} />
                  <input type="hidden" name="actor" value="knowledge_engineer" />
                  <button type="submit">Retry ingestion</button>
                </form>
              ) : null}
              <div className="action-row">
                <form className="inline-form" action={createFailedIngestionFixtureAction}>
                  <input type="hidden" name="sourceId" value={selectedSource.id} />
                  <input type="hidden" name="actor" value="knowledge_engineer" />
                  <input type="hidden" name="fixtureType" value="manual_failure" />
                  <button type="submit">Create failed fixture</button>
                </form>
                <form className="inline-form" action={createFailedIngestionFixtureAction}>
                  <input type="hidden" name="sourceId" value={selectedSource.id} />
                  <input type="hidden" name="actor" value="knowledge_engineer" />
                  <input type="hidden" name="fixtureType" value="unsupported_file" />
                  <button type="submit">Create unsupported fixture</button>
                </form>
                <form className="inline-form" action={createFailedIngestionFixtureAction}>
                  <input type="hidden" name="sourceId" value={selectedSource.id} />
                  <input type="hidden" name="actor" value="knowledge_engineer" />
                  <input type="hidden" name="fixtureType" value="empty_artifact" />
                  <button type="submit">Create empty fixture</button>
                </form>
              </div>
              <div className="readiness-list" aria-label="Pipeline source selector">
                {sources.map((source) => (
                  <Link
                    className={`readiness-item ${
                      source.id === selectedSource.id ? "readiness-ready" : "readiness-info"
                    }`}
                    href={`/pipeline?projectId=${source.projectId}&sourceId=${source.id}&status=${selectedStatus}`}
                    key={source.id}
                  >
                    <strong>{source.title}</strong>
                    <span>{source.category} / {source.processingStatus}</span>
                    <span>{source.boundary}</span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No sources available</strong>
              <span>Register source material before running ingestion.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Stage tracking</p>
          <h3>{selectedSource?.title ?? "No source selected"}</h3>
          {selectedSource ? (
            <dl className="detail-list">
              <div>
                <dt>Ingestion</dt>
                <dd>{chunks.length > 0 ? "completed" : "ready"}</dd>
              </div>
              <div>
                <dt>Extraction</dt>
                <dd>
                  {chunks.length > 0
                    ? `${chunks.length} chunk(s) from ${selectedSource.storagePath ? "artifact or metadata" : "metadata"}`
                    : "waiting"}
                </dd>
              </div>
              <div>
                <dt>KO suggestion</dt>
                <dd>{suggestions.length > 0 ? `${suggestions.length} KO suggestion(s)` : "waiting"}</dd>
              </div>
              <div>
                <dt>Relationship suggestion</dt>
                <dd>
                  {relationshipSuggestions.length > 0
                    ? `${relationshipSuggestions.length} relationship suggestion(s)`
                    : "waiting"}
                </dd>
              </div>
              <div>
                <dt>Artifact reference</dt>
                <dd>{selectedSource.storagePath ?? "metadata fallback"}</dd>
              </div>
              <div>
                <dt>Review boundary</dt>
                <dd>Draft KOs still require human governance before release.</dd>
              </div>
              <div>
                <dt>Pipeline quality</dt>
                <dd>
                  {selectedSourcePipelineMetrics.acceptedSuggestionCount} accepted,{" "}
                  {selectedSourcePipelineMetrics.deferredSuggestionCount} deferred,{" "}
                  {selectedSourcePipelineMetrics.rejectedSuggestionCount} rejected
                </dd>
              </div>
              <div>
                <dt>Recovery signals</dt>
                <dd>
                  {selectedSourcePipelineMetrics.failedJobCount} failed job(s),{" "}
                  {selectedSourcePipelineMetrics.retriedJobCount} retry job(s)
                </dd>
              </div>
            </dl>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No source selected</strong>
              <span>Select a project with registered sources.</span>
            </div>
          )}
        </article>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Source chunks</p>
          <h3>Extraction output</h3>
          {chunks.length > 0 ? (
            <div className="timeline-list" aria-label="Source chunks">
              {chunks.map((chunk) => (
                <div className="timeline-item" key={chunk.id}>
                  <strong>{chunk.locator ?? `chunk ${chunk.chunkIndex + 1}`}</strong>
                  <span>{chunk.content}</span>
                  <span>{chunk.tokenEstimate ?? "unknown"} token estimate</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No chunks yet</strong>
              <span>Run ingestion to create deterministic source fragments.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Suggestion filters</p>
          <h3>Drafting queue</h3>
          <form className="filter-bar compact-filter" aria-label="Suggestion filters">
            {activeProject ? <input type="hidden" name="projectId" value={activeProject.id} /> : null}
            {selectedSource ? <input type="hidden" name="sourceId" value={selectedSource.id} /> : null}
            <label className="filter-field">
              Status
              <select name="status" defaultValue={selectedStatus}>
                {suggestionStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <button className="filter-button" type="submit">
              Apply filter
            </button>
          </form>
          <div className="summary-row">
            <Link className="text-link" href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "pending" })}>
              {projectPipelineMetrics.pendingSuggestionCount} pending
            </Link>
            <Link className="text-link" href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "accepted" })}>
              {projectPipelineMetrics.acceptedSuggestionCount} accepted
            </Link>
            <Link className="text-link" href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "deferred" })}>
              {projectPipelineMetrics.deferredSuggestionCount} deferred
            </Link>
            <Link className="text-link" href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "rejected" })}>
              {projectPipelineMetrics.rejectedSuggestionCount} rejected
            </Link>
            <span>{relationshipSuggestions.length} relationship</span>
            <span>{projectPipelineMetrics.failedJobCount} failed</span>
            <span>{projectPipelineMetrics.retriedJobCount} retried</span>
          </div>
        </article>
      </section>

      <section className="board" aria-label="Knowledge Object suggestions">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <article className="panel" key={suggestion.id}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{suggestion.objectType}</p>
                  <h3>{suggestion.title}</h3>
                </div>
                <span className="pill">{suggestion.status}</span>
              </div>
              <p>{suggestion.description}</p>
              <dl className="detail-list">
                <div>
                  <dt>Source</dt>
                  <dd>{suggestion.sourceTitle ?? suggestion.sourceId ?? "source pending"}</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>{suggestion.evidenceExcerpt ?? "No evidence excerpt captured."}</dd>
                </div>
                <div>
                  <dt>Review notes</dt>
                  <dd>{suggestion.reviewNotes ?? "No review note."}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{suggestion.confidence ?? "not set"}</dd>
                </div>
              </dl>
              <div className="tags" aria-label={`${suggestion.title} suggested tags`}>
                {suggestion.suggestedTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              {suggestion.status === "pending" ? (
                <>
                  <form className="inline-form action-row" action={acceptKnowledgeSuggestionAction}>
                    <input type="hidden" name="suggestionId" value={suggestion.id} />
                    <input type="hidden" name="actor" value="knowledge_engineer" />
                    <button type="submit">Create draft KO</button>
                  </form>
                  <form className="source-form compact-form" action={updateKnowledgeSuggestionStatusAction}>
                    <input type="hidden" name="suggestionId" value={suggestion.id} />
                    <input type="hidden" name="actor" value="reviewer" />
                    <label className="field-wide">
                      Reviewer note
                      <textarea
                        name="reviewNotes"
                        defaultValue="KO suggestion needs stronger source evidence before draft creation."
                      />
                    </label>
                    <label>
                      Decision
                      <select name="status" defaultValue="deferred">
                        <option value="deferred">deferred</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </label>
                    <button type="submit">Record KO suggestion decision</button>
                  </form>
                </>
              ) : suggestion.acceptedKnowledgeObjectId ? (
                <div className="action-row">
                  <Link className="text-link" href={`/knowledge-objects?projectId=${suggestion.projectId}&koId=${suggestion.acceptedKnowledgeObjectId}`}>
                    Open draft KO
                  </Link>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <article className="panel empty-state">
            <p className="eyebrow">Suggestions</p>
            <h3>No suggestions found</h3>
            <p>Run ingestion or adjust the suggestion status filter.</p>
          </article>
        )}
      </section>

      <section className="board" aria-label="Relationship suggestions">
        {relationshipSuggestions.length > 0 ? (
          relationshipSuggestions.map((suggestion) => {
            const endpointsAccepted =
              Boolean(suggestion.fromAcceptedKnowledgeObjectId) &&
              Boolean(suggestion.toAcceptedKnowledgeObjectId);

            return (
              <article className="panel" key={suggestion.id}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Relationship suggestion</p>
                    <h3>
                      {suggestion.fromSuggestionTitle} {suggestion.type} {suggestion.toSuggestionTitle}
                    </h3>
                  </div>
                  <span className="pill">{suggestion.status}</span>
                </div>
                <p>{suggestion.rationale}</p>
                <dl className="detail-list">
                  <div>
                    <dt>Evidence</dt>
                    <dd>{suggestion.evidenceExcerpt ?? "No evidence excerpt captured."}</dd>
                  </div>
                  <div>
                    <dt>Review notes</dt>
                    <dd>{suggestion.reviewNotes ?? "No review note."}</dd>
                  </div>
                  <div>
                    <dt>Confidence</dt>
                    <dd>{suggestion.confidence ?? "not set"}</dd>
                  </div>
                  <div>
                    <dt>Acceptance readiness</dt>
                    <dd>{endpointsAccepted ? "endpoint KOs ready" : "accept both KO suggestions first"}</dd>
                  </div>
                </dl>
                {suggestion.status === "pending" && endpointsAccepted ? (
                  <form className="inline-form action-row" action={acceptRelationshipSuggestionAction}>
                    <input type="hidden" name="relationshipSuggestionId" value={suggestion.id} />
                    <input type="hidden" name="actor" value="knowledge_engineer" />
                    <button type="submit">Create draft relationship</button>
                  </form>
                ) : suggestion.acceptedRelationshipId ? (
                  <div className="action-row">
                    <Link className="text-link" href={`/ontology?projectId=${suggestion.projectId}`}>
                      Open graph quality
                    </Link>
                  </div>
                ) : null}
                {suggestion.status === "pending" ? (
                  <form className="source-form compact-form" action={updateRelationshipSuggestionStatusAction}>
                    <input type="hidden" name="relationshipSuggestionId" value={suggestion.id} />
                    <input type="hidden" name="actor" value="reviewer" />
                    <label className="field-wide">
                      Reviewer note
                      <textarea
                        name="reviewNotes"
                        defaultValue="Relationship suggestion needs more source support before graph inclusion."
                      />
                    </label>
                    <label>
                      Decision
                      <select name="status" defaultValue="deferred">
                        <option value="deferred">deferred</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </label>
                    <button type="submit">Record suggestion decision</button>
                  </form>
                ) : null}
              </article>
            );
          })
        ) : (
          <article className="panel empty-state">
            <p className="eyebrow">Relationship suggestions</p>
            <h3>No relationship suggestions found</h3>
            <p>Run ingestion with at least two KO suggestions to generate relationship candidates.</p>
          </article>
        )}
      </section>
    </>
  );
}
