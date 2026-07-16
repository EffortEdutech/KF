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
  createMission,
  createSource,
  createReviewDecision,
  filterReleaseReadinessHints,
  getKnowledgeObject,
  getKnowledgeObjectReviewReadinessHints,
  getPkaReleaseReadinessHints,
  getPkaPackageExportPreview,
  getPipelineQualityMetrics,
  getProjectReadinessHints,
  getProjectGovernanceMetrics,
  getRelationshipReadinessHints,
  getProjectSourceCount,
  getSourceReadinessHints,
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
  listReviewQueue,
  listReviews,
  listSourceChunks,
  listSources,
  publishPkaPackage,
  releaseBlockerTypeFromHintId,
  resetWorkspaceStoreForTests,
  retrySourceIngestion,
  runSourceIngestion,
  updateKnowledgeSuggestionStatus,
  updatePkaPackageReleaseStatus,
  updateKnowledgeRelationshipProvenance,
  updateKnowledgeObject,
  updateKnowledgeObjectStatus,
  updateRelationshipSuggestionStatus,
  updateMissionStatus,
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
  const failedPipelineMetrics = await getPipelineQualityMetrics({ projectId: project.id });
  expect(failedPipelineMetrics.failedJobCount >= 3, "pipeline metrics should count failed ingestion jobs");

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
  const publishedPackage = await publishPkaPackage({
    packageRecordId: approvedPackage.id,
    actor: "publisher",
    notes: "Package published through release workflow."
  });
  expect(publishedPackage.status === "published", "package publish should mark export immutable");
  const packageHistory = await listGovernanceHistory({ subjectId: replacedPackage.id });
  expect(
      packageHistory.some((event) => event.action === "pka_package.under_review") &&
      packageHistory.some((event) => event.action === "pka_package.changes_requested") &&
      packageHistory.some((event) => event.action === "pka_package.approved") &&
      packageHistory.some((event) => event.action === "pka_package.published"),
    "package release decisions should create governance history events"
  );
  const releaseExportPreview = await getPkaPackageExportPreview(project.id);
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
