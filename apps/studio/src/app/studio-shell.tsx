import Link from "next/link";
import { navigationSections, workspace } from "./studio-data";

export function StudioShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="shell">
      <aside className="sidebar" aria-label="Studio navigation">
        <div className="brand">
          <p className="eyebrow">Knowledge Factory</p>
          <h1>Studio</h1>
          <p>{workspace.workspace}</p>
        </div>

        <nav>
          {navigationSections.map((section) => (
            <div className="nav-section" key={section.title}>
              <span className="nav-section-title">{section.title}</span>
              {section.items.map((item) =>
                item.href.startsWith("/") ? (
                  <Link key={`${section.title}-${item.label}`} href={item.href}>
                    {"stage" in item ? <span className="nav-stage">{item.stage}</span> : null}
                    <span className="nav-copy">
                      <span>{item.label}</span>
                      {"caption" in item ? <small>{item.caption}</small> : null}
                    </span>
                  </Link>
                ) : (
                  <a key={`${section.title}-${item.label}`} href={item.href} aria-disabled="true">
                    {"stage" in item ? <span className="nav-stage">{item.stage}</span> : null}
                    <span className="nav-copy">
                      <span>{item.label}</span>
                      {"caption" in item ? <small>{item.caption}</small> : null}
                    </span>
                  </a>
                )
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>Validation article</span>
          <strong>{workspace.activeProjectName}</strong>
        </div>
      </aside>

      <section className="workspace">{children}</section>
    </main>
  );
}
