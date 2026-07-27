import type { CheerioAPI, Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import { collapseWhitespace, safeExcerpt } from '../utils/sanitize';
import type { FormData, FormField } from '../schemas/form.schema';

/** Find a label for a field via for=, wrapping <label>, or aria-label. */
function findLabel($: CheerioAPI, $field: Cheerio<Element>): string | null {
  const id = $field.attr('id');
  if (id) {
    const byFor = $(`label[for="${cssEscape(id)}"]`).first();
    if (byFor.length) return collapseWhitespace(byFor.text());
  }
  const wrapping = $field.closest('label');
  if (wrapping.length) return collapseWhitespace(wrapping.clone().children().remove().end().text());
  const aria = $field.attr('aria-label');
  if (aria) return collapseWhitespace(aria);
  const labelledby = $field.attr('aria-labelledby');
  if (labelledby) {
    const ref = $(`#${cssEscape(labelledby)}`).first();
    if (ref.length) return collapseWhitespace(ref.text());
  }
  return null;
}

function cssEscape(v: string): string {
  return v.replace(/["\\]/g, '\\$&');
}

function inferPurpose($form: Cheerio<Element>, fields: FormField[]): string {
  const hay = (
    ($form.attr('id') ?? '') +
    ' ' +
    ($form.attr('class') ?? '') +
    ' ' +
    ($form.attr('name') ?? '') +
    ' ' +
    ($form.attr('action') ?? '') +
    ' ' +
    fields.map((f) => `${f.name ?? ''} ${f.type ?? ''} ${f.label ?? ''}`).join(' ')
  ).toLowerCase();

  if (/search|query|\bq\b/.test(hay)) return 'search';
  if (/subscribe|newsletter|signup|opt.?in|email.?list/.test(hay)) return 'newsletter';
  if (/contact|message|enquir|inquir/.test(hay)) return 'contact';
  if (/register|create.?account/.test(hay)) return 'registration';
  if (/login|sign.?in/.test(hay)) return 'login';
  if (/book|reserve|seat|masterclass|webinar|register.?event/.test(hay)) return 'event-registration';
  if (fields.some((f) => f.type === 'email')) return 'lead-capture';
  return 'unknown';
}

function detectCaptcha($: CheerioAPI, $form: Cheerio<Element>): { has: boolean; type: string | null } {
  const html = $.html($form).toLowerCase();
  if (/g-recaptcha|recaptcha/.test(html)) return { has: true, type: 'reCAPTCHA' };
  if (/h-?captcha/.test(html)) return { has: true, type: 'hCaptcha' };
  if (/turnstile/.test(html)) return { has: true, type: 'Cloudflare Turnstile' };
  return { has: false, type: null };
}

/**
 * Extract every form's STRUCTURE (never any entered values). We read labels,
 * types, placeholders, required flags and visible option labels only.
 */
export function extractForms($: CheerioAPI): FormData[] {
  const forms: FormData[] = [];

  $('form').each((_, formEl) => {
    const $form = $(formEl);
    const fields: FormField[] = [];

    $form.find('input, select, textarea').each((_, fieldEl) => {
      const $field = $(fieldEl);
      const tag = fieldEl.tagName.toLowerCase();
      const type = tag === 'input' ? ($field.attr('type') ?? 'text') : tag === 'select' ? 'select' : 'textarea';
      if (type === 'hidden') return; // structural, not user-facing

      // Option labels for selects, radios and checkboxes (labels only — no values kept as PII).
      const options: string[] = [];
      if (tag === 'select') {
        $field.find('option').each((_, o) => {
          const t = collapseWhitespace($(o).text());
          if (t) options.push(t.slice(0, 60));
        });
      }

      fields.push({
        tag,
        type,
        name: $field.attr('name') ?? null,
        id: $field.attr('id') ?? null,
        label: findLabel($, $field),
        placeholder: $field.attr('placeholder') ?? null,
        required: $field.attr('required') !== undefined || $field.attr('aria-required') === 'true',
        disabled: $field.attr('disabled') !== undefined,
        autocomplete: $field.attr('autocomplete') ?? null,
        options,
      });
    });

    const buttonLabels: string[] = [];
    $form.find('button, input[type="submit"], input[type="button"]').each((_, b) => {
      const $b = $(b);
      const label = collapseWhitespace($b.text()) || $b.attr('value') || $b.attr('aria-label') || '';
      if (label) buttonLabels.push(label.slice(0, 60));
    });

    const captcha = detectCaptcha($, $form);
    const consent = $form
      .find('*')
      .filter((_, el) => /consent|privacy|agree|terms|gdpr/i.test($(el).text()))
      .first();

    const visibleValidation: string[] = [];
    fields.forEach((f) => {
      if (f.required && f.label) visibleValidation.push(`${f.label}: required`);
    });
    $form.find('[data-error], .error-message, .invalid-feedback').each((_, e) => {
      const t = collapseWhitespace($(e).text());
      if (t) visibleValidation.push(t.slice(0, 80));
    });

    forms.push({
      purpose: inferPurpose($form, fields),
      name: $form.attr('name') ?? $form.attr('id') ?? null,
      method: ($form.attr('method') ?? 'get').toUpperCase(),
      action: $form.attr('action') ?? null,
      fields,
      buttonLabels,
      consentText: consent.length ? safeExcerpt(consent.text(), 200) : null,
      hasCaptcha: captcha.has,
      captchaType: captcha.type,
      visibleValidation: [...new Set(visibleValidation)],
    });
  });

  return forms;
}
