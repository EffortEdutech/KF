import {
  lifecycleStates,
  missionStatuses,
  missionTypes,
  roles
} from "@kf/core";

const navigation = [
  "Dashboard",
  "Mission Centre",
  "Sources",
  "Knowledge Objects",
  "Ontology",
  "Graph",
  "Pipeline",
  "Review",
  "PKA Builder",
  "AI Workbench",
  "Settings"
];

const metrics = [
  { label: "Sources", value: "0" },
  { label: "Knowledge Objects", value: "0" },
  { label: "Missions", value: "0" },
  { label: "Approved", value: "0" }
];

export default function StudioHomePage() {
  return (
    <main className="shell">
      <aside className="sidebar" aria-label="Studio navigation">
        <div>
          <p className="eyebrow">Knowledge Factory</p>
          <h1>Studio</h1>
        </div>
        <nav>
          {navigation.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`}>
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Standalone-first, LADOS-compatible</p>
            <h2>Operational control panel</h2>
          </div>
          <span className="status">Sprint 0 scaffold</span>
        </header>

        <section className="metrics" aria-label="Project metrics">
          {metrics.map((metric) => (
            <div className="metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </section>

        <section className="grid">
          <article className="panel" id="mission-centre">
            <p className="eyebrow">Mission Centre</p>
            <h3>Mission-backed work starts here</h3>
            <p>
              Project, source, pipeline, review, and packaging activity will be traceable as
              Missions from the first schema.
            </p>
            <dl>
              <div>
                <dt>Types</dt>
                <dd>{missionTypes.join(", ")}</dd>
              </div>
              <div>
                <dt>Statuses</dt>
                <dd>{missionStatuses.join(", ")}</dd>
              </div>
            </dl>
          </article>

          <article className="panel" id="review">
            <p className="eyebrow">Governance</p>
            <h3>Draft knowledge stays draft</h3>
            <p>
              The MVP lifecycle preserves provenance, human validation, publication, and
              deprecation without pretending AI output is approved knowledge.
            </p>
            <div className="tags">
              {lifecycleStates.map((state) => (
                <span key={state}>{state}</span>
              ))}
            </div>
          </article>

          <article className="panel" id="settings">
            <p className="eyebrow">Local Identity</p>
            <h3>Single workspace, role-aware shape</h3>
            <p>
              Sprint 0 uses a local identity stub while keeping ownership, reviewer,
              publisher, and audit fields ready for real authentication.
            </p>
            <div className="tags">
              {roles.map((role) => (
                <span key={role}>{role}</span>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
