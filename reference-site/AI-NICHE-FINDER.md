# CoachX — Enterprise AI Niche Finder

An original, premium AI-powered Niche Finder built into the CoachX reference-site.
It is **not** a copy of any third party — the product *experience* (assessment →
intelligence analysis → premium result dashboard → admin) is recreated with an
entirely original CoachX design system, taxonomy, scoring and copy.

> **AI engine:** the "AI Analysis" is the **CoachX Intelligence Engine** — a
> deterministic, explainable, unit-tested scoring + recommendation model (no
> external LLM, zero cost, fully reproducible). **Data:** real **Firestore**
> (client SDK + security rules), with graceful fallback to the in-code seed +
> `localStorage` so the whole flow works in local dev with no backend.

---

## 1. Database schema (Firestore documents)

| Collection | Doc shape (key fields) | Type source |
| --- | --- | --- |
| `users` | `uid, fullName, email, role, status, createdAt…` | `lib/userProfile.ts` (existing) |
| `questionCategories` | `id, dimension, title, description, icon, order, enabled` | `QuestionCategory` |
| `nicheQuestions` | `id, categoryId, type, title, help, order, enabled, min/max, options[], scale, dimension, showIf` | `Question` |
| `nicheAnswers` | `uid, answers{}, stepIndex, status, updatedAt` (one doc / user, id = uid) | `NicheAttempt` |
| `nicheResults` | full `AnalysisResult` (`uid, headlineScore, recommendations[], profile{}, insights[], meta…`) | `AnalysisResult` |
| `reports` | `uid, resultId, topNiche, headlineScore, favourite, createdAt` | `SavedReport` |
| `analytics` | `type, uid, meta{}, at` | `AnalyticsRow` |
| `auditLogs` | `actor, action, target, meta{}, at` | — |
| `settings` | scoring rules / prompt templates (`id`-keyed docs) | — |

Types are the single source of truth in **`lib/nicheAI/types.ts`**.

## 2. Firestore collections & security

Rules in **`firestore.rules`** (deploy: `firebase deploy --only firestore:rules`):

- `questionCategories` / `nicheQuestions` / `settings` — **public read** (needed
  to render the assessment), **admin write**.
- `nicheAnswers/{uid}` — read/write only by the owning user; admins read.
- `nicheResults` — a user may **create/read only their own**; admins read all.
- `reports` — owner-scoped; admins read all.
- `analytics` — any signed-in user may append; **admins only** can read.
- `auditLogs` — **admin only**.
- Everything else denied. Role/status come from `users/{uid}` and cannot be
  self-escalated.

## 3. API structure

The engine is client-executable (pure), so most reads/writes go **directly to
Firestore via the client SDK** (guarded by rules) — the same pattern as
`lib/userProfile.ts`. Server routes are used only where a secret or the session
is required:

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/niche-finder/email` | POST | Emails the **signed-in user** their result (recipient is always the session email — cannot target arbitrary addresses). Sends via Resend if `RESEND_API_KEY` is set, else writes to a file-backed outbox. |
| `/api/niche-finder` | POST | Existing lightweight scorer for the classic tool (unchanged). |

Client data layer: **`lib/nicheAI/firestore.ts`** (`loadQuestions`,
`loadCategories`, `saveAttempt`, `loadAttempt`, `saveResult`, `listHistory`,
`setFavourite`, `logAnalytics`, `auditLog`, `upsertQuestion`, `deleteQuestion`,
`upsertCategory`, `listAllResults`, `listAnalytics`, `seedFirestore`).

## 4. Component structure

```
components/nicheAI/
  NicheFinderApp.tsx   Orchestrator: phases (landing→assessment→processing→result),
                       theme, auth gate, autosave/resume, save, email
  Assessment.tsx       Branching-aware wizard (progress rail, prev/next, keyboard, a11y)
  QuestionInput.tsx    All 7 question types: single/multi/multiSelect/scale/ranking/tags/text
  Processing.tsx       Staged "AI processing" screen
  ResultDashboard.tsx  Premium report: hero score, top niche, alternatives, charts,
                       market analysis, strengths/weaknesses, insights, roadmap,
                       90-day plan, CTA + save/share/print/PDF/email/retake
  Charts.tsx           Dependency-free SVG: ScoreRing, RadarChart, BarChart, OpportunityMatrix
