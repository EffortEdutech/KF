import Link from "next/link";
import {
  assemblePkaPackageAction,
  publishPkaPackageAction,
  updatePkaPackageReleaseStatusAction
} from "../source-actions";
import {
  filterReleaseReadinessHints,
  getPkaManifestPreview,
  getPkaPackageExportPreview,
  getPkaPackageReplacementSummary,
  getPkaPackageValidationReport,
  getPkaReleaseReadinessHints,
  getProjectGovernanceMetrics,
  listKnowledgeObjects,
  listGovernanceHistory,
  listPkaPackages,
  listProjects,
  releaseBlockerTypeFromHintId,
  releaseBlockerTypes
} from "../workspace-store";

type PkaBuilderPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    blockerType?: string;
  }>;
};

export default async function PkaBuilderPage({ searchParams }: PkaBuilderPageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const requestedProject = projects.find((project) => project.id === params?.projectId);
  const activeProject = requestedProject ?? projects[0];
  const selectedBlockerType = releaseBlockerTypes.some((type) => type.id === params?.blockerType)
    ? (params?.blockerType as (typeof releaseBlockerTypes)[number]["id"])
    : "all";
  const knowledgeObjects = activeProject
    ? await listKnowledgeObjects({ projectId: activeProject.id })
    : [];
  const governanceMetrics = activeProject
    ? await getProjectGovernanceMetrics(activeProject.id)
    : {
        totalKnowledgeObjects: 0,
        underReviewCount: 0,
        changesRequestedCount: 0,
        rejectedCount: 0,
        approvedCount: 0,
        releaseBlockerCount: 0
      };
  const releaseReadinessHints = activeProject
    ? await getPkaReleaseReadinessHints(activeProject.id)
    : [];
  const filteredReleaseReadinessHints = filterReleaseReadinessHints(
    releaseReadinessHints,
    selectedBlockerType
  );
  const releaseBlockers = filteredReleaseReadinessHints.filter((hint) => hint.level === "warning");
  const allReleaseBlockers = releaseReadinessHints.filter((hint) => hint.level === "warning");
  const packages = activeProject ? await listPkaPackages(activeProject.id) : [];
  const latestPackage = packages[0];
  const latestPackageHistory = latestPackage
    ? await listGovernanceHistory({ subjectId: latestPackage.id })
    : [];
  const publishedPackages = packages.filter((pkaPackage) => pkaPackage.status === "published");
  const manifestPreview = activeProject ? await getPkaManifestPreview(activeProject.id) : undefined;
  const exportPreview = activeProject ? await getPkaPackageExportPreview(activeProject.id) : undefined;
  const replacementSummary = activeProject
    ? await getPkaPackageReplacementSummary({
        projectId: activeProject.id,
        name: `${activeProject.name} Base PKA`,
        version: "0.1.0",
        publisher: "publisher"
      })
    : undefined;
  const validationReport = activeProject ? await getPkaPackageValidationReport(activeProject.id) : [];
  const latestManifest = packages[0]?.manifest ?? manifestPreview;
  const manifestJson = latestManifest ? JSON.stringify(latestManifest, null, 2) : "";
  const releasableObjects = knowledgeObjects.filter((knowledgeObject) =>
    ["expert_validated", "approved", "published"].includes(knowledgeObject.status)
  );
  const releaseIssueHref = (hintId: string) => {
    const knowledgeObject = knowledgeObjects.find((item) => hintId.startsWith(`${item.id}-`));
    const blockerType = releaseBlockerTypeFromHintId(hintId) ?? selectedBlockerType;

    return `/review?projectId=${activeProject?.id ?? ""}&queueStatus=all&blockerType=${blockerType}${
      knowledgeObject ? `&koId=${knowledgeObject.id}` : ""
    }`;
  };

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">PKA Builder</p>
          <h2>Release Readiness Gate</h2>
          <p className="lede">
            Assemble only governed, release-ready Knowledge Objects into a future Professional Knowledge Asset package.
          </p>
        </div>
        <span className="status">
          {releaseBlockers.length === 0 ? "Release checks clear" : `${releaseBlockers.length} blocker(s)`}
        </span>
      </header>

      {params?.projectId && !requestedProject ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>Project filter not found</strong>
          <span>The requested project does not exist. Showing the first available project instead.</span>
        </section>
      ) : null}

      <section className="metrics" aria-label="PKA Builder governance metrics">
        <Link className="metric metric-link" href={`/knowledge-objects?projectId=${activeProject?.id ?? ""}`}>
          <span>Total KOs</span>
          <strong>{governanceMetrics.totalKnowledgeObjects}</strong>
        </Link>
        <Link className="metric metric-link" href={`/review?projectId=${activeProject?.id ?? ""}&queueStatus=under_review`}>
          <span>Under review</span>
          <strong>{governanceMetrics.underReviewCount}</strong>
        </Link>
        <Link className="metric metric-link" href={`/review?projectId=${activeProject?.id ?? ""}&queueStatus=approved&decision=approved`}>
          <span>Release-grade</span>
          <strong>{governanceMetrics.approvedCount}</strong>
        </Link>
        <Link className="metric metric-link" href={`/pka-builder?projectId=${activeProject?.id ?? ""}&blockerType=all`}>
          <span>Release blockers</span>
          <strong>{governanceMetrics.releaseBlockerCount}</strong>
        </Link>
      </section>

      <section className="filter-bar" aria-label="PKA Builder project filters">
        {projects.map((project) => (
          <Link
            className={project.id === activeProject?.id ? "filter-chip active" : "filter-chip"}
            href={`/pka-builder?projectId=${project.id}&blockerType=${selectedBlockerType}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <section className="filter-bar" aria-label="PKA Builder blocker filters">
        {releaseBlockerTypes.map((type) => (
          <Link
            className={type.id === selectedBlockerType ? "filter-chip active" : "filter-chip"}
            href={`/pka-builder?projectId=${activeProject?.id ?? ""}&blockerType=${type.id}`}
            key={type.id}
          >
            {type.label}
          </Link>
        ))}
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Package candidate</p>
          <h3>{activeProject?.name ?? "No project selected"}</h3>
          <p>
            This gate keeps package assembly aligned with review, evidence, ontology, graph, and governance.
          </p>
          <dl className="detail-list">
            <div>
              <dt>Domain</dt>
              <dd>{activeProject?.domain ?? "not set"}</dd>
            </div>
            <div>
              <dt>Candidate KOs</dt>
              <dd>{knowledgeObjects.length}</dd>
            </div>
            <div>
              <dt>Releasable KOs</dt>
              <dd>{releasableObjects.length}</dd>
            </div>
            <div>
              <dt>Package state</dt>
              <dd>{allReleaseBlockers.length === 0 ? "ready for draft package assembly" : "blocked by governance"}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">Release gate</p>
          <h3>Blocking governance checks</h3>
          <div className="readiness-list" aria-label="PKA Builder release-blocking checks">
            {filteredReleaseReadinessHints.map((hint) => (
              <Link
                className={`readiness-item readiness-${hint.level}`}
                href={releaseIssueHref(hint.id)}
                key={hint.id}
              >
                <strong>{hint.title}</strong>
                <span>{hint.detail}</span>
              </Link>
            ))}
            {filteredReleaseReadinessHints.length === 0 ? (
              <div className="empty-state compact-empty">
                <strong>No matching blockers</strong>
                <span>Change the blocker filter to inspect other release readiness categories.</span>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Assembly</p>
          <h3>Draft package record</h3>
          {activeProject ? (
            <form action={assemblePkaPackageAction} className="source-form compact-form">
              <input type="hidden" name="projectId" value={activeProject.id} />
              <label className="field-wide">
                Package name
                <input name="name" defaultValue={`${activeProject.name} Base PKA`} required />
              </label>
              <label>
                Version
                <input name="version" defaultValue="0.1.0" required />
              </label>
              <label>
                Publisher
                <input name="publisher" defaultValue="publisher" required />
              </label>
              {replacementSummary?.requiresConfirmation ? (
                <label className="field-wide checkbox-field">
                  <input name="confirmReplacement" type="checkbox" value="yes" />
                  Confirm replacement of existing draft package version
                </label>
              ) : null}
              <button type="submit" disabled={allReleaseBlockers.length > 0 || releasableObjects.length === 0}>
                Assemble draft package
              </button>
            </form>
          ) : null}
          {replacementSummary?.blockedByPublished ? (
            <div className="notice-panel notice-warning compact-empty" role="status">
              <strong>Version is published</strong>
              <span>Create a new package version before assembling another export.</span>
            </div>
          ) : null}
          {replacementSummary?.requiresConfirmation ? (
            <div className="notice-panel notice-warning compact-empty" role="status">
              <strong>Replacement confirmation required</strong>
              <span>
                Existing draft package {replacementSummary.packageId} will be overwritten only when confirmed.
              </span>
            </div>
          ) : null}
          {allReleaseBlockers.length > 0 ? (
            <div className="notice-panel notice-warning compact-empty" role="status">
              <strong>Assembly blocked</strong>
              <span>Repair release blockers from Review before creating the package record.</span>
            </div>
          ) : null}
        </article>

        <article className="panel">
          <p className="eyebrow">Package history</p>
          <h3>{packages.length} package(s)</h3>
          {packages.length > 0 ? (
            <div className="timeline-list" aria-label="PKA package records">
              {packages.map((pkaPackage) => (
                <div className="timeline-item" key={pkaPackage.id}>
                  <strong>{pkaPackage.name}</strong>
                  <span>
                    {pkaPackage.packageId} / v{pkaPackage.version} / {pkaPackage.status}
                  </span>
                  <span>
                    Replacement #{pkaPackage.replacementSequence}
                    {pkaPackage.replacementOfPackageId ? `, replaces ${pkaPackage.replacementOfPackageId}` : ""}
                    {pkaPackage.publishedAt ? `, published ${pkaPackage.publishedAt}` : ""}
                  </span>
                  <span>{pkaPackage.exportPath ?? "export path pending"}</span>
                  {pkaPackage.status === "draft" || pkaPackage.status === "changes_requested" ? (
                    <form action={updatePkaPackageReleaseStatusAction} className="source-form compact-form">
                      <input type="hidden" name="packageRecordId" value={pkaPackage.id} />
                      <input type="hidden" name="status" value="under_review" />
                      <input type="hidden" name="actor" value="reviewer" />
                      <label className="field-wide">
                        Reviewer notes
                        <textarea
                          name="notes"
                          defaultValue="Draft package is ready for release review."
                          rows={2}
                        />
                      </label>
                      <button className="inline-action" type="submit">
                        {pkaPackage.status === "changes_requested" ? "Resubmit release review" : "Submit release review"}
                      </button>
                    </form>
                  ) : null}
                  {pkaPackage.status === "under_review" ? (
                    <>
                      <form action={updatePkaPackageReleaseStatusAction} className="source-form compact-form">
                        <input type="hidden" name="packageRecordId" value={pkaPackage.id} />
                        <input type="hidden" name="status" value="approved" />
                        <input type="hidden" name="actor" value="publisher" />
                        <label className="field-wide">
                          Publisher notes
                          <textarea
                            name="notes"
                            defaultValue="Release package approved for immutable publication."
                            rows={2}
                          />
                        </label>
                        <button className="inline-action" type="submit">
                          Approve release
                        </button>
                      </form>
                      <form action={updatePkaPackageReleaseStatusAction} className="source-form compact-form">
                        <input type="hidden" name="packageRecordId" value={pkaPackage.id} />
                        <input type="hidden" name="status" value="changes_requested" />
                        <input type="hidden" name="actor" value="reviewer" />
                        <label className="field-wide">
                          Change request notes
                          <textarea
                            name="notes"
                            defaultValue="Release package needs correction before approval."
                            rows={2}
                          />
                        </label>
                        <button className="inline-action" type="submit">
                          Request release changes
                        </button>
                      </form>
                      <form action={updatePkaPackageReleaseStatusAction} className="source-form compact-form">
                        <input type="hidden" name="packageRecordId" value={pkaPackage.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <input type="hidden" name="actor" value="reviewer" />
                        <label className="field-wide">
                          Rejection notes
                          <textarea
                            name="notes"
                            defaultValue="Release package is not acceptable for publication."
                            rows={2}
                          />
                        </label>
                        <button className="inline-action" type="submit">
                          Reject release
                        </button>
                      </form>
                    </>
                  ) : null}
                  {pkaPackage.status === "approved" ? (
                    <form action={publishPkaPackageAction} className="source-form compact-form">
                      <input type="hidden" name="packageRecordId" value={pkaPackage.id} />
                      <input type="hidden" name="actor" value="publisher" />
                      <label className="field-wide">
                        Publication notes
                        <textarea
                          name="notes"
                          defaultValue="Approved package published as immutable export."
                          rows={2}
                        />
                      </label>
                      <button className="inline-action" type="submit">
                        Publish immutable export
                      </button>
                    </form>
                  ) : null}
                  {pkaPackage.status === "published" ? (
                    <div className="notice-panel compact-empty" role="status">
                      <strong>Published export retained</strong>
                      <span>Published package files remain immutable under {pkaPackage.exportPath}.</span>
                    </div>
                  ) : null}
                  {pkaPackage.status === "rejected" ? (
                    <div className="notice-panel notice-warning compact-empty" role="status">
                      <strong>Release rejected</strong>
                      <span>Replace this draft package version or create a new version before resubmission.</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No package records yet</strong>
              <span>The first draft record appears after all release blockers are clear.</span>
            </div>
          )}
        </article>
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Release approval gate</p>
          <h3>{latestPackage ? latestPackage.status : "No draft package"}</h3>
          {latestPackage ? (
            <dl className="detail-list">
              <div>
                <dt>Latest package</dt>
                <dd>{latestPackage.packageId}</dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>v{latestPackage.version}</dd>
              </div>
              <div>
                <dt>Required path</dt>
                <dd>
                  {latestPackage.status === "draft"
                    ? "submit release review"
                    : latestPackage.status === "under_review"
                      ? "approve, request changes, or reject release"
                      : latestPackage.status === "changes_requested"
                        ? "repair package and resubmit release review"
                      : latestPackage.status === "approved"
                        ? "publish immutable export"
                        : latestPackage.status === "rejected"
                          ? "replace package version before resubmission"
                          : "retained as published"}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No package awaiting release</strong>
              <span>Assemble a draft package before opening release approval.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Package release history</p>
          <h3>{latestPackageHistory.length} decision(s)</h3>
          {latestPackageHistory.length > 0 ? (
            <div className="timeline-list" aria-label="PKA package release audit history">
              {latestPackageHistory.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <strong>{event.action}</strong>
                  <span>{event.detail}</span>
                  <span>
                    {event.actorId} / {event.createdAt}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No package decisions yet</strong>
              <span>Release review, approval, and publication notes appear here.</span>
            </div>
          )}
        </article>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Version lineage</p>
          <h3>{packages.length} record(s)</h3>
          {packages.length > 0 ? (
            <div className="readiness-list" aria-label="PKA package version lineage">
              {packages.map((pkaPackage) => (
                <div className="readiness-item readiness-info" key={`lineage-${pkaPackage.id}`}>
                  <strong>
                    v{pkaPackage.version} / replacement #{pkaPackage.replacementSequence}
                  </strong>
                  <span>
                    {pkaPackage.packageId}
                    {pkaPackage.replacementOfPackageId ? ` replaces ${pkaPackage.replacementOfPackageId}` : " starts lineage"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No lineage yet</strong>
              <span>Package lineage starts with the first assembled draft.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Published retention</p>
          <h3>{publishedPackages.length} immutable export(s)</h3>
          <div className="readiness-list" aria-label="PKA published export retention policy">
            <div className="readiness-item readiness-ready">
              <strong>Retention policy</strong>
              <span>Published exports are retained under storage/exports and cannot be overwritten by draft assembly.</span>
            </div>
            {publishedPackages.map((pkaPackage) => (
              <div className="readiness-item readiness-info" key={`retention-${pkaPackage.id}`}>
                <strong>{pkaPackage.packageId}</strong>
                <span>{pkaPackage.exportPath ?? "export path pending"}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Replacement diff</p>
        <h3>{replacementSummary?.packageId ?? "No package selected"}</h3>
        {replacementSummary ? (
          <div className="readiness-list" aria-label="PKA package replacement diff">
            <div className={`readiness-item ${replacementSummary.existingPackage ? "readiness-warning" : "readiness-ready"}`}>
              <strong>{replacementSummary.existingPackage ? "Existing package found" : "New package version"}</strong>
              <span>
                {replacementSummary.existingPackage
                  ? `${replacementSummary.existingPackage.status} package ${replacementSummary.existingPackage.packageId}`
                  : "No existing package with this package ID."}
              </span>
            </div>
            <div className="readiness-item readiness-info">
              <strong>Semantic changes</strong>
              <span>{replacementSummary.semanticChanges.join("; ")}</span>
            </div>
            <div className="readiness-item readiness-info">
              <strong>Changed files</strong>
              <span>{replacementSummary.changedFiles.length ? replacementSummary.changedFiles.join(", ") : "none"}</span>
            </div>
            <div className="readiness-item readiness-info">
              <strong>Added files</strong>
              <span>{replacementSummary.addedFiles.length ? replacementSummary.addedFiles.join(", ") : "none"}</span>
            </div>
            <div className="readiness-item readiness-info">
              <strong>Removed files</strong>
              <span>{replacementSummary.removedFiles.length ? replacementSummary.removedFiles.join(", ") : "none"}</span>
            </div>
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <strong>No replacement summary</strong>
            <span>Select a project before comparing package export files.</span>
          </div>
        )}
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Validation</p>
          <h3>Package validation report</h3>
          <div className="readiness-list" aria-label="PKA package validation report">
            {validationReport.map((item) => (
              <div className={`readiness-item readiness-${item.level}`} key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Manifest</p>
          <h3>Manifest detail preview</h3>
          {manifestPreview ? (
            <dl className="detail-list">
              <div>
                <dt>Package ID</dt>
                <dd>{manifestPreview.packageId}</dd>
              </div>
              <div>
                <dt>Name / version</dt>
                <dd>
                  {manifestPreview.name} / v{manifestPreview.version}
                </dd>
              </div>
              <div>
                <dt>Runtime capabilities</dt>
                <dd>{manifestPreview.requiredRuntimeCapabilities.join(", ")}</dd>
              </div>
              <div>
                <dt>Ontology</dt>
                <dd>
                  {manifestPreview.objectTypes.length} object type(s), {manifestPreview.relationshipTypes.length} relationship type(s)
                </dd>
              </div>
              <div>
                <dt>Contents</dt>
                <dd>
                  {manifestPreview.knowledgeObjectCount} KO(s), {manifestPreview.relationshipCount} edge(s), {manifestPreview.sourceReferenceCount} source reference(s)
                </dd>
              </div>
            </dl>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No manifest preview</strong>
              <span>Select a project before inspecting package metadata.</span>
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Manifest JSON</p>
        <h3>Export and inspection view</h3>
        {activeProject && latestManifest ? (
          <>
            <p>
              Inspect the package manifest contract as JSON before runtime apps consume it.
              <Link
                className="inline-link"
                href={`/pka-builder/manifest?projectId=${activeProject.id}`}
              >
                Open manifest JSON
              </Link>
              {exportPreview ? (
                <Link
                  className="inline-link"
                  href={`/pka-builder/download?projectId=${activeProject.id}&path=${encodeURIComponent(exportPreview.archivePath)}`}
                >
                  Download JSON archive
                </Link>
              ) : null}
              {exportPreview ? (
                <Link
                  className="inline-link"
                  href={`/pka-builder/download?projectId=${activeProject.id}&path=${encodeURIComponent(exportPreview.zipArchivePath)}`}
                >
                  Download ZIP archive
                </Link>
              ) : null}
              {activeProject ? (
                <Link className="inline-link" href={`/pka-builder/export?projectId=${activeProject.id}`}>
                  Inspect persisted export
                </Link>
              ) : null}
            </p>
            <pre className="code-panel" aria-label="PKA manifest JSON preview">
{manifestJson}
            </pre>
          </>
        ) : (
          <div className="empty-state compact-empty">
            <strong>No manifest JSON</strong>
            <span>Select a project before exporting package metadata.</span>
          </div>
        )}
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Export structure</p>
          <h3>Package folders</h3>
          {exportPreview ? (
            <div className="readiness-list" aria-label="PKA export folder structure">
              {exportPreview.folders.map((folder) => (
                <div className="readiness-item readiness-info" key={folder}>
                  <strong>{folder}/</strong>
                  <span>{exportPreview.files.filter((file) => file.path.startsWith(`${folder}/`)).length} file entry/entries</span>
                </div>
              ))}
              <Link
                className="readiness-item readiness-ready"
                href={`/pka-builder/download?projectId=${activeProject?.id ?? ""}&path=${encodeURIComponent(exportPreview.archivePath)}`}
              >
                <strong>{exportPreview.archivePath}</strong>
                <span>Download complete JSON archive bundle</span>
              </Link>
              <Link
                className="readiness-item readiness-ready"
                href={`/pka-builder/download?projectId=${activeProject?.id ?? ""}&path=${encodeURIComponent(exportPreview.zipArchivePath)}`}
              >
                <strong>{exportPreview.zipArchivePath}</strong>
                <span>Download true ZIP archive bundle</span>
              </Link>
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No export structure</strong>
              <span>Select a project before inspecting package folders.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Component index</p>
          <h3>Package component placeholders</h3>
          {exportPreview ? (
            <div className="readiness-list" aria-label="PKA component index">
              {exportPreview.componentIndex.map((component) => (
                <div
                  className={`readiness-item ${
                    component.governanceStatus === "placeholder" ? "readiness-info" : "readiness-ready"
                  }`}
                  key={component.id}
                >
                  <strong>{component.kind}</strong>
                  <span>{component.path}</span>
                  <span>{component.governanceStatus}</span>
                  <Link
                    className="inline-link"
                    href={`/pka-builder/download?projectId=${activeProject?.id ?? ""}&path=${encodeURIComponent(component.path)}`}
                  >
                    Download file
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No component index</strong>
              <span>Package component entries appear once a project is selected.</span>
            </div>
          )}
        </article>
      </section>

      <section className="table-panel" aria-label="PKA Builder Knowledge Object candidates">
        <div className="table-row ko-row table-head">
          <span>Knowledge Object</span>
          <span>Type</span>
          <span>Status</span>
          <span>Evidence</span>
          <span>Owner</span>
        </div>
        {knowledgeObjects.map((knowledgeObject) => (
          <div className="table-row ko-row" key={knowledgeObject.id}>
            <strong>
              <Link
                className="inline-link"
                href={`/knowledge-objects?projectId=${knowledgeObject.projectId}&koId=${knowledgeObject.id}`}
              >
                {knowledgeObject.title}
              </Link>
            </strong>
            <span>{knowledgeObject.objectType}</span>
            <span className="pill">{knowledgeObject.status}</span>
            <span>
              {knowledgeObject.evidenceLinks.length > 0
                ? `${knowledgeObject.evidenceLinks.length} linked`
                : "manual/expert"}
            </span>
            <span>{knowledgeObject.owner ?? "unassigned"}</span>
          </div>
        ))}
        {knowledgeObjects.length === 0 ? (
          <div className="table-empty">
            <strong>No Knowledge Objects found</strong>
            <span>Create and approve Knowledge Objects before package assembly.</span>
          </div>
        ) : null}
      </section>
    </>
  );
}
