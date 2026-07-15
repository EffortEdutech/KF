import { sources } from "../studio-data";

const sourceCategories = [
  "standard",
  "SOP",
  "company_document",
  "expert_interview",
  "historical_case",
  "analytical_model",
  "template",
  "external_data_reference"
];

export default function SourcesPage() {
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
          <h3>Source intake placeholder</h3>
          <form className="source-form">
            <label>
              Title
              <input value="New QS source" readOnly />
            </label>
            <label>
              Category
              <select value="company_document" disabled>
                {sourceCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Usage policy
              <input value="Local development only" readOnly />
            </label>
            <button type="button">Register source</button>
          </form>
        </article>

        <article className="panel">
          <p className="eyebrow">Source detail</p>
          <h3>{selectedSource.title}</h3>
          <p>
            Source detail keeps provenance, usage policy, reliability, and Base PKA boundary
            visible before manufacturing begins.
          </p>
          <dl className="detail-list">
            <div>
              <dt>Source ID</dt>
              <dd>{selectedSource.id}</dd>
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
              <dt>Boundary</dt>
              <dd>{selectedSource.boundary}</dd>
            </div>
          </dl>
        </article>
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

