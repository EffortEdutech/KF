import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  acceptKnowledgeSuggestion,
  acceptRelationshipSuggestion,
  addSourceEvidenceToKnowledgeObject,
  assemblePkaPackage,
  attachSourceEvidenceToKnowledgeRelationship,
  createProject,
  createFailedIngestionFixture,
  createKnowledgeObject,
  createKnowledgeRelationship,
  createInvalidPkaReadbackFixtures,
  createManufacturingWorkOrderTrace,
  createMission,
  createSource,
  createReviewDecision,
  createRuntimeHandoffReadbackFixtures,
  createRuntimePkaImportFixtures,
  filterReleaseReadinessHints,
  getContinuousImprovementClosureReport,
  getKnowledgeObject,
  getKnowledgeObjectReviewReadinessHints,
  getManufacturingLineRunReport,
  getManufacturingWorkOrderReport,
  getPkaManufacturingClosureReport,
  getPkaComponentManufacturingReport,
  getPkaPackageAssemblyReadbackClosureReport,
  getPkaReleaseReadinessHints,
  getPkaPackageExportPreview,
  getPipelineQualityMetrics,
  getPipelineSourceCoverageReport,
  getPipelineSuggestionReviewReport,
  getPkaProductQualityReport,
  getProjectReadinessHints,
  getProjectGovernanceMetrics,
  getQsRfqPilotRunReport,
  getRfqEvidenceRegisterReport,
  getRfqWorkflowGateReport,
  getRelationshipEvidenceClosureReport,
  getRelationshipReadinessHints,
  getRuntimeQaAnswerReadinessReport,
  getRuntimeQaContextBundlePreview,
  getRuntimeQaFixtureEvaluationReport,
  getRuntimeConsumptionContractReport,
  getQsRfqPilotSourcePack,
  getProjectSourceCount,
  getSourceReadinessHints,
  importRuntimePkaArchive,
  listGovernanceHistory,
  listKnowledgeObjectVersionSnapshots,
  listKnowledgeObjects,
  listKnowledgeRelationships,
  listKnowledgeSuggestions,
  listRelationshipSuggestions,
  listMissions,
  listPersistedPkaExportFiles,
  listPkaPackages,
  listProjects,
  listRuntimeQaFixtureQuestions,
  listReviewQueue,
  listReviews,
  listRfqEvidenceRegisterEntries,
  listRfqWorkflowGateActions,
  listSourceChunks,
  listSources,
  publishPkaPackage,
  releaseBlockerTypeFromHintId,
  recordRuntimePkaImportDecision,
  recordRuntimeHandoffFeedback,
  recordRfqWorkflowGateAction,
  repairSourceArtifact,
  resetWorkspaceStoreForTests,
  retrySourceIngestion,
  runQsRfqPilotVerticalSlice,
  runSourceIngestion,
  updateKnowledgeSuggestionStatus,
  updatePkaPackageReleaseStatus,
  updateKnowledgeRelationshipProvenance,
  updateKnowledgeRelationshipReleaseExclusion,
  updateKnowledgeObject,
  updateKnowledgeObjectStatus,
  updateRelationshipSuggestionStatus,
  updateRfqEvidenceRegisterEntryStatus,
  updateRfqWorkflowGateAction,
  updateMissionStatus,
  validatePkaPackageReadback,
  validatePersistedPkaPackageReadback,
  validateRuntimeAppDeveloperHandoff,
  listRuntimeHandoffFeedback,
  validateRuntimePkaImportReadback,
  validatePkaManifest
} from "./workspace-store";

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function testWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.replace(/\\/g, "/").endsWith("/apps/studio") ? resolve(cwd, "..", "..") : cwd;
}

async function expectRejects(action: () => Promise<unknown>, message: string) {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(message);
}

