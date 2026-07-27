/**
 * Niche Finder data model + question flow.
 *
 * ORIGINAL taxonomy and copy written for the CoachX brand. It is *functionally*
 * inspired by the publicly observed Niche Finder workflow on the reference site
 * (input → match → ranked niche categories with sub-niches), but no wording,
 * data, or private/member content is copied. Generic category names (health,
 * money, career, …) are a functional taxonomy, not protected expression.
 */

export type Audience =
  | 'individuals'
  | 'professionals'
  | 'businesses'
  | 'students'
  | 'parents'
  | 'seniors';

export type Delivery = 'one-to-one' | 'group' | 'course' | 'community' | 'content';

export type Goal = 'replace-income' | 'side-income' | 'scale' | 'authority';

export interface NicheCategory {
  id: string;
  name: string;
  blurb: string;
  icon: string;
}

export interface Niche {
  id: string;
  categoryId: string;
  title: string;
  blurb: string;
  subNiches: string[];
  audiences: Audience[];
  deliveries: Delivery[];
  keywords: string[];
  /** Rough demand signal 1–5 (original editorial estimate, not scraped data). */
  demand: number;
}

export const categories: NicheCategory[] = [
  { id: 'health', name: 'Health & Longevity', blurb: 'Fitness, nutrition, wellness and healthy-ageing coaching.', icon: '🌿' },
  { id: 'mind', name: 'Mind & Emotional Fitness', blurb: 'Mindset, confidence, stress and emotional resilience.', icon: '🧠' },
  { id: 'relationships', name: 'Relationships & Family', blurb: 'Dating, marriage, parenting and family dynamics.', icon: '💞' },
  { id: 'money', name: 'Money & Wealth', blurb: 'Personal finance, investing and financial freedom.', icon: '💰' },
  { id: 'career', name: 'Career & Work', blurb: 'Career growth, transitions, leadership and interviews.', icon: '📈' },
  { id: 'business', name: 'Business & Marketing', blurb: 'Coaching, courses, marketing and online business.', icon: '🚀' },
  { id: 'tech', name: 'Tech & AI', blurb: 'AI tools, automation and practical digital skills.', icon: '🤖' },
  { id: 'creative', name: 'Creative & Lifestyle', blurb: 'Content, creativity, productivity and lifestyle design.', icon: '🎨' },
];

