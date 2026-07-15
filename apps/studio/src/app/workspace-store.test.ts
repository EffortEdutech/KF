import {
  createProject,
  createMission,
  createSource,
  getProjectReadinessHints,
  getProjectSourceCount,
  getSourceReadinessHints,
  listMissions,
  listProjects,
  listSources,
  resetWorkspaceStoreForTests,
  updateMissionStatus
} from "./workspace-store";

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runWorkspaceStoreContractTest() {
  resetWorkspaceStoreForTests();

  const initialProjectCount = (await listProjects()).length;
  const initialMissionCount = (await listMissions()).length;
  const project = await createProject({
    name: "Contract Test PKA",
    domain: "Quantity Surveying",
    owner: "knowledge_architect",
    objective: "Verify project creation stays connected to the local workspace store."
  });

  expect((await listProjects()).length === initialProjectCount + 1, "project creation should append one project");
  expect(
    (await listMissions()).length === initialMissionCount + 1,
    "project creation should create one mission trace"
  );

  const source = await createSource({
    projectId: project.id,
    title: "Contract Test Source",
    category: "company_document",
    domain: "Quantity Surveying",
    owner: "knowledge_engineer",
    version: "0.1",
    reliability: "test fixture",
    usagePolicy: "local test only",
    boundary: "base_pka_input"
  });

  expect(source.projectId === project.id, "source should be attached to the created project");
  expect((await listSources())[0]?.id === source.id, "new source should be returned first");
  expect((await getProjectSourceCount(project.id)) === 1, "project source count should reflect created source");
  expect(
    getSourceReadinessHints(source).some((hint) => hint.id === "source-not-approved"),
    "draft source should report governance review readiness hint"
  );
  expect(
    (await getProjectReadinessHints(project)).some((hint) => hint.id === "no-knowledge-objects"),
    "project with no KOs should report repository readiness hint"
  );
  expect(
    (await listMissions()).length === initialMissionCount + 2,
    "source creation should create one mission trace"
  );

  const mission = await createMission({
    type: "validation",
    title: "Contract Test Mission",
    projectId: project.id,
    assignedTo: "reviewer",
    stage: "review",
    priority: "normal",
    status: "queued"
  });

  expect((await listMissions())[0]?.id === mission.id, "new mission should be returned first");
  expect((await updateMissionStatus(mission.id, "running")).status === "running", "mission status should update");
}

await runWorkspaceStoreContractTest();
