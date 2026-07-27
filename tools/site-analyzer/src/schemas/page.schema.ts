import { z } from 'zod';
import { FormSchema } from './form.schema';
import { ComponentInstanceSchema } from './component.schema';

export const HeadingSchema = z.object({
  level: z.number().int().min(1).max(6),
  text: z.string(),
});

export const LinkSchema = z.object({
  href: z.string(),
  normalized: z.string().nullable(),
  text: z.string(),
  rel: z.string().nullable(),
  target: z.string().nullable(),
});

export const ButtonSchema = z.object({
  text: z.string(),
  tag: z.string(), // button | a | [role=button]
  role: z.string().nullable(),
  ariaLabel: z.string().nullable(),
  href: z.string().nullable(),
  target: z.string().nullable(),
  disabled: z.boolean(),
  visible: z.boolean(),
  section: z.string().nullable(),
  /** Inferred, non-destructive classification of what the control does. */
  actionType: z.string(),
  /** What it likely opens: modal | dropdown | accordion | route | external | none */
  opens: z.string().nullable(),
});

export const MediaSchema = z.object({
  kind: z.string(), // image | video | iframe | svg | background
  src: z.string().nullable(),
  resolvedSrc: z.string().nullable(),
  alt: z.string().nullable(),
  title: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  aspectRatio: z.number().nullable(),
  mime: z.string().nullable(),
  lazy: z.boolean(),
  section: z.string().nullable(),
  provider: z.string().nullable(), // youtube | vimeo | ...
  hash: z.string().nullable(),
});

export const SectionSchema = z.object({
  index: z.number().int(),
  type: z.string(),
  heading: z.string().nullable(),
  subheading: z.string().nullable(),
  summary: z.string(),
  ctas: z.array(z.string()).default([]),
  buttons: z.array(z.string()).default([]),
  links: z.array(z.string()).default([]),
  imageRefs: z.array(z.string()).default([]),
  backgroundStyle: z.string().nullable(),
  layoutType: z.string().nullable(),
  columns: z.number().nullable(),
  cardCount: z.number().nullable(),
  hasForm: z.boolean(),
  position: z.number().nullable(), // vertical offset in px
});

export const MetaSchema = z.object({
  description: z.string().nullable(),
  keywords: z.string().nullable(),
  robots: z.string().nullable(),
  viewport: z.string().nullable(),
  charset: z.string().nullable(),
  language: z.string().nullable(),
  openGraph: z.record(z.string()).default({}),
  twitter: z.record(z.string()).default({}),
  jsonLd: z.array(z.record(z.any())).default([]),
});

export const ScreenshotSetSchema = z.object({
  desktop: z.string().nullable(),
  desktopAboveFold: z.string().nullable(),
  tablet: z.string().nullable(),
  mobile: z.string().nullable(),
});

export const SeoIssueSchema = z.object({
  code: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string(),
});

export const PageSchema = z.object({
  url: z.string(),
  normalizedUrl: z.string(),
  canonicalUrl: z.string().nullable(),
  finalUrl: z.string(),
  statusCode: z.number(),
  redirectChain: z.array(z.string()).default([]),

  title: z.string().nullable(),
  meta: MetaSchema,

  pageType: z.string(),
  depth: z.number().int(),
  discoveredFrom: z.string(),

  headings: z.array(HeadingSchema),
  breadcrumbs: z.array(z.string()).default([]),

  mainNav: z.array(LinkSchema).default([]),
  footerNav: z.array(LinkSchema).default([]),

  sections: z.array(SectionSchema),
  contentSummary: z.string(),
  wordCount: z.number(),

  internalLinks: z.array(z.string()).default([]),
  externalLinks: z.array(z.string()).default([]),
  socialLinks: z.array(z.string()).default([]),
  downloadLinks: z.array(z.string()).default([]),

  buttons: z.array(ButtonSchema).default([]),
  forms: z.array(FormSchema).default([]),
  media: z.array(MediaSchema).default([]),
  components: z.array(ComponentInstanceSchema).default([]),

  // Structural feature flags detected on the page.
  features: z.object({
    hasSearch: z.boolean(),
    hasPagination: z.boolean(),
    hasTabs: z.boolean(),
    hasAccordion: z.boolean(),
    hasCarousel: z.boolean(),
    hasModal: z.boolean(),
    hasCookieBanner: z.boolean(),
    hasVideo: z.boolean(),
    hasTable: z.boolean(),
    hasTestimonials: z.boolean(),
    hasPricing: z.boolean(),
    hasFaq: z.boolean(),
    hasNewsletter: z.boolean(),
  }),

  // De-dup fingerprints.
  textSimHash: z.string(),
  structureHash: z.string(),

  screenshots: ScreenshotSetSchema,
  seoIssues: z.array(SeoIssueSchema).default([]),

  crawledAt: z.string(),
  renderMs: z.number(),
});

export type Page = z.infer<typeof PageSchema>;
export type ScreenshotSet = z.infer<typeof ScreenshotSetSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type PageButton = z.infer<typeof ButtonSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type PageLink = z.infer<typeof LinkSchema>;
export type Heading = z.infer<typeof HeadingSchema>;
export type SeoIssue = z.infer<typeof SeoIssueSchema>;
export type PageMeta = z.infer<typeof MetaSchema>;
