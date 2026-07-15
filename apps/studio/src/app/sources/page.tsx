import { createSourceAction } from "../source-actions";
import { sourceCategories } from "../studio-data";
import { listProjects, listSources } from "../workspace-store";

export default function SourcesPage() {
  const projects = listProjects();
  const sources = listSources();
  const selectedSource = sources[0];

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
        <span className="status">{sources.length} registered</span>
      </header>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Manual registration</p>
          <h3>Source intake</h3>
          <form action={createSourceAction} className="source-form">
            <label className="field-wide">
              Project
              <select name="projectId" defaultValue={projects[0]?.id}>
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
                <dd>{selectedSource.projectId}</dd>
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
          </article>
        ) : null}
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
          <div className="table-row" key={source.id}>
            <strong>{source.title}</strong>
            <span>{source.category}</span>
            <span>{source.domain}</span>
            <span className="pill">{source.reviewStatus}</span>
            <span>{source.processingStatus}</span>
          </div>
        ))}
      </section>
    </>
  );
}
