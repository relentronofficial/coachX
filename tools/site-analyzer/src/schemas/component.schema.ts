import { z } from 'zod';

/** A design-token snapshot captured from computed styles of a sample element. */
export const StyleSnapshotSchema = z.object({
  color: z.string().nullable(),
  backgroundColor: z.string().nullable(),
  fontFamily: z.string().nullable(),
  fontSize: z.string().nullable(),
  fontWeight: z.string().nullable(),
  lineHeight: z.string().nullable(),
  letterSpacing: z.string().nullable(),
  borderRadius: z.string().nullable(),
  boxShadow: z.string().nullable(),
  padding: z.string().nullable(),
  height: z.string().nullable(),
});
export type StyleSnapshot = z.infer<typeof StyleSnapshotSchema>;

export const ComponentInstanceSchema = z.object({
  /** Canonical component name, e.g. "CTA Button", "Feature Card". */
  name: z.string(),
  /** Page (normalized URL) where this instance was found. */
  page: z.string(),
  selector: z.string(),
  text: z.string().nullable(),
  variant: z.string().nullable(),
  style: StyleSnapshotSchema.partial().nullable(),
  screenshotCrop: z.string().nullable(),
});
export type ComponentInstance = z.infer<typeof ComponentInstanceSchema>;

/** Aggregated component across all pages (produced by featureAnalyzer). */
export const ComponentSummarySchema = z.object({
  name: z.string(),
  count: z.number(),
  pages: z.array(z.string()),
  variants: z.array(z.string()),
  sampleText: z.array(z.string()),
  representativeStyle: StyleSnapshotSchema.partial().nullable(),
});
export type ComponentSummary = z.infer<typeof ComponentSummarySchema>;
