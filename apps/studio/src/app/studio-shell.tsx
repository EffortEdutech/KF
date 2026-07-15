import Link from "next/link";
import { navigationItems, workspace } from "./studio-data";

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
          {navigationItems.map((item) =>
            item.href.startsWith("/") ? (
              <Link key={item.label} href={item.href}>
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} aria-disabled="true">
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <span>Active project</span>
          <strong>{workspace.activeProjectName}</strong>
        </div>
      </aside>

      <section className="workspace">{children}</section>
    </main>
  );
}

