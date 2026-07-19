import Link from "next/link";
import {
  createManufacturingWorkOrderTraceAction,
  runManufacturingLineValidationAction
} from "../source-actions";
import {
  getManufacturingLineRunReport,
  getManufacturingWorkOrderReport,
  getPkaPackageAssemblyReadbackClosureReport,
  getPkaManufacturingClosureReport,
  getQsRfqPilotSourcePack,
  listProjects
} from "../workspace-store";

type ManufacturingLinePageProps = {
  searchParams?: Promise<{
    projectId?: string;
  }>;
};

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function readinessClass(status: string) {
  if (status === "ready" || status === "complete") {
    return "readiness-ready";
  }

  return status === "blocked" ? "readiness-blocked" : "readiness-info";
}

function closureClass(disposition: string) {
  if (disposition === "accepted_for_release") {
    return "readiness-ready";
  }

  return disposition === "release_blocked" ? "readiness-blocked" : "readiness-warning";
}

export default async function ManufacturingLinePage({ searchParams }: ManufacturingLinePageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const activeProject = projects.find((project) => project.id === params?.projectId) ?? projects[0];
  const report = await getManufacturingLineRunReport(activeProject.id);
  const workOrderReport = await getManufacturingWorkOrderReport(activeProject.id);
  const closureReport = await getPkaManufacturingClosureReport(activeProject.id);
  const packageAssemblyClosureReport = await getPkaPackageAssemblyReadbackClosureReport(activeProject.id);
  const validationSourcePack = getQsRfqPilotSourcePack();
  const canRunValidationArticle = activeProject.id === validationSourcePack.projectId;

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Knowledge Factory</p>
          <h2>Manufacturing Line</h2>
          <p className="lede">
            Track the reusable factory stages that transform trusted sources into governed, published, and runtime-validated Base PKAs.
          </p>
        </div>
        <span className="status">{statusLabel(report.status)}</span>
      </header>

      <section className="filter-bar" aria-label="Manufacturing Line project filters">
        {projects.map((project) => (
          <Link
            className={project.id === activeProject.id ? "filter-chip active" : "filter-chip"}
            href={`/manufacturing-line?projectId=${project.id}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <section className="metrics" aria-label="Manufacturing Line status metrics">
        <div className="metric">
          <span>Ready stages</span>
          <strong>{report.summary.readyStageCount}/10</strong>
        </div>
        <div className="metric">
          <span>Building stages</span>
          <strong>{report.summary.buildingStageCount}</strong>
        </div>
        <div className="metric">
          <span>Blocked stages</span>
          <strong>{report.summary.blockedStageCount}</strong>
        </div>
        <div className="metric">
          <span>Validation article</span>
          <strong>{report.validationArticle}</strong>
        </div>
      </section>

      <section className="panel panel-strong">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">PKA Manufacturing Governance Closure</p>
            <h3>{closureReport.dispositionLabel}</h3>
          </div>
          <span className={`pill ${closureClass(closureReport.disposition)}`}>
            {statusLabel(closureReport.disposition)}
          </span>
        </div>
        <p>
          This is the final factory disposition for the selected Base PKA. It combines stage readiness, work orders,
          product quality, release blockers, package validation, runtime handoff, and consumption validation.
        </p>
        <section className="metrics" aria-label="PKA manufacturing closure metrics">
          <div className="metric">
            <span>Release stages ready</span>
            <strong>{closureReport.summary.readyStageCount}/9</strong>
          </div>
          <div className="metric">
            <span>Closure issues</span>
            <strong>{closureReport.reasons.length}</strong>
          </div>
          <div className="metric">
            <span>Quality score</span>
            <strong>{closureReport.summary.qualityScore}</strong>
          </div>
          <div className="metric">
            <span>Package</span>
            <strong>{closureReport.packageStatus ?? "not started"}</strong>
          </div>
        </section>
        <div className="readiness-list" aria-label="PKA manufacturing closure reasons">
          {closureReport.disposition === "accepted_for_release" ? (
            closureReport.acceptedSignals.map((signal) => (
              <div className="readiness-item readiness-ready" key={signal}>
                <strong>Accepted signal</strong>
                <span>{signal}</span>
              </div>
            ))
          ) : (
            closureReport.reworkRoutes.slice(0, 6).map((reason) => (
              <article className={`readiness-item ${closureClass(reason.severity === "blocker" ? "release_blocked" : "rework_required")}`} key={reason.id}>
                <strong>{reason.title}</strong>
                <span>{reason.detail}</span>
                <span>
                  Route: {reason.stageTitle} / {reason.workOrderTitle}
                </span>
                <span>{reason.recommendedAction}</span>
                <div className="action-row">
                  <Link className="text-link" href={reason.href}>
                    Open route
                  </Link>
                  <form className="inline-form" action={createManufacturingWorkOrderTraceAction}>
                    <input type="hidden" name="projectId" value={activeProject.id} />
                    <input type="hidden" name="workOrderId" value={reason.workOrderId} />
                    <input type="hidden" name="actor" value="knowledge_architect" />
                    <input type="hidden" name="status" value="queued" />
                    <button type="submit">Create rework trace</button>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel panel-strong">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Package Re-assembly and Readback Closure</p>
            <h3>{packageAssemblyClosureReport.statusLabel}</h3>
          </div>
          <span className={`pill ${packageAssemblyClosureReport.ready ? "readiness-ready" : "readiness-warning"}`}>
            {packageAssemblyClosureReport.packageStatus ?? "not assembled"}
          </span>
        </div>
        <section className="metrics" aria-label="Manufacturing package re-assembly closure metrics">
          <div className="metric">
            <span>Current KOs</span>
            <strong>{packageAssemblyClosureReport.currentManifest?.knowledgeObjectCount ?? 0}</strong>
          </div>
          <div className="metric">
            <span>Persisted KOs</span>
            <strong>{packageAssemblyClosureReport.persistedManifest?.knowledgeObjectCount ?? 0}</strong>
          </div>
          <div className="metric">
            <span>Current edges</span>
            <strong>{packageAssemblyClosureReport.currentManifest?.relationshipCount ?? 0}</strong>
          </div>
          <div className="metric">
            <span>Persisted edges</span>
            <strong>{packageAssemblyClosureReport.persistedManifest?.relationshipCount ?? 0}</strong>
          </div>
        </section>
        <div className="readiness-list" aria-label="Manufacturing package re-assembly closure report">
          <Link
            className={`readiness-item ${packageAssemblyClosureReport.ready ? "readiness-ready" : "readiness-warning"}`}
            href={packageAssemblyClosureReport.href}
          >
            <strong>{packageAssemblyClosureReport.ready ? "Package closure clear" : "Package closure rework"}</strong>
            <span>{packageAssemblyClosureReport.nextAction}</span>
          </Link>
          {packageAssemblyClosureReport.issues.slice(0, 4).map((item) => (
            <div className={`readiness-item readiness-${item.level}`} key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Manufacturing Run Report</p>
              <h3>{report.projectName}</h3>
            </div>
            <span className="pill">{statusLabel(report.status)}</span>
          </div>
          <p>
            This report is generic KF manufacturing-line status. The validation article proves the line with a concrete
            workpiece, but the sprint objective remains the factory capability.
          </p>
          <dl className="detail-list">
            <div>
              <dt>Sources / chunks</dt>
              <dd>
                {report.summary.sourceCount} source(s), {report.summary.chunkCount} chunk(s)
              </dd>
            </div>
            <div>
              <dt>Release-grade KOs</dt>
              <dd>{report.summary.approvedKnowledgeObjectCount}</dd>
            </div>
            <div>
              <dt>Approved relationships</dt>
              <dd>{report.summary.approvedRelationshipCount}</dd>
            </div>
            <div>
              <dt>Latest package</dt>
              <dd>
                {report.summary.latestPackageId ?? "not assembled"} /{" "}
                {report.summary.latestPackageStatus ?? "not started"}
              </dd>
            </div>
            <div>
              <dt>Runtime checks</dt>
              <dd>
                {report.summary.runtimeImportStatus ?? "no import"} /{" "}
                {report.summary.runtimeHandoffDecision ?? "no handoff"} /{" "}
                {report.summary.runtimeQaReady ? "Q&A ready" : "Q&A building"}
              </dd>
            </div>
          </dl>
          <div className="action-row">
            {canRunValidationArticle ? (
              <form className="inline-form" action={runManufacturingLineValidationAction}>
                <input type="hidden" name="projectId" value={activeProject.id} />
                <input type="hidden" name="actor" value="knowledge_engineer" />
                <button type="submit">Run manufacturing validation article</button>
              </form>
            ) : (
              <span className="pill">No runnable validation article assigned</span>
            )}
            <Link className="text-link" href={`/pka-builder?projectId=${activeProject.id}`}>
              Open PKA Builder
            </Link>
            <Link className="text-link" href={`/runtime-handoff?projectId=${activeProject.id}`}>
              Open Runtime Handoff
            </Link>
            <Link className="text-link" href={`/runtime-import?projectId=${activeProject.id}`}>
              Runtime import checks
            </Link>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Next actions</p>
              <h3>Factory blockers and build steps</h3>
            </div>
            <span className="pill">{report.nextActions.length} action(s)</span>
          </div>
          <div className="readiness-list" aria-label="Manufacturing Line next actions">
            {report.nextActions.length > 0 ? (
              report.nextActions.map((action) => (
                <div className="readiness-item readiness-warning" key={action}>
                  <strong>Next factory action</strong>
                  <span>{action}</span>
                </div>
              ))
            ) : (
              <div className="readiness-item readiness-ready">
                <strong>Manufacturing line ready</strong>
                <span>The selected Base PKA is manufactured, governed, published, handed off, and consumption-validated.</span>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Generic Manufacturing Work Orders</p>
            <h3>Reusable factory work-order skeleton</h3>
          </div>
          <span className="pill">
            {workOrderReport.summary.completeCount}/{workOrderReport.summary.totalWorkOrders} complete
          </span>
        </div>
        <section className="metrics" aria-label="Manufacturing work order metrics">
          <div className="metric">
            <span>Ready to run</span>
            <strong>{workOrderReport.summary.readyToRunCount}</strong>
          </div>
          <div className="metric">
            <span>Blocked</span>
            <strong>{workOrderReport.summary.blockedCount}</strong>
          </div>
          <div className="metric">
            <span>Open traces</span>
            <strong>{workOrderReport.summary.openMissionCount}</strong>
          </div>
          <div className="metric">
            <span>Approval checkpoints</span>
            <strong>{workOrderReport.summary.approvalCheckpointCount}</strong>
          </div>
        </section>
        <div className="readiness-list" aria-label="Manufacturing work orders">
          {workOrderReport.workOrders.map((workOrder) => (
            <article className={`readiness-item ${readinessClass(workOrder.status)}`} key={workOrder.id}>
              <strong>{workOrder.title}</strong>
              <span>{statusLabel(workOrder.status)} / {workOrder.stageRange}</span>
              <span>{workOrder.objective}</span>
              <dl className="detail-list">
                <div>
                  <dt>Input signal</dt>
                  <dd>{workOrder.inputSignal}</dd>
                </div>
                <div>
                  <dt>Output signal</dt>
                  <dd>{workOrder.outputSignal}</dd>
                </div>
                <div>
                  <dt>Owner role</dt>
                  <dd>{workOrder.ownerRole}</dd>
                </div>
                <div>
                  <dt>Mission traces</dt>
                  <dd>{workOrder.openMissionCount}/{workOrder.missionCount} open</dd>
                </div>
              </dl>
              <span>{workOrder.approvalCheckpoint}</span>
              <span>{workOrder.nextAction}</span>
              <div className="action-row">
                <Link className="text-link" href={workOrder.href}>
                  {workOrder.runControlLabel}
                </Link>
                <form className="inline-form" action={createManufacturingWorkOrderTraceAction}>
                  <input type="hidden" name="projectId" value={activeProject.id} />
                  <input type="hidden" name="workOrderId" value={workOrder.id} />
                  <input type="hidden" name="actor" value={workOrder.ownerRole} />
                  <select name="status" defaultValue="queued" aria-label={`Trace status for ${workOrder.title}`}>
                    <option value="queued">queued</option>
                    <option value="running">running</option>
                    <option value="completed">completed</option>
                  </select>
                  <button type="submit">Create work order trace</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Ten-stage factory line</p>
            <h3>PKA manufacturing readiness</h3>
          </div>
          <span className="pill">{report.stages.length} stages</span>
        </div>
        <div className="readiness-list" aria-label="Manufacturing Line stages">
          {report.stages.map((stage) => (
            <Link className={`readiness-item ${readinessClass(stage.status)}`} href={stage.href} key={stage.id}>
              <strong>
                {stage.stageNumber}. {stage.title}
              </strong>
              <span>{statusLabel(stage.status)} / {stage.metric}</span>
              <span>{stage.detail}</span>
              <span>{stage.genericRequirement}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Sprint boundary</p>
          <h3>Factory capability first</h3>
          <p>
            This surface executes the Knowledge Factory objective: manufacture governed PKAs. Validation articles are
            workpieces that prove the factory line; they are not the product objective.
          </p>
        </article>

        <article className="panel">
          <p className="eyebrow">Deferred by gate</p>
          <h3>Not part of current batch</h3>
          <div className="tags">
            <span>Ollama adapter</span>
            <span>PDF/Word extraction</span>
            <span>relationship evidence table</span>
            <span>marketplace</span>
            <span>runtime workflow execution</span>
          </div>
        </article>
      </section>
    </>
  );
}