export const niches: Niche[] = [
  // Health
  { id: 'fitness', categoryId: 'health', title: 'Fitness & Movement', blurb: 'Help people get stronger and move better with sustainable routines.', subNiches: ['Home workouts', 'Strength training', 'Mobility', 'Post-injury fitness'], audiences: ['individuals', 'professionals', 'seniors'], deliveries: ['one-to-one', 'group', 'course', 'content'], keywords: ['fitness', 'gym', 'workout', 'strength', 'training', 'exercise', 'movement', 'yoga'], demand: 5 },
  { id: 'nutrition', categoryId: 'health', title: 'Nutrition & Habits', blurb: 'Coach realistic eating habits and lasting energy.', subNiches: ['Weight management', 'Plant-based', 'Gut health', 'Sports nutrition'], audiences: ['individuals', 'parents', 'professionals'], deliveries: ['one-to-one', 'course', 'community'], keywords: ['nutrition', 'diet', 'food', 'weight', 'health', 'habits', 'eating'], demand: 5 },
  { id: 'longevity', categoryId: 'health', title: 'Healthy Ageing', blurb: 'Support energy, mobility and vitality later in life.', subNiches: ['Active ageing', 'Menopause wellness', 'Sleep', 'Chronic-condition lifestyle'], audiences: ['seniors', 'individuals'], deliveries: ['one-to-one', 'group', 'course'], keywords: ['longevity', 'ageing', 'sleep', 'wellness', 'energy', 'menopause'], demand: 4 },

  // Mind
  { id: 'mindset', categoryId: 'mind', title: 'Mindset & Confidence', blurb: 'Help people build self-belief and take action.', subNiches: ['Confidence', 'Overcoming self-doubt', 'Public speaking nerves', 'Goal setting'], audiences: ['individuals', 'professionals', 'students'], deliveries: ['one-to-one', 'group', 'course', 'content'], keywords: ['mindset', 'confidence', 'motivation', 'self', 'belief', 'discipline'], demand: 5 },
  { id: 'stress', categoryId: 'mind', title: 'Stress & Emotional Fitness', blurb: 'Guide calmer, more resilient responses to pressure.', subNiches: ['Anxiety habits', 'Burnout recovery', 'Emotional regulation', 'Mindfulness'], audiences: ['professionals', 'individuals'], deliveries: ['one-to-one', 'group', 'community'], keywords: ['stress', 'anxiety', 'burnout', 'calm', 'mindfulness', 'emotional', 'resilience'], demand: 4 },
  { id: 'productivity-mind', categoryId: 'mind', title: 'Focus & Productivity', blurb: 'Coach deep focus and follow-through without overwhelm.', subNiches: ['Time management', 'Deep work', 'Beating procrastination', 'Study focus'], audiences: ['professionals', 'students', 'individuals'], deliveries: ['course', 'group', 'content'], keywords: ['focus', 'productivity', 'time', 'procrastination', 'habits', 'discipline'], demand: 4 },

  // Relationships
  { id: 'dating', categoryId: 'relationships', title: 'Dating & Confidence', blurb: 'Help singles date with clarity and self-respect.', subNiches: ['Dating confidence', 'Online dating', 'Attraction', 'Post-breakup'], audiences: ['individuals'], deliveries: ['one-to-one', 'course', 'community'], keywords: ['dating', 'relationship', 'love', 'attraction', 'single', 'breakup'], demand: 4 },
  { id: 'marriage', categoryId: 'relationships', title: 'Marriage & Partnership', blurb: 'Support stronger communication between partners.', subNiches: ['Communication', 'Conflict repair', 'Reconnection', 'Newlyweds'], audiences: ['individuals', 'parents'], deliveries: ['one-to-one', 'group'], keywords: ['marriage', 'couple', 'partner', 'communication', 'conflict'], demand: 3 },
  { id: 'parenting', categoryId: 'relationships', title: 'Parenting & Family', blurb: 'Coach calmer, more confident parenting.', subNiches: ['Toddler years', 'Teen parenting', 'Screen-time', 'Working parents'], audiences: ['parents'], deliveries: ['course', 'community', 'group'], keywords: ['parenting', 'kids', 'children', 'family', 'teen', 'mom', 'dad'], demand: 4 },

  // Money
  { id: 'personal-finance', categoryId: 'money', title: 'Personal Finance', blurb: 'Help people budget, save and get out of debt.', subNiches: ['Budgeting', 'Debt payoff', 'Saving systems', 'Money mindset'], audiences: ['individuals', 'professionals', 'students'], deliveries: ['course', 'group', 'content'], keywords: ['money', 'finance', 'budget', 'debt', 'saving', 'personal finance'], demand: 5 },
  { id: 'investing', categoryId: 'money', title: 'Investing & Wealth', blurb: 'Teach long-term investing and wealth building.', subNiches: ['Stock market basics', 'Index investing', 'Real estate', 'Retirement'], audiences: ['professionals', 'individuals', 'seniors'], deliveries: ['course', 'community', 'content'], keywords: ['investing', 'wealth', 'stocks', 'mutual funds', 'real estate', 'retirement'], demand: 5 },
  { id: 'freelance-money', categoryId: 'money', title: 'Freelance & Side Income', blurb: 'Help people earn beyond a single paycheck.', subNiches: ['Freelancing', 'Side hustles', 'Pricing', 'Client acquisition'], audiences: ['professionals', 'students', 'individuals'], deliveries: ['course', 'community', 'one-to-one'], keywords: ['freelance', 'side hustle', 'income', 'clients', 'gig', 'earn'], demand: 4 },

  // Career
  { id: 'career-growth', categoryId: 'career', title: 'Career Growth', blurb: 'Coach promotions, raises and career direction.', subNiches: ['Promotions', 'Salary negotiation', 'Career change', 'Personal branding'], audiences: ['professionals'], deliveries: ['one-to-one', 'group', 'course'], keywords: ['career', 'job', 'promotion', 'salary', 'work', 'professional'], demand: 5 },
  { id: 'interview', categoryId: 'career', title: 'Interview & Job Search', blurb: 'Help candidates land roles with confidence.', subNiches: ['Resume', 'Interview prep', 'LinkedIn', 'Fresh graduates'], audiences: ['professionals', 'students'], deliveries: ['one-to-one', 'course', 'content'], keywords: ['interview', 'resume', 'job search', 'linkedin', 'hiring', 'graduate'], demand: 4 },
  { id: 'leadership', categoryId: 'career', title: 'Leadership & Management', blurb: 'Develop new managers and confident leaders.', subNiches: ['First-time managers', 'Team communication', 'Difficult conversations', 'Executive presence'], audiences: ['professionals', 'businesses'], deliveries: ['one-to-one', 'group'], keywords: ['leadership', 'manager', 'team', 'management', 'executive'], demand: 4 },

  // Business
  { id: 'coaching-business', categoryId: 'business', title: 'Coaching Business', blurb: 'Help experts build a coaching or consulting business.', subNiches: ['Getting first clients', 'Offer design', 'High-ticket sales', 'Systems'], audiences: ['professionals', 'businesses'], deliveries: ['course', 'community', 'one-to-one'], keywords: ['coaching', 'consulting', 'business', 'clients', 'offer', 'expert'], demand: 5 },
  { id: 'course-creation', categoryId: 'business', title: 'Courses & Digital Products', blurb: 'Turn knowledge into courses and memberships.', subNiches: ['Course creation', 'Memberships', 'Cohort programs', 'Launches'], audiences: ['professionals', 'businesses'], deliveries: ['course', 'community', 'content'], keywords: ['course', 'digital product', 'membership', 'launch', 'knowledge'], demand: 5 },
  { id: 'marketing', categoryId: 'business', title: 'Marketing & Leads', blurb: 'Coach lead generation and marketing that converts.', subNiches: ['Content marketing', 'Funnels', 'Email', 'Ads'], audiences: ['businesses', 'professionals'], deliveries: ['course', 'community', 'content'], keywords: ['marketing', 'leads', 'funnel', 'ads', 'email', 'sales', 'growth'], demand: 5 },

  // Tech
  { id: 'ai-tools', categoryId: 'tech', title: 'AI for Non-Techies', blurb: 'Help people use AI tools in daily work and business.', subNiches: ['ChatGPT for work', 'AI content', 'Automation', 'Prompting'], audiences: ['professionals', 'businesses', 'individuals'], deliveries: ['course', 'content', 'community'], keywords: ['ai', 'chatgpt', 'automation', 'tech', 'prompt', 'tools', 'digital'], demand: 5 },
  { id: 'nocode', categoryId: 'tech', title: 'No-Code & Automation', blurb: 'Teach building and automating without heavy coding.', subNiches: ['No-code apps', 'Workflow automation', 'Spreadsheets', 'Websites'], audiences: ['professionals', 'businesses'], deliveries: ['course', 'content'], keywords: ['no-code', 'automation', 'workflow', 'app', 'website', 'tools'], demand: 3 },
  { id: 'data-skills', categoryId: 'tech', title: 'Practical Data Skills', blurb: 'Coach everyday data and analytics skills.', subNiches: ['Excel & Sheets', 'Dashboards', 'Analytics basics', 'Reporting'], audiences: ['professionals', 'students'], deliveries: ['course', 'one-to-one'], keywords: ['data', 'excel', 'analytics', 'dashboard', 'reporting', 'spreadsheet'], demand: 3 },

  // Creative
  { id: 'content-creation', categoryId: 'creative', title: 'Content Creation', blurb: 'Help creators grow an audience and stay consistent.', subNiches: ['Short-form video', 'YouTube', 'Writing online', 'Personal brand'], audiences: ['individuals', 'professionals'], deliveries: ['course', 'community', 'content'], keywords: ['content', 'creator', 'youtube', 'video', 'writing', 'brand', 'audience', 'reels'], demand: 5 },
  { id: 'design-creative', categoryId: 'creative', title: 'Design & Creativity', blurb: 'Coach creative skills and a creative career.', subNiches: ['Design basics', 'Photography', 'Music', 'Creative confidence'], audiences: ['individuals', 'students'], deliveries: ['course', 'one-to-one', 'content'], keywords: ['design', 'creative', 'art', 'photography', 'music', 'craft'], demand: 3 },
  { id: 'lifestyle-design', categoryId: 'creative', title: 'Lifestyle & Productivity', blurb: 'Help people design intentional, balanced lives.', subNiches: ['Habits', 'Minimalism', 'Work-life balance', 'Digital wellbeing'], audiences: ['individuals', 'professionals', 'parents'], deliveries: ['course', 'community', 'content'], keywords: ['lifestyle', 'habits', 'balance', 'minimalism', 'productivity', 'wellbeing'], demand: 3 },
];

