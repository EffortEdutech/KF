import Link from "next/link";
import { lifecycleStates, missionStatuses, missionTypes, roles } from "@kf/core";
import { recentActivity, workspace } from "./studio-data";
import {
  getActiveProject,
  getPkaReleaseReadinessHints,
  getProjectGovernanceMetrics,
  listKnowledgeObjects,
  listProjects,
  listSources,
  releaseBlockerTypeFromHintId
} from "./workspace-store";

export default async function DashboardPage() {
  const projects = await listProjects();
  const sources = await listSources();
  const activeProject = await getActiveProject();
  const knowledgeObjects = await listKnowledgeObjects({ projectId: activeProject.id });
  const governanceMetrics = await getProjectGovernanceMetrics(activeProject.id);
  const releaseReadinessHints = await getPkaReleaseReadinessHints(activeProject.id);
  const releaseBlockers = releaseReadinessHints.filter((hint) => hint.level === "warning");
  const releaseIssueHref = (hintId: string) => {
    const knowledgeObject = knowledgeObjects.find((item) => hintId.startsWith(`${item.id}-`));
    const blockerType = releaseBlockerTypeFromHintId(hintId) ?? "all";

    return `/review?projectId=${activeProject.id}&queueStatus=all&blockerType=${blockerType}${
      knowledgeObject ? `&koId=${knowledgeObject.id}` : ""
    }`;
  };
  const metrics = [
    { href: "/projects", label: "Projects", value: projects.length.toString() },
    { href: "/sources", label: "Sources", value: sources.length.toString() },
    {
      href: `/review?projectId=${activeProject.id}`,
      label: "Review queue",
      value: governanceMetrics.underReviewCount.toString()
    },
    {
      href: `/pka-builder?projectId=${activeProject.id}&blockerType=all`,
      label: "Release blockers",
      value: governanceMetrics.releaseBlockerCount.toString()
    }
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
          <Link className="metric metric-link" href={metric.href} key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </Link>
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

      <section className="board board-two">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Review metrics</p>
              <h3>Governance workload</h3>
            </div>
            <Link className="text-link" href={`/review?projectId=${activeProject.id}`}>
              Open review
            </Link>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Under review</dt>
              <dd>
                <Link className="inline-link" href={`/review?projectId=${activeProject.id}&queueStatus=under_review`}>
                  {governanceMetrics.underReviewCount}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Changes requested</dt>
              <dd>
                <Link className="inline-link" href={`/review?projectId=${activeProject.id}&queueStatus=changes_requested&decision=changes_requested`}>
                  {governanceMetrics.changesRequestedCount}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Rejected</dt>
              <dd>
                <Link className="inline-link" href={`/review?projectId=${activeProject.id}&queueStatus=rejected&decision=rejected`}>
                  {governanceMetrics.rejectedCount}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Approved / release-grade</dt>
              <dd>
                <Link className="inline-link" href={`/review?projectId=${activeProject.id}&queueStatus=approved&decision=approved`}>
                  {governanceMetrics.approvedCount}
                </Link>
              </dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Release gate</p>
              <h3>PKA release-blocking checks</h3>
            </div>
            <Link className="text-link" href={`/pka-builder?projectId=${activeProject.id}&blockerType=all`}>
              PKA Builder
            </Link>
          </div>
          <div className="readiness-list" aria-label="PKA release-blocking governance checks">
            {releaseReadinessHints.slice(0, 5).map((hint) => (
              <Link
                className={`readiness-item readiness-${hint.level}`}
                href={releaseIssueHref(hint.id)}
                key={hint.id}
              >
                <strong>{hint.title}</strong>
                <span>{hint.detail}</span>
              </Link>
            ))}
            {releaseBlockers.length > 5 ? (
              <div className="readiness-item readiness-warning">
                <strong>{releaseBlockers.length - 5} more blocker(s)</strong>
                <span>Open Review for detailed KO-level governance checks.</span>
              </div>
            ) : null}
          </div>
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
