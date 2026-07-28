# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two **independent** npm projects (no root workspace/package.json — each has its own `package.json` and `node_modules`). Always `cd` into the project before running commands.

- **`reference-site/`** — Next.js 15 (App Router) + React 19 + Tailwind v3 coaching-community site with a full admin CMS, auth, and assessment tools. This is where feature work happens.
- **`tools/site-analyzer/`** — Standalone Node/TypeScript crawler (Crawlee + Playwright) that inventories a target website into `output/`. Its crawl results (`output/design-system.json`, routes, components) were the *provenance* for `reference-site`'s design tokens and information architecture. See `tools/site-analyzer/README.md` for the deep dive and the legal/boundary rules.

The tree **is** a git repository (single `.git` at the root covering both projects; branch `main`, pushed to `origin` = `github.com/relentronofficial/coachX`), so `git diff` / `git log` / `git checkout --` all work. Note that **`user.name`/`user.email` are unset** at every level, so a bare `git commit` fails with "Author identity unknown" — existing history is authored `CoachX <relentronofficial@gmail.com>` (older commits use `tbttech01@gmail.com`); match it with `git -c user.name=… -c user.email=…` rather than writing a global config on the user's behalf. History is short and squashed — a handful of commits, of which the first is the entire app — so `git blame` will rarely explain *why* something is the way it is. This file and the long-form docs are the real provenance.

⚠️ **The `.gitignore`s are live, and three pieces of real working state sit outside version control** — `git checkout` cannot restore them and they exist on no other machine:
- `reference-site/.data/*.json` — every user, submission, lead, role and CMS edit (see *Data persistence* below). Deleting one is permanent data loss, not a resettable fixture.
- `reference-site/.env.local` — the live Firebase credentials, not reproducible from `.env.example`.
- `tools/site-analyzer/output/` — the crawl results that were the provenance for the site's design tokens; regenerating them means re-crawling a third-party site.

### Brand assets
Every root-level media file is a **brand source asset, not scratch** — the originals of the copies the app actually serves out of `reference-site/public/`:

| Root original | Served as | Used by |
| --- | --- | --- |
| `Black - CoachX.png` | `public/brand/coachx-logo.png` | `components/Logo.tsx` — the CoachX wordmark, native 1617×444 (≈3.64:1). Also the source of the brand palette in `tailwind.config.ts`. |
| `sakthi anna pic.png` | `public/brand/founder.png` | Founder portrait |
| `anusha-revenue.mp4` | `public/testimonials/anusha-revenue.mp4` (**re-encoded**, see below) | `Story.video` on the `anusha` entry in `lib/site.ts` → rendered by `Testimonials()` and `app/stories/[slug]/page.tsx` |
| `revenue-1 (1..5).jpg` | `public/testimonials/revenue-{1..5}.jpg` | `revenueProof` in `lib/site.ts` → the proof strip in `Testimonials()` |

Re-export the logo from the root original rather than upscaling the served copy, and keep the two in sync (`Logo.tsx` hardcodes the aspect ratio, so a re-crop means updating that ratio too). `reference-site/devserver.log`, `test-results/`, and `tsconfig.tsbuildinfo` *are* scratch.

Two things about the testimonial media specifically:
- **The served video is a re-encode, not a copy.** The root original is 1080×1920 / 25 fps / **7.5 Mbps → 29.5 MB**, which is far more than the web needs (it renders in a `max-w-2xl` ≈ 672 px column). The served copy is 720×1280 CRF 26 → **4.2 MB**, a ~7× cut with no visible loss — the burned-in "10 LAKHS REVENUE" caption stays crisp, which is the constraint that rules out anything more aggressive. It is a talking head over an animated gold-glitter background, and that glitter is what makes the file expensive: at 1080p even CRF 27 only reached 7 MB, so **dropping resolution beats raising CRF here**. Regenerate from the root original, never from the served copy:
  ```bash
  ffmpeg -i "anusha-revenue.mp4" -vf "scale=720:1280:flags=lanczos" \
    -c:v libx264 -preset slow -crf 26 -profile:v high -pix_fmt yuv420p \
    -c:a aac -b:a 128k -movflags +faststart \
    reference-site/public/testimonials/anusha-revenue.mp4
  ```
  `+faststart` matters — it moves the moov atom to the front so the video streams progressively instead of needing a full download. Both `<video>` tags also set `preload="none"` deliberately; without it every visitor fetches the file on page load. `public/` is `COPY`d into the Cloud Run image, so this size is per-build weight — if it ever needs to leave the image entirely, move it to Cloud Storage / a CDN rather than dropping these attributes.
