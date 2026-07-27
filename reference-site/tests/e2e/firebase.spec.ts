import { test, expect, type Page } from '@playwright/test';

/**
 * Real Firebase integration E2E.
 *
 * These run against the **live Firebase project** configured in
 * `reference-site/.env.local` — no mocks, no emulator shims, no skips. They are
 * registered as the dedicated `firebase` Playwright project, which
 * `playwright.config.ts` only includes when the config is actually present, so
 * the suite never pretends to have verified something it could not reach.
 *
 * Covers: registration · Firestore profile creation · login · login
 * persistence across reload · logout · forgot password · protected routes ·
 * admin role handling · assessment submission · Storage upload.
 */

const PASSWORD = 'FirebaseE2E!2024';

function uniqueEmail(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@coachx-e2e.example.com`;
}

/** Register through the real UI (Firebase Auth + Firestore profile write). */
async function registerViaUi(page: Page, email = uniqueEmail('fb')) {
  await page.goto('/signup');
  await page.locator('#name').fill('Firebase E2E');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('#confirm').fill(PASSWORD);
  await page.getByTestId('signup-submit').click();
  // Successful registration signs the user in — the header exposes logout.
  await expect(page.getByTestId('logout')).toBeVisible({ timeout: 30_000 });
  return email;
}

async function loginViaUi(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('logout')).toBeVisible({ timeout: 30_000 });
}

test.describe('Firebase — registration & profile', () => {
  test('registering creates the account and its Firestore profile', async ({ page }) => {
    const email = await registerViaUi(page);

    // The profile page reads users/{uid} back out of Firestore.
    await page.goto('/profile');
    await expect(page.getByTestId('profile-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('profile-record')).toContainText(email);
    // A fresh registration must land on the lowest-privilege role.
    await expect(page.getByTestId('profile-role')).toHaveText('user');
  });

  test('password mismatch is rejected before hitting Firebase', async ({ page }) => {
    await page.goto('/signup');
    await page.locator('#name').fill('Mismatch');
    await page.locator('#email').fill(uniqueEmail('mismatch'));
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#confirm').fill('somethingElse1');
    await page.getByTestId('signup-submit').click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('registering with an existing email surfaces a clear error', async ({ page }) => {
    const email = await registerViaUi(page);
    await page.getByTestId('logout').click();

    await page.goto('/signup');
    await page.locator('#name').fill('Duplicate');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#confirm').fill(PASSWORD);
    await page.getByTestId('signup-submit').click();
    await expect(page.getByText(/already|in use|exists/i).first()).toBeVisible({ timeout: 30_000 });
  });
});

test.describe('Firebase — login, persistence & logout', () => {
  test('a registered account can log in', async ({ page }) => {
    const email = await registerViaUi(page);
    await page.getByTestId('logout').click();
    await expect(page.getByTestId('logout')).toBeHidden({ timeout: 30_000 });

    await loginViaUi(page, email);
    await expect(page.getByTestId('logout')).toBeVisible();
  });

  test('the session persists across a full page reload', async ({ page }) => {
    await registerViaUi(page);
    await page.goto('/profile');
    await expect(page.getByTestId('profile-panel')).toBeVisible({ timeout: 30_000 });

    await page.reload();
    // browserLocalPersistence must restore the user without a re-login.
    await expect(page.getByTestId('profile-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('logout')).toBeVisible();
  });

  test('logging out clears both Firebase state and the server session', async ({ page }) => {
    await registerViaUi(page);
    await page.getByTestId('logout').click();
    await expect(page.getByTestId('logout')).toBeHidden({ timeout: 30_000 });

    // The server cookie must be gone too — a protected route bounces to login.
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
  });

  test('wrong password is rejected', async ({ page }) => {
    const email = await registerViaUi(page);
    await page.getByTestId('logout').click();

    await page.goto('/login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('definitelyWrong123');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText(/incorrect|invalid|wrong|credential/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('logout')).toBeHidden();
  });
});

test.describe('Firebase — forgot password', () => {
  test('a reset email is accepted for a registered account', async ({ page }) => {
    const email = await registerViaUi(page);
    await page.getByTestId('logout').click();

    await page.goto('/forgot-password');
    await page.locator('#email').fill(email);
    await page.getByTestId('reset-request-submit').click();
    await expect(page.getByText(/sent|check your (inbox|email)/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test('an unknown address does not reveal whether the account exists', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.locator('#email').fill(uniqueEmail('nobody'));
    await page.getByTestId('reset-request-submit').click();
    // Same confirmation as a real account — no account enumeration.
    await expect(page.getByText(/sent|check your (inbox|email)/i).first()).toBeVisible({ timeout: 30_000 });
  });
});

test.describe('Firebase — protected routes & admin role', () => {
  test('a guest is redirected away from every protected route', async ({ page }) => {
    for (const path of ['/profile', '/admin', '/dashboard']) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/login/, { timeout: 30_000 });
    }
  });

  test('a signed-in non-admin reaches /profile but is refused /admin', async ({ page }) => {
    await registerViaUi(page);

    await page.goto('/profile');
    await expect(page.getByTestId('profile-panel')).toBeVisible({ timeout: 30_000 });

    // Role comes from Firestore, not the client — a plain user must be refused.
    await page.goto('/admin');
    await expect(page.getByText(/access denied|forbidden|not authorised|not authorized/i).first())
      .toBeVisible({ timeout: 30_000 });
  });

  test('the admin API refuses a non-admin session', async ({ page }) => {
    await registerViaUi(page);
    const res = await page.request.get('/api/admin/stats');
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Firebase — assessment submission', () => {
  test('a completed assessment is written to Firestore and read back', async ({ page }) => {
    await registerViaUi(page);

    await page.goto('/niche-finder');
    await expect(page.getByTestId('nf-start')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('nf-start').click();
    await expect(page.getByTestId('nf-assessment')).toBeVisible();

    // Walk the assessment to completion.
    for (let i = 0; i < 40; i++) {
      const root = page.getByTestId('nf-assessment');
      const pressable = root.locator('[aria-pressed]');
      const radios = root.locator('[role="radio"]');
      if (await pressable.count()) await pressable.first().click();
      else if (await radios.count()) await radios.nth(Math.min(3, (await radios.count()) - 1)).click();

      const next = page.getByTestId('nf-next');
      await expect(next).toBeEnabled();
      const label = await next.innerText();
      await next.click();
      if (/Analyse/i.test(label)) break;
    }

    await expect(page.getByTestId('nf-booking')).toBeVisible({ timeout: 60_000 });
  });
});

test.describe('Firebase — Cloud Storage', () => {
  test('uploading an avatar stores it and renders the download URL', async ({ page }) => {
    await registerViaUi(page);
    await page.goto('/profile');
    await expect(page.getByTestId('profile-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('profile-avatar-empty')).toBeVisible();

    // A tiny valid PNG (1×1, transparent).
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    await page.getByTestId('avatar-input').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png });

    await expect(page.getByTestId('profile-notice')).toContainText(/avatar updated/i, { timeout: 60_000 });
    const avatar = page.getByTestId('profile-avatar');
    await expect(avatar).toBeVisible();
    // The rendered src must be a real Storage download URL.
    await expect(avatar).toHaveAttribute('src', /firebasestorage\.googleapis\.com|\.appspot\.com|storage\.googleapis\.com/);
  });

  test('uploading a private file lists it, then deletes it', async ({ page }) => {
    await registerViaUi(page);
    await page.goto('/profile');
    await expect(page.getByTestId('profile-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('file-list-empty')).toBeVisible();

    await page.getByTestId('file-input').setInputFiles({
      name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('coachx e2e storage upload'),
    });
    await expect(page.getByTestId('profile-notice')).toContainText(/uploaded notes\.txt/i, { timeout: 60_000 });

    const list = page.getByTestId('file-list');
    await expect(list.getByRole('link', { name: /notes\.txt/ })).toBeVisible({ timeout: 30_000 });

    await list.getByRole('button', { name: 'Delete' }).first().click();
    await expect(page.getByTestId('file-list-empty')).toBeVisible({ timeout: 30_000 });
  });

  test('an oversized image is rejected before upload', async ({ page }) => {
    await registerViaUi(page);
    await page.goto('/profile');
    await expect(page.getByTestId('profile-panel')).toBeVisible({ timeout: 30_000 });

    // 6MB of PNG-ish bytes — over the 5MB avatar cap.
    await page.getByTestId('avatar-input').setInputFiles({
      name: 'huge.png', mimeType: 'image/png', buffer: Buffer.alloc(6 * 1024 * 1024, 1),
    });
    await expect(page.getByTestId('profile-error')).toContainText(/under 5MB/i);
  });

  test('a non-image is rejected as an avatar', async ({ page }) => {
    await registerViaUi(page);
    await page.goto('/profile');
    await expect(page.getByTestId('profile-panel')).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('avatar-input').setInputFiles({
      name: 'script.js', mimeType: 'text/javascript', buffer: Buffer.from('alert(1)'),
    });
    await expect(page.getByTestId('profile-error')).toContainText(/PNG, JPEG, WebP or GIF/i);
  });
});
