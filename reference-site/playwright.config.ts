import { existsSync, readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Spins up the production server on :3100 and runs the tool flows.
 * Run with: npm run build && npm run test:e2e
 */

/**
 * Is a real Firebase project configured?
 *
 * `tests/e2e/firebase.spec.ts` talks to the live backend — registering users,
 * writing Firestore documents, uploading to Storage. Without credentials those
 * tests cannot pass, and pretending otherwise (by skipping them inside the run)
 * would report a green suite that verified nothing. So the `firebase` project
 * is only registered when the config is genuinely present; when it is, the
 * tests run for real with no skips.
 */
function firebaseConfigured(): boolean {
  const required = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'];
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  if (existsSync('.env.local')) {
    for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
    }
  }
  return required.every((k) => env[k] && !env[k].startsWith('your-') && env[k] !== 'change-me');
}

const FIREBASE_SPEC = /firebase\.spec\.ts/;
const withFirebase = firebaseConfigured();

/**
 * Admin identity for the suite. Must match `tests/e2e/helpers/auth.ts`.
 *
 * The server under test gets this on `ADMIN_EMAILS` so admin specs resolve as
 * admins deterministically. Previously they relied on the `admin@…` dev
 * fallback in `lib/auth/roles.ts`, which only applies when `ADMIN_EMAILS` is
 * UNSET — so every admin spec broke as soon as a real `.env.local` existed.
 * Setting it here fixes that identically on a dev machine and in CI, with no
 * change to application logic.
 */
const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'e2e-admin@coachx.test';

/** `process.env` minus the undefined values, which Playwright's `env` rejects. */
const inheritedEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
);

if (!withFirebase) {
  console.warn(
    '\n\x1b[33m⚠ Firebase is not configured (.env.local) — the `firebase` E2E project is NOT registered.\x1b[0m\n' +
    '  Those tests exercise the live backend and cannot pass without credentials.\n' +
    '  Add reference-site/.env.local, then: node scripts/firebase-verify.mjs && npx playwright test\n',
  );
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    // The app suite never runs the Firebase spec — it has its own project.
    { name: 'chromium', testIgnore: FIREBASE_SPEC, use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', testIgnore: FIREBASE_SPEC, use: { ...devices['Pixel 5'] } },
    ...(withFirebase
      ? [{
          name: 'firebase',
          testMatch: FIREBASE_SPEC,
          // Live network round-trips (auth, Firestore, Storage) are slower than
          // local page interactions.
          timeout: 120_000,
          use: { ...devices['Desktop Chrome'] },
        }]
      : []),
  ],
  webServer: {
    command: 'npm run start -- -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...inheritedEnv,
      // Explicit env wins over .env.local (Next only fills in keys that are
      // absent), so this is authoritative however the machine is configured.
      ADMIN_EMAILS: E2E_ADMIN_EMAIL,
      // Keeps session signing deterministic in CI, where there is no .env.local
      // and jwt.ts would otherwise fall back to its dev-only default.
      AUTH_SECRET: process.env.AUTH_SECRET ?? 'e2e-insecure-secret-for-tests-only',
    },
  },
});
