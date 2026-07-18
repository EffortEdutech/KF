import Link from "next/link";
import {
  createRuntimeHandoffReadbackFixturesAction,
  recordRuntimeHandoffFeedbackAction
} from "../source-actions";
import {
  listPersistedPkaExportFiles,
  listPkaPackages,
  listProjects,
  listRuntimeHandoffFeedback,
  runtimeHandoffFixturePaths,
  validateRuntimeAppDeveloperHandoff
} from "../workspace-store";

type RuntimeHandoffPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    packageId?: string;
    handoffPath?: string;
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
  const persistedFiles = selectedPackage ? await listPersistedPkaExportFiles(selectedPackage.packageId) : [];
  const handoffPath = params?.handoffPath ?? "runtime/app-developer-handoff.json";
  const report = selectedPackage
    ? await validateRuntimeAppDeveloperHandoff(selectedPackage.packageId, handoffPath)
    : undefined;
  const feedbackSummary = selectedPackage
    ? await listRuntimeHandoffFeedback(selectedPackage.packageId)
    : undefined;
  const fixtureFiles = Object.entries(runtimeHandoffFixturePaths).filter(([, path]) =>
    persistedFiles.some((file) => file.path === path)
  );

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
        <div className="metric">
          <span>Recorded feedback</span>
          <strong>{feedbackSummary?.totalFeedbackCount ?? 0}</strong>
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
          <p className="eyebrow">Fixture cases</p>
          <h3>Negative handoff readback</h3>
          {selectedPackage ? (
            <form action={createRuntimeHandoffReadbackFixturesAction} className="source-form compact-form">
              <input type="hidden" name="packageId" value={selectedPackage.packageId} />
              <button type="submit">Create handoff fixtures</button>
            </form>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No package available</strong>
              <span>Publish a package before creating handoff fixtures.</span>
            </div>
          )}
          <div className="tags" aria-label="Runtime handoff fixture selectors">
            {selectedPackage && activeProject ? (
              <Link
                className="pill"
                href={`/runtime-handoff?projectId=${activeProject.id}&packageId=${selectedPackage.packageId}`}
              >
                Valid handoff
              </Link>
            ) : null}
            {fixtureFiles.map(([kind, path]) =>
              selectedPackage && activeProject ? (
                <Link
                  className="pill"
                  href={`/runtime-handoff?projectId=${activeProject.id}&packageId=${selectedPackage.packageId}&handoffPath=${encodeURIComponent(path)}`}
                  key={kind}
                >
                  {kind.replaceAll("_", " ")}
                </Link>
              ) : null
            )}
            {fixtureFiles.length === 0 ? <span className="pill">No fixtures yet</span> : null}
          </div>
        </article>
      </section>

      <section className="panel">
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

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">App-developer review</p>
          <h3>Record handoff feedback</h3>
          {selectedPackage ? (
            <form action={recordRuntimeHandoffFeedbackAction} className="source-form">
              <input type="hidden" name="packageId" value={selectedPackage.packageId} />
              <label>
                Runtime app
                <input name="runtimeApp" defaultValue="LADOS pilot consumer" />
              </label>
              <label>
                Feedback decision
                <select name="decision" defaultValue="provenance_ok_for_pilot">
                  <option value="provenance_ok_for_pilot">Provenance is OK for pilot</option>
                  <option value="needs_multi_source_lifecycle">Needs multi-source relationship evidence lifecycle</option>
                  <option value="needs_installation_review_records">Needs persisted app-developer review records</option>
                </select>
              </label>
              <label>
                Notes
                <textarea
                  name="notes"
                  defaultValue="Pilot consumer can read relationship evidence from graph provenance for this QS/RFQ handoff."
                />
              </label>
              <input type="hidden" name="actor" value="runtime_consumer" />
              <button type="submit">Record handoff feedback</button>
            </form>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No package selected</strong>
              <span>Publish a package before recording consuming-app feedback.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Decision posture</p>
          <h3>{feedbackSummary?.relationshipEvidenceDecision.replaceAll("_", " ") ?? "awaiting feedback"}</h3>
          <dl className="detail-list" aria-label="Runtime handoff feedback summary">
            <div>
              <dt>Relationship evidence decision</dt>
              <dd>
                {feedbackSummary?.relationshipEvidenceDecision.replaceAll("_", " ") ??
                  "keep provenance for pilot"}
              </dd>
            </div>
            <div>
              <dt>Provenance OK</dt>
              <dd>{feedbackSummary?.provenanceOkCount ?? 0}</dd>
            </div>
            <div>
              <dt>Multi-source lifecycle requested</dt>
              <dd>
                {feedbackSummary?.multiSourceLifecycleRequestCount ?? 0} /{" "}
                {feedbackSummary?.multiSourceLifecycleThreshold ?? 2}
              </dd>
            </div>
            <div>
              <dt>Repeated lifecycle signal</dt>
              <dd>{feedbackSummary?.repeatedMultiSourceLifecycleFeedback ? "yes" : "no"}</dd>
            </div>
            <div>
              <dt>Review record request</dt>
              <dd>{feedbackSummary?.installationReviewRecordRequestCount ?? 0}</dd>
            </div>
            <div>
              <dt>Feedback persistence</dt>
              <dd>
                {feedbackSummary?.handoffFeedbackPersistenceDecision.replaceAll("_", " ") ??
                  "audit backed records for pilot"}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Recorded feedback</p>
            <h3>Consuming-app review history</h3>
          </div>
          <span className="pill">{feedbackSummary?.totalFeedbackCount ?? 0} record(s)</span>
        </div>
        <div className="readiness-list" aria-label="Runtime handoff feedback history">
          {feedbackSummary?.items.map((item) => (
            <div className="readiness-item readiness-info" key={item.id}>
              <strong>{item.runtimeApp}</strong>
              <span>{item.decision.replaceAll("_", " ")}</span>
              <span>{item.notes || "No notes recorded."}</span>
            </div>
          ))}
          {feedbackSummary?.items.length === 0 ? (
            <div className="empty-state compact-empty">
              <strong>No feedback recorded</strong>
              <span>Record pilot consumer feedback before deciding whether relationship evidence needs a table.</span>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