components/admin/
  NicheFinderAdmin.tsx Question/category CRUD, enable/disable, reorder, scoring,
                       results viewer + CSV export, Firestore seeder
```

## 5. Folder structure

```
app/
  niche-finder/page.tsx            Public immersive experience
  admin/niche-finder/page.tsx      Admin module (guarded)
  api/niche-finder/email/route.ts  Email integration
lib/nicheAI/
  types.ts          Domain model (single source of truth)
  questionBank.ts   Seed categories + questions (all types + a conditional branch)
  knowledgeBase.ts  Market model + qualitative content generators (built on lib/niches.ts)
  engine.ts         CoachX Intelligence Engine (pure scoring → 24 fields, top-5)
  firestore.ts      Client Firestore data layer (graceful fallback)
  email.server.ts   Email compose + provider/outbox
app/globals.css     Scoped [data-cx-theme] design system (glassmorphism, dark/light, print)
firestore.rules     Security rules for all 9 collections
tests/unit/nicheAI.test.ts  Engine + branching tests
```

## 6. Admin modules

`/admin/niche-finder` (role-guarded by middleware + admin layout + Firestore rules):

- **Questions** — create, edit, delete, enable/disable, reorder, edit options &
  **scoring** (per-option `dimensions` + niche/category affinity as JSON).
- **Categories** — edit title/description/icon/order/enabled.
- **Results** — every user's completed result, with **CSV export**.
- **Seed Firestore** — one click pushes the in-code seed into Firestore.

## 7. User flow

Landing → Introduction (how-it-works + 10 dimensions) → Start (login required) →
Multi-step assessment (branching) → autosave/resume → AI processing → Result
dashboard → Save / Download PDF / Email / Share / Print / Retake. Signed-in users
get history, favourites and compare via the `reports`/`nicheResults` collections.

## 8. AI / intelligence architecture

`analyze(questions, answers)` → `AnalysisResult`:

1. **User profile** — 10 dimension scores (0–100) from scale + weighted options
   ("a couple of strong picks maxes a multi-select").
2. **Affinity** — category/niche affinity from option maps + free-text/tag keyword
   overlap against the niche knowledge base.
3. **Per-niche market model** — profitability / demand / competition / difficulty /
   revenue from `knowledgeBase.ts` (editorial baselines + overrides), personalized
   by the user's income & model dimensions.
4. **24 fields per niche** — nicheScore, confidence, profitability, passion, skill
   match, demand, competition (+level), difficulty (+level), revenue potential,
   target audience, positioning, UVP, business opportunities, content pillars,
   offer/product/community ideas, pricing, marketing, funnel, growth roadmap,
   90-day plan (+ strengths/weaknesses).
5. **Rank → top 5**, compute confidence from answer completeness + score
   separation, build cross-cutting insights & next steps.

Admin **scoring rules** are the per-option weights (editable in the admin JSON);
**prompt templates** map onto the `settings` collection for future LLM upgrades —
the engine is structured so a live Claude API pass can replace/augment the
deterministic qualitative fields without touching the UI or data layer.

## 9. PDF generator

`ResultDashboard` uses a dedicated **print stylesheet** (`@media print` in
`globals.css`): hides site chrome and action bars (`.cx-noprint`), forces a clean
light theme, avoids card page-breaks, sets page margins. "Download PDF" / "Print"
trigger `window.print()` → the browser's high-fidelity "Save as PDF". (Upgrade
path: swap in `@react-pdf/renderer` or a server route with Playwright for a
pixel-locked binary PDF — the report data is already a serialisable object.)

## 10. Email integration

`lib/nicheAI/email.server.ts` composes a branded HTML email. If `RESEND_API_KEY`
is set it sends via Resend; otherwise it appends to a file-backed **outbox**
(`.data/niche-emails.json`) so the feature works end-to-end in dev. The route
(`/api/niche-finder/email`) requires login and always sends to the session
user's own address.

## 11. Testing report

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` (full project) | ✅ clean |
| `npx vitest run` | ✅ **54/54** passing (7 new engine/branching tests + 47 existing) |
| New engine tests | ✅ top-5 ranking monotonic, 24 fields in range, business answers → business/tech niches, 10-dim profile, weak-input flag, conditional branching hides/shows correctly |
| Live route `/niche-finder` | ✅ 200 (compiles + renders in dev) |
| Live route `/admin/niche-finder` | ✅ 307 → `/login` for guests (guard works) |
| Firestore offline fallback | ✅ engine + wizard + results work with no Firebase project |

