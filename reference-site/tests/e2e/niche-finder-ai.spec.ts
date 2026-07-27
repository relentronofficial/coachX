import { test, expect, type Page } from '@playwright/test';
import { loginAsAdmin, registerUser, uniq } from './helpers/auth';

/**
 * E2E coverage for the enterprise AI Niche Finder (/niche-finder).
 *
 * Auth uses the file-backed /api/auth/signup route (sets the cx_session cookie),
 * which the AuthProvider consumes when Firebase is not configured — so these run
 * without a Firebase project, matching the rest of the suite.
 */

/** Register a fresh account via the API (also signs in via the session cookie). */
async function register(page: Page, opts: { admin?: boolean } = {}): Promise<string> {
  if (opts.admin) return loginAsAdmin(page);
  return registerUser(page, `e2e_${uniq()}@example.com`);
}

/** Land on the tool, authenticated. Waits for the session fetch so start works. */
async function openAuthed(page: Page) {
  const session = page.waitForResponse((r) => r.url().includes('/api/auth/session'), { timeout: 15000 }).catch(() => null);
  await page.goto('/niche-finder');
  await session; // AuthProvider has resolved the session cookie → authenticated
  await page.waitForTimeout(200);
  await expect(page.getByTestId('nf-start')).toBeVisible();
}

/** Answer whatever the current step needs (handles every input type). */
async function answerStep(page: Page) {
  const root = page.getByTestId('nf-assessment');
  const niche = root.getByTestId('nf-topic-select'); // progressive discovery niche card
  if (await niche.count()) {
    await niche.first().click();
    return;
  }
  const pressable = root.locator('[aria-pressed]'); // single / multi / multiSelect options
  const radios = root.locator('[role="radio"]'); // scale (and single, which is also pressable)
  if (await pressable.count()) {
    await pressable.first().click();
  } else if (await radios.count()) {
    await radios.nth(Math.min(3, (await radios.count()) - 1)).click(); // scale value
  }
  // ranking (pre-ordered), tags & text (optional) are already valid — no action.
}

/** Walk the full assessment to the booking page (users never see results). */
async function completeAssessment(page: Page) {
  await page.getByTestId('nf-start').click();
  await expect(page.getByTestId('nf-assessment')).toBeVisible();
  for (let i = 0; i < 40; i++) {
    await answerStep(page);
    const next = page.getByTestId('nf-next');
    await expect(next).toBeEnabled();
    const label = await next.innerText();
    await next.click();
    if (/Analyse/i.test(label)) break; // clicked the final step → processing
  }
  await expect(page.getByTestId('nf-booking')).toBeVisible({ timeout: 20000 });
}

test.describe('AI Niche Finder — guest', () => {
  test('starting the assessment while logged out shows the login gate', async ({ page }) => {
    await page.goto('/niche-finder');
    await expect(page.getByTestId('nf-start')).toBeVisible();
    await page.getByTestId('nf-start').click();
    await expect(page.getByText('🔒 Login Required')).toBeVisible();
  });

  test('theme toggle switches dark/light', async ({ page }) => {
    await page.goto('/niche-finder');
    await expect(page.getByTestId('nf-start')).toBeVisible(); // hydrated + theme effect settled
    const root = page.getByTestId('nf-root');
    const before = await root.getAttribute('data-cx-theme');
    await page.getByTestId('nf-theme').click();
    // Assert the theme actually changed (avoids SSR-vs-hydration value races).
    await expect.poll(async () => root.getAttribute('data-cx-theme'), { timeout: 8000 }).not.toBe(before);
    const after = await root.getAttribute('data-cx-theme');
    expect([before, after].sort()).toEqual(['dark', 'light']);
  });
});

