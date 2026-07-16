import { NextRequest } from "next/server";
import {
  getPkaManifestPreview,
  getPkaPackageExportPreview,
  listPkaPackages,
  listProjects
} from "../../workspace-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const projects = await listProjects();
  const requestedProjectId = request.nextUrl.searchParams.get("projectId") ?? undefined;
  const project = projects.find((item) => item.id === requestedProjectId) ?? projects[0];

  if (!project) {
    return Response.json(
      {
        error: "project_missing",
        detail: "Create or select a project before exporting a PKA manifest."
      },
      { status: 404 }
    );
  }

  const [packages, preview, exportPreview] = await Promise.all([
    listPkaPackages(project.id),
    getPkaManifestPreview(project.id),
    getPkaPackageExportPreview(project.id)
  ]);
  const latestPackage = packages[0];

  return Response.json({
    projectId: project.id,
    source: latestPackage ? "package_record" : "preview",
    manifest: latestPackage?.manifest ?? preview,
    exportPreview
  });
}
