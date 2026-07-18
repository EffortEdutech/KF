import { chromium } from "@playwright/test";

const baseUrl = "http://localhost:4700";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const projectId = "kf-qs-rfq-pilot";

async function screenshot(name) {
  await page.screenshot({ path: `C:/tmp/${name}`, fullPage: true });
}

try {
  await page.goto(`${baseUrl}/pipeline?projectId=${projectId}`, { waitUntil: "networkidle" });
  console.log("PIPELINE TITLE:", await page.locator("h2").first().innerText());
  console.log("PILOT PANEL:", await page.getByText("QS/RFQ from BOQ Pilot Source Pack").first().isVisible());

  await page.getByRole("button", { name: "Run QS/RFQ pilot vertical slice" }).click();
  await page.waitForURL("**/runtime-qa?projectId=kf-qs-rfq-pilot", { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  console.log("RUNTIME URL:", page.url());
  console.log("RUNTIME STATUS:", await page.locator('section[aria-label="Runtime Q&A context metrics"]').innerText());
  console.log(
    "QA DEMO:",
    (await page.locator("section.panel").filter({ hasText: "Deterministic Q&A demo" }).innerText()).slice(0, 1200)
  );
  await screenshot("kf-runtime-qa.png");

  await page.goto(`${baseUrl}/pipeline?projectId=${projectId}`, { waitUntil: "networkidle" });
  console.log(
    "PIPELINE AFTER:",
    (await page.locator("body").innerText()).match(
      /BOQ item evidence required before RFQ issue|RFQ package issue template|RFQ BOQ scope completeness check/g
    )
  );
  await screenshot("kf-pipeline.png");

  await page.goto(`${baseUrl}/knowledge-objects?projectId=${projectId}`, { waitUntil: "networkidle" });
  console.log(
    "KO HEADINGS:",
    await page.locator("article h3").evaluateAll((elements) => elements.slice(0, 10).map((element) => element.textContent))
  );
  await screenshot("kf-kos.png");

  await page.goto(`${baseUrl}/ontology?projectId=${projectId}`, { waitUntil: "networkidle" });
  console.log(
    "ONTOLOGY TEXT:",
    (await page.locator("body").innerText()).match(/supports|used_in|BOQ item evidence|required|RFQ package/g)?.slice(0, 10)
  );
  await screenshot("kf-ontology.png");

  await page.goto(`${baseUrl}/pka-builder?projectId=${projectId}`, { waitUntil: "networkidle" });
  console.log(
    "PKA BUILDER:",
    (await page.locator("body").innerText()).match(
      /QS\/RFQ From BOQ Base PKA|published|Release Readiness|PKA release checks clear/g
    )
  );
  await screenshot("kf-pka-builder.png");

  await page.goto(
    `${baseUrl}/pka-builder/export?projectId=${projectId}&path=${encodeURIComponent("runtime/app-developer-handoff.json")}`,
    { waitUntil: "networkidle" }
  );
  const handoffText = await page.locator('pre[aria-label="Persisted PKA export file preview"]').innerText();
  console.log(
    "HANDOFF CHECK:",
    /App developer package handoff index|runtimeIntegrationNotes|workflowBoundary/.test(handoffText),
    handoffText.slice(0, 800)
  );
  await screenshot("kf-app-developer-handoff.png");

  await page.goto(`${baseUrl}/pka-builder/readback?projectId=${projectId}`, { waitUntil: "networkidle" });
  console.log(
    "READBACK:",
    (await page.getByLabel("Current package readback report").innerText()).match(
      /Persisted JSON archive readback|Persisted ZIP readback|blocked-action risk summaries/g
    )
  );
  await screenshot("kf-pka-readback.png");

  await page.goto(`${baseUrl}/runtime-import?projectId=${projectId}`, { waitUntil: "networkidle" });
  console.log(
    "RUNTIME IMPORT:",
    (await page.getByLabel("Runtime import report").innerText()).match(
      /Archive structure|Governance release summary|RFQ workflow governance|Component indexes/g
    )
  );
  await screenshot("kf-runtime-import.png");

  await page.goto(`${baseUrl}/rfq-workflow?projectId=${projectId}&dueState=overdue`, { waitUntil: "networkidle" });
  console.log(
    "RFQ WORKFLOW DUE FILTER:",
    (await page.locator("body").innerText()).match(/RFQ Workflow|Due state|Overdue|No RFQ workflow actions/g)
  );
  await screenshot("kf-rfq-workflow-overdue.png");
} finally {
  await browser.close();
}