**Feature checklist:** glassmorphism ✅ · animations ✅ · progress indicator ✅ ·
autosave ✅ · prev/next ✅ · resume later ✅ · mobile-first ✅ · keyboard nav ✅ ·
accessibility (roles/aria/live regions/focus) ✅ · dark/light ✅ · all 7 question
types ✅ · conditional/branching ✅ · 10 categories ✅ · admin CRUD ✅ · 24 analysis
fields ✅ · radar/bar/opportunity charts ✅ · save/share/print/PDF/email/retake ✅.

**Not yet run:** full `next build` (skipped to avoid clobbering the running dev
server's `.next` on Windows) and Playwright E2E for the new flow (unit + live-route
verified). Both are natural next steps.

---

## Enterprise expansion (v2)

Everything below was added to close every remaining gap against the reference-level spec.

**User experience**
- **My Results / History** (`components/nicheAI/History.tsx`) — every past result with **search** (by niche), **filters** (min-score slider, favourites-only), **score trend** line, open / delete / download, and **favourite** toggle. Works offline via a local mirror (`lib/nicheAI/localHistory.ts`) and syncs to Firestore when configured.
- **Compare results** (`Comparison.tsx`) — pick any two past results → side-by-side headline scores, metric **CompareBars**, dual radar charts, and an auto "what changed" narrative.
- **Favourites** — starred results, persisted to `reports.favourite` (+ local).
- **Notifications** — accessible **toast system** (`Toast.tsx`) for save/email success, errors, and the "report ready" event.
- **Error handling** — the analysis phase is wrapped; failures route to a dedicated **error screen** with retry / start-over. Empty/weak-input states throughout.
- **Explainability** — a **"Why this niche scored X"** panel on the dashboard shows each factor's `value × weight = contribution` (from the engine's new `scoreBreakdown`).

**Admin**
- **Analytics dashboard** — KPI tiles (started, completed, completion rate, avg score, emailed), **top-niches** bar, **score-distribution** histogram; funnel/over-time populate from the `analytics` collection when Firebase is on.
- **Settings** — editable **scoring weights** (sliders, fed into the engine), **AI prompt template**, and **notification** toggles (auto-email, reminders, pass threshold) → persisted to `settings/nicheFinder`. Gated by the `settings.manage` permission.
- **Search** on the questions and results tables; **Excel (.xls)** and **Print/PDF** export in addition to CSV.
- **Permissions** — the admin page resolves `settings.manage` server-side and passes `canManage` to gate all settings writes.

**Engine**
- Tunable `ScoringWeights` (admin-driven) threaded through `analyze()`, with `DEFAULT_WEIGHTS` preserving prior behaviour; per-recommendation `scoreBreakdown` for explainability.

**Updated testing report**
| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ clean |
| `npm run build` (production) | ✅ builds clean; `/niche-finder` bundles at 19.3 kB |
| `npx vitest run` | ✅ **56/56** passing (added: score-breakdown maths, weight-sensitivity) |
| `npx playwright test niche-finder-ai` | ✅ **12/12** passing on desktop **and** mobile (Pixel 5) |
| `/niche-finder` live | ✅ 200, compiles clean |
| `/admin/niche-finder` live | ✅ 307 → login for guests |
| Offline history/compare | ✅ works via local mirror with no Firebase |

**E2E coverage** (`tests/e2e/niche-finder-ai.spec.ts`, chromium + mobile):
guest login-gate · theme toggle (dark/light) · full flow (start → all input types →
processing → result → save → toast) · save appears in **history** · **retake** resets ·
**autosave + resume** after reload · required-step **validation** blocks Next ·
**admin** module opens with all five tabs + scoring-weights settings.

