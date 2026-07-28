import Link from 'next/link';
import Image from 'next/image';
import { Button, Container, Section, SectionHeading, Badge } from './ui';
import { stats, logos, features, processSteps, programs, stories, revenueProof, img, type Program } from '@/lib/site';
import { listPublishedPrograms } from '@/lib/cms/store';

/** Hero content (editable via the CMS; falls back to these defaults). */
export interface HeroContent {
  badge: string;
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  trust: string;
}

const DEFAULT_HERO: HeroContent = {
  badge: 'The growth platform for coaches',
  title: 'Where your expertise becomes a business that grows',
  subtitle:
    'Clarity, tools and a proven system in one place — from finding your niche to building predictable revenue, without the guesswork.',
  primaryCta: { label: 'Find your niche', href: '/tools/niche-finder' },
  secondaryCta: { label: 'Explore programs', href: '/programs' },
  trust: 'Trusted by 10,000+ coaches · 4.9/5 rated',
};

/** Hero: value-proposition copy + a professional brand-framed portrait. */
export function Hero({ content }: { content?: Partial<HeroContent> }) {
  const c = { ...DEFAULT_HERO, ...content };
  return (
    <section className="relative flex items-center overflow-hidden bg-white lg:min-h-[calc(100dvh-6.25rem)]">
      <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 bg-[radial-gradient(50%_60%_at_70%_40%,rgba(16,80,48,0.08),transparent_70%)]" />
      <Container className="grid w-full items-center gap-8 py-8 sm:gap-10 lg:grid-cols-2 lg:gap-12 lg:py-0">
        {/* Copy — driven by CMS content */}
        <div>
          <Badge>◆ {c.badge}</Badge>
          <h1 className="mt-5 text-h1 sm:text-display" data-testid="hero-title">
            {c.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-500">{c.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href={c.primaryCta.href} variant="amber" className="text-base">
              {c.primaryCta.label}
            </Button>
            <Button href={c.secondaryCta.href} variant="secondary" className="text-base">
              {c.secondaryCta.label}
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-4 text-sm text-slate-500">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((n) => (
                <Image
                  key={n}
                  src={img(`face-${n}`, 80, 80)}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-pill border-2 border-white object-cover"
                />
              ))}
            </div>
            <span>{c.trust}</span>
          </div>
        </div>

        {/* Founder portrait framed on a clean brand backdrop */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            <div className="absolute left-1/2 top-1/2 -z-10 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-100 sm:h-[480px] sm:w-[480px] lg:h-[560px] lg:w-[560px]" />
            <div className="absolute left-1/2 top-1/2 -z-10 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,80,48,0.14),transparent_65%)] blur-2xl sm:h-[520px] sm:w-[520px] lg:h-[580px] lg:w-[580px]" />
            <Image
              src="/brand/founder.png"
              alt="CoachX"
              width={408}
              height={612}
              priority
              className="relative h-[400px] w-auto object-contain drop-shadow-2xl sm:h-[500px] lg:h-[min(640px,70vh)]"
            />
            <div className="absolute bottom-5 -left-2 rounded-pill bg-white px-4 py-2 shadow-soft sm:-left-4">
              <p className="text-xs font-bold text-amber-dark">★★★★★</p>
              <p className="text-xs font-semibold text-ink">4.9/5 rated by coaches</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * Original, self-contained "app preview" mockup for the hero. Communicates the
 * product (interactive tools → ranked results) without any external image or
 * person — pure markup styled with brand tokens.
 */
function HeroProductPreview() {
  return (
    <div className="relative w-full max-w-md">
      {/* brand backdrop */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,80,48,0.12),transparent_65%)] blur-2xl" />

      {/* app window */}
      <div className="overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-teal/50" />
          <span className="ml-3 truncate rounded-pill bg-white px-3 py-1 text-[11px] text-slate-400">coachx · niche finder</span>
        </div>

        <div className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal">Step 4 of 5</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-slate-100">
            <div className="h-full w-[72%] rounded-pill bg-teal" />
          </div>

          <p className="mt-4 text-sm font-bold text-ink">Which areas energise you?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Money & Wealth', on: true },
              { label: 'Business', on: true },
              { label: 'Health', on: false },
              { label: 'Career', on: false },
            ].map((o) => (
              <div
                key={o.label}
                className={`flex items-center justify-between rounded-card border px-3 py-2 text-xs font-semibold ${
                  o.on ? 'border-teal bg-teal/5 text-ink' : 'border-slate-200 text-slate-500'
                }`}
              >
                {o.label}
                <span className={`grid h-4 w-4 place-items-center rounded-pill text-[9px] ${o.on ? 'bg-teal text-white' : 'border border-slate-300 text-transparent'}`}>✓</span>
              </div>
            ))}
          </div>

          {/* result card */}
          <div className="mt-4 flex items-center justify-between rounded-card border-2 border-teal bg-white p-3 shadow-glow">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Best-fit niche</p>
              <p className="text-sm font-extrabold text-ink">Investing &amp; Wealth</p>
            </div>
            <div
              className="relative grid h-14 w-14 place-items-center rounded-full"
              style={{ background: 'conic-gradient(#105030 331deg, #e2e8f0 331deg)' }}
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white">
                <span className="text-xs font-extrabold text-ink">92%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* floating credibility chips */}
      <div className="absolute -left-3 top-6 hidden rounded-pill bg-white px-3 py-1.5 shadow-soft sm:block">
        <p className="text-xs font-bold text-ink">7 free tools</p>
      </div>
      <div className="absolute -right-3 bottom-8 hidden rounded-pill bg-white px-3 py-1.5 shadow-soft sm:block">
        <p className="text-xs font-bold text-amber-dark">★ 4.9/5</p>
      </div>
    </div>
  );
}

