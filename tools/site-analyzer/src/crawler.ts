import { PlaywrightCrawler, type PlaywrightCrawlingContext, type Request } from 'crawlee';
import * as cheerio from 'cheerio';
import type { Page as PwPage } from 'playwright';
import { config } from './config';
import { logger } from './utils/logger';
import { RateLimiter } from './utils/rateLimiter';
import { evaluate, classifyPageType } from './router';
import type { RobotsRules } from './discovery';
import { normalizeUrl } from './utils/normalizeUrl';
import { slugifyPath } from './utils/sanitize';
import { simHash, structuralFingerprint } from './utils/hash';

import { extractMeta, extractHeadings, extractBreadcrumbs } from './extractors/pageExtractor';
import { extractMainNav, extractFooterNav } from './extractors/navigationExtractor';
import { extractLinks } from './extractors/linkExtractor';
import { extractForms } from './extractors/formExtractor';
import { extractMedia } from './extractors/mediaExtractor';
import { extractButtons, extractSections, summarizeContent, detectFeatures } from './extractors/contentExtractor';
import { extractComponents, type StyleSample } from './extractors/componentExtractor';
import { extractSeoIssues } from './extractors/seoExtractor';
import { analyzeAccessibility } from './analyzers/accessibilityAnalyzer';
import { captureScreenshots, autoScroll } from './storage/screenshotWriter';

import { PageSchema, type Page } from './schemas/page.schema';
import type { ComponentInstance } from './schemas/component.schema';
import type { AccessibilityIssue } from './schemas/site.schema';

const log = logger.child({ mod: 'crawler' });

export interface CrawlResult {
  pages: Page[];
  componentInstances: ComponentInstance[];
  styleSamples: StyleSample[];
  accessibility: AccessibilityIssue[];
  skippedCount: number;
}

interface UserData {
  depth: number;
  discoveredFrom: string;
}

/** Dismiss obvious cookie/consent banners. Accepting cookies is non-destructive. */
async function dismissCookieBanner(page: PwPage): Promise<void> {
  const labels = ['Accept all', 'Accept All', 'Accept', 'I agree', 'Agree', 'Got it', 'OK', 'Allow all', 'Allow cookies'];
  for (const label of labels) {
    try {
      const btn = page.getByRole('button', { name: new RegExp(`^\\s*${label}\\s*$`, 'i') }).first();
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        await btn.click({ timeout: 1500 }).catch(() => undefined);
        await page.waitForTimeout(300);
        return;
      }
    } catch {
      /* keep trying next label */
    }
  }
}

/** Safely expand accordions/FAQs so their content is present in the DOM. */
async function safeExpand(page: PwPage): Promise<void> {
  try {
    // Native <details> — no side effects.
    await page.evaluate(() => {
      document.querySelectorAll('details').forEach((d) => (d as HTMLDetailsElement).open = true);
    });
    // Accordion buttons: only <button aria-expanded="false"> (never links).
    const toggles = page.locator('button[aria-expanded="false"]');
    const count = Math.min(await toggles.count(), 20);
    for (let i = 0; i < count; i++) {
      const t = toggles.nth(i);
      const text = ((await t.textContent().catch(() => '')) ?? '').toLowerCase();
      // Skip anything that looks like a menu/nav/destructive toggle handled elsewhere.
      if (/buy|purchase|checkout|delete|logout|subscribe|submit|pay/.test(text)) continue;
      await t.click({ timeout: 800, trial: false }).catch(() => undefined);
    }
  } catch {
    /* best-effort */
  }
}

function discoveredSource(url: string, navSet: Set<string>, footerSet: Set<string>): string {
  if (navSet.has(url)) return 'navigation';
  if (footerSet.has(url)) return 'footer';
  return 'page-content';
}

/**
 * Run the PlaywrightCrawler over the seed URLs, honouring robots.txt and all
 * legal/safety boundaries. Returns the assembled page inventory and the raw
 * component/style/a11y data for post-crawl analysis.
 */
