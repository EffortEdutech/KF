import Link from "next/link";
import { createInvalidPkaReadbackFixturesAction } from "../../source-actions";
import {
  listPersistedPkaExportFiles,
  listPkaPackages,
  listProjects,
  validatePersistedPkaPackageReadback
} from "../../workspace-store";

type PkaReadbackPageProps = {
  searchParams?: Promise<{
    projectId?: string;
  }>;
};

export default async function PkaReadbackPage({ searchParams }: PkaReadbackPageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const requestedProject = projects.find((project) => project.id === params?.projectId);
  const activeProject = requestedProject ?? projects[0];
  const packages = activeProject ? await listPkaPackages(activeProject.id) : [];
  const latestPackage = packages[0];
  const persistedFiles = latestPackage ? await listPersistedPkaExportFiles(latestPackage.packageId) : [];
  const currentReport = latestPackage
    ? await validatePersistedPkaPackageReadback(latestPackage.packageId)
    : [];
  const hasInvalidFixtures =
    persistedFiles.some((file) => file.path === "invalid-package-archive.json") ||
    persistedFiles.some((file) => file.path === "invalid-package.zip");
  const invalidReport =
    latestPackage && hasInvalidFixtures
      ? await validatePersistedPkaPackageReadback(latestPackage.packageId, {
          archivePath: "invalid-package-archive.json",
          zipPath: "invalid-package.zip"
        })
      : [];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">PKA Builder</p>
          <h2>Package Readback Report</h2>
          <p className="lede">
            Validate persisted package archives before a runtime imports the Base PKA.
          </p>
        </div>
        <span className="status">
          {currentReport.filter((item) => item.level === "ready").length}/{currentReport.length} ready
        </span>
      </header>

      <section className="filter-bar" aria-label="PKA readback project filters">
        {projects.map((project) => (
          <Link
            className={project.id === activeProject?.id ? "filter-chip active" : "filter-chip"}
            href={`/pka-builder/readback?projectId=${project.id}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Package</p>
          <h3>{latestPackage?.name ?? "No package assembled"}</h3>
          <dl className="detail-list">
            <div>
              <dt>Package ID</dt>
              <dd>{latestPackage?.packageId ?? "not available"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{latestPackage?.status ?? "not available"}</dd>
            </div>
            <div>
              <dt>Persisted files</dt>
              <dd>{persistedFiles.length}</dd>
            </div>
          </dl>
          <Link className="inline-link" href={`/pka-builder/export?projectId=${activeProject?.id ?? ""}`}>
            Inspect persisted export
          </Link>
          <Link className="inline-link" href={`/runtime-import?projectId=${activeProject?.id ?? ""}`}>
            Open runtime import harness
          </Link>
          <Link className="inline-link" href={`/pka-builder?projectId=${activeProject?.id ?? ""}`}>
            Back to PKA Builder
          </Link>
        </article>

        <article className="panel">
          <p className="eyebrow">Fixtures</p>
          <h3>Invalid readback fixtures</h3>
          {latestPackage ? (
            <form action={createInvalidPkaReadbackFixturesAction} className="source-form compact-form">
              <input type="hidden" name="packageId" value={latestPackage.packageId} />
              <button type="submit">Create invalid readback fixtures</button>
            </form>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No package available</strong>
              <span>Assemble a package before creating invalid readback fixtures.</span>
            </div>
          )}
          {hasInvalidFixtures ? (
            <p>Invalid archive and ZIP fixtures are available for negative readback checks.</p>
          ) : null}
        </article>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Current package</p>
          <h3>Archive and ZIP readback</h3>
          <div className="readiness-list" aria-label="Current package readback report">
            {currentReport.map((item) => (
              <div className={`readiness-item readiness-${item.level}`} key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            ))}
            {currentReport.length === 0 ? (
              <div className="empty-state compact-empty">
                <strong>No readback report</strong>
                <span>Persist package files before running readback validation.</span>
              </div>
            ) : null}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Invalid fixtures</p>
          <h3>Negative readback checks</h3>
          <div className="readiness-list" aria-label="Invalid package readback report">
            {invalidReport.map((item) => (
              <div className={`readiness-item readiness-${item.level}`} key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            ))}
            {invalidReport.length === 0 ? (
              <div className="empty-state compact-empty">
                <strong>No invalid fixtures yet</strong>
                <span>Create invalid fixtures to confirm the readback validator catches missing governance summaries.</span>
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </>
  );
}
