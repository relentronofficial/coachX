import { describe, it, expect } from 'vitest';
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS, isAdminRole, asRole } from '@/lib/auth/permissions';

describe('RBAC catalog', () => {
  it('super-admin has every permission; user has none', () => {
    expect(DEFAULT_ROLE_PERMISSIONS['super-admin'].length).toBe(PERMISSIONS.length);
    expect(DEFAULT_ROLE_PERMISSIONS.user).toEqual([]);
  });

  it('editor can edit content but not manage users', () => {
    expect(DEFAULT_ROLE_PERMISSIONS.editor).toContain('content.edit');
    expect(DEFAULT_ROLE_PERMISSIONS.editor).not.toContain('users.manage');
  });

  it('support can view submissions but not edit content', () => {
    expect(DEFAULT_ROLE_PERMISSIONS.support).toContain('submissions.view');
    expect(DEFAULT_ROLE_PERMISSIONS.support).not.toContain('content.edit');
  });

  it('admin lacks roles.manage (reserved for super-admin)', () => {
    expect(DEFAULT_ROLE_PERMISSIONS.admin).not.toContain('roles.manage');
    expect(DEFAULT_ROLE_PERMISSIONS['super-admin']).toContain('roles.manage');
  });

  it('isAdminRole allows every role except plain user', () => {
    expect(isAdminRole('user')).toBe(false);
    for (const r of ['super-admin', 'admin', 'manager', 'editor', 'support'] as const) {
      expect(isAdminRole(r)).toBe(true);
    }
  });

  it('asRole normalises unknown values to user', () => {
    expect(asRole('manager')).toBe('manager');
    expect(asRole('nonsense')).toBe('user');
    expect(asRole(undefined)).toBe('user');
  });
});
