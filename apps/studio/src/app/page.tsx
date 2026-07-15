import Link from "next/link";
import { lifecycleStates, missionStatuses, missionTypes, roles } from "@kf/core";
import { recentActivity, workspace } from "./studio-data";
import { getActiveProject, listMissions, listProjects, listSources } from "./workspace-store";

export default async function DashboardPage() {
  const projects = await listProjects();
  const sources = await listSources();
  const missions = await listMissions();
  const activeProject = await getActiveProject();
  const metrics = [
    { label: "Projects", value: projects.length.toString() },
    { label: "Sources", value: sources.length.toString() },
    { label: "Missions", value: missions.length.toString() },
    { label: "Approved KOs", value: "0" }
  ];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Sprint 1 - Core Workspace</p>
          <h2>Dashboard</h2>
          <p className="lede">
            The first operating surface for projects, sources, missions, and readiness.
          </p>
        </div>
        <span className="status">Workspace: {workspace.workspace}</span>
      </header>

      <section className="metrics" aria-label="Workspace metrics">
        {metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Active project</p>
              <h3>{activeProject.name}</h3>
            </div>
            <Link className="text-link" href="/projects">
              Open projects
            </Link>
          </div>
          <p>
            Sprint 1 begins with workspace visibility and source management before
            pipeline extraction or Knowledge Object approval.
          </p>
          <div className="summary-row">
            <span>Organisation</span>
            <strong>{workspace.organisation}</strong>
          </div>
          <div className="summary-row">
            <span>Owner role</span>
            <strong>{activeProject.owner}</strong>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h3>Development trace</h3>
            </div>
            <Link className="text-link" href="/missions">
              Mission Centre
            </Link>
          </div>
          <ul className="activity-list">
            {recentActivity.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="board board-three">
        <article className="panel" id="mission-centre">
          <p className="eyebrow">Mission model</p>
          <h3>Mission-backed work</h3>
          <p>
            Project, source, pipeline, review, and packaging activity remains traceable.
          </p>
          <dl className="compact-list">
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
            Lifecycle states preserve provenance, validation, publication, and deprecation.
          </p>
          <div className="tags">
            {lifecycleStates.map((state) => (
              <span key={state}>{state}</span>
            ))}
          </div>
        </article>

        <article className="panel" id="settings">
          <p className="eyebrow">Local identity</p>
          <h3>Role-aware shape</h3>
          <p>
            Sprint 1 keeps local identity simple while preserving ownership and review fields.
          </p>
          <div className="tags">
            {roles.map((role) => (
              <span key={role}>{role}</span>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
