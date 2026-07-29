import Image from 'next/image';
import { Button, Container, Section, SectionHeading, Badge } from './ui';
import { Reveal, Stagger } from './motion/Reveal';
import { CountUp } from './motion/CountUp';
import { TiltCard } from './motion/TiltCard';
import { BeforeAfter, CompareHint } from './showcase/BeforeAfter';
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

/**
 * Hero: value-proposition copy + a brand-framed founder portrait.
 *
 * The portrait carries floating credibility chips rather than another
 * paragraph — the first screen has about five seconds to say "premium and
 * worth exploring", and a second block of prose spends those five seconds
 * asking to be read instead.
 */
export function Hero({ content }: { content?: Partial<HeroContent> }) {
  const c = { ...DEFAULT_HERO, ...content };
  return (
    <section className="relative flex items-center overflow-hidden bg-white lg:min-h-[calc(100dvh-6.25rem)]">
      <div className="surface-tint pointer-events-none absolute inset-0 -z-10" />
      <Container className="grid w-full items-center gap-6 py-8 sm:gap-10 lg:grid-cols-2 lg:gap-12 lg:py-0">
        {/* Copy — driven by CMS content */}
        <div>
          <Reveal direction="left">
            <Badge>◆ {c.badge}</Badge>
          </Reveal>
          <Reveal direction="left" delay={70}>
            <h1 className="mt-4 text-h1 sm:text-display" data-testid="hero-title">
              {c.title}
            </h1>
          </Reveal>
          <Reveal direction="left" delay={140}>
            <p className="mt-4 max-w-xl text-lg text-slate-500">{c.subtitle}</p>
          </Reveal>
          <Reveal direction="left" delay={210}>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button href={c.primaryCta.href} variant="amber" fx="book" className="text-base">
                {c.primaryCta.label}
              </Button>
              <Button href={c.secondaryCta.href} variant="secondary" className="text-base">
                {c.secondaryCta.label}
              </Button>
            </div>
          </Reveal>
          <Reveal direction="left" delay={280}>
            <div className="mt-7 flex items-center gap-4 text-sm text-slate-500">
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
          </Reveal>
        </div>

        {/* Founder portrait framed on a clean brand backdrop */}
        <Reveal direction="zoom" delay={120} className="flex justify-center lg:justify-end">
          <div className="relative">
            {/* Backdrop discs scale with the portrait — they frame it, so
                growing the image alone would push the head out of the circle. */}
            <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-100 sm:h-[540px] sm:w-[540px] lg:h-[640px] lg:w-[640px]" />
            <div className="absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,80,48,0.14),transparent_65%)] blur-2xl sm:h-[580px] sm:w-[580px] lg:h-[670px] lg:w-[670px]" />
            <Image
              src="/brand/founder.png"
              alt="CoachX"
              width={408}
              height={612}
              priority
              /* The viewport cap stays: this is the only element on the first
                 screen tall enough to push the CTAs below the fold on a short
                 laptop, so height is bounded by vh, not just by px. */
              sizes="(min-width: 1024px) 480px, (min-width: 640px) 380px, 300px"
              className="relative h-[440px] w-auto object-contain drop-shadow-2xl sm:h-[560px] lg:h-[min(760px,82vh)]"
            />
            <div className="fx-float absolute bottom-5 -left-2 rounded-pill bg-white px-4 py-2 shadow-soft sm:-left-4">
              <p className="text-xs font-bold text-amber-dark">★★★★★</p>
              <p className="text-xs font-semibold text-ink">4.9/5 rated by coaches</p>
            </div>
            <div className="fx-float-slow absolute -right-1 top-10 hidden rounded-pill bg-white px-4 py-2 shadow-soft sm:block">
              <p className="text-xs font-semibold text-ink">3 days · live on Zoom</p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/**
 * Original, self-contained "app preview" mockup. Communicates the product
 * (interactive tools → ranked results) without any external image or person —
 * pure markup styled with brand tokens.
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
      <div className="fx-float absolute -left-3 top-6 hidden rounded-pill bg-white px-3 py-1.5 shadow-soft sm:block">
        <p className="text-xs font-bold text-ink">7 free tools</p>
      </div>
      <div className="fx-float-slow absolute -right-3 bottom-8 hidden rounded-pill bg-white px-3 py-1.5 shadow-soft sm:block">
        <p className="text-xs font-bold text-amber-dark">★ 4.9/5</p>
      </div>
    </div>
  );
}

/** Stat band — figures count up as the band scrolls into view. */
export function StatBar() {
  return (
    <div className="border-y border-slate-200 bg-slate-50">
      <Container className="grid grid-cols-2 gap-5 py-8 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-extrabold text-ink">
              <CountUp value={s.value} />
            </p>
            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </Container>
    </div>
  );
}

/**
 * Logo cloud as a paused-on-hover marquee. The track is duplicated and
 * translated by exactly -50%, which is what makes the loop seamless — the
 * second copy sits where the first started.
 */
export function LogoCloud() {
  const track = [...logos, ...logos];
  return (
    <Container className="py-8">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Part of the Tamil Business Tribe ecosystem
      </p>
      <div className="fx-marquee-mask mt-5 overflow-hidden">
        <div className="fx-marquee flex w-max items-center gap-x-12 opacity-70">
          {track.map((l, i) => (
            <span key={`${l}-${i}`} className="whitespace-nowrap text-xl font-extrabold text-slate-400">
              {l}
            </span>
          ))}
        </div>
      </div>
    </Container>
  );
}

/** Feature grid — interactive cards, cascading in. */
export function Features() {
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="Why it works"
        title="A system for predictable growth"
        lead="Attract leads, convert clients, and build repeatable revenue."
      />
      <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" itemClassName="h-full">
        {features.map((f) => (
          <div key={f.title} className="card card-i group h-full">
            <div className="grid h-12 w-12 place-items-center rounded-card bg-blush text-xl text-violet transition-transform duration-300 group-hover:scale-110">
              {f.icon}
            </div>
            <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{f.body}</p>
          </div>
        ))}
      </Stagger>
    </Section>
  );
}

/**
 * Tool showcase — the free assessment tools, shown rather than described.
 * Reuses the self-contained product mockup so the section costs no new assets
 * and no external image.
 */
export function ToolShowcase() {
  const bullets = [
    'Answer a few questions — no signup to start',
    'Get a ranked, explainable best-fit niche',
    'Keep the report and act on it the same day',
  ];
  return (
    // overflow-hidden: the preview's decorative glow is deliberately wider than
    // the card it sits behind, so on the right-hand column it would otherwise
    // push the document ~13px wider than the viewport and show a horizontal
    // scrollbar. Same containment the hero uses for its backdrop circles.
    <Section className="overflow-hidden bg-slate-50">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal direction="left">
          <p className="eyebrow">See it in action</p>
          <h2 className="mt-2 text-h2">Find your niche before you build anything</h2>
          <p className="mt-3 max-w-md text-lg text-slate-500">
            The tools do the thinking with you — not another PDF to read.
          </p>
          <ul className="mt-6 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-slate-700">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-pill bg-teal text-xs text-white">
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/tools/niche-finder" variant="primary" fx="ai" className="text-base">
              Try the Niche Finder
            </Button>
            <Button href="/tools" variant="secondary">
              All free tools
            </Button>
          </div>
        </Reveal>

        <Reveal direction="right" delay={120} className="flex justify-center lg:justify-end">
          <TiltCard>
            <HeroProductPreview />
          </TiltCard>
        </Reveal>
      </div>
    </Section>
  );
}

/** Numbered process, rendered as a connected timeline. */
export function Process() {
  return (
    <Section>
      <SectionHeading eyebrow="The framework" title="The 5-week Coaching Growth Framework" />
      <div className="relative">
        {/* Connector runs behind the markers on wide screens only — stacked
            cards on mobile have no line to connect. */}
        <div className="rule-fade absolute left-0 right-0 top-6 hidden lg:block" />
        <Stagger className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-5" itemClassName="h-full" step={90}>
          {processSteps.map((p) => (
            <div key={p.step} className="card card-i group h-full bg-white">
              <span className="grid h-11 w-11 place-items-center rounded-pill bg-ink font-serif text-lg font-bold text-amber transition-transform duration-300 group-hover:scale-110">
                {p.step}
              </span>
              <h3 className="mt-3 text-lg font-bold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{p.body}</p>
            </div>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}

/** Interactive before/after — drag to compare the two states. */
export function Transformation() {
  return (
    <Section className="bg-slate-50">
      <SectionHeading
        eyebrow="The shift"
        title="What actually changes"
        lead="Drag the handle to compare where most coaches start with where the system takes them."
      />
      <Reveal direction="rise" className="mx-auto max-w-4xl">
        <BeforeAfter
          before={{
            label: 'Most coaches today',
            title: 'Talented, but the income never settles',
            points: [
              'Clients arrive by referral and luck',
              'Every month starts from zero',
              'Offer and pricing change with each enquiry',
              'Marketing happens when there is time left over',
            ],
          }}
          after={{
            label: 'With the system',
            title: 'A business that runs on a repeatable process',
            points: [
              'A defined niche and one clear offer',
              'A lead system that runs every week',
              'Conversations that follow a proven structure',
              'Revenue you can plan around, not hope for',
            ],
          }}
        />
      </Reveal>
      <CompareHint>Drag the handle, or focus it and use the arrow keys</CompareHint>
    </Section>
  );
}

/**
 * A single program card.
 *
 * Shows no price or cadence by design — the public site is value-led, and the
 * conversation about investment happens on the call, not on a card. The `price`
 * field still exists on the model and stays editable in Admin → Programs; it is
 * simply never rendered to a visitor. Don't reintroduce it here.
 */
export function ProgramCard({ program }: { program: Program }) {
  return (
    <div
      className={`card card-i group flex h-full flex-col ${program.featured ? 'ring-2 ring-teal shadow-glow' : ''}`}
    >
      {/* self-start: in a flex column the badge would otherwise stretch to the
          full card width and stop reading as a pill. */}
      {program.featured ? (
        <span className="self-start">
          <Badge>Most popular</Badge>
        </span>
      ) : (
        <span className="h-6" />
      )}
      <h3 className="mt-3 text-xl font-bold text-ink">{program.name}</h3>
      <p className="mt-2 text-sm text-slate-500">{program.summary}</p>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-teal">What you walk away with</p>
      <ul className="mt-3 space-y-2 text-sm">
        {program.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-slate-600">
            <span className="mt-0.5 text-teal">✓</span> {perk}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <Button
          href={`/programs/${program.slug}`}
          variant={program.featured ? 'primary' : 'secondary'}
          fx="card"
          className="w-full"
        >
          Explore {program.name}
        </Button>
      </div>
    </div>
  );
}

/**
 * Program grid — reads published programs from the CMS. `limit` caps how many
 * render: the homepage passes 3 to keep its single 3-up row, while /programs
 * omits it and lists the full catalogue. Without this the page silently hid
 * every program past the third.
 */
export async function ProgramCards({
  limit,
  showHeading = true,
}: { limit?: number; showHeading?: boolean } = {}) {
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
      {/* /programs supplies its own <h1> hero, so it suppresses this heading
          rather than stacking a second title above the same grid. */}
      {showHeading ? (
        <SectionHeading
          eyebrow="Programs"
          title="Choose how you want to be supported"
          lead="Every path installs the same system — they differ in how much of it we build alongside you."
        />
      ) : null}
      <Stagger className={`mx-auto grid items-stretch gap-5 ${columns}`} itemClassName="h-full" step={90}>
        {list.map((p) => (
          <ProgramCard key={p.slug} program={p} />
        ))}
      </Stagger>
    </Section>
  );
}

/** Testimonials — quotes, the founder video, and the revenue proof strip. */
export function Testimonials() {
  const featured = stories.find((s) => s.video);

  return (
    <Section>
      <SectionHeading
        eyebrow="Testimonials"
        title="Results from the tribe"
        lead="Real member results. Quotes are placeholders — swap in their own words."
      />
      <Stagger className="grid gap-5 md:grid-cols-3" itemClassName="h-full">
        {stories.slice(0, 3).map((s) => (
          <figure key={s.slug} className="card card-i flex h-full flex-col">
            <span aria-hidden="true" className="font-serif text-4xl leading-none text-teal/25">
              &ldquo;
            </span>
            <blockquote className="mt-1 text-slate-700">{s.quote}</blockquote>
            <figcaption className="mt-auto flex items-center gap-3 pt-5">
              <Image src={img(s.slug, 80, 80)} alt="" width={40} height={40} className="h-10 w-10 rounded-pill object-cover" />
              <div>
                <p className="text-sm font-bold text-ink">{s.name}</p>
                <p className="text-xs text-slate-500">{s.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </Stagger>

      {featured?.video && (
        <Reveal direction="rise" className="mx-auto mt-10 max-w-2xl">
          <figure>
            <figcaption className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-slate-500">
              Video testimonial — {featured.name}, {featured.role}
            </figcaption>
            {/* preload="none": 4 MB is still real bandwidth, so don't fetch it until played. */}
            <video controls preload="none" playsInline className="w-full rounded-card border border-slate-200 shadow-sm">
              <source src={featured.video} type="video/mp4" />
              Your browser cannot play this video.
            </video>
          </figure>
        </Reveal>
      )}

      <div className="mt-10">
        <h3 className="text-center text-sm font-bold uppercase tracking-wide text-slate-500">
          Revenue screenshots from the tribe
        </h3>
        <Stagger className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" step={60} direction="zoom">
          {revenueProof.map((p) => (
            <div key={p.src} className="fx-frame group rounded-card border border-slate-200 shadow-sm">
              <Image
                src={p.src}
                alt={p.alt}
                width={1080}
                height={1080}
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                className="fx-media object-cover"
              />
            </div>
          ))}
        </Stagger>
      </div>

      <div className="mt-8 text-center">
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
      {/* 5/7 rather than 4/8: at this portrait's 2:3 ratio a 520px-tall image is
          ~347px wide, which a 4-column track cannot hold without `w-auto`
          shrinking it back down to fit. The column has to grow with it. */}
      <div className="grid items-center gap-8 lg:grid-cols-12">
        {/* Photo (transparent cutout, height-contained to fit the section) */}
        <Reveal direction="left" className="flex justify-center lg:col-span-5">
          <div className="relative w-fit">
            <Image
              src="/brand/founder.png"
              alt="Sakthivel Pannerselvam, Founder of CoachX"
              width={408}
              height={612}
              /* Without `sizes` the optimizer picked a 204px-wide variant for a
                 slot that renders ~347px, which is a visible upscale. The
                 source is only 408x612, so this asks for the largest variant
                 the asset can actually supply. */
              sizes="(min-width: 1024px) 350px, (min-width: 640px) 310px, 260px"
              className="h-[380px] w-auto object-contain drop-shadow-xl sm:h-[460px] lg:h-[520px]"
            />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-pill bg-white px-5 py-2 text-center shadow-soft">
              <p className="text-sm font-extrabold text-ink">Sakthivel Pannerselvam</p>
              <p className="text-xs text-slate-500">Founder · CoachX</p>
            </div>
          </div>
        </Reveal>

        {/* Copy */}
        <Reveal direction="right" delay={100} className="lg:col-span-7">
          <p className="eyebrow">Meet your mentor</p>
          <h2 className="mt-2 text-h2">Learn from the founder, Sakthivel Pannerselvam</h2>
          <p className="mt-3 text-lg text-slate-500">
            Placeholder founder blurb — a couple of lines on your journey and why you built CoachX. Replace with
            your own story.
          </p>
          <ul className="mt-5 space-y-2.5">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-slate-700">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-pill bg-teal text-xs text-white">✓</span>
                {h}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/masterclass" variant="amber" fx="book">Reserve your spot</Button>
            <Button href="/about" variant="secondary">Read the full story</Button>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/** Full-width closing CTA. */
export function CTA() {
  return (
    <Section>
      <Reveal direction="rise">
        <div className="surface-ink relative overflow-hidden rounded-xl2 px-6 py-12 text-center text-white sm:px-12 sm:py-14">
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-h2 text-white">Ready to build predictable revenue?</h2>
            <p className="mt-3 text-slate-300">
              Reserve your spot for the 3-day live workshop and install the CoachX framework.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/masterclass" variant="amber" fx="book" className="text-base">
                Reserve your spot
              </Button>
              <Button href="/programs" variant="secondary" className="text-base">
                Explore programs
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
