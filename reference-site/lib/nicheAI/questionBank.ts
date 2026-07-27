/**
 * Seed question bank for the AI Niche Finder.
 *
 * These are DEFAULTS (like the CMS seed pattern): the assessment renders from
 * these immediately, and the admin can override/extend them in Firestore
 * (collections `questionCategories` + `nicheQuestions`). The engine scores
 * whatever effective set is active.
 *
 * Options carry `dimensions` (feed the user profile) and `categories` (affinity
 * toward niche categories). Covers every supported question type plus a
 * conditional branch.
 */

import type { Question, QuestionCategory } from './types';
import { topicOptions } from './topics';

export const seedCategories: QuestionCategory[] = [
  { id: 'passion', dimension: 'passion', title: 'Passion', description: 'What genuinely energises you.', icon: '🔥', order: 1, enabled: true },
  { id: 'skills', dimension: 'skill', title: 'Skills', description: 'What you are good at.', icon: '🛠️', order: 2, enabled: true },
  { id: 'experience', dimension: 'experience', title: 'Experience', description: 'What you have lived and done.', icon: '🧭', order: 3, enabled: true },
  { id: 'knowledge', dimension: 'knowledge', title: 'Knowledge', description: 'What you know deeply.', icon: '📚', order: 4, enabled: true },
  { id: 'transformation', dimension: 'transformation', title: 'Transformation', description: 'The change you want to create.', icon: '✨', order: 5, enabled: true },
  { id: 'demand', dimension: 'demand', title: 'Market Demand', description: 'How much the market wants this.', icon: '📈', order: 6, enabled: true },
  { id: 'income', dimension: 'income', title: 'Income Goal', description: 'What you want to earn.', icon: '💰', order: 7, enabled: true },
  { id: 'lifestyle', dimension: 'lifestyle', title: 'Lifestyle', description: 'How you want to work and live.', icon: '🌴', order: 8, enabled: true },
  { id: 'audience', dimension: 'audience', title: 'Audience', description: 'Who you want to serve.', icon: '👥', order: 9, enabled: true },
  { id: 'model', dimension: 'model', title: 'Business Model', description: 'How you want to deliver value.', icon: '🏗️', order: 10, enabled: true },
];

// Shorthand for category-affinity maps.
const A = (m: Record<string, number>) => m;

