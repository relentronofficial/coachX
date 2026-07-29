import { test, expect } from '@playwright/test';

/**
 * Layout regression guard for the redesign.
 *
 * The redesign introduced decorative elements that are deliberately wider than
 * their container (hero backdrop circles, the tool-preview glow, the logo
 * marquee). Each is contained by an `overflow-hidden` ancestor — and one of
 * them was not, which put a horizontal scrollbar on the homepage at desktop
 * width. That class of bug is invisible in a unit test and easy to reintroduce,
 * so it is asserted here across every public page and both device projects.
 */

const PUBLIC_PAGES = [
  '/',
  '/about',
  '/programs',
  '/programs/workshop',
  '/tools',
  '/stories',
  '/guides',
  '/events',
  '/masterclass',
  '/join',
];

for (const path of PUBLIC_PAGES) {
  test(`${path} never scrolls horizontally`, async ({ page }) => {
    await page.goto(path);
    // Reveal animations settle; a mid-flight transform must not widen the page.
    await page.waitForTimeout(600);

    const { clientWidth, scrollWidth } = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(scrollWidth, `${path} overflows by ${scrollWidth - clientWidth}px`).toBeLessThanOrEqual(
      clientWidth,
    );
  });
}

test('no CoachX price is rendered on the public site', async ({ page }) => {
  // Member revenue results ("₹10 Lakhs revenue") are outcomes, not prices, and
  // are expected on /stories — so this asserts on the pages that used to carry
  // the entry fee instead of banning the symbol site-wide.
  for (const path of ['/', '/programs', '/programs/workshop', '/masterclass', '/join']) {
    await page.goto(path);
    const body = await page.locator('body').innerText();
    expect(body, `${path} still shows a price`).not.toMatch(/₹\s?\d/);
  }
});

test('scroll-revealed content is visible once scrolled to', async ({ page }) => {
  await page.goto('/');
  const programs = page.locator('#programs');
  await programs.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  // The reveal wrapper must have committed, otherwise the section is invisible.
  const shown = await page.locator('#programs .fx-reveal[data-shown="true"]').count();
  expect(shown).toBeGreaterThan(0);
});
