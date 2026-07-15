import {
  createProject,
  createMission,
  createSource,
  getProjectSourceCount,
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

function runWorkspaceStoreContractTest() {
  resetWorkspaceStoreForTests();

  const initialProjectCount = listProjects().length;
  const initialMissionCount = listMissions().length;
  const project = createProject({
    name: "Contract Test PKA",
    domain: "Quantity Surveying",
    owner: "knowledge_architect",
    objective: "Verify project creation stays connected to the local workspace store."
  });

  expect(listProjects().length === initialProjectCount + 1, "project creation should append one project");
  expect(
    listMissions().length === initialMissionCount + 1,
    "project creation should create one mission trace"
  );

  const source = createSource({
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
  expect(listSources()[0]?.id === source.id, "new source should be returned first");
  expect(getProjectSourceCount(project.id) === 1, "project source count should reflect created source");
  expect(
    listMissions().length === initialMissionCount + 2,
    "source creation should create one mission trace"
  );

  const mission = createMission({
    type: "validation",
    title: "Contract Test Mission",
    projectId: project.id,
    assignedTo: "reviewer",
    stage: "review",
    priority: "normal",
    status: "queued"
  });

  expect(listMissions()[0]?.id === mission.id, "new mission should be returned first");
  expect(updateMissionStatus(mission.id, "running").status === "running", "mission status should update");
}

runWorkspaceStoreContractTest();
