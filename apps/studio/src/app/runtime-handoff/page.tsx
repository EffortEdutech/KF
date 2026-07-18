import Link from "next/link";
import {
  listPkaPackages,
  listProjects,
  validateRuntimeAppDeveloperHandoff
} from "../workspace-store";

type RuntimeHandoffPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    packageId?: string;
  }>;
};

function decisionLabel(decision: string) {
  return decision.replaceAll("_", " ");
}

export default async function RuntimeHandoffPage({ searchParams }: RuntimeHandoffPageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const activeProject = projects.find((project) => project.id === params?.projectId) ?? projects[0];
  const packages = activeProject ? await listPkaPackages(activeProject.id) : [];
  const selectedPackage =
    packages.find((pkaPackage) => pkaPackage.packageId === params?.packageId) ?? packages[0];
  const report = selectedPackage
    ? await validateRuntimeAppDeveloperHandoff(selectedPackage.packageId)
    : undefined;

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Runtime Boundary</p>
          <h2>Consuming App Handoff</h2>
          <p className="lede">
            Load the package handoff contract and classify installer readiness before AIFA, LADOS, or another runtime app consumes the PKA.
          </p>
        </div>
        <span className="status">{report ? decisionLabel(report.decision) : "no package"}</span>
      </header>

      <section className="filter-bar" aria-label="Runtime handoff project filters">
        {projects.map((project) => (
          <Link
            className={project.id === activeProject?.id ? "filter-chip active" : "filter-chip"}
            href={`/runtime-handoff?projectId=${project.id}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <section className="metrics" aria-label="Runtime handoff decision metrics">
        <div className="metric">
          <span>Decision</span>
          <strong>{report ? decisionLabel(report.decision) : "none"}</strong>
        </div>
        <div className="metric">
          <span>Blocked checks</span>
          <strong>{report?.blockedCount ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Review required</span>
          <strong>{report?.reviewRequiredCount ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Feedback prompts</span>
          <strong>{report?.feedbackQuestionCount ?? 0}</strong>
        </div>
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Selected package</p>
          <h3>{selectedPackage?.name ?? "No package assembled"}</h3>
          <dl className="detail-list">
            <div>
              <dt>Package ID</dt>
              <dd>{selectedPackage?.packageId ?? "not available"}</dd>
            </div>
            <div>
              <dt>Handoff path</dt>
              <dd>{report?.handoffPath ?? "runtime/app-developer-handoff.json"}</dd>
            </div>
            <div>
              <dt>Package status</dt>
              <dd>{selectedPackage?.status ?? "not available"}</dd>
            </div>
            <div>
              <dt>Audience</dt>
              <dd>{report?.audience.join(", ") || "not declared"}</dd>
            </div>
          </dl>
          <div className="action-row">
            <Link className="inline-link" href={`/pka-builder/export?projectId=${activeProject?.id ?? ""}&path=runtime%2Fapp-developer-handoff.json`}>
              Inspect handoff JSON
            </Link>
            <Link className="inline-link" href={`/runtime-import?projectId=${activeProject?.id ?? ""}`}>
              Runtime import checks
            </Link>
            <Link className="inline-link" href={`/pka-builder/readback?projectId=${activeProject?.id ?? ""}`}>
              Package readback
            </Link>
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Handoff summary</p>
          <h3>Runtime installer posture</h3>
          <p>{report?.summary ?? "No handoff summary is available yet."}</p>
          <div className="readiness-list" aria-label="Runtime handoff next developer slice">
            {report?.nextDeveloperSlice.map((step) => (
              <div className="readiness-item readiness-info" key={step}>
                <strong>Developer slice</strong>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Installer checks</p>
            <h3>Blocked vs review-required mapping</h3>
          </div>
          <span className="pill">{report?.items.length ?? 0} check(s)</span>
        </div>
        <div className="readiness-list" aria-label="Runtime handoff installer checks">
          {report?.items.map((item) => (
            <div
              className={`readiness-item ${
                item.decision === "pass"
                  ? "readiness-ready"
                  : item.decision === "blocked"
                    ? "readiness-blocked"
                    : "readiness-warning"
              }`}
              key={item.id}
            >
              <strong>{item.title}</strong>
              <span>{decisionLabel(item.decision)}</span>
              <span>{item.detail}</span>
            </div>
          ))}
          {!report ? (
            <div className="empty-state compact-empty">
              <strong>No handoff report</strong>
              <span>Publish a package with runtime/app-developer-handoff.json before running consuming-app checks.</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Relationship evidence</p>
          <h3>{report?.relationshipEvidencePolicy?.dedicatedTableStatus ?? "not declared"}</h3>
          <dl className="detail-list">
            <div>
              <dt>Current shape</dt>
              <dd>{report?.relationshipEvidencePolicy?.currentShape ?? "not declared"}</dd>
            </div>
            <div>
              <dt>Promote when</dt>
              <dd>{report?.relationshipEvidencePolicy?.promoteWhen.join("; ") || "not declared"}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">Pilot feedback</p>
          <h3>Evidence lifecycle questions</h3>
          <div className="readiness-list" aria-label="Runtime handoff relationship evidence feedback">
            {report?.feedbackQuestions.map((question) => (
              <div className="readiness-item readiness-info" key={question}>
                <strong>Feedback requested</strong>
                <span>{question}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
