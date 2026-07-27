import type { ReactNode } from 'react';

/**
 * Presentational shell for admin modules that are part of the scalable panel
 * but not yet backed by their own data store. Keeps the panel consistent and
 * makes clear where new data sources plug in.
 */
export function ModuleShell({
  title,
  description,
  status = 'Scaffolded',
  children,
}: {
  title: string;
  description: string;
  status?: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
        <span className="rounded-pill bg-amber/15 px-2.5 py-1 text-xs font-semibold text-amber-dark">{status}</span>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
      <div className="mt-6">
        {children ?? (
          <div className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
            This module is wired into the admin shell and permissions. Connect its data source to activate it —
            no separate admin scaffolding is required.
          </div>
        )}
      </div>
    </div>
  );
}
