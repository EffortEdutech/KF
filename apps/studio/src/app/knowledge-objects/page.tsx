import Link from "next/link";
import { getProjectReadinessHints, listProjects, listSources } from "../workspace-store";

export default async function KnowledgeObjectsPage() {
  const projects = await listProjects();
  const sources = await listSources();
  const activeProject = projects[0];
  const activeProjectHints = activeProject ? await getProjectReadinessHints(activeProject) : [];
  const sourceBackedProjects = projects.filter((project) => project.sourceCount > 0).length;
  const knowledgeObjectCount = projects.reduce(
    (total, project) => total + project.knowledgeObjectCount,
    0
  );

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Knowledge Objects</p>
          <h2>Repository preparation</h2>
          <p className="lede">
            Sprint 2 will turn approved source material into governed Knowledge Object records with evidence,
            lifecycle status, relationships, and review history.
          </p>
        </div>
        <span className="status">Sprint 2 readying</span>
      </header>

      <section className="metrics" aria-label="Knowledge Object preparation metrics">
        <div className="metric">
          <span>Knowledge Objects</span>
          <strong>{knowledgeObjectCount}</strong>
        </div>
        <div className="metric">
          <span>Source-backed projects</span>
          <strong>{sourceBackedProjects}</strong>
        </div>
        <div className="metric">
          <span>Registered sources</span>
          <strong>{sources.length}</strong>
        </div>
        <div className="metric">
          <span>Draft repository</span>
          <strong>0</strong>
        </div>
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Sprint 2 entry gate</p>
          <h3>First repository slice</h3>
          <dl className="detail-list">
            <div>
              <dt>Data model</dt>
              <dd>Knowledge Object identity, type, status, version, confidence, and ownership metadata.</dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>Source evidence links before any object is considered release-ready.</dd>
            </div>
            <div>
              <dt>Governance</dt>
              <dd>Draft-first workflow using the canonical lifecycle states from the architecture baseline.</dd>
            </div>
          </dl>
          <div className="action-row">
            <Link className="text-link" href="/sources">
              Review sources
            </Link>
            <Link className="text-link" href="/projects">
              Review projects
            </Link>
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Readiness hints</p>
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
              <span>Create a project and register sources before the repository slice begins.</span>
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
        <div className="table-empty">
          <strong>No Knowledge Objects yet</strong>
          <span>
            This repository is intentionally empty until Sprint 2 adds the Knowledge Object model,
            source evidence links, manual creation, and lifecycle controls.
          </span>
        </div>
      </section>
    </>
  );
}
