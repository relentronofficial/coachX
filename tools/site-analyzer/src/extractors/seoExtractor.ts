import type { Page, Heading, SeoIssue } from '../schemas/page.schema';

/**
 * Per-page SEO checks. Cross-page checks (duplicate titles, orphan pages,
 * broken links) are handled later by the analyzers over the full dataset.
 */
export function extractSeoIssues(page: Pick<Page,
  'title' | 'meta' | 'headings' | 'canonicalUrl' | 'media' | 'wordCount' | 'normalizedUrl'>): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const add = (code: string, severity: SeoIssue['severity'], message: string) =>
    issues.push({ code, severity, message });

  // Title.
  if (!page.title) add('missing-title', 'error', 'Page has no <title>.');
  else if (page.title.length > 65) add('long-title', 'info', `Title is ${page.title.length} chars (>65).`);
  else if (page.title.length < 15) add('short-title', 'warning', `Title is only ${page.title.length} chars.`);

  // Meta description.
  if (!page.meta.description) add('missing-meta-description', 'warning', 'No meta description.');
  else if (page.meta.description.length > 160)
    add('long-meta-description', 'info', `Meta description is ${page.meta.description.length} chars (>160).`);

  // Headings.
  const h1s = page.headings.filter((h: Heading) => h.level === 1);
  if (h1s.length === 0) add('missing-h1', 'error', 'No H1 on page.');
  else if (h1s.length > 1) add('multiple-h1', 'warning', `${h1s.length} H1 elements found.`);

  // Heading hierarchy (no skipped levels going down).
  let prev = 0;
  for (const h of page.headings) {
    if (prev && h.level > prev + 1) {
      add('broken-heading-hierarchy', 'info', `Heading jumps from H${prev} to H${h.level}.`);
      break;
    }
    prev = h.level;
  }

  // Canonical.
  if (!page.canonicalUrl) add('missing-canonical', 'info', 'No canonical link.');

  // Robots noindex.
  if (page.meta.robots && /noindex/i.test(page.meta.robots))
    add('noindex', 'warning', 'Page is marked noindex.');

  // Image alt text.
  const imagesMissingAlt = page.media.filter((m) => m.kind === 'image' && (!m.alt || m.alt.trim() === '')).length;
  if (imagesMissingAlt > 0)
    add('missing-alt-text', 'warning', `${imagesMissingAlt} image(s) missing alt text.`);

  // Open Graph.
  const og = page.meta.openGraph;
  if (!og['og:title'] || !og['og:description'] || !og['og:image'])
    add('incomplete-open-graph', 'info', 'Missing one or more core Open Graph fields (title/description/image).');

  // Structured data.
  if (page.meta.jsonLd.length === 0) add('missing-structured-data', 'info', 'No JSON-LD structured data.');
  else if (page.meta.jsonLd.some((j) => (j as any).__invalid))
    add('invalid-jsonld', 'warning', 'Page contains invalid JSON-LD.');

  // Thin content.
  if (page.wordCount < 120) add('thin-content', 'info', `Only ${page.wordCount} words of body content.`);

  return issues;
}
