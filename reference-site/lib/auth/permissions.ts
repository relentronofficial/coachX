/**
 * Role-Based Access Control (RBAC) catalog.
 *
 * Roles and the permission matrix are DEFAULTS here; the admin can override a
 * role's permissions at runtime (persisted in .data/roles.json), so access is
 * configurable without code changes. `super-admin` always has every permission.
 */

export type Role = 'super-admin' | 'admin' | 'manager' | 'editor' | 'support' | 'user';

export const ROLES: Role[] = ['super-admin', 'admin', 'manager', 'editor', 'support', 'user'];

export const ROLE_LABELS: Record<Role, string> = {
  'super-admin': 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  editor: 'Editor',
  support: 'Support',
  user: 'User',
};

export type Permission =
  | 'dashboard.view'
  | 'users.manage'
  | 'roles.manage'
  | 'submissions.view'
  | 'submissions.manage'
  | 'submissions.export'
  | 'content.edit'
  | 'programs.manage'
  | 'tools.manage'
  | 'assessments.manage'
  | 'settings.manage'
  | 'audit.view';

export const PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: 'dashboard.view', label: 'View dashboard', group: 'General' },
  { key: 'users.manage', label: 'Manage users', group: 'People' },
  { key: 'roles.manage', label: 'Manage roles & permissions', group: 'People' },
  { key: 'submissions.view', label: 'View submissions', group: 'Submissions' },
  { key: 'submissions.manage', label: 'Edit/delete submissions', group: 'Submissions' },
  { key: 'submissions.export', label: 'Export submissions', group: 'Submissions' },
  { key: 'content.edit', label: 'Edit pages & content (CMS)', group: 'Content' },
  { key: 'programs.manage', label: 'Manage programs', group: 'Catalog' },
  { key: 'tools.manage', label: 'Manage tools', group: 'Catalog' },
  { key: 'assessments.manage', label: 'Manage assessments', group: 'Catalog' },
  { key: 'settings.manage', label: 'Manage site/SEO/theme settings', group: 'System' },
  { key: 'audit.view', label: 'View audit logs', group: 'System' },
];

const ALL: Permission[] = PERMISSIONS.map((p) => p.key);

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  'super-admin': ALL,
  admin: ALL.filter((p) => p !== 'roles.manage'),
  manager: [
    'dashboard.view',
    'submissions.view',
    'submissions.manage',
    'submissions.export',
    'content.edit',
    'programs.manage',
    'tools.manage',
    'assessments.manage',
    'audit.view',
  ],
  editor: ['dashboard.view', 'content.edit', 'programs.manage', 'tools.manage', 'assessments.manage'],
  support: ['dashboard.view', 'submissions.view', 'submissions.manage'],
  user: [],
};

/** Roles that may enter the admin panel at all. */
export function isAdminRole(role: Role): boolean {
  return role !== 'user';
}

export function asRole(value: unknown): Role {
  return ROLES.includes(value as Role) ? (value as Role) : 'user';
}
