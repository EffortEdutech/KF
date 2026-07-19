import { expect, test } from "@playwright/test";

test.describe("KF Studio runtime smoke", () => {
  test.beforeEach(async ({ request }) => {
    const response = await request.post("/api/test/reset");
    expect(response.ok()).toBeTruthy();
  });

  test("renders governance and repository surfaces", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByLabel("Studio navigation").getByRole("link", { name: "Manufacturing Line" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Review", exact: true })).toBeVisible();
    await expect(
      page.getByLabel("Studio navigation").getByRole("link", { name: "PKA Builder", exact: true })
    ).toBeVisible();
    await expect(page.getByLabel("Studio navigation").getByRole("link", { name: "Ontology" })).toBeVisible();
    await expect(page.getByLabel("Studio navigation").getByRole("link", { name: "Pipeline" })).toBeVisible();
    await expect(page.getByLabel("Studio navigation").getByRole("link", { name: "Runtime Import" })).toBeVisible();
    await expect(page.getByLabel("Studio navigation").getByRole("link", { name: "Runtime Handoff" })).toBeVisible();
    await expect(page.getByLabel("Studio navigation").getByRole("link", { name: "Runtime Q&A" })).toBeVisible();
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

    await page.goto("/manufacturing-line");
    await expect(page.getByRole("heading", { name: "Manufacturing Line" })).toBeVisible();
    await expect(page.getByLabel("Manufacturing Line stages").getByText("1. Source Intake")).toBeVisible();
    await expect(page.getByLabel("Manufacturing Line stages").getByText("10. Continuous Improvement")).toBeVisible();
    await expect(page.getByLabel("Manufacturing work orders").getByText("Source-to-KO work order")).toBeVisible();
    await expect(page.getByLabel("Manufacturing work orders").getByText("KO-to-package work order")).toBeVisible();
    await expect(page.getByText("Factory capability first")).toBeVisible();

    await page.goto("/runtime-qa");

    await expect(page.getByRole("heading", { name: "Grounded Q&A Harness Preparation" })).toBeVisible();
    await expect(page.getByText("Harness boundary")).toBeVisible();
    await expect(page.getByText("Answer readiness report")).toBeVisible();
    await expect(page.getByText("Deterministic answer context blocked")).toBeVisible();
    await expect(page.getByText("Model calls")).toBeVisible();
  });

  test("runs deterministic ingestion and creates a draft KO suggestion", async ({ page }) => {
    await page.goto("/pipeline?projectId=kf-qs-rfq-pilot&sourceId=src-boq-sample");

    await expect(page.getByRole("heading", { name: "Manufacturing Pipeline" })).toBeVisible();
    await page.getByRole("button", { name: "Run ingestion" }).click();
    await expect(page.getByText("Extraction output")).toBeVisible();
    await expect(page.getByText("Source-backed excerpt:").first()).toBeVisible();
    await expect(page.getByLabel("Relationship suggestions")).toBeVisible();
    await expect(page.getByText("accept both KO suggestions first").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry ingestion" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create failed fixture" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create unsupported fixture" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create empty fixture" })).toBeVisible();
    await expect(page.getByText("Accepted ratio")).toBeVisible();
    await expect(page.getByText("Defer/reject ratio")).toBeVisible();
    await expect(page.getByText("Pipeline quality")).toBeVisible();
    await expect(page.getByText("Suggestion review report")).toBeVisible();
    await expect(page.getByText("Review signals")).toBeVisible();
    await expect(page.getByText("Reviewer notes coverage")).toBeVisible();
    await expect(page.getByText("Source coverage report")).toBeVisible();
    await expect(page.getByLabel("Pipeline source coverage report").getByText("Sample Bill of Quantity")).toBeVisible();
    await expect(page.getByLabel("Source coverage extraction profile filters").getByRole("link", { name: /^all \(/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Record KO suggestion decision" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Record suggestion decision", exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Record suggestion decision", exact: true }).first().click();
    await expect(page.locator(".pill", { hasText: "deferred" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Create draft KO" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Create draft KO" }).first().click();

    await page.goto("/knowledge-objects?projectId=kf-qs-rfq-pilot&status=ai_generated");
    await expect(page.locator(".pill", { hasText: "ai_generated" }).first()).toBeVisible();
    await expect(page.getByText("pilot").first()).toBeVisible();

    await page.goto("/pipeline?projectId=kf-qs-rfq-pilot&sourceId=src-boq-sample");
    await page.getByRole("button", { name: "Create failed fixture" }).click();
    await expect(page.getByText("failed pipeline job")).toBeVisible();
    await page.getByRole("button", { name: "Retry ingestion" }).click();
    await expect(page.getByText("Source-backed excerpt:").first()).toBeVisible();

    await page.goto("/pipeline?projectId=kf-finance-reference&sourceId=src-aifa-pka-runtime");
    await page.getByRole("button", { name: "Run ingestion" }).click();
    await expect(page.getByRole("heading", { name: "AIFA PKA Runtime Alignment Notes" }).first()).toBeVisible();
    await expect(page.getByText("Runtime Boundary").first()).toBeVisible();
    await page.getByLabel("Source coverage extraction profile filters").getByRole("link", { name: /^markdown artifact \(/ }).click();
    await expect(page).toHaveURL(/profile=markdown_artifact/);
    await expect(page.getByLabel("Pipeline source coverage report").getByText("AIFA PKA Runtime Alignment Notes")).toBeVisible();

    await page.goto("/pipeline?projectId=kf-qs-rfq-pilot&sourceId=src-rfq-template");
    await page.getByRole("button", { name: "Create unsupported fixture" }).click();
    await expect(page.getByText("failed pipeline job")).toBeVisible();
    await expect(page.getByText("pipeline.ingestion_failed_fixture")).toBeVisible();
    await expect(page.getByRole("button", { name: "Repair artifact" })).toBeVisible();
    await page.getByRole("button", { name: "Repair artifact" }).click();
    await expect(page.getByText("pipeline.source_artifact_repaired")).toBeVisible();
    await page.getByRole("button", { name: "Run ingestion" }).click();
    await expect(page.getByText("Source-backed excerpt:").first()).toBeVisible();
    await page.getByLabel("Source coverage extraction profile filters").getByRole("link", { name: /^text artifact \(/ }).click();
    await expect(page).toHaveURL(/profile=text_artifact/);
    await expect(page.getByLabel("Pipeline source coverage report").getByText("RFQ Template Structure")).toBeVisible();
  });

  test("runs the QS/RFQ pilot vertical slice into runtime Q&A readiness", async ({ page }) => {
    await page.goto("/pipeline?projectId=kf-qs-rfq-pilot");

    await expect(page.getByText("QS/RFQ from BOQ Pilot Source Pack")).toBeVisible();
    await expect(page.getByText("Pilot Run Report")).toBeVisible();
    await page.getByRole("button", { name: "Run QS/RFQ pilot vertical slice" }).click();
    await expect(page).toHaveURL(/\/runtime-qa\?projectId=kf-qs-rfq-pilot/);

    await expect(page.getByText("Deterministic answer context ready")).toBeVisible();
    await expect(page.getByText("Fixture answers ready")).toBeVisible();
    await expect(
      page.getByText("Before issuing an RFQ package from a BOQ, check that BOQ item code").first()
    ).toBeVisible();
    await expect(page.getByText("Model calls")).toBeVisible();
    await expect(page.getByText("0", { exact: true }).first()).toBeVisible();

    await page.goto("/manufacturing-line?projectId=kf-qs-rfq-pilot");
    await expect(page.getByText("PKA Manufacturing Governance Closure")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rework required" })).toBeVisible();
    await expect(page.getByLabel("PKA manufacturing closure reasons").getByText("Relationship and governance work order").first()).toBeVisible();

    await page.goto("/pipeline?projectId=kf-qs-rfq-pilot");
    await expect(page.getByText("Pilot output ready")).toBeVisible();
    await expect(page.getByText("Published package handoff")).toBeVisible();
    await expect(page.getByText("Runtime Q&A contract")).toBeVisible();
    await expect(page.getByText("RFQ evidence register").first()).toBeVisible();
    await expect(page.getByText("Evidence controls for future workflow gates")).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply evidence filters" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Accept" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Request clarification" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Supersede" })).toBeVisible();
    await expect(page.getByText("RFQ workflow gates")).toBeVisible();
    await expect(page.getByText("Workflow issue gates need review")).toBeVisible();
    await expect(page.getByText("remediation action").first()).toBeVisible();
    const gateRegion = page.getByLabel("RFQ workflow gate remediation");
    await gateRegion.locator('input[name="owner"]').first().fill("publisher");
    await gateRegion.locator('input[name="dueDate"]').first().fill("2026-07-17");
    await gateRegion.locator('select[name="status"]').first().selectOption("blocked");
    await gateRegion.locator('textarea[name="notes"]').first().fill("Blocked gate action requires commercial evidence before RFQ issue.");
    await gateRegion.locator('input[name="evidenceEntryIds"]').first().check();
    await gateRegion.getByRole("button", { name: "Record gate action" }).first().click();
    await expect(page.getByText("Follow-up:")).toBeVisible();
    await expect(gateRegion.getByText("owner publisher").first()).toBeVisible();
    await expect(page.getByText("Linked evidence: 1 item(s)")).toBeVisible();
    await page.locator('input[name="actionOwner"]').fill("publisher");
    await page.getByRole("button", { name: "Filter gate actions" }).click();
    await expect(page).toHaveURL(/actionOwner=publisher/);
    await expect(page.getByLabel("RFQ workflow gate action history").getByText("owner publisher")).toBeVisible();
    await page.goto("/rfq-workflow?projectId=kf-qs-rfq-pilot&owner=publisher");
    await expect(page.getByRole("heading", { name: "RFQ Workflow" })).toBeVisible();
    await expect(page.getByLabel("RFQ workflow action metrics").getByText("Blocked")).toBeVisible();
    await expect(page.getByLabel("RFQ workflow action metrics").getByText("Overdue")).toBeVisible();
    await expect(page.getByLabel("RFQ workflow action history").getByText("owner publisher")).toBeVisible();
    await expect(page.getByLabel("RFQ workflow action history").getByText(/Overdue by/)).toBeVisible();
    await page.locator('select[name="dueState"]').selectOption("overdue");
    await page.getByRole("button", { name: "Filter actions" }).click();
    await expect(page).toHaveURL(/dueState=overdue/);
    await expect(page.getByLabel("RFQ workflow action history").getByText(/Overdue by/)).toBeVisible();
    await page.getByRole("link", { name: "Inspect audit history" }).first().click();
    await expect(page).toHaveURL(/actionId=/);
    await expect(page.getByLabel("RFQ workflow action audit history").getByText("Selected gate action history")).toBeVisible();
    await expect(page.getByLabel("RFQ workflow action audit history").getByText("rfq_workflow_gate.blocked")).toBeVisible();
    await page.goto("/rfq-workflow?projectId=kf-qs-rfq-pilot&owner=publisher");
    const workflowHistory = page.getByLabel("RFQ workflow action history");
    await workflowHistory.locator('select[name="status"]').first().selectOption("resolved");
    await workflowHistory.locator('textarea[name="notes"]').first().fill("Closed after publisher confirmed RFQ issue action.");
    await workflowHistory.getByRole("button", { name: "Close action" }).first().click();
    await expect(workflowHistory.getByText("resolved / owner publisher")).toBeVisible();
    await page.getByRole("link", { name: "Inspect audit history" }).first().click();
    await expect(page.getByLabel("RFQ workflow action audit history").getByText("rfq_workflow_gate.resolved")).toBeVisible();
    await page.goto("/pipeline?projectId=kf-qs-rfq-pilot");
    await expect(page.getByRole("cell", { name: "Structural concrete substructure" })).toBeVisible();
    await expect(page.getByText("approve issue gate has required evidence categories.")).toBeVisible();
    await page.locator('select[name="evidenceCategory"]').selectOption("missing_evidence");
    await page.getByRole("button", { name: "Apply evidence filters" }).click();
    await expect(page).toHaveURL(/evidenceCategory=missing_evidence/);
    await expect(page.getByRole("link", { name: "RFQ-EV-006" })).toBeVisible();
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
    test.setTimeout(45000);
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
    await expect(page.getByText("No KOs are under review")).toBeVisible();

    await page.goto(`/knowledge-objects?projectId=${pilotProjectId}&q=RFQ%20package%20completeness%20rule`);
    const packageRuleLifecycleForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Update lifecycle" })
    });
    await packageRuleLifecycleForm.locator('select[name="status"]').selectOption("approved");
    await packageRuleLifecycleForm.getByRole("button", { name: "Update lifecycle" }).click();
    await expect(page.locator(".pill", { hasText: "approved" }).first()).toBeVisible();

    await page.goto(`/ontology?projectId=${pilotProjectId}&q=Runtime%20manual`);
    await expect(page.getByRole("heading", { name: "Ontology and Graph Quality" })).toBeVisible();
    await expect(page.locator('input[name="q"]')).toHaveValue("Runtime manual");
    await expect(page.getByText("Relationship detail")).toBeVisible();
    await expect(page.getByText("Relationship review history")).toBeVisible();
    await expect(page.getByText("Adjacency map")).toBeVisible();
    await expect(page.getByRole("definition").filter({ hasText: "Runtime relationship evidence attached from source." })).toBeVisible();

    await page.goto(`/pka-builder?projectId=${pilotProjectId}`);
    await expect(page.getByText("PKA Product Quality", { exact: true })).toBeVisible();
    await expect(page.getByLabel("PKA product quality metrics").getByText("Quality score")).toBeVisible();
    await expect(
      page.getByLabel("PKA product quality report").getByText("Source diversity and freshness", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByLabel("PKA product quality report").getByText("Governance coverage", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByLabel("PKA product quality report").getByText("Package completeness", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("Package validation report")).toBeVisible();
    await expect(page.getByText("Manifest detail preview")).toBeVisible();
    await expect(page.getByText("Manifest JSON", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open manifest JSON" })).toBeVisible();
    await expect(page.getByText("Export structure")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Package component index" })).toBeVisible();
    await expect(page.getByText("Component manufacturing", { exact: true })).toBeVisible();
    await expect(page.getByLabel("PKA component manufacturing metrics").getByText("Manufactured")).toBeVisible();
    await expect(page.getByLabel("PKA component manufacturing readiness").getByText("Workflow contract")).toBeVisible();
    await expect(page.getByLabel("PKA component manufacturing readiness").getByText("Prompt library boundary")).toBeVisible();
    await expect(
      page.getByLabel("PKA component manufacturing readiness").getByText("intentional placeholder").first()
    ).toBeVisible();
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
    expect(
      manifestPayload.exportPreview.componentIndex.map((component: { path: string }) => component.path)
    ).toContain("workflows/rfq-package-issue-workflow.json");
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
    await page.goto(`/runtime-qa?projectId=${pilotProjectId}`);
    await expect(page.getByRole("heading", { name: "Grounded Q&A Harness Preparation" })).toBeVisible();
    await expect(page.getByText("Context bundle preview")).toBeVisible();
    await expect(page.getByText("Fixture questions")).toBeVisible();
    await expect(page.getByText("Citation requirements")).toBeVisible();
    await expect(page.getByText("Deterministic answer context ready")).toBeVisible();
    await expect(page.getByText("Runtime Q&A answer context ready")).toBeVisible();
    await expect(page.getByText("Use published package context only.")).toBeVisible();
    await expect(page.getByLabel("Runtime Q&A approved context preview").getByText("approved").first()).toBeVisible();
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
    expect(governanceExportPayload.rfqWorkflowGateSummary.gates.length).toBeGreaterThan(0);
    expect(Array.isArray(governanceExportPayload.rfqEvidenceDecisionSummary.items)).toBeTruthy();
    expect(Array.isArray(governanceExportPayload.rfqWorkflowGateActionSummary.items)).toBeTruthy();
    expect(typeof governanceExportPayload.rfqWorkflowGateActionRisk.blockedCount).toBe("number");
    expect(typeof governanceExportPayload.rfqWorkflowGateActionRisk.overdueCount).toBe("number");
    const handoffExportResponse = await request.get(
      `/pka-builder/download?projectId=${pilotProjectId}&path=runtime%2Fapp-developer-handoff.json`
    );
    expect(handoffExportResponse.ok()).toBeTruthy();
    const handoffExportPayload = await handoffExportResponse.json();
    expect(handoffExportPayload.requiredFiles).toContain("sources/rfq-evidence-register.json");
    expect(handoffExportPayload.governanceRequirements.requiredGovernanceFields).toContain("rfqWorkflowGateActionRisk");
    expect(handoffExportPayload.relationshipEvidencePolicy.dedicatedTableStatus).toBe("deferred_for_pilot");
    expect(handoffExportPayload.nextDeveloperSlice.length).toBeGreaterThan(0);
    const publishedArchiveResponse = await request.get(
      `/pka-builder/download?projectId=${pilotProjectId}&path=package-archive.json`
    );
    expect(publishedArchiveResponse.ok()).toBeTruthy();
    const publishedArchivePayload = await publishedArchiveResponse.json();
    expect(
      publishedArchivePayload.files.some(
        (file: {
          path: string;
          contents?: {
            releaseDecisionSummary?: { items?: unknown[] };
            rfqWorkflowGateSummary?: { gates?: unknown[] };
            rfqWorkflowGateActionSummary?: { items?: unknown[] };
            rfqWorkflowGateActionRisk?: { blockedCount?: number; overdueCount?: number };
          };
        }) =>
          file.path === "governance/index.json" &&
          file.contents?.releaseDecisionSummary?.items?.length &&
          file.contents.rfqWorkflowGateSummary?.gates?.length &&
          Array.isArray(file.contents.rfqWorkflowGateActionSummary?.items) &&
          typeof file.contents.rfqWorkflowGateActionRisk?.blockedCount === "number" &&
          typeof file.contents.rfqWorkflowGateActionRisk?.overdueCount === "number"
      )
    ).toBeTruthy();
    const publishedZipResponse = await request.get(`/pka-builder/download?projectId=${pilotProjectId}&path=package.zip`);
    expect(publishedZipResponse.ok()).toBeTruthy();
    const publishedZipText = (await publishedZipResponse.body()).toString("utf8");
    expect(publishedZipText).toContain("governance/index.json");
    expect(publishedZipText).toContain("releaseDecisionSummary");
    expect(publishedZipText).toContain("rfqWorkflowGateSummary");
    expect(publishedZipText).toContain("rfqWorkflowGateActionSummary");
    expect(publishedZipText).toContain("rfqWorkflowGateActionRisk");

    await page.goto(`/pka-builder/export?projectId=${pilotProjectId}`);
    await expect(page.getByRole("heading", { name: "Persisted Export" })).toBeVisible();
    await expect(page.getByLabel("Persisted PKA export files").getByText("manifest.json")).toBeVisible();
    await expect(page.getByRole("link", { name: /^package\.zip\b/ })).toBeVisible();
    await expect(page.getByLabel("Persisted PKA export file preview")).toBeVisible();
    await page.getByRole("link", { name: "Open readback report" }).click();
    await expect(page.getByRole("heading", { name: "Package Readback Report" })).toBeVisible();
    await expect(page.getByText("Package Re-assembly Closure")).toBeVisible();
    await expect(page.getByLabel("Package re-assembly closure report").getByText("Closure decision")).toBeVisible();
    await expect(page.getByLabel("Current package readback report").getByText("Persisted JSON archive readback")).toBeVisible();
    await expect(page.getByLabel("Current package readback report").getByText("Persisted ZIP readback")).toBeVisible();
    await page.getByRole("button", { name: "Create invalid readback fixtures" }).click();
    await expect(
      page.getByLabel("Invalid package readback report").getByText("missing governance release, RFQ workflow, gate action, or blocked-action risk summaries").first()
    ).toBeVisible();

    await page.getByRole("link", { name: "Open runtime import harness" }).click();
    await expect(page.getByRole("heading", { name: "Runtime Import Harness" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Import allowed" })).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Governance release summary")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("RFQ workflow governance")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Ontology index")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Runtime configuration placeholder")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Prompt library component")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Rule library component")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Workflow library component")).toBeVisible();
    await expect(page.getByLabel("Runtime import report").getByText("Template library component")).toBeVisible();
    await expect(page.getByLabel("Runtime import loaded counts").getByText("Ontology types")).toBeVisible();
    await page.goto(`/runtime-handoff?projectId=${pilotProjectId}`);
    await expect(page.getByRole("heading", { name: "Consuming App Handoff" })).toBeVisible();
    await expect(page.getByText("Runtime Consumption Contract", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Runtime consumption contract metrics").getByText("Profiles")).toBeVisible();
    await expect(page.getByLabel("Runtime consumption profiles").getByText("Generic PKA runtime")).toBeVisible();
    await expect(page.getByLabel("Runtime consumption profiles").getByText("AIFA mobile app")).toBeVisible();
    await expect(page.getByLabel("Runtime consumption profiles").getByText("LADOS runtime")).toBeVisible();
    await expect(page.getByLabel("Runtime consumption profiles").getByText("installation review required")).toBeVisible();
    await expect(page.getByLabel("Runtime handoff decision metrics").getByText("installable")).toBeVisible();
    await expect(page.getByLabel("Runtime handoff installer checks").getByText("Required package files")).toBeVisible();
    await expect(page.getByLabel("Runtime handoff installer checks").getByText("pass").first()).toBeVisible();
    await expect(page.getByLabel("Runtime handoff installer checks").getByText("feedback requested")).toBeVisible();
    await expect(page.getByText("KnowledgeRelationship.provenance.sourceEvidence")).toBeVisible();
    await expect(page.getByLabel("Runtime handoff relationship evidence feedback").getByText("Feedback requested").first()).toBeVisible();
    await page.getByRole("button", { name: "Create handoff fixtures" }).click();
    await page.getByLabel("Runtime handoff fixture selectors").getByRole("link", { name: "missing required file" }).click();
    await expect(page.getByLabel("Runtime handoff decision metrics").getByText("blocked")).toBeVisible();
    await expect(page.getByLabel("Runtime handoff installer checks").getByText("Missing handoff-required file(s)")).toBeVisible();
    await page.getByLabel("Runtime handoff fixture selectors").getByRole("link", { name: "review required" }).click();
    await expect(page.getByLabel("Runtime handoff decision metrics").getByText("installation review required")).toBeVisible();
    await expect(
      page.getByLabel("Runtime handoff installer checks").getByText("Runtime owner review", { exact: true })
    ).toBeVisible();
    await page.getByLabel("Runtime handoff fixture selectors").getByRole("link", { name: "Valid handoff" }).click();
    await expect(page.getByRole("heading", { name: "Record handoff feedback" })).toBeVisible();
    await page.getByRole("button", { name: "Record handoff feedback" }).click();
    await expect(page.getByLabel("Runtime handoff feedback history").getByText("provenance ok for pilot")).toBeVisible();
    await expect(page.getByLabel("Runtime handoff decision metrics").getByText("1")).toBeVisible();
    const handoffFeedbackForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Record handoff feedback" })
    });
    await handoffFeedbackForm.locator('input[name="runtimeApp"]').fill("AIFA pilot consumer");
    await expect(handoffFeedbackForm.locator('input[name="runtimeApp"]')).toHaveValue("AIFA pilot consumer");
    await page.getByLabel("Feedback decision").selectOption("needs_multi_source_lifecycle");
    await expect(page.getByLabel("Feedback decision")).toHaveValue("needs_multi_source_lifecycle");
    await handoffFeedbackForm
      .locator('textarea[name="notes"]')
      .fill("Pilot consumer needs independent lifecycle for multiple relationship evidence citations.");
    await handoffFeedbackForm.getByRole("button", { name: "Record handoff feedback" }).click();
    await expect(page.getByLabel("Runtime handoff feedback summary")).toContainText(
      /keep provenance for pilot|monitor multi source lifecycle feedback|investigate dedicated relationship evidence table/
    );
    await expect(page.getByLabel("Runtime handoff feedback history")).toBeVisible();
    await page.goto(`/manufacturing-line?projectId=${pilotProjectId}`);
    await expect(page.getByRole("heading", { name: "Manufacturing Line" })).toBeVisible();
    await expect(page.getByText("PKA Manufacturing Governance Closure")).toBeVisible();
    await expect(page.getByText("Continuous Improvement Closure")).toBeVisible();
    await expect(page.getByLabel("Continuous improvement closure metrics").getByText("Feedback")).toBeVisible();
    await expect(page.getByLabel("Continuous improvement closure triggers").getByText("Package re-assembly trigger")).toBeVisible();
    await expect(page.getByText("Package Re-assembly and Readback Closure")).toBeVisible();
    await expect(page.getByLabel("Manufacturing package re-assembly closure report")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Release blocked" })).toBeVisible();
    await expect(page.getByLabel("PKA manufacturing closure metrics").getByText("Release stages ready")).toBeVisible();
    await expect(page.getByLabel("PKA manufacturing closure reasons").getByText("Source-to-KO work order")).toBeVisible();
    await expect(page.getByLabel("Manufacturing Line status metrics").getByText("Ready stages")).toBeVisible();
    await expect(page.getByLabel("Manufacturing Line stages").getByText("8. Runtime Handoff")).toBeVisible();
    await expect(page.getByLabel("Manufacturing Line stages").getByText("9. Consumption Validation")).toBeVisible();
    await expect(page.getByLabel("Manufacturing Line next actions")).toBeVisible();
    await expect(page.getByLabel("Manufacturing work order metrics").getByText("Approval checkpoints")).toBeVisible();
    await expect(page.getByLabel("Manufacturing work orders").getByText("Runtime validation work order")).toBeVisible();
    await page.getByLabel("Manufacturing work orders").getByRole("button", { name: "Create work order trace" }).first().click();
    await expect(page.getByLabel("Manufacturing work orders").getByText("Mission traces").first()).toBeVisible();
    await page.getByRole("button", { name: "Run manufacturing validation article" }).click();
    await expect(page).toHaveURL(/\/manufacturing-line\?projectId=kf-qs-rfq-pilot/);
    await expect(page.getByRole("heading", { name: "Rework required" })).toBeVisible();
    await expect(page.getByLabel("PKA manufacturing closure reasons").getByText("Relationship and governance work order").first()).toBeVisible();
    await page.goto(`/ontology?projectId=${pilotProjectId}`);
    await expect(page.getByText("Relationship and Evidence Closure")).toBeVisible();
    await expect(page.getByLabel("Relationship evidence closure metrics").getByText("Needs rework")).toBeVisible();
    await page.getByLabel("Relationship evidence closure report").getByText("needs rework").first().click();
    await expect(page.getByLabel("Relationship evidence closure remediation")).toBeVisible();
    await page.getByLabel("Relationship evidence closure remediation").locator('select[name="excluded"]').selectOption("yes");
    await page
      .getByLabel("Relationship evidence closure remediation")
      .locator('textarea[name="releaseExclusionReason"]')
      .fill("Runtime smoke excludes working graph edge from this package release.");
    await page.getByRole("button", { name: "Update release posture" }).click();
    await expect(page.getByLabel("Relationship evidence closure metrics").getByText("Excluded")).toBeVisible();
    await page.goto(`/manufacturing-line?projectId=${pilotProjectId}`);
    await expect(page.getByRole("heading", { name: "Rework required" })).toBeVisible();
    await expect(page.getByLabel("PKA manufacturing closure reasons").getByText("Relationship and governance work order").first()).toBeVisible();
    await expect(page.getByText("Manufacturing Run Report")).toBeVisible();
    await page.getByRole("link", { name: "Runtime import checks" }).click();
    await expect(page.getByRole("heading", { name: "Runtime Import Harness" })).toBeVisible();
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