export async function runCrawl(
  rules: RobotsRules,
  seeds: { url: string; lastmod?: string }[],
): Promise<CrawlResult> {
  const limiter = new RateLimiter(config.minDelayMs, config.maxJitterMs);

  const pages: Page[] = [];
  const componentInstances: ComponentInstance[] = [];
  const styleSamples: StyleSample[] = [];
  const accessibility: AccessibilityIssue[] = [];
  let skippedCount = 0;
  const enqueued = new Set<string>(seeds.map((s) => s.url));

  const crawler = new PlaywrightCrawler({
    maxConcurrency: config.maxConcurrency,
    minConcurrency: config.minConcurrency,
    maxRequestRetries: config.maxRequestRetries,
    requestHandlerTimeoutSecs: config.requestHandlerTimeoutSecs,
    navigationTimeoutSecs: config.navigationTimeoutSecs,
    maxRequestsPerCrawl: config.maxRequests > 0 ? config.maxRequests : undefined,
    headless: config.headless,
    launchContext: {
      userAgent: config.userAgent,
      launchOptions: { args: ['--disable-blink-features=AutomationControlled'] },
    },
    // Block heavy 3rd-party trackers/ads so we don't wait on analytics.
    preNavigationHooks: [
      async ({ page }) => {
        // tsx/esbuild injects a `__name` helper into evaluated function source
        // that doesn't exist in the browser — shim it so page.evaluate works.
        await page.addInitScript(() => {
          (globalThis as unknown as { __name: (t: unknown) => unknown }).__name = (t) => t;
        });
        await page.route('**/*', (route) => {
          const url = route.request().url();
          if (/googletagmanager|google-analytics|facebook\.net|hotjar|clarity\.ms|doubleclick|segment\.io|mixpanel/.test(url)) {
            return route.abort();
          }
          return route.continue();
        });
        await page.setViewportSize({ width: 1440, height: 900 });
      },
    ],
    async requestHandler(ctx: PlaywrightCrawlingContext) {
      const { request, page, response, addRequests } = ctx;
      const userData = (request.userData ?? {}) as UserData;
      const depth = userData.depth ?? 0;
      const t0 = Date.now();

      // Politeness gate.
      await limiter.acquire();

      const status = response?.status() ?? 0;
      const finalUrl = page.url();
      const normFinal = normalizeUrl(finalUrl)?.normalized ?? finalUrl;

      // Stop on access-restricted responses.
      if (status === 401 || status === 403) {
        log.warn({ url: request.url, status }, 'access restricted — stopping this route');
        skippedCount++;
        return;
      }

      // Wait for a stable rendered state without hanging on analytics.
      await page.waitForLoadState('domcontentloaded').catch(() => undefined);
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => undefined);
      await page.waitForSelector('main, header, footer, h1', { timeout: 8000 }).catch(() => undefined);

      await dismissCookieBanner(page);
      await autoScroll(page);
      await safeExpand(page);
      await page.evaluate(() => window.scrollTo(0, 0)).catch(() => undefined);

      const html = await page.content();
      const $ = cheerio.load(html);

      // ---- Static (Cheerio) extraction ----
      const { meta, canonicalUrl, title } = extractMeta($);
      const headings = extractHeadings($);
      const breadcrumbs = extractBreadcrumbs($);
      const mainNav = extractMainNav($);
      const footerNav = extractFooterNav($);
      const links = extractLinks($, normFinal);
      const forms = extractForms($);
      const media = extractMedia($, normFinal);
      const buttons = extractButtons($);
      const sections = extractSections($);
      const { summary, wordCount } = summarizeContent($);
      const features = detectFeatures($) as Page['features'];

      // ---- Live-page extraction (computed styles / a11y) ----
      const slug = slugifyPath(new URL(normFinal).pathname);
      const comp = await extractComponents(page, normFinal);
      componentInstances.push(...comp.instances);
      styleSamples.push(...comp.styleSamples);

      if (config.runAccessibility) {
        accessibility.push(...(await analyzeAccessibility(page, normFinal)));
      }

      const screenshots = await captureScreenshots(page, slug);

      // ---- Assemble ----
      const textForHash = [title ?? '', ...headings.map((h) => h.text), summary].join(' ');
      const pageObj: Page = {
        url: request.url,
        normalizedUrl: normFinal,
        canonicalUrl: canonicalUrl ? (normalizeUrl(canonicalUrl, normFinal)?.normalized ?? canonicalUrl) : null,
        finalUrl,
        statusCode: status,
        redirectChain: buildRedirectChain(request, finalUrl),
        title,
        meta,
        pageType: classifyPageType(normFinal),
        depth,
        discoveredFrom: userData.discoveredFrom ?? 'sitemap',
        headings,
        breadcrumbs,
        mainNav,
        footerNav,
        sections,
        contentSummary: summary,
        wordCount,
        internalLinks: links.internal,
        externalLinks: links.external,
        socialLinks: links.social,
        downloadLinks: links.downloads,
        buttons,
        forms,
        media,
        components: comp.instances,
        features,
        textSimHash: simHash(textForHash),
        structureHash: structuralFingerprint(headings.map((h) => `${h.level}:${h.text}`)),
        screenshots,
        seoIssues: [],
        crawledAt: new Date().toISOString(),
        renderMs: Date.now() - t0,
      };
      pageObj.seoIssues = extractSeoIssues(pageObj);

      const parsed = PageSchema.safeParse(pageObj);
      if (parsed.success) {
        pages.push(parsed.data);
        log.info({ url: normFinal, status, depth, links: links.internal.length }, 'crawled');
      } else {
        // Keep the raw object even if schema drift occurs; log the mismatch.
        pages.push(pageObj);
        log.warn({ url: normFinal, issues: parsed.error.issues.slice(0, 3) }, 'schema validation warnings');
      }

      // ---- Enqueue newly discovered internal links ----
      const navSet = new Set(mainNav.map((n) => n.normalized).filter((v): v is string => !!v));
      const footerSet = new Set(footerNav.map((n) => n.normalized).filter((v): v is string => !!v));
      const toAdd: { url: string; userData: UserData }[] = [];

      for (const href of links.internal) {
        const decision = evaluate(href, rules, depth + 1, normFinal);
        if (!decision.allowed || !decision.normalized) {
          if (decision.reason && decision.reason !== 'external-host') skippedCount++;
          continue;
        }
        if (enqueued.has(decision.normalized)) continue;
        enqueued.add(decision.normalized);
        toAdd.push({
          url: decision.normalized,
          userData: { depth: depth + 1, discoveredFrom: discoveredSource(decision.normalized, navSet, footerSet) },
        });
      }
      if (toAdd.length) await addRequests(toAdd);
    },

    failedRequestHandler({ request }, err) {
      log.error({ url: request.url, err: String(err) }, 'request failed after retries');
      skippedCount++;
    },
  });

  // Seed the queue (sitemap URLs => discoveredFrom: 'sitemap', depth 0).
  await crawler.addRequests(
    seeds.map((s) => ({ url: s.url, userData: { depth: 0, discoveredFrom: 'sitemap' } as UserData })),
  );

  log.info({ seeds: seeds.length }, 'starting crawl');
  await crawler.run();
  log.info({ pages: pages.length, skipped: skippedCount }, 'crawl complete');

  return { pages, componentInstances, styleSamples, accessibility, skippedCount };
}

/** Best-effort redirect chain (Crawlee exposes the loaded/redirect URLs). */
function buildRedirectChain(request: Request, finalUrl: string): string[] {
  const chain: string[] = [];
  const loaded = (request as any).loadedUrl as string | undefined;
  if (request.url && request.url !== finalUrl) chain.push(request.url);
  if (loaded && loaded !== finalUrl && !chain.includes(loaded)) chain.push(loaded);
  return chain;
}
