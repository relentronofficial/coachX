import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config';
import { logger } from './utils/logger';
import { fetchRobots, discoverSeeds } from './discovery';
import { runCrawl } from './crawler';
import { analyzeRoutes, findOrphans } from './analyzers/routeAnalyzer';
import { analyzeDesignSystem } from './analyzers/designAnalyzer';
import { summarizeComponents, summarizeSeo, checkBrokenLinks } from './analyzers/featureAnalyzer';
import { analyzeDuplicates } from './analyzers/duplicateAnalyzer';
import { inferWorkflows } from './extractors/workflowExtractor';
import { collapseWhitespace } from './utils/sanitize';
import { writeJson } from './storage/jsonWriter';
import { writeCsv } from './storage/csvWriter';
import {
  writeRouteMapMd,
  writeDesignSystemMd,
  writeSeoMd,
  writeAccessibilityMd,
  writeMainReportMd,
} from './storage/markdownWriter';
import { SiteReportSchema, type SiteReport } from './schemas/site.schema';

const log = logger.child({ mod: 'main' });

const BOUNDARIES = `
Legal & safety boundaries enforced:
  • Public pages only — respects robots.txt & site terms.
  • No auth/CAPTCHA/paywall bypass; stops on 401/403.
  • No PII, tokens, cookies, passwords, or admin data collected.
  • No form submission or state-changing actions.
  • Short excerpts only (≤${config.maxExcerptChars} chars); no verbatim article bodies.
  • Rate-limited: ${config.minDelayMs}ms + up to ${config.maxJitterMs}ms jitter, concurrency ${config.maxConcurrency}.
`;

/**
 * Step 1: initial inspection. Opens the homepage with Playwright, compares
 * the raw server HTML against the hydrated DOM to classify the rendering
 * model, and summarises navigation/features. Writes output/initial-findings.md.
 */
async function inspect(): Promise<{ model: string; notes: string }> {
  log.info('running initial inspection…');
  const rules = await fetchRobots();

  // Raw server HTML (no JS).
  let rawHtml = '';
  try {
    const res = await fetch(config.seedUrl, { headers: { 'user-agent': config.userAgent }, signal: AbortSignal.timeout(20000) });
    rawHtml = await res.text();
  } catch (err) {
    log.warn({ err: String(err) }, 'raw fetch failed');
  }

  const browser = await chromium.launch({ headless: config.headless });
  const page = await browser.newPage({ userAgent: config.userAgent, viewport: { width: 1440, height: 900 } });
  // Shim esbuild's `__name` helper (tsx transpiles evaluated fns with it).
  await page.addInitScript(() => {
    (globalThis as unknown as { __name: (t: unknown) => unknown }).__name = (t) => t;
  });
  await page.goto(config.seedUrl, { waitUntil: 'domcontentloaded', timeout: config.navigationTimeoutSecs * 1000 }).catch(() => undefined);
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => undefined);
  await page.waitForTimeout(1200);

  const observed = await page.evaluate(() => {
    const txt = (sel: string) => Array.from(document.querySelectorAll(sel)).map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    return {
      renderedTextLen: document.body.innerText.length,
      title: document.title,
      navItems: txt('header nav a, header a').slice(0, 20),
      footerItems: txt('footer a').slice(0, 30),
      h1: txt('h1').slice(0, 5),
      forms: document.querySelectorAll('form').length,
      buttons: txt('button, a[role="button"], a.btn').slice(0, 20),
      hasCarousel: !!document.querySelector('[class*="carousel" i],[class*="swiper" i],[class*="slider" i]'),
      hasAccordion: !!document.querySelector('details,[class*="accordion" i],[aria-expanded]'),
      hasTabs: !!document.querySelector('[role="tab"],[role="tablist"]'),
      hasModal: !!document.querySelector('[role="dialog"],[class*="modal" i]'),
      hasCookie: !!document.querySelector('[class*="cookie" i],[id*="cookie" i],[class*="consent" i]'),
      lazyImgs: document.querySelectorAll('img[loading="lazy"],img[data-src]').length,
      scripts: document.querySelectorAll('script[src]').length,
      generator: (document.querySelector('meta[name="generator"]') as HTMLMetaElement | null)?.content ?? null,
      nextData: !!document.querySelector('#__NEXT_DATA__'),
    };
  });
  await browser.close();

  const rawTextApprox = rawHtml.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
  const ratio = observed.renderedTextLen > 0 ? rawTextApprox / observed.renderedTextLen : 0;
  const model =
    observed.nextData && ratio > 0.5
      ? 'Hybrid SSR/SSG (Next.js) — meaningful content in server HTML, hydrated on client'
      : ratio > 0.6
        ? 'Server-side rendered (content present without JS)'
        : ratio < 0.2
          ? 'Client-side rendered (content requires JS)'
          : 'Hybrid (partial SSR + client hydration)';

  const seeds = await discoverSeeds(rules);

  const md = `# Initial Inspection — ${config.targetUrl}

_Generated ${new Date().toISOString()} (before full crawl)._

## Rendering model
**${model}**

- Server HTML text ≈ ${rawTextApprox} chars vs rendered ${observed.renderedTextLen} chars (ratio ${ratio.toFixed(2)})
- \`__NEXT_DATA__\` present: ${observed.nextData} · generator: ${observed.generator ?? 'n/a'}
- External scripts: ${observed.scripts} · lazy images: ${observed.lazyImgs}

## robots.txt
- Crawl-delay: ${rules.crawlDelayMs ? rules.crawlDelayMs / 1000 + 's' : 'not set'}
- Disallowed prefixes (${rules.disallow.length}): ${rules.disallow.map((d) => `\`${d}\``).join(', ') || 'none'}
- Sitemaps: ${rules.sitemaps.map((s) => `\`${s}\``).join(', ')}

