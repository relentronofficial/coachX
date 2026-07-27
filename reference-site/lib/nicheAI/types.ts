/**
 * Enterprise AI Niche Finder — shared domain model.
 *
 * Everything here is ORIGINAL to CoachX. The product experience (assessment →
 * intelligence analysis → premium result dashboard) is functionally inspired by
 * publicly observed niche-finder tools, but all taxonomy, questions, scoring,
 * report templates and copy are our own. No branding, copy, or private content
 * from any third party is reproduced.
 *
 * This file is the single source of truth for types shared by the engine, the
 * Firestore layer, the assessment UI and the admin panel.
 */

// ---------------------------------------------------------------------------
// Scoring dimensions — one per question category (10 total).
// ---------------------------------------------------------------------------

export type Dimension =
  | 'passion'
  | 'skill'
  | 'experience'
  | 'knowledge'
  | 'transformation'
  | 'demand'
  | 'income'
  | 'lifestyle'
  | 'audience'
  | 'model';

export const DIMENSIONS: { id: Dimension; label: string }[] = [
  { id: 'passion', label: 'Passion' },
  { id: 'skill', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'transformation', label: 'Transformation' },
  { id: 'demand', label: 'Market Demand' },
  { id: 'income', label: 'Income Goal' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'audience', label: 'Audience' },
  { id: 'model', label: 'Business Model' },
];

// ---------------------------------------------------------------------------
// Question categories & questions (admin-editable, persisted to Firestore).
// ---------------------------------------------------------------------------

export type QuestionType =
  | 'single' // one choice (radio)
  | 'multi' // several choices (checkbox)
  | 'scale' // 1–N rating
  | 'ranking' // priority ordering
  | 'text' // free text
  | 'tags' // free-form tag chips
  | 'multiSelect'; // searchable multi-pick

export interface QuestionCategory {
  id: string;
  /** The scoring dimension this category feeds. */
  dimension: Dimension;
  title: string;
  description: string;
  icon: string;
  order: number;
  enabled: boolean;
}

export interface QuestionOption {
  value: string;
  label: string;
  hint?: string;
  icon?: string;
  /** Optional category grouping — enables the searchable, grouped picker UI. */
  group?: string;
  /** Points this option adds to scoring dimensions. */
  dimensions?: Partial<Record<Dimension, number>>;
  /** Affinity weight this option adds toward specific niche ids. */
  niches?: Record<string, number>;
  /** Coarser affinity toward whole niche categories (see knowledgeBase). */
  categories?: Record<string, number>;
}

/** Show this question only when a prior answer matches — conditional/branching. */
export interface ShowIf {
  questionId: string;
  /** Answer equals this value (single/scale). */
  equals?: string | number;
  /** Answer array/tags include ANY of these values (multi/tags/multiSelect). */
  includesAny?: string[];
}

export interface Question {
  id: string;
  categoryId: string;
  type: QuestionType;
  title: string;
  help?: string;
  /** Defaults to true; text/tags are optional unless set true. */
  required?: boolean;
  order: number;
  enabled: boolean;
  /** Minimum selections for multi / multiSelect / ranking / tags. */
  min?: number;
  max?: number;
  options?: QuestionOption[];
  scale?: { min: number; max: number; minLabel: string; maxLabel: string; step?: number };
  /** For scale questions: the dimension the numeric value feeds. */
  dimension?: Dimension;
  placeholder?: string;
  maxLength?: number;
  /** Conditional display / dynamic branching. */
  showIf?: ShowIf;
}

// ---------------------------------------------------------------------------
// Answers.
// ---------------------------------------------------------------------------

export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue>;

/** Persisted in-progress attempt (autosave / resume). Firestore: nicheAnswers. */
export interface NicheAttempt {
  id: string;
  uid: string;
  answers: Answers;
  stepIndex: number;
  status: 'in-progress' | 'completed';
  updatedAt: unknown;
  createdAt: unknown;
}

// ---------------------------------------------------------------------------
// Analysis output — the 24 intelligence fields.
// ---------------------------------------------------------------------------

export type Level = 'Low' | 'Medium' | 'High' | 'Very High';