- **The served `revenue-*.jpg` are full-resolution on purpose.** They look oversized next to the video, but `next/image` needs a high-res source to build its `srcSet` from (1080 px source → ~56 KB at 640w). Downscaling the served copies would degrade every generated variant, so leave them alone.
- **`revenueProof` is deliberately not attributed to any named member.** The screenshots arrived as one unlabelled set, so pinning one to a person would invent a claim about their earnings. Keep them a generic proof strip; don't "improve" the alt text into a specific member's revenue.

Long-form docs worth reading before touching their area: `reference-site/AI-NICHE-FINDER.md` (the AI Niche Finder's schema, engine, admin and flow), `reference-site/TOOLS-AUDIT.md` (assessment-tool inventory + provenance), `tools/site-analyzer/README.md` (crawler boundaries).

## reference-site — commands

```bash
cd reference-site
npm run dev              # dev server on :3000
npm run build && npm start
npx tsc --noEmit         # typecheck — no npm script for it; this is the real gate
npm run lint             # BROKEN: no ESLint config, so `next lint` sits at an interactive setup prompt
npm test                 # vitest run (unit)
npm run test:watch
npx vitest run tests/unit/engine.test.ts   # single unit test file
npm run test:e2e         # playwright — REQUIRES a production build first (npm run build)
npx playwright test niche-finder-ai        # single e2e spec
bash deploy-cloud-run.sh # build + deploy to Cloud Run (see Deployment below)
```

Playwright (`playwright.config.ts`) spins up `npm start` on **:3100** itself. Unit tests live in `tests/unit/`, E2E in `tests/e2e/`. The `@/` import alias maps to the `reference-site/` root (configured in both `tsconfig.json` and `vitest.config.ts`).

Both gates are currently green: `npx tsc --noEmit` exits clean, and `npm test` is **199 tests across 16 files**. Treat a failure as something you introduced. The app suite runs every non-Firebase spec twice — once per device project, `chromium` (Desktop Chrome) and `mobile` (Pixel 5) — so `npx playwright test niche-finder-ai` is two runs, and `--project=chromium` halves it while you iterate.

On Windows, `npm run build` while `npm run dev` is running fights over `.next` — stop the dev server first, or expect a corrupted dev build.

**E2E state leaks between runs.** The suite writes through to the real `.data/*.json` and nothing resets it, so specs that create records accumulate them. This is worth remembering when a spec passes locally and fails on a machine that has run the suite many times. (`ProgramCards` used to compound this by rendering only the first 3 programs; it now takes an optional `limit`, which the homepage passes and `/programs` omits.)

**Admin E2E specs sign in as one fixed identity.** `tests/e2e/helpers/auth.ts` exposes `loginAsAdmin()` (signup-or-login, then asserts the resolved role), and `playwright.config.ts` starts its server with `ADMIN_EMAILS` set to that address. Do **not** go back to registering `admin@…` addresses and leaning on the dev fallback in `lib/auth/roles.ts` — that fallback only applies when `ADMIN_EMAILS` is *unset*, so those specs passed only on machines with no `.env.local` and broke the moment a real one existed. Override with `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` if the default collides with a real account. Caveat: `reuseExistingServer` is on outside CI, so a server you started by hand on :3100 gets reused *without* that env — the role assertion fails with an explanatory message rather than a mystery timeout.

**There are zero `test.skip`s in the suite.** Live-backend tests live in `tests/e2e/firebase.spec.ts` and run as the dedicated `firebase` Playwright project, which `playwright.config.ts` registers *only* when real credentials are present (it warns loudly otherwise). Don't "fix" a red Firebase run by adding skips — the point of that design is that the suite never reports green for something it couldn't reach. **Credentials are now present** (see below), so that project *does* register and `npm run test:e2e` will register users and write documents against the real project. Prefer `--project=chromium` unless you mean to touch the live backend.

### Environment & Firebase
`.env.example` documents most of it (copy to `.env.local`): `AUTH_SECRET` (signs the session JWT), `ADMIN_EMAILS` (comma-separated; unset ⇒ dev fallback treats any `admin@…` address as admin), the six `NEXT_PUBLIC_FIREBASE_*` values, and `NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED`. Two live variables are **not** in it: `RESEND_API_KEY` (optional email; falls back to a file outbox) is omitted deliberately, and `NEXT_PUBLIC_SITE_URL` (canonical origin — see *SEO & canonical origin*) is simply undocumented, though `Dockerfile`, `cloudbuild.yaml` and `deploy-cloud-run.sh` all read it.

**`reference-site/.env.local` exists and is populated** — a real Firebase project is connected, so Firestore/Auth code paths run live rather than falling back. It is untracked-by-intent and not reproducible from `.env.example`; never overwrite or "regenerate" it. `FIREBASE-SETUP.md` is the runbook. Deployable config lives in `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`. Useful commands:

```bash
npm run firebase:verify        # hits the live project: auth, firestore, storage, rules → PASS/FAIL per requirement
npm run firebase:deploy-rules  # firestore rules + indexes + storage rules (needs `firebase login`)
npm run test:e2e:firebase      # the live-backend E2E project
```

`storage.rules`'s `isAdmin()` must stay byte-identical in meaning to `firestore.rules`'s — two definitions of "admin" that drift is how privilege gaps appear.

**The whole app must work with no Firebase env at all.** `lib/firebase.ts` exports `isFirebaseConfigured`, and every Firestore call site checks it and falls back to in-code seed data / `localStorage` / file-backed JSON. Preserve this when adding Firestore reads or writes — a missing project degrades, never throws. The module also initialises with non-empty *placeholder* config when env is absent, specifically so `getAuth`/`getFirestore` don't throw at import and break SSR — which means an unguarded call fails at the network round-trip, not loudly at startup. That's why the `isFirebaseConfigured` check is the guard, not a try/catch.

**Cloud Storage is a second, independent gate.** `lib/firebase.ts` also exports `isStorageConfigured` (= `isFirebaseConfigured && NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED !== 'false'`), because a Storage bucket needs the paid Blaze plan while Auth and Firestore are free on Spark. **The connected project sets `…STORAGE_ENABLED=false`** — so uploads/photos are expected to degrade, `firebase-verify` reports that requirement as *skipped* rather than failed, and a genuinely broken upload path can hide behind it. Guard upload UIs and helpers on `isStorageConfigured`, never on `isFirebaseConfigured`.

### Deployment — Google Cloud Run
`Dockerfile` (multi-stage, ships `.next/standalone`) + `cloudbuild.yaml` + `deploy-cloud-run.sh`, documented in `DEPLOY-CLOUD-RUN.md`. Deploy with `bash deploy-cloud-run.sh` from `reference-site/` (needs `gcloud` auth + a billing-enabled project; Docker is not required — Cloud Build builds the image). Defaults: region `asia-south1`, service `coachx`, overridable by env var. `next.config.mjs` sets `output: 'standalone'` **for this** — don't remove it.

Two things drive most of the design here, and both are easy to break:

1. **`NEXT_PUBLIC_*` are build args, not runtime env.** Next inlines them into the client bundle during `next build`, so setting them only on the Cloud Run service ships a bundle carrying placeholder Firebase config and every client call fails. They flow `.env.local` → `deploy-cloud-run.sh` → Cloud Build substitutions → `--build-arg` → `ARG`/`ENV` in the Dockerfile. **Adding a `NEXT_PUBLIC_*` variable means adding it in all four places**, and changing a value needs a rebuild, not a redeploy. Server-only secrets (`AUTH_SECRET`, `ADMIN_EMAILS`) are runtime env vars and never enter the image.
2. **The file-backed stores do not survive there.** Cloud Run's filesystem is a per-instance in-memory tmpfs, wiped on every restart and unshared between instances — so accounts, submissions and CMS edits made in production are lost on the next revision or scale-to-zero. `deploy-cloud-run.sh` pins `--max-instances 1` to at least make it consistent. A deployment is **read-only in practice** until those eight modules move to Firestore (which is a rewrite of the store internals only — the route/guard layers never touch the filesystem).

### SEO & canonical origin
`brand.url` in `lib/site.ts` (`NEXT_PUBLIC_SITE_URL` || `https://coachx.tamilbusinesstribe.com`) is the single canonical origin — `metadataBase`, canonical links, Open Graph, `app/sitemap.ts` and `app/robots.ts` all derive from it, so a domain move is one edit. `app/sitemap.ts` builds its URLs from the same sources the pages render from (CMS programs with the static catalog as fallback, `engineTools`, guides/stories/events) so it can't drift from what exists; `app/robots.ts`'s disallow list mirrors what the sitemap omits (admin, auth, `/profile`, `/api/`, `/book-strategy-call`). **Adding a public route means adding it to the sitemap; adding a gated one means adding it to both middleware and robots.** `app/manifest.ts` + `app/icon.png` / `apple-icon.png` / `public/icon-{192,512}.png` cover the PWA/icon side, also fed from `lib/site.ts`.

## site-analyzer — commands

```bash
cd tools/site-analyzer
npm install && npx playwright install chromium
npm run inspect          # pre-crawl inspection only → output/initial-findings.md
npm run analyze          # full crawl + analysis + reports
npm run crawl            # crawl only, skip analysis (--skip-analysis)
npm run typecheck        # tsc --noEmit
npm run clean            # wipe Crawlee's storage/ for a fresh run
```

## reference-site — architecture

### Data persistence (no database)
All server state is **file-backed JSON under `reference-site/.data/`** (`users.json`, `cms.json`, `roles.json`, `submissions.json`, `leads.json`, `audit.json`, `reset-tokens.json`, plus `niche-emails.json` — the email outbox `lib/nicheAI/email.server.ts` falls back to when `RESEND_API_KEY` is absent). Stores (`lib/auth/users.ts`, `lib/cms/store.ts`, `lib/auth/rolesStore.ts`, …) follow one pattern: read-all → mutate → write-all, serialized through an in-process `withLock` promise chain to avoid lost updates. This is deliberately swappable — replace the store internals with a real DB without touching the route/guard layers above them.

### Authentication — dual, with a JWT bridge
There are **two** auth paths that converge on one session cookie:
- **Primary (client): Firebase Auth.** Client SDK in `lib/firebase.ts`; `components/auth/AuthProvider.tsx` manages client state.
- **Legacy/dev (server): file-backed users** in `lib/auth/users.ts` with scrypt-hashed passwords, via `app/api/auth/login|signup`.

Both mint the **same signed httpOnly JWT** (`cx_session` cookie, `lib/auth/jwt.ts`, HS256 via `jose`, keyed by `AUTH_SECRET`). The bridge is `app/api/auth/firebase-session/route.ts`: it verifies the Firebase ID token server-side **without firebase-admin** (`lib/auth/firebaseIdToken.ts` validates RS256 against Google's JWKS, then reads the user's role from Firestore REST using the user's own token so Security Rules still apply) and issues the `cx_session` cookie. **The JWT cookie — not Firebase client state — is the trust boundary the server enforces.**

### Authorization (RBAC) — enforced in three layers
`lib/auth/permissions.ts` is the RBAC catalog: 6 roles (`super-admin` → `user`) × a `Permission` union, with `DEFAULT_ROLE_PERMISSIONS`. Defaults are overridable at runtime by an admin (persisted to `.data/roles.json`, read via `lib/auth/rolesStore.ts` `can()`). Enforcement:
1. **Edge middleware** (`middleware.ts`) gates `/admin`, `/api/admin`, `/dashboard`, `/profile` — guests redirect to `/login`, non-admins get 403/redirect.
2. **Admin API guard** (`lib/admin/guard.ts` `requireApiAdmin`) re-checks session + specific permission + **CSRF** (`lib/admin/csrf.ts`, on non-GET) inside each `app/api/admin/**` route handler.
3. **Server components** read the session via `lib/auth/session.ts` (`getSession`/`getAdmin`, `server-only`).
4. **Firestore Security Rules** (`firestore.rules`, deploy with `firebase deploy --only firestore:rules`) — the Niche Finder's client SDK talks to Firestore **directly**, bypassing layers 1–3 entirely. For anything under `lib/nicheAI/firestore.ts` or `lib/nicheAI/topicStore.ts`, the rules file *is* the authorization. Adding a collection there means adding a rule; role/status are read from `users/{uid}` so they can't be self-escalated.

Never trust client state for access decisions — always re-check server-side. `super-admin` always has every permission.

Note that the middleware matcher gates `/dashboard/:path*` but **no `app/dashboard` route exists** — a guest hitting it is redirected to `/login?redirect=/dashboard` and lands on a 404 after signing in. Either build the route or drop it from the matcher; don't treat the dangling entry as evidence a dashboard is there.

### CMS-driven content
`lib/cms/store.ts` serves page/section content and the program catalog from `.data/cms.json`, **seeded on first read from the static defaults in `lib/site.ts`** so public pages always render before anything is edited. The admin panel (`app/admin/**`, ~30 modules) edits these docs/collections. When adding editable content, follow this seed-with-fallback pattern rather than hardcoding.

### Assessment tools engine
The `/tools/*` assessments are **config-driven** by one shared engine:
- **Types**: `lib/tools/types.ts` — `ToolConfig` (steps of `single`/`multi`/`scale`/`text` questions + a pure `score()` → discriminated `ResultData`).
- **Pure logic**: `lib/tools/engine.ts` — `validateAll`, `scoreDimensions` (normalized 0–100), `overallOf`, `levelBand`. Framework-free and unit-tested (`tests/unit/engine.test.ts`, `tools.test.ts`).
- **Configs**: one file per tool in `lib/tools/configs/` (registered in `configs/index.ts`).
- **UI**: `components/tools/AssessmentWizard.tsx` renders any config (with `localStorage` resume); `ResultViews.tsx` renders each `ResultData.kind`.

To add a tool: write a `ToolConfig` (questions + pure `score()`), register it in `configs/index.ts`, add unit tests for the scoring. The wizard and result views are generic — you rarely touch them. See `TOOLS-AUDIT.md` for the full tool inventory and `origin` provenance labels (`public-observed` vs `original-equivalent`).

### Niche Finder — two separate systems, don't conflate them
- **Legacy/classic** — `components/NicheFinder.tsx` + `app/api/niche-finder/route.ts`, scored server-side via `lib/nicheScore.ts` / `lib/niches.ts`. Predates both engines; small and self-contained.
- **AI Niche Finder (`lib/nicheAI/**`)** — the flagship feature: `app/niche-finder`, `components/nicheAI/**`, `app/admin/niche-finder`, plus `tests/unit/nicheAI.test.ts` and `tests/e2e/niche-finder-ai.spec.ts`. Read `AI-NICHE-FINDER.md` first.

The AI version's structure, and the invariants to keep:
- `types.ts` is the domain model's single source of truth; `engine.ts` (`analyze()`) is **pure and deterministic** — no LLM, no I/O, no clock — which is what makes it unit-testable and reproducible. Qualitative copy comes from `knowledgeBase.ts` (built on `lib/niches.ts`). Keep new scoring logic pure and in the engine, not in components.
- **Code library is the base; Firestore is an overlay.** `questionBank.ts` seeds questions/categories and `topicLibrary.ts` + `topicEngine.ts` derive **~10,200 enriched topics (204 categories / 856 subcategories)** at module load; `firestore.ts`, `topicStore.ts` layer admin edits (enable/disable, edits, custom entries, category & subcategory CRUD, reorder, approval workflow, version history) on top and return the base when Firebase is absent. `topics.ts` is a thin re-export so the question bank stays stable. (`topicLibrary.ts`'s own header comment says "1,500+" — it is stale; `tests/unit/topics.test.ts` asserts the real floors of 10,000 topics / 200 categories / 800 subcategories.)
- **Topic ids are derived, and stored.** A topic id is `slug(categoryId + subcategory + label)`, and saved assessments, favourites and selections store those ids. Renaming an existing category id, subcategory name or topic label silently orphans stored data — **extend the library additively** (new categories, or new subs/topics inside existing ones). `tests/unit/topics.test.ts` pins a sample of ids to catch this.
- **The library is compact raw data; the engine derives the rest.** A `RawCategory`/`RawSub` states only what is editorial (niche, business, monetization, audience, industry, demand, mods); `deriveTopic()` expands that into the full 21-field profile (description, experience level, revenue band, competition, opportunity score, content/offer/product/service/community/certification mappings). Add a field there, not to 10k rows. Sub-level overrides let a broad category hold subcategories with genuinely different mappings.
- **Search is indexed, not scanned.** `TOKEN_INDEX` (token → topic indices) plus a first-letter-bucketed vocabulary back `searchTopics`; typo tolerance runs against the *vocabulary*, not every topic. Synonym groups map everyday phrasing onto library terms. Don't reintroduce a full-array scan — a unit test asserts 20 multi-token queries stay under 2s.
- **Discovery UI** — `components/nicheAI/discovery/**` (`NicheDiscovery` orchestrator + `DiscoveryHero`, `SmartSearch`, `CategoryGrid`, `DiscoveryRail`, `DiscoveryFilters`, `NicheGrid`, `NicheCard`, `EmptyState`), reusing `TopicDrawer` and `InterestProfilePanel`. **One component, two surfaces**: `mode="browse"` is the `/niche-finder` landing, `mode="select"` is the assessment's topic step (`QuestionInput.tsx`, the `options.length > 500` branch). Progressive disclosure is the whole point — nothing renders a flat list until the user has drilled to a subcategory or searched.
  - `NicheGrid` is **virtualized** on row arithmetic, so `NICHE_CARD_HEIGHT` in `NicheCard.tsx` must stay in sync with the card's actual height or rows will overlap. Cards are fixed-height and always render their action row: a card that grows on hover moves the target under the cursor.
  - **`aria-pressed` is reserved for the niche select toggle.** The assessment's e2e helper treats `[aria-pressed]` as "a selectable answer", so category cards, filter chips and group pills use plain buttons with `data-active` instead. Adding `aria-pressed` to a navigation control will break the assessment walk-through.
  - Category icons resolve through keyword rules in `lib/nicheAI/discovery.ts` (204 categories, no hand-listing). Keep glyphs at **Emoji 11 or earlier** — newer ones (🫂, 🪑, 🦾) render as tofu boxes on stock Windows 10 fonts.
  - Filters cover only fields that exist on `EnrichedTopic` (industry, experience, income, demand, competition). There is deliberately **no online/offline, investment, language or location filter** — that data does not exist, and inventing it across 10,183 topics would corrupt the library.
- Scoring weights (`ScoringWeights`, `DEFAULT_WEIGHTS`) are admin-tunable via `settings/nicheFinder` and threaded through `analyze()`; each recommendation carries a `scoreBreakdown` that the dashboard's explainability panel renders. Changing default weights changes tested output — update `tests/unit/nicheAI.test.ts` deliberately.
- Charts (`Charts.tsx`) are dependency-free hand-rolled SVG, and "Download PDF" is `window.print()` against the `@media print` rules in `globals.css` — there is no PDF or charting library. Don't add one without cause.
- The immersive UI is scoped under `[data-cx-theme]` in `app/globals.css` (its own glassmorphism/dark-light system, separate from the site's Tailwind tokens).

### Button motion
Buttons get their personality from the **BUTTON MOTION LAYER** in `app/globals.css` — ten `.btn-fx-*` identities (sweep · lift · success · danger · icon · nav · step · ai · book · card) sharing one easing vocabulary (`--btn-ease`, `--btn-spring`, `--btn-dur`, `--btn-press`). `lib/ui/buttonFx.ts` maps variant → classes; `components/ui.tsx` `Button` (server, links) and `components/ActionButton.tsx` (client, ripple + magnetic hover + async spinner + double-submit guard) are the only places that should apply them. **Don't hand-roll a hover effect on an individual button** — add an identity instead.

`.cx-btn` opts into the same layer (it has `position: relative; overflow: hidden`), so the immersive theme carries no second copy. Constraints: only compositor properties are animated (a unit test greps the layer and fails on `width`/`height`/`margin`/…), `NICHE_CARD_HEIGHT`-style fixed sizing must not be animated, and every identity has to appear in the single `prefers-reduced-motion` block — also test-enforced. There is **no animation library**; Framer Motion was declined because `Button` is a server component and the effects are all achievable in CSS at 0 KB.

### Currency
The app is **INR-only**. `lib/currency.ts` is the single place money becomes a string — `formatINR`, `formatINRNumber`, `formatINRRange`, `formatINRCompact` (lakh/crore), and `INR_SYMBOL`. All of it goes through `Intl.NumberFormat('en-IN')`, so grouping follows the Indian system (`₹1,00,000`, not `₹100,000`). Don't hand-roll `'₹' + n.toLocaleString()` — a bare `toLocaleString()` picks up the runtime's default locale and silently produces western grouping on a US-configured server.

The Niche Finder's revenue model in `lib/nicheAI/knowledgeBase.ts` is still **authored in USD** and converted at `USD_TO_INR` in `lib/currency.ts`. Those figures are displayed, never scored on, so converting changes no ranking — set the rate to `1` to fall back to a pure symbol swap. `.data/audit.json` retains historical `$0` values on purpose: rewriting an audit trail to say something other than what happened would be wrong.

### Styling
Tailwind v3, tokens in `tailwind.config.ts` + `app/globals.css` (brand: green `#105030`, gold `#d0a030`, deep-green ink `#0a2e1e` — sampled from the CoachX wordmark). Token *names* are semantic (`ink`/`brand`/`gold`/accent), so recolouring happens in the config, not in components. Shared primitives in `components/ui.tsx` (`Container`, `Section`, `Button`, `Badge`, `SectionHeading`) and layout blocks in `components/sections.tsx`. Placeholder images load from `picsum.photos` (allow-listed in `next.config.mjs`).

⚠️ `reference-site/README.md` is **stale in two ways**, and predates most of the app. It still describes the pre-CoachX navy/teal/amber palette and "Northwind Coaching Collective" — trust `tailwind.config.ts` and `lib/site.ts` instead. It also claims the forms "never submit anywhere and store nothing", which is no longer true: `LeadForm`, `Newsletter`, `AssessmentWizard`, `Booking` and `NicheFinderApp` all POST to `/api/submit`, which persists and surfaces in Admin → Submissions. Don't reason about form behaviour from the README.

## site-analyzer — architecture

Orchestrated by `src/index.ts` (inspection → crawl → analysis → report assembly). Pipeline: `discovery.ts` (robots.txt + sitemap) → `router.ts` (URL normalization + boundary gate) → `crawler.ts` (Playwright render) → `extractors/*` (page/content/nav/component/form/link/media/seo/workflow) → `analyzers/*` (route/design/feature/accessibility/duplicate) → `storage/*` writers (json/csv/markdown/screenshot). Zod schemas in `src/schemas/` are the single source of truth for output shapes.

**Boundaries are enforced in code, not just documented.** `src/config.ts` holds `rejectPathPrefixes` / `rejectPathContains` / `rejectQueryKeys` (auth, admin, checkout, thank-you, signed URLs) that reject routes **independent of robots.txt**, plus rate limits and the identifying user agent. When touching the crawler, preserve these guarantees: public pages only, respect robots.txt, never submit forms / bypass auth / collect PII, store only ≤300-char excerpts (`maxExcerptChars`). The target and its robots-disallowed prefixes are also captured in the project memory (`site-analyzer-target`).
