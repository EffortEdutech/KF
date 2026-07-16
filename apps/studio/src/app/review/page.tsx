import Link from "next/link";
import { roles } from "@kf/core";
import {
  addSourceEvidenceAction,
  attachRelationshipEvidenceAction,
  reviewKnowledgeObjectAction,
  updateKnowledgeObjectStatusAction,
  updateKnowledgeRelationshipProvenanceAction
} from "../source-actions";
import {
  filterReleaseReadinessHints,
  getKnowledgeObject,
  getKnowledgeObjectReviewReadinessHints,
  getPkaReleaseReadinessHints,
  getRelationshipReadinessHints,
  listGovernanceHistory,
  listKnowledgeObjects,
  listKnowledgeRelationships,
  listProjects,
  listReviewQueue,
  listReviews,
  listSourcesByProject,
  releaseBlockerTypeFromHintId,
  releaseBlockerTypes
} from "../workspace-store";

type ReviewPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    koId?: string;
    decision?: string;
    reviewer?: string;
    queueStatus?: string;
    blockerType?: string;
  }>;
};

const reviewDecisions = ["all", "approved", "changes_requested", "rejected"] as const;
const queueStatuses = [
  "under_review",
  "changes_requested",
  "rejected",
  "approved",
  "expert_validated",
  "published",
  "all"
] as const;

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const requestedProject = projects.find((project) => project.id === params?.projectId);
  const activeProject = requestedProject ?? projects[0];
  const selectedDecision = reviewDecisions.includes(params?.decision as (typeof reviewDecisions)[number])
    ? (params?.decision as (typeof reviewDecisions)[number])
    : "all";
  const selectedReviewer = roles.includes(params?.reviewer as (typeof roles)[number])
    ? params?.reviewer
    : "all";
  const selectedQueueStatus = queueStatuses.includes(params?.queueStatus as (typeof queueStatuses)[number])
    ? (params?.queueStatus as (typeof queueStatuses)[number])
    : "under_review";
  const selectedBlockerType = releaseBlockerTypes.some((type) => type.id === params?.blockerType)
    ? (params?.blockerType as (typeof releaseBlockerTypes)[number]["id"])
    : "all";
  const reviewQueue = activeProject
    ? selectedQueueStatus === "under_review"
      ? await listReviewQueue(activeProject.id)
      : await listKnowledgeObjects({
          projectId: activeProject.id,
          status: selectedQueueStatus === "all" ? "all" : selectedQueueStatus
        })
    : [];
  const requestedKnowledgeObject = params?.koId ? await getKnowledgeObject(params.koId) : undefined;
  const selectedKnowledgeObject = requestedKnowledgeObject ?? reviewQueue[0];
  const selectedRelationships = selectedKnowledgeObject
    ? await listKnowledgeRelationships({
        projectId: selectedKnowledgeObject.projectId,
        knowledgeObjectId: selectedKnowledgeObject.id
      })
    : [];
  const projectSources = activeProject ? await listSourcesByProject(activeProject.id) : [];
  const relationshipHints = getRelationshipReadinessHints(selectedKnowledgeObject, selectedRelationships);
  const reviewReadinessHints = getKnowledgeObjectReviewReadinessHints(
    selectedKnowledgeObject,
    selectedRelationships
  );
  const releaseReadinessHints = activeProject
    ? await getPkaReleaseReadinessHints(activeProject.id)
    : [];
  const filteredReleaseReadinessHints = filterReleaseReadinessHints(
    releaseReadinessHints,
    selectedBlockerType
  );
  const releaseBlockers = filteredReleaseReadinessHints.filter((hint) => hint.level === "warning");
  const governanceHistory = selectedKnowledgeObject
    ? await listGovernanceHistory({ subjectId: selectedKnowledgeObject.id })
    : [];
  const reviews = selectedKnowledgeObject
    ? await listReviews({
        knowledgeObjectId: selectedKnowledgeObject.id,
        decision: selectedDecision,
        reviewer: selectedReviewer !== "all" ? selectedReviewer : undefined
      })
    : [];
  const projectReviews = activeProject
    ? await listReviews({
        projectId: activeProject.id,
        decision: selectedDecision,
        reviewer: selectedReviewer !== "all" ? selectedReviewer : undefined
      })
    : [];
  const evidenceCount = selectedKnowledgeObject?.evidenceLinks.length ?? 0;
  const relationshipCount = selectedRelationships.length;
  const missingEvidence = selectedKnowledgeObject ? selectedKnowledgeObject.evidenceLinks.length === 0 : false;
  const relationshipNeedingProvenance = selectedRelationships.find(
    (relationship) => !relationship.provenanceNote || relationship.confidence === undefined || relationship.confidence < 50
  );
  const relationshipNeedingEvidence = selectedRelationships.find(
    (relationship) => relationship.provenanceNote && !relationship.evidenceSourceId
  );
  const selectedKnowledgeObjectWorkspaceHref = selectedKnowledgeObject
    ? `/knowledge-objects?projectId=${selectedKnowledgeObject.projectId}&koId=${selectedKnowledgeObject.id}`
    : "/knowledge-objects";
  const remediationActions = reviewReadinessHints
    .filter((hint) => hint.level === "warning")
    .map((hint) => {
      const blockerType = releaseBlockerTypeFromHintId(hint.id) ?? hint.id;

      if (blockerType === "not-approved-for-release") {
        return {
          id: hint.id,
          title: "Route KO through review",
          detail: "Move this KO into the active review queue before release packaging.",
          mode: "form" as const
        };
      }

      if (
        blockerType === "missing-ownership-metadata" ||
        blockerType === "missing-tags" ||
        blockerType === "missing-confidence"
      ) {
        return {
          id: hint.id,
          title: "Repair KO metadata",
          detail: "Open the governed KO editor to complete owner, author, tags, or confidence.",
          href: selectedKnowledgeObjectWorkspaceHref,
          mode: "link" as const
        };
      }

      if (blockerType === "missing-source-evidence") {
        return {
          id: hint.id,
          title: "Attach or justify evidence",
          detail: "Open the KO workspace to attach source-backed evidence or document manual expert input.",
          href: selectedKnowledgeObjectWorkspaceHref,
          mode: "link" as const
        };
      }

      return {
        id: hint.id,
        title: "Repair relationship quality",
        detail: "Open the KO relationship panel to add edges, confidence, or provenance.",
        href: `${selectedKnowledgeObjectWorkspaceHref}&relQuality=all`,
        mode: "link" as const
      };
    });

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Review</p>
          <h2>Governance Queue</h2>
          <p className="lede">
            Review under-review Knowledge Objects with evidence, graph quality, notes, and accountable decisions.
          </p>
        </div>
        <span className="status">
          {reviewQueue.length} {selectedQueueStatus} KO(s)
        </span>
      </header>

      {params?.projectId && !requestedProject ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>Project filter not found</strong>
          <span>The requested project does not exist. Showing the first available project instead.</span>
        </section>
      ) : null}

      {params?.koId && !requestedKnowledgeObject ? (
        <section className="notice-panel notice-warning" role="status">
          <strong>Knowledge Object not found</strong>
          <span>The requested Knowledge Object ID does not exist in this workspace.</span>
        </section>
      ) : null}

      <section className="metrics" aria-label="Review queue metrics">
        <div className="metric">
          <span>Queue</span>
          <strong>{reviewQueue.length}</strong>
        </div>
        <div className="metric">
          <span>Evidence links</span>
          <strong>{evidenceCount}</strong>
        </div>
        <div className="metric">
          <span>Relationships</span>
          <strong>{relationshipCount}</strong>
        </div>
        <div className="metric">
          <span>Review history</span>
          <strong>{projectReviews.length}</strong>
        </div>
      </section>

      <section className="filter-bar" aria-label="Review project filters">
        {projects.map((project) => (
          <Link
            className={project.id === activeProject?.id ? "filter-chip active" : "filter-chip"}
            href={`/review?projectId=${project.id}&queueStatus=${selectedQueueStatus}&decision=${selectedDecision}&reviewer=${selectedReviewer}&blockerType=${selectedBlockerType}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <form className="filter-bar" aria-label="Review history filters">
        {activeProject ? <input type="hidden" name="projectId" value={activeProject.id} /> : null}
        {selectedKnowledgeObject ? <input type="hidden" name="koId" value={selectedKnowledgeObject.id} /> : null}
        <label className="filter-field">
          Queue status
          <select name="queueStatus" defaultValue={selectedQueueStatus}>
            {queueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          Decision
          <select name="decision" defaultValue={selectedDecision}>
            {reviewDecisions.map((decision) => (
              <option key={decision} value={decision}>
                {decision}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          Reviewer
          <select name="reviewer" defaultValue={selectedReviewer}>
            <option value="all">all</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          Blocker type
          <select name="blockerType" defaultValue={selectedBlockerType}>
            {releaseBlockerTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <button className="filter-button" type="submit">
          Filter review
        </button>
      </form>

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Queue / {selectedQueueStatus}</p>
          <h3>{activeProject?.name ?? "No project selected"}</h3>
          {reviewQueue.length > 0 ? (
            <div className="readiness-list" aria-label="Review queue Knowledge Objects">
              {reviewQueue.map((knowledgeObject) => (
                <Link
                  className={`readiness-item readiness-info ${
                    knowledgeObject.id === selectedKnowledgeObject?.id ? "panel-selected" : ""
                  }`}
                  href={`/review?projectId=${knowledgeObject.projectId}&koId=${knowledgeObject.id}&queueStatus=${selectedQueueStatus}&decision=${selectedDecision}&reviewer=${selectedReviewer}&blockerType=${selectedBlockerType}`}
                  key={knowledgeObject.id}
                >
                  <strong>{knowledgeObject.title}</strong>
                  <span>
                    {knowledgeObject.objectType} / {knowledgeObject.domain}
                  </span>
                  <span>
                    v{knowledgeObject.version}, {knowledgeObject.evidenceLinks.length} evidence link(s)
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No KOs are under review</strong>
              <span>Change the queue status filter or move draft Knowledge Objects to under_review.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Reviewer decision</p>
          <h3>{selectedKnowledgeObject?.title ?? "No Knowledge Object selected"}</h3>
          {selectedKnowledgeObject ? (
            <form action={reviewKnowledgeObjectAction} className="source-form">
              <input type="hidden" name="knowledgeObjectId" value={selectedKnowledgeObject.id} />
              <label>
                Reviewer
                <input name="reviewer" defaultValue="reviewer" required />
              </label>
              <label>
                Decision
                <select name="decision" defaultValue="changes_requested">
                  <option value="approved">approved</option>
                  <option value="changes_requested">changes_requested</option>
                  <option value="rejected">rejected</option>
                </select>
              </label>
              <label className="field-wide">
                Notes
                <textarea
                  name="notes"
                  defaultValue="Record evidence gaps, professional concerns, or approval rationale."
                  required
                />
              </label>
              <button type="submit">Record review decision</button>
            </form>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No review target</strong>
              <span>Select an under-review Knowledge Object before recording reviewer notes.</span>
            </div>
          )}
        </article>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Evidence</p>
          <h3>Source context</h3>
          {selectedKnowledgeObject?.evidenceLinks.length ? (
            <div className="readiness-list" aria-label="Review evidence links">
              {selectedKnowledgeObject.evidenceLinks.map((evidence) => (
                <div className="readiness-item readiness-info" key={evidence.id}>
                  <strong>{evidence.sourceTitle}</strong>
                  <span>{evidence.excerpt || "No excerpt captured yet."}</span>
                  <span>{evidence.locator ? `Locator: ${evidence.locator}` : "Locator pending"}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No source evidence link</strong>
              <span>Reviewer should request changes unless this KO is explicitly accepted as expert/manual input.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Readiness</p>
          <h3>Review checks</h3>
          <div className="readiness-list" aria-label="Review readiness checks">
            {reviewReadinessHints.map((hint) => (
              <div className={`readiness-item readiness-${hint.level}`} key={hint.id}>
                <strong>{hint.title}</strong>
                <span>{hint.detail}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Remediation</p>
        <h3>KO-specific release blocker actions</h3>
        {selectedKnowledgeObject && missingEvidence ? (
          <form action={addSourceEvidenceAction} className="source-form compact-form">
            <input type="hidden" name="knowledgeObjectId" value={selectedKnowledgeObject.id} />
            <input type="hidden" name="actor" value="knowledge_engineer" />
            <label className="field-wide">
              Evidence source
              <select name="sourceId" defaultValue={projectSources[0]?.id ?? ""} required>
                {projectSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-wide">
              Evidence excerpt
              <textarea
                name="evidenceExcerpt"
                defaultValue="Add the source excerpt that justifies this Knowledge Object."
                required
              />
            </label>
            <label>
              Locator
              <input name="evidenceLocator" defaultValue="section/page reference" />
            </label>
            <label>
              Confidence
              <input name="evidenceConfidence" type="number" min="0" max="100" step="0.01" defaultValue="70" />
            </label>
            <button type="submit" disabled={projectSources.length === 0}>
              Attach evidence
            </button>
          </form>
        ) : null}
        {selectedKnowledgeObject && relationshipNeedingProvenance ? (
          <form action={updateKnowledgeRelationshipProvenanceAction} className="source-form compact-form">
            <input type="hidden" name="relationshipId" value={relationshipNeedingProvenance.id} />
            <input type="hidden" name="actor" value="knowledge_engineer" />
            <label className="field-wide">
              Relationship
              <input
                readOnly
                value={`${relationshipNeedingProvenance.fromTitle} ${relationshipNeedingProvenance.type} ${relationshipNeedingProvenance.toTitle}`}
              />
            </label>
            <label className="field-wide">
              Provenance note
              <textarea
                name="provenanceNote"
                defaultValue="Explain why this relationship exists and which professional evidence supports it."
                required
              />
            </label>
            <label>
              Confidence
              <input
                name="relationshipConfidence"
                type="number"
                min="0"
                max="100"
                step="0.01"
                defaultValue={relationshipNeedingProvenance.confidence ?? 70}
              />
            </label>
            <label>
              Status
              <select name="status" defaultValue="approved">
                <option value="draft">draft</option>
                <option value="under_review">under_review</option>
                <option value="approved">approved</option>
              </select>
            </label>
            <button type="submit">Repair provenance</button>
          </form>
        ) : null}
        {selectedKnowledgeObject && relationshipNeedingEvidence ? (
          <form action={attachRelationshipEvidenceAction} className="source-form compact-form">
            <input type="hidden" name="relationshipId" value={relationshipNeedingEvidence.id} />
            <input type="hidden" name="actor" value="knowledge_engineer" />
            <label className="field-wide">
              Relationship evidence source
              <select name="sourceId" defaultValue={projectSources[0]?.id ?? ""} required>
                {projectSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-wide">
              Relationship evidence excerpt
              <textarea
                name="relationshipEvidenceExcerpt"
                defaultValue="Attach the source excerpt that supports this relationship edge."
                required
              />
            </label>
            <label>
              Locator
              <input name="relationshipEvidenceLocator" defaultValue="section/page reference" />
            </label>
            <label>
              Confidence
              <input
                name="relationshipEvidenceConfidence"
                type="number"
                min="0"
                max="100"
                step="0.01"
                defaultValue={relationshipNeedingEvidence.evidenceConfidence ?? 70}
              />
            </label>
            <button type="submit" disabled={projectSources.length === 0}>
              Attach relationship evidence
            </button>
          </form>
        ) : null}
        {selectedKnowledgeObject && remediationActions.length > 0 ? (
          <div className="readiness-list" aria-label="KO-specific remediation actions">
            {remediationActions.map((action) =>
              action.mode === "form" ? (
                <form
                  action={updateKnowledgeObjectStatusAction}
                  className="readiness-item readiness-warning"
                  key={action.id}
                >
                  <input type="hidden" name="knowledgeObjectId" value={selectedKnowledgeObject.id} />
                  <input type="hidden" name="status" value="under_review" />
                  <input type="hidden" name="reviewer" value="reviewer" />
                  <strong>{action.title}</strong>
                  <span>{action.detail}</span>
                  <button className="inline-action" type="submit">
                    Send to review
                  </button>
                </form>
              ) : (
                <Link className="readiness-item readiness-warning" href={action.href} key={action.id}>
                  <strong>{action.title}</strong>
                  <span>{action.detail}</span>
                </Link>
              )
            )}
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <strong>No KO-specific remediation needed</strong>
            <span>Select a KO with warning-level readiness checks to see targeted repair actions.</span>
          </div>
        )}
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Relationship detail</p>
          <h3>Graph quality</h3>
          <div className="readiness-list" aria-label="Review relationship readiness">
            {relationshipHints.map((hint) => (
              <div className={`readiness-item readiness-${hint.level}`} key={hint.id}>
                <strong>{hint.title}</strong>
                <span>{hint.detail}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Release gate</p>
          <h3>PKA release-blocking checks</h3>
          <div className="readiness-list" aria-label="PKA release-blocking checks">
            {filteredReleaseReadinessHints.slice(0, 6).map((hint) => (
              <div className={`readiness-item readiness-${hint.level}`} key={hint.id}>
                <strong>{hint.title}</strong>
                <span>{hint.detail}</span>
              </div>
            ))}
            {releaseBlockers.length > 6 ? (
              <div className="readiness-item readiness-warning">
                <strong>{releaseBlockers.length - 6} more blocker(s)</strong>
                <span>Resolve KO-level review issues before packaging this PKA.</span>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Review history</p>
          <h3>{reviews.length} decision(s)</h3>
          {reviews.length > 0 ? (
            <div className="timeline-list" aria-label="Review decision history">
              {reviews.map((review) => (
                <div className="timeline-item" key={review.id}>
                  <strong>{review.decision}</strong>
                  <span>{review.notes ?? "No notes captured."}</span>
                  <span>
                    {review.createdAt} by {review.reviewerRole}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No review decisions yet</strong>
              <span>Record the first decision to create reviewer accountability.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Governance history</p>
          <h3>{selectedKnowledgeObject?.status ?? "No status"}</h3>
          {governanceHistory.length > 0 ? (
            <div className="timeline-list" aria-label="Review governance history">
              {governanceHistory.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <strong>{event.action}</strong>
                  <span>{event.detail}</span>
                  <span>
                    {event.createdAt}
                    {event.actorId ? ` by ${event.actorId}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No governance events yet</strong>
              <span>Repository edits, relationships, and review decisions will appear here.</span>
            </div>
          )}
        </article>
      </section>
    </>
  );
}
