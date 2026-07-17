import Link from "next/link";
import {
  createRuntimePkaImportFixturesAction,
  importRuntimePkaArchiveAction,
  recordRuntimePkaImportDecisionAction
} from "../source-actions";
import {
  listGovernanceHistory,
  listPersistedPkaExportFiles,
  listPkaPackages,
  listProjects,
  runtimePkaImportFixtureArchivePaths,
  validateRuntimePkaImportReadback
} from "../workspace-store";

type RuntimeImportPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    packageId?: string;
    archivePath?: string;
    decision?: string;
  }>;
};

const fixtureLabels = {
  valid: "Valid package",
  missing_governance: "Missing governance",
  malformed_archive: "Malformed archive",
  capability_mismatch: "Capability mismatch",
  missing_prompt: "Missing prompt",
  missing_rule: "Missing rule",
  missing_workflow: "Missing workflow",
  missing_template: "Missing template"
} as const;

const decisionFilters = [
  { id: "all", label: "All decisions" },
  { id: "importable", label: "Importable" },
  { id: "blocked", label: "Blocked" }
] as const;

export default async function RuntimeImportPage({ searchParams }: RuntimeImportPageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const requestedProject = projects.find((project) => project.id === params?.projectId);
  const activeProject = requestedProject ?? projects[0];
  const packages = activeProject ? await listPkaPackages(activeProject.id) : [];
  const selectedPackage =
    packages.find((pkaPackage) => pkaPackage.packageId === params?.packageId) ?? packages[0];
  const persistedFiles = selectedPackage ? await listPersistedPkaExportFiles(selectedPackage.packageId) : [];
  const archivePath = params?.archivePath ?? "package-archive.json";
  const importReport = selectedPackage
    ? await validateRuntimePkaImportReadback(selectedPackage.packageId, archivePath)
    : undefined;
  const decisionFilter = params?.decision === "importable" || params?.decision === "blocked" ? params.decision : "all";
  const allImportHistory = selectedPackage
    ? (await listGovernanceHistory({ subjectId: selectedPackage.packageId, limit: 12 })).filter((event) =>
        event.action.startsWith("runtime_import.")
      )
    : [];
  const importHistory = allImportHistory.filter((event) =>
    decisionFilter === "all" ? true : event.action === `runtime_import.${decisionFilter}`
  );
  const importableDecisionCount = allImportHistory.filter((event) => event.action === "runtime_import.importable").length;
  const blockedDecisionCount = allImportHistory.filter((event) => event.action === "runtime_import.blocked").length;
  const fixturePaths = Object.values(runtimePkaImportFixtureArchivePaths);
  const fixtureFiles = persistedFiles.filter((file) => fixturePaths.includes(file.path));
  const importedArchiveFiles = persistedFiles.filter((file) => file.path.startsWith("imports/"));

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Runtime Boundary</p>
          <h2>Runtime Import Harness</h2>
          <p className="lede">
            Simulate how a LADOS-compatible runtime would inspect a selected Base PKA package before loading it.
          </p>
        </div>
        <span className="status">{importReport?.status ?? "no package"}</span>
      </header>

      <section className="filter-bar" aria-label="Runtime import project filters">
        {projects.map((project) => (
          <Link
            className={project.id === activeProject?.id ? "filter-chip active" : "filter-chip"}
            href={`/runtime-import?projectId=${project.id}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <section className="metrics" aria-label="Runtime import decision metrics">
        <Link
          className="metric metric-link"
          href={`/runtime-import?projectId=${activeProject?.id ?? ""}&packageId=${selectedPackage?.packageId ?? ""}&decision=importable`}
        >
          <span>Importable decisions</span>
          <strong>{importableDecisionCount}</strong>
        </Link>
        <Link
          className="metric metric-link"
          href={`/runtime-import?projectId=${activeProject?.id ?? ""}&packageId=${selectedPackage?.packageId ?? ""}&decision=blocked`}
        >
          <span>Blocked decisions</span>
          <strong>{blockedDecisionCount}</strong>
        </Link>
        <Link
          className="metric metric-link"
          href={`/runtime-import?projectId=${activeProject?.id ?? ""}&packageId=${selectedPackage?.packageId ?? ""}&decision=all`}
        >
          <span>Total decisions</span>
          <strong>{allImportHistory.length}</strong>
        </Link>
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Selected package</p>
          <h3>{selectedPackage?.name ?? "No package assembled"}</h3>
          <dl className="detail-list">
            <div>
              <dt>Package ID</dt>
              <dd>{selectedPackage?.packageId ?? "not available"}</dd>
            </div>
            <div>
              <dt>Archive path</dt>
              <dd>{archivePath}</dd>
            </div>
            <div>
              <dt>Import status</dt>
              <dd>{importReport?.status ?? "not available"}</dd>
            </div>
          </dl>
          <div className="action-row">
            <Link className="inline-link" href={`/pka-builder/readback?projectId=${activeProject?.id ?? ""}`}>
              Open package readback
            </Link>
            <Link className="inline-link" href={`/pka-builder/export?projectId=${activeProject?.id ?? ""}`}>
              Inspect persisted export
            </Link>
            <Link
              className="inline-link"
              href={`/runtime-import?projectId=${activeProject?.id ?? ""}&packageId=${selectedPackage?.packageId ?? ""}&decision=blocked`}
            >
              Blocked decisions
            </Link>
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Fixtures</p>
          <h3>Deterministic import cases</h3>
          {selectedPackage ? (
            <form action={createRuntimePkaImportFixturesAction} className="source-form compact-form">
              <input type="hidden" name="packageId" value={selectedPackage.packageId} />
              <button type="submit">Create runtime import fixtures</button>
            </form>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No package available</strong>
              <span>Assemble and publish a package before runtime import simulation.</span>
            </div>
          )}
          <div className="tags" aria-label="Runtime import fixture selectors">
            {Object.entries(runtimePkaImportFixtureArchivePaths).map(([kind, path]) => {
              const available = fixtureFiles.some((file) => file.path === path);
              return available && selectedPackage && activeProject ? (
                <Link
                  className="pill"
                  href={`/runtime-import?projectId=${activeProject.id}&packageId=${selectedPackage.packageId}&archivePath=${encodeURIComponent(path)}`}
                  key={kind}
                >
                  {fixtureLabels[kind as keyof typeof fixtureLabels]}
                </Link>
              ) : (
                <span className="pill" key={kind}>
                  {fixtureLabels[kind as keyof typeof fixtureLabels]}
                </span>
              );
            })}
          </div>
        </article>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Safe local import</p>
          <h3>Imported archive handling</h3>
          {selectedPackage && activeProject ? (
            <form action={importRuntimePkaArchiveAction} className="source-form compact-form">
              <input type="hidden" name="projectId" value={activeProject.id} />
              <input type="hidden" name="packageId" value={selectedPackage.packageId} />
              <label className="field-wide">
                JSON archive
                <input name="archiveFile" type="file" accept="application/json,.json" />
              </label>
              <button type="submit">Import archive for readback</button>
            </form>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No package target</strong>
              <span>Select an assembled package before importing an archive.</span>
            </div>
          )}
          <p>
            Imported archives are limited to JSON, 1 MB, and saved under the selected package import folder.
          </p>
        </article>

        <article className="panel">
          <p className="eyebrow">Imported archives</p>
          <h3>Readback targets</h3>
          <div className="readiness-list" aria-label="Imported runtime archive selectors">
            {importedArchiveFiles.map((file) =>
              selectedPackage && activeProject ? (
                <Link
                  className="readiness-item readiness-info"
                  href={`/runtime-import?projectId=${activeProject.id}&packageId=${selectedPackage.packageId}&archivePath=${encodeURIComponent(file.path)}`}
                  key={file.path}
                >
                  <strong>{file.path}</strong>
                  <span>{file.size} bytes</span>
                </Link>
              ) : null
            )}
            {importedArchiveFiles.length === 0 ? (
              <div className="empty-state compact-empty">
                <strong>No imported archives yet</strong>
                <span>Import a JSON package archive to validate it without replacing the persisted export.</span>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="metrics" aria-label="Runtime import loaded counts">
        <div className="metric">
          <span>Ontology types</span>
          <strong>{importReport?.loaded.ontologyObjectTypes ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Knowledge Objects</span>
          <strong>{importReport?.loaded.knowledgeObjects ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Relationships</span>
          <strong>{importReport?.loaded.relationships ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Sources</span>
          <strong>{importReport?.loaded.sources ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Supported capabilities</span>
          <strong>{importReport?.supportedRuntimeCapabilities.length ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Runtime config entries</span>
          <strong>{importReport?.loaded.runtimeConfigEntries ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Prompt entries</span>
          <strong>{importReport?.loaded.promptEntries ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Rule entries</span>
          <strong>{importReport?.loaded.ruleEntries ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Workflow entries</span>
          <strong>{importReport?.loaded.workflowEntries ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Template entries</span>
          <strong>{importReport?.loaded.templateEntries ?? 0}</strong>
        </div>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Import report</p>
          <h3>{importReport?.status === "importable" ? "Import allowed" : "Import blocked"}</h3>
          {selectedPackage ? (
            <form action={recordRuntimePkaImportDecisionAction} className="inline-form">
              <input type="hidden" name="packageId" value={selectedPackage.packageId} />
              <input type="hidden" name="archivePath" value={archivePath} />
              <input type="hidden" name="actor" value="runtime_consumer" />
              <button type="submit">Record import decision</button>
            </form>
          ) : null}
          <div className="readiness-list" aria-label="Runtime import report">
            {importReport?.items.map((item) => (
              <div className={`readiness-item readiness-${item.level}`} key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            ))}
            {!importReport ? (
              <div className="empty-state compact-empty">
                <strong>No runtime import report</strong>
                <span>Choose a project with a persisted PKA package to run the import contract.</span>
              </div>
            ) : null}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Capability boundary</p>
          <h3>Required vs supported</h3>
          <dl className="detail-list">
            <div>
              <dt>Required by package</dt>
              <dd>{importReport?.requiredRuntimeCapabilities.join(", ") || "not declared"}</dd>
            </div>
            <div>
              <dt>Supported by harness</dt>
              <dd>{importReport?.supportedRuntimeCapabilities.join(", ") || "not available"}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Decision history</p>
        <h3>Runtime import audit trail</h3>
        <div className="filter-bar" aria-label="Runtime import decision filters">
          {decisionFilters.map((filter) => (
            <Link
              className={decisionFilter === filter.id ? "filter-chip active" : "filter-chip"}
              href={`/runtime-import?projectId=${activeProject?.id ?? ""}&packageId=${selectedPackage?.packageId ?? ""}&decision=${filter.id}`}
              key={filter.id}
            >
              {filter.label}
            </Link>
          ))}
        </div>
        <div className="timeline-list" aria-label="Runtime import decision history">
          {importHistory.map((event) => (
            <div className="timeline-item" key={event.id}>
              <strong>{event.action}</strong>
              <span>{event.detail}</span>
              <span>{event.actorId ?? "runtime_consumer"} - {event.createdAt}</span>
            </div>
          ))}
          {importHistory.length === 0 ? (
            <div className="empty-state compact-empty">
              <strong>No import decisions recorded</strong>
              <span>Record an import decision after reviewing the current archive report.</span>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
