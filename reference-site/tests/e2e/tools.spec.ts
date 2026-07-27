import { test, expect, type Page } from '@playwright/test';

const ENGINE_TOOLS = [
  'personal-codex',
  'coach-persona-codex',
  'freedom-business-codex',
  'skills-strength-scorecard',
  'viral-reels-challenge',
  'youtube-domination',
];

const ALL_TOOL_SLUGS = ['niche-finder', ...ENGINE_TOOLS, 'revenue-calculator'];

/** Register a fresh account via the API (also signs in) and return the creds. */
async function register(page: Page): Promise<{ email: string; password: string }> {
  const email = `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = 'supersecret1';
  const res = await page.request.post('/api/auth/signup', {
    data: { name: 'E2E Coach', email, password },
  });
  expect(res.ok()).toBeTruthy();
  return { email, password };
}

/** Ensure the browser context is authenticated (registers a fresh account). */
async function login(page: Page) {
  await register(page);
}

test.describe('Tools index', () => {
  test('lists all seven required tools with working links', async ({ page }) => {
    await page.goto('/tools');
    for (const slug of ['niche-finder', ...ENGINE_TOOLS]) {
      await expect(page.getByTestId(`tool-card-${slug}`)).toBeVisible();
    }
  });
});

test.describe('Auth guard (unauthenticated)', () => {
  test('protected tools show the Login Required gate, not the wizard', async ({ page }) => {
    for (const slug of ['niche-finder', ...ENGINE_TOOLS]) {
      await page.goto(`/tools/${slug}`);
      // Gate is shown; the wizard start button is NOT present.
      await expect(page.getByRole('button', { name: /log in to continue/i })).toBeVisible();
      await expect(page.getByTestId('start')).toHaveCount(0);
      // The login-required modal is on the page.
      await expect(page.getByText('🔒 Login Required')).toBeVisible();
    }
  });

  test('clicking Login in the modal routes to /login with a next param', async ({ page }) => {
    await page.goto('/tools/personal-codex');
    await page.getByTestId('login-go').click();
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test('unprotected revenue calculator is still open', async ({ page }) => {
    const res = await page.goto('/tools/revenue-calculator');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByText('🔒 Login Required')).toHaveCount(0);
  });
});

// Firebase-backed sign-up / login flows are covered for real against the live
// project in tests/e2e/firebase.spec.ts (the `firebase` Playwright project).

async function answerStep(page: Page) {
  const scaleRadios = page.locator('[role="radiogroup"] [role="radio"]');
  const options = page.locator('[role="radio"], [role="checkbox"]');
  if (await scaleRadios.count()) await scaleRadios.last().click();
  else if (await options.count()) await options.first().click();
}

test.describe('Engine tools — full flow (authenticated)', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('each tool card navigates to a live route', async ({ page }) => {
    for (const slug of ALL_TOOL_SLUGS) {
      const res = await page.goto(`/tools/${slug}`);
      expect(res?.status(), slug).toBeLessThan(400);
    }
  });

  for (const slug of ENGINE_TOOLS) {
    test(`${slug}: start → steps → validation → result → restart`, async ({ page }) => {
      await page.goto(`/tools/${slug}`);
      await expect(page.getByTestId('start')).toBeVisible();
      await page.getByTestId('start').click();
      await expect(page.getByTestId('progress-label')).toContainText('Step 1 of');

      // Validation
      await page.getByTestId('next').click();
      await expect(page.getByTestId('error')).toBeVisible();

      // Walk every step
      // eslint-disable-next-line no-constant-condition
      while (true) {
        await answerStep(page);
        const label = await page.getByTestId('next').innerText();
        await page.getByTestId('next').click();
        if (label.includes('result')) break;
      }

      await expect(page.getByTestId('restart')).toBeVisible();
      await page.getByTestId('restart').click();
      await expect(page.getByTestId('start')).toBeVisible();
    });
  }
});

/** Answer every step with its WEAKEST option, to force low/zero scores. */
async function answerStepWeakly(page: Page) {
  const scaleRadios = page.locator('[role="radiogroup"] [role="radio"]');
  const options = page.locator('[role="radio"], [role="checkbox"]');
  if (await scaleRadios.count()) await scaleRadios.first().click();
  else if (await options.count()) await options.last().click();
}

async function walkToResult(page: Page, answer: (p: Page) => Promise<void>) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await answer(page);
    const label = await page.getByTestId('next').innerText();
    await page.getByTestId('next').click();
    if (label.includes('result')) break;
  }
}

test.describe('Weak-topics recommendation (authenticated)', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('weak answers personalise the card and carry the topics into the booking form', async ({ page }) => {
    await page.goto('/tools/skills-strength-scorecard');
    await page.getByTestId('start').click();
    await walkToResult(page, answerStepWeakly);

    const card = page.getByTestId('weak-topics-recommendation');
    await expect(card).toBeVisible();
    await expect(card.getByRole('heading', { name: 'Your Biggest Growth Opportunity' })).toBeVisible();
    // All dimensions bottom out at 0% → the high-priority variant.
    await expect(card).toHaveAttribute('data-variant', 'zero');
    // Exactly one recommendation section, never one per weak area.
    await expect(page.getByTestId('weak-topics-recommendation')).toHaveCount(1);

    // The named weak areas are the ones that get passed along.
    const topics = await page.getByTestId('weak-topics-list').locator('li').allInnerTexts();
    expect(topics.length).toBeGreaterThan(0);
    const firstTopic = topics[0].split('\n')[0].trim();

    await page.getByTestId('weak-topics-cta').click();
    await expect(page).toHaveURL(/\/book-strategy-call\?.*assessment=/);

    // The booking form opens directly — no "Thank you" screen in between.
    await expect(page.getByTestId('nf-booking-form')).toBeVisible();
    await expect(page.getByText('Thank you for completing your assessment.')).toHaveCount(0);
    await expect(page.getByTestId('nf-book-cta')).toHaveCount(0);

    // …and it shows the weak topics it received.
    await expect(page.getByTestId('nf-booking-topics')).toContainText(firstTopic);
    await expect(page.getByTestId('nf-booking-focus')).toContainText('Skills Strength Scorecard');
  });

  test('booking submission records the assessment context for the coach', async ({ page }) => {
    await page.goto('/tools/skills-strength-scorecard');
    await page.getByTestId('start').click();
    await walkToResult(page, answerStepWeakly);
    await page.getByTestId('weak-topics-cta').click();

    await page.getByTestId('bk-name').fill('E2E Booker');
    await page.getByTestId('bk-email').fill(`booker_${Date.now()}@example.com`);
    await page.getByTestId('bk-phone').fill('+91 90000 00000');
    await page.getByTestId('bk-date').fill('2030-01-15');
    await page.getByTestId('bk-time').fill('10:30');

    const [request] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/submit') && r.method() === 'POST'),
      page.getByTestId('nf-booking-submit').click(),
    ]);
    const body = request.postDataJSON() as { formKey: string; answers: Record<string, unknown> };

    expect(body.formKey).toBe('strategy-call');
    expect(body.answers.assessment).toBe('Skills Strength Scorecard');
    expect(body.answers.assessmentId).toBe('skills-strength-scorecard');
    expect(Array.isArray(body.answers.weakTopics)).toBe(true);
    expect((body.answers.weakTopics as string[]).length).toBeGreaterThan(0);
    expect((body.answers.weakScores as string[])[0]).toMatch(/^\d+%$/);
    expect(body.answers.overallScore).toMatch(/^\d+%$/);

    await expect(page.getByTestId('nf-booking-confirm')).toBeVisible();
  });

  test('strong answers show no recommendation at all', async ({ page }) => {
    await page.goto('/tools/skills-strength-scorecard');
    await page.getByTestId('start').click();
    await walkToResult(page, answerStep); // answerStep picks the strongest scale value

    await expect(page.getByTestId('restart')).toBeVisible();
    await expect(page.getByTestId('weak-topics-recommendation')).toHaveCount(0);
  });
});

test.describe('Booking page without assessment context', () => {
  // The Niche Finder keeps its own thank-you intro — that regression is guarded
  // by tests/e2e/niche-finder-ai.spec.ts, which asserts the intro is visible.
  test('opens the form with generic copy and no crash', async ({ page }) => {
    await login(page);
    await page.goto('/book-strategy-call');
    await expect(page.getByTestId('nf-booking-form')).toBeVisible();
    await expect(page.getByTestId('nf-booking-focus')).toContainText('Book your FREE 1-to-1 strategy call');
    await expect(page.getByTestId('nf-booking-topics')).toHaveCount(0);
    await expect(page.getByText('Thank you for completing your assessment.')).toHaveCount(0);
  });

  test('a hostile query string cannot break the page', async ({ page }) => {
    await login(page);
    await page.goto('/book-strategy-call?assessment=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&weak=a%7C999%7Cb&overall=abc');
    await expect(page.getByTestId('nf-booking-form')).toBeVisible();
    // Rendered as text, never as markup.
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
  });
});

test.describe('Saved progress (authenticated)', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('resumes an engine tool after reload', async ({ page }) => {
    await page.goto('/tools/skills-strength-scorecard');
    await page.getByTestId('start').click();
    await answerStep(page);
    await page.getByTestId('next').click();
    await expect(page.getByTestId('progress-label')).toContainText('Step 2 of');
    await page.reload();
    await expect(page.getByRole('button', { name: /resume/i })).toBeVisible();
  });
});

test.describe('Niche Finder (authenticated)', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('completes and shows ranked results', async ({ page }) => {
    await page.goto('/tools/niche-finder');
    const opts = page.locator('[aria-pressed]');
    await opts.nth(0).click();
    await opts.nth(1).click();
    for (let i = 0; i < 5; i++) {
      const next = page.getByRole('button', { name: /Next|Discover my niches/ });
      if (!(await next.count())) break;
      const firstOpt = page.locator('[aria-pressed="false"]').first();
      if (await firstOpt.count()) await firstOpt.click().catch(() => {});
      await next.first().click();
      if (await page.getByText(/best fit|directions to explore/i).count()) break;
    }
    await expect(page.getByText(/best fit|directions to explore/i)).toBeVisible({ timeout: 15000 });
  });
});
