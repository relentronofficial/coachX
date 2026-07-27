/**
 * Shared type model for the CoachX assessment tools.
 *
 * All tool content (questions, scoring, report templates) is ORIGINAL to
 * CoachX. Where a tool mirrors a product category seen (but gated) on the
 * reference site, `origin` is 'original-equivalent'; the publicly interactive
 * Niche Finder is 'public-observed'.
 */

export type QuestionType = 'single' | 'multi' | 'scale' | 'text';

export interface Option {
  value: string;
  label: string;
  hint?: string;
  icon?: string;
  /** Points this option contributes to named scoring dimensions. */
  scores?: Record<string, number>;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  help?: string;
  /** Defaults to true. Text steps are optional unless set true explicitly. */
  required?: boolean;
  /** Minimum selections for `multi`. */
  min?: number;
  options?: Option[];
  scale?: { min: number; max: number; minLabel: string; maxLabel: string; step?: number };
  /** For `scale`: the dimension its value feeds. */
  dimension?: string;
  placeholder?: string;
  maxLength?: number;
}

export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue>;

export interface Dimension {
  id: string;
  label: string;
}

/** Discriminated result payloads rendered by the shared ResultView. */
export type ResultData =
  | {
      kind: 'persona';
      title: string;
      tagline: string;
      blurb: string;
      traits: { label: string; value: number }[];
      strengths: string[];
      watchouts: string[];
      recommendations: string[];
    }
  | {
      kind: 'scorecard';
      overall: number;
      level: string;
      levelBlurb: string;
      dimensions: { id: string; label: string; score: number }[];
      strengths: string[];
      gaps: string[];
      recommendations: string[];
    }
  | {
      kind: 'blueprint';
      overall: number;
      readiness: string;
      pillars: { id: string; label: string; score: number; note: string }[];
      actions: string[];
    }
  | {
      kind: 'challenge';
      completed: number;
      total: number;
      percent: number;
      level: string;
      blurb: string;
      nextSteps: string[];
    };

export interface ToolConfig {
  slug: string;
  name: string;
  category: string;
  icon: string;
  tagline: string;
  description: string;
  origin: 'public-observed' | 'original-equivalent';
  estMinutes: number;
  start: { headline: string; sub: string; bullets: string[] };
  dimensions?: Dimension[];
  steps: Question[];
  /** Pure, deterministic scoring → typed result. Unit-tested. */
  score: (answers: Answers) => ResultData;
}

export const storageKey = (slug: string) => `cx-tool-${slug}`;
