import Link from "next/link";
import {
  getRuntimeQaAnswerReadinessReport,
  getRuntimeQaContextBundlePreview,
  getRuntimeQaFixtureEvaluationReport,
  listProjects
} from "../workspace-store";

type RuntimeQaPageProps = {
  searchParams?: Promise<{
    projectId?: string;
  }>;
};

export default async function RuntimeQaPage({ searchParams }: RuntimeQaPageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const requestedProject = projects.find((project) => project.id === params?.projectId);
  const activeProject = requestedProject ?? projects[0];
  const contextBundle = activeProject
    ? await getRuntimeQaContextBundlePreview(activeProject.id)
    : undefined;
  const answerReadinessReport = activeProject
    ? await getRuntimeQaAnswerReadinessReport(activeProject.id)
    : undefined;
  const fixtureEvaluationReport = activeProject
    ? await getRuntimeQaFixtureEvaluationReport(activeProject.id)
    : undefined;
  const runtimeReady = Boolean(contextBundle?.packageRecordId && contextBundle.knowledgeObjects.length > 0);

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Runtime Q&amp;A</p>
          <h2>Grounded Q&amp;A Harness Preparation</h2>
          <p className="lede">
            Prepare the deterministic context boundary for future grounded answers without calling an AI provider.
          </p>
        </div>
        <span className="status">{runtimeReady ? "context ready" : "preparation"}</span>
      </header>

      {params?.projectId && !requestedProject ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>Project filter not found</strong>
          <span>The requested project does not exist. Showing the first available project instead.</span>
        </section>
      ) : null}

      <section className="filter-bar" aria-label="Runtime Q&A project filters">
        {projects.map((project) => (
          <Link
            className={project.id === activeProject?.id ? "filter-chip active" : "filter-chip"}
            href={`/runtime-qa?projectId=${project.id}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <section className="metrics" aria-label="Runtime Q&A context metrics">
        <div className="metric">
          <span>Package status</span>
          <strong>{contextBundle?.packageStatus ?? "none"}</strong>
        </div>
        <div className="metric">
          <span>Approved KOs</span>
          <strong>{contextBundle?.knowledgeObjects.length ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Graph edges</span>
          <strong>{contextBundle?.relationships.length ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Model calls</span>
          <strong>0</strong>
        </div>
        <div className="metric">
          <span>Answer readiness</span>
          <strong>{answerReadinessReport?.ready ? "ready" : "blocked"}</strong>
        </div>
        <div className="metric">
          <span>Fixture evaluation</span>
          <strong>{fixtureEvaluationReport?.ready ? "ready" : "blocked"}</strong>
        </div>
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Harness boundary</p>
          <h3>{activeProject?.name ?? "No project selected"}</h3>
          <dl className="detail-list">
            <div>
              <dt>Allowed context</dt>
              <dd>Published PKA package metadata, approved Knowledge Objects, governed graph edges, and source citations.</dd>
            </div>
            <div>
              <dt>Blocked context</dt>
              <dd>Draft KOs, client vault state, runtime user data, and unapproved pipeline suggestions.</dd>
            </div>
            <div>
              <dt>AI provider</dt>
              <dd>Deferred. This harness prepares retrieval context only; Ollama remains unimplemented.</dd>
            </div>
            <div>
              <dt>Context bundle</dt>
              <dd>
                {contextBundle?.pka.packageId ?? "unpublished-package"} / v{contextBundle?.pka.version ?? "0.0.0"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">Readiness</p>
          <h3>Runtime answer gate</h3>
          <div className="readiness-list" aria-label="Runtime Q&A readiness checks">
            <div
              className={
                contextBundle?.packageRecordId ? "readiness-item readiness-ready" : "readiness-item readiness-warning"
              }
            >
              <strong>Published package required</strong>
              <span>{contextBundle?.packageRecordId ? "Published package available." : "Publish a package before runtime Q&A."}</span>
            </div>
            <div className={(contextBundle?.knowledgeObjects.length ?? 0) > 0 ? "readiness-item readiness-ready" : "readiness-item readiness-warning"}>
              <strong>Approved knowledge required</strong>
              <span>{contextBundle?.knowledgeObjects.length ?? 0} approved Knowledge Object(s) available.</span>
            </div>
            <div className={(contextBundle?.relationships.length ?? 0) > 0 ? "readiness-item readiness-ready" : "readiness-item readiness-info"}>
              <strong>Graph context</strong>
              <span>{contextBundle?.relationships.length ?? 0} relationship edge(s) available for future context traversal.</span>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Answer readiness report</p>
        <h3>{answerReadinessReport?.ready ? "Deterministic answer context ready" : "Deterministic answer context blocked"}</h3>
        <div className="summary-row">
          <span>{answerReadinessReport?.missingPublishedPackageCount ?? 0} missing published package</span>
          <span>{answerReadinessReport?.missingApprovedKnowledgeObjectCount ?? 0} missing approved KO</span>
          <span>{answerReadinessReport?.missingCitationCount ?? 0} missing citation</span>
          <span>{answerReadinessReport?.missingGovernedRelationshipCount ?? 0} missing governed relationship</span>
        </div>
        <div className="readiness-list" aria-label="Runtime Q&A answer readiness report">
          {answerReadinessReport?.items.map((item) => (
            <div className={`readiness-item readiness-${item.level}`} key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Context bundle preview</p>
          <h3>{contextBundle?.pka.name ?? "No published package"}</h3>
          <dl className="detail-list">
            <div>
              <dt>Governance mode</dt>
              <dd>{contextBundle?.governanceMode ?? "published_only"}</dd>
            </div>
            <div>
              <dt>Source evidence</dt>
              <dd>{contextBundle?.sourceEvidence.length ?? 0} citation candidate(s)</dd>
            </div>
            <div>
              <dt>Runtime instructions</dt>
              <dd>{contextBundle?.runtimeInstructions.length ?? 0} instruction(s)</dd>
            </div>
            <div>
              <dt>Limitations</dt>
              <dd>{contextBundle?.limitations.join(" ") ?? "No context bundle available yet."}</dd>
            </div>
          </dl>
          <div className="readiness-list" aria-label="Runtime Q&A context bundle instructions">
            {contextBundle?.runtimeInstructions.map((instruction) => (
              <div className="readiness-item readiness-info" key={instruction}>
                <strong>{instruction}</strong>
                <span>Deterministic harness instruction</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Fixture questions</p>
          <h3>Citation requirements</h3>
          <div className="readiness-list" aria-label="Runtime Q&A fixture questions">
            {contextBundle?.fixtureQuestions.map((fixture) => (
              <div className="readiness-item readiness-info" key={fixture.id}>
                <strong>{fixture.question}</strong>
                <span>{fixture.expectedCitationRequirement}</span>
                <span>{fixture.requiredContextTypes.join(", ")}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Deterministic Q&amp;A demo</p>
        <h3>{fixtureEvaluationReport?.ready ? "Fixture answers ready" : "Fixture answers blocked"}</h3>
        <div className="readiness-list" aria-label="Runtime Q&A fixture evaluation report">
          {fixtureEvaluationReport?.evaluations.map((evaluation) => (
            <div
              className={`readiness-item ${
                evaluation.status === "ready" ? "readiness-ready" : "readiness-warning"
              }`}
              key={evaluation.id}
            >
              <strong>{evaluation.question}</strong>
              <span>{evaluation.deterministicAnswer}</span>
              <span>
                Required: {evaluation.requiredContextTypes.join(", ")}
                {evaluation.missingContextTypes.length > 0
                  ? ` / missing: ${evaluation.missingContextTypes.join(", ")}`
                  : " / all required context present"}
              </span>
              <span>
                Citations: {evaluation.citedKnowledgeObjectTitles.join(", ") || "none"} /{" "}
                {evaluation.citedSourceEvidence.join(", ") || "no source evidence"} /{" "}
                {evaluation.citedRelationshipCount} relationship(s)
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="board" aria-label="Runtime Q&A approved context preview">
        {(contextBundle?.knowledgeObjects.length ?? 0) > 0 ? (
          contextBundle?.knowledgeObjects.slice(0, 6).map((knowledgeObject) => (
            <article className="panel" key={knowledgeObject.id}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{knowledgeObject.type}</p>
                  <h3>{knowledgeObject.title}</h3>
                </div>
                <span className="pill">{knowledgeObject.status}</span>
              </div>
              <p>{knowledgeObject.summary}</p>
              <dl className="detail-list">
                <div>
                  <dt>Source refs</dt>
                  <dd>{knowledgeObject.sourceRefs.length}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{knowledgeObject.confidence ?? "not set"}</dd>
                </div>
              </dl>
            </article>
          ))
        ) : (
          <article className="panel empty-state">
            <p className="eyebrow">Context preview</p>
            <h3>No approved context yet</h3>
            <p>Approve Knowledge Objects and publish a package before enabling grounded Q&amp;A.</p>
          </article>
        )}
      </section>
    </>
  );
}
