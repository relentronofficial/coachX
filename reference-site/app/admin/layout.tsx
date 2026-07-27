import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { isAdminRole, ROLE_LABELS } from '@/lib/auth/permissions';
import { adminNav, adminGroups } from '@/lib/admin/nav';
import { AdminSignOut } from '@/components/admin/AdminSignOut';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · CoachX Admin' }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  // SERVER-SIDE guard for /admin/* (middleware also blocks at the edge).
  if (!user) redirect('/login?next=/admin');
  if (!isAdminRole(user.role)) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-pill bg-red-100 text-2xl">⛔</div>
        <h1 className="mt-4 text-2xl font-extrabold text-ink">Access denied</h1>
        <p className="mt-2 text-slate-500">
          You are signed in as <strong>{user.email}</strong>, which is not an admin account.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-secondary">Back to site</Link>
          <AdminSignOut />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="hidden border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="border-b border-slate-200 px-5 py-4">
            <Link href="/admin" className="text-lg font-extrabold text-ink">
              CoachX <span className="text-teal">Admin</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {adminGroups.map((group) => (
              <div key={group} className="mb-4">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group}</p>
                {adminNav
                  .filter((n) => n.group === group)
                  .map((n) => (
                    <Link
                      key={n.href}
                      href={n.href}
                      className="flex items-center gap-2.5 rounded-pill px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-ink"
                    >
                      <span>{n.icon}</span> {n.label}
                    </Link>
                  ))}
              </div>
            ))}
          </nav>
          <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <p className="truncate font-semibold text-ink">{user.name}</p>
            <p className="truncate">{user.email}</p>
            <p className="mt-0.5 font-semibold text-teal">{ROLE_LABELS[user.role]}</p>
            <AdminSignOut compact />
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0">
        {/* Mobile top bar with module links */}
        <div className="flex items-center gap-3 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <Link href="/admin" className="font-extrabold text-ink">
            CoachX <span className="text-teal">Admin</span>
          </Link>
          {adminNav.slice(0, 6).map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap text-sm text-slate-500">
              {n.label}
            </Link>
          ))}
        </div>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
