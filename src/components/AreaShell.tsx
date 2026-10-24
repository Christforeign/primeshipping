import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type AreaLink = { to: string; label: string; exact?: boolean };

export function AreaShell({
  title,
  links,
  children,
}: {
  title: string;
  links: AreaLink[];
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 sm:px-4 sm:py-8 grid-cols-[minmax(0,1fr)] lg:gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <nav className="flex gap-1.5 overflow-x-auto rounded-2xl bg-sidebar p-2 lg:flex-col scrollbar-none touch-pan-x">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to as "/"}
              activeOptions={{ exact: l.exact ?? false }}
              className="shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              activeProps={{
                className:
                  "bg-sidebar-primary !text-sidebar-primary-foreground font-semibold shrink-0 shadow-xs",
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