export interface NicheRecommendation {
  nicheId: string;
  categoryId: string;
  title: string;
  categoryName: string;
  tagline: string;
  summary: string;
  subNiches: string[];

  // Scores (0–100 unless noted).
  nicheScore: number;
  confidenceScore: number;
  profitabilityScore: number;
  passionScore: number;
  skillMatch: number;
  demandScore: number;
  competitionLevel: Level;
  competitionScore: number; // 0–100 (higher = more competitive)
  difficultyLevel: Level;
  difficultyScore: number;

  revenuePotential: { low: number; high: number; label: string; note: string };

  /** Explainability: how each factor contributed to the niche score. */
  scoreBreakdown: { label: string; value: number; weight: number; contribution: number }[];

  // Qualitative intelligence.
  targetAudience: string;
  positioning: string;
  uvp: string;
  businessOpportunities: string[];
  contentPillars: string[];
  offerIdeas: string[];
  productIdeas: string[];
  communityIdeas: string[];
  pricingSuggestions: string[];
  marketingSuggestions: string[];
  funnelRecommendation: string[];
  growthRoadmap: { phase: string; focus: string }[];
  actionPlan90Day: { window: string; goal: string; steps: string[] }[];

  strengths: string[];
  weaknesses: string[];
}

/**
 * Per-question audit trail captured during the assessment — ADMIN ONLY.
 * Records exactly what was shown, what was answered, and when.
 */
export interface AnswerLog {
  id: string;
  title: string;
  type: QuestionType;
  categoryId: string;
  categoryTitle: string;
  answer: AnswerValue | null;
  answerLabels: string[];
  answeredAt: string | null;
}

/** Session metadata captured for the admin (never shown to the user). */
export interface NicheSession {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: 'completed';
  user: { uid: string | null; email: string | null; name: string | null };
  questionsShown: AnswerLog[];
}

/** Full analysis. Firestore: nicheResults. */
export interface AnalysisResult {
  id: string;
  uid: string | null;
  createdAt: unknown;

  /** Admin-only session/audit trail (start/end/duration, per-question log). */
  session?: NicheSession;

  /** Overall headline score for the top recommendation. */
  headlineScore: number;
  headlineConfidence: number;
  summary: string;

  /** Top 5 recommendations, best first. */
  recommendations: NicheRecommendation[];

  /** Per-dimension user profile (0–100), for the radar chart. */
  profile: Record<Dimension, number>;

  /** Cross-cutting AI insight bullets. */
  insights: string[];
  /** Immediate next action steps. */
  actionSteps: string[];

  /** Signals for the UI (weak input, offline fallback, etc.). */
  meta: { weak: boolean; answered: number; engine: 'coachx-intelligence' | 'coachx-intelligence-offline' };
}

/** Saved report metadata. Firestore: reports. */
export interface SavedReport {
  id: string;
  uid: string;
  resultId: string;
  topNiche: string;
  headlineScore: number;
  favourite: boolean;
  createdAt: unknown;
}

/** Tunable scoring weights (admin-editable via settings). */
export interface ScoringWeights {
  match: number;
  passion: number;
  skill: number;
  profitability: number;
  demand: number;
  competition: number;
  difficultyPenalty: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  match: 0.28,
  passion: 0.16,
  skill: 0.16,
  profitability: 0.14,
  demand: 0.14,
  competition: 0.12,
  difficultyPenalty: 0.1,
};

/** App/engine settings. Firestore: settings/nicheFinder. */
export interface NicheSettings {
  weights: ScoringWeights;
  promptTemplate: string;
  emailOnComplete: boolean;
  remindersEnabled: boolean;
  passThreshold: number;
}

export const DEFAULT_SETTINGS: NicheSettings = {
  weights: DEFAULT_WEIGHTS,
  promptTemplate:
    'You are the CoachX niche strategist. Given the user profile {{profile}} and top niche {{niche}}, produce positioning, UVP, offers and a 90-day plan in an encouraging, concrete voice.',
  emailOnComplete: false,
  remindersEnabled: true,
  passThreshold: 60,
};

export const ATTEMPT_STORAGE_KEY = 'cx-niche-ai-attempt';
