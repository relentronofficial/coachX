# site-analyzer

A production-quality, **boundary-respecting** website crawler and analysis system for
[`internetlifestylehub.com`](https://internetlifestylehub.com).

It crawls only publicly accessible pages, renders them with a real browser, and produces a
structured inventory of pages, content, UI components, navigation, forms, workflows, metadata,
media, screenshots, plus SEO / accessibility / duplicate / broken-link audits.

Built with **Node.js + TypeScript**, **Crawlee**, **Playwright**, **Cheerio**, **Zod**,
**Sharp**, **Pino**, and CSV / JSON / Markdown output.

---

## ⚖️ Legal & safety boundaries (enforced in code)

This tool is deliberately conservative. It:

- Crawls **only publicly accessible pages** and **respects `robots.txt`** and the site's terms.
- **Never** bypasses authentication, CAPTCHA, paywalls, subscription gates or access restrictions.
- **Stops a route** on `401`/`403` (forbidden / auth required).
- **Never** submits forms, creates accounts, or triggers destructive/state-changing actions
  (buy, checkout, delete, subscribe, login, …).
- **Does not** collect PII, session tokens, cookies, passwords, API secrets, or admin data —
  a sanitiser redacts anything resembling a secret/email/phone before storage.
- **Does not** enter admin, dashboard, account, checkout, payment, login, or `/edit` routes
  (blocked via `robots.txt` **and** a built-in boundary list in `src/config.ts`).
- Stores **short excerpts (≤300 chars)** and structural summaries — **never verbatim article bodies**.
- Is **rate-limited** (1.5 s + up to 3 s jitter, concurrency 2) with an honest, identifying user agent.

> Automated accessibility results are a **subset** of WCAG checks and are **not** a compliance claim.

The exact robots-disallowed prefixes for this site (auth, admin, dashboard, thank-you and internal
tool routes) are honoured automatically; see `output/initial-findings.md` after a run.

---

## Requirements

- Node.js ≥ 20
- ~1 GB free disk for screenshots
- Playwright's Chromium (installed via `npx playwright install chromium`)

## Install

```bash
cd tools/site-analyzer
npm install
npx playwright install chromium
cp .env.example .env   # optional — sensible defaults are built in
```

## Usage

```bash
# 1) Initial inspection only — rendering model, robots, sitemap, homepage structure.
npm run inspect          # → output/initial-findings.md

# 2) Full crawl + analysis (also writes initial-findings.md first).
npm run analyze

# 3) Crawl only, skip the analysis/reporting phase.
npm run crawl

# Type-check without emitting.
npm run typecheck
```

Configuration is via `.env` (see `.env.example`) — target URL, concurrency, delays, timeouts,
viewports, and toggles for screenshots / accessibility / broken-link checking.

## Output (`output/`)

| File | Contents |
| --- | --- |
| `initial-findings.md` | Pre-crawl inspection: rendering model, robots, sitemap, homepage structure |
| `site-report.json` / `site-report.md` | Full structured report + executive summary |
| `pages.json` | Per-page inventory (metadata, sections, buttons, forms, media, features, fingerprints) |
| `routes.json` / `routes.csv` / `route-map.md` / `route-graph.json` | Public route map, table, and node/edge graph |
| `components.json` | Reusable UI component inventory with computed-style snapshots |
| `design-system.json` / `design-system.md` | Summarized colour / type / radius / shadow / spacing tokens |
| `forms.json` | Form structures (labels, types, options, consent, CAPTCHA) — no submitted data |
| `media.json` / `media.csv` | Image / video / embed inventory (metadata & URLs, not bulk downloads) |
| `workflows.json` | Inferred public workflows, each tagged verified / partial / inferred / auth-required |
| `seo-audit.json` / `seo-audit.csv` / `seo-audit.md` | Per-page + cross-page SEO audit |
| `accessibility.json` / `accessibility.md` | Automated axe-core scan |
| `duplicates.json` | Exact / near / param / alt-canonical / empty / soft-404 detection |
| `broken-links.csv` | Internal link health (rate-limited HEAD/GET) |
| `screenshots/{desktop,tablet,mobile}/` | Deterministic per-route captures (desktop also above-the-fold) |

## Architecture

```
src/
  index.ts          Orchestration + initial inspection + report assembly
  config.ts         Typed config (env + defaults) & safety boundary lists
  discovery.ts      robots.txt + sitemap fetching/parsing, seed discovery
  router.ts         URL normalization gate: scheme→host→robots→boundaries→depth
  crawler.ts        PlaywrightCrawler: render → dismiss cookies → scroll → safe-expand → extract → screenshot → enqueue
  extractors/       page, content, navigation, component, form, link, media, seo, workflow
  analyzers/        route, design, feature (components/SEO/broken-links), accessibility, duplicate
  storage/          json, csv, markdown, screenshot writers
  schemas/          Zod schemas (page, component, form, site) — single source of truth
  utils/            normalizeUrl, hash (sha256 + SimHash), logger, rateLimiter, sanitize
```

### How rendering & discovery work

1. `robots.txt` is fetched and parsed; the matching group's `Disallow` rules and `Crawl-delay`
   are honoured. The `sitemap.xml` (and any sitemap-index children) seed the queue.
2. Each page is rendered with Playwright: wait for DOM/network-idle (bounded), dismiss safe cookie
   banners, gradually scroll to trigger lazy content, open `<details>`/accordions (read-only),
   then return to top.
3. Static structure is parsed with Cheerio; computed styles + component detection run in-page via
   `page.evaluate`; axe-core runs for accessibility; screenshots are captured at three viewports.
4. Discovered internal links pass through `router.evaluate` (normalization, host, robots, boundary,
   sensitive-query, asset, depth checks) before being enqueued with their discovery source.

### De-duplication

- URLs are normalized (https, lower-host, no fragment, tracking params stripped, sorted params,
  trailing-slash policy) and hashed deterministically.
- Content uses a 64-bit **SimHash** (Hamming-distance near-duplicate detection) plus a structural
  heading fingerprint for exact matches.

## Notes & limitations

- Same-host only: `learn.internetlifestylehub.com` (the LMS/member app) is a different host and is
  **out of scope**.
- Crawlee's persistent `RequestQueue`/`Dataset` live under `storage/` (git-ignored). Delete with
  `npm run clean` for a fresh run.
- Third-party analytics/ad requests are blocked during rendering so the crawler doesn't wait on them.
```
