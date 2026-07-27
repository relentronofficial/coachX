import { z } from 'zod';
import { PageSchema } from './page.schema';
import { ComponentSummarySchema } from './component.schema';

export const RouteNodeSchema = z.object({
  url: z.string(),
  title: z.string().nullable(),
  parent: z.string().nullable(),
  discoveredFrom: z.string(),
  depth: z.number(),
  incomingLinks: z.number(),
  outgoingInternalLinks: z.number(),
  pageType: z.string(),
  statusCode: z.number(),
  redirects: z.array(z.string()),
  canonical: z.string().nullable(),
  duplicateFingerprint: z.string(),
});
export type RouteNode = z.infer<typeof RouteNodeSchema>;

export const RouteGraphSchema = z.object({
  nodes: z.array(z.object({ id: z.string(), title: z.string().nullable(), pageType: z.string(), depth: z.number() })),
  edges: z.array(z.object({ from: z.string(), to: z.string() })),
});
export type RouteGraph = z.infer<typeof RouteGraphSchema>;

export const WorkflowStepSchema = z.object({
  order: z.number(),
  route: z.string(),
  action: z.string(),
  elements: z.array(z.string()),
});

export const WorkflowSchema = z.object({
  name: z.string(),
  startRoute: z.string(),
  confidence: z.enum([
    'verified',
    'partially-verified',
    'inferred-from-ui',
    'authentication-required',
    'not-publicly-accessible',
  ]),
  steps: z.array(WorkflowStepSchema),
  branches: z.array(z.string()).default([]),
  resultRoute: z.string().nullable(),
  validationBehaviour: z.string().nullable(),
  authenticationBoundary: z.string().nullable(),
  mobileBehaviour: z.string().nullable(),
  relatedRoutes: z.array(z.string()).default([]),
  notes: z.string().nullable(),
});
export type Workflow = z.infer<typeof WorkflowSchema>;

export const DesignSystemSchema = z.object({
  colors: z.object({
    primary: z.array(z.string()),
    secondary: z.array(z.string()),
    neutral: z.array(z.string()),
    background: z.array(z.string()),
    border: z.array(z.string()),
    all: z.array(z.object({ value: z.string(), count: z.number() })),
  }),
  typography: z.object({
    fontFamilies: z.array(z.object({ value: z.string(), count: z.number() })),
    fontSizes: z.array(z.object({ value: z.string(), count: z.number() })),
    fontWeights: z.array(z.object({ value: z.string(), count: z.number() })),
    lineHeights: z.array(z.object({ value: z.string(), count: z.number() })),
    letterSpacings: z.array(z.object({ value: z.string(), count: z.number() })),
  }),
  radii: z.array(z.object({ value: z.string(), count: z.number() })),
  shadows: z.array(z.object({ value: z.string(), count: z.number() })),
  spacing: z.array(z.object({ value: z.string(), count: z.number() })),
  controls: z.object({
    buttonHeights: z.array(z.string()),
    inputHeights: z.array(z.string()),
    containerWidths: z.array(z.string()),
  }),
  breakpointsInferred: z.array(z.string()),
});
export type DesignSystem = z.infer<typeof DesignSystemSchema>;

export const DuplicateGroupSchema = z.object({
  kind: z.enum(['exact', 'near', 'param-variant', 'alternate-canonical', 'empty', 'soft-404']),
  fingerprint: z.string(),
  urls: z.array(z.string()),
  note: z.string().nullable(),
});
export type DuplicateGroup = z.infer<typeof DuplicateGroupSchema>;

export const AccessibilityIssueSchema = z.object({
  url: z.string(),
  id: z.string(),
  impact: z.string().nullable(),
  description: z.string(),
  help: z.string(),
  nodes: z.number(),
  sampleTarget: z.string().nullable(),
});
export type AccessibilityIssue = z.infer<typeof AccessibilityIssueSchema>;

export const BrokenLinkSchema = z.object({
  source: z.string(),
  target: z.string(),
  status: z.number(),
  redirectChain: z.array(z.string()),
  broken: z.boolean(),
  type: z.enum(['internal', 'external']),
});
export type BrokenLink = z.infer<typeof BrokenLinkSchema>;

/** The top-level assembled site report. */
export const SiteReportSchema = z.object({
  target: z.string(),
  generatedAt: z.string(),
  crawler: z.object({
    userAgent: z.string(),
    respectedRobots: z.boolean(),
    pagesCrawled: z.number(),
    pagesSkipped: z.number(),
  }),
  rendering: z.object({
    model: z.string(),
    notes: z.string(),
  }),
  pages: z.array(PageSchema),
  routes: z.array(RouteNodeSchema),
  routeGraph: RouteGraphSchema,
  components: z.array(ComponentSummarySchema),
  designSystem: DesignSystemSchema,
  workflows: z.array(WorkflowSchema),
  duplicates: z.array(DuplicateGroupSchema),
  accessibility: z.array(AccessibilityIssueSchema),
  brokenLinks: z.array(BrokenLinkSchema),
  seoSummary: z.record(z.any()),
});
export type SiteReport = z.infer<typeof SiteReportSchema>;
