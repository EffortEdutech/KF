import Link from "next/link";
import {
  recordRfqWorkflowGateActionAction,
  updateRfqWorkflowGateActionAction
} from "../source-actions";
import {
  getQsRfqPilotSourcePack,
  getRfqWorkflowGateReport,
  listGovernanceHistory,
  listProjects,
  listRfqEvidenceRegisterEntries,
  listRfqWorkflowGateActions
} from "../workspace-store";

const rfqWorkflowGates = ["all", "prepare", "review", "approve_issue", "clarify", "receive_compare"] as const;
const rfqWorkflowActionStatuses = ["all", "open", "in_progress", "resolved", "blocked"] as const;
const rfqWorkflowDueStates = ["all", "overdue", "due_today", "due_future", "no_due_date", "closed"] as const;

type RfqWorkflowPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    gate?: string;
    status?: string;
    dueState?: string;
    owner?: string;
    actionId?: string;
  }>;
};

function workflowHref(input: { projectId?: string; gate?: string; status?: string; dueState?: string; owner?: string; actionId?: string }) {
  const params = new URLSearchParams();
  if (input.projectId) {
    params.set("projectId", input.projectId);
  }
  if (input.gate && input.gate !== "all") {
    params.set("gate", input.gate);
  }
  if (input.status && input.status !== "all") {
    params.set("status", input.status);
  }
  if (input.dueState && input.dueState !== "all") {
    params.set("dueState", input.dueState);
  }
  if (input.owner) {
    params.set("owner", input.owner);
  }
  if (input.actionId) {
    params.set("actionId", input.actionId);
  }

  return `/rfq-workflow?${params.toString()}`;
}

function actionAgeLabel(action: { dueState: string; dueInDays?: number; overdueDays?: number; ageDays: number }) {
  if (action.dueState === "closed") {
    return `Closed / aged ${action.ageDays} day(s)`;
  }
  if (action.dueState === "overdue") {
    return `Overdue by ${action.overdueDays ?? 0} day(s) / aged ${action.ageDays} day(s)`;
  }
  if (action.dueState === "due_today") {
    return `Due today / aged ${action.ageDays} day(s)`;
  }
  if (action.dueState === "due_future") {
    return `Due in ${action.dueInDays ?? 0} day(s) / aged ${action.ageDays} day(s)`;
  }

  return `No due date / aged ${action.ageDays} day(s)`;
}

