import { test, expect } from '@playwright/test';
import { loginAsAdmin, registerUser as register, uniq } from './helpers/auth';

test.describe('Admin access control', () => {
  test('logged-out user is redirected to login', async ({ page }) => {
    const res = await page.goto('/admin');
    // Redirected to /login?next=/admin
    await expect(page).toHaveURL(/\/login/);
    expect(res).toBeTruthy();
  });

  test('non-admin user is denied', async ({ page }) => {
    await register(page, `user_${uniq()}@example.com`);
    await page.goto('/admin');
    await expect(page.getByText(/access denied/i)).toBeVisible();
  });

  test('admin API rejects non-admins with 403', async ({ page }) => {
    await register(page, `user_${uniq()}@example.com`);
    const res = await page.request.get('/api/admin/submissions');
    expect(res.status()).toBe(403);
  });

  test('admin user can open the dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Forms/ }).first()).toBeVisible();
  });
});

test.describe('Form → Admin auto-registration', () => {
  test('a public submission appears in the admin panel and is manageable', async ({ page }) => {
    const email = `lead_${uniq()}@example.com`;
    // Public submission via the shared ingest endpoint (any form).
    const submit = await page.request.post('/api/submit', {
      data: { formKey: 'contact', formLabel: 'Contact Form', name: 'Test Lead', email, phone: '+91 90000 00000' },
    });
    expect(submit.status()).toBe(201);

    // Become an admin and open the auto-registered form.
    await loginAsAdmin(page);
    await page.goto('/admin/forms');
    await expect(page.getByTestId('form-card-contact')).toBeVisible();

    await page.goto('/admin/forms/contact');
    await page.getByTestId('admin-search').fill(email);
    await page.locator('form').first().evaluate((f: HTMLFormElement) => f.requestSubmit());
    const row = page.getByTestId('submission-row').filter({ hasText: email });
    await expect(row).toBeVisible();

    // Change its status → qualified.
    await row.locator('select').selectOption('qualified');
    await expect(page.getByTestId('empty-state')).toHaveCount(0);

    // Export is available.
    await expect(page.getByTestId('admin-export')).toBeVisible();
  });

  test('admin can filter by status and see empty state', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/forms/contact');
    await page.getByTestId('admin-search').fill(`no_match_${uniq()}`);
    await page.locator('form').first().evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });
});
