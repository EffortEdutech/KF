import Link from "next/link";
import { createSourceAction } from "../source-actions";
import { sourceCategories } from "../studio-data";
import { getSourceReadinessHints, listProjects, listSources, listSourcesByProject } from "../workspace-store";

type SourcesPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    sourceId?: string;
  }>;
};

export default async function SourcesPage({ searchParams }: SourcesPageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const selectedProject = projects.find((project) => project.id === params?.projectId);
  const allSources = await listSources();
  const sources = selectedProject ? await listSourcesByProject(selectedProject.id) : allSources;
  const requestedSource = params?.sourceId
    ? allSources.find((source) => source.id === params.sourceId)
    : undefined;
  const selectedSource =
    sources.find((source) => source.id === params?.sourceId) ??
    requestedSource ??
    sources[0];
  const selectedProjectId = selectedProject?.id ?? selectedSource?.projectId ?? projects[0]?.id;
  const sourceHints = selectedSource ? getSourceReadinessHints(selectedSource) : [];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Sources</p>
          <h2>Source management</h2>
          <p className="lede">
            Register trusted material before extracting draft Knowledge Objects.
          </p>
        </div>
        <span className="status">
          {sources.length} {selectedProject ? "project sources" : "registered"}
        </span>
      </header>

      {params?.projectId && !selectedProject ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>Project filter not found</strong>
          <span>The requested project ID does not exist. Showing all registered sources instead.</span>
        </section>
      ) : null}

      {params?.sourceId && !requestedSource ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>Source not found</strong>
          <span>The requested source ID does not exist in the current workspace.</span>
        </section>
      ) : null}

      {requestedSource && selectedProject && requestedSource.projectId !== selectedProject.id ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>Source outside project filter</strong>
          <span>The selected source belongs to another project. Showing its detail while keeping the current filter.</span>
        </section>
      ) : null}

      <section className="filter-bar" aria-label="Project source filters">
        <Link className={!selectedProject ? "filter-chip active" : "filter-chip"} href="/sources">
          All sources
        </Link>
        {projects.map((project) => (
          <Link
            className={project.id === selectedProject?.id ? "filter-chip active" : "filter-chip"}
            href={`/sources?projectId=${project.id}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Manual registration</p>
          <h3>Source intake</h3>
          {projects.length > 0 ? (
            <form action={createSourceAction} className="source-form">
              <label className="field-wide">
                Project
                <select name="projectId" defaultValue={selectedProjectId}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-wide">
                Title
                <input name="title" defaultValue="New QS source" required />
              </label>
              <label>
                Category
                <select name="category" defaultValue="company_document">
                  {sourceCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Domain
                <input name="domain" defaultValue="Quantity Surveying" required />
              </label>
              <label>
                Owner
                <input name="owner" defaultValue="knowledge_engineer" required />
              </label>
              <label>
                Version
                <input name="version" defaultValue="0.1" required />
              </label>
              <label>
                Reliability
                <input name="reliability" defaultValue="internal draft" required />
              </label>
              <label className="field-wide">
                Usage policy
                <input name="usagePolicy" defaultValue="Local development only" required />
              </label>
              <label className="field-wide">
                Storage or artifact reference
                <input name="storagePath" defaultValue="storage/sources/new-qs-source" />
              </label>
              <label>
                Boundary
                <select name="boundary" defaultValue="base_pka_input">
                  <option value="base_pka_input">base_pka_input</option>
                  <option value="client_adaptation_input">client_adaptation_input</option>
                </select>
              </label>
              <button type="submit">Register source</button>
            </form>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No projects available</strong>
              <span>Create a project before registering source material.</span>
            </div>
          )}
        </article>

        {selectedSource ? (
          <article className="panel">
            <p className="eyebrow">Source detail</p>
            <h3>{selectedSource.title}</h3>
            <p>
              Source detail keeps provenance, usage policy, reliability, and Base PKA
              boundary visible before manufacturing begins.
            </p>
            <dl className="detail-list">
              <div>
                <dt>Source ID</dt>
                <dd>{selectedSource.id}</dd>
              </div>
              <div>
                <dt>Project</dt>
                <dd>
                  <Link className="inline-link" href={`/projects?projectId=${selectedSource.projectId}`}>
                    {projects.find((project) => project.id === selectedSource.projectId)?.name ??
                      selectedSource.projectId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Review status</dt>
                <dd>{selectedSource.reviewStatus}</dd>
              </div>
              <div>
                <dt>Usage policy</dt>
                <dd>{selectedSource.usagePolicy}</dd>
              </div>
              <div>
                <dt>Storage reference</dt>
                <dd>{selectedSource.storagePath}</dd>
              </div>
              <div>
                <dt>Boundary</dt>
                <dd>{selectedSource.boundary}</dd>
              </div>
            </dl>
            <div className="action-row">
              <Link className="text-link" href={`/sources?projectId=${selectedSource.projectId}`}>
                Filter to project
              </Link>
            </div>
            <div className="readiness-list" aria-label="Source readiness hints">
              {sourceHints.map((hint) => (
                <div className={`readiness-item readiness-${hint.level}`} key={hint.id}>
                  <strong>{hint.title}</strong>
                  <span>{hint.detail}</span>
                </div>
              ))}
            </div>
          </article>
        ) : (
          <article className="panel empty-state">
            <p className="eyebrow">Source detail</p>
            <h3>No source selected</h3>
            <p>Register source material to begin source-backed Knowledge Object manufacturing.</p>
          </article>
        )}
      </section>

      <section className="table-panel" aria-label="Source list">
        <div className="table-row table-head">
          <span>Source</span>
          <span>Category</span>
          <span>Domain</span>
          <span>Review</span>
          <span>Processing</span>
        </div>
        {sources.map((source) => (
          <div className={`table-row ${source.id === selectedSource?.id ? "row-selected" : ""}`} key={source.id}>
            <strong>
              <Link
                className="inline-link"
                href={`/sources?projectId=${source.projectId}&sourceId=${source.id}`}
              >
                {source.title}
              </Link>
            </strong>
            <span>{source.category}</span>
            <span>{source.domain}</span>
            <span className="pill">{source.reviewStatus}</span>
            <span>{source.processingStatus}</span>
          </div>
        ))}
        {sources.length === 0 ? (
          <div className="table-empty">
            <strong>No sources found</strong>
            <span>
              {selectedProject
                ? "This project has no registered sources yet."
                : "Register trusted material to begin source intake."}
            </span>
          </div>
        ) : null}
      </section>
    </>
  );
}
