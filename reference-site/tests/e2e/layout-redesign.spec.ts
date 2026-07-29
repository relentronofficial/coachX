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
  // Asserts on *pricing*, not on the rupee symbol. Member revenue results
  // ("₹10 Lakhs revenue") are outcomes and are meant to appear — on /stories
  // and, since the testimonials rebuild, in the video caption on the homepage
  // too. Banning ₹ outright would forbid the proof this site is built on, so
  // this looks for the entry fee and for cadence markers, which are what
  // actually distinguish a price from a result.
  const PRICE = /₹\s?499|₹\s?\d[\d,]*\s*(?:\/\s*mo|per month|one-time|onetime)|(?:price|pricing|cost)\s*:/i;

  for (const path of ['/', '/programs', '/programs/workshop', '/masterclass', '/join']) {
    await page.goto(path);
    const body = await page.locator('body').innerText();
    expect(body, `${path} still shows a price`).not.toMatch(PRICE);
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