export function nichesByCategory(categoryId: string): Niche[] {
  return niches.filter((n) => n.categoryId === categoryId);
}

export function categoryName(id: string): string {
  return categories.find((c) => c.id === id)?.name ?? id;
}

// ---- Wizard question flow (data-driven) ------------------------------------

export interface WizardOption {
  value: string;
  label: string;
  hint?: string;
  icon?: string;
}

export interface WizardStep {
  id: 'categories' | 'audience' | 'delivery' | 'goal' | 'background';
  title: string;
  help: string;
  kind: 'multi' | 'single' | 'text';
  min?: number;
  options?: WizardOption[];
}

export const wizardSteps: WizardStep[] = [
  {
    id: 'categories',
    title: 'Which areas genuinely interest you?',
    help: 'Pick one or more. This has the biggest impact on your matches.',
    kind: 'multi',
    min: 1,
    options: categories.map((c) => ({ value: c.id, label: c.name, hint: c.blurb, icon: c.icon })),
  },
  {
    id: 'audience',
    title: 'Who do you most want to help?',
    help: 'Choose the audience you understand best.',
    kind: 'single',
    options: [
      { value: 'individuals', label: 'Everyday individuals', icon: '🙂' },
      { value: 'professionals', label: 'Working professionals', icon: '💼' },
      { value: 'businesses', label: 'Business owners', icon: '🏢' },
      { value: 'students', label: 'Students & early-career', icon: '🎓' },
      { value: 'parents', label: 'Parents & families', icon: '👨‍👩‍👧' },
      { value: 'seniors', label: 'Older adults', icon: '🌅' },
    ],
  },
  {
    id: 'delivery',
    title: 'How would you like to coach?',
    help: 'Pick every format you would enjoy.',
    kind: 'multi',
    min: 1,
    options: [
      { value: 'one-to-one', label: '1:1 coaching', icon: '🤝' },
      { value: 'group', label: 'Group programs', icon: '👥' },
      { value: 'course', label: 'Online courses', icon: '🎥' },
      { value: 'community', label: 'Membership community', icon: '🌐' },
      { value: 'content', label: 'Content & audience', icon: '✍️' },
    ],
  },
  {
    id: 'goal',
    title: "What's your main goal?",
    help: 'We use this to prioritise higher-demand niches.',
    kind: 'single',
    options: [
      { value: 'side-income', label: 'Start a side income', icon: '🌱' },
      { value: 'replace-income', label: 'Replace my job income', icon: '🎯' },
      { value: 'scale', label: 'Scale an existing business', icon: '📊' },
      { value: 'authority', label: 'Build authority & audience', icon: '⭐' },
    ],
  },
  {
    id: 'background',
    title: 'Anything about your background?',
    help: 'Optional. A sentence about your skills or experience sharpens the match.',
    kind: 'text',
  },
];
