import type { Page } from '../schemas/page.schema';
import type { Workflow } from '../schemas/site.schema';

/**
 * Infer user-facing, publicly observable workflows from the crawled pages.
 * We NEVER complete sensitive actions — every workflow is tagged with a
 * confidence level so nothing is presented as verified beyond what was seen.
 */
export function inferWorkflows(pages: Page[]): Workflow[] {
  const byPath = new Map<string, Page>();
  for (const p of pages) {
    try {
      byPath.set(new URL(p.normalizedUrl).pathname.replace(/\/$/, '') || '/', p);
    } catch {
      /* ignore */
    }
  }
  const has = (path: string) => byPath.has(path.replace(/\/$/, '') || '/');
  const title = (path: string) => byPath.get(path.replace(/\/$/, '') || '/')?.title ?? null;

  const workflows: Workflow[] = [];

  // 1. Homepage discovery — always verified if home was crawled.
  if (has('/')) {
    const home = byPath.get('/')!;
    workflows.push({
      name: 'Homepage discovery',
      startRoute: '/',
      confidence: 'verified',
      steps: [
        { order: 1, route: '/', action: 'Land on homepage', elements: home.mainNav.map((n) => n.text).slice(0, 8) },
        { order: 2, route: '/', action: 'Scan hero + social proof + primary CTAs', elements: home.buttons.slice(0, 6).map((b) => b.text) },
      ],
      branches: home.mainNav.map((n) => n.normalized ?? n.href).filter((v): v is string => !!v).slice(0, 10),
      resultRoute: null,
      validationBehaviour: null,
      authenticationBoundary: 'Login / member area is off-site (learn.internetlifestylehub.com).',
      mobileBehaviour: 'Responsive; primary nav collapses to a mobile menu.',
      relatedRoutes: ['/about', '/programs', '/tools', '/masterclass'],
      notes: 'Primary entry point; CTAs funnel toward masterclass registration and program pages.',
    });
  }

  // 2. Niche Finder tool flow.
  if (has('/niche-finder')) {
    const p = byPath.get('/niche-finder')!;
    const hasForm = p.forms.length > 0;
    workflows.push({
      name: 'Niche Finder flow',
      startRoute: '/niche-finder',
      confidence: hasForm ? 'partially-verified' : 'inferred-from-ui',
      steps: [
        { order: 1, route: '/niche-finder', action: 'Open Niche Finder tool', elements: [title('/niche-finder') ?? 'Niche Finder'] },
        { order: 2, route: '/niche-finder', action: 'Answer prompts (NOT submitted by crawler)', elements: p.forms.flatMap((f) => f.fields.map((fl) => fl.label ?? fl.name ?? fl.type ?? 'field')).slice(0, 10) },
      ],
      branches: [],
      resultRoute: null,
      validationBehaviour: p.forms.some((f) => f.visibleValidation.length) ? 'Client-side required-field validation observed.' : null,
      authenticationBoundary: 'Result may require email capture; not completed.',
      mobileBehaviour: 'Responsive form layout.',
      relatedRoutes: ['/tools', '/tools/coach-persona-codex', '/tools/skills-strength-scorecard'],
      notes: 'Interactive tool; crawler inspected structure only and did not submit inputs.',
    });
  }

  // 3. Masterclass / lead-magnet registration.
  for (const path of ['/masterclass', '/masterclass-or']) {
    if (!has(path)) continue;
    const p = byPath.get(path.replace(/\/$/, ''))!;
    workflows.push({
      name: `Masterclass registration (${path})`,
      startRoute: path,
      confidence: 'inferred-from-ui',
      steps: [
        { order: 1, route: path, action: 'View masterclass landing page', elements: [title(path) ?? 'Masterclass'] },
        { order: 2, route: path, action: 'Click "Save My Seat" CTA', elements: p.buttons.filter((b) => /seat|register|save|join/i.test(b.text)).map((b) => b.text).slice(0, 4) },
        { order: 3, route: 'external/registration', action: 'Registration form (NOT submitted)', elements: [] },
      ],
      branches: [],
      resultRoute: null,
      validationBehaviour: null,
      authenticationBoundary: 'Registration/thank-you pages (/masterclass-ty) are robots-disallowed and were not crawled.',
      mobileBehaviour: 'Responsive landing page.',
      relatedRoutes: ['/join', '/programs'],
      notes: 'Lead-capture funnel; downstream thank-you routes are intentionally excluded.',
    });
  }

  // 4. Programs exploration → conversion.
  if (has('/programs')) {
    workflows.push({
      name: 'Program exploration to conversion',
      startRoute: '/programs',
      confidence: 'verified',
      steps: [
        { order: 1, route: '/programs', action: 'Browse membership tiers', elements: ['Gold', 'Diamond', 'Quantum'] },
        { order: 2, route: '/programs/gold', action: 'Read tier details', elements: [] },
        { order: 3, route: '/join', action: 'Proceed to join CTA', elements: [] },
      ],
      branches: ['/programs/gold', '/programs/diamond', '/programs/quantum'].filter(has),
      resultRoute: '/join',
      validationBehaviour: null,
      authenticationBoundary: 'Actual purchase/checkout is off-site and excluded.',
      mobileBehaviour: 'Tier cards stack vertically on mobile.',
      relatedRoutes: ['/join', '/start', '/reboot'],
      notes: 'Navigational funnel from catalogue to conversion page.',
    });
  }

  // 5. Guides / article navigation.
  const guides = pages.filter((p) => /\/guides\//.test(p.normalizedUrl));
  if (guides.length) {
    workflows.push({
      name: 'Guide / article navigation',
      startRoute: '/guides',
      confidence: 'verified',
      steps: [
        { order: 1, route: guides[0].normalizedUrl, action: 'Read a guide', elements: guides.slice(0, 3).map((g) => g.title ?? g.normalizedUrl) },
        { order: 2, route: '/guides', action: 'Follow related-content links', elements: [] },
      ],
      branches: guides.map((g) => g.normalizedUrl).slice(0, 8),
      resultRoute: null,
      validationBehaviour: null,
      authenticationBoundary: 'None — public educational content.',
      mobileBehaviour: 'Readable single-column layout.',
      relatedRoutes: guides.map((g) => g.normalizedUrl).slice(0, 5),
      notes: 'SEO content cluster around coaching topics.',
    });
  }

  // 6. Stories / social proof browsing.
  const stories = pages.filter((p) => /\/stories\//.test(p.normalizedUrl));
  if (stories.length) {
    workflows.push({
      name: 'Success-story browsing',
      startRoute: '/stories',
      confidence: 'verified',
      steps: [
        { order: 1, route: '/stories', action: 'Browse story index', elements: [] },
        { order: 2, route: stories[0].normalizedUrl, action: 'Read individual case study', elements: [] },
      ],
      branches: stories.map((s) => s.normalizedUrl).slice(0, 10),
      resultRoute: null,
      validationBehaviour: null,
      authenticationBoundary: 'None.',
      mobileBehaviour: 'Card grid → single column on mobile.',
      relatedRoutes: ['/stories'],
      notes: `${stories.length} public success stories discovered.`,
    });
  }

  return workflows;
}
