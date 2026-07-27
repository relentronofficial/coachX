import { describe, it, expect, afterEach } from 'vitest';
import { isAdminEmail, resolveRole } from '@/lib/auth/roles';

const original = process.env.ADMIN_EMAILS;
afterEach(() => {
  if (original === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = original;
});

describe('isAdminEmail', () => {
  it('uses ADMIN_EMAILS when configured', () => {
    process.env.ADMIN_EMAILS = 'boss@coachx.com, ops@coachx.com';
    expect(isAdminEmail('boss@coachx.com')).toBe(true);
    expect(isAdminEmail('BOSS@coachx.com')).toBe(true);
    expect(isAdminEmail('admin@example.com')).toBe(false); // fallback disabled when list set
    expect(isAdminEmail('user@coachx.com')).toBe(false);
  });

  it('falls back to admin@ prefix when unset', () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail('admin@example.com')).toBe(true);
    expect(isAdminEmail('coach@example.com')).toBe(false);
  });
});

describe('resolveRole', () => {
  it('promotes admin emails to super-admin and respects stored role otherwise', () => {
    delete process.env.ADMIN_EMAILS;
    expect(resolveRole('admin@x.com')).toBe('super-admin');
    expect(resolveRole('user@x.com')).toBe('user');
    expect(resolveRole('user@x.com', 'manager')).toBe('manager');
  });
});
