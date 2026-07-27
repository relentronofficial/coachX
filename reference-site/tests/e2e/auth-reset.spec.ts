import { test, expect } from '@playwright/test';

/**
 * Full password-reset flow: register → forgot-password (dev link) → set new
 * password → old password rejected, new password works.
 */
// The Firebase-backed forgot-password UI flow is covered for real in
// tests/e2e/firebase.spec.ts. The tests below cover the file-backed
// (legacy/dev) reset API, which does not depend on Firebase.

test('reset link can only be used once', async ({ page }) => {
  const email = `once_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.request.post('/api/auth/signup', { data: { name: 'Once', email, password: 'firstpass12' } });

  const req = await page.request.post('/api/auth/reset/request', { data: { email } });
  const { devResetUrl } = (await req.json()) as { devResetUrl: string };
  const token = new URL(devResetUrl).searchParams.get('token')!;

  const first = await page.request.post('/api/auth/reset/confirm', { data: { token, password: 'secondpass12' } });
  expect(first.ok()).toBeTruthy();
  const second = await page.request.post('/api/auth/reset/confirm', { data: { token, password: 'thirdpass123' } });
  expect(second.status()).toBe(400); // token already consumed
});

test('reset request does not reveal whether an account exists', async ({ page }) => {
  const res = await page.request.post('/api/auth/reset/request', {
    data: { email: `nobody_${Date.now()}@example.com` },
  });
  expect(res.ok()).toBeTruthy();
  const data = (await res.json()) as { ok: boolean; devResetUrl?: string };
  expect(data.ok).toBe(true);
  expect(data.devResetUrl).toBeUndefined(); // no token issued for unknown accounts
});
