import { missions } from "../studio-data";

export default function MissionsPage() {
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Mission Centre</p>
          <h2>Mission-backed activity</h2>
          <p className="lede">
            A first operational queue for workspace, source, validation, and packaging work.
          </p>
        </div>
        <span className="status">Placeholder route</span>
      </header>

      <section className="table-panel" aria-label="Mission list">
        <div className="table-row table-head">
          <span>Mission</span>
          <span>Type</span>
          <span>Status</span>
          <span>Assigned</span>
          <span>Stage</span>
        </div>
        {missions.map((mission) => (
          <div className="table-row" key={mission.id}>
            <strong>{mission.title}</strong>
            <span>{mission.type}</span>
            <span className="pill">{mission.status}</span>
            <span>{mission.assignedTo}</span>
            <span>{mission.stage}</span>
          </div>
        ))}
      </section>
    </>
  );
}

