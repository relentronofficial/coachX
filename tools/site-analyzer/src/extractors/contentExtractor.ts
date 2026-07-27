import type { CheerioAPI, Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import { collapseWhitespace, safeExcerpt } from '../utils/sanitize';
import { normalizeUrl } from '../utils/normalizeUrl';
import { isRejectedScheme } from '../router';
import type { Section, PageButton } from '../schemas/page.schema';

// Destructive / state-changing verbs — such controls are classified but NEVER clicked.
const DESTRUCTIVE = /\b(delete|remove|purchase|buy|checkout|pay|log ?in|sign ?up|sign ?in|submit|send|subscribe|register|logout|cancel account)\b/i;
const CTA_HINT = /\b(get|start|join|book|save|claim|download|register|apply|enroll|watch|explore|discover|try|learn more|contact|talk|call|schedule)\b/i;

/** Classify a control's likely action without performing it. */
function classifyAction(text: string, href: string | null): string {
  const t = text.toLowerCase();
  if (DESTRUCTIVE.test(t)) return 'state-changing (not triggered)';
  if (href && /^#/.test(href)) return 'in-page-anchor';
  if (href && isRejectedScheme(href)) {
    if (/^mailto:/i.test(href)) return 'email';
    if (/^tel:/i.test(href)) return 'phone';
    return 'external-protocol';
  }
  if (CTA_HINT.test(t)) return 'cta-navigation';
  if (href) return 'navigation';
  return 'interaction';
}

/** Infer what an element opens (for interactive discovery). */
function inferOpens($el: Cheerio<Element>): string | null {
  const attrs = (
    ($el.attr('aria-haspopup') ?? '') +
    ' ' +
    ($el.attr('aria-controls') ?? '') +
    ' ' +
    ($el.attr('aria-expanded') ?? '') +
    ' ' +
    ($el.attr('data-toggle') ?? '') +
    ' ' +
    ($el.attr('class') ?? '')
  ).toLowerCase();
  if (/modal|dialog/.test(attrs)) return 'modal';
  if (/dropdown|menu|haspopup|true/.test(attrs) && $el.attr('aria-haspopup')) return 'dropdown';
  if (/accordion|collaps/.test(attrs)) return 'accordion';
  if (/tab/.test(attrs)) return 'tab';
  const href = $el.attr('href');
  if (href && !href.startsWith('#')) return $el.attr('target') === '_blank' ? 'external' : 'route';
  return null;
}

/** Extract buttons and button-like controls (static classification). */
export function extractButtons($: CheerioAPI): PageButton[] {
  const out: PageButton[] = [];
  const seen = new Set<string>();
  $('button, a[role="button"], [role="button"], input[type="submit"], input[type="button"], a.btn, a[class*="button" i]').each(
    (_, el) => {
      const $el = $(el);
      const tag = (el as Element).tagName.toLowerCase();
      const text =
        collapseWhitespace($el.text()) ||
        $el.attr('value') ||
        $el.attr('aria-label') ||
        $el.attr('title') ||
        '';
      if (!text) return;
      const href = $el.attr('href') ?? null;
      const key = tag + '|' + text + '|' + (href ?? '');
      if (seen.has(key)) return;
      seen.add(key);

      const section = $el.closest('section, header, footer, article');
      const sectionHeading = collapseWhitespace(section.find('h1,h2,h3').first().text());

      out.push({
        text: text.slice(0, 80),
        tag,
        role: $el.attr('role') ?? null,
        ariaLabel: $el.attr('aria-label') ?? null,
        href,
        target: $el.attr('target') ?? null,
        disabled: $el.attr('disabled') !== undefined || $el.attr('aria-disabled') === 'true',
        visible: !($el.attr('hidden') !== undefined || /display:\s*none/i.test($el.attr('style') ?? '')),
        section: sectionHeading ? sectionHeading.slice(0, 60) : null,
        actionType: classifyAction(text, href),
        opens: inferOpens($el),
      });
    },
  );
  return out;
}

const SECTION_TYPE_RULES: { type: string; re: RegExp }[] = [
  { type: 'announcement-bar', re: /announce|topbar|banner-bar|notification-bar/i },
  { type: 'header', re: /(^|\s)(site-)?header|navbar/i },
  { type: 'hero', re: /hero|jumbotron|masthead|banner(?!-bar)/i },
  { type: 'logo-cloud', re: /logo-?cloud|brands|partners|as-seen|trusted-by/i },
  { type: 'features', re: /features?|benefits?|why-|value-prop/i },
  { type: 'process', re: /process|steps|how-it-works|journey|roadmap/i },
  { type: 'services', re: /services|offerings|programs?|what-we/i },
  { type: 'tools', re: /tools?|calculators?|resources/i },
  { type: 'testimonials', re: /testimonial|reviews?|stories|success/i },
  { type: 'case-studies', re: /case-?stud|results/i },
  { type: 'pricing', re: /pricing|plans?|packages?|tiers?/i },
  { type: 'faq', re: /faq|questions|accordion/i },
  { type: 'newsletter', re: /newsletter|subscribe|opt-?in/i },
  { type: 'cta', re: /cta|call-to-action|get-started|join-now/i },
  { type: 'footer', re: /footer/i },
];

function classifySection($: CheerioAPI, $sec: Cheerio<Element>, heading: string | null): string {
  const hay = (($sec.attr('class') ?? '') + ' ' + ($sec.attr('id') ?? '') + ' ' + (heading ?? '')).toLowerCase();
  for (const rule of SECTION_TYPE_RULES) if (rule.re.test(hay)) return rule.type;
  if ($sec.is('header')) return 'header';
  if ($sec.is('footer')) return 'footer';
  if ($sec.find('form').length) return 'form-section';
  return 'content';
}

/** Break the page body into a structured, ordered list of sections. */
export function extractSections($: CheerioAPI): Section[] {
  const sections: Section[] = [];
  const containers = $('body')
    .children('header, main, footer, section, div')
    .toArray();

  // Prefer semantic sections when present; else fall back to top-level blocks.
  let blocks = $('main section, main > div, body > section, header, footer').toArray();
  if (blocks.length < 2) blocks = containers;

  blocks.forEach((el, index) => {
    const $sec = $(el);
    // Skip trivially empty wrappers.
    const text = collapseWhitespace($sec.text());
    if (text.length < 5 && $sec.find('img, video, iframe, a, button').length === 0) return;

    const heading = collapseWhitespace($sec.find('h1, h2, h3').first().text()) || null;
    const subheading = collapseWhitespace($sec.find('h2, h3, h4, p').first().text()) || null;

    const ctas: string[] = [];
    const buttons: string[] = [];
    $sec.find('a.btn, a[class*="button" i], button, [role="button"]').each((_, b) => {
      const t = collapseWhitespace($(b).text());
      if (t) {
        buttons.push(t.slice(0, 60));
        if (CTA_HINT.test(t)) ctas.push(t.slice(0, 60));
      }
    });

    const links: string[] = [];
    $sec.find('a[href]').each((_, a) => {
      const href = $(a).attr('href') ?? '';
      if (href && !isRejectedScheme(href)) {
        const n = normalizeUrl(href, undefined);
        if (n) links.push(n.normalized);
      }
    });

    const imageRefs: string[] = [];
    $sec.find('img[src], img[data-src]').each((_, img) => {
      const s = $(img).attr('src') ?? $(img).attr('data-src');
      if (s) imageRefs.push(s);
    });

    const cardCount = $sec.find('[class*="card" i], article, li[class*="item" i]').length || null;
    const columns = detectColumns($sec);

    sections.push({
      index,
      type: classifySection($, $sec, heading),
      heading: heading ? heading.slice(0, 120) : null,
      subheading: subheading && subheading !== heading ? subheading.slice(0, 160) : null,
      summary: safeExcerpt(text, 300),
      ctas: [...new Set(ctas)],
      buttons: [...new Set(buttons)].slice(0, 12),
      links: [...new Set(links)].slice(0, 20),
      imageRefs: [...new Set(imageRefs)].slice(0, 12),
      backgroundStyle: $sec.attr('style')?.match(/background[^;]*/i)?.[0] ?? null,
      layoutType: cardCount && cardCount > 1 ? 'grid' : 'stack',
      columns,
      cardCount,
      hasForm: $sec.find('form').length > 0,
      position: null,
    });
  });

  return sections.slice(0, 60);
}

function detectColumns($sec: Cheerio<Element>): number | null {
  const cls = ($sec.find('[class*="grid" i], [class*="col" i]').first().attr('class') ?? '').toLowerCase();
  const m = cls.match(/(?:grid-cols-|col-|columns-)(\d)/);
  return m ? Number(m[1]) : null;
}

/** Generate a short structural content summary + word count. */
export function summarizeContent($: CheerioAPI): { summary: string; wordCount: number } {
  const $body = $('main').length ? $('main') : $('body');
  const clone = $body.clone();
  clone.find('script, style, nav, footer, header, noscript').remove();
  const text = collapseWhitespace(clone.text());
  const wordCount = text ? text.split(/\s+/).length : 0;
  const h1 = collapseWhitespace($('h1').first().text());
  const firstPara = collapseWhitespace($('main p, article p, body p').first().text());
  const summary = safeExcerpt([h1, firstPara].filter(Boolean).join(' — '), 300);
  return { summary, wordCount };
}

/** Detect structural feature flags used across analysis & workflow inference. */
export function detectFeatures($: CheerioAPI): Record<string, boolean> {
  const bodyText = $('body').text().toLowerCase();
  return {
    hasSearch: $('input[type="search"], [role="search"], form[action*="search" i]').length > 0,
    hasPagination: $('[class*="pagination" i], nav[aria-label*="pagination" i], a[rel="next"]').length > 0,
    hasTabs: $('[role="tab"], [role="tablist"], [class*="tab" i][data-tab]').length > 0,
    hasAccordion: $('[class*="accordion" i], details, [aria-expanded]').length > 0,
    hasCarousel: $('[class*="carousel" i], [class*="slider" i], [class*="swiper" i], [class*="slick" i]').length > 0,
    hasModal: $('[role="dialog"], [class*="modal" i], dialog').length > 0,
    hasCookieBanner: /cookie|consent|gdpr/.test(bodyText) && $('[class*="cookie" i], [id*="cookie" i], [class*="consent" i]').length > 0,
    hasVideo: $('video, iframe[src*="youtube" i], iframe[src*="vimeo" i]').length > 0,
    hasTable: $('table').length > 0,
    hasTestimonials: /testimonial|what our|success stor/.test(bodyText) || $('[class*="testimonial" i]').length > 0,
    hasPricing: /pricing|per month|\/mo\b|₹|\$\d/.test(bodyText) && $('[class*="pric" i], [class*="plan" i]').length > 0,
    hasFaq: /frequently asked|faq/.test(bodyText) || $('[class*="faq" i]').length > 0,
    hasNewsletter: $('form').filter((_, f) => /subscribe|newsletter/i.test($(f).text() + ($(f).attr('class') ?? ''))).length > 0,
  };
}
