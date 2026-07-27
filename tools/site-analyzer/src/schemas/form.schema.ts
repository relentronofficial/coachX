import { z } from 'zod';

export const FormFieldSchema = z.object({
  tag: z.string(), // input | select | textarea
  type: z.string().nullable(), // text | email | checkbox | radio | ...
  name: z.string().nullable(),
  id: z.string().nullable(),
  label: z.string().nullable(),
  placeholder: z.string().nullable(),
  required: z.boolean(),
  disabled: z.boolean(),
  autocomplete: z.string().nullable(),
  /** Visible options for selects / radio groups / checkboxes (labels only). */
  options: z.array(z.string()).default([]),
});
export type FormField = z.infer<typeof FormFieldSchema>;

export const FormSchema = z.object({
  /** Inferred human-readable purpose (newsletter, contact, search, ...). */
  purpose: z.string(),
  name: z.string().nullable(),
  method: z.string(),
  /** Action URL when safely visible; null if obscured/JS-handled. */
  action: z.string().nullable(),
  fields: z.array(FormFieldSchema),
  buttonLabels: z.array(z.string()),
  /** Consent / privacy text shown near the form (short excerpt). */
  consentText: z.string().nullable(),
  hasCaptcha: z.boolean(),
  captchaType: z.string().nullable(),
  /** Validation hints visible WITHOUT submitting (required markers, patterns). */
  visibleValidation: z.array(z.string()).default([]),
});
export type FormData = z.infer<typeof FormSchema>;
