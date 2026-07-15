import Link from "next/link";
import { createProjectAction } from "../source-actions";
import {
  getActiveProject,
  getProjectReadinessHints,
  getProjectSourceCount,
  listProjects,
  listSourcesByProject
} from "../workspace-store";

type ProjectsPageProps = {
  searchParams?: Promise<{
    projectId?: string;
  }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const requestedProject = projects.find((project) => project.id === params?.projectId);
  const activeProject = requestedProject ?? (await getActiveProject());
  const activeProjectSources = activeProject ? await listSourcesByProject(activeProject.id) : [];
  const activeProjectHints = activeProject ? await getProjectReadinessHints(activeProject) : [];
  const projectSourceCounts = new Map(
    await Promise.all(
      projects.map(async (project) => [project.id, await getProjectSourceCount(project.id)] as const)
    )
  );

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

      {params?.projectId && !requestedProject ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>Project not found</strong>
          <span>The requested project ID does not exist in this workspace. Showing the active project instead.</span>
        </section>
      ) : null}

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Project creation</p>
          <h3>New workspace project</h3>
          <form action={createProjectAction} className="source-form">
            <label className="field-wide">
              Name
              <input name="name" defaultValue="New PKA project" required />
            </label>
            <label>
              Domain
              <input name="domain" defaultValue="Quantity Surveying" required />
            </label>
            <label>
              Owner
              <input name="owner" defaultValue="knowledge_architect" required />
            </label>
            <label className="field-wide">
              Objective
              <textarea
                name="objective"
                defaultValue="Create a governed source-to-PKA workspace for a focused professional knowledge product."
                required
              />
            </label>
            <button type="submit">Create project</button>
          </form>
        </article>

        {activeProject ? (
          <article className="panel">
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
              <div>
                <dt>Sources</dt>
                <dd>{activeProjectSources.length}</dd>
              </div>
            </dl>
            <div className="readiness-list" aria-label="Project readiness hints">
              {activeProjectHints.map((hint) => (
                <div className={`readiness-item readiness-${hint.level}`} key={hint.id}>
                  <strong>{hint.title}</strong>
                  <span>{hint.detail}</span>
                </div>
              ))}
            </div>
            <div className="action-row">
              <Link className="text-link" href={`/sources?projectId=${activeProject.id}`}>
                View project sources
              </Link>
            </div>
          </article>
        ) : (
          <article className="panel empty-state">
            <p className="eyebrow">Project detail</p>
            <h3>No project selected</h3>
            <p>Create a workspace project to anchor source registration and Sprint 2 Knowledge Objects.</p>
          </article>
        )}
      </section>

      <section className="board">
        {projects.length > 0 ? (
          <div className="stack">
            {projects.map((project) => (
              <article
                className={`panel project-card ${project.id === activeProject?.id ? "panel-selected" : ""}`}
                key={project.id}
              >
                <p className="eyebrow">{project.domain}</p>
                <h3>{project.name}</h3>
                <p>{project.objective}</p>
                <div className="action-row">
                  <Link className="text-link" href={`/projects?projectId=${project.id}`}>
                    Open detail
                  </Link>
                  <Link className="text-link" href={`/sources?projectId=${project.id}`}>
                    Sources
                  </Link>
                </div>
                <div className="card-meta">
                  <span>{project.status}</span>
                  <span>{projectSourceCounts.get(project.id) ?? 0} sources</span>
                  <span>{project.readiness}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="panel empty-state">
            <p className="eyebrow">Project list</p>
            <h3>No projects yet</h3>
            <p>Create the first project to start source intake and Mission-backed manufacturing work.</p>
          </article>
        )}
      </section>
    </>
  );
}
