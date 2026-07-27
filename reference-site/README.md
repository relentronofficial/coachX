# Reference Site — coaching-community scaffold

An **original** Next.js + Tailwind reference scaffold that reproduces the *structure and design
system* of a coaching-community website, using **neutral placeholder content** throughout.

> This is a template you own. It is **not** a copy of, and **not** affiliated with, any real
> website or brand. The brand name ("Northwind Coaching Collective"), all copy, testimonials,
> people, and images are generic, fictional placeholders. Design tokens (colours, type scale,
> radii, shadows, spacing) were derived from the `tools/site-analyzer` crawl's
> `design-system.json` and mapped into `tailwind.config.ts`.

## What's inside

- **App Router** pages mirroring the information architecture:
  `/` · `/about` · `/programs` · `/programs/[tier]` · `/tools` · `/guides` · `/stories` ·
  `/events` · `/join` · `/masterclass`
- **Design tokens** in `tailwind.config.ts` + `app/globals.css`
  (deep-navy `#000d38`, teal `#2b8c9d`, amber `#f59e0b`, violet `#7c3aed`, blush `#fce7f3`;
  Tailwind `slate` neutrals; pill/16px radii; purple-tinted shadows; Outfit + Lora fonts).
- **Component library** in `components/`: Header (announcement bar + responsive nav + mobile menu),
  Footer, Button, Card, Hero, StatBar, LogoCloud, Features, Process, ProgramCard, Testimonials,
  FAQ accordion, CTA, Newsletter, LeadForm.
- **Placeholder content** centralised in `lib/site.ts` — edit one file to rebrand.
- Forms (`LeadForm`, `Newsletter`) are **UI demos**: they never submit anywhere and store nothing.

## Run

```bash
cd reference-site
npm install
npm run dev      # http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

> Placeholder images load from `picsum.photos` (allow-listed in `next.config.mjs`). Swap `lib/site.ts`'s
> `img()` helper for your own asset URLs/imports to go fully self-contained.

## Make it yours

1. Edit `lib/site.ts` — brand, nav, stats, programs, tools, stories, guides, events, FAQs.
2. Adjust tokens in `tailwind.config.ts` / `app/globals.css`.
3. Replace placeholder images and wire the forms to your provider.

## Provenance

Structure/IA and design tokens were informed by the analysis in `../tools/site-analyzer/output/`
(routes, components, design-system). No source content, copy, or assets from any crawled site are
reproduced here — only your own neutral placeholders.
