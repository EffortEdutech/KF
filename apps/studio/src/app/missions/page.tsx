import { missionStatuses, missionTypes } from "@kf/core";
import { createMissionAction, updateMissionStatusAction } from "../source-actions";
import { listMissions, listProjects } from "../workspace-store";

export default async function MissionsPage() {
  const missions = await listMissions();
  const projects = await listProjects();
  const runningCount = missions.filter((mission) => mission.status === "running").length;
  const queueCount = missions.filter((mission) => ["created", "queued", "assigned", "ready"].includes(mission.status)).length;

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Mission Centre</p>
          <h2>Mission-backed activity</h2>
          <p className="lede">
            Operational traces for reusable manufacturing work orders, source preparation, governance, validation, and packaging.
          </p>
        </div>
        <span className="status">{missions.length} missions</span>
      </header>

      <section className="metrics" aria-label="Mission metrics">
        <div className="metric">
          <span>Total missions</span>
          <strong>{missions.length}</strong>
        </div>
        <div className="metric">
          <span>Queue</span>
          <strong>{queueCount}</strong>
        </div>
        <div className="metric">
          <span>Running</span>
          <strong>{runningCount}</strong>
        </div>
        <div className="metric">
          <span>Completed</span>
          <strong>{missions.filter((mission) => mission.status === "completed").length}</strong>
        </div>
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Manual mission</p>
          <h3>Create operational trace</h3>
          {projects.length > 0 ? (
            <form action={createMissionAction} className="source-form">
              <label className="field-wide">
                Title
                <input name="title" defaultValue="Review registered source readiness" required />
              </label>
              <label>
                Type
                <select name="type" defaultValue="validation">
                  {missionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select name="status" defaultValue="queued">
                  {missionStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Project
                <select name="projectId" defaultValue={projects[0]?.id}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Assigned to
                <input name="assignedTo" defaultValue="reviewer" required />
              </label>
              <label>
                Stage
                <input name="stage" defaultValue="review" required />
              </label>
              <label>
                Priority
                <select name="priority" defaultValue="normal">
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                </select>
              </label>
              <button type="submit">Create mission</button>
            </form>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No project anchor available</strong>
              <span>Create a project before adding manual mission traces.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Operational boundary</p>
          <h3>Trace before automation</h3>
          <p>
            Missions keep work-order ownership, queue state, and human accountability visible before deeper workflow automation.
          </p>
          <dl className="detail-list">
            <div>
              <dt>Automatic traces</dt>
              <dd>Project creation, source registration, pipeline jobs, package decisions, and work-order checkpoints</dd>
            </div>
            <div>
              <dt>Manual traces</dt>
              <dd>Review, validation, preparation, remediation, packaging, and runtime handoff work</dd>
            </div>
            <div>
              <dt>Persistence</dt>
              <dd>Prisma-backed when `DATABASE_URL` is configured, with local in-memory fallback</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="table-panel" aria-label="Mission list">
        <div className="table-row mission-row table-head">
          <span>Mission</span>
          <span>Type</span>
          <span>Status</span>
          <span>Assigned</span>
          <span>Stage</span>
          <span>Control</span>
        </div>
        {missions.map((mission) => (
          <div className="table-row mission-row" key={mission.id}>
            <strong>{mission.title}</strong>
            <span>{mission.type}</span>
            <span className="pill">{mission.status}</span>
            <span>{mission.assignedTo}</span>
            <span>{mission.stage}</span>
            <form action={updateMissionStatusAction} className="inline-form">
              <input type="hidden" name="missionId" value={mission.id} />
              <select
                key={`${mission.id}-${mission.status}`}
                name="status"
                defaultValue={mission.status}
                aria-label={`Status for ${mission.title}`}
              >
                {missionStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button type="submit">Update</button>
            </form>
          </div>
        ))}
        {missions.length === 0 ? (
          <div className="table-empty">
            <strong>No missions yet</strong>
            <span>Create a project, register a source, or add a manual mission to start the operational queue.</span>
          </div>
        ) : null}
      </section>
    </>
  );
}
