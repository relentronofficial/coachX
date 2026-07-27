import type { Page } from '../schemas/page.schema';
import type { RouteNode, RouteGraph } from '../schemas/site.schema';

/** Derive the parent route of a path (one segment up). */
function parentOf(normalizedUrl: string): string | null {
  try {
    const u = new URL(normalizedUrl);
    const seg = u.pathname.split('/').filter(Boolean);
    if (seg.length === 0) return null;
    seg.pop();
    return u.origin + '/' + seg.join('/');
  } catch {
    return null;
  }
}

/**
 * Build the public route map: incoming/outgoing link counts, parent routes,
 * page types and duplicate fingerprints, plus a node/edge route graph.
 */
export function analyzeRoutes(pages: Page[]): { routes: RouteNode[]; graph: RouteGraph } {
  const urlSet = new Set(pages.map((p) => p.normalizedUrl));
  const incoming = new Map<string, number>();
  const edges: { from: string; to: string }[] = [];

  for (const p of pages) {
    for (const link of p.internalLinks) {
      if (link === p.normalizedUrl) continue;
      if (urlSet.has(link)) {
        incoming.set(link, (incoming.get(link) ?? 0) + 1);
        edges.push({ from: p.normalizedUrl, to: link });
      }
    }
  }

  const routes: RouteNode[] = pages.map((p) => {
    let parent = parentOf(p.normalizedUrl);
    if (parent && !urlSet.has(parent)) {
      // Fall back to origin root if the computed parent wasn't crawled.
      try {
        parent = new URL(p.normalizedUrl).origin + '/';
      } catch {
        parent = null;
      }
      if (parent === p.normalizedUrl) parent = null;
    }
    return {
      url: p.normalizedUrl,
      title: p.title,
      parent: parent === p.normalizedUrl ? null : parent,
      discoveredFrom: p.discoveredFrom,
      depth: p.depth,
      incomingLinks: incoming.get(p.normalizedUrl) ?? 0,
      outgoingInternalLinks: p.internalLinks.filter((l) => urlSet.has(l)).length,
      pageType: p.pageType,
      statusCode: p.statusCode,
      redirects: p.redirectChain,
      canonical: p.canonicalUrl,
      duplicateFingerprint: p.structureHash,
    };
  });

  // De-duplicate edges.
  const edgeKey = new Set<string>();
  const uniqueEdges = edges.filter((e) => {
    const k = e.from + '->' + e.to;
    if (edgeKey.has(k)) return false;
    edgeKey.add(k);
    return true;
  });

  const graph: RouteGraph = {
    nodes: pages.map((p) => ({ id: p.normalizedUrl, title: p.title, pageType: p.pageType, depth: p.depth })),
    edges: uniqueEdges,
  };

  return { routes, graph };
}

/** Identify orphan pages (crawled but with zero incoming internal links). */
export function findOrphans(routes: RouteNode[]): string[] {
  return routes.filter((r) => r.incomingLinks === 0 && r.depth > 0).map((r) => r.url);
}
