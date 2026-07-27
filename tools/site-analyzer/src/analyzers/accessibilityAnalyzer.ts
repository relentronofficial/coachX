import type { Page } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { logger } from '../utils/logger';
import type { AccessibilityIssue } from '../schemas/site.schema';

const log = logger.child({ mod: 'a11y' });

/**
 * Run axe-core against the live, rendered page. Returns automated violations
 * only. NOTE: automated testing catches a subset of WCAG issues — this is not
 * a full compliance audit and must not be presented as one.
 */
export async function analyzeAccessibility(page: Page, url: string): Promise<AccessibilityIssue[]> {
  try {
    const analysis = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    // Bound axe so a huge DOM can't consume the whole request-handler budget.
    const results = await Promise.race([
      analysis,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('axe timeout')), 25000)),
    ]);

    return results.violations.map((v) => ({
      url,
      id: v.id,
      impact: v.impact ?? null,
      description: v.description,
      help: v.help,
      nodes: v.nodes.length,
      sampleTarget: v.nodes[0]?.target?.join(' ') ?? null,
    }));
  } catch (err) {
    log.warn({ url, err: String(err) }, 'axe analysis failed');
    return [];
  }
}
