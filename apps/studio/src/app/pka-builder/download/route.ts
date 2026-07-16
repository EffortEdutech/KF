import { NextRequest } from "next/server";
import {
  buildPkaPackageArchive,
  buildPkaPackageZip,
  getPkaPackageExportPreview,
  persistPkaPackageExportPreview
} from "../../workspace-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  const requestedPath = request.nextUrl.searchParams.get("path") ?? "package-archive.json";

  if (!projectId) {
    return Response.json(
      {
        error: "project_required",
        detail: "projectId is required to download a PKA package export."
      },
      { status: 400 }
    );
  }

  const exportPreview = await getPkaPackageExportPreview(projectId);

  if (!exportPreview) {
    return Response.json(
      {
        error: "export_preview_missing",
        detail: "No PKA package export preview is available for the selected project."
      },
      { status: 404 }
    );
  }

  await persistPkaPackageExportPreview(exportPreview);

  if (requestedPath === exportPreview.zipArchivePath) {
    return new Response(buildPkaPackageZip(exportPreview), {
      headers: {
        "content-disposition": `attachment; filename="${exportPreview.zipArchivePath}"`,
        "content-type": "application/zip"
      }
    });
  }

  const archive = buildPkaPackageArchive(exportPreview);
  const selectedFile =
    requestedPath === exportPreview.archivePath
      ? {
          path: exportPreview.archivePath,
          contents: archive
        }
      : exportPreview.files.find((file) => file.path === requestedPath);

  if (!selectedFile) {
    return Response.json(
      {
        error: "export_file_missing",
        detail: "The requested PKA package export file is not part of this package preview."
      },
      { status: 404 }
    );
  }

  const fileName = selectedFile.path.split("/").at(-1) ?? "pka-export.json";

  return new Response(`${JSON.stringify(selectedFile.contents, null, 2)}\n`, {
    headers: {
      "content-disposition": `attachment; filename="${fileName}"`,
      "content-type": "application/json; charset=utf-8"
    }
  });
}