export const seedQuestions: Question[] = [
  // ---- Passion ----
  {
    id: 'passion-topics',
    categoryId: 'passion',
    type: 'multi',
    title: 'Which topics could you talk about for hours?',
    help: 'Search or browse by category and pick everything that genuinely lights you up.',
    min: 1,
    order: 1,
    enabled: true,
    // 250+ topics organised into logical categories (see lib/nicheAI/topics.ts).
    // The grouped/searchable picker activates automatically for grouped options.
    options: topicOptions,
  },
  {
    id: 'passion-energy',
    categoryId: 'passion',
    type: 'scale',
    title: 'How energised do you feel when helping others in your favourite area?',
    help: '1 = drained, 5 = I could do it all day.',
    order: 2,
    enabled: true,
    dimension: 'passion',
    scale: { min: 1, max: 5, minLabel: 'Drained', maxLabel: 'Energised' },
  },

  // ---- Skills ----
  {
    id: 'skills-strong',
    categoryId: 'skills',
    type: 'multiSelect',
    title: 'Which of these are you genuinely strong at?',
    help: 'Search and select all that apply.',
    min: 1,
    order: 1,
    enabled: true,
    options: [
      { value: 'coaching', label: 'Coaching & listening', dimensions: { skill: 4 }, categories: A({ mind: 2, relationships: 2 }) },
      { value: 'teaching', label: 'Teaching & explaining', dimensions: { skill: 4 }, categories: A({ tech: 2, career: 2 }) },
      { value: 'fitness', label: 'Fitness & training', dimensions: { skill: 4 }, categories: A({ health: 4 }) },
      { value: 'writing', label: 'Writing & content', dimensions: { skill: 4 }, categories: A({ creative: 3, business: 2 }) },
      { value: 'sales', label: 'Sales & persuasion', dimensions: { skill: 4 }, categories: A({ business: 3, money: 2 }) },
      { value: 'money', label: 'Money & numbers', dimensions: { skill: 4 }, categories: A({ money: 4 }) },
      { value: 'tech', label: 'Tech & tools', dimensions: { skill: 4 }, categories: A({ tech: 4 }) },
      { value: 'leadership', label: 'Leadership & management', dimensions: { skill: 4 }, categories: A({ career: 3 }) },
      { value: 'creativity', label: 'Design & creativity', dimensions: { skill: 4 }, categories: A({ creative: 4 }) },
    ],
  },
  {
    id: 'skills-confidence',
    categoryId: 'skills',
    type: 'scale',
    title: 'How confident are you teaching your single best skill?',
    order: 2,
    enabled: true,
    dimension: 'skill',
    scale: { min: 1, max: 5, minLabel: 'Beginner', maxLabel: 'Expert' },
  },

  // ---- Experience ----
  {
    id: 'experience-level',
    categoryId: 'experience',
    type: 'single',
    title: 'How much hands-on experience do you have in your top area?',
    order: 1,
    enabled: true,
    options: [
      { value: 'exploring', label: 'Just exploring', hint: 'Learning it myself', dimensions: { experience: 1 } },
      { value: 'some', label: 'Some real experience', hint: 'Helped a few people informally', dimensions: { experience: 3 } },
      { value: 'seasoned', label: 'Seasoned', hint: 'Years of practice / results', dimensions: { experience: 5 } },
      { value: 'pro', label: 'Recognised professional', hint: 'Paid / credentialed', dimensions: { experience: 6, skill: 1 } },
    ],
  },
  {
    id: 'experience-result',
    categoryId: 'experience',
    type: 'text',
    title: 'Describe one result you have helped someone achieve.',
    help: 'Optional — a sentence sharpens your positioning and UVP.',
    required: false,
    order: 2,
    enabled: true,
    placeholder: 'e.g. Helped a friend lose 8kg and keep it off for a year…',
    maxLength: 400,
  },

  // ---- Knowledge ----
  {
    id: 'knowledge-depth',
    categoryId: 'knowledge',
    type: 'scale',
    title: 'How far ahead of a beginner is your knowledge here?',
    help: 'You only need to be a few steps ahead to coach well.',
    order: 1,
    enabled: true,
    dimension: 'knowledge',
    scale: { min: 1, max: 5, minLabel: 'A step ahead', maxLabel: 'Deep expert' },
  },
  {
    id: 'knowledge-tags',
    categoryId: 'knowledge',
    type: 'tags',
    title: 'Add specific topics you know well.',
    help: 'Press Enter to add each tag. These sharpen your niche match.',
    required: false,
    order: 2,
    enabled: true,
    placeholder: 'e.g. habit change, ChatGPT, budgeting…',
    max: 12,
  },

  // ---- Transformation ----
  {
    id: 'transformation-type',
    categoryId: 'transformation',
    type: 'single',
    title: 'What kind of transformation excites you most to create?',
    order: 1,
    enabled: true,
    options: [
      { value: 'physical', label: 'Physical / health change', icon: '💪', categories: A({ health: 4 }), dimensions: { transformation: 3 } },
      { value: 'emotional', label: 'Confidence / emotional change', icon: '🧠', categories: A({ mind: 4, relationships: 2 }), dimensions: { transformation: 3 } },
      { value: 'financial', label: 'Financial change', icon: '💰', categories: A({ money: 4, business: 2 }), dimensions: { transformation: 3 } },
      { value: 'career', label: 'Career / professional change', icon: '📈', categories: A({ career: 4 }), dimensions: { transformation: 3 } },
      { value: 'skill', label: 'New skill / capability', icon: '🛠️', categories: A({ tech: 3, creative: 3 }), dimensions: { transformation: 3 } },
    ],
  },
  {
    id: 'transformation-clarity',
    categoryId: 'transformation',
    type: 'scale',
    title: 'How clearly can you describe the "before → after" you create?',
    order: 2,
    enabled: true,
    dimension: 'transformation',
    scale: { min: 1, max: 5, minLabel: 'Fuzzy', maxLabel: 'Crystal clear' },
  },

  // ---- Market Demand ----
  {
    id: 'demand-priority',
    categoryId: 'demand',
    type: 'single',
    title: 'How much does a proven, high-demand market matter to you?',
    order: 1,
    enabled: true,
    options: [
      { value: 'passion-first', label: 'Passion first', hint: 'I follow interest over market size', dimensions: { demand: 1 } },
      { value: 'balanced', label: 'Balanced', hint: 'Both matter equally', dimensions: { demand: 3 } },
      { value: 'demand-first', label: 'Demand first', hint: 'I want a hungry, proven market', dimensions: { demand: 5 } },
    ],
  },

  // ---- Income Goal ----
  {
    id: 'income-target',
    categoryId: 'income',
    type: 'single',
    title: 'What monthly income are you aiming for from coaching?',
    order: 1,
    enabled: true,
    options: [
      // INR bands pitched at the Indian coaching market. The `value` keys and
      // `dimensions` weights are unchanged, so scoring and any saved answers
      // keep resolving — only the labels are localised.
      { value: 'side', label: 'Up to ₹25,000 / month', hint: 'A meaningful side income', dimensions: { income: 2 } },
      { value: 'replace', label: '₹25,000–₹1,00,000 / month', hint: 'Replace part of my job', dimensions: { income: 4 } },
      { value: 'full', label: '₹1,00,000–₹5,00,000 / month', hint: 'Full-time coaching income', dimensions: { income: 6 } },
      { value: 'scale', label: '₹5,00,000+ / month', hint: 'Scale into a business', dimensions: { income: 8, model: 1 } },
    ],
  },
  {
    id: 'income-levers',
    categoryId: 'income',
    type: 'ranking',
    title: 'Rank what you would prioritise to hit a higher income.',
    help: 'Drag or use the arrows — 1 = most important.',
    order: 2,
    enabled: true,
    showIf: { questionId: 'income-target', includesAny: ['full', 'scale'] },
    options: [
      { value: 'highticket', label: 'High-ticket 1:1 offers', categories: A({ business: 2, money: 1 }) },
      { value: 'group', label: 'Group programs & cohorts', categories: A({ business: 2 }) },
      { value: 'products', label: 'Digital products & courses', categories: A({ tech: 1, creative: 1 }) },
      { value: 'audience', label: 'Big audience & content', categories: A({ creative: 2 }) },
    ],
  },

  // ---- Lifestyle ----
  {
    id: 'lifestyle-shape',
    categoryId: 'lifestyle',
    type: 'multi',
    title: 'What does your ideal coaching lifestyle look like?',
    help: 'Pick the things that matter to you.',
    min: 1,
    order: 1,
    enabled: true,
    options: [
      { value: 'flexible', label: 'Flexible hours', icon: '🕰️', dimensions: { lifestyle: 3 } },
      { value: 'remote', label: 'Fully remote / online', icon: '🌍', dimensions: { lifestyle: 3 }, categories: A({ tech: 1, creative: 1 }) },
      { value: 'scalable', label: 'Scalable (not trading time for money)', icon: '📊', dimensions: { lifestyle: 3, model: 2 }, categories: A({ business: 2 }) },
      { value: 'deep', label: 'Deep 1:1 impact', icon: '🤝', dimensions: { lifestyle: 3 }, categories: A({ mind: 1, relationships: 1 }) },
      { value: 'creative', label: 'Creative & content-led', icon: '🎨', dimensions: { lifestyle: 3 }, categories: A({ creative: 2 }) },
    ],
  },

  // ---- Audience ----
  {
    id: 'audience-who',
    categoryId: 'audience',
    type: 'single',
    title: 'Who do you most want to help?',
    order: 1,
    enabled: true,
    options: [
      { value: 'individuals', label: 'Everyday individuals', icon: '🙂', dimensions: { audience: 4 } },
      { value: 'professionals', label: 'Working professionals', icon: '💼', dimensions: { audience: 4 }, categories: A({ career: 2, business: 1 }) },
      { value: 'businesses', label: 'Business owners', icon: '🏢', dimensions: { audience: 4 }, categories: A({ business: 3, money: 1 }) },
      { value: 'students', label: 'Students & early-career', icon: '🎓', dimensions: { audience: 4 }, categories: A({ career: 1, tech: 1 }) },
      { value: 'parents', label: 'Parents & families', icon: '👨‍👩‍👧', dimensions: { audience: 4 }, categories: A({ relationships: 3, health: 1 }) },
      { value: 'seniors', label: 'Older adults', icon: '🌅', dimensions: { audience: 4 }, categories: A({ health: 2 }) },
    ],
  },
  {
    id: 'audience-channels',
    categoryId: 'audience',
    type: 'multiSelect',
    title: 'Where does your audience already hang out?',
    help: 'Select the channels you could realistically show up on.',
    required: false,
    order: 2,
    enabled: true,
    options: [
      { value: 'instagram', label: 'Instagram', dimensions: { audience: 1 } },
      { value: 'youtube', label: 'YouTube', dimensions: { audience: 1 }, categories: A({ creative: 1 }) },
      { value: 'linkedin', label: 'LinkedIn', dimensions: { audience: 1 }, categories: A({ career: 1, business: 1 }) },
      { value: 'tiktok', label: 'TikTok / Reels', dimensions: { audience: 1 }, categories: A({ creative: 1 }) },
      { value: 'newsletter', label: 'Email / newsletter', dimensions: { audience: 1 } },
      { value: 'community', label: 'Communities / forums', dimensions: { audience: 1 } },
    ],
  },

  // ---- Business Model ----
  {
    id: 'model-delivery',
    categoryId: 'model',
    type: 'multi',
    title: 'How would you most like to deliver your coaching?',
    min: 1,
    order: 1,
    enabled: true,
    options: [
      { value: 'one-to-one', label: '1:1 coaching', icon: '🤝', dimensions: { model: 3 } },
      { value: 'group', label: 'Group programs', icon: '👥', dimensions: { model: 3 }, categories: A({ business: 1 }) },
      { value: 'course', label: 'Online courses', icon: '🎥', dimensions: { model: 3 }, categories: A({ tech: 1, creative: 1 }) },
      { value: 'community', label: 'Membership community', icon: '🌐', dimensions: { model: 3 }, categories: A({ business: 1 }) },
      { value: 'content', label: 'Content & audience', icon: '✍️', dimensions: { model: 3 }, categories: A({ creative: 2 }) },
    ],
  },
  {
    id: 'model-readiness',
    categoryId: 'model',
    type: 'scale',
    title: 'How ready are you to confidently sell and charge for your help?',
    order: 2,
    enabled: true,
    dimension: 'model',
    scale: { min: 1, max: 5, minLabel: 'Not yet', maxLabel: 'Ready now' },
  },
];
