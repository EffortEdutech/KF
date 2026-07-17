import { expect, test } from "@playwright/test";

test.describe("KF Studio runtime smoke", () => {
  test.beforeEach(async ({ request }) => {
    const response = await request.post("/api/test/reset");
    expect(response.ok()).toBeTruthy();
  });

  test("renders governance and repository surfaces", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Review", exact: true })).toBeVisible();
    await expect(
      page.getByLabel("Studio navigation").getByRole("link", { name: "PKA Builder", exact: true })
    ).toBeVisible();
    await expect(page.getByLabel("Studio navigation").getByRole("link", { name: "Ontology" })).toBeVisible();
    await expect(page.getByLabel("Studio navigation").getByRole("link", { name: "Pipeline" })).toBeVisible();
    await expect(page.getByLabel("Studio navigation").getByRole("link", { name: "Runtime Import" })).toBeVisible();
    await expect(page.getByText("Review queue")).toBeVisible();
    await expect(page.getByText("Release blockers")).toBeVisible();

    await page.goto("/knowledge-objects");

    await expect(page.getByRole("heading", { name: "Repository MVP" })).toBeVisible();
    await expect(page.locator('select[name="relType"]')).toBeVisible();
    await expect(page.locator('select[name="relQuality"]')).toBeVisible();
    await expect(page.getByText("Version snapshots", { exact: true })).toBeVisible();

    await page.goto("/review");

    await expect(page.getByRole("heading", { name: "Governance Queue" })).toBeVisible();
    await expect(page.getByText("Reviewer decision", { exact: true })).toBeVisible();
    await expect(page.locator('select[name="decision"]')).toBeVisible();
    await expect(page.locator('select[name="reviewer"]')).toBeVisible();
    await expect(page.locator('select[name="queueStatus"]')).toBeVisible();
    await expect(page.locator('select[name="blockerType"]')).toBeVisible();
    await expect(page.getByText("Release gate", { exact: true })).toBeVisible();

    await page.goto(
      "/review?decision=changes_requested&reviewer=reviewer&queueStatus=changes_requested&blockerType=not-approved-for-release"
    );

    await expect(page.locator('select[name="decision"]')).toHaveValue("changes_requested");
    await expect(page.locator('select[name="reviewer"]')).toHaveValue("reviewer");
    await expect(page.locator('select[name="queueStatus"]')).toHaveValue("changes_requested");
    await expect(page.locator('select[name="blockerType"]')).toHaveValue("not-approved-for-release");

    await page.goto("/pka-builder?blockerType=missing-source-evidence");

    await expect(page.getByRole("heading", { name: "Release Readiness Gate" })).toBeVisible();
    await expect(page.getByText("Blocking governance checks")).toBeVisible();
    await expect(page.getByRole("link", { name: "Missing evidence" })).toBeVisible();

    await page.goto("/ontology");

    await expect(page.getByRole("heading", { name: "Ontology and Graph Quality" })).toBeVisible();
    await expect(page.locator('select[name="type"]')).toBeVisible();
    await expect(page.locator('select[name="relType"]')).toBeVisible();
    await expect(page.locator('input[name="q"]')).toBeVisible();
    await expect(page.getByText("Relationship vocabulary")).toBeVisible();

    await page.goto("/pipeline");

    await expect(page.getByRole("heading", { name: "Manufacturing Pipeline" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Run ingestion" })).toBeVisible();
    await expect(page.getByText("Stage tracking")).toBeVisible();
  });

  test("runs deterministic ingestion and creates a draft KO suggestion", async ({ page }) => {
    await page.goto("/pipeline?projectId=kf-qs-rfq-pilot&sourceId=src-boq-sample");

    await expect(page.getByRole("heading", { name: "Manufacturing Pipeline" })).toBeVisible();
    await page.getByRole("button", { name: "Run ingestion" }).click();
    await expect(page.getByText("Extraction output")).toBeVisible();
    await expect(page.getByText("Source-backed draft:").first()).toBeVisible();
    await expect(page.getByText("Relationship suggestions").first()).toBeVisible();
    await expect(page.getByText("accept both KO suggestions first").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry ingestion" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create failed fixture" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create unsupported fixture" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create empty fixture" })).toBeVisible();
    await expect(page.getByText("Accepted ratio")).toBeVisible();
    await expect(page.getByText("Defer/reject ratio")).toBeVisible();
    await expect(page.getByText("Pipeline quality")).toBeVisible();
    await expect(page.getByRole("button", { name: "Record KO suggestion decision" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Record suggestion decision", exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Record suggestion decision", exact: true }).first().click();
    await expect(page.locator(".pill", { hasText: "deferred" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Create draft KO" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Create draft KO" }).first().click();

    await page.goto("/knowledge-objects?projectId=kf-qs-rfq-pilot&status=ai_generated");
    await expect(page.locator(".pill", { hasText: "ai_generated" }).first()).toBeVisible();
    await expect(page.getByText("pipeline-suggestion").first()).toBeVisible();

    await page.goto("/pipeline?projectId=kf-qs-rfq-pilot&sourceId=src-boq-sample");
    await page.getByRole("button", { name: "Create failed fixture" }).click();
    await expect(page.getByText("failed pipeline job")).toBeVisible();
    await page.getByRole("button", { name: "Retry ingestion" }).click();
    await expect(page.getByText("Source-backed draft:").first()).toBeVisible();

    await page.goto("/pipeline?projectId=kf-finance-reference&sourceId=src-aifa-pka-runtime");
    await page.getByRole("button", { name: "Run ingestion" }).click();
    await expect(page.getByRole("heading", { name: "AIFA PKA Runtime Alignment Notes" }).first()).toBeVisible();
    await expect(page.getByText("Runtime Boundary").first()).toBeVisible();

    await page.goto("/pipeline?projectId=kf-qs-rfq-pilot&sourceId=src-rfq-template");
    await page.getByRole("button", { name: "Create unsupported fixture" }).click();
    await expect(page.getByText("failed pipeline job")).toBeVisible();
    await expect(page.getByText("pipeline.ingestion_failed_fixture")).toBeVisible();
    await expect(page.getByRole("button", { name: "Repair artifact" })).toBeVisible();
    await page.getByRole("button", { name: "Repair artifact" }).click();
    await expect(page.getByText("pipeline.source_artifact_repaired")).toBeVisible();
    await page.getByRole("button", { name: "Run ingestion" }).click();
    await expect(page.getByText("Source-backed draft:").first()).toBeVisible();
  });

  test("records a review decision and drills down from PKA Builder blockers", async ({ page }) => {
    await page.goto("/knowledge-objects");

    await page.getByRole("button", { name: "Create draft KO" }).click();
    await expect(page.getByRole("heading", { name: "RFQ package completeness rule" }).first()).toBeVisible();

    const lifecycleForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Update lifecycle" })
    });
    await lifecycleForm.locator('select[name="status"]').selectOption("under_review");
    await lifecycleForm.getByRole("button", { name: "Update lifecycle" }).click();

    await page.goto("/review?queueStatus=under_review");
    await expect(page.getByRole("heading", { name: "RFQ package completeness rule" }).first()).toBeVisible();
    await expect(page.getByText("KO-specific release blocker actions")).toBeVisible();

    const reviewForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Record review decision" })
    });
    await reviewForm.locator('select[name="decision"]').selectOption("changes_requested");
    await reviewForm.locator('textarea[name="notes"]').fill("Runtime reviewer requests stronger package evidence.");
    await reviewForm.getByRole("button", { name: "Record review decision" }).click();

    await page.goto("/review?queueStatus=changes_requested&decision=changes_requested&reviewer=reviewer");
    await expect(page.getByText("Runtime reviewer requests stronger package evidence.")).toBeVisible();

    await page.goto("/pka-builder?blockerType=not-approved-for-release");
    await expect(page.getByText("RFQ package completeness rule: Not approved for release")).toBeVisible();

    await page.getByText("RFQ package completeness rule: Not approved for release").click();
    await expect(page).toHaveURL(/\/review\?/);
    await expect(page.locator('select[name="blockerType"]')).toHaveValue("not-approved-for-release");
    await expect(page.getByRole("heading", { name: "RFQ package completeness rule" }).first()).toBeVisible();
  });

  test("repairs evidence and relationship provenance before package assembly", async ({ page, request }) => {
    const pilotProjectId = "kf-qs-rfq-pilot";

    await page.goto(`/knowledge-objects?projectId=${pilotProjectId}`);

    await page.getByRole("button", { name: "Create draft KO" }).click();
    await expect(page.getByRole("heading", { name: "RFQ package completeness rule" }).first()).toBeVisible();

    const createForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Create draft KO" })
    });
    await createForm.locator('input[name="title"]').fill("Runtime manual RFQ checklist item");
    await createForm.locator('select[name="objectType"]').selectOption("checklist_item");
    await createForm.locator('select[name="sourceId"]').selectOption("");
    await createForm.getByRole("button", { name: "Create draft KO" }).click();
    await expect(page.getByRole("heading", { name: "Runtime manual RFQ checklist item" }).first()).toBeVisible();

    const relationshipForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Create relationship" })
    });
    await relationshipForm.locator('input[name="relationshipConfidence"]').fill("25");
    await relationshipForm.locator('textarea[name="provenanceNote"]').fill("");
    await relationshipForm.getByRole("button", { name: "Create relationship" }).click();

    await page.goto(`/knowledge-objects?projectId=${pilotProjectId}&q=Runtime%20manual%20RFQ%20checklist%20item`);
    await expect(page.getByRole("heading", { name: "Runtime manual RFQ checklist item" }).first()).toBeVisible();

    const lifecycleForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Update lifecycle" })
    });
    await lifecycleForm.locator('select[name="status"]').selectOption("under_review");
    await lifecycleForm.getByRole("button", { name: "Update lifecycle" }).click();

    await page.goto(`/review?projectId=${pilotProjectId}&queueStatus=under_review&blockerType=all`);
    await expect(page.getByRole("heading", { name: "Runtime manual RFQ checklist item" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Attach evidence" })).toBeVisible();
    await page.locator('textarea[name="evidenceExcerpt"]').fill("Runtime evidence attached from source during review.");
    await page.locator('input[name="evidenceLocator"]').fill("runtime:1");
    await page.getByRole("button", { name: "Attach evidence" }).click();

    await expect(page.getByRole("button", { name: "Repair provenance" })).toBeVisible();
    await page.locator('textarea[name="provenanceNote"]').fill("Runtime relationship provenance confirms checklist supports RFQ completeness.");
    await page.locator('input[name="relationshipConfidence"]').fill("82");
    await page.getByRole("button", { name: "Repair provenance" }).click();

    await expect(page.getByRole("button", { name: "Attach relationship evidence" })).toBeVisible();
    await page.locator('textarea[name="relationshipEvidenceExcerpt"]').fill("Runtime relationship evidence attached from source.");
    await page.locator('input[name="relationshipEvidenceLocator"]').fill("runtime:relationship");
    await page.getByRole("button", { name: "Attach relationship evidence" }).click();

    const reviewForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Record review decision" })
    });
    await reviewForm.locator('select[name="decision"]').selectOption("approved");
    await reviewForm.locator('textarea[name="notes"]').fill("Runtime reviewer approves repaired checklist item.");
    await reviewForm.getByRole("button", { name: "Record review decision" }).click();

    await page.goto(`/knowledge-objects?projectId=${pilotProjectId}&q=RFQ%20package%20completeness%20rule`);
    const packageRuleLifecycleForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Update lifecycle" })
    });
    await packageRuleLifecycleForm.locator('select[name="status"]').selectOption("approved");
    await packageRuleLifecycleForm.getByRole("button", { name: "Update lifecycle" }).click();

    await page.goto(`/ontology?projectId=${pilotProjectId}&q=Runtime%20manual`);
    await expect(page.getByRole("heading", { name: "Ontology and Graph Quality" })).toBeVisible();
    await expect(page.locator('input[name="q"]')).toHaveValue("Runtime manual");
    await expect(page.getByText("Relationship detail")).toBeVisible();
    await expect(page.getByText("Relationship review history")).toBeVisible();
    await expect(page.getByText("Adjacency map")).toBeVisible();
    await expect(page.getByText("Runtime relationship evidence attached from source.")).toBeVisible();

    await page.goto(`/pka-builder?projectId=${pilotProjectId}`);
    await expect(page.getByText("Package validation report")).toBeVisible();
    await expect(page.getByText("Manifest detail preview")).toBeVisible();
    await expect(page.getByText("Manifest JSON", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open manifest JSON" })).toBeVisible();
    await expect(page.getByText("Export structure")).toBeVisible();
    await expect(page.getByText("Component index")).toBeVisible();
    await expect(page.getByLabel("PKA component index").getByText("runtime_configuration")).toBeVisible();
    await expect(page.getByLabel("PKA component index").getByText("formula", { exact: true })).toBeVisible();
    await expect(page.getByLabel("PKA component index").getByText("case_library", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Download JSON archive" })).toBeVisible();
    const manifestResponse = await request.get(`/pka-builder/manifest?projectId=${pilotProjectId}`);
    expect(manifestResponse.ok()).toBeTruthy();
    const manifestPayload = await manifestResponse.json();
    expect(manifestPayload.manifest.packageId).toContain("pka-qs-rfq-from-boq-pka-pilot");
    expect(manifestPayload.exportPreview.files.map((file: { path: string }) => file.path)).toContain("manifest.json");
    expect(manifestPayload.exportPreview.files.map((file: { path: string }) => file.path)).toContain(
      "governance/index.json"
    );
    expect(manifestPayload.exportPreview.files.map((file: { path: string }) => file.path)).toContain(
      "formulas/index.json"
    );
    expect(manifestPayload.exportPreview.files.map((file: { path: string }) => file.path)).toContain(
      "cases/index.json"
    );
    const archiveResponse = await request.get(
      `/pka-builder/download?projectId=${pilotProjectId}&path=package-archive.json`
    );
    expect(archiveResponse.ok()).toBeTruthy();
    expect(archiveResponse.headers()["content-disposition"]).toContain("package-archive.json");
    const zipResponse = await request.get(`/pka-builder/download?projectId=${pilotProjectId}&path=package.zip`);
    expect(zipResponse.ok()).toBeTruthy();
    expect(zipResponse.headers()["content-type"]).toContain("application/zip");
    await expect(page.getByText("No release-blocking governance checks remain.")).toBeVisible();
    await page.getByRole("button", { name: "Assemble draft package" }).click();
    await expect(page.getByRole("heading", { name: "1 package(s)" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "draft", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit release review" })).toBeVisible();
    await page.getByRole("button", { name: "Submit release review" }).click();
    await expect(page.getByRole("heading", { name: "under_review", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Request release changes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject release" })).toBeVisible();
    await page.getByRole("button", { name: "Request release changes" }).click();
    await expect(page.getByRole("heading", { name: "changes_requested", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Resubmit release review" })).toBeVisible();
    await page.getByRole("button", { name: "Resubmit release review" }).click();
    await expect(page.getByRole("heading", { name: "under_review", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve release" })).toBeVisible();
    await page.getByRole("button", { name: "Approve release" }).click();
    await expect(page.getByRole("heading", { name: "approved", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish immutable export" })).toBeVisible();
    await page.getByRole("button", { name: "Publish immutable export" }).click();
    await expect(page.getByRole("heading", { name: "published", exact: true })).toBeVisible();
    await expect(page.getByText("Published export retained")).toBeVisible();
    await expect(page.getByText("Package release history")).toBeVisible();
    await expect(page.getByText("Version lineage")).toBeVisible();
    await expect(page.getByText("Published retention")).toBeVisible();
    const governanceExportResponse = await request.get(
      `/pka-builder/download?projectId=${pilotProjectId}&path=governance%2Findex.json`
    );
    expect(governanceExportResponse.ok()).toBeTruthy();
    const governanceExportPayload = await governanceExportResponse.json();
    expect(
      governanceExportPayload.releaseDecisionSummary.items.some(
        (item: { status: string; decisions: unknown[] }) => item.status === "published" && item.decisions.length > 0
      )
    ).toBeTruthy();
    const publishedArchiveResponse = await request.get(
      `/pka-builder/download?projectId=${pilotProjectId}&path=package-archive.json`
    );
    expect(publishedArchiveResponse.ok()).toBeTruthy();
    const publishedArchivePayload = await publishedArchiveResponse.json();
    expect(
      publishedArchivePayload.files.some(
        (file: { path: string; contents?: { releaseDecisionSummary?: { items?: unknown[] } } }) =>
          file.path === "governance/index.json" && file.contents?.releaseDecisionSummary?.items?.length
      )
    ).toBeTruthy();
    const publishedZipResponse = await request.get(`/pka-builder/download?projectId=${pilotProjectId}&path=package.zip`);
    expect(publishedZipResponse.ok()).toBeTruthy();
    const publishedZipText = (await publishedZipResponse.body()).toString("utf8");
    expect(publishedZipText).toContain("governance/index.json");
    expect(publishedZipText).toContain("releaseDecisionSummary");

    await page.goto(`/pka-builder/export?projectId=${pilotProjectId}`);
    await expect(page.getByRole("heading", { name: "Persisted Export" })).toBeVisible();
    await expect(page.getByLabel("Persisted PKA export files").getByText("manifest.json")).toBeVisible();
    await expect(page.getByRole("link", { name: /^package\.zip\b/ })).toBeVisible();
    await expect(page.getByLabel("Persisted PKA export file preview")).toBeVisible();
    await page.getByRole("link", { name: "Open readback report" }).click();
    await expect(page.getByRole("heading", { name: "Package Readback Report" })).toBeVisible();
    await expect(page.getByLabel("Current package readback report").getByText("Persisted JSON archive readback")).toBeVisible();
    await expect(page.getByLabel("Current package readback report").getByText("Persisted ZIP readback")).toBeVisible();
    await page.getByRole("button", { name: "Create invalid readback fixtures" }).click();
    await expect(
      page.getByLabel("Invalid package readback report").getByText("missing governance release summaries").first()
    ).toBeVisible();

    await page.getByRole("link", { name: "Open runtime import harness" }).click();
    await expect(page.getByRole("heading", { name: "Runtime Import Harness" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Import allowed" })).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Governance release summary")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Ontology index")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Runtime configuration placeholder")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Prompt library component")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Rule library component")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Workflow library component")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Template library component")).toBeVisible();
    await expect(page.getByLabel("Runtime import loaded counts").getByText("Ontology types")).toBeVisible();
    await page.getByRole("button", { name: "Record import decision" }).click();
    await expect(page.getByLabel("Runtime import decision history").getByText("runtime_import.importable")).toBeVisible();
    await page.getByRole("button", { name: "Create runtime import fixtures" }).click();
    await page.getByRole("link", { name: "Capability mismatch" }).click();
    await expect(page.getByRole("heading", { name: "Import blocked" })).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Unsupported runtime capabilities")).toBeVisible();
    await page.getByRole("button", { name: "Record import decision" }).click();
    await expect(page.getByLabel("Runtime import decision metrics").getByText("Blocked decisions")).toBeVisible();
    await page.getByLabel("Runtime import decision filters").getByRole("link", { name: "Blocked" }).click();
    await expect(page.getByLabel("Runtime import decision filters").getByText("Blocked")).toBeVisible();
    await expect(page.getByLabel("Runtime import decision history").getByText("runtime_import.blocked")).toBeVisible();
    await page.getByRole("link", { name: "Missing prompt" }).click();
    await expect(page.getByRole("heading", { name: "Import blocked" })).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("prompts/index.json")).toBeVisible();
    await page.setInputFiles('input[name="archiveFile"]', {
      name: "runtime-handoff-archive.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(publishedArchivePayload), "utf8")
    });
    await page.getByRole("button", { name: "Import archive for readback" }).click();
    await expect(page.getByRole("heading", { name: "Import allowed" })).toBeVisible();
    await expect(page.getByLabel("Imported runtime archive selectors").getByText("imports/").first()).toBeVisible();
  });
});