/** Stat band. */
export function StatBar() {
  return (
    <div className="border-y border-slate-200 bg-slate-50">
      <Container className="grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-extrabold text-ink">{s.value}</p>
            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </Container>
    </div>
  );
}

/** Logo cloud (placeholder wordmarks). */
export function LogoCloud() {
  return (
    <Container className="py-12">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Part of the Tamil Business Tribe ecosystem
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
        {logos.map((l) => (
          <span key={l} className="text-xl font-extrabold text-slate-400">
            {l}
          </span>
        ))}
      </div>
    </Container>
  );
}

/** Feature grid. */
export function Features() {
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="Why it works"
        title="A system for predictable growth"
        lead="Attract leads, convert clients, and build repeatable revenue."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="card transition-transform hover:-translate-y-1">
            <div className="grid h-11 w-11 place-items-center rounded-card bg-blush text-lg text-violet">{f.icon}</div>
            <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{f.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Numbered process. */
export function Process() {
  return (
    <Section className="bg-slate-50">
      <SectionHeading eyebrow="The framework" title="The 5-week Coaching Growth Framework" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {processSteps.map((p) => (
          <div key={p.step} className="relative">
            <span className="font-serif text-5xl font-bold text-teal/30">{p.step}</span>
            <h3 className="mt-2 text-lg font-bold text-ink">{p.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{p.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** A single pricing/program card. */
export function ProgramCard({ program }: { program: Program }) {
  return (
    <div className={`card flex flex-col ${program.featured ? 'ring-2 ring-teal shadow-glow' : ''}`}>
      {program.featured ? <Badge>Most popular</Badge> : <span className="h-6" />}
      <h3 className="mt-3 text-xl font-bold text-ink">{program.name}</h3>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-3xl font-extrabold text-ink">{program.price}</span>
        <span className="pb-1 text-sm text-slate-400">{program.cadence}</span>
      </div>
      <p className="mt-2 text-sm text-slate-500">{program.summary}</p>
      <ul className="mt-5 space-y-2 text-sm">
        {program.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-slate-600">
            <span className="mt-0.5 text-teal">✓</span> {perk}
          </li>
        ))}
      </ul>
      <div className="mt-6 pt-2">
        <Button href={`/programs/${program.slug}`} variant={program.featured ? 'primary' : 'secondary'} className="w-full">
          Choose {program.name}
        </Button>
      </div>
    </div>
  );
}

/** Program/pricing grid — reads published programs from the CMS. */
/**
 * Program grid. `limit` caps how many render — the homepage passes 3 to keep
 * its single 3-up row, while /programs omits it and lists the full catalogue.
 * Without this the page silently hid every program past the third.
 */
export async function ProgramCards({ limit }: { limit?: number } = {}) {
  const items = await listPublishedPrograms();
  const all = items.length ? items : programs;
  const list = limit ? all.slice(0, limit) : all;

  // Columns follow the number of cards. A lone card in a 3-column grid sits
  // stranded at a third of the width on the left; below three, the grid narrows
  // and centres instead. Three or more keeps the original 3-up row exactly.
  const columns =
    list.length === 1 ? 'max-w-md' : list.length === 2 ? 'max-w-3xl sm:grid-cols-2' : 'lg:grid-cols-3';

  return (
    <Section id="programs">
      <SectionHeading eyebrow="Programs" title="Pick your plan" lead="Simple, month-to-month." />
      <div className={`mx-auto grid items-start gap-6 ${columns}`}>
        {list.map((p) => (
          <ProgramCard key={p.slug} program={p} />
        ))}
      </div>
    </Section>
  );
}

/** Testimonials (fictional). */
export function Testimonials() {
  const featured = stories.find((s) => s.video);

  return (
    <Section className="bg-slate-50">
      <SectionHeading eyebrow="Testimonials" title="Results from the tribe" lead="Real member results. Quotes are placeholders — swap in their own words." />
      <div className="grid gap-6 md:grid-cols-3">
        {stories.slice(0, 3).map((s) => (
          <figure key={s.slug} className="card">
            <blockquote className="text-slate-700">“{s.quote}”</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <Image src={img(s.slug, 80, 80)} alt="" width={40} height={40} className="h-10 w-10 rounded-pill object-cover" />
              <div>
                <p className="text-sm font-bold text-ink">{s.name}</p>
                <p className="text-xs text-slate-500">{s.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      {featured?.video && (
        <figure className="mx-auto mt-12 max-w-2xl">
          <figcaption className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-slate-500">
            Video testimonial — {featured.name}, {featured.role}
          </figcaption>
          {/* preload="none": 4 MB is still real bandwidth, so don't fetch it until played. */}
          <video controls preload="none" playsInline className="w-full rounded-card border border-slate-200 shadow-sm">
            <source src={featured.video} type="video/mp4" />
            Your browser cannot play this video.
          </video>
        </figure>
      )}

      <div className="mt-12">
        <h3 className="text-center text-sm font-bold uppercase tracking-wide text-slate-500">Revenue screenshots from the tribe</h3>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {revenueProof.map((p) => (
            <Image
              key={p.src}
              src={p.src}
              alt={p.alt}
              width={1080}
              height={1080}
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="rounded-card border border-slate-200 object-cover shadow-sm"
            />
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <Button href="/stories" variant="ghost">
          Read more stories →
        </Button>
      </div>
    </Section>
  );
}

/** Founder intro band — photo + short credibility blurb. */
export function Founder() {
  const highlights = [
    'Founder of CoachX & Tamil Business Tribe',
    'Helped coaches build predictable revenue systems',
    'Leads the 3-day live growth workshop',
  ];
  return (
    <Section className="bg-slate-50">
      <div className="grid items-center gap-10 lg:grid-cols-12">
        {/* Photo (transparent cutout, height-contained to fit the section) */}
        <div className="flex justify-center lg:col-span-4">
          <div className="relative w-fit">
            <Image
              src="/brand/founder.png"
              alt="Sakthivel Pannerselvam, Founder of CoachX"
              width={408}
              height={612}
              className="h-[320px] w-auto object-contain drop-shadow-xl sm:h-[380px]"
            />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-pill bg-white px-5 py-2 text-center shadow-soft">
              <p className="text-sm font-extrabold text-ink">Sakthivel Pannerselvam</p>
              <p className="text-xs text-slate-500">Founder · CoachX</p>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="lg:col-span-8">
          <p className="eyebrow">Meet your mentor</p>
          <h2 className="mt-2 text-h2">Learn from the founder, Sakthivel Pannerselvam</h2>
          <p className="mt-4 text-lg text-slate-500">
            Placeholder founder blurb — a couple of lines on your journey and why you built CoachX. Replace with
            your own story.
          </p>
          <ul className="mt-6 space-y-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-slate-700">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-pill bg-teal text-xs text-white">✓</span>
                {h}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/masterclass" variant="amber">Reserve your spot</Button>
            <Button href="/about" variant="secondary">Read the full story</Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/** Full-width closing CTA. */
export function CTA() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-xl2 bg-ink px-6 py-16 text-center text-white sm:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgba(208,160,48,0.28),transparent_70%)]" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-h2 text-white">Ready to build predictable revenue?</h2>
          <p className="mt-3 text-slate-300">Reserve your spot for the 3-day live workshop and install the CoachX framework.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/masterclass" variant="amber" className="text-base">
              Reserve your spot
            </Button>
            <Button href="/programs" variant="secondary" className="text-base">
              Explore programs
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
