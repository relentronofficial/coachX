import { getSession } from '@/lib/auth/session';
import { can } from '@/lib/auth/rolesStore';
import { NicheFinderAdmin } from '@/components/admin/NicheFinderAdmin';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'AI Niche Finder' };

export default async function AdminNicheFinderPage() {
  const session = await getSession();
  // Editing settings/scoring requires the settings.manage permission; everyone
  // who can reach the admin panel can view + manage questions/results.
  const canManage = session ? await can(session.role, 'settings.manage') : false;
  return <NicheFinderAdmin actorEmail={session?.email ?? 'admin'} canManage={canManage} />;
}
