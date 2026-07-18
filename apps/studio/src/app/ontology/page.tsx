import Link from "next/link";
import { relationshipTypes } from "@kf/core";
import {
  attachRelationshipEvidenceAction,
  updateKnowledgeRelationshipProvenanceAction,
  updateKnowledgeRelationshipReleaseExclusionAction
} from "../source-actions";
import { knowledgeObjectTypes } from "../studio-data";
import {
  getRelationshipEvidenceClosureReport,
  getRelationshipReadinessHints,
  listRelationshipGovernanceHistory,
  listKnowledgeObjects,
  listKnowledgeRelationships,
  listProjects,
  listSourcesByProject
} from "../workspace-store";

type OntologyPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    type?: string;
    relType?: string;
    q?: string;
    relId?: string;
  }>;
};

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function closureClass(status: string) {
  if (status === "release_grade") {
    return "readiness-ready";
  }

  return status === "needs_rework" ? "readiness-warning" : "readiness-info";
}

export default async function OntologyPage({ searchParams }: OntologyPageProps) {
  const params = await searchParams;
  const projects = await listProjects();
  const requestedProject = projects.find((project) => project.id === params?.projectId);
  const activeProject = requestedProject ?? projects[0];
  const selectedType = knowledgeObjectTypes.includes(params?.type as (typeof knowledgeObjectTypes)[number])
    ? params?.type
    : "all";
  const selectedRelationshipType = relationshipTypes.includes(params?.relType as (typeof relationshipTypes)[number])
    ? params?.relType
    : "all";
  const query = params?.q?.trim().toLowerCase() ?? "";
  const knowledgeObjects = activeProject ? await listKnowledgeObjects({ projectId: activeProject.id }) : [];
  const sources = activeProject ? await listSourcesByProject(activeProject.id) : [];
  const filteredKnowledgeObjects =
    (selectedType === "all"
      ? knowledgeObjects
      : knowledgeObjects.filter((knowledgeObject) => knowledgeObject.objectType === selectedType)
    ).filter((knowledgeObject) => {
      if (!query) {
        return true;
      }

      return [
        knowledgeObject.title,
        knowledgeObject.description,
        knowledgeObject.domain,
        knowledgeObject.objectType,
        knowledgeObject.tags.join(" ")
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  const relationships = activeProject
    ? await listKnowledgeRelationships({
        projectId: activeProject.id,
        relationshipType:
          selectedRelationshipType === "all"
            ? "all"
            : (selectedRelationshipType as (typeof relationshipTypes)[number])
      })
    : [];
  const relationshipClosure = activeProject
    ? await getRelationshipEvidenceClosureReport(activeProject.id)
    : undefined;
  const selectedRelationship =
    relationships.find((relationship) => relationship.id === params?.relId) ?? relationships[0];
  const selectedClosureItem = relationshipClosure?.items.find(
    (item) => item.relationshipId === selectedRelationship?.id
  );
  const relationshipHistory = selectedRelationship
    ? await listRelationshipGovernanceHistory(selectedRelationship.id)
    : [];
  const isolatedObjects = knowledgeObjects.filter(
    (knowledgeObject) =>
      knowledgeObject.outgoingRelationships.length + knowledgeObject.incomingRelationships.length === 0
  );
  const weakRelationshipCount = relationships.filter(
    (relationship) =>
      relationship.status !== "approved" ||
      relationship.confidence === undefined ||
      relationship.confidence < 50 ||
      !relationship.provenanceNote
  ).length;
  const objectTypeCounts = knowledgeObjectTypes.map((type) => ({
    type,
    count: knowledgeObjects.filter((knowledgeObject) => knowledgeObject.objectType === type).length
  }));
  const relationshipTypeCounts = relationshipTypes.map((type) => ({
    type,
    count: relationships.filter((relationship) => relationship.type === type).length
  }));
  const adjacencyMap = filteredKnowledgeObjects.map((knowledgeObject) => ({
    knowledgeObject,
    outgoing: relationships.filter((relationship) => relationship.fromId === knowledgeObject.id),
    incoming: relationships.filter((relationship) => relationship.toId === knowledgeObject.id)
  }));

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Sprint 5</p>
          <h2>Ontology and Graph Quality</h2>
          <p className="lede">
            Inspect the fixed MVP ontology vocabulary, relationship graph coverage, and release-quality gaps.
          </p>
        </div>
        <span className="status">{relationships.length} edge(s)</span>
      </header>

      <section className="filter-bar" aria-label="Ontology project filters">
        {projects.map((project) => (
          <Link
            className={project.id === activeProject?.id ? "filter-chip active" : "filter-chip"}
            href={`/ontology?projectId=${project.id}&type=${selectedType}&relType=${selectedRelationshipType}&q=${encodeURIComponent(params?.q ?? "")}`}
            key={project.id}
          >
            {project.name}
          </Link>
        ))}
      </section>

      <form className="filter-bar" aria-label="Ontology graph filters">
        {activeProject ? <input type="hidden" name="projectId" value={activeProject.id} /> : null}
        <label className="filter-field">
          Object type
          <select name="type" defaultValue={selectedType}>
            <option value="all">all</option>
            {knowledgeObjectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          Relationship type
          <select name="relType" defaultValue={selectedRelationshipType}>
            <option value="all">all</option>
            {relationshipTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field filter-search">
          Node search
          <input name="q" defaultValue={params?.q ?? ""} placeholder="title, domain, tag, description" />
        </label>
        <button className="filter-button" type="submit">
          Filter graph
        </button>
      </form>

      <section className="metrics" aria-label="Graph quality metrics">
        <div className="metric">
          <span>Knowledge Objects</span>
          <strong>{knowledgeObjects.length}</strong>
        </div>
        <div className="metric">
          <span>Relationships</span>
          <strong>{relationships.length}</strong>
        </div>
        <Link className="metric metric-link" href={`/review?projectId=${activeProject?.id ?? ""}&queueStatus=all&blockerType=isolated-knowledge-object`}>
          <span>Isolated KOs</span>
          <strong>{isolatedObjects.length}</strong>
        </Link>
        <Link className="metric metric-link" href={`/review?projectId=${activeProject?.id ?? ""}&queueStatus=all&blockerType=missing-relationship-provenance`}>
          <span>Weak edges</span>
          <strong>{weakRelationshipCount}</strong>
        </Link>
      </section>

      {relationshipClosure ? (
        <section className="panel panel-strong">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Relationship and Evidence Closure</p>
              <h3>{relationshipClosure.ready ? "Release graph ready" : "Relationship rework required"}</h3>
            </div>
            <span className={relationshipClosure.ready ? "pill readiness-ready" : "pill readiness-warning"}>
              {relationshipClosure.ready ? "release grade" : "needs rework"}
            </span>
          </div>
          <p>
            Classify graph edges for PKA release. Only release-grade relationships are exported as package graph
            relationships; working edges can be repaired or explicitly excluded from this release.
          </p>
          <section className="metrics" aria-label="Relationship evidence closure metrics">
            <div className="metric">
              <span>Release grade</span>
              <strong>{relationshipClosure.releaseGradeCount}</strong>
            </div>
            <div className="metric">
              <span>Needs rework</span>
              <strong>{relationshipClosure.needsReworkCount}</strong>
            </div>
            <div className="metric">
              <span>Excluded</span>
              <strong>{relationshipClosure.excludedFromReleaseCount}</strong>
            </div>
            <div className="metric">
              <span>Package graph</span>
              <strong>{relationshipClosure.packageRelevantRelationshipCount}</strong>
            </div>
          </section>
          <div className="readiness-list" aria-label="Relationship evidence closure report">
            {relationshipClosure.items.slice(0, 8).map((item) => (
              <Link
                className={`readiness-item ${closureClass(item.status)}`}
                href={`/ontology?projectId=${activeProject?.id ?? ""}&type=${selectedType}&relType=${selectedRelationshipType}&q=${encodeURIComponent(params?.q ?? "")}&relId=${item.relationshipId}`}
                key={item.relationshipId}
              >
                <strong>{item.label}</strong>
                <span>{statusLabel(item.status)} / {item.relationshipType}</span>
                <span>{item.reasons.length > 0 ? item.reasons.join("; ") : item.recommendedAction}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="board board-two">
        <article className="panel panel-strong">
          <p className="eyebrow">Ontology</p>
          <h3>Object type vocabulary</h3>
          <div className="readiness-list" aria-label="Knowledge Object type counts">
            {objectTypeCounts.map((item) => (
              <Link
                className={`readiness-item ${item.count > 0 ? "readiness-info" : "readiness-ready"}`}
                href={`/ontology?projectId=${activeProject?.id ?? ""}&type=${item.type}&relType=${selectedRelationshipType}&q=${encodeURIComponent(params?.q ?? "")}`}
                key={item.type}
              >
                <strong>{item.type}</strong>
                <span>{item.count} Knowledge Object(s)</span>
              </Link>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Graph</p>
          <h3>Relationship vocabulary</h3>
          <div className="readiness-list" aria-label="Relationship type counts">
            {relationshipTypeCounts.map((item) => (
              <Link
                className={`readiness-item ${item.count > 0 ? "readiness-info" : "readiness-ready"}`}
                href={`/ontology?projectId=${activeProject?.id ?? ""}&type=${selectedType}&relType=${item.type}&q=${encodeURIComponent(params?.q ?? "")}`}
                key={item.type}
              >
                <strong>{item.type}</strong>
                <span>{item.count} relationship edge(s)</span>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="board board-two" id="graph-quality">
        <article className="panel">
          <p className="eyebrow">Quality control</p>
          <h3>Isolated objects</h3>
          {isolatedObjects.length > 0 ? (
            <div className="readiness-list" aria-label="Isolated Knowledge Objects">
              {isolatedObjects.map((knowledgeObject) => (
                <Link
                  className="readiness-item readiness-warning"
                  href={`/knowledge-objects?projectId=${knowledgeObject.projectId}&koId=${knowledgeObject.id}`}
                  key={knowledgeObject.id}
                >
                  <strong>{knowledgeObject.title}</strong>
                  <span>{knowledgeObject.objectType} / {knowledgeObject.domain}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No isolated KOs</strong>
              <span>Every Knowledge Object has at least one relationship edge.</span>
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Readiness vocabulary</p>
          <h3>Selected KO graph checks</h3>
          <div className="readiness-list" aria-label="Filtered Knowledge Object graph checks">
            {filteredKnowledgeObjects.slice(0, 8).map((knowledgeObject) => {
              const hints = getRelationshipReadinessHints(knowledgeObject, [
                ...knowledgeObject.outgoingRelationships,
                ...knowledgeObject.incomingRelationships
              ]);
              return (
                <Link
                  className={`readiness-item readiness-${hints.some((hint) => hint.level === "warning") ? "warning" : "ready"}`}
                  href={`/knowledge-objects?projectId=${knowledgeObject.projectId}&koId=${knowledgeObject.id}`}
                  key={knowledgeObject.id}
                >
                  <strong>{knowledgeObject.title}</strong>
                  <span>{hints.map((hint) => hint.title).join("; ")}</span>
                </Link>
              );
            })}
          </div>
        </article>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Relationship detail</p>
          <h3>{selectedRelationship ? `${selectedRelationship.fromTitle} ${selectedRelationship.type} ${selectedRelationship.toTitle}` : "No relationship selected"}</h3>
          {selectedRelationship ? (
            <dl className="detail-list">
              <div>
                <dt>Status</dt>
                <dd>{selectedRelationship.status}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{selectedRelationship.confidence ?? "not set"}</dd>
              </div>
              <div>
                <dt>Provenance</dt>
                <dd>{selectedRelationship.provenanceNote ?? "No provenance note captured."}</dd>
              </div>
              <div>
                <dt>Source/evidence posture</dt>
                <dd>
                  {selectedRelationship.evidenceSourceTitle
                    ? `${selectedRelationship.evidenceSourceTitle}${selectedRelationship.evidenceLocator ? ` / ${selectedRelationship.evidenceLocator}` : ""}`
                    : selectedRelationship.provenanceNote
                      ? "Relationship has provenance; structured source evidence is still pending."
                      : "Relationship needs provenance before it is package-grade."}
                </dd>
              </div>
              <div>
                <dt>Release closure</dt>
                <dd>{selectedClosureItem ? statusLabel(selectedClosureItem.status) : "not classified"}</dd>
              </div>
              {selectedRelationship.releaseExcluded ? (
                <div>
                  <dt>Release exclusion</dt>
                  <dd>{selectedRelationship.releaseExclusionReason ?? "Excluded from this release."}</dd>
                </div>
              ) : null}
              {selectedRelationship.evidenceExcerpt ? (
                <div>
                  <dt>Evidence excerpt</dt>
                  <dd>{selectedRelationship.evidenceExcerpt}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No relationship edge</strong>
              <span>Create a KO-to-KO relationship before inspecting graph evidence.</span>
            </div>
          )}
          <div className="readiness-list" aria-label="Relationship edge selector">
            {relationships.slice(0, 8).map((relationship) => (
              <Link
                className={`readiness-item ${
                  relationship.id === selectedRelationship?.id ? "readiness-info panel-selected" : "readiness-ready"
                }`}
                href={`/ontology?projectId=${activeProject?.id ?? ""}&type=${selectedType}&relType=${selectedRelationshipType}&q=${encodeURIComponent(params?.q ?? "")}&relId=${relationship.id}`}
                key={relationship.id}
              >
                <strong>
                  {relationship.fromTitle} {relationship.type} {relationship.toTitle}
                </strong>
                <span>{relationship.provenanceNote ?? "No provenance note captured."}</span>
                <span>
                  {relationship.evidenceSourceTitle
                    ? `Evidence: ${relationship.evidenceSourceTitle}`
                    : "Structured relationship evidence pending"}
                </span>
                <span>
                  {relationship.releaseExcluded ? "Excluded from release" : "Package-relevant unless repaired or excluded"}
                </span>
              </Link>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Release remediation</p>
          <h3>{selectedRelationship ? "Repair or exclude edge" : "No relationship selected"}</h3>
          {selectedRelationship ? (
            <div className="readiness-list" aria-label="Relationship evidence closure remediation">
              <form action={updateKnowledgeRelationshipProvenanceAction} className="source-form compact-form">
                <input type="hidden" name="relationshipId" value={selectedRelationship.id} />
                <input type="hidden" name="actor" value="reviewer" />
                <label>
                  Provenance note
                  <textarea
                    name="provenanceNote"
                    defaultValue={selectedRelationship.provenanceNote ?? "Relationship reviewed for package release."}
                    rows={3}
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
                    defaultValue={selectedRelationship.confidence ?? 80}
                  />
                </label>
                <label>
                  Status
                  <select name="status" defaultValue={selectedRelationship.status === "approved" ? "approved" : "under_review"}>
                    <option value="under_review">under_review</option>
                    <option value="approved">approved</option>
                    <option value="draft">draft</option>
                  </select>
                </label>
                <button type="submit">Update relationship governance</button>
              </form>

              <form action={attachRelationshipEvidenceAction} className="source-form compact-form">
                <input type="hidden" name="relationshipId" value={selectedRelationship.id} />
                <input type="hidden" name="actor" value="knowledge_engineer" />
                <label>
                  Source evidence
                  <select name="sourceId" defaultValue={selectedRelationship.evidenceSourceId ?? sources[0]?.id}>
                    {sources.map((source) => (
                      <option value={source.id} key={source.id}>
                        {source.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Evidence excerpt
                  <textarea
                    name="relationshipEvidenceExcerpt"
                    defaultValue={selectedRelationship.evidenceExcerpt ?? "Relationship evidence attached for package release closure."}
                    rows={3}
                  />
                </label>
                <label>
                  Locator
                  <input name="relationshipEvidenceLocator" defaultValue={selectedRelationship.evidenceLocator ?? "relationship-closure"} />
                </label>
                <label>
                  Evidence confidence
                  <input
                    name="relationshipEvidenceConfidence"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={selectedRelationship.evidenceConfidence ?? 80}
                  />
                </label>
                <button type="submit">Attach relationship evidence</button>
              </form>

              <form action={updateKnowledgeRelationshipReleaseExclusionAction} className="source-form compact-form">
                <input type="hidden" name="relationshipId" value={selectedRelationship.id} />
                <input type="hidden" name="actor" value="reviewer" />
                <label>
                  Release posture
                  <select name="excluded" defaultValue={selectedRelationship.releaseExcluded ? "yes" : "no"}>
                    <option value="no">package relevant</option>
                    <option value="yes">exclude from this release</option>
                  </select>
                </label>
                <label>
                  Exclusion reason
                  <textarea
                    name="releaseExclusionReason"
                    defaultValue={selectedRelationship.releaseExclusionReason ?? "Working graph edge retained for future manufacturing; excluded from this package release."}
                    rows={3}
                  />
                </label>
                <button type="submit">Update release posture</button>
              </form>
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <strong>No relationship selected</strong>
              <span>Select a graph edge before repairing release posture.</span>
            </div>
          )}
        </article>
      </section>

      <section className="board board-two">
        <article className="panel">
          <p className="eyebrow">Relationship review history</p>
          <h3>{relationshipHistory.length} event(s)</h3>
          {relationshipHistory.length > 0 ? (
            <div className="timeline-list" aria-label="Relationship governance history">
              {relationshipHistory.map((event) => (
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
              <strong>No relationship history yet</strong>
              <span>Relationship creation and provenance repair events will appear here.</span>
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Visual graph</p>
        <h3>Adjacency map</h3>
        {adjacencyMap.length > 0 ? (
          <div className="graph-map" aria-label="Ontology adjacency map">
            {adjacencyMap.slice(0, 10).map(({ knowledgeObject, outgoing, incoming }) => (
              <div className="graph-node" key={knowledgeObject.id}>
                <div>
                  <strong>{knowledgeObject.title}</strong>
                  <span>{knowledgeObject.objectType} / {knowledgeObject.status}</span>
                </div>
                <div className="graph-edge-list">
                  {outgoing.map((relationship) => (
                    <Link
                      className="graph-edge"
                      href={`/ontology?projectId=${activeProject?.id ?? ""}&type=${selectedType}&relType=${selectedRelationshipType}&q=${encodeURIComponent(params?.q ?? "")}&relId=${relationship.id}`}
                      key={`out-${relationship.id}`}
                    >
                      <span>{`${relationship.type} -> ${relationship.toTitle}`}</span>
                      <small>{relationship.evidenceSourceTitle ? "source evidence" : "evidence pending"}</small>
                    </Link>
                  ))}
                  {incoming.map((relationship) => (
                    <Link
                      className="graph-edge graph-edge-incoming"
                      href={`/ontology?projectId=${activeProject?.id ?? ""}&type=${selectedType}&relType=${selectedRelationshipType}&q=${encodeURIComponent(params?.q ?? "")}&relId=${relationship.id}`}
                      key={`in-${relationship.id}`}
                    >
                      <span>{`${relationship.fromTitle} -> ${relationship.type}`}</span>
                      <small>{relationship.evidenceSourceTitle ? "source evidence" : "evidence pending"}</small>
                    </Link>
                  ))}
                  {outgoing.length + incoming.length === 0 ? (
                    <span className="graph-edge graph-edge-empty">No adjacent edges</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <strong>No graph nodes match</strong>
            <span>Change the object type or node search filter to inspect adjacency.</span>
          </div>
        )}
      </section>
    </>
  );
}
