import { expect, type Page } from '@playwright/test';

/**
 * Shared E2E auth helpers.
 *
 * ## Why the admin identity is fixed
 *
 * `lib/auth/roles.ts` resolves admins like this: if `ADMIN_EMAILS` is set, ONLY
 * the addresses on that list are admins; if it is unset, any address starting
 * with `admin@` is treated as one (a dev convenience). That is the correct,
 * secure behaviour — an explicit allow-list must not be silently widened by a
 * prefix rule.
 *
 * The specs used to lean on the `admin@…` fallback, which meant they only
 * passed on machines with no `ADMIN_EMAILS` configured, and broke the moment a
 * real `.env.local` existed. So the identity is now explicit instead: a single
 * known address that `playwright.config.ts` puts on `ADMIN_EMAILS` for the
 * server under test. No production logic changes, and the result is the same
 * locally and in CI.
 *
 * Override with `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` if the defaults clash
 * with a real account in your `.data/users.json`.
 */

export const E2E_ADMIN_EMAIL = (process.env.E2E_ADMIN_EMAIL ?? 'e2e-admin@coachx.test').trim().toLowerCase();
export const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'supersecret1';

/** Suffix on the role assertion — turns a mystery timeout into a fix-it message. */
const SETUP_HINT =
  `Expected ${E2E_ADMIN_EMAIL} to resolve as an admin, but the server said otherwise.\n` +
  `  The server under test must run with ADMIN_EMAILS containing "${E2E_ADMIN_EMAIL}".\n` +
  `  playwright.config.ts sets this on its own webServer — but with\n` +
  `  reuseExistingServer enabled it will happily reuse a server you started by\n` +
  `  hand on :3100 without it. Stop that server and re-run, or start it with\n` +
  `  ADMIN_EMAILS=${E2E_ADMIN_EMAIL}.`;

export const uniq = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/** The server's own view of the session behind this browser context. */
export async function sessionUser(page: Page): Promise<{ email: string; name: string; role: string } | null> {
  const res = await page.request.get('/api/auth/session');
  if (!res.ok()) return null;
  const body = (await res.json()) as { user: { email: string; name: string; role: string } | null };
  return body.user;
}

/** Register a fresh non-admin account and sign this context in as it. */
export async function registerUser(page: Page, email = `user_${uniq()}@example.com`, password = 'supersecret1'): Promise<string> {
  const res = await page.request.post('/api/auth/signup', {
    data: { name: email.split('@')[0], email, password },
  });
  expect(res.ok(), `signup failed for ${email} (HTTP ${res.status()})`).toBeTruthy();
  return email;
}

/**
 * Sign this browser context in as the shared E2E admin.
 *
 * Creates the account on first use and logs in afterwards, so it is safe to
 * call from every admin spec, from parallel workers, and across repeated runs
 * against the same `.data/users.json` (which the suite never resets).
 */
export async function loginAsAdmin(page: Page): Promise<string> {
  const signup = await page.request.post('/api/auth/signup', {
    data: { name: 'E2E Admin', email: E2E_ADMIN_EMAIL, password: E2E_ADMIN_PASSWORD },
  });

  if (!signup.ok()) {
    // 409 = already created, by an earlier test, worker, or run.
    expect(
      signup.status(),
      `unexpected signup failure for ${E2E_ADMIN_EMAIL}: HTTP ${signup.status()}`,
    ).toBe(409);
    const login = await page.request.post('/api/auth/login', {
      data: { email: E2E_ADMIN_EMAIL, password: E2E_ADMIN_PASSWORD },
    });
    expect(
      login.ok(),
      `login failed for ${E2E_ADMIN_EMAIL} (HTTP ${login.status()}). If this account exists in ` +
        `.data/users.json with a different password, set E2E_ADMIN_EMAIL to something unused.`,
    ).toBeTruthy();
  }

  const user = await sessionUser(page);
  expect(user?.role ?? '(no session)', SETUP_HINT).toMatch(/admin/);
  return E2E_ADMIN_EMAIL;
}