async function runWorkspaceStoreContractTest() {
  resetWorkspaceStoreForTests();

  const pilotSourcePack = getQsRfqPilotSourcePack();
  const pilotResult = await runQsRfqPilotVerticalSlice("knowledge_engineer");
  expect(pilotResult.packageStatus === "published", "QS/RFQ pilot should publish a Base PKA package");
  expect(pilotResult.runtimeImportStatus === "importable", "QS/RFQ pilot package should import into runtime harness");
  expect(pilotResult.runtimeQaReady, "QS/RFQ pilot should make Runtime Q&A answer readiness pass");
  expect(pilotResult.fixtureEvaluationReady, "QS/RFQ pilot should make deterministic Q&A fixture evaluation pass");
  expect(pilotResult.evidenceRegisterReady, "QS/RFQ pilot should make the RFQ evidence register ready");
  expect(
    pilotResult.ingestedSourceIds.length === pilotSourcePack.sourceIds.length,
    "QS/RFQ pilot should ingest every source in the pilot source pack"
  );
  expect(
    pilotResult.acceptedKnowledgeObjectIds.length >= 8,
    "QS/RFQ pilot should promote all named BOQ/RFQ pilot suggestions into approved KOs"
  );
  const pilotEvidenceRegister = await listRfqEvidenceRegisterEntries(pilotSourcePack.projectId);
  expect(pilotEvidenceRegister.length >= 8, "QS/RFQ pilot should create structured RFQ evidence register entries");
  expect(
    pilotEvidenceRegister.some(
      (entry) =>
        entry.category === "issued_evidence" &&
        entry.tradeSection === "Structural concrete substructure" &&
        entry.status === "accepted"
    ),
    "QS/RFQ pilot should register accepted structural BOQ evidence"
  );
  expect(
    pilotEvidenceRegister.some(
      (entry) => entry.category === "missing_evidence" && entry.workflowGate === "approve_issue"
    ),
    "QS/RFQ pilot should register missing-evidence controls for approval/issue gates"
  );
  expect(
    (await listRfqEvidenceRegisterEntries({
      projectId: pilotSourcePack.projectId,
      category: "missing_evidence",
      workflowGate: "approve_issue",
      tradeSection: "Structural"
    })).some((entry) => entry.registerCode === "RFQ-EV-002"),
    "RFQ evidence register should support category, workflow gate, and trade-section filtering"
  );
  const clarificationEntry = pilotEvidenceRegister.find((entry) => entry.status === "clarification_required");
  expect(Boolean(clarificationEntry), "QS/RFQ pilot should include a clarification-required register entry");
  const initialWorkflowGateReport = await getRfqWorkflowGateReport(pilotSourcePack.projectId);
  expect(
    initialWorkflowGateReport.gates.some((gate) => gate.status === "blocked" && gate.remediationPrompts.length > 0),
    "RFQ workflow gates should expose remediation prompts for unresolved evidence controls"
  );
  const reviewedEvidenceEntry = await updateRfqEvidenceRegisterEntryStatus({
    entryId: clarificationEntry!.id,
    status: "accepted",
    actor: "reviewer",
    notes: "Accepted for contract-test workflow gate readiness."
  });
  expect(reviewedEvidenceEntry.status === "accepted", "reviewer should be able to accept an RFQ evidence entry");
  expect(
    (await listGovernanceHistory({ subjectId: reviewedEvidenceEntry.id })).some(
      (event) => event.action === "rfq_evidence_register.accepted"
    ),
    "RFQ evidence reviewer action should create a governance audit event"
  );
  const reviewedWorkflowGateReport = await getRfqWorkflowGateReport(pilotSourcePack.projectId);
  expect(
    reviewedWorkflowGateReport.gates.some(
      (gate) => gate.gate === reviewedEvidenceEntry.workflowGate && gate.clarificationRequiredCount === 0
    ),
    "accepted RFQ evidence should clear clarification-required gate counts"
  );
  await recordRfqWorkflowGateAction({
    projectId: pilotSourcePack.projectId,
    gate: "approve_issue",
    actionType: "attach_missing_evidence",
    owner: "knowledge_engineer",
    dueDate: "2026-07-24",
    status: "in_progress",
    actor: "reviewer",
    notes: "Assign QS engineer to close missing evidence before package issue.",
    evidenceEntryIds: pilotEvidenceRegister
      .filter((entry) => entry.workflowGate === "approve_issue")
      .map((entry) => entry.id)
  });
  const filteredGateActions = await listRfqWorkflowGateActions({
    projectId: pilotSourcePack.projectId,
    gate: "approve_issue",
    status: "in_progress",
    owner: "knowledge"
  });
  expect(filteredGateActions.length === 1, "RFQ workflow gate actions should support gate/status/owner filtering");
  expect(
    filteredGateActions[0].evidenceEntryIds.length >= 1,
    "RFQ workflow gate actions should link to one or more evidence register entries"
  );
  expect(
    (await listRfqWorkflowGateActions({
      projectId: pilotSourcePack.projectId,
      dueState: "due_future"
    })).some((action) => action.id === filteredGateActions[0].id),
    "RFQ workflow gate actions should support computed due-state filtering"
  );
  const closedGateAction = await updateRfqWorkflowGateAction({
    actionId: filteredGateActions[0].id,
    status: "resolved",
    actor: "reviewer",
    owner: "knowledge_engineer",
    dueDate: "2026-07-25",
    notes: "Closed after QS engineer confirmed missing evidence action.",
    evidenceEntryIds: filteredGateActions[0].evidenceEntryIds
  });
  expect(closedGateAction.status === "resolved", "RFQ workflow gate action should be closable");
  expect(
    (await listRfqWorkflowGateActions({
      projectId: pilotSourcePack.projectId,
      status: "resolved",
      owner: "knowledge"
    })).some((action) => action.id === closedGateAction.id),
    "RFQ workflow gate action history should support resolved-status filtering"
  );
  const workflowGateActionReport = await getRfqWorkflowGateReport(pilotSourcePack.projectId);
  expect(
    workflowGateActionReport.gates.some(
      (gate) =>
        gate.gate === "approve_issue" &&
        gate.followUp?.owner === "knowledge_engineer" &&
        gate.followUp.status === "resolved" &&
        gate.followUp.dueDate === "2026-07-25"
    ),
    "RFQ workflow gate report should expose owner, due date, and follow-up status"
  );
  const pilotEvidenceRegisterReport = await getRfqEvidenceRegisterReport(pilotSourcePack.projectId);
  expect(pilotEvidenceRegisterReport.ready, "QS/RFQ pilot evidence register should prepare workflow gate readiness");
  const pilotFixtureEvaluation = await getRuntimeQaFixtureEvaluationReport(pilotSourcePack.projectId);
  expect(
    pilotFixtureEvaluation.evaluations.every((evaluation) => evaluation.status === "ready"),
    "QS/RFQ pilot fixture evaluation should mark every fixture ready"
  );
  expect(
    pilotFixtureEvaluation.evaluations.some((evaluation) =>
      evaluation.deterministicAnswer.includes("Before issuing an RFQ package")
    ),
    "QS/RFQ pilot fixture evaluation should include deterministic RFQ completeness answer"
  );
  const pilotRunReport = await getQsRfqPilotRunReport();
  expect(pilotRunReport.status === "ready", "QS/RFQ pilot run report should mark the vertical slice ready");
  expect(
    pilotRunReport.stages.some((stage) => stage.id === "pilot-package" && stage.level === "ready"),
    "QS/RFQ pilot run report should confirm package handoff readiness"
  );
  const pilotExportPreview = await getPkaPackageExportPreview(pilotSourcePack.projectId);
  expect(
    Boolean(
      pilotExportPreview?.files.some((file) => file.path === "workflows/rfq-package-issue-workflow.json") &&
        pilotExportPreview.files.some((file) => file.path === "runtime/app-developer-handoff.json") &&
        pilotExportPreview.files.some((file) => file.path === "sources/rfq-evidence-register.json")
    ),
    "QS/RFQ pilot export should include RFQ workflow placeholder, app developer handoff index, and evidence register"
  );
  const governanceExport = pilotExportPreview?.files.find((file) => file.path === "governance/index.json");
  expect(
    Boolean(governanceExport?.contents && "rfqWorkflowGateSummary" in governanceExport.contents),
    "QS/RFQ pilot governance export should include RFQ workflow gate summary"
  );
  expect(
    Boolean(governanceExport?.contents && "rfqEvidenceDecisionSummary" in governanceExport.contents),
    "QS/RFQ pilot governance export should include RFQ evidence reviewer decision summary"
  );
  expect(
    Boolean(governanceExport?.contents && "rfqWorkflowGateActionSummary" in governanceExport.contents),
    "QS/RFQ pilot governance export should include RFQ workflow gate action summary"
  );
  const reusedPilotResult = await runQsRfqPilotVerticalSlice({ actor: "knowledge_engineer" });
  expect(reusedPilotResult.mode === "reused_existing", "QS/RFQ pilot rerun should reuse the current published package");
  expect(
    reusedPilotResult.packageId === pilotResult.packageId,
    "QS/RFQ pilot rerun should not create a new package version when the current package is ready"
  );
  const manufacturingClosureReport = await getPkaManufacturingClosureReport(pilotSourcePack.projectId);
  expect(
    manufacturingClosureReport.disposition !== "release_blocked",
    "QS/RFQ pilot should validate a non-blocked generic PKA manufacturing closure disposition"
  );
  expect(
    manufacturingClosureReport.reworkRoutes.some((route) => route.workOrderId === "graph-governance") ||
      manufacturingClosureReport.acceptedSignals.length >= 3,
    "manufacturing closure should either accept release or route rework into the factory work orders"
  );
  const relationshipClosureReport = await getRelationshipEvidenceClosureReport(pilotSourcePack.projectId);
  expect(
    relationshipClosureReport.releaseGradeCount > 0,
    "relationship closure should identify package-relevant release-grade relationships"
  );
  expect(
    relationshipClosureReport.needsReworkCount > 0,
    "relationship closure should identify working graph edges that still need rework or release exclusion"
  );
  for (const item of relationshipClosureReport.items.filter((closureItem) => closureItem.status === "needs_rework")) {
    await updateKnowledgeRelationshipReleaseExclusion({
      relationshipId: item.relationshipId,
      excluded: true,
      reason: "Contract test excludes working edge from this package release.",
      actor: "reviewer"
    });
  }
  const closedRelationshipClosureReport = await getRelationshipEvidenceClosureReport(pilotSourcePack.projectId);
  expect(
    closedRelationshipClosureReport.ready,
    "relationship closure should be ready once non-release-grade working edges are explicitly excluded"
  );
  const acceptedManufacturingClosureReport = await getPkaManufacturingClosureReport(pilotSourcePack.projectId);
  expect(
    acceptedManufacturingClosureReport.disposition === "accepted_for_release",
    "manufacturing closure should reach accepted_for_release after relationship/evidence closure"
  );

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

  const ingestionResult = await runSourceIngestion({
    sourceId: source.id,
    actor: "knowledge_engineer"
  });

  expect(ingestionResult.mission.stage === "pipeline-ingestion", "source ingestion should create a pipeline mission");
  expect(ingestionResult.chunks.length > 0, "source ingestion should create deterministic chunks");
  expect(ingestionResult.suggestions.length > 0, "source ingestion should create KO suggestions");
  expect(
    ingestionResult.relationshipSuggestions.length > 0,
    "source ingestion should create deterministic relationship suggestions when enough KO suggestions exist"
  );
  expect((await listSourceChunks({ sourceId: source.id })).length === ingestionResult.chunks.length, "chunks should be listable by source");
  expect(
    (await listKnowledgeSuggestions({ sourceId: source.id, status: "pending" })).length ===
      ingestionResult.suggestions.length,
    "pending suggestions should be listable by source"
  );
  expect(
    (await listRelationshipSuggestions({ sourceId: source.id, status: "pending" })).length ===
      ingestionResult.relationshipSuggestions.length,
    "pending relationship suggestions should be listable by source"
  );

  const acceptedSuggestion = await acceptKnowledgeSuggestion({
    suggestionId: ingestionResult.suggestions[0].id,
    actor: "knowledge_engineer"
  });

  expect(
    acceptedSuggestion.suggestion.status === "accepted",
    "accepted suggestion should move out of the pending queue"
  );
  expect(
    acceptedSuggestion.knowledgeObject.status === "ai_generated",
    "accepted suggestion should create an AI-generated draft KO"
  );
  expect(
    acceptedSuggestion.knowledgeObject.evidenceLinks.some((evidence) => evidence.sourceId === source.id),
    "suggestion-created KO should preserve source evidence"
  );
  expect(
    (await listGovernanceHistory({ subjectId: ingestionResult.suggestions[0].id })).some(
      (event) => event.action === "pipeline.suggestion_accepted"
    ),
    "suggestion acceptance should create a governance history event"
  );
  const acceptedSecondSuggestion = await acceptKnowledgeSuggestion({
    suggestionId: ingestionResult.suggestions[1].id,
    actor: "knowledge_engineer"
  });
  expect(
    acceptedSecondSuggestion.knowledgeObject.status === "ai_generated",
    "second accepted suggestion should also create an AI-generated draft KO"
  );
  const acceptedRelationshipSuggestion = await acceptRelationshipSuggestion({
    relationshipSuggestionId: ingestionResult.relationshipSuggestions[0].id,
    actor: "knowledge_engineer"
  });
  expect(
    acceptedRelationshipSuggestion.suggestion.status === "accepted",
    "relationship suggestion should move out of the pending queue after acceptance"
  );
  expect(
    acceptedRelationshipSuggestion.relationship.status === "draft",
    "accepted relationship suggestion should create a draft graph edge"
  );
  expect(
    (await listGovernanceHistory({ subjectId: ingestionResult.relationshipSuggestions[0].id })).some(
      (event) => event.action === "pipeline.relationship_suggestion_accepted"
    ),
    "relationship suggestion acceptance should create a governance history event"
  );
  const acceptedPipelineMetrics = await getPipelineQualityMetrics({ projectId: project.id, sourceId: source.id });
  expect(acceptedPipelineMetrics.chunkCount === ingestionResult.chunks.length, "pipeline metrics should count source chunks");
  expect(
    acceptedPipelineMetrics.acceptedSuggestionCount >= 3,
    "pipeline metrics should count accepted KO and relationship suggestions"
  );
  expect(acceptedPipelineMetrics.acceptanceRate > 0, "pipeline metrics should calculate acceptance ratio");
  await updateKnowledgeRelationshipProvenance({
    relationshipId: acceptedRelationshipSuggestion.relationship.id,
    provenanceNote: "Pipeline relationship suggestion reviewed and accepted for contract test.",
    confidence: 82,
    status: "approved",
    actor: "reviewer"
  });
  await updateKnowledgeObjectStatus({
    id: acceptedSuggestion.knowledgeObject.id,
    status: "approved",
    reviewer: "reviewer"
  });
  await updateKnowledgeObjectStatus({
    id: acceptedSecondSuggestion.knowledgeObject.id,
    status: "approved",
    reviewer: "reviewer"
  });
  const retryResult = await retrySourceIngestion({
    sourceId: source.id,
    actor: "knowledge_engineer"
  });
  expect(retryResult.chunks.length > 0, "retry should regenerate source chunks");
  expect(retryResult.relationshipSuggestions.length > 0, "retry should regenerate relationship suggestions");
  const deferredKnowledgeSuggestion = await updateKnowledgeSuggestionStatus({
    suggestionId: retryResult.suggestions[0].id,
    status: "deferred",
    actor: "reviewer",
    reviewNotes: "Contract test defers this KO suggestion for stronger evidence."
  });
  expect(deferredKnowledgeSuggestion.status === "deferred", "KO suggestion should support defer decisions");
  expect(
    (await listKnowledgeSuggestions({ sourceId: source.id, status: "deferred" })).some(
      (item) => item.id === deferredKnowledgeSuggestion.id
    ),
    "deferred KO suggestions should be filterable"
  );
  const deferredRelationshipSuggestion = await updateRelationshipSuggestionStatus({
    relationshipSuggestionId: retryResult.relationshipSuggestions[0].id,
    status: "deferred",
    actor: "reviewer",
    reviewNotes: "Contract test defers this relationship suggestion for more evidence."
  });
  expect(
    deferredRelationshipSuggestion.status === "deferred",
    "relationship suggestion should support defer decisions"
  );
  expect(
    (await listRelationshipSuggestions({ sourceId: source.id, status: "deferred" })).some(
      (item) => item.id === deferredRelationshipSuggestion.id
    ),
    "deferred relationship suggestions should be filterable"
  );
  const deferredPipelineMetrics = await getPipelineQualityMetrics({ projectId: project.id, sourceId: source.id });
  expect(deferredPipelineMetrics.deferredSuggestionCount === 2, "pipeline metrics should count deferred KO and relationship suggestions");
  expect(deferredPipelineMetrics.retriedJobCount >= 1, "pipeline metrics should count retry jobs");
  const suggestionReviewReport = await getPipelineSuggestionReviewReport({
    projectId: project.id,
    sourceId: source.id
  });
  expect(suggestionReviewReport.totalSuggestions >= 2, "suggestion review report should count deterministic suggestions");
  expect(
    suggestionReviewReport.knowledgeSuggestionCount > 0 && suggestionReviewReport.relationshipSuggestionCount > 0,
    "suggestion review report should separate KO and relationship suggestion counts"
  );
  expect(suggestionReviewReport.deferredCount === 2, "suggestion review report should count deferred decisions");
  expect(
    suggestionReviewReport.reviewNotesCount >= 2,
    "suggestion review report should count reviewer notes coverage"
  );
  const failedFixtureMission = await createFailedIngestionFixture({
    sourceId: source.id,
    actor: "knowledge_engineer"
  });
  expect(failedFixtureMission.status === "failed", "failed ingestion fixture should create a failed mission");
  expect(
    (await listMissions()).some(
      (mission) => mission.id === failedFixtureMission.id && mission.stage === "pipeline-ingestion"
    ),
    "failed ingestion fixture should be visible as a pipeline mission"
  );
  const unsupportedSource = await createSource({
    projectId: project.id,
    title: "Unsupported Artifact Source",
    category: "company_document",
    domain: "Quantity Surveying",
    owner: "knowledge_engineer",
    version: "0.1",
    reliability: "test fixture",
    usagePolicy: "local test only",
    boundary: "base_pka_input"
  });
  await createFailedIngestionFixture({
    sourceId: unsupportedSource.id,
    actor: "knowledge_engineer",
    fixtureType: "unsupported_file"
  });
  const unsupportedIngestion = await runSourceIngestion({
    sourceId: unsupportedSource.id,
    actor: "knowledge_engineer"
  });
  expect(unsupportedIngestion.mission.status === "failed", "unsupported artifact ingestion should fail deterministically");
  expect(unsupportedIngestion.chunks.length === 0, "unsupported artifact ingestion should not create chunks");
  const repairMission = await repairSourceArtifact({
    sourceId: unsupportedSource.id,
    actor: "knowledge_engineer"
  });
  expect(repairMission.status === "retried", "source artifact repair should create a retry mission");
  expect(
    (await listGovernanceHistory({ subjectId: unsupportedSource.id })).some(
      (event) => event.action === "pipeline.source_artifact_repaired"
    ),
    "source artifact repair should create a pipeline audit event"
  );
  const repairedIngestion = await runSourceIngestion({
    sourceId: unsupportedSource.id,
    actor: "knowledge_engineer"
  });
  expect(repairedIngestion.chunks.length > 0, "repaired artifact ingestion should create chunks");
  expect(repairedIngestion.suggestions.length > 0, "repaired artifact ingestion should create suggestions");
  const emptySource = await createSource({
    projectId: project.id,
    title: "Empty Artifact Source",
    category: "company_document",
    domain: "Quantity Surveying",
    owner: "knowledge_engineer",
    version: "0.1",
    reliability: "test fixture",
    usagePolicy: "local test only",
    boundary: "base_pka_input"
  });
  await createFailedIngestionFixture({
    sourceId: emptySource.id,
    actor: "knowledge_engineer",
    fixtureType: "empty_artifact"
  });
  const emptyIngestion = await runSourceIngestion({
    sourceId: emptySource.id,
    actor: "knowledge_engineer"
  });
  expect(emptyIngestion.mission.status === "failed", "empty artifact ingestion should fail deterministically");
  expect(emptyIngestion.suggestions.length === 0, "empty artifact ingestion should not create suggestions");
  await repairSourceArtifact({
    sourceId: emptySource.id,
    actor: "knowledge_engineer",
    repairText: [
      "User supplied repair text for deterministic source ingestion.",
      "It contains enough content for chunking and describes source registration, extraction, review, and package handoff.",
      "The second paragraph covers evidence handling, suggestion review, relationship provenance, and reviewer accountability.",
      "The third paragraph covers runtime import boundaries, Base PKA packaging, and deterministic source coverage reporting."
    ].join(" ")
  });
  const repairedEmptyIngestion = await runSourceIngestion({
    sourceId: emptySource.id,
    actor: "knowledge_engineer"
  });
  expect(repairedEmptyIngestion.chunks.length > 0, "user-supplied repair text should allow ingestion");
  expect(repairedEmptyIngestion.chunks.length > 1, "long repaired artifact should create multi-chunk coverage");
  const markdownArtifactSource = await createSource({
    projectId: project.id,
    title: "Markdown Artifact Source",
    category: "architecture_note",
    domain: "Quantity Surveying",
    owner: "knowledge_engineer",
    version: "0.1",
    reliability: "test fixture",
    usagePolicy: "local test only",
    boundary: "base_pka_input",
    storagePath: "docs/implementation/PKA Anatomy and Runtime Boundary.md"
  });
  const markdownIngestion = await runSourceIngestion({
    sourceId: markdownArtifactSource.id,
    actor: "knowledge_engineer"
  });
  expect(markdownIngestion.chunks.length > 1, "Markdown artifact source should create multi-chunk coverage");
  const failedPipelineMetrics = await getPipelineQualityMetrics({ projectId: project.id });
  expect(failedPipelineMetrics.failedJobCount >= 3, "pipeline metrics should count failed ingestion jobs");
  const sourceCoverageReport = await getPipelineSourceCoverageReport({ projectId: project.id });
  expect(sourceCoverageReport.sourceCount >= 3, "source coverage report should count project sources");
  expect(sourceCoverageReport.ingestedSourceCount >= 3, "source coverage report should count ingested sources");
  expect(sourceCoverageReport.multiChunkSourceCount >= 2, "source coverage report should detect multi-source multi-chunk coverage");
  expect(sourceCoverageReport.totalSuggestions > 0, "source coverage report should count KO and relationship suggestions");
  expect(
    sourceCoverageReport.profileCounts.markdown_artifact >= 1 && sourceCoverageReport.profileCounts.text_artifact >= 1,
    "source coverage report should count extraction profiles"
  );
  const markdownCoverageReport = await getPipelineSourceCoverageReport({
    projectId: project.id,
    extractionProfile: "markdown_artifact"
  });
  expect(
    markdownCoverageReport.items.length >= 1 &&
      markdownCoverageReport.items.every((item) => item.extractionProfile === "markdown_artifact"),
    "source coverage report should filter by extraction profile"
  );
  expect(
    sourceCoverageReport.items.some((item) => item.sourceId === emptySource.id && item.coverageRate === 100),
    "source coverage report should show repaired source chunks are covered by suggestions"
  );

  const knowledgeObject = await createKnowledgeObject({
    projectId: project.id,
    title: "Contract Test Knowledge Object",
    objectType: "rule",
    domain: "Quantity Surveying",
    description: "A test rule should keep source evidence attached to the draft Knowledge Object.",
    owner: "knowledge_engineer",
    author: "knowledge_engineer",
    tags: ["contract-test", "evidence"],
    confidence: 75,
    sourceId: source.id,
    evidenceExcerpt: "Evidence excerpt fixture",
    evidenceLocator: "fixture:1",
    evidenceConfidence: 80
  });

  expect((await listKnowledgeObjects({ projectId: project.id }))[0]?.id === knowledgeObject.id, "new KO should be returned first");
  expect((await getKnowledgeObject(knowledgeObject.id))?.evidenceLinks.length === 1, "KO should keep one source evidence link");
  expect(
    (await listProjects()).find((item) => item.id === project.id)?.knowledgeObjectCount === 1,
    "project KO count should reflect created Knowledge Object"
  );

  const editedKnowledgeObject = await updateKnowledgeObject({
    id: knowledgeObject.id,
    title: "Edited Contract Test Knowledge Object",
    objectType: "rule",
    domain: "Quantity Surveying",
    description: "Edited draft KOs should remain mutable before approval.",
    owner: "knowledge_engineer",
    author: "knowledge_engineer",
    tags: ["contract-test", "edited"],
    confidence: 82
  });

  expect(editedKnowledgeObject.title.includes("Edited"), "draft KO should be editable");
  expect(editedKnowledgeObject.version === "0.1.1", "draft KO edit should bump the patch version");
  expect(
    (await listGovernanceHistory({ subjectId: knowledgeObject.id })).some(
      (event) => event.action === "knowledge_object.updated"
    ),
    "KO edit should create a governance history event"
  );
  expect(
    (await listKnowledgeObjectVersionSnapshots(knowledgeObject.id)).some(
      (snapshot) => snapshot.version === "0.1.0"
    ),
    "KO edit should capture the previous version snapshot"
  );

  const relatedKnowledgeObject = await createKnowledgeObject({
    projectId: project.id,
    title: "Contract Test Related Knowledge Object",
    objectType: "concept",
    domain: "Quantity Surveying",
    description: "A second KO is needed to test relationship creation.",
    owner: "knowledge_engineer",
    author: "knowledge_engineer",
    tags: ["contract-test", "relationship"],
    confidence: 70
  });

  expect(
    getRelationshipReadinessHints(knowledgeObject, []).some((hint) => hint.id === "isolated-knowledge-object"),
    "isolated KO should report missing relationship quality hint"
  );
  expect(
    getKnowledgeObjectReviewReadinessHints(knowledgeObject, []).some(
      (hint) => hint.id === "not-approved-for-release"
    ),
    "draft KO should block release until approved"
  );

  const relationship = await createKnowledgeRelationship({
    projectId: project.id,
    fromId: knowledgeObject.id,
    toId: relatedKnowledgeObject.id,
    type: "supports",
    confidence: 64,
    provenanceNote: "Contract test relationship"
  });

  expect(
    (await listKnowledgeRelationships({ knowledgeObjectId: knowledgeObject.id })).some(
      (item) => item.id === relationship.id
    ),
    "created relationship should be listed for the source KO"
  );
  expect(
    (await listKnowledgeRelationships({ knowledgeObjectId: knowledgeObject.id, relationshipType: "supports" })).some(
      (item) => item.id === relationship.id
    ),
    "relationship type filter should include matching edges"
  );
  expect(
    (await listKnowledgeRelationships({ knowledgeObjectId: knowledgeObject.id, relationshipType: "contradicts" }))
      .length === 0,
    "relationship type filter should exclude non-matching edges"
  );
  expect(
    (await listKnowledgeRelationships({ knowledgeObjectId: knowledgeObject.id, qualityState: "needs_review" })).some(
      (item) => item.id === relationship.id
    ),
    "relationship quality filter should include draft edges needing review"
  );
  expect(
    (await listGovernanceHistory({ subjectId: knowledgeObject.id })).some(
      (event) => event.action === "knowledge_relationship.created"
    ),
    "relationship creation should appear in KO governance history"
  );
  expect(
    getRelationshipReadinessHints(knowledgeObject, [relationship]).some(
      (hint) => hint.id === "draft-relationships"
    ),
    "draft relationship should report review readiness hint"
  );

  expect(
    (await updateKnowledgeObjectStatus({ id: knowledgeObject.id, status: "under_review", reviewer: "reviewer" }))
      .status === "under_review",
    "KO lifecycle should transition to under review"
  );
  expect(
    (await listReviewQueue(project.id)).some((item) => item.id === knowledgeObject.id),
    "under-review KO should appear in the review queue"
  );
  expect(
    (await getProjectGovernanceMetrics(project.id)).underReviewCount === 1,
    "governance metrics should count under-review KOs"
  );

  const reviewDecision = await createReviewDecision({
    knowledgeObjectId: knowledgeObject.id,
    reviewer: "reviewer",
    decision: "changes_requested",
    notes: "Contract test reviewer notes"
  });

  expect(
    reviewDecision.knowledgeObject.status === "changes_requested",
    "review request-changes decision should update KO status"
  );
  expect(
    (await listReviews({ knowledgeObjectId: knowledgeObject.id })).some(
      (review) => review.decision === "changes_requested" && review.notes === "Contract test reviewer notes"
    ),
    "review decision should store reviewer notes"
  );
  expect(
    (await listReviews({ projectId: project.id, decision: "changes_requested", reviewer: "reviewer" })).some(
      (review) => review.knowledgeObjectId === knowledgeObject.id
    ),
    "review list should filter by project, decision, and reviewer"
  );
  expect(
    (await listGovernanceHistory({ subjectId: knowledgeObject.id })).some(
      (event) => event.action === "knowledge_object.reviewed"
    ),
    "review decision should create a governance history event"
  );

  const rejectedReview = await createReviewDecision({
    knowledgeObjectId: relatedKnowledgeObject.id,
    reviewer: "reviewer",
    decision: "rejected",
    notes: "Contract test rejection"
  });

  expect(
    rejectedReview.knowledgeObject.status === "rejected",
    "review reject decision should update KO status"
  );
  expect(
    (await getPkaReleaseReadinessHints(project.id)).some((hint) =>
      hint.id.includes("not-approved-for-release")
    ),
    "PKA release readiness should block unapproved or rejected KOs"
  );
  expect(
    filterReleaseReadinessHints(await getPkaReleaseReadinessHints(project.id), "not-approved-for-release").some(
      (hint) => releaseBlockerTypeFromHintId(hint.id) === "not-approved-for-release"
    ),
    "PKA release readiness should support filtering by blocker type"
  );

  expect(
    (await addSourceEvidenceToKnowledgeObject({
      knowledgeObjectId: relatedKnowledgeObject.id,
      sourceId: source.id,
      excerpt: "Related KO evidence fixture",
      locator: "fixture:2",
      confidence: 76,
      actor: "knowledge_engineer"
    })).sourceId === source.id,
    "inline remediation should add source evidence to an existing KO"
  );
  expect(
    (await updateKnowledgeRelationshipProvenance({
      relationshipId: relationship.id,
      provenanceNote: "Approved relationship provenance after remediation",
      confidence: 82,
      status: "approved",
      actor: "knowledge_engineer"
    })).status === "approved",
    "inline remediation should update relationship provenance and status"
  );
  const relationshipWithEvidence = await attachSourceEvidenceToKnowledgeRelationship({
    relationshipId: relationship.id,
    sourceId: source.id,
    excerpt: "Relationship source evidence fixture",
    locator: "fixture:relationship",
    confidence: 84,
    actor: "knowledge_engineer"
  });
  expect(
    relationshipWithEvidence.evidenceSourceId === source.id &&
      relationshipWithEvidence.evidenceExcerpt === "Relationship source evidence fixture",
    "relationship evidence remediation should attach structured source evidence"
  );
  expect(
    (await listGovernanceHistory({ subjectId: relationship.id })).some(
      (event) => event.action === "knowledge_relationship.evidence_attached"
    ),
    "relationship evidence attachment should create a governance history event"
  );
  expect(
    validatePkaManifest({
      packageId: "",
      name: "Invalid Fixture",
      version: "",
      domain: "",
      description: "",
      publisher: "",
      governanceStatus: "draft",
      requiredRuntimeCapabilities: [],
      objectTypes: [],
      relationshipTypes: [],
      knowledgeObjectCount: 0,
      relationshipCount: 0,
      sourceReferenceCount: 0
    }).some((item) => item.level === "warning"),
    "invalid manifest fixture should surface validation warnings"
  );

  expect(
    (await updateKnowledgeObjectStatus({ id: knowledgeObject.id, status: "approved", reviewer: "reviewer" })).status ===
      "approved",
    "KO lifecycle should transition to approved"
  );
  expect(
    (await listGovernanceHistory({ subjectId: knowledgeObject.id })).some(
      (event) => event.action === "knowledge_object.transitioned"
    ),
    "KO transition should create a governance history event"
  );
  expect(
    (await updateKnowledgeObjectStatus({ id: relatedKnowledgeObject.id, status: "approved", reviewer: "reviewer" }))
      .status === "approved",
    "related KO should transition to approved after remediation"
  );
  expect(
    !(await getPkaReleaseReadinessHints(project.id)).some((hint) => hint.level === "warning"),
    "release readiness should clear after evidence, relationship, and approval remediation"
  );
  const pkaPackage = await assemblePkaPackage({
    projectId: project.id,
    name: "Contract Test Base PKA",
    version: "0.1.0",
    publisher: "publisher"
  });
  expect(pkaPackage.packageId.startsWith("pka-contract-test-pka"), "PKA package should get a stable package id");
  const draftRuntimeQaReadiness = await getRuntimeQaAnswerReadinessReport(project.id);
  expect(
    draftRuntimeQaReadiness.missingPublishedPackageCount === 1 && !draftRuntimeQaReadiness.ready,
    "runtime Q&A answer readiness should block before package publication"
  );
  expect(
    (await listPkaPackages(project.id)).some((item) => item.id === pkaPackage.id),
    "assembled PKA package should be listed for the project"
  );
  const exportPreview = await getPkaPackageExportPreview(project.id);
  expect(
    Boolean(
      exportPreview?.files.some((file) => file.path === "manifest.json") &&
        exportPreview.files.some((file) => file.path === "graph/relationships.json") &&
        exportPreview.files.some((file) => file.path === "governance/index.json")
    ),
    "PKA export preview should include manifest, graph, and governance files"
  );
  expect(
    Boolean(
      exportPreview?.componentIndex.some(
        (component) => component.kind === "runtime_configuration" && component.governanceStatus === "placeholder"
      )
    ),
    "PKA export preview should include runtime configuration placeholder component"
  );
  const componentManufacturingReport = await getPkaComponentManufacturingReport(project.id);
  expect(
    componentManufacturingReport.ready,
    "component manufacturing report should distinguish required components from intentional placeholders"
  );
  expect(
    componentManufacturingReport.items.some(
      (item) => item.kind === "workflow" && item.path === "workflows/rfq-package-issue-workflow.json" && item.status === "manufactured"
    ),
    "component manufacturing report should treat the RFQ workflow contract as a manufactured package component"
  );
  expect(
    componentManufacturingReport.items.some(
      (item) => item.kind === "prompt_library" && item.status === "intentional_placeholder"
    ),
    "component manufacturing report should keep prompt libraries as intentional placeholders until model integration is approved"
  );
  const productQualityReport = await getPkaProductQualityReport(project.id);
  expect(
    productQualityReport.items.length === 5,
    "PKA product quality report should expose the five release-grade quality categories"
  );
  expect(
    productQualityReport.score >= 70,
    "manufactured package should reach at least pilot-ready PKA product quality"
  );
  expect(
    productQualityReport.items.some((item) => item.category === "source_quality" && item.score > 0) &&
      productQualityReport.items.some((item) => item.category === "package_completeness" && item.score > 0),
    "PKA product quality report should measure source quality and package completeness"
  );
  const persistedExportFiles = await listPersistedPkaExportFiles(pkaPackage.packageId);
  expect(
    persistedExportFiles.some((file) => file.path === "manifest.json") &&
      persistedExportFiles.some((file) => file.path === "package-archive.json") &&
      persistedExportFiles.some((file) => file.path === "package.zip"),
    "PKA assembly should persist manifest, JSON archive, and ZIP archive files"
  );
  await expectRejects(
    () =>
      assemblePkaPackage({
        projectId: project.id,
        name: "Contract Test Base PKA",
        version: "0.1.0",
        publisher: "publisher"
      }),
    "same-version package replacement should require confirmation"
  );
  const replacedPackage = await assemblePkaPackage({
    projectId: project.id,
    name: "Contract Test Base PKA",
    version: "0.1.0",
    publisher: "publisher",
    confirmReplacement: true
  });
  expect(replacedPackage.replacementSequence === 1, "confirmed replacement should increment sequence");
  await expectRejects(
    () => publishPkaPackage(replacedPackage.id),
    "draft package should reject direct publication before release approval"
  );
  const reviewPackage = await updatePkaPackageReleaseStatus({
    packageRecordId: replacedPackage.id,
    status: "under_review",
    actor: "reviewer",
    notes: "Package release review opened for test."
  });
  expect(reviewPackage.status === "under_review", "package release review should mark package under_review");
  const changesRequestedPackage = await updatePkaPackageReleaseStatus({
    packageRecordId: replacedPackage.id,
    status: "changes_requested",
    actor: "reviewer",
    notes: "Package release needs change before approval."
  });
  expect(
    changesRequestedPackage.status === "changes_requested",
    "package release changes_requested should return package to correction state"
  );
  await expectRejects(
    () => publishPkaPackage(changesRequestedPackage.id),
    "changes_requested package should reject publication before approval"
  );
  const resubmittedPackage = await updatePkaPackageReleaseStatus({
    packageRecordId: replacedPackage.id,
    status: "under_review",
    actor: "reviewer",
    notes: "Package release review resubmitted after changes."
  });
  expect(resubmittedPackage.status === "under_review", "package release review should allow resubmission");
  const approvedPackage = await updatePkaPackageReleaseStatus({
    packageRecordId: replacedPackage.id,
    status: "approved",
    actor: "publisher",
    notes: "Package release approved for test."
  });
  expect(approvedPackage.status === "approved", "package release approval should mark package approved");
  const blockedGateAction = await recordRfqWorkflowGateAction({
    projectId: project.id,
    gate: "approve_issue",
    actionType: "resolve_commercial_exception",
    owner: "publisher",
    dueDate: "2026-07-17",
    status: "blocked",
    actor: "reviewer",
    notes: "Commercial exception must be resolved before publishing."
  });
  await expectRejects(
    () => publishPkaPackage(approvedPackage.id),
    "blocked RFQ workflow gate actions should hard-block package publication"
  );
  await updateRfqWorkflowGateAction({
    actionId: blockedGateAction.id,
    status: "resolved",
    actor: "reviewer",
    owner: "publisher",
    dueDate: "2026-07-18",
    notes: "Commercial exception cleared for publish."
  });
  const publishedPackage = await publishPkaPackage({
    packageRecordId: approvedPackage.id,
    actor: "publisher",
    notes: "Package published through release workflow."
  });
  expect(publishedPackage.status === "published", "package publish should mark export immutable");
  const runtimeQaContextBundle = await getRuntimeQaContextBundlePreview(project.id);
  expect(runtimeQaContextBundle.packageStatus === "published", "runtime Q&A context should use a published package");
  expect(
    runtimeQaContextBundle.knowledgeObjects.length > 0 &&
      runtimeQaContextBundle.knowledgeObjects.every((item) => item.status === "approved"),
    "runtime Q&A context should expose approved Knowledge Objects only"
  );
  expect(
    runtimeQaContextBundle.sourceEvidence.length > 0,
    "runtime Q&A context should include source evidence citation candidates"
  );
  expect(
    runtimeQaContextBundle.runtimeInstructions.some((instruction) => instruction.includes("approved")),
    "runtime Q&A context should include approved-only runtime instructions"
  );
  expect(
    listRuntimeQaFixtureQuestions().every((fixture) => fixture.expectedCitationRequirement.includes("cite")),
    "runtime Q&A fixture questions should define citation requirements"
  );
  const runtimeQaAnswerReadiness = await getRuntimeQaAnswerReadinessReport(project.id);
  expect(runtimeQaAnswerReadiness.ready, "runtime Q&A answer readiness should pass after package publication");
  expect(
    runtimeQaAnswerReadiness.missingCitationCount === 0 &&
      runtimeQaAnswerReadiness.missingPublishedPackageCount === 0 &&
      runtimeQaAnswerReadiness.missingApprovedKnowledgeObjectCount === 0 &&
      runtimeQaAnswerReadiness.missingGovernedRelationshipCount === 0,
    "runtime Q&A answer readiness should clear missing package, knowledge, citation, and relationship blockers"
  );
  const packageHistory = await listGovernanceHistory({ subjectId: replacedPackage.id });
  expect(
      packageHistory.some((event) => event.action === "pka_package.under_review") &&
      packageHistory.some((event) => event.action === "pka_package.changes_requested") &&
      packageHistory.some((event) => event.action === "pka_package.approved") &&
      packageHistory.some((event) => event.action === "pka_package.published"),
    "package release decisions should create governance history events"
  );
  const releaseExportPreview = await getPkaPackageExportPreview(project.id);
  expect(
    validatePkaPackageReadback(releaseExportPreview).every((item) => item.level === "ready"),
    "package archive and ZIP readback validation should pass"
  );
  const governanceFile = releaseExportPreview?.files.find((file) => file.path === "governance/index.json");
  const governanceContents = governanceFile?.contents as
    | { releaseDecisionSummary?: { items?: Array<{ status: string; decisions: unknown[] }> } }
    | undefined;
  expect(
    Boolean(
      governanceContents?.releaseDecisionSummary?.items?.some(
        (item) => item.status === "published" && item.decisions.some(Boolean)
      )
    ),
    "governance export should include package release decision summaries"
  );
  const persistedGovernance = JSON.parse(
    await readFile(
      resolve(testWorkspaceRoot(), "storage", "exports", publishedPackage.packageId, "governance", "index.json"),
      "utf8"
    )
  ) as { releaseDecisionSummary?: { items?: Array<{ status: string; decisions: unknown[] }> } };
  expect(
    Boolean(
      persistedGovernance.releaseDecisionSummary?.items?.some(
        (item) => item.status === "published" && item.decisions.some(Boolean)
      )
    ),
    "persisted governance export should be refreshed after package publication"
  );
  const persistedArchive = JSON.parse(
    await readFile(
      resolve(testWorkspaceRoot(), "storage", "exports", publishedPackage.packageId, "package-archive.json"),
      "utf8"
    )
  ) as { files?: Array<{ path: string; contents?: { releaseDecisionSummary?: { items?: unknown[] } } }> };
  expect(
    Boolean(
      persistedArchive.files?.some(
        (file) => file.path === "governance/index.json" && file.contents?.releaseDecisionSummary?.items?.length
      )
    ),
    "persisted JSON archive should include governance release summaries"
  );
  const persistedZipText = (
    await readFile(resolve(testWorkspaceRoot(), "storage", "exports", publishedPackage.packageId, "package.zip"))
  ).toString("utf8");
  expect(
    persistedZipText.includes("governance/index.json") && persistedZipText.includes("releaseDecisionSummary"),
    "persisted ZIP archive should include governance release summaries"
  );
  expect(
    (await validatePersistedPkaPackageReadback(publishedPackage.packageId)).every((item) => item.level === "ready"),
    "persisted package readback validation should pass for valid archives"
  );
  const currentAssemblyClosure = await getPkaPackageAssemblyReadbackClosureReport(project.id);
  expect(
    currentAssemblyClosure.ready && currentAssemblyClosure.status === "current_and_readable",
    "published package should initially be current against persisted readback closure"
  );
  const stableContinuousImprovementClosure = await getContinuousImprovementClosureReport(project.id);
  expect(
    stableContinuousImprovementClosure.ready && stableContinuousImprovementClosure.status === "stable",
    "continuous improvement closure should start stable when no revision triggers exist"
  );
  const invalidReadbackFixtures = await createInvalidPkaReadbackFixtures(publishedPackage.packageId);
  expect(
    (await validatePersistedPkaPackageReadback(publishedPackage.packageId, invalidReadbackFixtures)).every(
      (item) => item.level === "warning"
    ),
    "invalid package readback fixtures should fail validation"
  );
  const validRuntimeImportReport = await validateRuntimePkaImportReadback(publishedPackage.packageId);
  expect(validRuntimeImportReport.status === "importable", "valid package archive should be importable");
  expect(
    validRuntimeImportReport.loaded.ontologyObjectTypes > 0 &&
    validRuntimeImportReport.loaded.knowledgeObjects > 0 &&
      validRuntimeImportReport.loaded.relationships > 0 &&
      validRuntimeImportReport.loaded.sources > 0,
    "valid runtime import should report loaded package component counts"
  );
  expect(
    validRuntimeImportReport.items.some((item) => item.id === "runtime-import-ontology" && item.level === "ready") &&
      validRuntimeImportReport.items.some(
        (item) => item.id === "runtime-import-runtime-config" && item.level === "ready"
      ) &&
      validRuntimeImportReport.items.some((item) => item.id === "runtime-import-prompt-library" && item.level === "ready") &&
      validRuntimeImportReport.items.some((item) => item.id === "runtime-import-rule-library" && item.level === "ready") &&
      validRuntimeImportReport.items.some((item) => item.id === "runtime-import-workflow-library" && item.level === "ready") &&
      validRuntimeImportReport.items.some((item) => item.id === "runtime-import-template-library" && item.level === "ready"),
    "valid runtime import should load ontology and placeholder component boundaries"
  );
  const runtimeHandoffReport = await validateRuntimeAppDeveloperHandoff(publishedPackage.packageId);
  expect(
    runtimeHandoffReport.decision === "installable",
    "valid app-developer handoff should be installable for a consuming runtime"
  );
  expect(
    runtimeHandoffReport.items.some(
      (item) => item.id === "runtime-handoff-required-files" && item.decision === "pass"
    ),
    "runtime handoff should confirm required package files"
  );
  expect(
    runtimeHandoffReport.items.some(
      (item) => item.id === "runtime-handoff-governance-fields" && item.decision === "pass"
    ),
    "runtime handoff should confirm required governance fields"
  );
  expect(
    runtimeHandoffReport.items.some(
      (item) => item.id === "runtime-handoff-relationship-evidence-feedback" && item.decision === "feedback_requested"
    ),
    "runtime handoff should expose relationship evidence feedback questions"
  );
  expect(
    runtimeHandoffReport.relationshipEvidencePolicy?.dedicatedTableStatus === "deferred_for_pilot",
    "runtime handoff should carry the relationship evidence table decision"
  );
  const runtimeConsumptionContract = await getRuntimeConsumptionContractReport(publishedPackage.packageId);
  expect(
    runtimeConsumptionContract.profiles.length === 3,
    "runtime consumption contract should expose generic, AIFA, and LADOS installer profiles"
  );
  expect(
    runtimeConsumptionContract.profiles.some(
      (profile) => profile.id === "lados" && profile.decision === "installable"
    ),
    "LADOS profile should be installable when the package handoff and import checks pass"
  );
  expect(
    runtimeConsumptionContract.profiles.some(
      (profile) => profile.id === "aifa" && profile.decision === "installation_review_required"
    ),
    "AIFA profile should require installation review for a non-finance Base PKA"
  );
  const missingHandoffReport = await validateRuntimeAppDeveloperHandoff(
    publishedPackage.packageId,
    "runtime/missing-handoff.json"
  );
  expect(
    missingHandoffReport.decision === "blocked",
    "missing app-developer handoff file should block consuming-app installation"
  );
  const runtimeHandoffFixtures = await createRuntimeHandoffReadbackFixtures(publishedPackage.packageId);
  const missingRequiredFileReport = await validateRuntimeAppDeveloperHandoff(
    publishedPackage.packageId,
    runtimeHandoffFixtures.missing_required_file
  );
  expect(
    missingRequiredFileReport.decision === "blocked",
    "missing required handoff file fixture should block consuming-app installation"
  );
  expect(
    missingRequiredFileReport.items.some(
      (item) => item.id === "runtime-handoff-required-files" && item.decision === "blocked"
    ),
    "missing required handoff file fixture should identify the blocked required-files check"
  );
  const reviewRequiredHandoffReport = await validateRuntimeAppDeveloperHandoff(
    publishedPackage.packageId,
    runtimeHandoffFixtures.review_required
  );
  expect(
    reviewRequiredHandoffReport.decision === "installation_review_required",
    "runtime-owner-review handoff fixture should require installation review"
  );
  expect(
    reviewRequiredHandoffReport.items.some(
      (item) =>
        item.id === "runtime-handoff-runtime-owner-review" &&
        item.decision === "installation_review_required"
    ),
    "runtime-owner-review handoff fixture should identify the review-required check"
  );
  const initialHandoffFeedback = await recordRuntimeHandoffFeedback({
    packageId: publishedPackage.packageId,
    runtimeApp: "LADOS pilot consumer",
    decision: "provenance_ok_for_pilot",
    actor: "runtime_consumer",
    notes: "Relationship evidence provenance is enough for the QS/RFQ pilot handoff."
  });
  expect(
    initialHandoffFeedback.relationshipEvidenceDecision === "keep_provenance_for_pilot",
    "provenance-ok feedback should keep the relationship evidence table deferred for pilot"
  );
  const multiSourceHandoffFeedback = await recordRuntimeHandoffFeedback({
    packageId: publishedPackage.packageId,
    runtimeApp: "AIFA pilot consumer",
    decision: "needs_multi_source_lifecycle",
    actor: "runtime_consumer",
    notes: "Consumer needs independent lifecycle for multiple relationship evidence citations."
  });
  expect(
    multiSourceHandoffFeedback.relationshipEvidenceDecision ===
      "monitor_multi_source_lifecycle_feedback",
    "first multi-source lifecycle feedback should be monitored without immediately creating a relationship evidence table"
  );
  const repeatedMultiSourceHandoffFeedback = await recordRuntimeHandoffFeedback({
    packageId: publishedPackage.packageId,
    runtimeApp: "QS/RFQ pilot consumer",
    decision: "needs_multi_source_lifecycle",
    actor: "runtime_consumer",
    notes: "Second consumer also needs independent relationship evidence lifecycle."
  });
  expect(
    repeatedMultiSourceHandoffFeedback.relationshipEvidenceDecision ===
      "investigate_dedicated_relationship_evidence_table",
    "repeated multi-source lifecycle feedback should flag the dedicated relationship evidence table for investigation"
  );
  expect(
    repeatedMultiSourceHandoffFeedback.repeatedMultiSourceLifecycleFeedback,
    "repeated lifecycle feedback should be explicit in the handoff feedback summary"
  );
  const revisionContinuousImprovementClosure = await getContinuousImprovementClosureReport(project.id);
  expect(
    !revisionContinuousImprovementClosure.ready &&
      revisionContinuousImprovementClosure.status === "revision_required" &&
      revisionContinuousImprovementClosure.triggers.some(
        (trigger) => trigger.id === "continuous-improvement-relationship-evidence-table"
      ),
    "continuous improvement closure should route repeated app-developer feedback into a revision trigger"
  );
  expect(
    (await listRuntimeHandoffFeedback(publishedPackage.packageId)).items.some(
      (item) =>
        item.runtimeApp === "AIFA pilot consumer" &&
        item.decision === "needs_multi_source_lifecycle"
    ),
    "runtime handoff feedback records should be queryable from package governance history"
  );
  const manufacturingLineReport = await getManufacturingLineRunReport(project.id);
  expect(
    manufacturingLineReport.stages.length === 10,
    "Manufacturing Line report should expose all ten KF factory stages"
  );
  expect(
    manufacturingLineReport.summary.readyStageCount >= 8,
    "Manufacturing Line report should show the manufactured package moving through the reusable factory line"
  );
  expect(
    manufacturingLineReport.stages.some(
      (stage) => stage.id === "runtime_handoff" && stage.status === "ready"
    ),
    "Manufacturing Line report should include runtime handoff readiness"
  );
  const workOrderReport = await getManufacturingWorkOrderReport(project.id);
  expect(
    workOrderReport.workOrders.length === 5,
    "Manufacturing work-order report should expose the reusable factory work-order skeleton"
  );
  expect(
    workOrderReport.sourceToKnowledgeObject.status === "complete",
    "Source-to-KO work order should complete after source ingestion and KO approval"
  );
  expect(
    workOrderReport.knowledgeObjectToPackage.status === "complete",
    "KO-to-package work order should complete after package publication"
  );
  await updateKnowledgeRelationshipReleaseExclusion({
    relationshipId: relationship.id,
    excluded: true,
    reason: "Contract test excludes a relationship after publication to prove package re-assembly closure.",
    actor: "reviewer"
  });
  const staleAssemblyClosure = await getPkaPackageAssemblyReadbackClosureReport(project.id);
  expect(
    !staleAssemblyClosure.ready &&
      staleAssemblyClosure.status === "needs_reassembly" &&
      staleAssemblyClosure.issues.some((item) => item.id === "package-manifest-counts-stale"),
    "relationship release changes after publication should require package re-assembly instead of mutating the immutable export"
  );
  const staleWorkOrderReport = await getManufacturingWorkOrderReport(project.id);
  expect(
    staleWorkOrderReport.knowledgeObjectToPackage.status === "waiting_for_approval",
    "KO-to-package work order should reopen when persisted package files are stale against factory state"
  );
  const workOrderTrace = await createManufacturingWorkOrderTrace({
    projectId: project.id,
    workOrderId: "source-to-ko",
    actor: "knowledge_engineer",
    status: "queued"
  });
  expect(
    workOrderTrace.stage === "manufacturing:source-to-ko",
    "Manufacturing work-order traces should use a stable Mission stage for filtering"
  );
  expect(
    (await getManufacturingWorkOrderReport(project.id)).sourceToKnowledgeObject.openMissionCount > 0,
    "Manufacturing work-order report should count open Mission-backed work-order traces"
  );
  await recordRuntimePkaImportDecision({
    packageId: publishedPackage.packageId,
    archivePath: "package-archive.json",
    actor: "runtime_consumer"
  });
  expect(
    (await listGovernanceHistory({ subjectId: publishedPackage.packageId })).some(
      (event) => event.action === "runtime_import.importable"
    ),
    "runtime import decision should write governance history"
  );
  const importedArchivePath = await importRuntimePkaArchive({
    packageId: publishedPackage.packageId,
    fileName: "Runtime Handoff Archive.json",
    contents: JSON.stringify(persistedArchive)
  });
  expect(importedArchivePath.startsWith("imports/"), "imported archive should be stored under imports/");
  expect(
    (await validateRuntimePkaImportReadback(publishedPackage.packageId, importedArchivePath)).status === "importable",
    "imported runtime archive should validate without replacing the persisted export"
  );
  await expectRejects(
    () =>
      importRuntimePkaArchive({
        packageId: publishedPackage.packageId,
        fileName: ".env",
        contents: JSON.stringify(persistedArchive)
      }),
    "runtime import archive should reject environment file names"
  );
  const runtimeImportFixtures = await createRuntimePkaImportFixtures(publishedPackage.packageId);
  expect(
    (await validateRuntimePkaImportReadback(publishedPackage.packageId, runtimeImportFixtures.valid)).status ===
      "importable",
    "valid runtime import fixture should pass"
  );
  expect(
    (await validateRuntimePkaImportReadback(publishedPackage.packageId, runtimeImportFixtures.missing_governance))
      .status === "blocked",
    "missing governance runtime import fixture should be blocked"
  );
  expect(
    (await validateRuntimePkaImportReadback(publishedPackage.packageId, runtimeImportFixtures.malformed_archive))
      .status === "blocked",
    "malformed archive runtime import fixture should be blocked"
  );
  const capabilityMismatchReport = await validateRuntimePkaImportReadback(
    publishedPackage.packageId,
    runtimeImportFixtures.capability_mismatch
  );
  expect(capabilityMismatchReport.status === "blocked", "capability mismatch runtime import fixture should be blocked");
  expect(
    capabilityMismatchReport.items.some((item) => item.detail.includes("Unsupported runtime capabilities")),
    "capability mismatch report should name unsupported runtime capabilities"
  );
  const missingComponentFixtures = [
    [runtimeImportFixtures.missing_prompt, "prompts/index.json"],
    [runtimeImportFixtures.missing_rule, "rules/index.json"],
    [runtimeImportFixtures.missing_workflow, "workflows/index.json"],
    [runtimeImportFixtures.missing_template, "templates/index.json"]
  ] as const;
  for (const [fixturePath, missingPath] of missingComponentFixtures) {
    const missingComponentReport = await validateRuntimePkaImportReadback(publishedPackage.packageId, fixturePath);
    expect(missingComponentReport.status === "blocked", `${missingPath} fixture should be blocked`);
    expect(
      missingComponentReport.items.some((item) => item.detail.includes(missingPath)),
      `${missingPath} fixture should name the missing component index`
    );
  }
  await expectRejects(
    () =>
      assemblePkaPackage({
        projectId: project.id,
        name: "Contract Test Base PKA",
        version: "0.1.0",
        publisher: "publisher",
        confirmReplacement: true
      }),
    "published package should reject same-version replacement"
  );
  const rejectedPackage = await assemblePkaPackage({
    projectId: project.id,
    name: "Contract Test Base PKA",
    version: "0.1.1",
    publisher: "publisher"
  });
  await updatePkaPackageReleaseStatus({
    packageRecordId: rejectedPackage.id,
    status: "under_review",
    actor: "reviewer",
    notes: "Package release review opened for rejection test."
  });
  const rejectedReleasePackage = await updatePkaPackageReleaseStatus({
    packageRecordId: rejectedPackage.id,
    status: "rejected",
    actor: "reviewer",
    notes: "Package release rejected for test."
  });
  expect(rejectedReleasePackage.status === "rejected", "package release rejection should mark package rejected");
  await expectRejects(
    () => publishPkaPackage(rejectedReleasePackage.id),
    "rejected package should reject publication before approval"
  );

  await expectRejects(
    () =>
      updateKnowledgeObject({
        id: knowledgeObject.id,
        title: "Illegal Approved Edit",
        objectType: "rule",
        domain: "Quantity Surveying",
        description: "Approved KOs should not be edited directly.",
        owner: "knowledge_engineer",
        author: "knowledge_engineer",
        tags: ["locked"],
        confidence: 10
      }),
    "approved KO should reject direct editing"
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
