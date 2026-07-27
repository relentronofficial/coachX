'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from './adminFetch';
import { PERMISSIONS, ROLES, ROLE_LABELS, type Permission, type Role } from '@/lib/auth/permissions';

/** View & edit each role's permissions (super-admin is fixed). */
export function RolesManager() {
  const [matrix, setMatrix] = useState<Record<Role, Permission[]> | null>(null);
  const [role, setRole] = useState<Role>('admin');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/roles', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setMatrix(d.matrix));
  }, []);

  const editable = role !== 'super-admin' && role !== 'user';
  const current = useMemo(() => new Set(matrix?.[role] ?? []), [matrix, role]);

  function toggle(perm: Permission) {
    if (!matrix || !editable) return;
    const next = new Set(current);
    if (next.has(perm)) next.delete(perm);
    else next.add(perm);
    setMatrix({ ...matrix, [role]: [...next] });
    setSaved(false);
  }

  async function save() {
    if (!matrix) return;
    setSaving(true);
    await adminFetch('/api/admin/roles', { method: 'PUT', body: JSON.stringify({ role, permissions: matrix[role] }) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!matrix) return <p className="text-slate-400">Loading…</p>;

  const groups = [...new Set(PERMISSIONS.map((p) => p.group))];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Roles &amp; Permissions</h1>
      <p className="mt-1 text-sm text-slate-500">Configure what each role can do. Changes apply on the user’s next login.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {ROLES.filter((r) => r !== 'user').map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-pill px-4 py-2 text-sm font-semibold ${role === r ? 'bg-teal text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            data-testid={`role-tab-${r}`}
          >
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-card border border-slate-200 bg-white p-6">
        {role === 'super-admin' ? (
          <p className="text-sm text-slate-500">Super Admin always has every permission.</p>
        ) : (
          <>
            {groups.map((group) => (
              <div key={group} className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{group}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {PERMISSIONS.filter((p) => p.group === group).map((p) => (
                    <label key={p.key} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={current.has(p.key)} onChange={() => toggle(p.key)} data-testid={`perm-${role}-${p.key}`} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60" data-testid="roles-save">
                {saving ? 'Saving…' : 'Save permissions'}
              </button>
              {saved ? <span className="text-sm font-semibold text-teal">Saved ✓</span> : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
