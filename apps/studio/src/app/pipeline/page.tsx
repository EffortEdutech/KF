import Link from "next/link";
import {
  acceptKnowledgeSuggestionAction,
  acceptRelationshipSuggestionAction,
  createFailedIngestionFixtureAction,
  repairSourceArtifactAction,
  recordRfqWorkflowGateActionAction,
  retrySourceIngestionAction,
  runQsRfqPilotVerticalSliceAction,
  runSourceIngestionAction,
  updateKnowledgeSuggestionStatusAction,
  updateRelationshipSuggestionStatusAction,
  updateRfqEvidenceRegisterStatusAction
} from "../source-actions";
import { rfqEvidenceCategories, rfqEvidenceStatuses } from "../studio-data";
import {
  getPipelineQualityMetrics,
  getPipelineSourceCoverageReport,
  getPipelineSuggestionReviewReport,
  getRfqEvidenceRegisterReport,
  getQsRfqPilotRunReport,
  getQsRfqPilotSourcePack,
  listRfqEvidenceRegisterEntries,
  getRfqWorkflowGateReport,
  listGovernanceHistory,
  listKnowledgeObjects,
  listKnowledgeSuggestions,
  listMissions,
  listProjects,
  listRelationshipSuggestions,
  listRfqWorkflowGateActions,
  listSourceChunks,
  listSourcesByProject
} from "../workspace-store";

const extractionProfiles = [
  "all",
  "markdown_artifact",
  "text_artifact",
  "artifact_directory",
  "metadata_fallback",
  "unsupported_artifact",
  "empty_fixture"
] as const;

type PipelinePageProps = {
  searchParams?: Promise<{
    projectId?: string;
    sourceId?: string;
    status?: string;
    profile?: string;
    evidenceCategory?: string;
    evidenceStatus?: string;
    evidenceGate?: string;
    evidenceTrade?: string;
    evidenceId?: string;
    actionGate?: string;
    actionStatus?: string;
    actionOwner?: string;
  }>;
};

const suggestionStatuses = ["all", "pending", "accepted", "rejected", "deferred"] as const;
const rfqWorkflowGates = ["all", "prepare", "review", "approve_issue", "clarify", "receive_compare"] as const;
const rfqWorkflowActionStatuses = ["all", "open", "in_progress", "resolved", "blocked"] as const;
const pipelineHref = (input: {
  projectId?: string;
  sourceId?: string;
  status?: string;
  profile?: string;
  evidenceCategory?: string;
  evidenceStatus?: string;
  evidenceGate?: string;
  evidenceTrade?: string;
  evidenceId?: string;
  actionGate?: string;
  actionStatus?: string;
  actionOwner?: string;
}) => {
  const params = new URLSearchParams();
  if (input.projectId) {
    params.set("projectId", input.projectId);
  }
  if (input.sourceId) {
    params.set("sourceId", input.sourceId);
  }
  if (input.status) {
    params.set("status", input.status);
  }
  if (input.profile && input.profile !== "all") {
    params.set("profile", input.profile);
  }
  if (input.evidenceCategory && input.evidenceCategory !== "all") {
    params.set("evidenceCategory", input.evidenceCategory);
  }
  if (input.evidenceStatus && input.evidenceStatus !== "all") {
    params.set("evidenceStatus", input.evidenceStatus);
  }
  if (input.evidenceGate && input.evidenceGate !== "all") {
    params.set("evidenceGate", input.evidenceGate);
  }
  if (input.evidenceTrade) {
    params.set("evidenceTrade", input.evidenceTrade);
  }
  if (input.evidenceId) {
    params.set("evidenceId", input.evidenceId);
  }
  if (input.actionGate && input.actionGate !== "all") {
    params.set("actionGate", input.actionGate);
  }
  if (input.actionStatus && input.actionStatus !== "all") {
    params.set("actionStatus", input.actionStatus);
  }
  if (input.actionOwner) {
    params.set("actionOwner", input.actionOwner);
  }

  return `/pipeline?${params.toString()}`;
};

function profileLabel(profile: string) {
  return profile.replaceAll("_", " ");
}

