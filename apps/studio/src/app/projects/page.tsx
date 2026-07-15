import { projects, workspace } from "../studio-data";
import { listSources } from "../source-store";

export default function ProjectsPage() {
  const sources = listSources();
  const activeProject = projects.find((project) => project.id === workspace.activeProjectId) ?? projects[0];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Projects</p>
          <h2>Workspace projects</h2>
          <p className="lede">
            Project context anchors sources, missions, Knowledge Objects, and future PKA exports.
          </p>
        </div>
        <span className="status">{projects.length} projects</span>
      </header>

      <section className="board board-two">
        <div className="stack">
          {projects.map((project) => (
            <article className="panel project-card" key={project.id}>
              <p className="eyebrow">{project.domain}</p>
              <h3>{project.name}</h3>
              <p>{project.objective}</p>
              <div className="card-meta">
                <span>{project.status}</span>
                <span>{sources.filter((source) => source.projectId === project.id).length} sources</span>
                <span>{project.readiness}</span>
              </div>
            </article>
          ))}
        </div>

        <article className="panel panel-strong">
          <p className="eyebrow">Project detail</p>
          <h3>{activeProject.name}</h3>
          <p>{activeProject.objective}</p>
          <dl className="detail-list">
            <div>
              <dt>Project ID</dt>
              <dd>{activeProject.id}</dd>
            </div>
            <div>
              <dt>Workspace</dt>
              <dd>{activeProject.workspace}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{activeProject.owner}</dd>
            </div>
            <div>
              <dt>Knowledge Objects</dt>
              <dd>{activeProject.knowledgeObjectCount}</dd>
            </div>
          </dl>
        </article>
      </section>
    </>
  );
}