## Sitemap
- Discovered **${seeds.length}** same-host public URLs from the sitemap.

## Homepage structure
- **Title:** ${observed.title}
- **H1:** ${observed.h1.join(' | ') || '—'}
- **Primary nav:** ${observed.navItems.join(', ') || '—'}
- **Footer links:** ${observed.footerItems.slice(0, 20).join(', ') || '—'}
- **Buttons / CTAs:** ${observed.buttons.join(', ') || '—'}
- **Forms on homepage:** ${observed.forms}

## Interactive / dynamic elements detected
| Feature | Present |
| --- | --- |
| Cookie banner | ${observed.hasCookie} |
| Carousel/slider | ${observed.hasCarousel} |
| Accordion | ${observed.hasAccordion} |
| Tabs | ${observed.hasTabs} |
| Modal/dialog | ${observed.hasModal} |
| Lazy-loaded images | ${observed.lazyImgs > 0} (${observed.lazyImgs}) |

## Crawl plan
- Seed from sitemap (${seeds.length} URLs) + follow public internal links to depth ${config.maxCrawlDepth}.
- Honour every robots Disallow rule plus built-in auth/checkout/admin boundaries.
- Render each page with Playwright, trigger lazy-load via controlled scrolling, expand accordions, then capture desktop/tablet/mobile screenshots.
`;

  await mkdir(config.outputDir, { recursive: true });
  await writeFile(path.join(config.outputDir, 'initial-findings.md'), md, 'utf8');
  log.info('wrote output/initial-findings.md');
  return {
    model,
    notes:
      'Content is retrieved via JavaScript (server HTML is a light shell), so every page is rendered with Playwright and lazy content is triggered via controlled scrolling before extraction and screenshots.',
  };
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  console.log(`\n🔎 site-analyzer → ${config.targetUrl}`);
  console.log(BOUNDARIES);

  if (args.has('--inspect-only')) {
    await inspect();
    return;
  }

  // Always produce the initial findings first (also gives us the render model).
  const inspection = await inspect();

  const rules = await fetchRobots();
  const seeds = await discoverSeeds(rules);
  log.info({ seeds: seeds.length }, 'seeds discovered');

  const crawl = await runCrawl(rules, seeds);

  // Persist the raw page inventory immediately.
  await writeJson('pages.json', crawl.pages);

  if (args.has('--skip-analysis')) {
    log.info('analysis skipped (--skip-analysis)');
    return;
  }

  // ---- Analysis phase ----
  const { routes, graph } = analyzeRoutes(crawl.pages);
  const orphans = findOrphans(routes);
  const components = summarizeComponents(crawl.componentInstances);
  const designSystem = analyzeDesignSystem(crawl.styleSamples);
  const workflows = inferWorkflows(crawl.pages);
  const duplicates = analyzeDuplicates(crawl.pages);
  const seoSummary = { ...summarizeSeo(crawl.pages), orphanPages: orphans };
  const brokenLinks = await checkBrokenLinks(crawl.pages);

  const report: SiteReport = {
    target: config.targetUrl,
    generatedAt: new Date().toISOString(),
    crawler: {
      userAgent: config.userAgent,
      respectedRobots: config.respectRobots,
      pagesCrawled: crawl.pages.length,
      pagesSkipped: crawl.skippedCount,
    },
    rendering: inspection,
    pages: crawl.pages,
    routes,
    routeGraph: graph,
    components,
    designSystem,
    workflows,
    duplicates,
    accessibility: crawl.accessibility,
    brokenLinks,
    seoSummary,
  };

  const validated = SiteReportSchema.safeParse(report);
  if (!validated.success) log.warn({ issues: validated.error.issues.slice(0, 5) }, 'site report schema warnings');

  // ---- Write all outputs ----
  await writeJson('site-report.json', report);
  await writeJson('routes.json', routes);
  await writeJson('route-graph.json', graph);
  await writeJson('components.json', components);
  await writeJson('design-system.json', designSystem);
  await writeJson('workflows.json', workflows);
  await writeJson('forms.json', crawl.pages.map((p) => ({ url: p.normalizedUrl, forms: p.forms })).filter((x) => x.forms.length));
  await writeJson('media.json', crawl.pages.flatMap((p) => p.media.map((m) => ({ page: p.normalizedUrl, ...m }))));
  await writeJson('seo-audit.json', { summary: seoSummary, perPage: crawl.pages.map((p) => ({ url: p.normalizedUrl, issues: p.seoIssues })) });
  await writeJson('accessibility.json', crawl.accessibility);
  await writeJson('duplicates.json', duplicates);

  // CSVs.
  await writeCsv(
    'routes.csv',
    routes.map((r) => ({
      url: r.url,
      title: collapseWhitespace(r.title ?? ''),
      pageType: r.pageType,
      status: r.statusCode,
      depth: r.depth,
      parent: r.parent ?? '',
      discoveredFrom: r.discoveredFrom,
      incomingLinks: r.incomingLinks,
      outgoingInternalLinks: r.outgoingInternalLinks,
      canonical: r.canonical ?? '',
    })),
  );
  await writeCsv(
    'seo-audit.csv',
    crawl.pages.flatMap((p) => p.seoIssues.map((i) => ({ url: p.normalizedUrl, code: i.code, severity: i.severity, message: i.message }))),
  );
  await writeCsv(
    'media.csv',
    crawl.pages.flatMap((p) =>
      p.media.map((m) => ({ page: p.normalizedUrl, kind: m.kind, src: m.resolvedSrc ?? m.src ?? '', alt: m.alt ?? '', width: m.width ?? '', height: m.height ?? '', lazy: m.lazy, provider: m.provider ?? '' })),
    ),
  );
  await writeCsv(
    'broken-links.csv',
    brokenLinks.map((b) => ({ source: b.source, target: b.target, status: b.status, broken: b.broken, redirects: b.redirectChain.join(' > '), type: b.type })),
  );

  // Markdown.
  await writeRouteMapMd(report);
  await writeDesignSystemMd(designSystem, config.targetUrl);
  await writeSeoMd(report);
  await writeAccessibilityMd(report);
  await writeMainReportMd(report);

  console.log(`\n✅ Done. ${crawl.pages.length} pages analyzed → ${config.outputDir}`);
  console.log(`   Broken links: ${brokenLinks.filter((b) => b.broken).length} · Duplicates: ${duplicates.length} · Orphans: ${orphans.length}`);
  console.log(`   Open output/site-report.md for the executive summary.\n`);
}

main().catch((err) => {
  log.error({ err: String(err), stack: (err as Error)?.stack }, 'fatal error');
  process.exitCode = 1;
});