**Feature-complete checklist (v2 additions):** history ✅ · resume ✅ · comparison ✅ ·
favourites ✅ · notifications/toasts ✅ · error handling ✅ · explainability ✅ ·
admin analytics ✅ · admin settings (scoring/prompt/notifications) ✅ · search ✅ ·
Excel + PDF export ✅ · permission gating ✅ · trend/compare charts ✅.
```

---

## Enterprise topic system (v3)

### Taxonomy

| Metric | Value |
| --- | --- |
| Unique topics | **3,902** |
| Parent categories | **114** |
| Subcategories | **281** |
| Top-level groups | 13 |
| Hand-written base topics | 1,486 (expanded by audience/level modifiers) |

`topicLibrary.ts` stays a compact raw taxonomy; `topicEngine.ts` expands it at
module load, so the bundle cost is small (`/niche-finder` = 22 kB) despite the
size. Every topic carries all ten fields: parent category, subcategory,
keywords, related topics, AI tags, difficulty, audience, monetization, coaching
niche and business category.

**Topic ids are content-derived and persisted.** An id is
`slug(categoryId + subcategory + label)`, and saved assessments, favourites and
selections store them. The v3 expansion was therefore strictly **additive** —
existing category ids, subcategory names and topic labels are frozen. Extend the
same way; `tests/unit/topics.test.ts` pins a sample of ids as a guard.

A `RawSub` may override `niche` / `business` / `monetization` / `audience`, so a
broad category can hold subcategories whose mappings genuinely differ (Fat Loss
monetizes Very High inside Fitness, which is High overall).

### Explorer UI

Three-level sidebar (group → category → subcategory) with per-node counts,
expand/collapse all, and sticky positioning · smart typo-tolerant search ·
A–Z browsing strip · filters for category, difficulty, monetization, audience,
coaching type and business model · sort A–Z / Z–A / Popular / Recommended ·
Popular, Trending, Favourites, Recently selected and Recently viewed views ·
favourites, select-all / deselect-all, min/max validation with a live selection
summary · topic detail popover (metadata + similar topics) · AI recommendations
("You may also be interested in…") · similar-topic **duplicate warning** on
selection (warns, never blocks).

**Performance.** The grid is genuinely virtualized: fixed row height + measured
column count means row offsets are pure arithmetic, and only the visible window
(± overscan) is mounted — an e2e test asserts the DOM stays under 200 chips
against ~3,900 topics. Indexes, facets and the A–Z map are computed once at
module load and cached; search is token-indexed with Damerau distance ≤ 1.

### Admin — Topic Management

Four tabs: **Analytics** (most/least selected, search analytics, never-selected,
difficulty distribution, taxonomy counts) · **Library** (search/filter, create,
**edit**, delete, enable/disable) · **Categories** (category CRUD, **reorder**,
enable/disable, plus inline **subcategory** CRUD/rename/enable) · **Import /
Export** (CSV + Excel export, CSV bulk import with preview).

Category and subcategory changes are *overlays* on the code library, so "delete"
removes the override and falls back to the built-in taxonomy rather than
destroying structure. All writes are audit-logged and gated by
`firestore.rules` (`nicheTopics`, `topicCategories`, `topicSubcategories` —
public read, admin write), which is the real authorization boundary since the
client SDK talks to Firestore directly.

### v3 testing report

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ clean |
| `npm run build` | ✅ clean; `/niche-finder` 22 kB (was 19.3 kB) |
| `npx vitest run` | ✅ **71/71** (added `tests/unit/topics.test.ts`, 15 tests) |
| `npx playwright test niche-finder-ai` | ✅ **20/20** desktop + mobile (added 3) |
| Full `npx playwright test` | 72 passed, 2 failed — both pre-existing `admin-cms` failures unrelated to topics (see below) |

**Known unrelated failure:** `admin-cms.spec.ts` "creating a program publishes it
to the public site" fails once `.data/cms.json` has accumulated ≥3 programs from
previous runs, because `ProgramCards` renders only `.slice(0, 3)`. The e2e suite
writes through to real `.data` and never resets it. *(Fixed in v4 — `ProgramCards`
now takes an optional `limit`.)*

---

## Enterprise topic system (v4)

### Taxonomy

| Metric | v3 | v4 |
| --- | --- | --- |
| Unique topics | 3,902 | **10,183** |
| Parent categories | 114 | **204** |
| Subcategories | 281 | **856** |
| Top-level groups | 13 | 13 |
| Hand-written base topics | 1,486 | **3,809** |

Still additive: every pre-existing category id, subcategory name and topic label
is untouched, so saved assessments and favourites keep resolving.

### The 21-field topic profile

Every topic carries: parent category · subcategory · description · related
topics · AI tags · search keywords · skill level · experience level · audience
type · coaching type · industry · business model · revenue potential (+ band) ·
market demand · competition level · opportunity score · content formats · offer
types · digital product mapping · service mapping · community mapping ·
certification mapping.

The raw library stays compact — a category states only what is *editorial*
(niche, business, monetization, audience, industry, demand, modifiers) and
`deriveTopic()` expands that into the full profile. Adding a 22nd field is one
change in the engine, not 10,000 rows. `deriveTopic()` is shared with the
Firestore overlay, so admin-created topics get an identical profile.

### Search & discovery

- **Indexed** — `TOKEN_INDEX` maps token → topic indices; queries resolve through
  map lookups instead of scanning 10k topics.
- **Typo-tolerant** — Damerau distance ≤ 1, evaluated against the *vocabulary*
  (a few thousand tokens) rather than every topic's tokens.
- **Synonym-aware** — 30 synonym groups map everyday phrasing onto library terms
  ("workout" → training, "make money" → income).
- **Auto-complete** — blended topic / category / subcategory suggestions, with a
  synonym hint surfaced first when one exists.
- **Voice search** — Web Speech API where supported, with a clear fallback
  message where it is not.

### Explorer UI

Global search · AI suggestions · auto-complete · typo tolerance · synonym search
· voice search · advanced filters (category, skill, experience, revenue,
audience, coaching type, industry, business model, demand, competition) ·
sticky three-level sidebar · breadcrumbs · expand/collapse all · preview panel ·
details drawer · keyboard shortcuts (`/`, `a`, `d`, `Esc`, `?`) · favourites ·
bookmarks · recently viewed · recently selected · trending · popular ·
recommended · 10 smart collections · drag-and-drop selection · bulk select and
deselect · category statistics · selection analytics · progress indicator.

### AI

Real-time recommendations · duplicate/overlap detection · complementary topic
suggestions · **interest confidence score** (blends volume, coherence and
breadth — a single pick can never read as confident) · full **interest profile**
rendered before the user advances: dominant niches with shares, audiences,
industries, skill mix, average opportunity, overlaps to prune, and gap advice.

### Admin

Topic CRUD · category CRUD · subcategory CRUD · **approval workflow**
(draft → pending → published) · draft/published status · bulk CSV import ·
CSV + Excel export · **duplicate detection** · **merge topics** (loser is
archived with a `mergedInto` pointer so old selections still resolve) ·
**version history with rollback** · **restore archived topics** (delete is a
soft archive) · topic analytics · search analytics · user selection analytics ·
**AI recommendation accept-rate analytics** · audit logs · permission gating.

New collections in `firestore.rules`: `topicSubcategories` (public read, admin
write) and `nicheTopicVersions` (**admin read**, since versions can contain
unpublished drafts).

### Performance

Virtualized rendering (only visible rows mounted — an e2e test asserts <200
chips in the DOM against 10,183 topics) · indexed search · lazy overlay loading ·
module-load caching of indexes, facets and the A–Z map · memoized filter/sort
chains. `/niche-finder` is 26.2 kB (from 22 kB) despite 2.6× the topics, because
the library ships as compact raw data expanded at runtime.

### v4 testing report

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ clean |
| `npm run build` | ✅ clean; `/niche-finder` 26.2 kB, `/admin/niche-finder` 14.2 kB |
| `npx vitest run` | ✅ **105/105** (added `topicSearch.test.ts` — 33 tests; extended `topics.test.ts` to all 21 fields) |
| `npx playwright test niche-finder-ai` | ✅ **44/44** desktop + mobile |
| Full `npx playwright test` | ✅ **98 passed, 0 failed**, 10 skipped (Firebase-only, skipped by design) |

**Two real bugs the tests caught, both fixed at source rather than by relaxing
the assertion:**
1. One description template omitted the topic label, so every topic in a
   category shared identical copy.
2. The hover preview panel reflowed the grid *under the cursor*, moving the chip
   the user was reaching for. It is now a fixed-height slot that is always
   present; per-chip actions use opacity rather than `hidden` for the same
   reason.
