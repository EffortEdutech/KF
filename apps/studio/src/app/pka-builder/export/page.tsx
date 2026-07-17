import Link from "next/link";
import {
  getPkaPackageExportPreview,
  listPersistedPkaExportFiles,
  listPkaPackages,
  listProjects,
  readPersistedPkaExportFile
} from "../../workspace-store";

type PkaExportPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    path?: string;
  }>;
};

export default async function PkaExportPage({ searchParams }: PkaExportPageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const requestedProject = projects.find((project) => project.id === params?.projectId);
  const activeProject = requestedProject ?? projects[0];
  const packages = activeProject ? await listPkaPackages(activeProject.id) : [];
  const latestPackage = packages[0];
  const exportPreview = activeProject ? await getPkaPackageExportPreview(activeProject.id) : undefined;
  const packageId = latestPackage?.packageId ?? exportPreview?.packageId;
  const persistedFiles = packageId ? await listPersistedPkaExportFiles(packageId) : [];
  const selectedPath =
    params?.path && persistedFiles.some((file) => file.path === params.path)
      ? params.path
      : persistedFiles.find((file) => file.path === "manifest.json")?.path ?? persistedFiles[0]?.path;
  const selectedFile =
    packageId && selectedPath && !selectedPath.endsWith(".zip")
      ? await readPersistedPkaExportFile(packageId, selectedPath).catch(() => undefined)
      : undefined;

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">PKA Builder</p>
          <h2>Persisted Export</h2>
          <p className="lede">
            Inspect the package files written under local storage after draft PKA assembly.
          </p>
        </div>
        <span className="status">{persistedFiles.length} file(s)</span>
      </header>

      <section className="filter-bar" aria-label="PKA export project filters">
        {projects.map((project) => (
          <Link
            className={project.id === activeProject?.id ? "filter-chip active" : "filter-chip"}
            href={`/pka-builder/export?projectId=${project.id}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Export package</p>
          <h3>{latestPackage?.name ?? exportPreview?.packageId ?? "No package assembled"}</h3>
          <dl className="detail-list">
            <div>
              <dt>Package ID</dt>
              <dd>{packageId ?? "not available"}</dd>
            </div>
            <div>
              <dt>Export root</dt>
              <dd>{exportPreview?.exportRoot ?? "not available"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{latestPackage ? latestPackage.status : "preview only"}</dd>
            </div>
            <div>
              <dt>Archive</dt>
              <dd>
                {activeProject && exportPreview ? (
                  <>
                    <Link
                      className="inline-link"
                      href={`/pka-builder/download?projectId=${activeProject.id}&path=${encodeURIComponent(exportPreview.archivePath)}`}
                    >
                      JSON
                    </Link>
                    <Link
                      className="inline-link"
                      href={`/pka-builder/download?projectId=${activeProject.id}&path=${encodeURIComponent(exportPreview.zipArchivePath)}`}
                    >
                      ZIP
                    </Link>
                  </>
                ) : (
                  "not available"
                )}
              </dd>
            </div>
          </dl>
          <Link className="inline-link" href={`/pka-builder?projectId=${activeProject?.id ?? ""}`}>
            Back to PKA Builder
          </Link>
          <Link className="inline-link" href={`/pka-builder/readback?projectId=${activeProject?.id ?? ""}`}>
            Open readback report
          </Link>
          <Link className="inline-link" href={`/runtime-import?projectId=${activeProject?.id ?? ""}`}>
            Open runtime import harness
          </Link>
        </article>

        <article className="panel">
          <p className="eyebrow">Files</p>
          <h3>Persisted package files</h3>
          {persistedFiles.length > 0 && activeProject ? (
            <div className="readiness-list" aria-label="Persisted PKA export files">
              {persistedFiles.map((file) => (
                <Link
                  className={`readiness-item ${
                    file.path === selectedPath ? "readiness-info panel-selected" : "readiness-ready"
                  }`}
                  href={`/pka-builder/export?projectId=${activeProject.id}&path=${encodeURIComponent(file.path)}`}
                  key={file.path}
                >
                  <strong>{file.path}</strong>
                  <span>{file.size} bytes</span>
                  <span>{file.updatedAt.slice(0, 19)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No persisted export yet</strong>
              <span>Assemble a draft package from PKA Builder to write files into local storage.</span>
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">File inspection</p>
        <h3>{selectedPath ?? "No file selected"}</h3>
        {selectedFile ? (
          <pre className="code-panel" aria-label="Persisted PKA export file preview">
{selectedFile.contents}
          </pre>
        ) : selectedPath?.endsWith(".zip") ? (
          <div className="empty-state compact-empty">
            <strong>Binary ZIP selected</strong>
            <span>Use the ZIP download link to inspect this archive outside the app.</span>
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <strong>No file preview</strong>
            <span>Select a JSON package file to inspect its persisted contents.</span>
          </div>
        )}
      </section>
    </>
  );
}
