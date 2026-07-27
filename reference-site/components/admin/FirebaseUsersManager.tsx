'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { ROLES, ROLE_LABELS, type Role } from '@/lib/auth/permissions';
import { USERS_COLLECTION, type UserProfile } from '@/lib/userProfile';

/**
 * Admin management of Firebase/Firestore users. Reads the `users` collection
 * (allowed for admins by Security Rules) with search, role change and
 * activate/disable. All writes are re-enforced by Firestore rules server-side.
 */
export function FirebaseUsersManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured yet — add NEXT_PUBLIC_FIREBASE_* to .env.local.');
      setUsers([]);
      setLoading(false);
      return;
    }
    try {
      const snap = await getDocs(collection(db, USERS_COLLECTION));
      setUsers(snap.docs.map((d) => d.data() as UserProfile));
    } catch (e) {
      setError((e as Error)?.message ?? 'Could not load users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => `${u.fullName} ${u.email} ${u.phone} ${u.role}`.toLowerCase().includes(term));
  }, [users, q]);

  async function changeRole(uid: string, role: Role) {
    await updateDoc(doc(db, USERS_COLLECTION, uid), { role }).catch((e) => setError((e as Error).message));
    await load();
  }
  async function toggleStatus(u: UserProfile) {
    const status = u.status === 'active' ? 'disabled' : 'active';
    await updateDoc(doc(db, USERS_COLLECTION, u.uid), { status }).catch((e) => setError((e as Error).message));
    await load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-extrabold text-ink">Users</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, role…"
          className="h-9 w-64 rounded-pill border border-slate-300 px-4 text-sm focus:border-teal focus:outline-none"
          data-testid="user-search"
        />
      </div>

      {error ? <p className="mb-3 rounded-card bg-amber/10 px-4 py-2 text-sm text-amber-dark">{error}</p> : null}

      <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">No users found.</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.uid} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 font-medium text-ink">{u.fullName}</td>
                  <td className="p-3 text-slate-600">{u.email}</td>
                  <td className="p-3 text-slate-500">{u.phone || '—'}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.uid, e.target.value as Role)}
                      className="rounded-pill border border-slate-300 px-2 py-1 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleStatus(u)}
                      className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${u.status === 'active' ? 'bg-teal/15 text-teal' : 'bg-red-100 text-red-600'}`}
                    >
                      {u.status === 'active' ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">Role &amp; status changes are enforced by Firestore Security Rules.</p>
    </div>
  );
}