export default async function PipelinePage({ searchParams }: PipelinePageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const pilotSourcePack = getQsRfqPilotSourcePack();
  const pilotRunReport = await getQsRfqPilotRunReport();
  const selectedEvidenceCategory = rfqEvidenceCategories.includes(
    params?.evidenceCategory as (typeof rfqEvidenceCategories)[number]
  )
    ? (params?.evidenceCategory as (typeof rfqEvidenceCategories)[number])
    : "all";
  const selectedEvidenceStatus = rfqEvidenceStatuses.includes(
    params?.evidenceStatus as (typeof rfqEvidenceStatuses)[number]
  )
    ? (params?.evidenceStatus as (typeof rfqEvidenceStatuses)[number])
    : "all";
  const selectedEvidenceGate = rfqWorkflowGates.includes(
    params?.evidenceGate as (typeof rfqWorkflowGates)[number]
  )
    ? (params?.evidenceGate as (typeof rfqWorkflowGates)[number])
    : "all";
  const selectedActionGate = rfqWorkflowGates.includes(
    params?.actionGate as (typeof rfqWorkflowGates)[number]
  )
    ? (params?.actionGate as (typeof rfqWorkflowGates)[number])
    : "all";
  const selectedActionStatus = rfqWorkflowActionStatuses.includes(
    params?.actionStatus as (typeof rfqWorkflowActionStatuses)[number]
  )
    ? (params?.actionStatus as (typeof rfqWorkflowActionStatuses)[number])
    : "all";
  const selectedActionOwner = params?.actionOwner?.trim() ?? "";
  const selectedEvidenceTrade = params?.evidenceTrade?.trim() ?? "";
  const pilotEvidenceRegister = await listRfqEvidenceRegisterEntries({
    projectId: pilotSourcePack.projectId,
    category: selectedEvidenceCategory,
    status: selectedEvidenceStatus,
    workflowGate: selectedEvidenceGate,
    tradeSection: selectedEvidenceTrade
  });
  const selectedEvidenceEntry =
    pilotEvidenceRegister.find((entry) => entry.id === params?.evidenceId) ?? pilotEvidenceRegister[0];
  const pilotEvidenceRegisterReport = await getRfqEvidenceRegisterReport(pilotSourcePack.projectId);
  const pilotWorkflowGateReport = await getRfqWorkflowGateReport(pilotSourcePack.projectId);
  const pilotWorkflowGateActions = await listRfqWorkflowGateActions({
    projectId: pilotSourcePack.projectId,
    gate: selectedActionGate,
    status: selectedActionStatus,
    owner: selectedActionOwner
  });
  const requestedProject = projects.find((project) => project.id === params?.projectId);
  const activeProject = requestedProject ?? projects[0];
  const sources = activeProject ? await listSourcesByProject(activeProject.id) : [];
  const selectedSource = sources.find((source) => source.id === params?.sourceId) ?? sources[0];
  const selectedStatus = suggestionStatuses.includes(params?.status as (typeof suggestionStatuses)[number])
    ? (params?.status as (typeof suggestionStatuses)[number])
    : "all";
  const selectedProfile = extractionProfiles.includes(params?.profile as (typeof extractionProfiles)[number])
    ? (params?.profile as (typeof extractionProfiles)[number])
    : "all";
  const chunks = await listSourceChunks({
    projectId: activeProject?.id,
    sourceId: selectedSource?.id
  });
  const suggestions = await listKnowledgeSuggestions({
    projectId: activeProject?.id,
    sourceId: selectedSource?.id,
    status: selectedStatus
  });
  const relationshipSuggestions = await listRelationshipSuggestions({
    projectId: activeProject?.id,
    sourceId: selectedSource?.id,
    status: selectedStatus
  });
  const missions = await listMissions();
  const projectPipelineMetrics = await getPipelineQualityMetrics({ projectId: activeProject?.id });
  const sourceCoverageReport = await getPipelineSourceCoverageReport({
    projectId: activeProject?.id,
    extractionProfile: selectedProfile
  });
  const selectedSourcePipelineMetrics = await getPipelineQualityMetrics({
    projectId: activeProject?.id,
    sourceId: selectedSource?.id
  });
  const suggestionReviewReport = await getPipelineSuggestionReviewReport({
    projectId: activeProject?.id,
    sourceId: selectedSource?.id
  });
  const selectedSourceHistory = selectedSource
    ? (await listGovernanceHistory({ subjectId: selectedSource.id, limit: 100 })).filter((event) =>
        event.action.startsWith("pipeline.")
      )
    : [];
  const latestSourceHistory = selectedSourceHistory.slice(0, 8);
  const failedPipelineMissions = missions.filter(
    (mission) =>
      mission.stage === "pipeline-ingestion" &&
      mission.status === "failed" &&
      (!activeProject || mission.projectId === activeProject.id)
  );
  const projectKnowledgeObjects = activeProject
    ? await listKnowledgeObjects({ projectId: activeProject.id })
    : [];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Pipeline</p>
          <h2>Manufacturing Pipeline</h2>
          <p className="lede">
            Run deterministic source ingestion, inspect source chunks, and create source-backed draft Knowledge Objects.
          </p>
        </div>
        <span className="status">{suggestions.length + relationshipSuggestions.length} suggestion(s)</span>
      </header>

      {params?.projectId && !requestedProject ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>Project filter not found</strong>
          <span>The requested project does not exist. Showing the first available project instead.</span>
        </section>
      ) : null}

      <section className="metrics" aria-label="Pipeline metrics">
        <Link className="metric metric-link" href={pipelineHref({ projectId: activeProject?.id, profile: selectedProfile })}>
          <span>Project sources</span>
          <strong>{sources.length}</strong>
        </Link>
        <Link className="metric metric-link" href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, profile: selectedProfile })}>
          <span>Source chunks</span>
          <strong>{chunks.length}</strong>
        </Link>
        <Link
          className="metric metric-link"
          href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "pending", profile: selectedProfile })}
        >
          <span>Pending suggestions</span>
          <strong>{projectPipelineMetrics.pendingSuggestionCount}</strong>
        </Link>
        <div className="metric">
          <span>Project KOs</span>
          <strong>{projectKnowledgeObjects.length}</strong>
        </div>
        <Link
          className="metric metric-link"
          href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "accepted", profile: selectedProfile })}
        >
          <span>Accepted ratio</span>
          <strong>{projectPipelineMetrics.acceptanceRate}%</strong>
        </Link>
        <Link
          className="metric metric-link"
          href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "deferred", profile: selectedProfile })}
        >
          <span>Defer/reject ratio</span>
          <strong>{projectPipelineMetrics.deferOrRejectRate}%</strong>
        </Link>
      </section>

      {failedPipelineMissions.length > 0 ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>{failedPipelineMissions.length} failed pipeline job(s)</strong>
          <span>
            Open the source below and use retry after correcting the artifact reference or source metadata.
          </span>
        </section>
      ) : null}

      {activeProject?.id === pilotSourcePack.projectId ? (
        <section className="panel panel-strong">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Pilot vertical slice</p>
              <h3>{pilotSourcePack.title}</h3>
            </div>
            <span className="pill">QS/RFQ</span>
          </div>
          <p>{pilotSourcePack.objective}</p>
          <div className="readiness-list" aria-label="QS/RFQ pilot source pack">
            {pilotSourcePack.artifacts.map((artifact) => (
              <div className="readiness-item readiness-info" key={artifact.sourceId}>
                <strong>{artifact.title}</strong>
                <span>{artifact.purpose}</span>
                <span>{artifact.storagePath}</span>
              </div>
            ))}
          </div>
          <div className="panel-subsection">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Pilot Run Report</p>
                <h4>{pilotRunReport.status === "ready" ? "Pilot output ready" : "Pilot output incomplete"}</h4>
              </div>
              <span className="pill">{pilotRunReport.status}</span>
            </div>
            <div className="summary-row">
              <span>{pilotRunReport.summary.ingestedSourceCount}/{pilotRunReport.summary.sourceCount} sources</span>
              <span>{pilotRunReport.summary.approvedKnowledgeObjectCount} approved KOs</span>
              <span>{pilotRunReport.summary.approvedRelationshipCount} approved edges</span>
              <span>{pilotRunReport.summary.latestPackageStatus ?? "no package"}</span>
              <span>{pilotRunReport.summary.fixtureEvaluationReady ? "Q&A ready" : "Q&A blocked"}</span>
            </div>
            <div className="readiness-list compact-list" aria-label="Compact pilot run report">
              {pilotRunReport.stages.map((stage) => (
                <div
                  className={`readiness-item ${
                    stage.level === "ready" ? "readiness-ready" : "readiness-warning"
                  }`}
                  key={stage.id}
                >
                  <strong>{stage.title}</strong>
                  <span>{stage.detail}</span>
                </div>
              ))}
            </div>
          </div>
          <form className="inline-form action-row" action={runQsRfqPilotVerticalSliceAction}>
            <input type="hidden" name="actor" value="knowledge_engineer" />
            <button type="submit">Run QS/RFQ pilot vertical slice</button>
            <Link className="text-link" href={`/runtime-qa?projectId=${pilotSourcePack.projectId}`}>
              Open Runtime Q&amp;A demo
            </Link>
            <Link className="text-link" href={`/rfq-workflow?projectId=${pilotSourcePack.projectId}`}>
              Open RFQ workflow
            </Link>
          </form>
        </section>
      ) : null}

      {activeProject?.id === pilotSourcePack.projectId ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RFQ evidence register</p>
              <h3>Evidence controls for future workflow gates</h3>
            </div>
            <span className="pill">{pilotEvidenceRegisterReport.ready ? "ready" : "building"}</span>
          </div>
          <div className="summary-row">
            <span>{pilotEvidenceRegisterReport.totalEntries} entries</span>
            <span>{pilotEvidenceRegisterReport.acceptedEntryCount} accepted</span>
            <span>{pilotEvidenceRegisterReport.clarificationRequiredCount} clarification required</span>
            <span>{pilotEvidenceRegisterReport.categoryCounts.issued_evidence} issued evidence</span>
            <span>{pilotEvidenceRegisterReport.categoryCounts.missing_evidence} missing evidence</span>
            <span>{pilotEvidenceRegisterReport.categoryCounts.assumption} assumptions</span>
          </div>
          <form className="source-form compact-form" action="/pipeline">
            <input type="hidden" name="projectId" value={pilotSourcePack.projectId} />
            <label>
              Category
              <select name="evidenceCategory" defaultValue={selectedEvidenceCategory}>
                <option value="all">All categories</option>
                {rfqEvidenceCategories.map((category) => (
                  <option key={category} value={category}>
                    {category.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="evidenceStatus" defaultValue={selectedEvidenceStatus}>
                <option value="all">All statuses</option>
                {rfqEvidenceStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Workflow gate
              <select name="evidenceGate" defaultValue={selectedEvidenceGate}>
                {rfqWorkflowGates.map((gate) => (
                  <option key={gate} value={gate}>
                    {gate.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Trade section
              <input name="evidenceTrade" defaultValue={selectedEvidenceTrade} placeholder="Structural concrete" />
            </label>
            <button type="submit">Apply evidence filters</button>
          </form>
          <div className="readiness-list" aria-label="RFQ evidence workflow gate readiness">
            {pilotEvidenceRegisterReport.workflowGateReadiness.map((gate) => (
              <div
                className={`readiness-item ${gate.status === "ready" ? "readiness-ready" : "readiness-warning"}`}
                key={gate.gate}
              >
                <strong>{gate.gate.replaceAll("_", " ")}</strong>
                <span>{gate.detail}</span>
                <span>
                  Required: {gate.requiredCategories.join(", ")} / Present:{" "}
                  {gate.presentCategories.length > 0 ? gate.presentCategories.join(", ") : "none"}
                </span>
              </div>
            ))}
          </div>
          <div className="panel-subsection">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">RFQ workflow gates</p>
                <h4>{pilotWorkflowGateReport.ready ? "Workflow issue gates ready" : "Workflow issue gates need review"}</h4>
              </div>
              <span className="pill">{pilotWorkflowGateReport.ready ? "ready" : "blocked"}</span>
            </div>
            <div className="readiness-list" aria-label="RFQ workflow gate remediation">
              {pilotWorkflowGateReport.gates.map((gate) => (
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
                    {gate.activeEntryCount} active / {gate.acceptedEntryCount} accepted /{" "}
                    {gate.clarificationRequiredCount} clarification required
                  </span>
                  {gate.remediationPrompts.length > 0 ? (
                    <span>{gate.remediationPrompts.join(" ")}</span>
                  ) : (
                    <span>Required categories are reviewed and active for this gate.</span>
                  )}
                  {gate.followUp ? (
                    <span>
                      Follow-up: {gate.followUp.actionType.replaceAll("_", " ")} /{" "}
                      {gate.followUp.status.replaceAll("_", " ")} / owner {gate.followUp.owner}
                      {gate.followUp.dueDate ? ` / due ${gate.followUp.dueDate}` : ""}
                    </span>
                  ) : (
                    <span>No gate owner assigned.</span>
                  )}
                  <form className="source-form compact-form" action={recordRfqWorkflowGateActionAction}>
                    <input type="hidden" name="projectId" value={pilotSourcePack.projectId} />
                    <input type="hidden" name="gate" value={gate.gate} />
                    <input type="hidden" name="actor" value="reviewer" />
                    <label>
                      Remediation
                      <select
                        name="actionType"
                        defaultValue={
                          gate.missingEvidenceCount > 0
                            ? "attach_missing_evidence"
                            : gate.clarificationRequiredCount > 0
                              ? "request_clarification"
                              : gate.commercialExceptionCount > 0
                                ? "resolve_commercial_exception"
                                : gate.followUp?.actionType ?? "attach_missing_evidence"
                        }
                      >
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
                      <select name="status" defaultValue={gate.followUp?.status ?? "open"}>
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </label>
                    <label className="field-wide">
                      Action notes
                      <textarea
                        name="notes"
                        defaultValue={
                          gate.followUp?.notes ??
                          gate.remediationPrompts[0] ??
                          `Confirm ${gate.title.toLowerCase()} readiness.`
                        }
                      />
                    </label>
                    {gate.entries.length > 0 ? (
                      <fieldset className="field-wide checkbox-stack">
                        <legend>Linked evidence entries</legend>
                        {gate.entries.map((entry) => (
                          <label key={entry.id}>
                            <input
                              type="checkbox"
                              name="evidenceEntryIds"
                              value={entry.id}
                              defaultChecked={
                                gate.followUp ? false : entry.status !== "accepted" || entry.category === "missing_evidence"
                              }
                            />
                            <span>
                              {entry.registerCode} / {entry.category.replaceAll("_", " ")} /{" "}
                              {entry.status.replaceAll("_", " ")}
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
            <form className="source-form compact-form" action="/pipeline" aria-label="RFQ workflow gate action filters">
              <input type="hidden" name="projectId" value={pilotSourcePack.projectId} />
              <label>
                Action gate
                <select name="actionGate" defaultValue={selectedActionGate}>
                  {rfqWorkflowGates.map((gate) => (
                    <option key={gate} value={gate}>
                      {gate.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Action status
                <select name="actionStatus" defaultValue={selectedActionStatus}>
                  {rfqWorkflowActionStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Action owner
                <input name="actionOwner" defaultValue={selectedActionOwner} placeholder="knowledge_engineer" />
              </label>
              <button type="submit">Filter gate actions</button>
            </form>
            <div className="readiness-list compact-list" aria-label="RFQ workflow gate action history">
              {pilotWorkflowGateActions.length > 0 ? (
                pilotWorkflowGateActions.map((action) => (
                  <div className="readiness-item readiness-info" key={action.id}>
                    <strong>
                      {action.gate.replaceAll("_", " ")} / {action.actionType.replaceAll("_", " ")}
                    </strong>
                    <span>
                      {action.status.replaceAll("_", " ")} / owner {action.owner}
                      {action.dueDate ? ` / due ${action.dueDate}` : ""}
                    </span>
                    <span>
                      Linked evidence:{" "}
                      {action.evidenceEntryIds.length > 0 ? `${action.evidenceEntryIds.length} item(s)` : "none"}
                    </span>
                    {action.notes ? <span>{action.notes}</span> : null}
                  </div>
                ))
              ) : (
                <div className="empty-state compact-empty">
                  <strong>No gate actions match the filters</strong>
                  <span>Record a gate action above or relax the history filters.</span>
                </div>
              )}
            </div>
          </div>
          {selectedEvidenceEntry ? (
            <div className="panel-subsection">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Evidence detail</p>
                  <h4>{selectedEvidenceEntry.registerCode}</h4>
                </div>
                <span className="pill">{selectedEvidenceEntry.status.replaceAll("_", " ")}</span>
              </div>
              <dl className="detail-list">
                <div>
                  <dt>Trade</dt>
                  <dd>{selectedEvidenceEntry.tradeSection}</dd>
                </div>
                <div>
                  <dt>BOQ item</dt>
                  <dd>{selectedEvidenceEntry.boqItemRef ?? "not mapped"}</dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>{selectedEvidenceEntry.requiredResponseOwner}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{selectedEvidenceEntry.sourceTitle ?? "not linked"}</dd>
                </div>
                <div>
                  <dt>Knowledge Object</dt>
                  <dd>{selectedEvidenceEntry.knowledgeObjectTitle ?? "not linked"}</dd>
                </div>
                <div>
                  <dt>Evidence reference</dt>
                  <dd>{selectedEvidenceEntry.evidenceReference ?? "not recorded"}</dd>
                </div>
                <div>
                  <dt>Commercial impact</dt>
                  <dd>{selectedEvidenceEntry.commercialImpact ?? "none recorded"}</dd>
                </div>
                <div>
                  <dt>Evidence / question</dt>
                  <dd>{selectedEvidenceEntry.questionOrEvidence}</dd>
                </div>
              </dl>
              <form className="source-form compact-form" action={updateRfqEvidenceRegisterStatusAction}>
                <input type="hidden" name="entryId" value={selectedEvidenceEntry.id} />
                <input type="hidden" name="actor" value="reviewer" />
                <label className="field-wide">
                  Reviewer notes
                  <textarea
                    name="notes"
                    defaultValue={`Reviewed ${selectedEvidenceEntry.registerCode} for ${selectedEvidenceEntry.workflowGate.replaceAll("_", " ")} gate readiness.`}
                  />
                </label>
                <div className="action-row">
                  <button type="submit" name="status" value="accepted">
                    Accept
                  </button>
                  <button type="submit" name="status" value="clarification_required">
                    Request clarification
                  </button>
                  <button type="submit" name="status" value="superseded">
                    Supersede
                  </button>
                </div>
              </form>
            </div>
          ) : null}
          {pilotEvidenceRegister.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Trade</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Gate</th>
                    <th>Evidence / question</th>
                  </tr>
                </thead>
                <tbody>
                  {pilotEvidenceRegister.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <Link
                          className="text-link"
                          href={pipelineHref({
                            projectId: pilotSourcePack.projectId,
                            evidenceCategory: selectedEvidenceCategory,
                            evidenceStatus: selectedEvidenceStatus,
                            evidenceGate: selectedEvidenceGate,
                            evidenceTrade: selectedEvidenceTrade,
                            evidenceId: entry.id
                          })}
                        >
                          {entry.registerCode}
                        </Link>
                      </td>
                      <td>{entry.tradeSection}</td>
                      <td>{entry.category.replaceAll("_", " ")}</td>
                      <td>{entry.status.replaceAll("_", " ")}</td>
                      <td>{entry.workflowGate.replaceAll("_", " ")}</td>
                      <td>{entry.questionOrEvidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No RFQ evidence register yet</strong>
              <span>Run the QS/RFQ pilot vertical slice to create source-backed evidence control records.</span>
            </div>
          )}
        </section>
      ) : null}

      <section className="filter-bar" aria-label="Pipeline project filters">
        {projects.map((project) => (
          <Link
            className={project.id === activeProject?.id ? "filter-chip active" : "filter-chip"}
            href={`/pipeline?projectId=${project.id}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Source ingestion</p>
          <h3>{activeProject?.name ?? "No active project"}</h3>
          {selectedSource ? (
            <>
              <form className="source-form" action={runSourceIngestionAction}>
                <input type="hidden" name="sourceId" value={selectedSource.id} />
                <input type="hidden" name="actor" value="knowledge_engineer" />
                <label className="field-wide">
                  Source
                  <select name="selectedSource" defaultValue={selectedSource.id} disabled>
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.title}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit">Run ingestion</button>
              </form>
              {chunks.length > 0 || suggestions.length > 0 || relationshipSuggestions.length > 0 ? (
                <form className="inline-form action-row" action={retrySourceIngestionAction}>
                  <input type="hidden" name="sourceId" value={selectedSource.id} />
                  <input type="hidden" name="actor" value="knowledge_engineer" />
                  <button type="submit">Retry ingestion</button>
                </form>
              ) : null}
              <div className="action-row">
                <form className="inline-form" action={createFailedIngestionFixtureAction}>
                  <input type="hidden" name="sourceId" value={selectedSource.id} />
                  <input type="hidden" name="actor" value="knowledge_engineer" />
                  <input type="hidden" name="fixtureType" value="manual_failure" />
                  <button type="submit">Create failed fixture</button>
                </form>
                <form className="inline-form" action={createFailedIngestionFixtureAction}>
                  <input type="hidden" name="sourceId" value={selectedSource.id} />
                  <input type="hidden" name="actor" value="knowledge_engineer" />
                  <input type="hidden" name="fixtureType" value="unsupported_file" />
                  <button type="submit">Create unsupported fixture</button>
                </form>
                <form className="inline-form" action={createFailedIngestionFixtureAction}>
                  <input type="hidden" name="sourceId" value={selectedSource.id} />
                  <input type="hidden" name="actor" value="knowledge_engineer" />
                  <input type="hidden" name="fixtureType" value="empty_artifact" />
                  <button type="submit">Create empty fixture</button>
                </form>
              </div>
              {selectedSource.processingStatus === "failed" ? (
                <form className="source-form compact-form" action={repairSourceArtifactAction}>
                  <input type="hidden" name="sourceId" value={selectedSource.id} />
                  <input type="hidden" name="actor" value="knowledge_engineer" />
                  <label className="field-wide">
                    Replacement text
                    <textarea
                      name="repairText"
                      defaultValue={`${selectedSource.title} repaired source artifact.\nThis plain-text repair keeps ingestion deterministic and source-backed.`}
                    />
                  </label>
                  <label className="field-wide">
                    Safe existing path
                    <input name="repairPath" placeholder="storage/sources/repaired-source.txt" />
                  </label>
                  <button type="submit">Repair artifact</button>
                </form>
              ) : null}
              <div className="readiness-list" aria-label="Pipeline source selector">
                {sources.map((source) => (
                  <Link
                    className={`readiness-item ${
                      source.id === selectedSource.id ? "readiness-ready" : "readiness-info"
                    }`}
                    href={pipelineHref({
                      projectId: source.projectId,
                      sourceId: source.id,
                      status: selectedStatus,
                      profile: selectedProfile
                    })}
                    key={source.id}
                  >
                    <strong>{source.title}</strong>
                    <span>{source.category} / {source.processingStatus}</span>
                    <span>{source.boundary}</span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No sources available</strong>
              <span>Register source material before running ingestion.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Stage tracking</p>
          <h3>{selectedSource?.title ?? "No source selected"}</h3>
          {selectedSource ? (
            <dl className="detail-list">
              <div>
                <dt>Ingestion</dt>
                <dd>{chunks.length > 0 ? "completed" : "ready"}</dd>
              </div>
              <div>
                <dt>Extraction</dt>
                <dd>
                  {chunks.length > 0
                    ? `${chunks.length} chunk(s) from ${selectedSource.storagePath ? "artifact or metadata" : "metadata"}`
                    : "waiting"}
                </dd>
              </div>
              <div>
                <dt>KO suggestion</dt>
                <dd>{suggestions.length > 0 ? `${suggestions.length} KO suggestion(s)` : "waiting"}</dd>
              </div>
              <div>
                <dt>Relationship suggestion</dt>
                <dd>
                  {relationshipSuggestions.length > 0
                    ? `${relationshipSuggestions.length} relationship suggestion(s)`
                    : "waiting"}
                </dd>
              </div>
              <div>
                <dt>Artifact reference</dt>
                <dd>{selectedSource.storagePath ?? "metadata fallback"}</dd>
              </div>
              <div>
                <dt>Review boundary</dt>
                <dd>Draft KOs still require human governance before release.</dd>
              </div>
              <div>
                <dt>Pipeline quality</dt>
                <dd>
                  {selectedSourcePipelineMetrics.acceptedSuggestionCount} accepted,{" "}
                  {selectedSourcePipelineMetrics.deferredSuggestionCount} deferred,{" "}
                  {selectedSourcePipelineMetrics.rejectedSuggestionCount} rejected
                </dd>
              </div>
              <div>
                <dt>Recovery signals</dt>
                <dd>
                  {selectedSourcePipelineMetrics.failedJobCount} failed job(s),{" "}
                  {selectedSourcePipelineMetrics.retriedJobCount} retry job(s)
                </dd>
              </div>
            </dl>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No source selected</strong>
              <span>Select a project with registered sources.</span>
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Source coverage report</p>
        <h3>{sourceCoverageReport.ingestedSourceCount}/{sourceCoverageReport.sourceCount} source(s) ingested</h3>
        <div className="summary-row">
          <span>{sourceCoverageReport.totalChunks} chunk(s)</span>
          <span>{sourceCoverageReport.totalSuggestions} suggestion(s)</span>
          <span>{sourceCoverageReport.totalTokenEstimate} estimated token(s)</span>
          <span>{sourceCoverageReport.averageChunksPerIngestedSource} avg chunk(s) per ingested source</span>
          <span>{sourceCoverageReport.multiChunkSourceCount} multi-chunk source(s)</span>
        </div>
        <div className="filter-bar compact-filter" aria-label="Source coverage extraction profile filters">
          {extractionProfiles.map((profile) => {
            const count =
              profile === "all"
                ? Object.values(sourceCoverageReport.profileCounts).reduce((total, value) => total + value, 0)
                : sourceCoverageReport.profileCounts[profile];

            return (
              <Link
                className={profile === selectedProfile ? "filter-chip active" : "filter-chip"}
                href={pipelineHref({
                  projectId: activeProject?.id,
                  sourceId: selectedSource?.id,
                  status: selectedStatus,
                  profile
                })}
                key={profile}
              >
                {profileLabel(profile)} ({count})
              </Link>
            );
          })}
        </div>
        <div className="readiness-list" aria-label="Pipeline source coverage report">
          {sourceCoverageReport.items.map((item) => (
            <Link
              className={`readiness-item ${
                item.processingStatus === "failed" || item.uncoveredChunkCount > 0
                  ? "readiness-warning"
                  : item.chunkCount > 0
                    ? "readiness-ready"
                    : "readiness-info"
              }`}
              href={pipelineHref({
                projectId: activeProject?.id,
                sourceId: item.sourceId,
                status: selectedStatus,
                profile: selectedProfile
              })}
              key={item.sourceId}
            >
              <strong>{item.sourceTitle}</strong>
              <span>
                {profileLabel(item.extractionProfile)} / {item.chunkCount} chunk(s) / {item.coverageRate}% covered
              </span>
              <span>
                {item.suggestionCount} KO suggestion(s), {item.relationshipSuggestionCount} relationship suggestion(s)
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Pipeline audit history</p>
        <h3>{selectedSource?.title ?? "No source selected"}</h3>
        {selectedSourceHistory.length > 0 ? (
          <div className="timeline-list" aria-label="Pipeline source audit history">
            {latestSourceHistory.map((event) => (
              <div className="timeline-item" key={event.id}>
                <strong>{event.action}</strong>
                <span>{event.detail}</span>
                <span>
                  {event.actorId ?? "system"} / {event.createdAt}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <strong>No pipeline history yet</strong>
            <span>Run ingestion or create a fixture to record source-level pipeline events.</span>
          </div>
        )}
        {selectedSourceHistory.length > latestSourceHistory.length ? (
          <details className="details-panel">
            <summary>Open full source event history ({selectedSourceHistory.length})</summary>
            <div className="timeline-list" aria-label="Full pipeline source event history">
              {selectedSourceHistory.map((event) => (
                <div className="timeline-item" key={`full-${event.id}`}>
                  <strong>{event.action}</strong>
                  <span>{event.detail}</span>
                  <span>
                    {event.actorId ?? "system"} / {event.createdAt}
                  </span>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Source chunks</p>
          <h3>Extraction output</h3>
          {chunks.length > 0 ? (
            <div className="timeline-list" aria-label="Source chunks">
              {chunks.map((chunk) => (
                <div className="timeline-item" key={chunk.id}>
                  <strong>{chunk.locator ?? `chunk ${chunk.chunkIndex + 1}`}</strong>
                  <span>{chunk.content}</span>
                  <span>{chunk.tokenEstimate ?? "unknown"} token estimate</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No chunks yet</strong>
              <span>Run ingestion to create deterministic source fragments.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Suggestion filters</p>
          <h3>Drafting queue</h3>
          <form className="filter-bar compact-filter" aria-label="Suggestion filters">
            {activeProject ? <input type="hidden" name="projectId" value={activeProject.id} /> : null}
            {selectedSource ? <input type="hidden" name="sourceId" value={selectedSource.id} /> : null}
            <label className="filter-field">
              Status
              <select name="status" defaultValue={selectedStatus}>
                {suggestionStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <button className="filter-button" type="submit">
              Apply filter
            </button>
          </form>
          <div className="summary-row">
            <Link className="text-link" href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "pending", profile: selectedProfile })}>
              {projectPipelineMetrics.pendingSuggestionCount} pending
            </Link>
            <Link className="text-link" href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "accepted", profile: selectedProfile })}>
              {projectPipelineMetrics.acceptedSuggestionCount} accepted
            </Link>
            <Link className="text-link" href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "deferred", profile: selectedProfile })}>
              {projectPipelineMetrics.deferredSuggestionCount} deferred
            </Link>
            <Link className="text-link" href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "rejected", profile: selectedProfile })}>
              {projectPipelineMetrics.rejectedSuggestionCount} rejected
            </Link>
            <span>{relationshipSuggestions.length} relationship</span>
            <span>{projectPipelineMetrics.failedJobCount} failed</span>
            <span>{projectPipelineMetrics.retriedJobCount} retried</span>
          </div>
        </article>
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Suggestion review report</p>
          <h3>{suggestionReviewReport.totalSuggestions} deterministic suggestion(s)</h3>
          <dl className="detail-list">
            <div>
              <dt>Review queue</dt>
              <dd>
                {suggestionReviewReport.pendingCount} pending, {suggestionReviewReport.acceptedCount} accepted,{" "}
                {suggestionReviewReport.deferredCount} deferred, {suggestionReviewReport.rejectedCount} rejected
              </dd>
            </div>
            <div>
              <dt>Suggestion mix</dt>
              <dd>
                {suggestionReviewReport.knowledgeSuggestionCount} KO /{" "}
                {suggestionReviewReport.relationshipSuggestionCount} relationship
              </dd>
            </div>
            <div>
              <dt>Average confidence</dt>
              <dd>{suggestionReviewReport.averageConfidence ?? "not available"}</dd>
            </div>
            <div>
              <dt>Reviewer notes coverage</dt>
              <dd>
                {suggestionReviewReport.reviewNotesCount}/{suggestionReviewReport.totalSuggestions} suggestion(s)
              </dd>
            </div>
            <div>
              <dt>Recommended action</dt>
              <dd>{suggestionReviewReport.recommendedAction}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">Review signals</p>
          <h3>Evidence and confidence gaps</h3>
          <div className="readiness-list" aria-label="Suggestion review signals">
            <Link
              className={`readiness-item ${
                suggestionReviewReport.pendingCount > 0 ? "readiness-warning" : "readiness-ready"
              }`}
              href={pipelineHref({ projectId: activeProject?.id, sourceId: selectedSource?.id, status: "pending", profile: selectedProfile })}
            >
              <strong>{suggestionReviewReport.pendingCount} pending suggestion(s)</strong>
              <span>Pending items must be accepted, deferred, or rejected before downstream governance.</span>
            </Link>
            <div
              className={`readiness-item ${
                suggestionReviewReport.lowConfidenceCount > 0 ? "readiness-warning" : "readiness-ready"
              }`}
            >
              <strong>{suggestionReviewReport.lowConfidenceCount} low-confidence suggestion(s)</strong>
              <span>Suggestions below 70 confidence should receive extra review before draft creation.</span>
            </div>
            <div
              className={`readiness-item ${
                suggestionReviewReport.missingEvidenceCount > 0 ? "readiness-warning" : "readiness-ready"
              }`}
            >
              <strong>{suggestionReviewReport.missingEvidenceCount} missing-evidence suggestion(s)</strong>
              <span>Source-backed evidence should stay visible before accepting suggestions into KOs or graph edges.</span>
            </div>
          </div>
        </article>
      </section>

      <section className="board" aria-label="Knowledge Object suggestions">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <article className="panel" key={suggestion.id}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{suggestion.objectType}</p>
                  <h3>{suggestion.title}</h3>
                </div>
                <span className="pill">{suggestion.status}</span>
              </div>
              <p>{suggestion.description}</p>
              <dl className="detail-list">
                <div>
                  <dt>Source</dt>
                  <dd>{suggestion.sourceTitle ?? suggestion.sourceId ?? "source pending"}</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>{suggestion.evidenceExcerpt ?? "No evidence excerpt captured."}</dd>
                </div>
                <div>
                  <dt>Review notes</dt>
                  <dd>{suggestion.reviewNotes ?? "No review note."}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{suggestion.confidence ?? "not set"}</dd>
                </div>
              </dl>
              <div className="tags" aria-label={`${suggestion.title} suggested tags`}>
                {suggestion.suggestedTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              {suggestion.status === "pending" ? (
                <>
                  <form className="inline-form action-row" action={acceptKnowledgeSuggestionAction}>
                    <input type="hidden" name="suggestionId" value={suggestion.id} />
                    <input type="hidden" name="actor" value="knowledge_engineer" />
                    <button type="submit">Create draft KO</button>
                  </form>
                  <form className="source-form compact-form" action={updateKnowledgeSuggestionStatusAction}>
                    <input type="hidden" name="suggestionId" value={suggestion.id} />
                    <input type="hidden" name="actor" value="reviewer" />
                    <label className="field-wide">
                      Reviewer note
                      <textarea
                        name="reviewNotes"
                        defaultValue="KO suggestion needs stronger source evidence before draft creation."
                      />
                    </label>
                    <label>
                      Decision
                      <select name="status" defaultValue="deferred">
                        <option value="deferred">deferred</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </label>
                    <button type="submit">Record KO suggestion decision</button>
                  </form>
                </>
              ) : suggestion.acceptedKnowledgeObjectId ? (
                <div className="action-row">
                  <Link className="text-link" href={`/knowledge-objects?projectId=${suggestion.projectId}&koId=${suggestion.acceptedKnowledgeObjectId}`}>
                    Open draft KO
                  </Link>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <article className="panel empty-state">
            <p className="eyebrow">Suggestions</p>
            <h3>No suggestions found</h3>
            <p>Run ingestion or adjust the suggestion status filter.</p>
          </article>
        )}
      </section>

      <section className="board" aria-label="Relationship suggestions">
        {relationshipSuggestions.length > 0 ? (
          relationshipSuggestions.map((suggestion) => {
            const endpointsAccepted =
              Boolean(suggestion.fromAcceptedKnowledgeObjectId) &&
              Boolean(suggestion.toAcceptedKnowledgeObjectId);

            return (
              <article className="panel" key={suggestion.id}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Relationship suggestion</p>
                    <h3>
                      {suggestion.fromSuggestionTitle} {suggestion.type} {suggestion.toSuggestionTitle}
                    </h3>
                  </div>
                  <span className="pill">{suggestion.status}</span>
                </div>
                <p>{suggestion.rationale}</p>
                <dl className="detail-list">
                  <div>
                    <dt>Evidence</dt>
                    <dd>{suggestion.evidenceExcerpt ?? "No evidence excerpt captured."}</dd>
                  </div>
                  <div>
                    <dt>Review notes</dt>
                    <dd>{suggestion.reviewNotes ?? "No review note."}</dd>
                  </div>
                  <div>
                    <dt>Confidence</dt>
                    <dd>{suggestion.confidence ?? "not set"}</dd>
                  </div>
                  <div>
                    <dt>Acceptance readiness</dt>
                    <dd>{endpointsAccepted ? "endpoint KOs ready" : "accept both KO suggestions first"}</dd>
                  </div>
                </dl>
                {suggestion.status === "pending" && endpointsAccepted ? (
                  <form className="inline-form action-row" action={acceptRelationshipSuggestionAction}>
                    <input type="hidden" name="relationshipSuggestionId" value={suggestion.id} />
                    <input type="hidden" name="actor" value="knowledge_engineer" />
                    <button type="submit">Create draft relationship</button>
                  </form>
                ) : suggestion.acceptedRelationshipId ? (
                  <div className="action-row">
                    <Link className="text-link" href={`/ontology?projectId=${suggestion.projectId}`}>
                      Open graph quality
                    </Link>
                  </div>
                ) : null}
                {suggestion.status === "pending" ? (
                  <form className="source-form compact-form" action={updateRelationshipSuggestionStatusAction}>
                    <input type="hidden" name="relationshipSuggestionId" value={suggestion.id} />
                    <input type="hidden" name="actor" value="reviewer" />
                    <label className="field-wide">
                      Reviewer note
                      <textarea
                        name="reviewNotes"
                        defaultValue="Relationship suggestion needs more source support before graph inclusion."
                      />
                    </label>
                    <label>
                      Decision
                      <select name="status" defaultValue="deferred">
                        <option value="deferred">deferred</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </label>
                    <button type="submit">Record suggestion decision</button>
                  </form>
                ) : null}
              </article>
            );
          })
        ) : (
          <article className="panel empty-state">
            <p className="eyebrow">Relationship suggestions</p>
            <h3>No relationship suggestions found</h3>
            <p>Run ingestion with at least two KO suggestions to generate relationship candidates.</p>
          </article>
        )}
      </section>
    </>
  );
}
