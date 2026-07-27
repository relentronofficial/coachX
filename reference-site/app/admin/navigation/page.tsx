import { ModuleShell } from '@/components/admin/ModuleShell';
import { mainNav, footerNav } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default function AdminNavigationPage() {
  return (
    <ModuleShell title="Navigation Menu" status="Read-only" description="Header and footer menus. Stored in the CMS so links can be added/removed without code.">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-card border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Header</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {mainNav.map((n) => (
              <li key={n.href} className="flex justify-between"><span>{n.label}</span><span className="font-mono text-xs text-slate-400">{n.href}</span></li>
            ))}
          </ul>
        </div>
        <div className="rounded-card border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Footer</h2>
          {footerNav.map((col) => (
            <div key={col.title} className="mt-2">
              <p className="text-xs font-semibold text-slate-400">{col.title}</p>
              <ul className="text-sm text-slate-600">
                {col.links.map((l) => (
                  <li key={l.label}>{l.label}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </ModuleShell>
  );
}