test.describe('AI Niche Finder — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await register(page);
  });

  test('completes the flow → booking page (NO results) → book call → confirmation', async ({ page }) => {
    test.setTimeout(60_000);
    await openAuthed(page);
    await completeAssessment(page);

    // The user is taken to booking — NO score/analysis/result is ever shown.
    await expect(page.getByText('Thank you for completing your assessment.')).toBeVisible();
    await expect(page.getByTestId('nf-result')).toHaveCount(0);
    await expect(page.getByText(/best-fit niche|niche score|recommendation/i)).toHaveCount(0);

    // Book the free call.
    await page.getByTestId('nf-book-cta').click();
    await expect(page.getByTestId('nf-booking-form')).toBeVisible();
    await page.getByTestId('bk-name').fill('E2E Coach');
    await page.getByTestId('bk-email').fill('booking@example.com');
    await page.getByTestId('bk-phone').fill('+91 9000000000');
    await page.getByTestId('bk-date').fill('2026-08-01');
    await page.getByTestId('bk-time').fill('10:30');
    await page.getByTestId('nf-booking-submit').click();

    // Booking confirmation.
    await expect(page.getByTestId('nf-booking-confirm')).toBeVisible();
    await expect(page.getByText(/call request is confirmed/i)).toBeVisible();
  });

  test('booking form validates required fields', async ({ page }) => {
    test.setTimeout(60_000);
    await openAuthed(page);
    await completeAssessment(page);
    await page.getByTestId('nf-book-cta').click();
    await page.getByTestId('bk-name').fill('');
    await page.getByTestId('bk-email').fill('');
    await page.getByTestId('nf-booking-submit').click();
    await expect(page.getByText(/please fill in your name/i)).toBeVisible();
    await expect(page.getByTestId('nf-booking-confirm')).toHaveCount(0);
  });

  test('autosaves progress and offers Resume after reload', async ({ page }) => {
    await openAuthed(page);
    await page.getByTestId('nf-start').click();
    await answerStep(page);
    await page.getByTestId('nf-next').click();
    await expect(page.getByTestId('nf-assessment')).toContainText(/Step 2 of/);
    await page.reload();
    await expect(page.getByTestId('nf-resume')).toBeVisible();
  });

  test('validation blocks advancing until a required step is answered', async ({ page }) => {
    await openAuthed(page);
    await page.getByTestId('nf-start').click();
    // First step is a required multi-choice — Next is disabled until a pick.
    await expect(page.getByTestId('nf-next')).toBeDisabled();
    await answerStep(page);
    await expect(page.getByTestId('nf-next')).toBeEnabled();
  });

  test('discovery: rails give a starting point and adding a niche enables Next', async ({ page }) => {
    await openAuthed(page);
    await page.getByTestId('nf-start').click();
    const discovery = page.getByTestId('nf-discovery');
    await expect(discovery).toBeVisible();
    await expect(discovery).toHaveAttribute('data-mode', 'select');

    // The user is never met with a flat list — rails and category cards first.
    await expect(discovery.getByTestId('nf-rail').first()).toBeVisible();
    await expect(discovery.getByTestId('nf-category-card').first()).toBeVisible();
    await expect(page.getByTestId('nf-next')).toBeDisabled();

    await discovery.getByTestId('nf-topic-select').first().click();
    await expect(discovery.getByTestId('nf-selection-count')).toHaveText(/1 picked/);
    await expect(page.getByTestId('nf-next')).toBeEnabled();
  });

  test('discovery: a pick can be removed from the selection tray', async ({ page }) => {
    await openAuthed(page);
    await page.getByTestId('nf-start').click();
    const discovery = page.getByTestId('nf-discovery');

    await discovery.getByTestId('nf-topic-select').first().click();
    const tray = discovery.getByTestId('nf-selection-tray');
    await expect(tray).toBeVisible();

    await tray.getByRole('button', { name: /^Remove / }).first().click();
    await expect(discovery.getByTestId('nf-selection-count')).toHaveText(/0 picked/);
    await expect(page.getByTestId('nf-next')).toBeDisabled();
  });

  test('discovery: progressive navigation drills category → subcategory → niches', async ({ page }) => {
    await openAuthed(page);
    await page.getByTestId('nf-start').click();
    const discovery = page.getByTestId('nf-discovery');

    await discovery.getByTestId('nf-category-card').first().click();
    await expect(discovery.getByTestId('nf-subcategory-explorer')).toBeVisible();
    await expect(discovery.getByTestId('nf-breadcrumbs')).toBeVisible();

    await discovery.getByTestId('nf-subcategory-card').first().click();
    await expect(discovery.getByTestId('nf-niche-grid')).toBeVisible();
    await expect(discovery.getByTestId('nf-result-count')).toBeVisible();

    // Breadcrumb walks back up the hierarchy.
    await discovery.getByTestId('nf-breadcrumbs').getByRole('button', { name: 'All niches' }).click();
    await expect(discovery.getByTestId('nf-category-explorer')).toBeVisible();
  });

  test('discovery: typo-tolerant search finds niches and highlights the match', async ({ page }) => {
    await openAuthed(page);
    await page.getByTestId('nf-start').click();
    const discovery = page.getByTestId('nf-discovery');

    await discovery.getByTestId('nf-search-input').fill('fittness'); // deliberate typo
    await expect(discovery.getByTestId('nf-search-suggestions')).toBeVisible();
    await discovery.getByTestId('nf-search-input').press('Enter');

    await expect(discovery.getByTestId('nf-niche-grid')).toBeVisible();
    await expect(discovery.getByTestId('nf-niche-card').first()).toBeVisible();
  });

  test('discovery: search highlighting marks the matched run', async ({ page }) => {
    await openAuthed(page);
    await page.getByTestId('nf-start').click();
    const discovery = page.getByTestId('nf-discovery');

    await discovery.getByTestId('nf-search-input').fill('fitness');
    await discovery.getByTestId('nf-search-input').press('Enter');
    await expect(discovery.getByTestId('nf-niche-card').first()).toBeVisible();
    await expect(discovery.locator('mark').first()).toBeVisible();
  });

  test('discovery: a hopeless search offers a way out instead of a dead end', async ({ page }) => {
    await openAuthed(page);
    await page.getByTestId('nf-start').click();
    const discovery = page.getByTestId('nf-discovery');

    await discovery.getByTestId('nf-search-input').fill('zzzqqqxyzzy');
    await discovery.getByTestId('nf-search-input').press('Enter');

    const empty = discovery.getByTestId('nf-empty-state');
    await expect(empty).toBeVisible();
    await expect(empty).toContainText("We couldn't find an exact match.");
  });

  test('discovery: filters narrow the list and can be cleared', async ({ page }) => {
    await openAuthed(page);
    await page.getByTestId('nf-start').click();
    const discovery = page.getByTestId('nf-discovery');

    await discovery.getByTestId('nf-search-input').fill('coach');
    await discovery.getByTestId('nf-search-input').press('Enter');
    await expect(discovery.getByTestId('nf-niche-grid')).toBeVisible();
    const before = Number((await discovery.getByTestId('nf-result-count').innerText()).replace(/[^0-9]/g, ''));

    await discovery.getByTestId('nf-filters-toggle').click();
    await expect(discovery.getByTestId('nf-filters-panel')).toBeVisible();
    await discovery.getByLabel('Income potential').selectOption('Very High');

    await expect
      .poll(async () => Number((await discovery.getByTestId('nf-result-count').innerText()).replace(/[^0-9]/g, '')), { timeout: 8000 })
      .toBeLessThan(before);
  });

  test('discovery: only the visible rows are mounted (10k topics stay virtualized)', async ({ page }) => {
    await openAuthed(page);
    await page.getByTestId('nf-start').click();
    const discovery = page.getByTestId('nf-discovery');

    await discovery.getByTestId('nf-search-input').fill('coach');
    await discovery.getByTestId('nf-search-input').press('Enter');
    await expect(discovery.getByTestId('nf-niche-grid')).toBeVisible();

    const total = Number((await discovery.getByTestId('nf-result-count').innerText()).replace(/[^0-9]/g, ''));
    expect(total).toBeGreaterThan(100);
    // Far fewer cards in the DOM than results — the grid is windowed.
    expect(await discovery.getByTestId('nf-niche-grid').getByTestId('nf-niche-card').count()).toBeLessThan(60);
  });

  test('discovery: details drawer shows the full topic profile', async ({ page }) => {
    await openAuthed(page);
    await page.getByTestId('nf-start').click();
    const discovery = page.getByTestId('nf-discovery');
    await discovery.getByTestId('nf-niche-details').first().click();

    const drawer = page.getByTestId('nf-topic-drawer');
    await expect(drawer).toBeVisible();
    for (const field of ['Coaching type', 'Industry', 'Skill level', 'Experience level', 'Revenue potential', 'Market demand', 'Competition', 'Content formats', 'Offer types', 'Certifications']) {
      await expect(drawer.getByText(field, { exact: true })).toBeVisible();
    }
    // Selecting from the drawer updates the count.
    await page.getByTestId('nf-drawer-select').click();
    await expect(discovery.getByTestId('nf-selection-count')).toHaveText(/1 picked/);
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });
});