export default async function RfqWorkflowPage({ searchParams }: RfqWorkflowPageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const pilotSourcePack = getQsRfqPilotSourcePack();
  const activeProject = projects.find((project) => project.id === params?.projectId) ?? projects.find((project) => project.id === pilotSourcePack.projectId) ?? projects[0];
  const selectedGate = rfqWorkflowGates.includes(params?.gate as (typeof rfqWorkflowGates)[number])
    ? (params?.gate as (typeof rfqWorkflowGates)[number])
    : "all";
  const selectedStatus = rfqWorkflowActionStatuses.includes(params?.status as (typeof rfqWorkflowActionStatuses)[number])
    ? (params?.status as (typeof rfqWorkflowActionStatuses)[number])
    : "all";
  const selectedDueState = rfqWorkflowDueStates.includes(params?.dueState as (typeof rfqWorkflowDueStates)[number])
    ? (params?.dueState as (typeof rfqWorkflowDueStates)[number])
    : "all";
  const selectedOwner = params?.owner?.trim() ?? "";
  const selectedActionId = params?.actionId?.trim() ?? "";
  const gateReport = await getRfqWorkflowGateReport(activeProject.id);
  const evidenceEntries = await listRfqEvidenceRegisterEntries({ projectId: activeProject.id });
  const allProjectActions = await listRfqWorkflowGateActions({ projectId: activeProject.id });
  const actions = await listRfqWorkflowGateActions({
    projectId: activeProject.id,
    gate: selectedGate,
    status: selectedStatus,
    dueState: selectedDueState,
    owner: selectedOwner
  });
  const actionMetrics = {
    open: allProjectActions.filter((action) => action.status === "open").length,
    inProgress: allProjectActions.filter((action) => action.status === "in_progress").length,
    blocked: allProjectActions.filter((action) => action.status === "blocked").length,
    resolved: allProjectActions.filter((action) => action.status === "resolved").length,
    overdue: allProjectActions.filter((action) => action.dueState === "overdue").length,
    dueToday: allProjectActions.filter((action) => action.dueState === "due_today").length
  };
  const selectedAction = allProjectActions.find((action) => action.id === selectedActionId);
  const selectedActionHistory = selectedAction
    ? await listGovernanceHistory({ subjectId: selectedAction.id, limit: 20 })
    : [];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">QS/RFQ</p>
          <h2>RFQ Workflow</h2>
          <p className="lede">
            Manage RFQ gate readiness, remediation ownership, due dates, and linked evidence register items.
          </p>
        </div>
        <Link className="text-link" href={`/pipeline?projectId=${activeProject.id}`}>
          Open Pipeline
        </Link>
      </header>

      <section className="filter-bar" aria-label="RFQ workflow project filters">
        {projects.map((project) => (
          <Link
            className={project.id === activeProject.id ? "filter-chip active" : "filter-chip"}
            href={workflowHref({ projectId: project.id, gate: selectedGate, status: selectedStatus, dueState: selectedDueState, owner: selectedOwner })}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <section className="metrics" aria-label="RFQ workflow action metrics">
        <div className="metric">
          <span>Open</span>
          <strong>{actionMetrics.open}</strong>
        </div>
        <div className="metric">
          <span>In progress</span>
          <strong>{actionMetrics.inProgress}</strong>
        </div>
        <div className="metric">
          <span>Blocked</span>
          <strong>{actionMetrics.blocked}</strong>
        </div>
        <div className="metric">
          <span>Overdue</span>
          <strong>{actionMetrics.overdue}</strong>
        </div>
        <div className="metric">
          <span>Due today</span>
          <strong>{actionMetrics.dueToday}</strong>
        </div>
        <div className="metric">
          <span>Resolved</span>
          <strong>{actionMetrics.resolved}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Gate readiness</p>
            <h3>{gateReport.ready ? "All RFQ gates ready" : "RFQ gates need follow-up"}</h3>
          </div>
          <span className="pill">{gateReport.ready ? "ready" : "active"}</span>
        </div>
        <div className="readiness-list" aria-label="RFQ workflow gate readiness">
          {gateReport.gates.map((gate) => (
            <div
              className={`readiness-item ${
                gate.status === "ready"
                  ? "readiness-ready"
                  : gate.status === "warning"
                    ? "readiness-warning"
                    : "readiness-blocked"
              }`}
              key={gate.gate}
            >
              <strong>{gate.title}</strong>
              <span>{gate.detail}</span>
              <span>
                {gate.activeEntryCount} active evidence item(s), {gate.acceptedEntryCount} accepted,{" "}
                {gate.clarificationRequiredCount} clarification required
              </span>
              {gate.followUp ? (
                <span>
                  Latest follow-up: {gate.followUp.status.replaceAll("_", " ")} / {gate.followUp.owner}
                  {gate.followUp.dueDate ? ` / due ${gate.followUp.dueDate}` : ""}
                </span>
              ) : (
                <span>No follow-up recorded.</span>
              )}
              <form className="source-form compact-form" action={recordRfqWorkflowGateActionAction}>
                <input type="hidden" name="projectId" value={activeProject.id} />
                <input type="hidden" name="gate" value={gate.gate} />
                <input type="hidden" name="actor" value="reviewer" />
                <label>
                  Remediation
                  <select name="actionType" defaultValue={gate.missingEvidenceCount > 0 ? "attach_missing_evidence" : "request_clarification"}>
                    <option value="attach_missing_evidence">Attach missing evidence</option>
                    <option value="request_clarification">Request clarification</option>
                    <option value="resolve_commercial_exception">Resolve commercial exception</option>
                  </select>
                </label>
                <label>
                  Owner
                  <input name="owner" defaultValue={gate.followUp?.owner ?? "knowledge_engineer"} />
                </label>
                <label>
                  Due date
                  <input name="dueDate" type="date" defaultValue={gate.followUp?.dueDate} />
                </label>
                <label>
                  Status
                  <select name="status" defaultValue="open">
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </label>
                <label className="field-wide">
                  Notes
                  <textarea name="notes" defaultValue={gate.remediationPrompts[0] ?? `Confirm ${gate.title.toLowerCase()} readiness.`} />
                </label>
                {gate.entries.length > 0 ? (
                  <fieldset className="field-wide checkbox-stack">
                    <legend>Linked evidence entries</legend>
                    {gate.entries.map((entry) => (
                      <label key={entry.id}>
                        <input type="checkbox" name="evidenceEntryIds" value={entry.id} defaultChecked={entry.status !== "accepted"} />
                        <span>
                          {entry.registerCode} / {entry.category.replaceAll("_", " ")} / {entry.status.replaceAll("_", " ")}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                ) : null}
                <button type="submit">Record gate action</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Action history</p>
            <h3>Gate follow-up records</h3>
          </div>
          <span className="pill">{actions.length} action(s)</span>
        </div>
        <form className="source-form compact-form" action="/rfq-workflow" aria-label="RFQ workflow action filters">
          <input type="hidden" name="projectId" value={activeProject.id} />
          <label>
            Gate
            <select name="gate" defaultValue={selectedGate}>
              {rfqWorkflowGates.map((gate) => (
                <option key={gate} value={gate}>
                  {gate.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select name="status" defaultValue={selectedStatus}>
              {rfqWorkflowActionStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due state
            <select name="dueState" defaultValue={selectedDueState}>
              {rfqWorkflowDueStates.map((dueState) => (
                <option key={dueState} value={dueState}>
                  {dueState.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Owner
            <input name="owner" defaultValue={selectedOwner} placeholder="knowledge_engineer" />
          </label>
          <button type="submit">Filter actions</button>
        </form>
        <div className="readiness-list" aria-label="RFQ workflow action history">
          {actions.length > 0 ? (
            actions.map((action) => (
              <div className="readiness-item readiness-info" key={action.id}>
                <strong>
                  {action.gate.replaceAll("_", " ")} / {action.actionType.replaceAll("_", " ")}
                </strong>
                <span>
                  {action.status.replaceAll("_", " ")} / owner {action.owner}
                  {action.dueDate ? ` / due ${action.dueDate}` : ""}
                </span>
                <span>{actionAgeLabel(action)}</span>
                <span>
                  Linked evidence: {action.evidenceEntryIds.length > 0 ? `${action.evidenceEntryIds.length} item(s)` : "none"}
                </span>
                {action.notes ? <span>{action.notes}</span> : null}
                <Link
                  className="text-link"
                  href={workflowHref({
                    projectId: activeProject.id,
                    gate: selectedGate,
                    status: selectedStatus,
                    dueState: selectedDueState,
                    owner: selectedOwner,
                    actionId: action.id
                  })}
                >
                  Inspect audit history
                </Link>
                <form className="source-form compact-form" action={updateRfqWorkflowGateActionAction}>
                  <input type="hidden" name="actionId" value={action.id} />
                  <input type="hidden" name="actor" value="reviewer" />
                  <label>
                    Owner
                    <input name="owner" defaultValue={action.owner} />
                  </label>
                  <label>
                    Due date
                    <input name="dueDate" type="date" defaultValue={action.dueDate} />
                  </label>
                  <label>
                    Status
                    <select name="status" defaultValue={action.status}>
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </label>
                  <label className="field-wide">
                    Update notes
                    <textarea name="notes" defaultValue={action.notes ?? "Update RFQ workflow gate follow-up."} />
                  </label>
                  <fieldset className="field-wide checkbox-stack">
                    <legend>Linked evidence entries</legend>
                    {evidenceEntries
                      .filter((entry) => entry.workflowGate === action.gate)
                      .map((entry) => (
                        <label key={entry.id}>
                          <input
                            type="checkbox"
                            name="evidenceEntryIds"
                            value={entry.id}
                            defaultChecked={action.evidenceEntryIds.includes(entry.id)}
                          />
                          <span>{entry.registerCode} / {entry.status.replaceAll("_", " ")}</span>
                        </label>
                      ))}
                  </fieldset>
                  <div className="action-row">
                    <button type="submit">Update gate action</button>
                    <button type="submit" name="status" value="resolved">
                      Close action
                    </button>
                  </div>
                </form>
              </div>
            ))
          ) : (
            <div className="empty-state compact-empty">
              <strong>No RFQ workflow actions</strong>
              <span>Record a gate action from readiness above or relax filters.</span>
            </div>
          )}
        </div>
      </section>

      <section className="panel" aria-label="RFQ workflow action audit history">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Action audit</p>
            <h3>{selectedAction ? "Selected gate action history" : "Select an action"}</h3>
          </div>
          <span className="pill">{selectedActionHistory.length} event(s)</span>
        </div>
        {selectedAction ? (
          <div className="readiness-list">
            <div className="readiness-item readiness-info">
              <strong>
                {selectedAction.gate.replaceAll("_", " ")} / {selectedAction.actionType.replaceAll("_", " ")}
              </strong>
              <span>
                {selectedAction.status.replaceAll("_", " ")} / owner {selectedAction.owner}
                {selectedAction.dueDate ? ` / due ${selectedAction.dueDate}` : ""}
              </span>
              <span>{actionAgeLabel(selectedAction)}</span>
            </div>
            {selectedActionHistory.length > 0 ? (
              selectedActionHistory.map((event) => (
                <div className="readiness-item readiness-info" key={event.id}>
                  <strong>{event.action}</strong>
                  <span>{event.detail}</span>
                  <span>
                    {event.actorId ?? "system"} / {event.createdAt}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state compact-empty">
                <strong>No audit events found</strong>
                <span>This action has no recorded governance event yet.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <strong>No action selected</strong>
            <span>Use Inspect audit history on an RFQ workflow action to review its governance trail.</span>
          </div>
        )}
      </section>
    </>
  );
}
