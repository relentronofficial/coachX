import type { Page } from 'playwright';
import type { ComponentInstance } from '../schemas/component.schema';

/** Raw computed-style sample harvested from the live page for design tokens. */
export interface StyleSample {
  role: string; // button | card | heading | body | input | link | section
  color: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  borderRadius: string;
  boxShadow: string;
  padding: string;
  height: string;
  width: string;
}

export interface ComponentExtraction {
  instances: ComponentInstance[];
  styleSamples: StyleSample[];
}

/**
 * Detect reusable UI components and harvest computed styles. Runs entirely in
 * the page context (needs getComputedStyle). Read-only — no interaction here.
 */
export async function extractComponents(page: Page, normalizedUrl: string): Promise<ComponentExtraction> {
  const raw = await page.evaluate(() => {
    const norm = (v: string) => (v || '').trim();
    const isVisible = (el: Element): boolean => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
    };

    const cssPath = (el: Element): string => {
      const parts: string[] = [];
      let node: Element | null = el;
      let depth = 0;
      while (node && node.nodeType === 1 && depth < 4) {
        let sel = node.nodeName.toLowerCase();
        if (node.id) {
          sel += `#${node.id}`;
          parts.unshift(sel);
          break;
        }
        const cls = (node.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
        if (cls.length) sel += '.' + cls.join('.');
        parts.unshift(sel);
        node = node.parentElement;
        depth++;
      }
      return parts.join(' > ');
    };

    const style = (el: Element, role: string) => {
      const s = getComputedStyle(el);
      return {
        role,
        color: norm(s.color),
        backgroundColor: norm(s.backgroundColor),
        fontFamily: norm(s.fontFamily),
        fontSize: norm(s.fontSize),
        fontWeight: norm(s.fontWeight),
        lineHeight: norm(s.lineHeight),
        letterSpacing: norm(s.letterSpacing),
        borderRadius: norm(s.borderRadius),
        boxShadow: norm(s.boxShadow),
        padding: norm(s.padding),
        height: norm(`${Math.round(el.getBoundingClientRect().height)}px`),
        width: norm(`${Math.round(el.getBoundingClientRect().width)}px`),
      };
    };

    const instances: any[] = [];
    const samples: any[] = [];

    const push = (name: string, el: Element, role: string, variant: string | null) => {
      if (!isVisible(el)) return;
      const st = style(el, role);
      samples.push(st);
      instances.push({
        name,
        selector: cssPath(el),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) || null,
        variant,
        style: st,
      });
    };

    // Component detection map: [name, selector, role, variant-fn]
    const specs: { name: string; sel: string; role: string; limit: number; variant?: (el: Element) => string | null }[] = [
      { name: 'Header', sel: 'header, [role="banner"]', role: 'section', limit: 1 },
      { name: 'Navbar', sel: 'header nav, nav[aria-label*="main" i]', role: 'section', limit: 1 },
      { name: 'Announcement Bar', sel: '[class*="announce" i], [class*="topbar" i]', role: 'section', limit: 1 },
      { name: 'Footer', sel: 'footer, [role="contentinfo"]', role: 'section', limit: 1 },
      {
        name: 'Button',
        sel: 'button, a[role="button"], a.btn, a[class*="button" i], input[type="submit"]',
        role: 'button',
        limit: 25,
        variant: (el) => {
          const c = (el.getAttribute('class') || '').toLowerCase();
          if (/primary|cta|solid/.test(c)) return 'primary';
          if (/secondary|outline|ghost|link/.test(c)) return 'secondary';
          return 'default';
        },
      },
      { name: 'Card', sel: '[class*="card" i]', role: 'card', limit: 20 },
      { name: 'Input', sel: 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea', role: 'input', limit: 15 },
      { name: 'Select', sel: 'select', role: 'input', limit: 10 },
      { name: 'FAQ Accordion', sel: 'details, [class*="accordion" i]', role: 'card', limit: 15 },
      { name: 'Tabs', sel: '[role="tablist"]', role: 'section', limit: 5 },
      { name: 'Modal', sel: '[role="dialog"], dialog, [class*="modal" i]', role: 'section', limit: 5 },
      { name: 'Breadcrumb', sel: '[aria-label*="breadcrumb" i], .breadcrumb', role: 'section', limit: 1 },
      { name: 'Pagination', sel: '[class*="pagination" i], nav[aria-label*="pagination" i]', role: 'section', limit: 1 },
      { name: 'Carousel', sel: '[class*="carousel" i], [class*="swiper" i], [class*="slider" i]', role: 'section', limit: 5 },
    ];

    for (const spec of specs) {
      const els = Array.from(document.querySelectorAll(spec.sel)).slice(0, spec.limit);
      for (const el of els) push(spec.name, el, spec.role, spec.variant ? spec.variant(el) : null);
    }

    // Typographic samples for the design system.
    for (const sel of ['h1', 'h2', 'h3', 'p', 'a']) {
      const els = Array.from(document.querySelectorAll(sel)).filter(isVisible).slice(0, 3);
      const role = sel === 'p' ? 'body' : sel === 'a' ? 'link' : 'heading';
      for (const el of els) samples.push(style(el, role));
    }
    // Section backgrounds.
    for (const el of Array.from(document.querySelectorAll('section, main > div')).slice(0, 12)) {
      if (isVisible(el)) samples.push(style(el, 'section'));
    }

    return { instances, samples };
  });

  const instances: ComponentInstance[] = raw.instances.map((i: any) => ({
    name: i.name,
    page: normalizedUrl,
    selector: i.selector,
    text: i.text,
    variant: i.variant,
    style: i.style,
    screenshotCrop: null,
  }));

  return { instances, styleSamples: raw.samples as StyleSample[] };
}