test.describe('AI Niche Finder — admin', () => {
  test('admin can open the management module with all tabs', async ({ page }) => {
    await register(page, { admin: true });
    await page.goto('/admin/niche-finder');
    await expect(page.getByRole('heading', { name: 'AI Niche Finder' })).toBeVisible();
    for (const tab of ['questions', 'categories', 'topics', 'results', 'analytics', 'settings']) {
      await expect(page.getByRole('button', { name: tab, exact: false }).first()).toBeVisible();
    }
    // Settings tab renders the scoring-weights controls.
    await page.getByRole('button', { name: 'settings', exact: false }).first().click();
    await expect(page.getByText('Scoring weights')).toBeVisible();

    // Topic Management tab renders with the full library.
    await page.getByRole('button', { name: 'topics', exact: false }).first().click();
    await expect(page.getByRole('heading', { name: 'Topic Management' })).toBeVisible();
    await expect(page.getByText(/topics/).first()).toBeVisible();

    // Categories tab: CRUD entry points + reordering controls.
    await page.getByRole('button', { name: 'categories', exact: true }).last().click();
    await expect(page.getByRole('button', { name: '+ New category' })).toBeVisible();
    await expect(page.getByText(/\d+ categories · \d+ subcategories/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Move .* up/ }).first()).toBeVisible();

    // Subcategory management expands inline under a category.
    await page.getByRole('button', { name: 'subs', exact: true }).first().click();
    await expect(page.getByRole('button', { name: '+ add subcategory' }).first()).toBeVisible();
  });

  test('admin topic workflow: approval queue, archive and duplicates', async ({ page }) => {
    await register(page, { admin: true });
    await page.goto('/admin/niche-finder');
    await page.getByRole('button', { name: 'topics', exact: false }).first().click();
    await page.getByRole('button', { name: 'workflow', exact: true }).last().click();

    // Approval queue pane (empty without Firebase, but must render its state).
    await expect(page.getByRole('button', { name: /Approval queue/ })).toBeVisible();
    await expect(page.getByText(/Nothing awaiting approval|Topic/).first()).toBeVisible();

    // Archived pane explains the soft-delete behaviour.
    await page.getByRole('button', { name: /Archived/ }).click();
    await expect(page.getByText(/No archived topics|Restore/).first()).toBeVisible();

    // Duplicate detection runs against the live library.
    await page.getByRole('button', { name: /Duplicates/ }).click();
    await expect(page.getByText(/Labels that appear in more than one place/)).toBeVisible();
  });

  test('admin analytics: recommendation accept-rate panel renders', async ({ page }) => {
    await register(page, { admin: true });
    await page.goto('/admin/niche-finder');
    await page.getByRole('button', { name: 'topics', exact: false }).first().click();
    const panel = page.getByTestId('admin-rec-analytics');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('accept rate');
  });

  test('admin topic form exposes draft/published status', async ({ page }) => {
    await register(page, { admin: true });
    await page.goto('/admin/niche-finder');
    await page.getByRole('button', { name: 'topics', exact: false }).first().click();
    await page.getByRole('button', { name: 'library', exact: true }).last().click();
    await page.getByRole('button', { name: '+ New topic' }).click();
    const status = page.getByTestId('topic-status');
    await expect(status).toBeVisible();
    await status.selectOption('draft');
    await expect(status).toHaveValue('draft');
  });
});
