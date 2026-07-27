import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DEFAULT_ROLE_PERMISSIONS, type Permission, type Role, ROLES } from './permissions';
import { isAdminEmail } from './roles';

/**
 * Persisted RBAC configuration:
 *  - permission overrides per role (admin-editable)
 *  - explicit user→role assignments (admin-editable), keyed by email
 * Falls back to code defaults when nothing is stored.
 */

interface RolesConfig {
  permissions: Partial<Record<Role, Permission[]>>;
  assignments: Record<string, Role>; // email → role
}

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'roles.json');

let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

async function read(): Promise<RolesConfig> {
  try {
    const raw = JSON.parse(await fs.readFile(FILE, 'utf8')) as Partial<RolesConfig>;
    return { permissions: raw.permissions ?? {}, assignments: raw.assignments ?? {} };
  } catch {
    return { permissions: {}, assignments: {} };
  }
}
async function write(cfg: RolesConfig): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

/** Effective permissions for a role (stored override or code default). */
export async function getRolePermissions(role: Role): Promise<Permission[]> {
  if (role === 'super-admin') return DEFAULT_ROLE_PERMISSIONS['super-admin'];
  const cfg = await read();
  return cfg.permissions[role] ?? DEFAULT_ROLE_PERMISSIONS[role];
}

/** The full permission matrix for the admin Roles UI. */
export async function getAllRolePermissions(): Promise<Record<Role, Permission[]>> {
  const cfg = await read();
  const out = {} as Record<Role, Permission[]>;
  for (const role of ROLES) {
    out[role] = role === 'super-admin' ? DEFAULT_ROLE_PERMISSIONS['super-admin'] : cfg.permissions[role] ?? DEFAULT_ROLE_PERMISSIONS[role];
  }
  return out;
}

export async function setRolePermissions(role: Role, perms: Permission[]): Promise<void> {
  if (role === 'super-admin') return; // immutable
  await withLock(async () => {
    const cfg = await read();
    cfg.permissions[role] = perms;
    await write(cfg);
  });
}

/** Explicit role assignment for an email (overrides stored user.role). */
export async function getAssignedRole(email: string): Promise<Role | undefined> {
  const cfg = await read();
  return cfg.assignments[email.trim().toLowerCase()];
}

export async function setAssignedRole(email: string, role: Role): Promise<void> {
  await withLock(async () => {
    const cfg = await read();
    cfg.assignments[email.trim().toLowerCase()] = role;
    await write(cfg);
  });
}

/** Full role resolution: env super-admins → assigned role → stored → user. */
export async function resolveEffectiveRole(email: string, storedRole?: Role): Promise<Role> {
  if (isAdminEmail(email)) return 'super-admin';
  return (await getAssignedRole(email)) ?? storedRole ?? 'user';
}

/** Does the role have the permission (super-admin always yes)? */
export async function can(role: Role, permission: Permission): Promise<boolean> {
  if (role === 'super-admin') return true;
  return (await getRolePermissions(role)).includes(permission);
}
