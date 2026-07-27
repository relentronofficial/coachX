# Tools Module — Audit & Plan

_Audit of the CoachX reference-site before implementing the complete Tools module._

## Architecture (verified)

- **Framework:** Next.js 15, **App Router** (`app/`, no `pages/`).
- **Styling:** Tailwind CSS v3 with brand design tokens in `tailwind.config.ts` (green `#105030`, gold `#d0a030`, deep-green ink `#0a2e1e`). Shared primitives in `components/ui.tsx` (`Container`, `Section`, `Button`, `Badge`, `SectionHeading`).
- **Content/config:** `lib/site.ts` (brand, nav), `lib/tools.ts` (tools registry), `lib/niches.ts` + `lib/nicheScore.ts` (Niche Finder data + scoring).
- **Backend:** route handlers `app/api/niche-finder` (scoring) and `app/api/leads` (lead capture, no payment).

## Existing tool routes

| Route | State |
| --- | --- |
| `/tools` | ✅ Real index — grouped cards (available / member / soon), categories, CTAs, empty state. |
| `/tools/niche-finder` | ✅ Functional multi-step wizard + API + results. Missing: **saved progress**. |
| `/tools/revenue-calculator` | ✅ Functional live calculator (original extra tool). |

## Missing tool routes (to build)

- `/tools/personal-codex`
- `/tools/coach-persona-codex`
- `/tools/freedom-business-codex`
- `/tools/skills-strength-scorecard`
- `/tools/viral-reels-challenge`
- `/tools/youtube-domination`

## Gaps found

| Area | Finding | Fix |
| --- | --- | --- |
| Static placeholders | `lib/tools.ts` listed `coach-persona`, `skills-scorecard`, `content-challenge`, `offer-builder` as **member/soon** cards with **no route** and non-navigating. | Replace with the 7 real tools; each fully functional. |
| Dead buttons | Member/soon cards render as non-links (intended), but the product now needs them live. | All 7 route to working wizards. |
| Missing validation | Only Niche Finder validated. | Shared engine validates every step (required, min selections, scale bounds). |
| Missing persistence | **No tool** saved progress (Niche Finder incl.). | Shared `localStorage` persistence (resume + restart) for all tools. |
| Missing result logic | Only Niche Finder + calculator produced output. | Pure, unit-tested `score()` per tool → typed `ResultData`. |
| Broken navigation | New tools had no prev/next. | Engine provides Back/Next + progress indicator. |
| Responsive issues | Cards fine; new wizards must be mobile-first. | Engine is mobile-first; option grids collapse to 1 col. |
| Tests | **None** in repo. | Add Vitest (unit: scoring/validation) + Playwright (E2E: each tool flow). |

## Provenance / boundaries (important)

- **Verified public behaviour:** on the reference site, only the **Niche Finder** is publicly interactive (input → ranked niche categories with sub-niches). Its *structure* informed our original version.
- **Member-gated on reference:** Personal Codex, Coach Persona Codex, Freedom Business Codex, Skills Strength Scorecard, Viral Reels Challenge, YouTube Domination Codex all sat behind a "Yes, I'm a member" gate. **Their questions, reports and scoring were NOT accessed or copied.**
- **What we build:** original CoachX implementations with *equivalent product categories and business purpose* — our own branding, questions, scoring logic and report templates. Each config header labels it `origin: 'original-equivalent'` (vs `'public-observed'` for Niche Finder).

## Design decisions (original)

- One reusable, accessible **`AssessmentWizard`** engine drives all new tools (config-driven: `single` / `multi` / `scale` / `text` questions).
- Dimension-based scoring in pure functions (`lib/tools/engine.ts` + per-tool `score()`), so results are deterministic and unit-testable.
- The existing **Niche Finder is kept** (working) and only extended with saved progress — we do not rebuild working parts.
