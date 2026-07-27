import { test, expect } from '@playwright/test';
import { loginAsAdmin as registerAdmin, uniq } from './helpers/auth';

test.describe('Middleware protection', () => {
  test('guest hitting an admin API is blocked at the edge (401)', async ({ page }) => {
    const res = await page.request.get('/api/admin/stats');
    expect(res.status()).toBe(401);
  });

  test('guest hitting an admin page is redirected to login', async ({ page }) => {
    await page.goto('/admin/roles');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('CSRF protection', () => {
  test('admin mutation without a CSRF token is rejected (403)', async ({ page }) => {
    await registerAdmin(page);
    // Direct PUT carries the session cookie but no x-csrf-token header.
    const res = await page.request.put('/api/admin/cms/homepage', { data: { hero: {}, seo: {} } });
    expect(res.status()).toBe(403);
  });
});

test.describe('CMS — edit without code', () => {
  test('editing the homepage hero reflects on the public site', async ({ page }) => {
    await registerAdmin(page);
    await page.goto('/admin/hero-sections');
    const newTitle = `Grow your coaching brand ${uniq()}`;
    const input = page.getByTestId('hero-title-input');
    await expect(input).toBeVisible();
    await input.fill(newTitle);
    await page.getByTestId('homepage-save').click();
    await expect(page.getByTestId('save-ok')).toBeVisible();

    await page.goto('/');
    await expect(page.getByTestId('hero-title')).toHaveText(newTitle);
  });

  test('creating a program publishes it to the public site', async ({ page }) => {
    await registerAdmin(page);
    await page.goto('/admin/programs');
    await page.getByTestId('new-program').click();
    const name = `Accelerator ${uniq()}`;
    await page.getByTestId('program-name').fill(name);
    await page.getByTestId('program-save').click();
    await expect(page.getByTestId('program-row').filter({ hasText: name })).toBeVisible();

    await page.goto('/programs');
    await expect(page.getByText(name).first()).toBeVisible();
  });
});

test.describe('Roles & Permissions', () => {
  test('admin can view the permission matrix and toggle a role permission', async ({ page }) => {
    await registerAdmin(page);
    await page.goto('/admin/roles');
    await page.getByTestId('role-tab-manager').click();
    const perm = page.getByTestId('perm-manager-content.edit');
    await expect(perm).toBeVisible();
    await perm.click();
    await page.getByTestId('roles-save').click();
    await expect(page.getByText('Saved ✓')).toBeVisible();
  });
});
