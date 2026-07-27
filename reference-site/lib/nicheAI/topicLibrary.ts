/**
 * Enterprise topic taxonomy — the RAW source.
 *
 * Kept compact on purpose: categories declare `subs` with core topics plus
 * optional `mods` (audience/level modifiers). `topicEngine.ts` expands these
 * into 1,500+ fully-enriched, unique topics at runtime (keeps the bundle small
 * while producing a large, realistic niche database). All original to CoachX.
 *
 * Coaching-niche mapping (`niche`) drives the existing scoring engine unchanged:
 * health · mind · relationships · money · career · business · tech · creative.
 */

export type NicheCat = 'health' | 'mind' | 'relationships' | 'money' | 'career' | 'business' | 'tech' | 'creative';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type Monetization = 'Low' | 'Medium' | 'High' | 'Very High';
export type Audience = 'Individuals' | 'Professionals' | 'Business Owners' | 'Students' | 'Parents' | 'Seniors' | 'Creators';
/** Four-point scale reused for demand and competition. */
export type Level = 'Low' | 'Medium' | 'High' | 'Very High';
export type ExperienceLevel = 'Entry (0–1 yrs)' | 'Working (1–3 yrs)' | 'Experienced (3–7 yrs)' | 'Expert (7+ yrs)';

export interface RawSub {
  name: string;
  topics: string[];
  mods?: string[];
  /**
   * Optional per-subcategory overrides. A subcategory usually inherits its
   * parent category's mapping, but a broad category (e.g. Fitness) can hold
   * subcategories whose monetization, audience or business mapping genuinely
   * differ (e.g. Weight Management monetizes far higher than Mobility). Set
   * only what differs; anything omitted inherits the category.
   */
  niche?: NicheCat;
  business?: string;
  monetization?: Monetization;
  audience?: Audience[];
  industry?: string;
  demand?: Level;
  competition?: Level;
}
export interface RawCategory {
  id: string;
  name: string;
  group: string;
  niche: NicheCat;
  business: string;
  monetization: Monetization;
  audience: Audience[];
  keywords?: string[];
  mods?: string[];
  /**
   * Editorial market signals. Optional: `topicEngine` derives sensible values
   * from the niche + monetization when a category doesn't state them, so the
   * older categories keep working without being rewritten.
   */
  industry?: string;
  demand?: Level;
  competition?: Level;
  subs: RawSub[];
}

// Reusable modifier sets (audience / level angles → realistic sub-niches).
const AUD = ['for beginners', 'for professionals', 'for entrepreneurs', 'for women', 'for busy professionals'];
const AUD4 = ['for beginners', 'for professionals', 'for creators', 'advanced strategies'];
const LVL = ['for beginners', 'intermediate', 'advanced'];
const BIZ = ['for small businesses', 'for startups', 'for solopreneurs', 'case studies'];

export const LIBRARY: RawCategory[] = [
  // ============================ BUSINESS ============================
  {
    id: 'business-foundations', name: 'Business Foundations', group: 'Business', niche: 'business', business: 'Business Strategy',
    monetization: 'High', audience: ['Business Owners', 'Professionals'], mods: BIZ,
    subs: [
      { name: 'Getting Started', topics: ['Starting a business', 'Business planning', 'Choosing a business model', 'Naming a business', 'Registering a company', 'Solopreneurship'] },
      { name: 'Strategy', topics: ['Business strategy', 'Competitive advantage', 'Market research', 'Business model design', 'Pricing strategy', 'Scaling a company', 'Operations & systems'] },
      { name: 'Legal & Admin', topics: ['Business insurance basics', 'Record keeping', 'Business banking setup', 'Trading names'] },
      { name: 'Growth Stages', topics: ['First ten customers', 'From solo to team', 'Second location', 'Franchising readiness'] },
      { name: 'Founder Skills', topics: ['Founder time management', 'Founder isolation', 'Decision fatigue', 'Founder finances'] },
    ],
  },
  {
    id: 'startups', name: 'Startups & Innovation', group: 'Business', niche: 'business', business: 'Startups',
    monetization: 'Very High', audience: ['Business Owners', 'Professionals'], mods: ['for beginners', 'for technical founders', 'for non-technical founders', 'case studies'],
    subs: [
      { name: 'Building', topics: ['Startup ideas', 'Building an MVP', 'Product-market fit', 'SaaS businesses', 'Bootstrapping', 'Startup operations'] },
      { name: 'Funding', topics: ['Fundraising', 'Pitching investors', 'Venture capital', 'Angel investing', 'Startup valuation', 'Term sheets'] },
      { name: 'Team', topics: ['Co-founder agreements', 'Early hiring', 'Equity splits', 'Employee stock options', 'Advisory boards'] },
      { name: 'Metrics', topics: ['Startup KPIs', 'Burn rate & runway', 'Cohort retention', 'North star metrics'] },
      { name: 'Failure & Pivots', topics: ['Pivoting a startup', 'Shutting down gracefully', 'Learning from failure', 'Restarting after failure'] },
    ],
  },
  {
    id: 'small-business', name: 'Small Business Management', group: 'Business', niche: 'business', business: 'Small Business',
    monetization: 'High', audience: ['Business Owners'], mods: ['for beginners', 'for local businesses', 'for online businesses'],
    subs: [
      { name: 'Operations', topics: ['Small business growth', 'Hiring your first employees', 'Business systems', 'Standard operating procedures', 'Outsourcing & delegation', 'Business automation'] },
      { name: 'Finance', topics: ['Small business accounting', 'Cash flow management', 'Business budgeting', 'Business credit', 'Managing expenses'] },
      { name: 'Local Growth', topics: ['Local advertising', 'Community sponsorship', 'Local partnerships', 'Word of mouth'] },
    ],
  },
  {
    id: 'ecommerce', name: 'E-commerce', group: 'Business', niche: 'business', business: 'E-commerce',
    monetization: 'Very High', audience: ['Business Owners', 'Creators'], mods: ['for beginners', 'advanced strategies', 'case studies'],
    subs: [
      { name: 'Models', topics: ['Dropshipping', 'Amazon FBA', 'Print on demand', 'Shopify stores', 'Etsy selling', 'Subscription boxes', 'Wholesale & sourcing'] },
      { name: 'Growth', topics: ['E-commerce marketing', 'Conversion optimization', 'Product photography', 'Inventory management', 'Customer retention', 'Cart abandonment recovery'] },
      { name: 'Operations', topics: ['Order fulfilment', 'Returns management', 'Supplier relationships', 'Packaging design', 'Shipping rates'] },
      { name: 'International', topics: ['Cross-border e-commerce', 'Localisation', 'International payments', 'Global shipping'] },
    ],
  },
  {
    id: 'agency', name: 'Agencies & Services', group: 'Business', niche: 'business', business: 'Agency',
    monetization: 'Very High', audience: ['Business Owners', 'Professionals'], mods: ['for beginners', 'for freelancers', 'scaling'],
    subs: [
      { name: 'Agency Types', topics: ['Marketing agency', 'Social media agency', 'SEO agency', 'Web design agency', 'Lead generation agency', 'Virtual assistant agency'] },
      { name: 'Running an Agency', topics: ['Client acquisition', 'Client onboarding', 'Retainer models', 'Team building', 'Service delivery systems'] },
      { name: 'Positioning', topics: ['Agency niching', 'Productised services', 'Agency pricing models', 'Case study creation'] },
      { name: 'Operations', topics: ['Agency project management', 'Capacity planning', 'Freelancer networks', 'Agency profitability'] },
    ],
  },
  {
    id: 'coaching-consulting', name: 'Coaching & Consulting', group: 'Business', niche: 'business', business: 'Coaching',
    monetization: 'Very High', audience: ['Business Owners', 'Professionals'], mods: AUD4,
    subs: [
      { name: 'Coaching', topics: ['Life coaching', 'Business coaching', 'Executive coaching', 'Health coaching', 'Career coaching', 'Relationship coaching', 'Mindset coaching'] },
      { name: 'Building the Business', topics: ['Consulting', 'Course creation', 'Group programs', 'Masterminds', 'Membership sites', 'Building authority', 'High-ticket offers'] },
      { name: 'Delivery', topics: ['Client transformation design', 'Session structure', 'Progress tracking', 'Client retention'] },
      { name: 'Scaling', topics: ['One-to-many delivery', 'Hiring associate coaches', 'Licensing your method', 'Certification programs'] },
    ],
  },
  {
    id: 'freelancing', name: 'Freelancing', group: 'Business', niche: 'career', business: 'Freelancing',
    monetization: 'High', audience: ['Professionals', 'Creators'], mods: ['for beginners', 'scaling', 'full-time'],
    subs: [
      { name: 'Getting Clients', topics: ['Finding freelance clients', 'Freelance pricing', 'Cold pitching', 'Upwork & marketplaces', 'Freelance portfolios', 'Freelance contracts'] },
      { name: 'Skills', topics: ['Freelance writing', 'Freelance design', 'Freelance development', 'Freelance marketing', 'Virtual assistance'] },
      { name: 'Business Side', topics: ['Freelance taxes', 'Freelance retirement saving', 'Freelance health insurance', 'Freelance invoicing'] },
      { name: 'Sustainability', topics: ['Avoiding feast and famine', 'Raising freelance rates', 'Firing bad clients', 'Freelance burnout'] },
    ],
  },

  // ============================ MARKETING & SALES ============================
  {
    id: 'digital-marketing', name: 'Digital Marketing', group: 'Marketing & Sales', niche: 'business', business: 'Marketing',
    monetization: 'Very High', audience: ['Business Owners', 'Professionals'], mods: AUD,
    subs: [
      { name: 'Channels', topics: ['Content marketing', 'Email marketing', 'Search engine optimization', 'Paid advertising', 'Social media marketing', 'Video marketing', 'Affiliate marketing'] },
      { name: 'Strategy', topics: ['Marketing funnels', 'Marketing strategy', 'Marketing analytics', 'Brand strategy', 'Growth hacking', 'Marketing automation'] },
      { name: 'Positioning', topics: ['Messaging frameworks', 'Value proposition design', 'Competitor differentiation', 'Category creation'] },
      { name: 'Channels Deep-Dive', topics: ['Podcast advertising', 'Newsletter sponsorship', 'Community marketing', 'Partnership marketing'] },
    ],
  },
  {
    id: 'seo', name: 'SEO & Search', group: 'Marketing & Sales', niche: 'business', business: 'Marketing',
    monetization: 'High', audience: ['Business Owners', 'Professionals'], mods: LVL,
    subs: [
      { name: 'SEO', topics: ['Keyword research', 'On-page SEO', 'Technical SEO', 'Link building', 'Local SEO', 'Content SEO', 'Ecommerce SEO'] },
      { name: 'Content SEO Depth', topics: ['Topical authority', 'Search intent mapping', 'Featured snippets', 'Programmatic SEO'] },
      { name: 'Technical Depth', topics: ['Core web vitals', 'Crawl budget', 'Structured data', 'International SEO', 'Site migrations'] },
      { name: 'Off-Page', topics: ['Digital PR for links', 'Broken link building', 'Competitor backlink analysis'] },
    ],
  },
  {
    id: 'paid-ads', name: 'Paid Advertising', group: 'Marketing & Sales', niche: 'business', business: 'Advertising',
    monetization: 'Very High', audience: ['Business Owners', 'Professionals'], mods: LVL,
    subs: [
      { name: 'Platforms', topics: ['Facebook ads', 'Instagram ads', 'Google ads', 'YouTube ads', 'TikTok ads', 'LinkedIn ads', 'Retargeting ads'] },
      { name: 'Creative', topics: ['Ad creative testing', 'Hook writing for ads', 'UGC ads', 'Static vs video ads'] },
      { name: 'Measurement', topics: ['Ad account structure', 'Conversion tracking', 'Incrementality testing', 'Creative fatigue'] },
    ],
  },
  {
    id: 'copywriting', name: 'Copywriting', group: 'Marketing & Sales', niche: 'creative', business: 'Copywriting',
    monetization: 'High', audience: ['Professionals', 'Creators'], mods: ['for beginners', 'advanced', 'for freelancers'],
    subs: [
      { name: 'Copywriting', topics: ['Sales copywriting', 'Email copywriting', 'Landing page copy', 'Ad copywriting', 'Storytelling in copy', 'Direct response copywriting'] },
      { name: 'Formats', topics: ['Sales pages', 'Email sequences', 'Ad copy', 'Landing page copy', 'Product descriptions'] },
      { name: 'Craft', topics: ['Headline writing', 'Storytelling in copy', 'Voice of customer research', 'Editing your own copy'] },
    ],
  },
  {
    id: 'sales', name: 'Sales', group: 'Marketing & Sales', niche: 'business', business: 'Sales',
    monetization: 'Very High', audience: ['Professionals', 'Business Owners'], mods: ['for beginners', 'advanced', 'for introverts'],
    subs: [
      { name: 'Selling', topics: ['Sales fundamentals', 'High-ticket sales', 'Cold outreach', 'B2B sales', 'Closing techniques', 'Negotiation', 'Objection handling', 'Follow-up systems', 'Sales scripts'] },
      { name: 'Process', topics: ['Sales scripts', 'Follow-up systems', 'CRM hygiene', 'Deal qualification frameworks'] },
      { name: 'Mindset', topics: ['Sales confidence', 'Handling rejection', 'Selling without being pushy', 'Sales goal setting'] },
    ],
  },
  {
    id: 'branding', name: 'Branding', group: 'Marketing & Sales', niche: 'creative', business: 'Branding',
    monetization: 'High', audience: ['Business Owners', 'Creators'], mods: ['for startups', 'for personal brands', 'for products'],
    subs: [
      { name: 'Brand Building', topics: ['Brand identity', 'Brand messaging', 'Personal branding', 'Brand positioning', 'Visual identity', 'Brand storytelling'] },
      { name: 'Application', topics: ['Brand rollout', 'Brand consistency', 'Co-branding', 'Brand partnerships'] },
    ],
  },

  // ============================ MONEY & FINANCE ============================
  {
    id: 'personal-finance', name: 'Personal Finance', group: 'Money & Finance', niche: 'money', business: 'Finance Education',
    monetization: 'High', audience: ['Individuals', 'Professionals'], mods: ['for beginners', 'for families', 'for young adults', 'for couples'],
    subs: [
      { name: 'Money Basics', topics: ['Budgeting', 'Saving money', 'Getting out of debt', 'Emergency funds', 'Money mindset', 'Frugal living', 'Financial literacy'] },
      { name: 'Planning', topics: ['Financial planning', 'Retirement planning', 'Financial independence', 'Tax strategy', 'Estate planning', 'Insurance basics'] },
      { name: 'Getting Started', topics: ['First budget', 'Tracking spending', 'Financial goal setting', 'Net worth tracking'] },
      { name: 'Life Events', topics: ['Money after divorce', 'Money after job loss', 'Financial windfalls', 'Money in your twenties'] },
    ],
  },
  {
    id: 'investing', name: 'Investing', group: 'Money & Finance', niche: 'money', business: 'Investing Education',
    monetization: 'Very High', audience: ['Individuals', 'Professionals'], mods: ['for beginners', 'intermediate', 'advanced'],
    subs: [
      { name: 'Markets', topics: ['Stock market investing', 'Index funds', 'Dividend investing', 'Value investing', 'ETF investing', 'Bonds', 'Portfolio management'] },
      { name: 'Alternative', topics: ['Real estate investing', 'REITs', 'Commodities', 'Gold & precious metals', 'Angel investing', 'Passive income'] },
      { name: 'Getting Started', topics: ['First investment account', 'Index fund investing', 'Dollar cost averaging', 'Asset allocation'] },
      { name: 'Discipline', topics: ['Investing psychology', 'Market crashes', 'Rebalancing', 'Avoiding investment scams'] },
    ],
  },
  {
    id: 'trading', name: 'Trading', group: 'Money & Finance', niche: 'money', business: 'Trading Education',
    monetization: 'Very High', audience: ['Individuals', 'Professionals'], mods: ['for beginners', 'advanced'],
    subs: [
      { name: 'Trading', topics: ['Day trading', 'Options trading', 'Forex trading', 'Swing trading', 'Technical analysis', 'Risk management', 'Trading psychology'] },
    ],
  },
  {
    id: 'crypto', name: 'Crypto & Web3', group: 'Money & Finance', niche: 'money', business: 'Crypto',
    monetization: 'Very High', audience: ['Individuals', 'Creators'], mods: ['for beginners', 'advanced'],
    subs: [
      { name: 'Crypto', topics: ['Bitcoin', 'Ethereum', 'Crypto investing', 'DeFi', 'NFTs', 'Crypto trading', 'Blockchain basics', 'Crypto security'] },
      { name: 'Fundamentals', topics: ['Bitcoin basics', 'Ethereum basics', 'Wallet security', 'Exchanges & custody'] },
      { name: 'Practice', topics: ['Crypto tax reporting', 'Avoiding crypto scams', 'Dollar cost averaging crypto', 'Staking'] },
    ],
  },
  {
    id: 'real-estate', name: 'Real Estate', group: 'Money & Finance', niche: 'money', business: 'Real Estate',
    monetization: 'Very High', audience: ['Individuals', 'Business Owners'], mods: ['for beginners', 'advanced', 'no money down'],
    subs: [
      { name: 'Investing', topics: ['Rental properties', 'House flipping', 'Short-term rentals', 'Wholesaling', 'Commercial real estate', 'BRRRR method', 'Property management'] },
      { name: 'Buying & Selling', topics: ['Home buying', 'Real estate agent skills', 'Home staging', 'Mortgage basics', 'First-time home buyers'] },
      { name: 'Agency Career', topics: ['Becoming a real estate agent', 'Lead generation for agents', 'Listing presentations', 'Agent branding'] },
      { name: 'Development', topics: ['Property development basics', 'Planning permission', 'Renovation for profit', 'Land investing'] },
    ],
  },

  // ============================ CAREER & WORK ============================
  {
    id: 'career-growth', name: 'Career Growth', group: 'Career & Work', niche: 'career', business: 'Career Coaching',
    monetization: 'High', audience: ['Professionals', 'Students'], mods: ['for beginners', 'for mid-career', 'for executives'],
    subs: [
      { name: 'Advancement', topics: ['Career growth', 'Getting promoted', 'Salary negotiation', 'Career change', 'Personal branding at work', 'Executive presence'] },
      { name: 'Job Search', topics: ['Job search', 'Resume writing', 'Cover letters', 'Interview preparation', 'LinkedIn optimization', 'Networking'] },
      { name: 'Visibility', topics: ['Getting promoted', 'Building an internal network', 'Advocating for yourself', 'Executive sponsorship'] },
      { name: 'Compensation', topics: ['Pay negotiation', 'Equity compensation', 'Benchmarking your salary', 'Counter-offers'] },
    ],
  },
  {
    id: 'leadership', name: 'Leadership & Management', group: 'Career & Work', niche: 'career', business: 'Leadership Training',
    monetization: 'High', audience: ['Professionals', 'Business Owners'], mods: ['for new managers', 'for executives', 'for teams'],
    subs: [
      { name: 'Leading', topics: ['Leadership skills', 'Team management', 'Difficult conversations', 'Delegation', 'Company culture', 'Decision making', 'Conflict resolution'] },
      { name: 'People', topics: ['Hiring & recruiting', 'Performance management', 'Employee retention', 'Remote team management', 'Giving feedback'] },
      { name: 'Influence', topics: ['Leading without authority', 'Stakeholder influence', 'Storytelling for leaders', 'Executive communication'] },
      { name: 'Resilient Leadership', topics: ['Leading through uncertainty', 'Leader self-care', 'Difficult decisions', 'Rebuilding team trust'] },
    ],
  },
  {
    id: 'remote-work', name: 'Remote & Future of Work', group: 'Career & Work', niche: 'career', business: 'Work Skills',
    monetization: 'Medium', audience: ['Professionals', 'Individuals'], mods: ['for beginners', 'for teams'],
    subs: [
      { name: 'Remote', topics: ['Working remotely', 'Digital nomad lifestyle', 'Remote productivity', 'Async communication', 'Building a home office', 'Finding remote jobs'] },
      { name: 'Async Work', topics: ['Asynchronous communication', 'Written communication', 'Documentation habits', 'Meeting reduction'] },
      { name: 'Distributed Teams', topics: ['Time zone collaboration', 'Remote onboarding', 'Virtual team building', 'Remote performance management'] },
    ],
  },

  // ============================ HEALTH & FITNESS ============================
  {
    id: 'fitness', name: 'Fitness & Training', group: 'Health & Fitness', niche: 'health', business: 'Fitness Coaching',
    monetization: 'High', audience: ['Individuals', 'Seniors'], mods: ['for beginners', 'for women', 'for men', 'for seniors', 'at home'],
    subs: [
      { name: 'Training', topics: ['Weight loss', 'Strength training', 'Home workouts', 'Bodybuilding', 'Calisthenics', 'HIIT', 'Functional fitness', 'Mobility & flexibility'] },
      { name: 'Cardio & Sport', topics: ['Running', 'Cycling', 'Swimming', 'Marathon training', 'Sports performance', 'CrossFit'] },
      { name: 'Lifting', business: 'Strength Coaching', mods: ['for beginners', 'for women', 'over 40'],
        topics: ['Powerlifting', 'Olympic weightlifting', 'Progressive overload', 'Compound lifts', 'Lifting form & technique', 'Kettlebell training'] },
      { name: 'Program Design', business: 'Strength Coaching', mods: ['for beginners'],
        topics: ['Strength program design', 'Periodization', 'Deload weeks', 'Home gym training', 'Training splits'] },
      { name: 'Running', mods: ['for beginners'],
        topics: ['Couch to 5K', 'Trail running', 'Running form', 'Running injury prevention', 'Race day strategy', 'Heart rate zone training'] },
      { name: 'Endurance Sports', monetization: 'Medium', mods: ['for beginners'],
        topics: ['Triathlon training', 'Cycling training', 'Open water swimming', 'Ultramarathons'] },
      { name: 'Fat Loss', business: 'Weight Loss', monetization: 'Very High', mods: ['for beginners', 'for women', 'over 40'],
        topics: ['Sustainable fat loss', 'Calorie deficits', 'Body recomposition', 'Plateau breaking', 'Tracking progress'] },
      { name: 'Eating Behaviour', business: 'Weight Loss', monetization: 'Very High', mods: ['for women'],
        topics: ['Emotional eating', 'Portion control', 'Weight maintenance', 'Food relationship healing', 'Reverse dieting'] },
      { name: 'Muscle Gain', business: 'Weight Loss', monetization: 'High', mods: ['for beginners'],
        topics: ['Building muscle', 'Bulking & cutting', 'Protein strategies'] },
      { name: 'Getting Started', topics: ['First gym visit', 'Building a workout habit', 'Choosing a gym', 'Workout motivation'] },
      { name: 'Special Populations', topics: ['Exercise during pregnancy', 'Training with an injury', 'Exercise for desk workers', 'Youth strength training'] },
    ],
  },
  {
    id: 'yoga-mind-body', name: 'Yoga & Mind-Body', group: 'Health & Fitness', niche: 'health', business: 'Wellness',
    monetization: 'Medium', audience: ['Individuals', 'Seniors'], mods: ['for beginners', 'for women', 'for seniors', 'for stress relief'],
    subs: [
      { name: 'Practices', topics: ['Yoga', 'Pilates', 'Stretching', 'Tai chi', 'Breathwork', 'Meditation for the body'] },
      { name: 'Styles Depth', topics: ['Yin yoga', 'Ashtanga', 'Chair yoga', 'Prenatal yoga'] },
    ],
  },
  {
    id: 'health-wellness', name: 'Health & Wellness', group: 'Health & Fitness', niche: 'health', business: 'Health Coaching',
    monetization: 'High', audience: ['Individuals', 'Seniors'], mods: ['for beginners', 'for women', 'for men', 'naturally'],
    subs: [
      { name: 'Wellbeing', topics: ['Holistic health', 'Sleep improvement', 'Longevity', 'Hormone health', 'Gut health', 'Immune health', 'Healthy aging', 'Energy & vitality'] },
      { name: 'Specialised', topics: ["Women's health", "Men's health", 'Menopause wellness', 'Chronic illness lifestyle', 'Autoimmune health', 'Thyroid health'] },
      { name: 'Sleep', business: 'Wellness', monetization: 'Medium', mods: ['for beginners'],
        topics: ['Sleep hygiene', 'Insomnia strategies', 'Circadian rhythm', 'Shift work sleep', 'Sleep tracking'] },
      { name: 'Recovery', business: 'Wellness', monetization: 'Medium', mods: [],
        topics: ['Active recovery', 'Mobility & stretching', 'Foam rolling', 'Cold exposure', 'Sauna & heat therapy', 'Massage & bodywork'] },
      { name: 'Pain & Injury', business: 'Rehabilitation', mods: [],
        topics: ['Back pain relief', 'Knee pain', 'Shoulder rehabilitation', 'Plantar fasciitis', 'Repetitive strain injury', 'Posture correction'] },
      { name: 'Rehabilitation', business: 'Rehabilitation', audience: ['Individuals', 'Professionals'], mods: [],
        topics: ['Return to sport', 'Physical therapy exercises', 'Chronic pain management', 'Ergonomics'] },
    ],
  },
  {
    id: 'nutrition', name: 'Nutrition & Diet', group: 'Health & Fitness', niche: 'health', business: 'Nutrition Coaching',
    monetization: 'High', audience: ['Individuals'], mods: ['for beginners', 'for weight loss', 'for athletes'],
    subs: [
      { name: 'Diets', topics: ['Nutrition basics', 'Meal planning', 'Keto diet', 'Plant-based eating', 'Intermittent fasting', 'Paleo diet', 'Mediterranean diet', 'Macro counting'] },
      { name: 'Applied', topics: ['Sports nutrition', 'Gut-friendly eating', 'Supplements', 'Healthy meal prep', 'Anti-inflammatory eating'] },
      { name: 'Plant-Based', mods: ['for beginners'],
        topics: ['Vegan cooking', 'Vegetarian nutrition', 'Plant-based protein', 'Raw food'] },
      { name: 'Therapeutic Diets', mods: ['for beginners'],
        topics: ['Low FODMAP', 'Diabetic-friendly cooking', 'Heart-healthy eating', 'Elimination diets'] },
      { name: 'Allergen-Free', mods: [],
        topics: ['Gluten-free cooking', 'Dairy-free cooking', 'Nut-free baking', 'Cooking for food allergies'] },
      { name: 'Practical Eating', topics: ['Eating out healthily', 'Reading nutrition labels', 'Hydration', 'Snacking strategy'] },
      { name: 'Performance', topics: ['Pre-workout nutrition', 'Post-workout recovery nutrition', 'Nutrition for endurance', 'Fuelling for strength'] },
    ],
  },
  {
    id: 'mental-health', name: 'Mental Health', group: 'Health & Fitness', niche: 'mind', business: 'Mental Wellness',
    monetization: 'High', audience: ['Individuals', 'Professionals'], mods: ['for beginners', 'naturally', 'for teens'],
    subs: [
      { name: 'Support', topics: ['Anxiety management', 'Stress management', 'Burnout recovery', 'Emotional regulation', 'Trauma healing', 'Nervous system regulation', 'Depression support', 'Self-care'] },
      { name: 'Stress Tools', business: 'Wellness', mods: ['for beginners'],
        topics: ['Breathwork', 'Overwhelm', 'Grounding techniques', 'Progressive relaxation'] },
      { name: 'Resilience', business: 'Wellness', mods: [],
        topics: ['Building resilience', 'Bouncing back from failure', 'Adaptability', 'Coping strategies', 'Post-traumatic growth'] },
      { name: 'Conditions', topics: ['Understanding anxiety disorders', 'Understanding depression', 'ADHD in adults', 'Bipolar support', 'OCD support'] },
      { name: 'Getting Help', topics: ['Finding a therapist', 'Therapy modalities explained', 'Medication conversations', 'Crisis planning'] },
    ],
  },

  // ============================ FOOD & COOKING ============================
  {
    id: 'cooking', name: 'Cooking & Culinary', group: 'Food & Cooking', niche: 'creative', business: 'Food Content',
    monetization: 'Medium', audience: ['Individuals', 'Creators'], mods: ['for beginners', 'quick & easy', 'on a budget'],
    subs: [
      { name: 'Cooking', topics: ['Home cooking', 'Baking', 'Meal prep', 'Vegan cooking', 'International cuisine', 'Grilling & BBQ', 'Desserts', 'One-pot meals'] },
      { name: 'Food Business', topics: ['Food blogging', 'Recipe development', 'Selling baked goods', 'Cloud kitchens', 'Food photography'] },
      { name: 'Bread', business: 'Food', mods: ['for beginners'],
        topics: ['Sourdough baking', 'Artisan bread', 'No-knead bread', 'Enriched doughs', 'Gluten-free baking'] },
      { name: 'Pastry & Sweets', business: 'Food', mods: ['for beginners'],
        topics: ['Cake decorating', 'Cookies & biscuits', 'Pastry techniques', 'Chocolate work', 'Pie & tart making', 'Cupcake business'] },
      { name: 'Meal Planning', niche: 'health', business: 'Food', audience: ['Individuals', 'Parents'], mods: ['for families', 'on a budget'],
        topics: ['Weekly meal planning', 'Batch cooking', 'Freezer meals', 'Grocery list systems', 'Reducing food waste'] },
      { name: 'Quick Meals', niche: 'health', business: 'Food', audience: ['Individuals', 'Parents'], mods: ['for families'],
        topics: ['30-minute dinners', 'Slow cooker recipes', 'Air fryer cooking', 'Lunchbox ideas'] },
      { name: 'Asian Cuisines', business: 'Food', mods: ['for beginners'],
        topics: ['Indian cooking', 'Thai cooking', 'Japanese home cooking', 'Chinese cooking', 'Korean cooking'] },
      { name: 'Mediterranean & Middle Eastern', business: 'Food', mods: ['for beginners'],
        topics: ['Italian cooking', 'Greek cooking', 'Middle Eastern cooking', 'Spanish tapas'] },
      { name: 'Americas & African Cuisines', business: 'Food', mods: ['for beginners'],
        topics: ['Mexican cooking', 'Southern comfort food', 'Brazilian cooking', 'West African cooking', 'Caribbean cooking'] },
      { name: 'Coffee & Tea', business: 'Beverage', mods: ['for beginners'],
        topics: ['Speciality coffee', 'Espresso technique', 'Coffee roasting', 'Tea appreciation', 'Matcha & ceremonial tea'] },
      { name: 'Bar & Brewing', business: 'Beverage', mods: ['for beginners'],
        topics: ['Cocktail making', 'Mocktails', 'Wine appreciation', 'Craft beer', 'Home brewing', 'Kombucha & ferments'] },
      { name: 'Fire Cooking', business: 'Food', monetization: 'Low', mods: ['for beginners'],
        topics: ['BBQ & smoking', 'Grilling technique', 'Live fire cooking', 'Campfire cooking', 'Pizza oven cooking'] },
      { name: 'Preserving', business: 'Food', monetization: 'Low', mods: [],
        topics: ['Canning & preserving', 'Curing & charcuterie', 'Pickling', 'Dehydrating food'] },
      { name: 'Weeknight Cooking', topics: ['Pantry cooking', 'Five-ingredient meals', 'Cooking for one', 'Freezer-to-table'] },
    ],
  },

  // ============================ MIND & PERSONAL GROWTH ============================
  {
    id: 'personal-development', name: 'Personal Development', group: 'Mind & Growth', niche: 'mind', business: 'Personal Growth',
    monetization: 'High', audience: ['Individuals', 'Professionals'], mods: ['for beginners', 'for women', 'for men', 'for students'],
    subs: [
      { name: 'Self', topics: ['Self-improvement', 'Confidence building', 'Self-discipline', 'Motivation', 'Overcoming fear', 'Self-awareness', 'Assertiveness', 'Emotional intelligence'] },
      { name: 'Skills', topics: ['Public speaking', 'Communication skills', 'Critical thinking', 'Decision making', 'Resilience', 'Charisma'] },
      { name: 'Building Habits', mods: ['for beginners'],
        topics: ['Habit formation', 'Habit stacking', 'Morning routines', 'Evening routines', 'Habit tracking', 'Streaks & consistency'] },
      { name: 'Breaking Habits', mods: [],
        topics: ['Breaking bad habits', 'Digital detox', 'Quitting smoking', 'Reducing alcohol', 'Overcoming procrastination'] },
      { name: 'Goals', business: 'Coaching', mods: ['for beginners'],
        topics: ['Goal setting frameworks', 'OKRs for individuals', 'Annual planning', 'Quarterly reviews', 'Vision boards'] },
      { name: 'Life Design', business: 'Coaching', mods: [],
        topics: ['Designing your ideal life', 'Values clarification', 'Life audits', 'Ikigai & purpose', 'Legacy thinking'] },
      { name: 'Journaling', monetization: 'Low', mods: ['for beginners'],
        topics: ['Daily journaling', 'Gratitude journaling', 'Morning pages', 'Shadow work journaling', 'Bullet journaling'] },
      { name: 'Reflection Tools', monetization: 'Low', mods: [],
        topics: ['Self-inquiry prompts', 'Decision journals', 'Weekly reviews', 'Memoir writing'] },
      { name: 'Self-Worth', mods: ['for women', 'for teens'],
        topics: ['Building self-esteem', 'Self-compassion', 'Overcoming self-doubt', 'Body confidence', 'Perfectionism'] },
      { name: 'Showing Up', mods: ['for women'],
        topics: ['Social confidence', 'Saying no', 'Overcoming shyness', 'Handling criticism'] },
      { name: 'Emotional Skills', mods: [],
        topics: ['Emotional regulation', 'Naming emotions', 'Triggers & responses', 'Empathy skills', 'Active listening', 'Emotional boundaries'] },
      { name: 'Identity', topics: ['Values-based living', 'Personal mission statements', 'Identity change', 'Self-concept work'] },
      { name: 'Discipline', topics: ['Building willpower', 'Delayed gratification', 'Consistency over motivation', 'Recovering from setbacks'] },
    ],
  },
  {
    id: 'mindset', name: 'Mindset & Psychology', group: 'Mind & Growth', niche: 'mind', business: 'Mindset Coaching',
    monetization: 'High', audience: ['Individuals', 'Professionals'], mods: ['for success', 'for entrepreneurs', 'daily practice'],
    subs: [
      { name: 'Mindset', topics: ['Growth mindset', 'Limiting beliefs', 'Positive thinking', 'Manifestation', 'Stoicism', 'Mental models', 'Behavioral change', 'Abundance mindset'] },
      { name: 'Performance', topics: ['Growth mindset', 'Self-talk', 'Visualisation for performance', 'Pressure & choking'] },
    ],
  },
  {
    id: 'productivity', name: 'Productivity & Focus', group: 'Mind & Growth', niche: 'mind', business: 'Productivity',
    monetization: 'Medium', audience: ['Professionals', 'Students'], mods: ['for beginners', 'for entrepreneurs', 'for students'],
    subs: [
      { name: 'Systems', topics: ['Time management', 'Deep work', 'Beating procrastination', 'Habit building', 'Goal setting', 'Note-taking', 'Getting things done', 'Focus & attention'] },
      { name: 'Routines', topics: ['Morning routines', 'Work-life balance', 'Energy management', 'Digital minimalism', 'Weekly planning'] },
      { name: 'Attention', monetization: 'High', mods: ['for beginners'],
        topics: ['Attention management', 'Reducing distractions', 'Single-tasking', 'Flow states'] },
      { name: 'Focus Environment', monetization: 'High', mods: [],
        topics: ['Focus-friendly workspaces', 'Notification management', 'Screen time reduction', 'Working with ADHD'] },
      { name: 'Planning Systems', topics: ['Time blocking', 'Task management systems', 'Priority frameworks', 'Personal sprints'] },
      { name: 'Tools', topics: ['Note-taking apps', 'Automation for personal tasks', 'Calendar management', 'Inbox zero'] },
    ],
  },
  {
    id: 'spirituality', name: 'Spirituality & Purpose', group: 'Mind & Growth', niche: 'mind', business: 'Spiritual Coaching',
    monetization: 'Medium', audience: ['Individuals'], mods: ['for beginners', 'daily practice'],
    subs: [
      { name: 'Practices', topics: ['Meditation', 'Mindfulness', 'Finding purpose', 'Spiritual growth', 'Energy healing', 'Gratitude practice', 'Inner peace', 'Astrology', 'Manifestation rituals'] },
      { name: 'Daily Practice', business: 'Spirituality', mods: ['for beginners'],
        topics: ['Daily spiritual practice', 'Prayer & devotion', 'Energy work', 'Sound healing', 'Breath & chanting'] },
      { name: 'Traditions & Tools', business: 'Spirituality', mods: [],
        topics: ['Tarot & oracle', 'Human design', 'Numerology', 'Moon cycles', 'Ancestral practice'] },
      { name: 'Integration', topics: ['Spirituality and work', 'Spiritual bypassing', 'Grounded spirituality'] },
    ],
  },

  // ============================ RELATIONSHIPS & FAMILY ============================
  {
    id: 'relationships', name: 'Relationships & Dating', group: 'Relationships & Family', niche: 'relationships', business: 'Relationship Coaching',
    monetization: 'High', audience: ['Individuals'], mods: ['for men', 'for women', 'after divorce', 'over 40'],
    subs: [
      { name: 'Dating', topics: ['Dating confidence', 'Online dating', 'Attraction', 'First dates', 'Finding the right partner', 'Dating after divorce'] },
      { name: 'Partnership', topics: ['Marriage', 'Communication in relationships', 'Conflict resolution', 'Rebuilding trust', 'Long-distance relationships', 'Building intimacy', 'Breakup recovery'] },
      { name: 'Meeting People', mods: ['for men', 'for women', 'over 40'],
        topics: ['Dating app profiles', 'Approaching people', 'Where to meet people'] },
      { name: 'Attraction & Standards', mods: ['for men', 'for women'],
        topics: ['Attachment styles in dating', 'Setting dating standards', 'Red flags', 'Ending things kindly'] },
      { name: 'Strengthening Marriage', mods: [],
        topics: ['Marriage communication', 'Intimacy & connection', 'Love languages', 'Date nights', 'Shared goals'] },
      { name: 'Marriage Challenges', mods: [],
        topics: ['Conflict resolution in marriage', 'Financial conflict in relationships', 'Marriage counselling', 'Infidelity recovery'] },
      { name: 'Marriage Transitions', mods: [],
        topics: ['Newlywed adjustment', 'Empty nest', 'Blended family marriage'] },
      { name: 'Separation Process', mods: [],
        topics: ['Deciding to divorce', 'Divorce mediation', 'Co-parenting agreements', 'Dividing finances', 'Divorce paperwork'] },
      { name: 'Divorce Healing', mods: [],
        topics: ['Divorce recovery', 'Heartbreak healing', 'Rebuilding identity', 'Single parenting after divorce'] },
      { name: 'Making Friends', business: 'Social Skills', monetization: 'Medium', mods: ['for adults'],
        topics: ['Making friends as an adult', 'Deepening friendships', 'Social hobbies', 'Community involvement'] },
      { name: 'Social Skills', business: 'Social Skills', monetization: 'Medium', mods: ['for adults'],
        topics: ['Small talk', 'Networking authentically', 'Overcoming loneliness', 'Ending toxic friendships', 'Social anxiety'] },
      { name: 'Communication Core', business: 'Communication', mods: ['for beginners'],
        topics: ['Nonviolent communication', 'Difficult conversations', 'Apologizing well', 'Giving feedback', 'Receiving feedback'] },
      { name: 'Conflict Skills', business: 'Communication', mods: [],
        topics: ['De-escalation', 'Negotiation for everyday life', 'Repair after conflict', 'Mediation basics'] },
      { name: 'Foundations', topics: ['Emotional availability', 'Relationship values', 'Healthy interdependence', 'Relationship check-ins'] },
      { name: 'Repair', topics: ['Rebuilding after conflict', 'Forgiveness', 'Couples rituals', 'Relationship counselling'] },
    ],
  },
  {
    id: 'parenting', name: 'Parenting & Family', group: 'Relationships & Family', niche: 'relationships', business: 'Parenting',
    monetization: 'Medium', audience: ['Parents'], mods: ['for new parents', 'for toddlers', 'for teens'],
    subs: [
      { name: 'Parenting', topics: ['Positive parenting', 'Newborn & baby care', 'Toddler parenting', 'Teen parenting', 'Positive discipline', 'Screen-time management', 'Raising confident kids'] },
      { name: 'Family Life', topics: ['Homeschooling', 'Working parents', 'Family dynamics', 'Pregnancy & postpartum', 'Blended families', 'Family finances'] },
      { name: 'Family of Origin', business: 'Family Coaching', audience: ['Parents', 'Individuals'], mods: [],
        topics: ['Family boundaries', 'Difficult parents', 'Sibling relationships', 'Estrangement', 'Generational patterns'] },
      { name: 'Caregiving', business: 'Family Coaching', audience: ['Parents', 'Individuals', 'Seniors'], mods: [],
        topics: ['Caring for ageing parents', 'Caregiver burnout', 'Sandwich generation', 'Family caregiving logistics'] },
      { name: 'Approaches', topics: ['Gentle parenting', 'Montessori parenting', 'Authoritative parenting', 'Attachment parenting'] },
      { name: 'Daily Life', topics: ['Morning routines with kids', 'Sibling rivalry', 'Screen-free activities', 'Family meal times'] },
    ],
  },

  // ============================ TECHNOLOGY & AI ============================
  {
    id: 'software-dev', name: 'Software Development', group: 'Technology & AI', niche: 'tech', business: 'Tech Education',
    monetization: 'Very High', audience: ['Professionals', 'Students'], mods: ['for beginners', 'intermediate', 'advanced'],
    subs: [
      { name: 'Web & App', topics: ['Web development', 'Frontend development', 'Backend development', 'App development', 'Full-stack development', 'Mobile app development', 'API development'] },
      { name: 'Languages', topics: ['Python programming', 'JavaScript', 'React', 'Coding for beginners', 'SQL & databases', 'Java', 'TypeScript'] },
      { name: 'Languages', topics: ['Python programming', 'JavaScript deep-dive', 'TypeScript', 'Go programming', 'Rust programming', 'Java development'] },
      { name: 'Career Growth', topics: ['Junior to senior developer', 'Technical interviews', 'Open source contribution', 'Developer portfolios'] },
    ],
  },
  {
    id: 'ai', name: 'AI & Machine Learning', group: 'Technology & AI', niche: 'tech', business: 'AI Education',
    monetization: 'Very High', audience: ['Professionals', 'Business Owners', 'Creators'], mods: ['for beginners', 'for business', 'for creators', 'advanced'],
    subs: [
      { name: 'Applied AI', topics: ['ChatGPT', 'Prompt engineering', 'AI tools', 'AI for business', 'AI content creation', 'AI automation', 'AI agents', 'AI art', 'AI for marketing'] },
      { name: 'ML', topics: ['Machine learning', 'Deep learning', 'Data science', 'Computer vision', 'Natural language processing', 'MLOps'] },
      { name: 'Everyday AI', topics: ['AI for productivity', 'AI writing assistants', 'AI image generation', 'AI for research', 'AI meeting notes'] },
      { name: 'AI Strategy', topics: ['AI adoption in business', 'AI policy & governance', 'AI ethics', 'Building an AI roadmap'] },
    ],
  },
  {
    id: 'no-code', name: 'No-Code & Automation', group: 'Technology & AI', niche: 'tech', business: 'No-Code',
    monetization: 'High', audience: ['Business Owners', 'Creators'], mods: ['for beginners', 'for business'],
    subs: [
      { name: 'No-Code', topics: ['No-code app building', 'Workflow automation', 'Zapier & Make', 'Building websites without code', 'Airtable', 'Notion for business', 'Chatbot building'] },
      { name: 'Building', topics: ['No-code web apps', 'Automation with no-code', 'Internal tools', 'No-code databases'] },
      { name: 'Business', topics: ['No-code agency', 'Selling no-code solutions', 'No-code MVPs'] },
    ],
  },
  {
    id: 'data', name: 'Data & Analytics', group: 'Technology & AI', niche: 'tech', business: 'Data',
    monetization: 'High', audience: ['Professionals'], mods: ['for beginners', 'for business'],
    subs: [
      { name: 'Data Skills', topics: ['Data analysis', 'Excel mastery', 'Google Sheets', 'Dashboards', 'Data visualization', 'Business intelligence', 'Power BI', 'Tableau'] },
      { name: 'Visualization', topics: ['Dashboard design', 'Chart selection', 'Data storytelling', 'Executive data communication'] },
    ],
  },
  {
    id: 'cybersecurity', name: 'Cybersecurity & IT', group: 'Technology & AI', niche: 'tech', business: 'Tech Education',
    monetization: 'Very High', audience: ['Professionals', 'Students'], mods: ['for beginners', 'certification prep'],
    subs: [
      { name: 'Security', topics: ['Cybersecurity basics', 'Ethical hacking', 'Network security', 'Cloud computing', 'IT support skills', 'DevOps', 'Linux administration'] },
      { name: 'Defence', topics: ['Threat modelling', 'Incident response', 'Vulnerability management', 'Zero trust architecture'] },
      { name: 'Offence & Testing', topics: ['Penetration testing', 'Bug bounty hunting', 'Red teaming', 'Social engineering awareness'] },
      { name: 'Governance', topics: ['Security awareness training', 'Compliance frameworks', 'Risk registers'] },
    ],
  },

  // ============================ CREATIVE & CONTENT ============================
  {
    id: 'content-creation', name: 'Content Creation', group: 'Creative & Content', niche: 'creative', business: 'Creator Economy',
    monetization: 'High', audience: ['Creators', 'Business Owners'], mods: ['for beginners', 'to grow fast', 'to monetize'],
    subs: [
      { name: 'Creating', topics: ['Becoming a creator', 'Content strategy', 'Short-form video', 'Storytelling', 'Building an audience', 'Going viral', 'Content repurposing', 'Personal brand'] },
      { name: 'Monetizing', topics: ['Monetizing content', 'Sponsorships & brand deals', 'Digital products', 'Membership communities', 'Creator funnels'] },
      { name: 'Systems', topics: ['Content batching', 'Content repurposing workflows', 'Creator tech stack', 'Editorial standards'] },
      { name: 'Growth', topics: ['Hook writing', 'Series & formats', 'Collaborations', 'Analytics for creators'] },
    ],
  },
  {
    id: 'social-media', name: 'Social Media', group: 'Creative & Content', niche: 'creative', business: 'Social Media',
    monetization: 'High', audience: ['Creators', 'Business Owners'], mods: ['for beginners', 'organic growth', 'for business'],
    subs: [
      { name: 'Platforms', topics: ['Instagram growth', 'TikTok growth', 'YouTube growth', 'LinkedIn growth', 'Twitter/X growth', 'Pinterest marketing', 'Facebook marketing', 'Threads growth'] },
      { name: 'Strategy', topics: ['Social media strategy', 'Community building', 'Content calendars', 'Engagement tactics', 'Social media analytics'] },
      { name: 'Platforms', topics: ['Instagram growth', 'LinkedIn growth', 'TikTok growth', 'Pinterest marketing', 'X/Twitter growth', 'Threads strategy'] },
      { name: 'Practice', topics: ['Social media calendars', 'Community management', 'Social listening', 'Handling negative comments'] },
    ],
  },
  {
    id: 'youtube', name: 'YouTube & Video', group: 'Creative & Content', niche: 'creative', business: 'Video',
    monetization: 'High', audience: ['Creators'], mods: ['for beginners', 'to grow', 'to monetize'],
    subs: [
      { name: 'YouTube', topics: ['Starting a YouTube channel', 'YouTube SEO', 'Video scripting', 'Thumbnail design', 'YouTube automation', 'Faceless YouTube channels', 'YouTube monetization'] },
      { name: 'Production', topics: ['Video editing', 'Filmmaking', 'Live streaming', 'Cinematography', 'Video storytelling'] },
      { name: 'Channel Craft', topics: ['YouTube thumbnails', 'YouTube titles', 'Retention editing', 'Channel positioning'] },
      { name: 'Growth & Money', topics: ['YouTube algorithm', 'YouTube monetization', 'YouTube sponsorships', 'Faceless channels'] },
    ],
  },
  {
    id: 'writing', name: 'Writing & Publishing', group: 'Creative & Content', niche: 'creative', business: 'Writing',
    monetization: 'Medium', audience: ['Creators', 'Professionals'], mods: ['for beginners', 'to get published', 'to earn'],
    subs: [
      { name: 'Writing', topics: ['Blogging', 'Fiction writing', 'Non-fiction writing', 'Ghostwriting', 'Newsletters', 'Poetry', 'Screenwriting', 'Content writing'] },
      { name: 'Publishing', topics: ['Self-publishing', 'Writing a book', 'Kindle publishing', 'Building an author platform', 'Editing & proofreading'] },
      { name: 'Forms', topics: ['Essay writing', 'Newsletter writing', 'Ghostwriting', 'Copy editing', 'Poetry'] },
      { name: 'Practice', topics: ['Daily writing habit', 'Beating writer’s block', 'Finding your writing voice', 'Writing feedback groups'] },
    ],
  },
  {
    id: 'design', name: 'Design & Creativity', group: 'Creative & Content', niche: 'creative', business: 'Design',
    monetization: 'High', audience: ['Creators', 'Professionals'], mods: ['for beginners', 'to freelance'],
    subs: [
      { name: 'Design', topics: ['Graphic design', 'UX/UI design', 'Web design', 'Logo design', 'Canva design', 'Figma', 'Illustration', 'Motion graphics', 'Product design'] },
      { name: 'Specialisms', topics: ['Motion design', 'Icon design', '3D design', 'Presentation design', 'Environmental design'] },
      { name: 'Working', topics: ['Design systems in practice', 'Design handoff', 'Working with developers', 'Design leadership'] },
    ],
  },
  {
    id: 'photography', name: 'Photography & Art', group: 'Creative & Content', niche: 'creative', business: 'Photography',
    monetization: 'Medium', audience: ['Creators', 'Individuals'], mods: ['for beginners', 'to sell'],
    subs: [
      { name: 'Visual Art', topics: ['Photography basics', 'Portrait photography', 'Product photography', 'Photo editing', 'Digital art', 'Drawing', 'Painting', 'Selling art online'] },
      { name: 'Genres', topics: ['Portrait photography', 'Landscape photography', 'Street photography', 'Product photography', 'Event photography', 'Real estate photography'] },
      { name: 'Craft', topics: ['Exposure triangle', 'Composition rules', 'Lighting setups', 'Photo editing workflow', 'Colour management'] },
      { name: 'Business', topics: ['Photography pricing', 'Client galleries', 'Photography contracts', 'Selling prints'] },
    ],
  },
  {
    id: 'music', name: 'Music & Audio', group: 'Creative & Content', niche: 'creative', business: 'Music',
    monetization: 'Medium', audience: ['Creators', 'Individuals'], mods: ['for beginners', 'to earn'],
    subs: [
      { name: 'Music', topics: ['Music production', 'Learning guitar', 'Learning piano', 'Singing', 'Songwriting', 'DJing', 'Beat making', 'Podcasting', 'Audio engineering'] },
    ],
  },

  // ============================ EDUCATION & SKILLS ============================
  {
    id: 'teaching', name: 'Teaching & Courses', group: 'Education & Skills', niche: 'career', business: 'Education',
    monetization: 'High', audience: ['Professionals', 'Creators'], mods: ['online', 'for beginners'],
    subs: [
      { name: 'Teaching', topics: ['Teaching online', 'Course creation', 'Tutoring', 'Curriculum design', 'Instructional design', 'Teaching kids', 'Test preparation', 'Study skills'] },
      { name: 'Practice', topics: ['Formative assessment', 'Questioning techniques', 'Inclusive classrooms', 'Behaviour support'] },
      { name: 'Digital', topics: ['Blended classrooms', 'Educational technology', 'Flipped classroom', 'Online assessment'] },
    ],
  },
  {
    id: 'languages', name: 'Languages', group: 'Education & Skills', niche: 'career', business: 'Language Learning',
    monetization: 'Medium', audience: ['Students', 'Professionals'], mods: ['for beginners', 'to fluency'],
    subs: [
      { name: 'Learning', topics: ['Learning English', 'Learning Spanish', 'Learning French', 'Learning German', 'Language-learning methods', 'Accent training', 'Business English', 'Sign language'] },
      { name: 'Learning Methods', topics: ['Spaced repetition for languages', 'Immersion learning', 'Shadowing technique', 'Language exchange'] },
      { name: 'Skills', topics: ['Listening comprehension', 'Speaking fluency', 'Reading in a new language', 'Accent reduction'] },
    ],
  },

  // ============================ LIFESTYLE & HOBBIES ============================
  {
    id: 'travel', name: 'Travel & Adventure', group: 'Lifestyle & Hobbies', niche: 'creative', business: 'Travel',
    monetization: 'Medium', audience: ['Individuals', 'Creators'], mods: ['on a budget', 'solo', 'for families'],
    subs: [
      { name: 'Travel', topics: ['Travel planning', 'Budget travel', 'Solo travel', 'Travel hacking', 'Van life', 'Backpacking', 'Luxury travel', 'Travel blogging', 'Adventure sports'] },
      { name: 'Styles', topics: ['Budget travel', 'Luxury travel', 'Adventure travel', 'Cultural travel', 'Road trips'] },
      { name: 'Practical', topics: ['Travel photography', 'Packing systems', 'Travel safety', 'Travel insurance', 'Jet lag management'] },
    ],
  },
  {
    id: 'lifestyle', name: 'Lifestyle & Home', group: 'Lifestyle & Hobbies', niche: 'creative', business: 'Lifestyle',
    monetization: 'Medium', audience: ['Individuals'], mods: ['for beginners', 'on a budget'],
    subs: [
      { name: 'Home', topics: ['Minimalism', 'Home organization', 'Interior design', 'Sustainable living', 'Gardening', 'DIY & home improvement', 'Decluttering', 'Feng shui'] },
      { name: 'Style', topics: ['Fashion & style', 'Beauty & skincare', 'Capsule wardrobe', 'Personal styling', 'Makeup artistry'] },
    ],
  },
  {
    id: 'hobbies', name: 'Hobbies & Passions', group: 'Lifestyle & Hobbies', niche: 'creative', business: 'Hobby',
    monetization: 'Low', audience: ['Individuals'], mods: ['for beginners'],
    subs: [
      { name: 'Hobbies', topics: ['Chess', 'Woodworking', 'Knitting & crochet', 'Board games', 'Gaming', 'Collecting', 'Calligraphy', 'Pottery', 'Fishing', 'Hiking'] },
      { name: 'Making', topics: ['Model building', 'Origami', 'Puzzles', 'Bookbinding', 'Candle & soap crafting'] },
      { name: 'Social Hobbies', topics: ['Book clubs', 'Trivia & quizzing', 'Dance social', 'Community sports'] },
    ],
  },
  {
    id: 'pets', name: 'Pets & Animals', group: 'Lifestyle & Hobbies', niche: 'relationships', business: 'Pet Care',
    monetization: 'Medium', audience: ['Individuals'], mods: ['for beginners'],
    subs: [
      { name: 'Pets', topics: ['Dog training', 'Puppy care', 'Cat care', 'Pet nutrition', 'Pet grooming', 'Aquariums', 'Reptile care', 'Pet business'] },
      { name: 'Behaviour', topics: ['Dog behaviour problems', 'Puppy socialisation', 'Cat behaviour', 'Separation anxiety in pets'] },
      { name: 'Health', topics: ['Pet first aid', 'Senior pet care', 'Pet dental care', 'Pet weight management'] },
    ],
  },
  {
    id: 'sustainability', name: 'Sustainability & Environment', group: 'Lifestyle & Hobbies', niche: 'health', business: 'Green Living',
    monetization: 'Low', audience: ['Individuals', 'Business Owners'], mods: ['for beginners', 'at home'],
    subs: [
      { name: 'Green', topics: ['Zero-waste living', 'Sustainable business', 'Renewable energy', 'Composting', 'Ethical consumerism', 'Permaculture', 'Reducing carbon footprint'] },
    ],
  },

  // =====================================================================
  // Expansion — additive only. Existing category ids, subcategory names and
  // topic labels above are frozen: topic ids derive from them, so renaming
  // would orphan saved selections, favourites and stored assessments.
  // =====================================================================

  // ============================ BUSINESS ============================
  {
    id: 'b2b-services', name: 'B2B & Professional Services', group: 'Business', niche: 'business', business: 'B2B Services',
    monetization: 'Very High', audience: ['Business Owners', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Selling B2B', topics: ['B2B lead generation', 'Enterprise sales cycles', 'Account-based marketing', 'RFP & proposal writing', 'Contract negotiation', 'Vendor management'] },
      { name: 'Service Delivery', topics: ['Client success management', 'Service level agreements', 'Professional services automation', 'Scoping & estimating', 'Change orders'] },
      { name: 'Growth', topics: ['Partnership & channel sales', 'Referral programs', 'Strategic alliances', 'Account expansion'] },
      { name: 'Retention', topics: ['Client reporting', 'Quarterly business reviews', 'Renewal conversations'] },
    ],
  },
  {
    id: 'franchising', name: 'Franchising & Licensing', group: 'Business', niche: 'business', business: 'Franchising',
    monetization: 'Very High', audience: ['Business Owners'],
    subs: [
      { name: 'Buying', topics: ['Choosing a franchise', 'Franchise due diligence', 'Franchise financing', 'Multi-unit ownership', 'Franchise disclosure documents'] },
      { name: 'Franchising Your Business', topics: ['Franchising a concept', 'Licensing intellectual property', 'Territory planning', 'Franchisee training systems', 'Royalty models'] },
      { name: 'Operations', topics: ['Franchise operations manual', 'Franchisee support', 'Multi-brand franchising'] },
    ],
  },
  {
    id: 'retail-brick-mortar', name: 'Retail & Local Business', group: 'Business', niche: 'business', business: 'Retail',
    monetization: 'High', audience: ['Business Owners'], mods: ['for beginners'],
    subs: [
      { name: 'Store Operations', topics: ['Opening a retail store', 'Visual merchandising', 'Retail inventory planning', 'Point of sale systems', 'Loss prevention', 'Staff scheduling'] },
      { name: 'Local Growth', topics: ['Foot traffic strategies', 'Local partnerships', 'Community events', 'Loyalty programs', 'Pop-up shops'] },
      { name: 'Experience', topics: ['Store layout', 'Customer service standards', 'Omnichannel retail'] },
    ],
  },
  {
    id: 'hospitality-business', name: 'Hospitality & Food Business', group: 'Business', niche: 'business', business: 'Hospitality',
    monetization: 'High', audience: ['Business Owners'],
    subs: [
      { name: 'Restaurants', topics: ['Opening a restaurant', 'Menu engineering', 'Restaurant cost control', 'Kitchen operations', 'Front of house training'] },
      { name: 'Other Venues', topics: ['Coffee shop business', 'Food truck business', 'Catering business', 'Bar & beverage management', 'Ghost kitchens'] },
      { name: 'Lodging', topics: ['Airbnb hosting', 'Boutique hotel management', 'Short-term rental operations', 'Guest experience design'] },
      { name: 'Marketing', topics: ['Restaurant marketing', 'Menu photography', 'Review management for venues'] },
    ],
  },
  {
    id: 'nonprofit', name: 'Nonprofit & Social Impact', group: 'Business', niche: 'business', business: 'Nonprofit',
    monetization: 'Medium', audience: ['Professionals', 'Business Owners'],
    subs: [
      { name: 'Running a Nonprofit', topics: ['Starting a nonprofit', 'Board governance', 'Volunteer management', 'Nonprofit budgeting', 'Impact measurement'] },
      { name: 'Fundraising', topics: ['Grant writing', 'Donor relations', 'Capital campaigns', 'Crowdfunding for causes', 'Corporate sponsorship'] },
      { name: 'Social Enterprise', topics: ['Social entrepreneurship', 'B-corp certification', 'Mission-driven branding', 'Community organizing'] },
      { name: 'Programs', topics: ['Program design', 'Beneficiary feedback', 'Theory of change'] },
    ],
  },
  {
    id: 'legal-compliance', name: 'Business Legal & Compliance', group: 'Business', niche: 'business', business: 'Legal',
    monetization: 'High', audience: ['Business Owners', 'Professionals'],
    subs: [
      { name: 'Structure', topics: ['Choosing a business entity', 'Partnership agreements', 'Shareholder agreements', 'Business succession planning'] },
      { name: 'Protection', topics: ['Trademarks & brand protection', 'Copyright for creators', 'Patents & inventions', 'Contracts & terms of service', 'Non-disclosure agreements'] },
      { name: 'Compliance', topics: ['Data privacy compliance', 'Employment law basics', 'Business licensing', 'Regulatory risk management'] },
      { name: 'Everyday', topics: ['Terms & privacy policies', 'Client contracts', 'Freelancer agreements'] },
    ],
  },
  {
    id: 'operations-supply', name: 'Operations & Supply Chain', group: 'Business', niche: 'business', business: 'Operations',
    monetization: 'High', audience: ['Business Owners', 'Professionals'],
    subs: [
      { name: 'Supply Chain', topics: ['Supplier sourcing', 'Import & export basics', 'Logistics & fulfilment', 'Warehouse management', 'Demand forecasting'] },
      { name: 'Process', topics: ['Lean & Six Sigma', 'Process mapping', 'Quality management', 'Capacity planning', 'Continuous improvement'] },
      { name: 'Manufacturing', topics: ['Product manufacturing', 'Contract manufacturing', 'Prototyping & tooling', 'Cost of goods reduction'] },
      { name: 'Sustainability', topics: ['Sustainable supply chains', 'Circular operations', 'Packaging reduction'] },
    ],
  },

  // ============================ MARKETING & SALES ============================
  {
    id: 'email-marketing', name: 'Email & Lifecycle Marketing', group: 'Marketing & Sales', niche: 'business', business: 'Marketing',
    monetization: 'Very High', audience: ['Business Owners', 'Creators'], mods: ['for beginners'],
    subs: [
      { name: 'List Building', topics: ['Lead magnets', 'Opt-in forms', 'List segmentation', 'Email deliverability', 'List re-engagement'] },
      { name: 'Campaigns', topics: ['Welcome sequences', 'Email newsletters', 'Promotional campaigns', 'Abandoned cart emails', 'Re-engagement campaigns', 'Email copywriting'] },
      { name: 'Automation', topics: ['Lifecycle automation', 'Behavioural triggers', 'Lead nurturing', 'CRM integration'] },
      { name: 'Advanced', topics: ['Email design systems', 'Dynamic content', 'Send-time optimization'] },
    ],
  },
  {
    id: 'influencer-marketing', name: 'Influencer & Creator Marketing', group: 'Marketing & Sales', niche: 'business', business: 'Marketing',
    monetization: 'High', audience: ['Business Owners', 'Creators'],
    subs: [
      { name: 'Working with Creators', topics: ['Influencer outreach', 'Creator contracts', 'Campaign briefs', 'Micro-influencer strategy', 'Gifting campaigns'] },
      { name: 'Measurement', topics: ['Influencer ROI', 'UGC licensing', 'Attribution for creator campaigns', 'Brand safety'] },
      { name: 'Platforms', topics: ['TikTok creator campaigns', 'YouTube integrations', 'Instagram collaborations'] },
    ],
  },
  {
    id: 'pr-communications', name: 'PR & Communications', group: 'Marketing & Sales', niche: 'business', business: 'Public Relations',
    monetization: 'High', audience: ['Business Owners', 'Professionals'],
    subs: [
      { name: 'Media', topics: ['Press releases', 'Media pitching', 'Journalist relationships', 'Podcast guesting', 'Speaking engagements'] },
      { name: 'Reputation', topics: ['Crisis communications', 'Reputation management', 'Online review management', 'Internal communications'] },
      { name: 'Thought Leadership', topics: ['Building thought leadership', 'Executive ghostwriting', 'Industry awards', 'Analyst relations'] },
      { name: 'Internal', topics: ['Change communications', 'Employee advocacy', 'Leadership communications'] },
    ],
  },
  {
    id: 'community-building', name: 'Community Building', group: 'Marketing & Sales', niche: 'business', business: 'Community',
    monetization: 'High', audience: ['Creators', 'Business Owners'], mods: ['for beginners'],
    subs: [
      { name: 'Launching', topics: ['Starting an online community', 'Choosing a community platform', 'Community onboarding', 'Founding member programs'] },
      { name: 'Engagement', topics: ['Community engagement', 'Moderation & guidelines', 'Community events', 'Ambassador programs', 'Reducing churn'] },
      { name: 'Monetization', topics: ['Paid communities', 'Community-led growth', 'Membership retention'] },
      { name: 'Health', topics: ['Community metrics', 'Reducing lurking', 'Community moderation policy'] },
    ],
  },
  {
    id: 'affiliate-partnerships', name: 'Affiliate & Partner Marketing', group: 'Marketing & Sales', niche: 'business', business: 'Affiliate',
    monetization: 'Very High', audience: ['Creators', 'Business Owners'], mods: ['for beginners'],
    subs: [
      { name: 'As an Affiliate', topics: ['Choosing affiliate offers', 'Affiliate review sites', 'Comparison content', 'Affiliate disclosure', 'Affiliate SEO'] },
      { name: 'Running a Program', topics: ['Launching an affiliate program', 'Recruiting affiliates', 'Commission structures', 'Affiliate fraud prevention'] },
      { name: 'Content', topics: ['Affiliate email marketing', 'Coupon & deal sites', 'Affiliate video content'] },
    ],
  },
  {
    id: 'marketing-analytics', name: 'Marketing Analytics & CRO', group: 'Marketing & Sales', niche: 'business', business: 'Analytics',
    monetization: 'High', audience: ['Business Owners', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Measurement', topics: ['Web analytics setup', 'Attribution modelling', 'Marketing dashboards', 'Cohort analysis', 'Customer lifetime value'] },
      { name: 'Optimization', topics: ['A/B testing', 'Landing page optimization', 'Funnel analysis', 'Heatmaps & session replay', 'Personalization'] },
      { name: 'Experimentation', topics: ['Test design', 'Statistical significance', 'Experiment documentation'] },
    ],
  },
  {
    id: 'local-marketing', name: 'Local & Field Marketing', group: 'Marketing & Sales', niche: 'business', business: 'Marketing',
    monetization: 'Medium', audience: ['Business Owners'],
    subs: [
      { name: 'Local Presence', topics: ['Google Business Profile', 'Local citations', 'Review generation', 'Neighbourhood marketing', 'Direct mail'] },
      { name: 'Events', topics: ['Trade shows', 'Event sponsorship', 'Workshops & seminars', 'Networking events'] },
      { name: 'Service Businesses', topics: ['Home services marketing', 'Restaurant local marketing', 'Clinic marketing'] },
    ],
  },

  // ============================ MONEY & FINANCE ============================
  {
    id: 'retirement-planning', name: 'Retirement Planning', group: 'Money & Finance', niche: 'money', business: 'Financial Planning',
    monetization: 'High', audience: ['Individuals', 'Professionals', 'Seniors'], mods: ['for beginners'],
    subs: [
      { name: 'Saving', topics: ['Retirement accounts', 'Employer matching', 'Catch-up contributions', 'Pension planning'] },
      { name: 'Drawdown', topics: ['Withdrawal strategies', 'Sequence of returns risk', 'Annuities explained', 'Social security planning', 'Healthcare in retirement'] },
      { name: 'Life After Work', topics: ['Retirement lifestyle design', 'Downsizing', 'Encore careers'] },
      { name: 'Transition', topics: ['Phased retirement', 'Part-time work in retirement', 'Retirement identity'] },
    ],
  },
  {
    id: 'financial-independence', name: 'Financial Independence', group: 'Money & Finance', niche: 'money', business: 'Wealth Building',
    monetization: 'High', audience: ['Individuals', 'Professionals'],
    subs: [
      { name: 'FIRE', topics: ['Financial independence basics', 'Savings rate optimization', 'Coast FIRE', 'Lean vs fat FIRE', 'Safe withdrawal rates'] },
      { name: 'Income Streams', topics: ['Passive income', 'Dividend income', 'Rental income', 'Royalty income', 'Multiple income streams'] },
      { name: 'Lifestyle', topics: ['Geographic arbitrage', 'Minimalist finance', 'Barista FIRE'] },
    ],
  },
  {
    id: 'debt-credit', name: 'Debt & Credit', group: 'Money & Finance', niche: 'money', business: 'Personal Finance',
    monetization: 'Medium', audience: ['Individuals'], mods: ['for beginners'],
    subs: [
      { name: 'Getting Out of Debt', topics: ['Debt payoff strategies', 'Debt snowball vs avalanche', 'Student loan repayment', 'Medical debt', 'Debt consolidation'] },
      { name: 'Credit', topics: ['Building credit', 'Credit score improvement', 'Credit card rewards', 'Credit repair', 'Avoiding credit traps'] },
      { name: 'Recovery', topics: ['Debt collection rights', 'Bankruptcy basics', 'Rebuilding after default'] },
    ],
  },
  {
    id: 'taxes', name: 'Taxes & Tax Strategy', group: 'Money & Finance', niche: 'money', business: 'Tax',
    monetization: 'High', audience: ['Individuals', 'Business Owners'], mods: ['for beginners'],
    subs: [
      { name: 'Personal Tax', topics: ['Tax filing basics', 'Deductions & credits', 'Capital gains tax', 'Tax-advantaged accounts'] },
      { name: 'Business Tax', topics: ['Self-employment tax', 'Business deductions', 'Quarterly estimated taxes', 'Sales tax compliance', 'Payroll tax'] },
      { name: 'Planning', topics: ['Tax-loss harvesting', 'Entity tax strategy', 'Working with an accountant'] },
      { name: 'International', topics: ['Cross-border tax basics', 'Digital nomad tax', 'VAT & GST basics'] },
    ],
  },
  {
    id: 'insurance-risk', name: 'Insurance & Risk', group: 'Money & Finance', niche: 'money', business: 'Insurance',
    monetization: 'Medium', audience: ['Individuals', 'Business Owners'],
    subs: [
      { name: 'Personal Cover', topics: ['Life insurance', 'Health insurance choices', 'Disability insurance', 'Home & auto insurance', 'Travel insurance'] },
      { name: 'Business Cover', topics: ['Business liability insurance', 'Professional indemnity', 'Key person insurance', 'Cyber insurance'] },
      { name: 'Claims', topics: ['Making a claim', 'Claim disputes', 'Choosing excess levels'] },
    ],
  },
  {
    id: 'estate-planning', name: 'Estate & Legacy Planning', group: 'Money & Finance', niche: 'money', business: 'Financial Planning',
    monetization: 'High', audience: ['Individuals', 'Seniors'],
    subs: [
      { name: 'Essentials', topics: ['Writing a will', 'Setting up a trust', 'Power of attorney', 'Beneficiary planning', 'Digital estate planning'] },
      { name: 'Wealth Transfer', topics: ['Generational wealth', 'Inheritance conversations', 'Charitable giving', 'Family governance'] },
      { name: 'Digital & Modern', topics: ['Digital assets in wills', 'Crypto inheritance', 'Online will services'] },
    ],
  },
  {
    id: 'frugal-living', name: 'Frugal & Mindful Spending', group: 'Money & Finance', niche: 'money', business: 'Personal Finance',
    monetization: 'Low', audience: ['Individuals', 'Parents'], mods: ['for families'],
    subs: [
      { name: 'Saving Money', topics: ['Grocery budgeting', 'Cutting household bills', 'No-spend challenges', 'Couponing & cashback', 'Buying used'] },
      { name: 'Money Mindset', topics: ['Money psychology', 'Emotional spending', 'Money conversations with a partner', 'Teaching kids about money'] },
      { name: 'Big Ticket', topics: ['Negotiating bills', 'Buying a used car cheaply', 'Cheap travel', 'Frugal home improvements'] },
    ],
  },

  // ============================ CAREER & WORK ============================
  {
    id: 'job-search', name: 'Job Search & Hiring Process', group: 'Career & Work', niche: 'career', business: 'Career Services',
    monetization: 'High', audience: ['Professionals', 'Students'], mods: ['for beginners', 'for career changers'],
    subs: [
      { name: 'Applying', topics: ['Resume writing', 'Cover letters', 'LinkedIn optimization', 'Applicant tracking systems', 'Job search strategy'] },
      { name: 'Interviewing', topics: ['Interview preparation', 'Behavioural interviews', 'Technical interviews', 'Case interviews', 'Salary negotiation', 'Reference checks'] },
      { name: 'Landing', topics: ['Evaluating job offers', 'First 90 days', 'Onboarding successfully'] },
      { name: 'Modern Search', topics: ['Networking your way in', 'Referral strategies', 'Recruiter relationships', 'Job search tracking'] },
      { name: 'Special Cases', topics: ['Career gaps', 'Age bias in hiring', 'International job search', 'Visa sponsorship search'] },
    ],
  },
  {
    id: 'career-change', name: 'Career Change & Reinvention', group: 'Career & Work', niche: 'career', business: 'Career Coaching',
    monetization: 'High', audience: ['Professionals'],
    subs: [
      { name: 'Deciding', topics: ['Career pivots', 'Transferable skills', 'Career assessment', 'Informational interviews', 'Testing a new field'] },
      { name: 'Transitioning', topics: ['Breaking into tech', 'Corporate to entrepreneur', 'Returning to work after a break', 'Second-act careers', 'Portfolio careers'] },
      { name: 'Practical', topics: ['Retraining options', 'Funding a career change', 'Career change at 40', 'Career change at 50'] },
    ],
  },
  {
    id: 'workplace-skills', name: 'Workplace Skills', group: 'Career & Work', niche: 'career', business: 'Professional Development',
    monetization: 'Medium', audience: ['Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Working With People', topics: ['Workplace communication', 'Managing up', 'Difficult conversations at work', 'Office politics', 'Cross-functional collaboration'] },
      { name: 'Performance', topics: ['Performance reviews', 'Personal branding at work', 'Executive presence', 'Business writing', 'Meeting facilitation'] },
      { name: 'Wellbeing', topics: ['Work-life balance', 'Workplace burnout', 'Setting boundaries at work', 'Imposter syndrome'] },
      { name: 'Digital Skills', topics: ['Spreadsheet skills', 'Presentation software', 'Collaboration tools', 'AI tools at work'] },
    ],
  },
  {
    id: 'hr-recruiting', name: 'HR & Talent', group: 'Career & Work', niche: 'career', business: 'Human Resources',
    monetization: 'High', audience: ['Professionals', 'Business Owners'],
    subs: [
      { name: 'Hiring', topics: ['Recruiting strategy', 'Writing job descriptions', 'Structured interviewing', 'Employer branding', 'Technical recruiting'] },
      { name: 'People Ops', topics: ['Employee onboarding', 'Compensation & benefits', 'Performance management', 'Employee retention', 'HR compliance'] },
      { name: 'Culture', topics: ['Company culture design', 'Diversity & inclusion', 'Employee engagement', 'Remote team culture'] },
      { name: 'Modern HR', topics: ['Remote hiring', 'Skills-based hiring', 'HR analytics', 'Employee experience'] },
    ],
  },
  {
    id: 'project-management', name: 'Project & Program Management', group: 'Career & Work', niche: 'career', business: 'Project Management',
    monetization: 'High', audience: ['Professionals'], mods: ['for beginners', 'certification prep'],
    subs: [
      { name: 'Methods', topics: ['Agile & Scrum', 'Kanban', 'Waterfall planning', 'Hybrid project management', 'PRINCE2 & PMP'] },
      { name: 'Delivery', topics: ['Project scoping', 'Risk management', 'Stakeholder management', 'Resource planning', 'Project reporting'] },
      { name: 'Tools', topics: ['Project management tools', 'Roadmapping', 'Capacity dashboards'] },
      { name: 'Domains', topics: ['Construction project management', 'IT project management', 'Event project management', 'Marketing project management'] },
      { name: 'Soft Skills', topics: ['Managing project conflict', 'Executive updates', 'Managing scope creep'] },
    ],
  },
  {
    id: 'consulting-career', name: 'Consulting & Advisory', group: 'Career & Work', niche: 'career', business: 'Consulting',
    monetization: 'Very High', audience: ['Professionals'],
    subs: [
      { name: 'Becoming a Consultant', topics: ['Independent consulting', 'Consulting niches', 'Consulting rates', 'Statement of work', 'Consulting proposals'] },
      { name: 'Practice', topics: ['Discovery workshops', 'Diagnostic frameworks', 'Client presentations', 'Advisory boards', 'Fractional executive roles'] },
      { name: 'Delivery', topics: ['Workshop design', 'Consulting deliverables', 'Managing consulting projects'] },
    ],
  },

  // ============================ HEALTH & FITNESS ============================
  {
    id: 'womens-health', name: "Women's Health", group: 'Health & Fitness', niche: 'health', business: 'Health Coaching',
    monetization: 'High', audience: ['Individuals'],
    subs: [
      { name: 'Life Stages', topics: ['Menstrual cycle health', 'Fertility & conception', 'Pregnancy wellness', 'Postpartum recovery', 'Perimenopause', 'Menopause'] },
      { name: 'Wellbeing', topics: ['Hormonal balance', 'Pelvic floor health', 'PCOS management', 'Cycle syncing workouts'] },
      { name: 'Prevention', topics: ['Health screening for women', 'Bone health for women', 'Breast health awareness'] },
    ],
  },
  {
    id: 'mens-health', name: "Men's Health", group: 'Health & Fitness', niche: 'health', business: 'Health Coaching',
    monetization: 'High', audience: ['Individuals'],
    subs: [
      { name: 'Physical', topics: ['Testosterone health', 'Prostate health', 'Male fitness over 40', 'Hair loss', 'Cardiovascular health for men'] },
      { name: 'Mental', topics: ["Men's mental health", 'Male loneliness', 'Fatherhood wellbeing'] },
      { name: 'Prevention', topics: ['Health screening for men', 'Heart health checks', 'Men and doctor visits'] },
    ],
  },
  {
    id: 'senior-health', name: 'Healthy Ageing', group: 'Health & Fitness', niche: 'health', business: 'Senior Wellness',
    monetization: 'Medium', audience: ['Seniors', 'Individuals'],
    subs: [
      { name: 'Movement', topics: ['Senior fitness', 'Balance & fall prevention', 'Chair exercises', 'Joint-friendly workouts', 'Mobility for seniors'] },
      { name: 'Longevity', topics: ['Longevity habits', 'Bone density', 'Cognitive health', 'Ageing in place', 'Managing chronic conditions'] },
      { name: 'Daily Living', topics: ['Medication management', 'Nutrition for seniors', 'Staying social in later life'] },
    ],
  },
  {
    id: 'sports-performance', name: 'Sports & Performance', group: 'Health & Fitness', niche: 'health', business: 'Sports Coaching',
    monetization: 'High', audience: ['Individuals', 'Students'], mods: ['for beginners'],
    subs: [
      { name: 'Team Sports', topics: ['Football coaching', 'Basketball skills', 'Soccer training', 'Cricket coaching', 'Volleyball fundamentals'] },
      { name: 'Individual Sports', topics: ['Tennis technique', 'Golf improvement', 'Swimming technique', 'Martial arts', 'Boxing training', 'Rock climbing'] },
      { name: 'Athlete Support', topics: ['Sports psychology', 'Athlete nutrition', 'Speed & agility', 'Youth athlete development'] },
      { name: 'Recovery & Nutrition', topics: ['Athlete recovery', 'Hydration for athletes', 'Travel for competition'] },
    ],
  },

  // ============================ FOOD & COOKING ============================

  // ============================ MIND & GROWTH ============================

  // ============================ RELATIONSHIPS & FAMILY ============================

  // ============================ TECHNOLOGY & AI ============================
  {
    id: 'web-development', name: 'Web Development', group: 'Technology & AI', niche: 'tech', business: 'Software',
    monetization: 'Very High', audience: ['Professionals', 'Students'], mods: ['for beginners', 'advanced'],
    subs: [
      { name: 'Frontend', topics: ['HTML & CSS', 'JavaScript fundamentals', 'React development', 'Responsive design', 'Web accessibility', 'Frontend performance'] },
      { name: 'Backend', topics: ['Node.js', 'APIs & REST', 'Databases for web apps', 'Authentication & sessions', 'Serverless functions'] },
      { name: 'Full Stack', topics: ['Full-stack projects', 'Deployment & hosting', 'Web security basics', 'Testing web apps'] },
      { name: 'Frameworks', topics: ['Next.js development', 'Vue development', 'Svelte development', 'Astro & static sites'] },
      { name: 'Practices', topics: ['Web performance optimization', 'Progressive enhancement', 'Responsive images', 'Web animations'] },
    ],
  },
  {
    id: 'mobile-development', name: 'Mobile Development', group: 'Technology & AI', niche: 'tech', business: 'Software',
    monetization: 'Very High', audience: ['Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Platforms', topics: ['iOS development', 'Android development', 'React Native', 'Flutter', 'Progressive web apps'] },
      { name: 'Shipping', topics: ['App store optimization', 'Mobile app monetization', 'Push notifications', 'Mobile analytics', 'App launch strategy'] },
      { name: 'Quality', topics: ['Mobile performance', 'Mobile accessibility', 'Offline-first apps'] },
    ],
  },
  {
    id: 'cloud-devops', name: 'Cloud & DevOps', group: 'Technology & AI', niche: 'tech', business: 'Cloud',
    monetization: 'Very High', audience: ['Professionals'], mods: ['for beginners', 'certification prep'],
    subs: [
      { name: 'Cloud', topics: ['AWS fundamentals', 'Azure fundamentals', 'Google Cloud', 'Cloud cost optimization', 'Cloud migration'] },
      { name: 'DevOps', topics: ['CI/CD pipelines', 'Docker & containers', 'Kubernetes', 'Infrastructure as code', 'Monitoring & observability', 'Site reliability engineering'] },
      { name: 'Cost & Scale', topics: ['FinOps', 'Autoscaling', 'Multi-region architecture', 'Disaster recovery'] },
    ],
  },
  {
    id: 'product-management', name: 'Product Management', group: 'Technology & AI', niche: 'tech', business: 'Product',
    monetization: 'Very High', audience: ['Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Discovery', topics: ['User research', 'Customer interviews', 'Jobs to be done', 'Product discovery', 'Competitive analysis'] },
      { name: 'Delivery', topics: ['Product roadmaps', 'Prioritization frameworks', 'Writing specs', 'Working with engineers', 'Product launches'] },
      { name: 'Growth', topics: ['Product-led growth', 'Activation & onboarding', 'Retention metrics', 'Pricing & packaging'] },
      { name: 'Specialisms', topics: ['Technical product management', 'Growth product management', 'Platform product management', 'AI product management'] },
      { name: 'Career', topics: ['Breaking into product', 'Product interviews', 'Product portfolios', 'Associate PM programs'] },
    ],
  },
  {
    id: 'ux-design', name: 'UX & Product Design', group: 'Technology & AI', niche: 'creative', business: 'Design',
    monetization: 'High', audience: ['Professionals', 'Creators'], mods: ['for beginners'],
    subs: [
      { name: 'UX', topics: ['UX research', 'Information architecture', 'Wireframing', 'Usability testing', 'Interaction design'] },
      { name: 'UI', topics: ['Design systems', 'Prototyping in Figma', 'Visual hierarchy', 'Mobile UI patterns', 'Accessibility in design'] },
      { name: 'Career', topics: ['UX portfolios', 'Design critique', 'Freelance UX work'] },
      { name: 'Research Depth', topics: ['Usability testing methods', 'Diary studies', 'Survey design', 'Analytics-informed design'] },
      { name: 'Specialisms', topics: ['Service design', 'Conversation design', 'Design ops', 'Inclusive design'] },
    ],
  },
  {
    id: 'blockchain-web3', name: 'Blockchain & Web3', group: 'Technology & AI', niche: 'tech', business: 'Web3',
    monetization: 'High', audience: ['Professionals', 'Individuals'], mods: ['for beginners'],
    subs: [
      { name: 'Fundamentals', topics: ['Blockchain basics', 'Smart contracts', 'Wallets & custody', 'Decentralized apps', 'Tokenomics'] },
      { name: 'Applications', topics: ['NFTs', 'DeFi protocols', 'DAOs', 'Web3 security', 'On-chain analytics'] },
      { name: 'Building', topics: ['Solidity development', 'Web3 frontends', 'Smart contract auditing'] },
    ],
  },
  {
    id: 'game-development', name: 'Game Development', group: 'Technology & AI', niche: 'creative', business: 'Gaming',
    monetization: 'High', audience: ['Creators', 'Students'], mods: ['for beginners'],
    subs: [
      { name: 'Building', topics: ['Unity development', 'Unreal Engine', 'Godot', 'Game physics', 'Level design', 'Game art & sprites'] },
      { name: 'Shipping', topics: ['Indie game marketing', 'Steam launches', 'Mobile game monetization', 'Playtesting'] },
      { name: 'Design', topics: ['Game design fundamentals', 'Game balancing', 'Narrative design', 'UI for games'] },
    ],
  },
  {
    id: 'it-support', name: 'IT & Systems', group: 'Technology & AI', niche: 'tech', business: 'IT Services',
    monetization: 'High', audience: ['Professionals'], mods: ['certification prep'],
    subs: [
      { name: 'Support', topics: ['Help desk skills', 'Hardware troubleshooting', 'Operating systems', 'Device management', 'IT documentation'] },
      { name: 'Networks', topics: ['Networking fundamentals', 'Wi-Fi & routing', 'VPNs', 'Network troubleshooting', 'Windows Server administration'] },
      { name: 'Cloud & Modern IT', topics: ['Microsoft 365 administration', 'Google Workspace administration', 'Endpoint management', 'Identity management'] },
    ],
  },
  {
    id: 'robotics-iot', name: 'Robotics, IoT & Makers', group: 'Technology & AI', niche: 'tech', business: 'Hardware',
    monetization: 'Medium', audience: ['Creators', 'Students'], mods: ['for beginners'],
    subs: [
      { name: 'Making', topics: ['Arduino projects', 'Raspberry Pi projects', 'Home automation', '3D printing', 'Electronics basics', 'CAD for makers'] },
      { name: 'Robotics', topics: ['Robotics fundamentals', 'Drones', 'Sensors & actuators', 'Embedded programming'] },
      { name: 'Applications', topics: ['Smart agriculture', 'Industrial IoT', 'Wearable devices', 'Home robotics'] },
    ],
  },

  // ============================ CREATIVE & CONTENT ============================
  {
    id: 'podcasting', name: 'Podcasting', group: 'Creative & Content', niche: 'creative', business: 'Podcasting',
    monetization: 'High', audience: ['Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Producing', topics: ['Starting a podcast', 'Podcast equipment', 'Podcast editing', 'Show structure', 'Interviewing guests', 'Podcast hosting platforms'] },
      { name: 'Growing', topics: ['Podcast growth', 'Podcast SEO', 'Cross-promotion', 'Podcast sponsorship', 'Repurposing episodes'] },
      { name: 'Formats', topics: ['Interview podcasts', 'Solo podcasts', 'Narrative podcasts', 'Video podcasts'] },
      { name: 'Craft', topics: ['Podcast intros', 'Show notes', 'Podcast interviewing', 'Editing for pacing'] },
    ],
  },
  {
    id: 'video-production', name: 'Video Production', group: 'Creative & Content', niche: 'creative', business: 'Video',
    monetization: 'High', audience: ['Creators', 'Professionals'], mods: ['for beginners', 'advanced'],
    subs: [
      { name: 'Shooting', topics: ['Camera settings', 'Lighting for video', 'Audio for video', 'Filming on a phone', 'Studio setup'] },
      { name: 'Editing', topics: ['Video editing', 'Colour grading', 'Motion graphics', 'Sound design', 'Editing workflow'] },
      { name: 'Formats', topics: ['Short-form video', 'Documentary storytelling', 'Corporate video', 'Livestreaming'] },
    ],
  },
  {
    id: 'newsletters', name: 'Newsletters & Audience', group: 'Creative & Content', niche: 'creative', business: 'Media',
    monetization: 'High', audience: ['Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Building', topics: ['Starting a newsletter', 'Newsletter niches', 'Writing cadence', 'Subscriber growth', 'Newsletter design'] },
      { name: 'Monetizing', topics: ['Paid newsletters', 'Newsletter sponsorship', 'Newsletter to product', 'Audience surveys'] },
      { name: 'Craft', topics: ['Newsletter voice', 'Subject lines', 'Newsletter formats', 'Curation newsletters'] },
    ],
  },
  {
    id: 'blogging', name: 'Blogging & Niche Sites', group: 'Creative & Content', niche: 'creative', business: 'Content',
    monetization: 'High', audience: ['Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Building', topics: ['Starting a blog', 'Niche site strategy', 'Content clusters', 'Blog monetization', 'Display ad networks'] },
      { name: 'Writing', topics: ['Blog post structure', 'Editorial calendars', 'Guest posting', 'Content refreshes'] },
      { name: 'Monetization Depth', topics: ['Sponsored posts', 'Digital products on a blog', 'Blog email funnels'] },
    ],
  },
  {
    id: 'publishing-books', name: 'Books & Publishing', group: 'Creative & Content', niche: 'creative', business: 'Publishing',
    monetization: 'High', audience: ['Creators', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Writing a Book', topics: ['Writing a nonfiction book', 'Writing a novel', 'Book outlining', 'Beating writer’s block', 'Working with an editor'] },
      { name: 'Publishing', topics: ['Self-publishing', 'Traditional publishing', 'Book proposals', 'Book cover design', 'Audiobook production'] },
      { name: 'Selling', topics: ['Book launches', 'Amazon KDP', 'Book marketing', 'Speaking off a book'] },
      { name: 'Craft', topics: ['Developmental editing', 'Beta readers', 'Book structure', 'Writing routines'] },
    ],
  },
  {
    id: 'voice-audio', name: 'Voice & Audio', group: 'Creative & Content', niche: 'creative', business: 'Audio',
    monetization: 'Medium', audience: ['Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Voice Work', topics: ['Voice acting', 'Voiceover business', 'Narration technique', 'Home voice studio'] },
      { name: 'Audio Craft', topics: ['Audio editing', 'Mixing & mastering', 'Field recording', 'Audio branding'] },
      { name: 'Markets', topics: ['Audiobook narration', 'Commercial voiceover', 'Character voice work', 'Corporate narration'] },
    ],
  },
  {
    id: 'illustration-art', name: 'Illustration & Fine Art', group: 'Creative & Content', niche: 'creative', business: 'Art',
    monetization: 'Medium', audience: ['Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Drawing & Painting', topics: ['Drawing fundamentals', 'Digital illustration', 'Watercolour painting', 'Oil & acrylic painting', 'Character design', 'Concept art'] },
      { name: 'Art Business', topics: ['Selling art online', 'Art commissions', 'Print sales', 'Gallery representation', 'Art licensing'] },
      { name: 'Mediums', topics: ['Gouache', 'Coloured pencil', 'Printmaking', 'Mixed media'] },
    ],
  },
  {
    id: 'animation-motion', name: 'Animation & Motion', group: 'Creative & Content', niche: 'creative', business: 'Animation',
    monetization: 'High', audience: ['Creators', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Animation', topics: ['2D animation', '3D animation', 'Character rigging', 'Stop motion', 'Explainer videos'] },
      { name: 'Motion Design', topics: ['After Effects', 'Kinetic typography', 'Logo animation', 'Blender basics'] },
      { name: 'Pipeline', topics: ['Animation storyboarding', 'Rigging workflows', 'Render optimization'] },
    ],
  },

  // ============================ EDUCATION & SKILLS ============================
  {
    id: 'online-courses', name: 'Online Course Creation', group: 'Education & Skills', niche: 'business', business: 'Education',
    monetization: 'Very High', audience: ['Creators', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Building', topics: ['Course curriculum design', 'Recording course videos', 'Course platforms', 'Cohort-based courses', 'Workbooks & worksheets'] },
      { name: 'Selling', topics: ['Course launches', 'Webinar selling', 'Course pricing', 'Student success & completion', 'Evergreen funnels'] },
      { name: 'Teaching', topics: ['Course pedagogy', 'Student engagement', 'Community in courses', 'Live cohort facilitation'] },
      { name: 'Operations', topics: ['Course tech stack', 'Refund policies', 'Student support systems', 'Course updates & maintenance'] },
    ],
  },
  {
    id: 'study-skills', name: 'Study Skills & Exams', group: 'Education & Skills', niche: 'career', business: 'Education',
    monetization: 'Medium', audience: ['Students'], mods: ['for beginners'],
    subs: [
      { name: 'Studying', topics: ['Active recall', 'Spaced repetition', 'Note-taking systems', 'Study schedules', 'Reading comprehension'] },
      { name: 'Exams', topics: ['Exam preparation', 'Test anxiety', 'Standardized test prep', 'Revision techniques'] },
      { name: 'Environment', topics: ['Study spaces', 'Study groups', 'Digital note systems'] },
    ],
  },
  {
    id: 'tutoring-teaching-business', name: 'Tutoring & Teaching Business', group: 'Education & Skills', niche: 'career', business: 'Education',
    monetization: 'High', audience: ['Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Teaching', topics: ['One-to-one tutoring', 'Group tutoring', 'Lesson planning', 'Assessing progress', 'Teaching online'] },
      { name: 'Business', topics: ['Finding tutoring clients', 'Tutoring rates', 'Tutoring agencies', 'Test prep business'] },
      { name: 'Growth', topics: ['Tutoring referrals', 'Group class pricing', 'Tutoring marketing'] },
    ],
  },
  {
    id: 'public-speaking', name: 'Public Speaking & Presenting', group: 'Education & Skills', niche: 'career', business: 'Speaking',
    monetization: 'High', audience: ['Professionals', 'Business Owners'], mods: ['for beginners'],
    subs: [
      { name: 'Delivery', topics: ['Stage presence', 'Overcoming stage fright', 'Vocal delivery', 'Body language', 'Handling Q&A'] },
      { name: 'Content', topics: ['Talk structure', 'Storytelling on stage', 'Slide design', 'Keynote development'] },
      { name: 'Business', topics: ['Getting speaking gigs', 'Speaker fees', 'Speaker reels'] },
      { name: 'Formats', topics: ['Conference talks', 'Panel moderation', 'Wedding & event speeches', 'Podcast guesting', 'Media interviews'] },
      { name: 'Craft Depth', topics: ['Opening lines', 'Using humour', 'Speaking without notes', 'Handling hecklers'] },
    ],
  },
  {
    id: 'memory-learning', name: 'Learning How to Learn', group: 'Education & Skills', niche: 'mind', business: 'Education',
    monetization: 'Medium', audience: ['Students', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Techniques', topics: ['Memory techniques', 'Mind mapping', 'Speed reading', 'Deliberate practice', 'Skill acquisition'] },
      { name: 'Systems', topics: ['Personal knowledge management', 'Second brain systems', 'Learning plans', 'Self-directed learning'] },
      { name: 'Application', topics: ['Learning a new field fast', 'Reading for retention', 'Teaching to learn'] },
    ],
  },
  {
    id: 'certifications', name: 'Certifications & Credentials', group: 'Education & Skills', niche: 'career', business: 'Education',
    monetization: 'High', audience: ['Professionals', 'Students'],
    subs: [
      { name: 'Choosing', topics: ['Choosing a certification', 'Certification ROI', 'Continuing education', 'Professional licensing'] },
      { name: 'Popular Tracks', topics: ['IT certifications', 'Finance certifications', 'Coaching certifications', 'Fitness certifications', 'Project management certifications'] },
      { name: 'Planning', topics: ['Certification study plans', 'Employer sponsorship', 'Recertification'] },
    ],
  },
  {
    id: 'homeschooling', name: 'Homeschooling & Alternative Education', group: 'Education & Skills', niche: 'relationships', business: 'Education',
    monetization: 'Medium', audience: ['Parents'], mods: ['for beginners'],
    subs: [
      { name: 'Getting Started', topics: ['Homeschool curriculum', 'Homeschool legal requirements', 'Homeschool scheduling', 'Deschooling'] },
      { name: 'Approaches', topics: ['Unschooling', 'Montessori at home', 'Charlotte Mason method', 'Worldschooling', 'Homeschool co-ops'] },
      { name: 'Subjects', topics: ['Homeschool maths', 'Homeschool science', 'Homeschool literacy', 'Homeschool arts'] },
    ],
  },

  // ============================ LIFESTYLE & HOME ============================
  {
    id: 'home-diy', name: 'Home Improvement & DIY', group: 'Home & Living', niche: 'creative', business: 'Home Services',
    monetization: 'Medium', audience: ['Individuals'], mods: ['for beginners'],
    subs: [
      { name: 'Projects', topics: ['DIY home repairs', 'Painting & decorating', 'Tiling', 'Flooring installation', 'Basic plumbing', 'Basic electrics'] },
      { name: 'Renovation', topics: ['Kitchen renovation', 'Bathroom renovation', 'Loft conversion', 'Renovation budgeting', 'Hiring contractors'] },
      { name: 'Tools & Skills', topics: ['Power tool basics', 'Woodworking joints', 'Furniture restoration'] },
      { name: 'Outdoor', topics: ['Deck building', 'Fencing', 'Patio laying', 'Shed building', 'Outdoor lighting'] },
      { name: 'Finishing', topics: ['Wallpapering', 'Trim & moulding', 'Cabinet refacing', 'Built-in storage'] },
    ],
  },
  {
    id: 'interior-design', name: 'Interior Design & Styling', group: 'Home & Living', niche: 'creative', business: 'Interior Design',
    monetization: 'High', audience: ['Individuals', 'Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Design', topics: ['Interior design principles', 'Colour schemes', 'Small space design', 'Lighting design', 'Mixing textures'] },
      { name: 'Styling', topics: ['Home staging', 'Styling shelves', 'Seasonal decor', 'Budget decorating', 'Rental-friendly decor'] },
      { name: 'Rooms', topics: ['Bedroom design', 'Kitchen design', 'Bathroom design', 'Home office design ideas'] },
    ],
  },
  {
    id: 'gardening', name: 'Gardening & Growing', group: 'Home & Living', niche: 'health', business: 'Gardening',
    monetization: 'Low', audience: ['Individuals', 'Seniors'], mods: ['for beginners'],
    subs: [
      { name: 'Growing Food', topics: ['Vegetable gardening', 'Container gardening', 'Herb gardens', 'Fruit trees', 'Seed starting'] },
      { name: 'Ornamental', topics: ['Flower gardening', 'Houseplants', 'Succulents', 'Lawn care', 'Landscape design'] },
      { name: 'Methods', topics: ['Organic gardening', 'Hydroponics', 'Raised beds', 'Season extension'] },
      { name: 'Problem Solving', topics: ['Garden pests', 'Plant diseases', 'Soil testing', 'Watering systems'] },
      { name: 'Small Space', topics: ['Balcony gardening', 'Indoor herb gardens', 'Vertical gardens', 'Window boxes'] },
    ],
  },
  {
    id: 'organizing-decluttering', name: 'Organizing & Decluttering', group: 'Home & Living', niche: 'mind', business: 'Home Organization',
    monetization: 'Medium', audience: ['Individuals', 'Parents'], mods: ['for beginners'],
    subs: [
      { name: 'Decluttering', topics: ['Decluttering methods', 'Minimalism', 'Capsule living', 'Sentimental items', 'Digital decluttering'] },
      { name: 'Systems', topics: ['Home organization systems', 'Closet organization', 'Kitchen organization', 'Paperwork systems', 'Professional organizing business'] },
      { name: 'Life Events', topics: ['Decluttering after loss', 'Organising before a move', 'New baby organisation'] },
    ],
  },
  {
    id: 'automotive', name: 'Cars & Automotive', group: 'Home & Living', niche: 'tech', business: 'Automotive',
    monetization: 'Medium', audience: ['Individuals'], mods: ['for beginners'],
    subs: [
      { name: 'Ownership', topics: ['Car maintenance', 'Buying a used car', 'Car detailing', 'Fuel efficiency', 'Electric vehicles'] },
      { name: 'Enthusiast', topics: ['Car restoration', 'Performance tuning', 'Motorcycles', 'Track driving', 'Car photography'] },
      { name: 'Ownership Costs', topics: ['Car insurance', 'Financing a car', 'Depreciation', 'Running cost comparison'] },
    ],
  },
  {
    id: 'outdoor-adventure', name: 'Outdoors & Adventure', group: 'Lifestyle & Hobbies', niche: 'health', business: 'Outdoor',
    monetization: 'Medium', audience: ['Individuals'], mods: ['for beginners'],
    subs: [
      { name: 'On Foot', topics: ['Hiking & backpacking', 'Camping skills', 'Wild camping', 'Navigation & maps', 'Bushcraft & survival'] },
      { name: 'Water & Snow', topics: ['Kayaking & canoeing', 'Surfing', 'Skiing & snowboarding', 'Scuba diving', 'Sailing'] },
      { name: 'Gear', topics: ['Outdoor gear selection', 'Ultralight packing', 'Outdoor photography'] },
      { name: 'Skills', topics: ['Wild swimming', 'Winter hiking', 'Trip planning outdoors', 'Leave no trace'] },
    ],
  },
  {
    id: 'travel-planning', name: 'Travel Planning & Nomad Life', group: 'Lifestyle & Hobbies', niche: 'creative', business: 'Travel',
    monetization: 'Medium', audience: ['Individuals', 'Creators'], mods: ['on a budget'],
    subs: [
      { name: 'Planning', topics: ['Trip planning', 'Travel hacking & points', 'Solo travel', 'Family travel', 'Slow travel'] },
      { name: 'Living Abroad', topics: ['Digital nomad life', 'Van life', 'Expat living', 'Visas & residency', 'Working across time zones'] },
      { name: 'Destinations', topics: ['Europe travel planning', 'Asia travel planning', 'Africa travel planning', 'Americas travel planning'] },
    ],
  },

  // =====================================================================
  // v3 expansion — still strictly additive (see the note above: topic ids
  // are derived from category id + subcategory name + label and are stored
  // in saved assessments, so nothing existing may be renamed).
  // =====================================================================

  // ============================ BUSINESS ============================
  {
    id: 'saas-business', name: 'SaaS & Software Business', group: 'Business', niche: 'business', business: 'SaaS',
    industry: 'Software', monetization: 'Very High', demand: 'Very High', audience: ['Business Owners', 'Professionals'], mods: ['for founders', 'case studies'],
    subs: [
      { name: 'Building', topics: ['Micro-SaaS', 'SaaS MVP validation', 'Technical co-founder search', 'No-code SaaS', 'Vertical SaaS'] },
      { name: 'Pricing & Packaging', topics: ['SaaS pricing models', 'Freemium strategy', 'Usage-based pricing', 'Enterprise tiers', 'Free trial optimization'] },
      { name: 'Metrics', topics: ['MRR & ARR tracking', 'Churn reduction', 'Net revenue retention', 'CAC payback', 'SaaS unit economics'] },
      { name: 'Go-to-Market', topics: ['Product-led growth', 'SaaS content marketing', 'Outbound for SaaS', 'App marketplace listings', 'Partner integrations'] },
      { name: 'Operations', topics: ['Customer onboarding', 'SaaS support systems', 'Uptime & incident response', 'SaaS security compliance'] },
      { name: 'Support & Success', topics: ['Customer health scores', 'QBR process', 'Expansion revenue', 'Support ticket deflection'] },
    ],
  },
  {
    id: 'subscription-business', name: 'Subscription & Membership Business', group: 'Business', niche: 'business', business: 'Subscription',
    industry: 'Consumer Services', monetization: 'Very High', demand: 'High', audience: ['Business Owners', 'Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Models', topics: ['Membership sites', 'Subscription boxes', 'Paid communities', 'Continuity programs', 'Licensing subscriptions'] },
      { name: 'Retention', topics: ['Reducing subscriber churn', 'Onboarding sequences', 'Member engagement', 'Win-back campaigns', 'Pause instead of cancel'] },
      { name: 'Growth', topics: ['Subscription launches', 'Annual plan strategy', 'Referral loops', 'Tiered memberships'] },
      { name: 'Operations', topics: ['Recurring billing systems', 'Dunning & failed payments', 'Subscription analytics', 'Fulfilment logistics'] },
      { name: 'Community', topics: ['Member events', 'Member spotlights', 'Cohort onboarding'] },
    ],
  },
  {
    id: 'marketplaces', name: 'Marketplaces & Platforms', group: 'Business', niche: 'business', business: 'Marketplace',
    industry: 'Technology', monetization: 'Very High', demand: 'High', audience: ['Business Owners'], mods: ['for beginners', 'case studies'],
    subs: [
      { name: 'Building', topics: ['Two-sided marketplaces', 'Solving cold start', 'Supply acquisition', 'Demand acquisition', 'Marketplace liquidity'] },
      { name: 'Economics', topics: ['Take rate strategy', 'Marketplace trust & safety', 'Payments & escrow', 'Dispute resolution'] },
      { name: 'Niches', topics: ['Service marketplaces', 'Rental marketplaces', 'Local marketplaces', 'B2B marketplaces', 'Creator marketplaces'] },
      { name: 'Scaling', topics: ['Marketplace expansion', 'Category expansion', 'Marketplace SEO', 'Network effects'] },
      { name: 'Quality', topics: ['Review systems', 'Fraud prevention', 'Seller onboarding', 'Marketplace moderation'] },
    ],
  },
  {
    id: 'import-export', name: 'Import, Export & Trading', group: 'Business', niche: 'business', business: 'Trade',
    industry: 'Logistics', monetization: 'High', demand: 'Medium', audience: ['Business Owners'], mods: ['for beginners'],
    subs: [
      { name: 'Getting Started', topics: ['Import business basics', 'Export business basics', 'Finding overseas suppliers', 'Trade documentation', 'Incoterms'] },
      { name: 'Compliance', topics: ['Customs clearance', 'Tariffs & duties', 'Product certification', 'Trade finance', 'Letters of credit'] },
      { name: 'Logistics', topics: ['Freight forwarding', 'Container shipping', 'Last-mile delivery', 'Warehousing abroad'] },
      { name: 'Sourcing', topics: ['China sourcing', 'India sourcing', 'Supplier audits', 'Quality inspection', 'Sample negotiation'] },
      { name: 'Markets', topics: ['Sourcing from Vietnam', 'Sourcing from Turkey', 'Selling into the EU', 'Selling into the US'] },
    ],
  },
  {
    id: 'business-exit', name: 'Buying, Selling & Exiting a Business', group: 'Business', niche: 'business', business: 'M&A',
    industry: 'Finance', monetization: 'Very High', demand: 'Medium', competition: 'Low', audience: ['Business Owners', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Buying', topics: ['Buying a small business', 'Business due diligence', 'Acquisition financing', 'Search funds', 'Seller financing'] },
      { name: 'Valuation', topics: ['Business valuation methods', 'SDE & EBITDA multiples', 'Valuing online businesses', 'Asset vs share sales'] },
      { name: 'Selling', topics: ['Preparing a business for sale', 'Exit planning', 'Working with brokers', 'Negotiating an exit', 'Earn-outs'] },
      { name: 'Transition', topics: ['Post-acquisition integration', 'Handover planning', 'Retaining key staff', 'Life after exit'] },
      { name: 'Deal Process', topics: ['Letters of intent', 'Data rooms', 'Deal structuring', 'Working with lawyers'] },
    ],
  },
  {
    id: 'procurement-vendor', name: 'Procurement & Vendor Management', group: 'Business', niche: 'business', business: 'Procurement',
    industry: 'Operations', monetization: 'High', demand: 'Medium', audience: ['Professionals', 'Business Owners'], mods: ['for beginners'],
    subs: [
      { name: 'Sourcing', topics: ['Strategic sourcing', 'Supplier selection', 'Request for proposal process', 'Supplier scorecards'] },
      { name: 'Negotiation', topics: ['Procurement negotiation', 'Cost reduction programs', 'Volume agreements', 'Total cost of ownership'] },
      { name: 'Risk', topics: ['Supplier risk management', 'Contract compliance', 'Single-source risk', 'Ethical sourcing'] },
      { name: 'Systems', topics: ['Procure-to-pay systems', 'Spend analytics', 'Purchase approval workflows'] },
      { name: 'Categories', topics: ['IT procurement', 'Facilities procurement', 'Marketing procurement', 'Logistics procurement'] },
    ],
  },
  {
    id: 'family-business', name: 'Family & Legacy Business', group: 'Business', niche: 'business', business: 'Family Business',
    industry: 'Business Services', monetization: 'High', demand: 'Medium', competition: 'Low', audience: ['Business Owners'], mods: ['case studies'],
    subs: [
      { name: 'Governance', topics: ['Family business governance', 'Family councils', 'Shareholder agreements for families', 'Conflict between generations'] },
      { name: 'Succession', topics: ['Succession planning', 'Preparing the next generation', 'Bringing children into the business', 'Exiting the founder role'] },
      { name: 'Professionalising', topics: ['Hiring non-family executives', 'Formalising family pay', 'Separating family and business finances'] },
      { name: 'Legacy', topics: ['Family wealth stewardship', 'Philanthropy planning', 'Preserving founder values'] },
      { name: 'Working Together', topics: ['Roles for family members', 'Fair vs equal pay', 'In-law involvement'] },
    ],
  },
  {
    id: 'business-analytics', name: 'Business Intelligence & Reporting', group: 'Business', niche: 'business', business: 'Analytics',
    industry: 'Data', monetization: 'High', demand: 'High', audience: ['Professionals', 'Business Owners'], mods: ['for beginners', 'case studies'],
    subs: [
      { name: 'Reporting', topics: ['Executive dashboards', 'KPI design', 'Management reporting packs', 'Board reporting'] },
      { name: 'Analysis', topics: ['Cohort analysis for business', 'Profitability analysis', 'Scenario modelling', 'Variance analysis'] },
      { name: 'Tools', topics: ['Spreadsheet modelling', 'BI tool selection', 'Data warehousing basics', 'Self-serve analytics'] },
      { name: 'Culture', topics: ['Data-driven decision making', 'Metric definitions & governance', 'Avoiding vanity metrics'] },
      { name: 'Forecasting', topics: ['Revenue forecasting', 'Headcount planning', 'Demand planning'] },
    ],
  },

  // ============================ MARKETING & SALES ============================
  {
    id: 'content-strategy', name: 'Content Strategy', group: 'Marketing & Sales', niche: 'business', business: 'Content Marketing',
    industry: 'Marketing', monetization: 'High', demand: 'Very High', audience: ['Business Owners', 'Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Planning', topics: ['Content strategy frameworks', 'Editorial calendars', 'Content pillars', 'Audience research', 'Content audits'] },
      { name: 'Production', topics: ['Content workflows', 'Briefing writers', 'Content repurposing', 'Batch content creation', 'Style guides'] },
      { name: 'Distribution', topics: ['Content distribution', 'Channel strategy', 'Content syndication', 'Internal linking strategy'] },
      { name: 'Measurement', topics: ['Content ROI', 'Content scoring', 'Traffic attribution', 'Content refresh strategy'] },
      { name: 'SEO Content', topics: ['Keyword-led content', 'Content briefs', 'Topic clusters', 'Content pruning'] },
    ],
  },
  {
    id: 'video-marketing', name: 'Video Marketing', group: 'Marketing & Sales', niche: 'business', business: 'Video Marketing',
    industry: 'Marketing', monetization: 'High', demand: 'Very High', audience: ['Business Owners', 'Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Strategy', topics: ['Video marketing strategy', 'Video funnels', 'Product demo videos', 'Testimonial videos'] },
      { name: 'Short-Form', topics: ['Reels for business', 'TikTok for business', 'YouTube Shorts strategy', 'Hook writing for video'] },
      { name: 'Long-Form', topics: ['YouTube for business', 'Webinar production', 'Video sales letters', 'Documentary-style brand video'] },
      { name: 'Distribution', topics: ['Video SEO', 'Video ads', 'Repurposing video clips', 'Captions & accessibility'] },
      { name: 'Live', topics: ['Live shopping', 'Webinar promotion', 'Virtual events', 'Live Q&A formats'] },
    ],
  },
  {
    id: 'sms-messaging-marketing', name: 'SMS & Messaging Marketing', group: 'Marketing & Sales', niche: 'business', business: 'Marketing',
    industry: 'Marketing', monetization: 'High', demand: 'Medium', audience: ['Business Owners'], mods: ['for beginners'],
    subs: [
      { name: 'Channels', topics: ['SMS marketing', 'WhatsApp marketing', 'Messenger marketing', 'Push notification strategy', 'RCS messaging'] },
      { name: 'Campaigns', topics: ['SMS campaign design', 'Conversational commerce', 'Abandoned cart texts', 'Appointment reminders'] },
      { name: 'Compliance', topics: ['Messaging opt-in compliance', 'Frequency & fatigue', 'Message deliverability'] },
      { name: 'Automation', topics: ['Two-way SMS automation', 'Chatbot flows', 'Segmented broadcast'] },
    ],
  },
  {
    id: 'growth-experiments', name: 'Growth & Experimentation', group: 'Marketing & Sales', niche: 'business', business: 'Growth',
    industry: 'Marketing', monetization: 'Very High', demand: 'High', audience: ['Professionals', 'Business Owners'], mods: ['for beginners', 'case studies'],
    subs: [
      { name: 'Process', topics: ['Growth experiment design', 'Experiment backlogs', 'ICE & RICE prioritization', 'Growth team structure'] },
      { name: 'Acquisition', topics: ['Viral loops', 'Referral program design', 'Landing page experiments', 'Channel testing'] },
      { name: 'Activation', topics: ['Onboarding experiments', 'Aha-moment analysis', 'Time-to-value reduction'] },
      { name: 'Retention', topics: ['Retention experiments', 'Habit loops in products', 'Resurrection campaigns'] },
      { name: 'Monetization Tests', topics: ['Pricing experiments', 'Paywall testing', 'Upsell experiments'] },
    ],
  },
  {
    id: 'account-based-marketing', name: 'Account-Based & Enterprise Marketing', group: 'Marketing & Sales', niche: 'business', business: 'B2B Marketing',
    industry: 'Marketing', monetization: 'Very High', demand: 'Medium', competition: 'Low', audience: ['Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Targeting', topics: ['Ideal customer profiles', 'Account selection', 'Buying committee mapping', 'Intent data'] },
      { name: 'Campaigns', topics: ['ABM campaign design', 'Personalized outreach at scale', 'Executive gifting', 'Field marketing events'] },
      { name: 'Alignment', topics: ['Sales and marketing alignment', 'Service level agreements', 'Pipeline reviews'] },
      { name: 'Measurement', topics: ['ABM measurement', 'Pipeline velocity', 'Multi-touch attribution'] },
      { name: 'Content', topics: ['Personalised microsites', 'Executive content', 'Customer advisory boards'] },
    ],
  },
  {
    id: 'ecommerce-marketing', name: 'E-commerce Marketing', group: 'Marketing & Sales', niche: 'business', business: 'E-commerce',
    industry: 'Retail', monetization: 'Very High', demand: 'Very High', audience: ['Business Owners', 'Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Acquisition', topics: ['Shopping ads', 'Marketplace advertising', 'Influencer seeding', 'UGC ad creative'] },
      { name: 'Merchandising', topics: ['Product page optimization', 'Bundling & upsells', 'Pricing promotions', 'Category page strategy'] },
      { name: 'Lifecycle', topics: ['Post-purchase flows', 'Subscription & replenishment', 'Loyalty programs for stores', 'Review generation'] },
      { name: 'Analytics', topics: ['E-commerce analytics', 'Contribution margin by product', 'Return rate reduction'] },
      { name: 'Retention', topics: ['Email flows for stores', 'SMS for stores', 'Win-back offers', 'Referral for stores'] },
    ],
  },
  {
    id: 'marketing-ops', name: 'Marketing Operations & Automation', group: 'Marketing & Sales', niche: 'business', business: 'Marketing Ops',
    industry: 'Marketing', monetization: 'High', demand: 'High', audience: ['Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Systems', topics: ['Marketing automation platforms', 'CRM administration', 'Lead routing', 'Data hygiene'] },
      { name: 'Process', topics: ['Lead scoring models', 'Campaign operations', 'Marketing SLAs', 'Templates & governance'] },
      { name: 'Integration', topics: ['Martech stack design', 'Webhook & API integrations', 'Customer data platforms'] },
      { name: 'Privacy', topics: ['Consent management', 'Cookieless tracking', 'First-party data strategy'] },
      { name: 'Reporting', topics: ['Marketing dashboards', 'Pipeline reporting', 'Budget tracking'] },
    ],
  },

  // ============================ MONEY & FINANCE ============================
  {
    id: 'real-estate-investing', name: 'Real Estate Investing', group: 'Money & Finance', niche: 'money', business: 'Real Estate',
    industry: 'Real Estate', monetization: 'Very High', demand: 'High', audience: ['Individuals', 'Business Owners'], mods: ['for beginners', 'case studies', 'with little money down'],
    subs: [
      { name: 'Residential', topics: ['Buy and hold rentals', 'House hacking', 'BRRRR method', 'Fix and flip', 'Turnkey rentals'] },
      { name: 'Commercial', topics: ['Multifamily investing', 'Commercial real estate', 'Self-storage investing', 'Industrial property', 'Retail property'] },
      { name: 'Financing', topics: ['Investment property financing', 'Hard money lending', 'Creative financing', 'Refinancing strategy', 'Real estate syndication'] },
      { name: 'Operations', topics: ['Property management', 'Tenant screening', 'Rental pricing', 'Maintenance systems', 'Eviction process'] },
      { name: 'Analysis', topics: ['Deal analysis', 'Cash-on-cash return', 'Cap rate analysis', 'Market selection'] },
      { name: 'Short-Term Rentals', topics: ['Airbnb investing', 'Short-term rental regulation', 'Dynamic pricing', 'Guest experience'] },
    ],
  },
  {
    id: 'forex-derivatives', name: 'Forex & Derivatives', group: 'Money & Finance', niche: 'money', business: 'Trading',
    industry: 'Finance', monetization: 'High', demand: 'Medium', audience: ['Individuals'], mods: ['for beginners'],
    subs: [
      { name: 'Forex', topics: ['Currency pairs', 'Forex risk management', 'Carry trades', 'Forex sessions & liquidity'] },
      { name: 'Options', topics: ['Options basics', 'Covered calls', 'Spreads & straddles', 'Implied volatility', 'Options income strategies'] },
      { name: 'Futures', topics: ['Futures trading', 'Commodity futures', 'Index futures', 'Margin & leverage'] },
      { name: 'Discipline', topics: ['Trading psychology', 'Trading journals', 'Position sizing', 'Drawdown recovery'] },
      { name: 'Analysis', topics: ['Technical analysis', 'Chart patterns', 'Fundamental analysis', 'Backtesting strategies'] },
    ],
  },
  {
    id: 'alternative-investments', name: 'Alternative Investments', group: 'Money & Finance', niche: 'money', business: 'Investing',
    industry: 'Finance', monetization: 'High', demand: 'Medium', competition: 'Low', audience: ['Individuals', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Private Markets', topics: ['Angel investing', 'Private equity basics', 'Venture funds', 'Revenue-based financing'] },
      { name: 'Real Assets', topics: ['Farmland investing', 'Timberland', 'Precious metals', 'Energy investing'] },
      { name: 'Collectibles', topics: ['Art investing', 'Watch investing', 'Trading card investing', 'Wine investing', 'Classic car investing'] },
      { name: 'Income Alternatives', topics: ['Peer-to-peer lending', 'Royalty investing', 'Tax lien investing', 'Note investing'] },
      { name: 'Access', topics: ['Accredited investor rules', 'Fractional investing platforms', 'Liquidity considerations'] },
    ],
  },
  {
    id: 'banking-cash', name: 'Banking & Cash Management', group: 'Money & Finance', niche: 'money', business: 'Personal Finance',
    industry: 'Finance', monetization: 'Medium', demand: 'Medium', audience: ['Individuals', 'Business Owners'], mods: ['for beginners'],
    subs: [
      { name: 'Accounts', topics: ['Choosing a bank', 'High-yield savings', 'Certificates of deposit', 'Money market accounts'] },
      { name: 'Systems', topics: ['Cash flow systems', 'Sinking funds', 'Automating savings', 'Emergency funds'] },
      { name: 'Business Banking', topics: ['Business bank accounts', 'Merchant accounts', 'Payment processing fees', 'Multi-currency accounts'] },
      { name: 'Security', topics: ['Fraud protection', 'Identity theft recovery', 'Safe online banking'] },
      { name: 'Credit Products', topics: ['Personal loans', 'Overdrafts', 'Buy now pay later', 'Balance transfers'] },
    ],
  },
  {
    id: 'money-for-couples', name: 'Money for Couples & Families', group: 'Money & Finance', niche: 'money', business: 'Financial Coaching',
    industry: 'Finance', monetization: 'High', demand: 'Medium', audience: ['Individuals', 'Parents'], mods: ['for beginners'],
    subs: [
      { name: 'Together', topics: ['Combining finances', 'Money conversations', 'Joint vs separate accounts', 'Financial infidelity', 'Shared money goals'] },
      { name: 'Family Planning', topics: ['Cost of raising children', 'Childcare budgeting', 'Saving for education', 'Life insurance for parents'] },
      { name: 'Teaching', topics: ['Money lessons for kids', 'Allowance systems', 'Teen financial literacy', 'First job & first account'] },
      { name: 'Household Money', topics: ['Household budgeting', 'Single-income households', 'Dual-income planning'] },
    ],
  },
  {
    id: 'financial-analysis', name: 'Financial Analysis & Modelling', group: 'Money & Finance', niche: 'money', business: 'Finance',
    industry: 'Finance', monetization: 'Very High', demand: 'High', audience: ['Professionals'], mods: ['for beginners', 'case studies'],
    subs: [
      { name: 'Statements', topics: ['Reading financial statements', 'Cash flow analysis', 'Balance sheet analysis', 'Ratio analysis'] },
      { name: 'Modelling', topics: ['Three-statement models', 'Discounted cash flow', 'Budget models', 'Sensitivity analysis'] },
      { name: 'Valuation', topics: ['Company valuation', 'Comparable company analysis', 'Precedent transactions'] },
      { name: 'Corporate Finance', topics: ['Capital structure', 'Working capital management', 'Investment appraisal'] },
      { name: 'Reporting Standards', topics: ['GAAP vs IFRS basics', 'Management accounts', 'Audit preparation'] },
    ],
  },
  {
    id: 'financial-independence-fire', name: 'Side Income & Extra Money', group: 'Money & Finance', niche: 'money', business: 'Side Income',
    industry: 'Personal Finance', monetization: 'High', demand: 'Very High', audience: ['Individuals', 'Students'], mods: ['for beginners'],
    subs: [
      { name: 'Quick Income', topics: ['Side hustles', 'Gig economy work', 'Selling unused items', 'Weekend work', 'Seasonal income'] },
      { name: 'Skill-Based', topics: ['Freelance side income', 'Tutoring on the side', 'Handyman services', 'Pet sitting', 'Photography gigs'] },
      { name: 'Online', topics: ['Print on demand side income', 'Microtask work', 'Online surveys & testing', 'Reselling online', 'Digital product side income'] },
      { name: 'Scaling Up', topics: ['Turning a side hustle full-time', 'Side hustle taxes', 'Managing time with a job'] },
      { name: 'Selling Services', topics: ['Local service side income', 'Errand & delivery work', 'Rental income from assets'] },
    ],
  },

  // ============================ CAREER & WORK ============================
  {
    id: 'sales-careers', name: 'Sales Careers', group: 'Career & Work', niche: 'career', business: 'Sales',
    industry: 'Sales', monetization: 'Very High', demand: 'High', audience: ['Professionals'], mods: ['for beginners', 'for introverts'],
    subs: [
      { name: 'Roles', topics: ['Breaking into tech sales', 'Sales development representative', 'Account executive career', 'Sales engineering', 'Customer success career'] },
      { name: 'Skills', topics: ['Discovery calls', 'Objection handling', 'Closing techniques', 'Consultative selling', 'Social selling'] },
      { name: 'Performance', topics: ['Quota attainment', 'Pipeline management', 'Territory planning', 'Sales forecasting'] },
      { name: 'Leadership', topics: ['Sales management', 'Coaching sales reps', 'Compensation plan design', 'Sales enablement'] },
      { name: 'Tools', topics: ['Sales engagement platforms', 'CRM for sellers', 'Sales intelligence tools'] },
    ],
  },
  {
    id: 'healthcare-careers', name: 'Healthcare Careers', group: 'Career & Work', niche: 'career', business: 'Healthcare',
    industry: 'Healthcare', monetization: 'High', demand: 'Very High', audience: ['Professionals', 'Students'], mods: ['for beginners'],
    subs: [
      { name: 'Clinical Paths', topics: ['Nursing career paths', 'Allied health careers', 'Medical school pathway', 'Physician assistant career', 'Paramedic career'] },
      { name: 'Non-Clinical', topics: ['Healthcare administration', 'Medical coding & billing', 'Clinical research careers', 'Health informatics'] },
      { name: 'Practice', topics: ['Bedside communication', 'Shift work wellbeing', 'Clinical documentation', 'Preventing clinician burnout'] },
      { name: 'Private Practice', topics: ['Starting a private practice', 'Insurance credentialing', 'Practice marketing', 'Telehealth practice'] },
      { name: 'Wellbeing', topics: ['Compassion fatigue', 'Night shift health', 'Career longevity in care'] },
    ],
  },
  {
    id: 'legal-careers', name: 'Legal Careers', group: 'Career & Work', niche: 'career', business: 'Legal',
    industry: 'Legal', monetization: 'Very High', demand: 'Medium', audience: ['Professionals', 'Students'], mods: ['for beginners'],
    subs: [
      { name: 'Paths', topics: ['Law school preparation', 'Bar exam preparation', 'Paralegal career', 'In-house counsel career', 'Legal operations'] },
      { name: 'Practice Areas', topics: ['Corporate law practice', 'Family law practice', 'Immigration law practice', 'IP law practice', 'Criminal law practice'] },
      { name: 'Firm Life', topics: ['Billable hour management', 'Client development for lawyers', 'Legal writing', 'Making partner'] },
      { name: 'Solo Practice', topics: ['Starting a law firm', 'Legal tech for small firms', 'Flat-fee legal services'] },
      { name: 'Skills', topics: ['Legal research', 'Contract drafting', 'Negotiation for lawyers'] },
    ],
  },
  {
    id: 'education-careers', name: 'Education Careers', group: 'Career & Work', niche: 'career', business: 'Education',
    industry: 'Education', monetization: 'Medium', demand: 'High', audience: ['Professionals', 'Students'], mods: ['for beginners'],
    subs: [
      { name: 'Teaching', topics: ['Becoming a teacher', 'Teacher certification', 'Classroom management', 'Lesson planning', 'Differentiated instruction'] },
      { name: 'Leadership', topics: ['School leadership', 'Curriculum coordination', 'Education policy careers', 'Instructional coaching'] },
      { name: 'Alternative Paths', topics: ['Leaving the classroom', 'EdTech careers', 'International teaching', 'Teaching English abroad'] },
      { name: 'Support Roles', topics: ['Special education', 'School counselling', 'Teaching assistants', 'Librarianship'] },
      { name: 'Wellbeing', topics: ['Teacher workload', 'Teacher burnout', 'Behaviour stress'] },
    ],
  },
  {
    id: 'trades-careers', name: 'Skilled Trades & Technical Careers', group: 'Career & Work', niche: 'career', business: 'Trades',
    industry: 'Construction', monetization: 'High', demand: 'Very High', competition: 'Low', audience: ['Professionals', 'Students'], mods: ['for beginners', 'self-employed'],
    subs: [
      { name: 'Trades', topics: ['Electrician career', 'Plumbing career', 'HVAC career', 'Welding career', 'Carpentry career', 'Automotive technician'] },
      { name: 'Getting In', topics: ['Apprenticeships', 'Trade school selection', 'Trade licensing', 'Tool investment'] },
      { name: 'Running a Trade Business', topics: ['Starting a trades business', 'Job quoting & estimating', 'Field service scheduling', 'Trade business marketing'] },
      { name: 'Safety & Longevity', topics: ['Jobsite safety', 'Protecting your body in the trades', 'Continuing certification'] },
      { name: 'Specialisms', topics: ['Solar installation', 'EV charger installation', 'Heat pump installation', 'Locksmithing'] },
    ],
  },
  {
    id: 'government-nonprofit-careers', name: 'Public Sector & Nonprofit Careers', group: 'Career & Work', niche: 'career', business: 'Public Sector',
    industry: 'Government', monetization: 'Medium', demand: 'Medium', competition: 'Low', audience: ['Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Getting In', topics: ['Government job applications', 'Public sector interviews', 'Security clearance process', 'Civil service exams'] },
      { name: 'Roles', topics: ['Policy analyst career', 'Public health careers', 'Municipal careers', 'International development careers'] },
      { name: 'Nonprofit', topics: ['Nonprofit career paths', 'Fundraising careers', 'Program management', 'Grant management'] },
      { name: 'Advancement', topics: ['Public sector promotion', 'Pension & benefits planning', 'Moving between public and private'] },
      { name: 'Skills', topics: ['Policy writing', 'Stakeholder consultation', 'Public speaking for officials'] },
    ],
  },
  {
    id: 'workplace-leadership', name: 'Management & People Leadership', group: 'Career & Work', niche: 'career', business: 'Leadership',
    industry: 'Management', monetization: 'Very High', demand: 'High', audience: ['Professionals'], mods: ['for new managers', 'for technical leaders'],
    subs: [
      { name: 'First-Time Management', topics: ['Becoming a manager', 'Managing former peers', 'Delegation skills', 'One-on-one meetings', 'Setting expectations'] },
      { name: 'Team Performance', topics: ['Team goal setting', 'Performance conversations', 'Managing underperformance', 'Recognising and rewarding'] },
      { name: 'Culture', topics: ['Psychological safety', 'Team rituals', 'Managing hybrid teams', 'Onboarding new hires'] },
      { name: 'Senior Leadership', topics: ['Leading managers', 'Strategic planning', 'Organisational design', 'Change management'] },
      { name: 'Remote Leadership', topics: ['Leading remote teams', 'Async leadership', 'Virtual one-on-ones'] },
    ],
  },

  // ============================ HEALTH & FITNESS ============================
  {
    id: 'pilates-barre', name: 'Pilates & Low-Impact Training', group: 'Health & Fitness', niche: 'health', business: 'Fitness Coaching',
    industry: 'Fitness', monetization: 'High', demand: 'High', audience: ['Individuals'], mods: ['for beginners', 'at home', 'for seniors'],
    subs: [
      { name: 'Practice', topics: ['Mat pilates', 'Reformer pilates', 'Barre workouts', 'Core stability training', 'Low-impact strength'] },
      { name: 'Applications', topics: ['Pilates for back pain', 'Prenatal pilates', 'Postnatal core recovery', 'Pilates for runners', 'Pilates for seniors'] },
      { name: 'Teaching', topics: ['Pilates instructor training', 'Cueing & corrections', 'Studio class programming', 'Online pilates business'] },
      { name: 'Programming', topics: ['Class sequencing', 'Progressions & regressions', 'Equipment-free sessions'] },
    ],
  },
  {
    id: 'martial-arts', name: 'Martial Arts & Combat Sports', group: 'Health & Fitness', niche: 'health', business: 'Sports Coaching',
    industry: 'Sports', monetization: 'Medium', demand: 'Medium', audience: ['Individuals', 'Students'], mods: ['for beginners', 'for kids'],
    subs: [
      { name: 'Striking', topics: ['Boxing fundamentals', 'Muay Thai', 'Karate', 'Taekwondo', 'Kickboxing'] },
      { name: 'Grappling', topics: ['Brazilian jiu-jitsu', 'Wrestling', 'Judo', 'Submission grappling'] },
      { name: 'Training', topics: ['Fight conditioning', 'Weight cutting safely', 'Sparring safety', 'Competition preparation'] },
      { name: 'Practical', topics: ['Self-defence', 'Situational awareness', 'Martial arts for kids', 'Opening a martial arts gym'] },
      { name: 'Culture', topics: ['Martial arts philosophy', 'Belt progression', 'Choosing a dojo'] },
    ],
  },
  {
    id: 'dance-movement', name: 'Dance & Movement', group: 'Health & Fitness', niche: 'creative', business: 'Dance',
    industry: 'Arts', monetization: 'Medium', demand: 'Medium', audience: ['Individuals', 'Creators'], mods: ['for beginners', 'for adults'],
    subs: [
      { name: 'Styles', topics: ['Hip hop dance', 'Ballet', 'Salsa & bachata', 'Contemporary dance', 'Ballroom dance', 'K-pop choreography'] },
      { name: 'Fitness Dance', topics: ['Zumba', 'Dance cardio', 'Pole fitness', 'Aerial arts'] },
      { name: 'Craft', topics: ['Choreography', 'Musicality & timing', 'Freestyle & improvisation', 'Performance confidence'] },
      { name: 'Business', topics: ['Teaching dance classes', 'Dance studio business', 'Dance content on social media'] },
      { name: 'Wellbeing', topics: ['Dance for mental health', 'Injury prevention for dancers', 'Flexibility for dancers'] },
    ],
  },
  {
    id: 'functional-medicine', name: 'Functional & Integrative Health', group: 'Health & Fitness', niche: 'health', business: 'Health Coaching',
    industry: 'Wellness', monetization: 'Very High', demand: 'High', audience: ['Individuals', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Approach', topics: ['Root-cause health', 'Functional lab testing', 'Elimination protocols', 'Personalised nutrition'] },
      { name: 'Systems', topics: ['Gut microbiome health', 'Adrenal & stress health', 'Detoxification pathways', 'Blood sugar regulation', 'Inflammation reduction'] },
      { name: 'Modalities', topics: ['Herbal medicine', 'Acupuncture & TCM', 'Ayurveda', 'Homeopathy', 'Naturopathy'] },
      { name: 'Practice', topics: ['Health coaching practice', 'Client protocols', 'Scope of practice & referrals'] },
      { name: 'Nutrition Protocols', topics: ['Anti-inflammatory protocols', 'Gut healing protocols', 'Micronutrient repletion'] },
    ],
  },
  {
    id: 'dental-oral-health', name: 'Dental & Oral Health', group: 'Health & Fitness', niche: 'health', business: 'Health Education',
    industry: 'Healthcare', monetization: 'Medium', demand: 'Medium', competition: 'Low', audience: ['Individuals', 'Parents'], mods: ['for beginners'],
    subs: [
      { name: 'Daily Care', topics: ['Oral hygiene routines', 'Choosing a toothbrush', 'Flossing technique', 'Preventing cavities'] },
      { name: 'Treatments', topics: ['Teeth whitening', 'Orthodontics & aligners', 'Dental implants', 'Root canal explained', 'Gum disease treatment'] },
      { name: 'Special Cases', topics: ['Dental care for kids', 'Dental anxiety', 'Oral health and diet', 'Dry mouth management'] },
      { name: 'Business', topics: ['Dental practice management', 'Dental marketing', 'Patient education'] },
    ],
  },
  {
    id: 'skin-hair-health', name: 'Skin & Hair Health', group: 'Health & Fitness', niche: 'health', business: 'Beauty & Wellness',
    industry: 'Beauty', monetization: 'High', demand: 'Very High', audience: ['Individuals', 'Creators'], mods: ['for beginners', 'naturally'],
    subs: [
      { name: 'Skincare', topics: ['Skincare routines', 'Acne management', 'Anti-ageing skincare', 'Sensitive skin care', 'Sun protection', 'Ingredient science'] },
      { name: 'Conditions', topics: ['Eczema management', 'Rosacea care', 'Hyperpigmentation', 'Psoriasis lifestyle'] },
      { name: 'Hair', topics: ['Hair care routines', 'Curly hair care', 'Scalp health', 'Hair loss treatment', 'Natural hair journey'] },
      { name: 'Professional', topics: ['Esthetician career', 'Opening a skincare clinic', 'Skincare product formulation'] },
      { name: 'Routines by Age', topics: ['Skincare in your twenties', 'Skincare in your forties', 'Teen skincare'] },
    ],
  },
  {
    id: 'vision-hearing', name: 'Vision & Hearing Health', group: 'Health & Fitness', niche: 'health', business: 'Health Education',
    industry: 'Healthcare', monetization: 'Medium', demand: 'Low', competition: 'Low', audience: ['Individuals', 'Seniors'], mods: ['for beginners'],
    subs: [
      { name: 'Vision', topics: ['Eye strain relief', 'Screen time and eyes', 'Choosing glasses', 'Contact lens care', 'Vision therapy'] },
      { name: 'Hearing', topics: ['Hearing protection', 'Tinnitus management', 'Hearing aids explained', 'Hearing loss and communication'] },
      { name: 'Ageing', topics: ['Age-related vision changes', 'Cataracts explained', 'Glaucoma awareness'] },
      { name: 'Daily Life', topics: ['Living with low vision', 'Assistive listening devices', 'Accessible home setup'] },
    ],
  },
  {
    id: 'addiction-recovery', name: 'Addiction & Recovery', group: 'Health & Fitness', niche: 'mind', business: 'Recovery Coaching',
    industry: 'Mental Health', monetization: 'High', demand: 'High', audience: ['Individuals', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Substances', topics: ['Alcohol recovery', 'Sobriety journey', 'Smoking cessation', 'Harm reduction'] },
      { name: 'Behavioural', topics: ['Gambling addiction', 'Screen & gaming addiction', 'Compulsive shopping', 'Food addiction'] },
      { name: 'Support', topics: ['Recovery coaching', 'Supporting a loved one', 'Relapse prevention', 'Sober social life', 'Twelve-step programs'] },
      { name: 'Family', topics: ['Family recovery', 'Setting boundaries with addiction', 'Children of addiction'] },
    ],
  },

  // ============================ FOOD & COOKING ============================
  {
    id: 'food-business-ops', name: 'Food Business & Products', group: 'Food & Cooking', niche: 'business', business: 'Food Business',
    industry: 'Food & Beverage', monetization: 'High', demand: 'High', audience: ['Business Owners', 'Creators'], mods: ['for beginners', 'from home'],
    subs: [
      { name: 'Products', topics: ['Packaged food products', 'Sauce & condiment brands', 'Snack brands', 'Speciality food line', 'Co-packing'] },
      { name: 'Regulation', topics: ['Food safety certification', 'Cottage food laws', 'Nutrition labelling', 'Kitchen licensing'] },
      { name: 'Selling', topics: ['Farmers market selling', 'Wholesale to retailers', 'Direct-to-consumer food', 'Food subscription boxes'] },
      { name: 'Home-Based', topics: ['Home bakery business', 'Meal prep business', 'Personal chef business', 'Catering from home'] },
      { name: 'Brand', topics: ['Food brand storytelling', 'Packaging & labels', 'Retail buyer pitching'] },
    ],
  },
  {
    id: 'food-science', name: 'Food Science & Technique', group: 'Food & Cooking', niche: 'creative', business: 'Culinary Education',
    industry: 'Food & Beverage', monetization: 'Medium', demand: 'Medium', audience: ['Individuals', 'Creators'], mods: ['for home cooks'],
    subs: [
      { name: 'Science', topics: ['Maillard reaction', 'Emulsions', 'Fermentation science', 'Food chemistry basics', 'Sous vide cooking'] },
      { name: 'Technique', topics: ['Knife skills', 'Stock & sauce making', 'Braising technique', 'Roasting technique', 'Seasoning & balance'] },
      { name: 'Ingredients', topics: ['Understanding flour types', 'Choosing cooking oils', 'Salt varieties', 'Spice pairing', 'Seasonal produce'] },
      { name: 'Equipment', topics: ['Kitchen equipment guide', 'Cast iron care', 'Knife sharpening', 'Small kitchen setups'] },
      { name: 'Baking Science', topics: ['Gluten development', 'Leavening agents', 'Sugar chemistry'] },
    ],
  },
  {
    id: 'kids-family-cooking', name: 'Family & Kids Cooking', group: 'Food & Cooking', niche: 'relationships', business: 'Food Content',
    industry: 'Food & Beverage', monetization: 'Low', demand: 'Medium', audience: ['Parents', 'Individuals'], mods: ['on a budget'],
    subs: [
      { name: 'Cooking with Kids', topics: ['Cooking with toddlers', 'Kid-friendly recipes', 'Kitchen safety for children', 'Baking with kids'] },
      { name: 'Feeding', topics: ['Picky eater strategies', 'Baby-led weaning', 'School lunch ideas', 'Family dinner routines', 'Toddler nutrition'] },
      { name: 'Budget Family Food', topics: ['Feeding a family on a budget', 'Bulk family cooking', 'Leftover transformation'] },
      { name: 'Education', topics: ['Teaching kids nutrition', 'Growing food with kids', 'Kids cooking classes'] },
    ],
  },
  {
    id: 'food-media', name: 'Food Media & Styling', group: 'Food & Cooking', niche: 'creative', business: 'Food Content',
    industry: 'Media', monetization: 'Medium', demand: 'Medium', audience: ['Creators'], mods: ['for beginners', 'for beginners'],
    subs: [
      { name: 'Photography', topics: ['Food photography lighting', 'Food styling', 'Prop styling', 'Overhead food shots'] },
      { name: 'Video', topics: ['Recipe video production', 'Short-form food video', 'Cooking livestreams', 'ASMR cooking content'] },
      { name: 'Writing', topics: ['Recipe writing', 'Restaurant reviewing', 'Food storytelling', 'Cookbook proposals'] },
      { name: 'Business', topics: ['Food blogging income', 'Brand partnerships for food creators', 'Recipe licensing'] },
      { name: 'Growth', topics: ['Food SEO', 'Recipe schema', 'Food Pinterest strategy'] },
    ],
  },

  // ============================ MIND & GROWTH ============================
  {
    id: 'meditation-practice', name: 'Meditation Practice', group: 'Mind & Growth', niche: 'mind', business: 'Meditation',
    industry: 'Wellness', monetization: 'Medium', demand: 'High', audience: ['Individuals'], mods: ['for beginners', 'daily practice'],
    subs: [
      { name: 'Techniques', topics: ['Breath meditation', 'Body scan meditation', 'Loving-kindness meditation', 'Transcendental meditation', 'Walking meditation', 'Visualization practice'] },
      { name: 'Building a Practice', topics: ['Starting a meditation habit', 'Meditation posture', 'Working with a busy mind', 'Meditation retreats'] },
      { name: 'Applications', topics: ['Meditation for anxiety', 'Meditation for sleep', 'Meditation for focus', 'Meditation for pain'] },
      { name: 'Teaching', topics: ['Meditation teacher training', 'Leading guided meditations', 'Meditation app content'] },
      { name: 'Traditions', topics: ['Vipassana', 'Zen practice', 'Yoga nidra', 'Mantra meditation'] },
    ],
  },
  {
    id: 'positive-psychology', name: 'Positive Psychology & Wellbeing', group: 'Mind & Growth', niche: 'mind', business: 'Wellbeing',
    industry: 'Psychology', monetization: 'High', demand: 'High', audience: ['Individuals', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Foundations', topics: ['Positive psychology basics', 'Character strengths', 'PERMA model', 'Flourishing'] },
      { name: 'Practices', topics: ['Gratitude practices', 'Savouring', 'Acts of kindness', 'Optimism training', 'Meaning-making'] },
      { name: 'Applications', topics: ['Wellbeing at work', 'Positive education', 'Wellbeing measurement', 'Happiness interventions'] },
      { name: 'Relationships', topics: ['Positive relationships', 'Active constructive responding', 'Gratitude in couples'] },
    ],
  },
  {
    id: 'philosophy-ethics', name: 'Philosophy & Ethics', group: 'Mind & Growth', niche: 'mind', business: 'Education',
    industry: 'Education', monetization: 'Low', demand: 'Medium', competition: 'Low', audience: ['Individuals', 'Students'], mods: ['for beginners'],
    subs: [
      { name: 'Schools', topics: ['Stoicism', 'Existentialism', 'Buddhism as philosophy', 'Absurdism', 'Utilitarianism', 'Virtue ethics'] },
      { name: 'Applied', topics: ['Practical stoicism', 'Ethics in business', 'Ethics of technology', 'Moral decision making'] },
      { name: 'Big Questions', topics: ['Meaning of life', 'Free will', 'Consciousness', 'Death and mortality'] },
      { name: 'Thinkers', topics: ['Marcus Aurelius', 'Seneca', 'Nietzsche', 'Simone de Beauvoir'] },
    ],
  },
  {
    id: 'critical-thinking', name: 'Critical Thinking & Reasoning', group: 'Mind & Growth', niche: 'mind', business: 'Education',
    industry: 'Education', monetization: 'Medium', demand: 'Medium', audience: ['Professionals', 'Students'], mods: ['for beginners'],
    subs: [
      { name: 'Reasoning', topics: ['Logical fallacies', 'Argument construction', 'Bayesian thinking', 'First principles thinking', 'Systems thinking'] },
      { name: 'Bias', topics: ['Cognitive biases', 'Confirmation bias', 'Debiasing techniques', 'Motivated reasoning'] },
      { name: 'Information', topics: ['Media literacy', 'Evaluating sources', 'Statistical literacy', 'Spotting misinformation'] },
      { name: 'Practice', topics: ['Steelmanning arguments', 'Socratic questioning', 'Red teaming ideas'] },
    ],
  },
  {
    id: 'creativity-practice', name: 'Creativity & Ideation', group: 'Mind & Growth', niche: 'creative', business: 'Creative Coaching',
    industry: 'Creative', monetization: 'Medium', demand: 'Medium', audience: ['Creators', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Practice', topics: ['Daily creative practice', 'Overcoming creative block', 'Idea capture systems', 'Creative constraints'] },
      { name: 'Techniques', topics: ['Brainstorming methods', 'Lateral thinking', 'Combinatorial creativity', 'Design thinking', 'SCAMPER method'] },
      { name: 'Creative Life', topics: ['Finding your creative voice', 'Sharing work publicly', 'Handling creative criticism', 'Creative sabbaticals'] },
      { name: 'Environments', topics: ['Creative spaces', 'Creative collaboration', 'Creative rituals'] },
    ],
  },
  {
    id: 'decision-making', name: 'Decision Making & Judgement', group: 'Mind & Growth', niche: 'mind', business: 'Coaching',
    industry: 'Management', monetization: 'High', demand: 'Medium', audience: ['Professionals', 'Business Owners'], mods: ['for beginners'],
    subs: [
      { name: 'Frameworks', topics: ['Decision frameworks', 'Expected value thinking', 'Pre-mortems', 'Reversible vs irreversible decisions', 'Decision trees'] },
      { name: 'Under Uncertainty', topics: ['Risk assessment', 'Probabilistic thinking', 'Forecasting skills', 'Managing regret'] },
      { name: 'Group Decisions', topics: ['Group decision making', 'Avoiding groupthink', 'Consensus vs consent', 'Decision documentation'] },
      { name: 'Personal', topics: ['Career decisions', 'Big life decisions', 'Values-based choices'] },
    ],
  },
  {
    id: 'self-therapy-tools', name: 'Self-Therapy & Inner Work', group: 'Mind & Growth', niche: 'mind', business: 'Mental Wellness',
    industry: 'Mental Health', monetization: 'High', demand: 'High', audience: ['Individuals'], mods: ['for beginners'],
    subs: [
      { name: 'Modalities', topics: ['CBT self-help', 'Internal family systems', 'Somatic experiencing', 'Acceptance and commitment', 'Inner child work'] },
      { name: 'Patterns', topics: ['People-pleasing patterns', 'Perfectionism recovery', 'Codependency', 'Attachment healing', 'Self-sabotage'] },
      { name: 'Tools', topics: ['Thought records', 'Parts mapping', 'Grounding exercises', 'Reparenting practices'] },
      { name: 'Daily Practice', topics: ['Emotional check-ins', 'Nervous system tracking', 'Self-compassion breaks'] },
    ],
  },

  // ============================ RELATIONSHIPS & FAMILY ============================
  {
    id: 'newborn-early-years', name: 'Newborn & Early Years', group: 'Relationships & Family', niche: 'relationships', business: 'Parenting',
    industry: 'Parenting', monetization: 'Medium', demand: 'High', audience: ['Parents'], mods: ['for new parents', 'for beginners', 'for twins'],
    subs: [
      { name: 'Newborn', topics: ['Newborn sleep', 'Breastfeeding support', 'Bottle feeding', 'Newborn soothing', 'Baby wearing'] },
      { name: 'Development', topics: ['Baby milestones', 'Tummy time', 'Early language development', 'Sensory play', 'Introducing solids'] },
      { name: 'Parent Wellbeing', topics: ['Postpartum mental health', 'Sleep deprivation survival', 'Partner support after birth', 'Returning to work after baby'] },
      { name: 'Toddler Years', topics: ['Toddler tantrums', 'Potty training', 'Toddler sleep regression', 'Early boundaries'] },
      { name: 'Health', topics: ['Infant illness basics', 'Vaccination schedules', 'Reflux & colic', 'Safe sleep'] },
    ],
  },
  {
    id: 'parenting-teens', name: 'Parenting Teens & Young Adults', group: 'Relationships & Family', niche: 'relationships', business: 'Parenting',
    industry: 'Parenting', monetization: 'Medium', demand: 'High', audience: ['Parents'], mods: ['for beginners', 'for single parents'],
    subs: [
      { name: 'Communication', topics: ['Talking to teenagers', 'Rebuilding trust with a teen', 'Difficult teen conversations', 'Listening without lecturing'] },
      { name: 'Challenges', topics: ['Teen social media', 'Teen mental health', 'Teen substance awareness', 'School refusal', 'Teen friendships & bullying'] },
      { name: 'Independence', topics: ['Teaching life skills', 'Teen driving', 'First job guidance', 'College preparation', 'Launching young adults'] },
      { name: 'Academics', topics: ['Homework battles', 'Exam stress support', 'Choosing subjects', 'University applications'] },
    ],
  },
  {
    id: 'adoption-fostering', name: 'Adoption, Fostering & Blended Families', group: 'Relationships & Family', niche: 'relationships', business: 'Family Support',
    industry: 'Family Services', monetization: 'Medium', demand: 'Low', competition: 'Low', audience: ['Parents'], mods: ['for beginners'],
    subs: [
      { name: 'Adoption', topics: ['Adoption process', 'Domestic adoption', 'International adoption', 'Open adoption relationships', 'Telling a child their story'] },
      { name: 'Fostering', topics: ['Becoming a foster carer', 'Trauma-informed parenting', 'Supporting placement transitions', 'Foster carer support'] },
      { name: 'Blended', topics: ['Step-parenting', 'Blending household rules', 'Co-parenting with an ex', 'Half-sibling relationships'] },
      { name: 'Support', topics: ['Therapeutic parenting', 'School support for looked-after children', 'Post-adoption support'] },
    ],
  },
  {
    id: 'grandparenting-eldercare', name: 'Grandparenting & Later-Life Family', group: 'Relationships & Family', niche: 'relationships', business: 'Family Coaching',
    industry: 'Family Services', monetization: 'Low', demand: 'Low', competition: 'Low', audience: ['Seniors', 'Parents'], mods: ['for beginners'],
    subs: [
      { name: 'Grandparenting', topics: ['Modern grandparenting', 'Long-distance grandparenting', 'Childcare boundaries', 'Passing on family stories'] },
      { name: 'Later-Life Family', topics: ['Family meetings about care', 'Discussing wills with family', 'Downsizing conversations', 'Legacy letters'] },
      { name: 'Care Options', topics: ['Home care options', 'Assisted living', 'Memory care', 'Care funding'] },
    ],
  },
  {
    id: 'friendship-community', name: 'Community & Belonging', group: 'Relationships & Family', niche: 'relationships', business: 'Community',
    industry: 'Community', monetization: 'Medium', demand: 'Medium', audience: ['Individuals'], mods: ['for beginners'],
    subs: [
      { name: 'Finding Community', topics: ['Finding your people', 'Joining local groups', 'Faith communities', 'Interest-based communities', 'Volunteering'] },
      { name: 'Building Community', topics: ['Hosting gatherings', 'Starting a local group', 'Neighbourhood building', 'Third places'] },
      { name: 'Belonging', topics: ['Loneliness in modern life', 'Belonging after relocation', 'Cultural identity & belonging'] },
      { name: 'Life Stages', topics: ['Friendship after parenthood', 'Friendship in retirement', 'Friendship after moving'] },
    ],
  },

  // ============================ TECHNOLOGY & AI ============================
  {
    id: 'ai-engineering', name: 'AI Engineering & LLM Apps', group: 'Technology & AI', niche: 'tech', business: 'AI',
    industry: 'Artificial Intelligence', monetization: 'Very High', demand: 'Very High', audience: ['Professionals'], mods: ['for beginners', 'case studies', 'for product teams'],
    subs: [
      { name: 'Building', topics: ['LLM application development', 'Prompt engineering', 'Retrieval augmented generation', 'AI agents', 'Function calling & tools'] },
      { name: 'Quality', topics: ['LLM evaluation', 'Hallucination mitigation', 'Guardrails & safety', 'Prompt versioning', 'AI observability'] },
      { name: 'Operations', topics: ['Model selection & cost', 'Token optimization', 'Fine-tuning vs prompting', 'Vector database selection', 'AI infrastructure'] },
      { name: 'Applications', topics: ['AI customer support', 'AI content workflows', 'AI coding assistants', 'AI for research', 'Document intelligence'] },
      { name: 'Multimodal', topics: ['Vision models', 'Speech to text', 'Text to speech', 'Image generation pipelines'] },
    ],
  },
  {
    id: 'machine-learning', name: 'Machine Learning & Data Science', group: 'Technology & AI', niche: 'tech', business: 'Data Science',
    industry: 'Artificial Intelligence', monetization: 'Very High', demand: 'Very High', audience: ['Professionals', 'Students'], mods: ['for beginners', 'case studies', 'for engineers'],
    subs: [
      { name: 'Foundations', topics: ['Supervised learning', 'Unsupervised learning', 'Feature engineering', 'Model evaluation metrics', 'Overfitting & regularization'] },
      { name: 'Deep Learning', topics: ['Neural networks', 'Computer vision', 'Natural language processing', 'Transformers explained', 'Reinforcement learning'] },
      { name: 'Practice', topics: ['ML project workflow', 'Experiment tracking', 'MLOps', 'Model deployment', 'Model monitoring & drift'] },
      { name: 'Career', topics: ['Data science portfolio', 'Kaggle competitions', 'ML interview preparation', 'Research to industry transition'] },
      { name: 'Domains', topics: ['Recommender systems', 'Time series forecasting', 'Anomaly detection', 'Search ranking'] },
    ],
  },
  {
    id: 'data-engineering', name: 'Data Engineering & Analytics', group: 'Technology & AI', niche: 'tech', business: 'Data',
    industry: 'Data', monetization: 'Very High', demand: 'Very High', audience: ['Professionals'], mods: ['for beginners', 'for analysts'],
    subs: [
      { name: 'Pipelines', topics: ['ETL & ELT pipelines', 'Data orchestration', 'Streaming data', 'Change data capture', 'Batch processing'] },
      { name: 'Storage', topics: ['Data warehouses', 'Data lakes & lakehouses', 'Dimensional modelling', 'Partitioning & performance'] },
      { name: 'Quality', topics: ['Data quality testing', 'Data contracts', 'Data lineage', 'Data governance'] },
      { name: 'Analytics Engineering', topics: ['SQL for analytics', 'Analytics engineering with dbt', 'Semantic layers', 'Metric stores'] },
      { name: 'Tooling', topics: ['Airflow', 'Spark', 'Kafka', 'Snowflake & BigQuery'] },
    ],
  },
  {
    id: 'qa-testing', name: 'QA & Software Testing', group: 'Technology & AI', niche: 'tech', business: 'Software',
    industry: 'Software', monetization: 'High', demand: 'High', audience: ['Professionals'], mods: ['for beginners', 'for automation engineers'],
    subs: [
      { name: 'Manual Testing', topics: ['Test case design', 'Exploratory testing', 'Regression testing', 'Bug reporting'] },
      { name: 'Automation', topics: ['Test automation frameworks', 'End-to-end testing', 'API testing', 'Mobile test automation', 'Visual regression testing'] },
      { name: 'Quality Practice', topics: ['Shift-left testing', 'Test strategy', 'Performance testing', 'Accessibility testing', 'Security testing basics'] },
      { name: 'Process', topics: ['Bug triage', 'Test environments', 'Release readiness', 'QA metrics'] },
    ],
  },
  {
    id: 'technical-writing', name: 'Technical Writing & Documentation', group: 'Technology & AI', niche: 'tech', business: 'Technical Writing',
    industry: 'Software', monetization: 'High', demand: 'Medium', competition: 'Low', audience: ['Professionals', 'Creators'], mods: ['freelance'],
    subs: [
      { name: 'Craft', topics: ['Writing developer docs', 'API documentation', 'Tutorials & how-to guides', 'Release notes', 'Style guides for docs'] },
      { name: 'Systems', topics: ['Docs as code', 'Documentation tooling', 'Information architecture for docs', 'Versioned documentation'] },
      { name: 'Career', topics: ['Technical writing portfolio', 'Freelance technical writing', 'Developer advocacy'] },
      { name: 'Content Types', topics: ['Runbooks', 'Architecture docs', 'Migration guides', 'Glossaries'] },
    ],
  },
  {
    id: 'developer-tooling', name: 'Developer Tooling & Practices', group: 'Technology & AI', niche: 'tech', business: 'Software',
    industry: 'Software', monetization: 'High', demand: 'High', audience: ['Professionals'], mods: ['for beginners', 'for teams'],
    subs: [
      { name: 'Workflow', topics: ['Git workflows', 'Code review practices', 'Pair programming', 'Trunk-based development'] },
      { name: 'Craft', topics: ['Clean code', 'Refactoring', 'Design patterns', 'Technical debt management', 'System design'] },
      { name: 'Environment', topics: ['Terminal productivity', 'Editor configuration', 'Local dev environments', 'Debugging techniques'] },
      { name: 'Team', topics: ['Engineering onboarding', 'Architecture decision records', 'On-call practices', 'Postmortems'] },
      { name: 'Productivity', topics: ['Keyboard-driven workflows', 'Snippets & scaffolding', 'Local automation'] },
    ],
  },
  {
    id: 'api-platform', name: 'APIs & Platform Engineering', group: 'Technology & AI', niche: 'tech', business: 'Platform',
    industry: 'Software', monetization: 'Very High', demand: 'High', audience: ['Professionals'], mods: ['for beginners', 'for startups'],
    subs: [
      { name: 'API Design', topics: ['REST API design', 'GraphQL', 'API versioning', 'Webhooks', 'Rate limiting & quotas'] },
      { name: 'Platform', topics: ['Internal developer platforms', 'Service mesh', 'Multi-tenancy', 'Event-driven architecture'] },
      { name: 'Ecosystem', topics: ['Developer experience', 'SDK design', 'API monetization', 'Partner integrations'] },
      { name: 'Reliability', topics: ['API observability', 'Idempotency', 'Backwards compatibility'] },
    ],
  },
  {
    id: 'digital-privacy', name: 'Digital Privacy & Safety', group: 'Technology & AI', niche: 'tech', business: 'Security',
    industry: 'Cybersecurity', monetization: 'Medium', demand: 'High', audience: ['Individuals', 'Professionals'], mods: ['for beginners', 'for families'],
    subs: [
      { name: 'Personal Security', topics: ['Password management', 'Two-factor authentication', 'Phishing awareness', 'Securing home networks', 'Device encryption'] },
      { name: 'Privacy', topics: ['Data minimisation', 'Private browsing & VPNs', 'Removing personal data online', 'Privacy-first tools'] },
      { name: 'Family Safety', topics: ['Online safety for kids', 'Parental controls', 'Scam awareness for seniors', 'Digital footprint management'] },
      { name: 'At Work', topics: ['Workplace device security', 'Remote work security', 'Shadow IT risks'] },
    ],
  },

  // ============================ CREATIVE & CONTENT ============================
  {
    id: 'graphic-design', name: 'Graphic Design', group: 'Creative & Content', niche: 'creative', business: 'Design',
    industry: 'Design', monetization: 'High', demand: 'High', audience: ['Creators', 'Professionals'], mods: ['for beginners', 'advanced'],
    subs: [
      { name: 'Fundamentals', topics: ['Typography', 'Colour theory', 'Layout & composition', 'Grid systems', 'Visual hierarchy'] },
      { name: 'Applications', topics: ['Logo design', 'Poster design', 'Packaging design', 'Editorial design', 'Presentation design', 'Social media graphics'] },
      { name: 'Tools', topics: ['Adobe Illustrator', 'Adobe Photoshop', 'Figma for designers', 'Canva for business', 'Affinity suite'] },
      { name: 'Business', topics: ['Freelance graphic design', 'Design pricing', 'Client feedback rounds', 'Design portfolios'] },
      { name: 'Print', topics: ['Print production', 'Colour separation', 'Large format design', 'Signage design'] },
    ],
  },
  {
    id: 'brand-identity', name: 'Brand Identity & Strategy', group: 'Creative & Content', niche: 'creative', business: 'Branding',
    industry: 'Design', monetization: 'Very High', demand: 'High', audience: ['Creators', 'Business Owners'], mods: ['for beginners', 'for small business'],
    subs: [
      { name: 'Strategy', topics: ['Brand positioning', 'Brand archetypes', 'Brand voice', 'Naming a brand', 'Brand messaging frameworks'] },
      { name: 'Identity', topics: ['Visual identity systems', 'Brand guidelines', 'Logo systems', 'Brand photography direction'] },
      { name: 'Rebrands', topics: ['Rebranding process', 'Brand audits', 'Brand architecture', 'Launching a rebrand'] },
      { name: 'Personal Brand', topics: ['Personal branding', 'Founder brand building', 'Thought leadership positioning'] },
      { name: 'Research', topics: ['Brand research', 'Customer perception studies', 'Competitive brand audits'] },
    ],
  },
  {
    id: 'music-production', name: 'Music Production & Audio', group: 'Creative & Content', niche: 'creative', business: 'Music',
    industry: 'Music', monetization: 'Medium', demand: 'Medium', audience: ['Creators'], mods: ['for beginners', 'advanced'],
    subs: [
      { name: 'Production', topics: ['Beat making', 'Music arrangement', 'Sampling', 'Sound design', 'Home studio setup'] },
      { name: 'Mixing', topics: ['Mixing fundamentals', 'EQ & compression', 'Vocal mixing', 'Mastering basics'] },
      { name: 'Instruments', topics: ['Learning guitar', 'Learning piano', 'Music theory', 'Singing technique', 'Drumming'] },
      { name: 'Music Business', topics: ['Releasing music independently', 'Music distribution', 'Sync licensing', 'Streaming royalties', 'Building a fanbase'] },
      { name: 'Genres', topics: ['Hip hop production', 'Electronic music production', 'Lo-fi production', 'Film scoring basics'] },
    ],
  },
  {
    id: 'screenwriting-film', name: 'Screenwriting & Filmmaking', group: 'Creative & Content', niche: 'creative', business: 'Film',
    industry: 'Media', monetization: 'Medium', demand: 'Medium', audience: ['Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Writing', topics: ['Screenwriting structure', 'Character development', 'Dialogue writing', 'Loglines & pitches', 'Script formatting'] },
      { name: 'Production', topics: ['Indie film production', 'Directing actors', 'Cinematography basics', 'Production scheduling', 'Location scouting'] },
      { name: 'Post', topics: ['Film editing', 'Colour grading for film', 'Sound design for film', 'Film scoring'] },
      { name: 'Industry', topics: ['Film festivals', 'Film funding', 'Pitching to producers', 'Distribution deals'] },
      { name: 'Formats', topics: ['Short films', 'TV pilots', 'Commercials', 'Music videos'] },
    ],
  },
  {
    id: 'comics-illustration-story', name: 'Comics & Visual Storytelling', group: 'Creative & Content', niche: 'creative', business: 'Illustration',
    industry: 'Publishing', monetization: 'Low', demand: 'Medium', competition: 'Low', audience: ['Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Craft', topics: ['Comic scripting', 'Panel layout', 'Character design for comics', 'Inking & lettering', 'Manga style drawing'] },
      { name: 'Publishing', topics: ['Webcomics', 'Self-publishing comics', 'Crowdfunding a comic', 'Comic conventions'] },
      { name: 'Other Formats', topics: ['Storyboarding', 'Children’s book illustration', 'Graphic novels', 'Editorial illustration'] },
      { name: 'Digital', topics: ['Digital inking', 'Colouring workflows', 'Comic lettering software'] },
    ],
  },
  {
    id: 'fashion-design', name: 'Fashion & Textile Design', group: 'Creative & Content', niche: 'creative', business: 'Fashion',
    industry: 'Fashion', monetization: 'Medium', demand: 'Medium', audience: ['Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Making', topics: ['Sewing fundamentals', 'Pattern making', 'Garment construction', 'Draping', 'Textile printing'] },
      { name: 'Design', topics: ['Fashion illustration', 'Collection development', 'Trend forecasting', 'Sustainable fashion design'] },
      { name: 'Business', topics: ['Starting a clothing line', 'Small-batch manufacturing', 'Fashion e-commerce', 'Slow fashion brands'] },
      { name: 'Styling', topics: ['Personal styling business', 'Wardrobe consulting', 'Editorial styling'] },
      { name: 'Accessories', topics: ['Bag making', 'Millinery', 'Shoe design', 'Jewellery for fashion'] },
    ],
  },
  {
    id: 'crafts-handmade', name: 'Crafts & Handmade Business', group: 'Creative & Content', niche: 'creative', business: 'Handmade',
    industry: 'Crafts', monetization: 'Medium', demand: 'Medium', audience: ['Creators', 'Individuals'], mods: ['for beginners', 'as a business'],
    subs: [
      { name: 'Crafts', topics: ['Candle making', 'Soap making', 'Resin art', 'Jewellery making', 'Macramé', 'Embroidery', 'Leatherwork'] },
      { name: 'Selling', topics: ['Selling on Etsy', 'Craft fair selling', 'Pricing handmade goods', 'Handmade product photography'] },
      { name: 'Scaling', topics: ['Batch production for makers', 'Craft studio setup', 'Wholesale for makers', 'Teaching craft workshops'] },
      { name: 'Seasonal', topics: ['Holiday crafts', 'Wedding crafts', 'Gift crafting', 'Craft kits'] },
    ],
  },
  {
    id: 'creator-business', name: 'Creator Business & Monetization', group: 'Creative & Content', niche: 'business', business: 'Creator Economy',
    industry: 'Media', monetization: 'Very High', demand: 'Very High', audience: ['Creators'], mods: ['for beginners', 'full-time'],
    subs: [
      { name: 'Revenue', topics: ['Creator revenue streams', 'Brand deal negotiation', 'Media kits', 'Rate setting for creators', 'Digital products for creators'] },
      { name: 'Operations', topics: ['Creator team building', 'Content batching systems', 'Creator contracts', 'Creator taxes & accounting'] },
      { name: 'Audience', topics: ['Audience ownership', 'Email list for creators', 'Community-led growth', 'Superfan strategy'] },
      { name: 'Longevity', topics: ['Avoiding creator burnout', 'Platform diversification', 'Evolving your niche', 'Creator mental health'] },
      { name: 'Legal', topics: ['Creator contracts & rights', 'FTC disclosure', 'Trademarking a creator brand'] },
    ],
  },

  // ============================ EDUCATION & SKILLS ============================
  {
    id: 'language-teaching', name: 'Language Teaching', group: 'Education & Skills', niche: 'career', business: 'Language Education',
    industry: 'Education', monetization: 'High', demand: 'High', audience: ['Professionals'], mods: ['for beginners', 'online'],
    subs: [
      { name: 'Teaching English', topics: ['Teaching English online', 'TEFL certification', 'Business English teaching', 'Exam preparation teaching', 'Teaching young learners'] },
      { name: 'Method', topics: ['Communicative language teaching', 'Lesson planning for languages', 'Error correction', 'Teaching pronunciation'] },
      { name: 'Business', topics: ['Finding language students', 'Language school business', 'Language course creation', 'Group language classes'] },
      { name: 'Other Languages', topics: ['Teaching Spanish', 'Teaching French', 'Teaching Mandarin', 'Teaching Arabic'] },
    ],
  },
  {
    id: 'corporate-training', name: 'Corporate Training & L&D', group: 'Education & Skills', niche: 'career', business: 'Corporate Training',
    industry: 'Education', monetization: 'Very High', demand: 'High', audience: ['Professionals'], mods: ['for beginners', 'virtual delivery'],
    subs: [
      { name: 'Design', topics: ['Training needs analysis', 'Learning objectives', 'Blended learning design', 'Microlearning'] },
      { name: 'Delivery', topics: ['Workshop facilitation', 'Virtual training delivery', 'Train-the-trainer', 'Engaging reluctant learners'] },
      { name: 'Measurement', topics: ['Kirkpatrick evaluation', 'Training ROI', 'Skills assessments', 'Learning analytics'] },
      { name: 'Business', topics: ['Selling training to companies', 'Training proposals', 'Day-rate pricing', 'Building a training practice'] },
      { name: 'Topics', topics: ['Leadership training', 'DEI training', 'Compliance training', 'Sales training programs'] },
    ],
  },
  {
    id: 'instructional-design', name: 'Instructional Design & EdTech', group: 'Education & Skills', niche: 'career', business: 'Instructional Design',
    industry: 'Education', monetization: 'High', demand: 'High', audience: ['Professionals', 'Creators'], mods: ['for beginners', 'for corporate'],
    subs: [
      { name: 'Design', topics: ['ADDIE model', 'Backward design', 'Scenario-based learning', 'Assessment design', 'Accessibility in learning'] },
      { name: 'Production', topics: ['E-learning authoring tools', 'Storyboarding courses', 'Video for e-learning', 'Interactive learning objects'] },
      { name: 'Platforms', topics: ['Learning management systems', 'SCORM & xAPI', 'Choosing a course platform', 'Learning experience platforms'] },
      { name: 'Career', topics: ['Instructional design portfolio', 'Freelance instructional design', 'Moving from teaching to ID'] },
      { name: 'Learning Science', topics: ['Cognitive load', 'Retrieval practice in courses', 'Spacing & interleaving'] },
    ],
  },
  {
    id: 'coaching-skills', name: 'Coaching Skills & Practice', group: 'Education & Skills', niche: 'business', business: 'Coaching',
    industry: 'Coaching', monetization: 'Very High', demand: 'High', audience: ['Professionals'], mods: ['for beginners', 'advanced'],
    subs: [
      { name: 'Core Skills', topics: ['Powerful questions', 'Active listening in coaching', 'Holding space', 'Accountability structures', 'Coaching presence'] },
      { name: 'Models', topics: ['GROW model', 'Solution-focused coaching', 'Somatic coaching', 'Narrative coaching', 'Systemic coaching'] },
      { name: 'Practice', topics: ['Coaching agreements', 'Client intake process', 'Coaching packages', 'Ethics & confidentiality', 'Supervision for coaches'] },
      { name: 'Growing', topics: ['Getting first coaching clients', 'Coaching niches', 'Group coaching design', 'Coaching certification pathways'] },
      { name: 'Specialisms', topics: ['Executive coaching practice', 'Team coaching', 'Career coaching practice', 'Wellbeing coaching'] },
    ],
  },
  {
    id: 'mentoring', name: 'Mentoring & Advising', group: 'Education & Skills', niche: 'career', business: 'Mentoring',
    industry: 'Professional Development', monetization: 'Medium', demand: 'Medium', competition: 'Low', audience: ['Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Being a Mentor', topics: ['Becoming a mentor', 'Mentoring conversations', 'Giving career advice', 'Sponsoring vs mentoring'] },
      { name: 'Being Mentored', topics: ['Finding a mentor', 'Making the most of mentorship', 'Managing multiple mentors'] },
      { name: 'Programs', topics: ['Designing a mentoring program', 'Mentor matching', 'Measuring mentoring impact'] },
      { name: 'Contexts', topics: ['Workplace mentoring', 'Youth mentoring', 'Startup mentoring', 'Peer mentoring'] },
    ],
  },
  {
    id: 'research-skills', name: 'Research & Academic Skills', group: 'Education & Skills', niche: 'career', business: 'Academia',
    industry: 'Education', monetization: 'Medium', demand: 'Medium', competition: 'Low', audience: ['Students', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Research', topics: ['Literature reviews', 'Research design', 'Qualitative methods', 'Quantitative methods', 'Systematic reviews'] },
      { name: 'Writing', topics: ['Academic writing', 'Thesis writing', 'Journal article structure', 'Citation management', 'Peer review process'] },
      { name: 'Academic Career', topics: ['PhD survival', 'Conference presenting', 'Grant applications', 'Academic job market', 'Leaving academia'] },
      { name: 'Data', topics: ['Data collection ethics', 'Survey sampling', 'Statistical reporting'] },
    ],
  },
  {
    id: 'exam-professional-prep', name: 'Professional Exam Preparation', group: 'Education & Skills', niche: 'career', business: 'Test Prep',
    industry: 'Education', monetization: 'High', demand: 'High', audience: ['Students', 'Professionals'], mods: ['for beginners'],
    subs: [
      { name: 'Business & Finance', topics: ['CPA exam preparation', 'CFA exam preparation', 'MBA admissions tests', 'Actuarial exams'] },
      { name: 'Technology', topics: ['Cloud certification prep', 'Security certification prep', 'Networking certification prep'] },
      { name: 'Admissions', topics: ['SAT preparation', 'ACT preparation', 'GRE preparation', 'Medical admissions tests', 'Law admissions tests'] },
      { name: 'Strategy', topics: ['Exam study plans', 'Practice test strategy', 'Managing exam day nerves'] },
      { name: 'Healthcare Exams', topics: ['Nursing licensure exams', 'Medical board exams', 'Pharmacy exams'] },
    ],
  },

  // ============================ LIFESTYLE & HOBBIES ============================
  {
    id: 'board-tabletop-gaming', name: 'Board & Tabletop Gaming', group: 'Lifestyle & Hobbies', niche: 'creative', business: 'Gaming',
    industry: 'Gaming', monetization: 'Low', demand: 'Medium', competition: 'Low', audience: ['Individuals', 'Creators'], mods: ['for beginners', 'for families'],
    subs: [
      { name: 'Playing', topics: ['Board game strategy', 'Tabletop roleplaying', 'Dungeon mastering', 'Miniature painting', 'Card game strategy'] },
      { name: 'Community', topics: ['Running a game night', 'Board game clubs', 'Convention play', 'Teaching games to new players'] },
      { name: 'Creating', topics: ['Designing a board game', 'Playtesting', 'Crowdfunding a tabletop game', 'Self-publishing RPG content'] },
      { name: 'Genres', topics: ['Euro games', 'Party games', 'Legacy games', 'Solo board gaming'] },
    ],
  },
  {
    id: 'esports-gaming', name: 'Gaming & Esports', group: 'Lifestyle & Hobbies', niche: 'creative', business: 'Gaming',
    industry: 'Gaming', monetization: 'Medium', demand: 'High', audience: ['Creators', 'Students'], mods: ['for beginners', 'as a career'],
    subs: [
      { name: 'Playing', topics: ['Competitive gaming improvement', 'Game sense & strategy', 'Aim training', 'Team communication in games'] },
      { name: 'Streaming', topics: ['Game streaming setup', 'Growing on Twitch', 'Stream overlays & branding', 'Streamer monetization'] },
      { name: 'Esports', topics: ['Esports career paths', 'Esports team management', 'Tournament organisation', 'Esports coaching'] },
      { name: 'Content', topics: ['Gaming YouTube channels', 'Game reviews', 'Speedrunning', 'Let’s play content'] },
      { name: 'Wellbeing', topics: ['Gaming posture & health', 'Screen time balance', 'Toxicity in gaming'] },
    ],
  },
  {
    id: 'astronomy-science-hobby', name: 'Astronomy & Science Hobbies', group: 'Lifestyle & Hobbies', niche: 'creative', business: 'Science Education',
    industry: 'Science', monetization: 'Low', demand: 'Low', competition: 'Low', audience: ['Individuals', 'Students'], mods: ['for beginners'],
    subs: [
      { name: 'Astronomy', topics: ['Stargazing', 'Choosing a telescope', 'Astrophotography', 'Planet observation', 'Meteor showers'] },
      { name: 'Earth Science', topics: ['Rock & mineral collecting', 'Fossil hunting', 'Weather watching', 'Citizen science projects'] },
      { name: 'Home Science', topics: ['Home science experiments', 'Microscopy at home', 'Science communication'] },
      { name: 'Learning', topics: ['Astronomy for kids', 'Star charts', 'Astronomy clubs'] },
    ],
  },
  {
    id: 'nature-wildlife', name: 'Nature & Wildlife', group: 'Lifestyle & Hobbies', niche: 'health', business: 'Outdoor',
    industry: 'Outdoor', monetization: 'Low', demand: 'Low', competition: 'Low', audience: ['Individuals', 'Seniors'], mods: ['for beginners', 'with kids'],
    subs: [
      { name: 'Observation', topics: ['Birdwatching', 'Wildlife photography', 'Nature journaling', 'Tracking animals', 'Foraging'] },
      { name: 'Conservation', topics: ['Habitat restoration', 'Wildlife gardening', 'Citizen conservation', 'Rewilding'] },
      { name: 'Water & Field', topics: ['Fishing', 'Fly fishing', 'Rockpooling', 'Mushroom identification'] },
      { name: 'Seasons', topics: ['Spring nature watching', 'Autumn foraging', 'Winter wildlife'] },
    ],
  },
  {
    id: 'motorsports-cycling', name: 'Cycling & Motorsports', group: 'Lifestyle & Hobbies', niche: 'health', business: 'Sports',
    industry: 'Sports', monetization: 'Medium', demand: 'Medium', audience: ['Individuals'], mods: ['for beginners', 'for fitness'],
    subs: [
      { name: 'Cycling', topics: ['Road cycling', 'Mountain biking', 'Gravel riding', 'Bike maintenance', 'Bikepacking', 'Commuting by bike'] },
      { name: 'Motorsport', topics: ['Track days', 'Karting', 'Motorcycle riding skills', 'Rally driving', 'Sim racing'] },
      { name: 'Gear', topics: ['Bike fitting', 'Choosing a bike', 'Riding safety', 'Winter riding'] },
      { name: 'Events', topics: ['Sportives & gran fondos', 'Bike touring events', 'Club racing'] },
    ],
  },
  {
    id: 'collecting', name: 'Collecting & Memorabilia', group: 'Lifestyle & Hobbies', niche: 'creative', business: 'Collectibles',
    industry: 'Collectibles', monetization: 'Medium', demand: 'Low', competition: 'Low', audience: ['Individuals'], mods: ['for beginners'],
    subs: [
      { name: 'Categories', topics: ['Trading card collecting', 'Coin collecting', 'Stamp collecting', 'Vinyl record collecting', 'Sneaker collecting', 'Vintage toy collecting'] },
      { name: 'Practice', topics: ['Grading & authentication', 'Collection cataloguing', 'Storage & preservation', 'Insuring a collection'] },
      { name: 'Trading', topics: ['Buying at auction', 'Selling collectibles', 'Spotting fakes', 'Collectible market trends'] },
      { name: 'Modern', topics: ['Digital collectibles', 'Funko & vinyl figures', 'Limited-edition drops'] },
    ],
  },
  {
    id: 'faith-practice', name: 'Faith & Religious Practice', group: 'Lifestyle & Hobbies', niche: 'mind', business: 'Faith',
    industry: 'Religion', monetization: 'Low', demand: 'Medium', competition: 'Low', audience: ['Individuals', 'Parents'], mods: ['for beginners'],
    subs: [
      { name: 'Practice', topics: ['Daily devotion', 'Scripture study', 'Prayer practice', 'Fasting traditions', 'Sabbath rest'] },
      { name: 'Community', topics: ['Small group leadership', 'Faith community building', 'Youth ministry', 'Serving & outreach'] },
      { name: 'Life', topics: ['Faith and work', 'Raising children in faith', 'Interfaith relationships', 'Faith through doubt'] },
      { name: 'Study', topics: ['Theology basics', 'Church history', 'Comparative religion'] },
    ],
  },

  // ============================ HOME & LIVING ============================
  {
    id: 'home-buying-selling', name: 'Home Buying & Selling', group: 'Home & Living', niche: 'money', business: 'Real Estate',
    industry: 'Real Estate', monetization: 'High', demand: 'High', audience: ['Individuals'], mods: ['for first-time buyers', 'for beginners', 'in a competitive market'],
    subs: [
      { name: 'Buying', topics: ['First-time home buying', 'Mortgage pre-approval', 'House hunting strategy', 'Making an offer', 'Home inspections', 'Closing process'] },
      { name: 'Selling', topics: ['Preparing a home to sell', 'Pricing your home', 'Choosing an agent', 'Selling without an agent', 'Negotiating offers'] },
      { name: 'Moving', topics: ['Moving checklists', 'Long-distance moving', 'Moving with kids', 'Downsizing a home'] },
      { name: 'Finance', topics: ['Mortgage types', 'Remortgaging', 'Stamp duty & closing costs', 'Help-to-buy schemes'] },
    ],
  },
  {
    id: 'renting-tenancy', name: 'Renting & Tenancy', group: 'Home & Living', niche: 'money', business: 'Real Estate',
    industry: 'Real Estate', monetization: 'Low', demand: 'Medium', competition: 'Low', audience: ['Individuals', 'Students'], mods: ['for beginners'],
    subs: [
      { name: 'Renting', topics: ['Finding a rental', 'Rental applications', 'Understanding leases', 'Tenant rights', 'Getting your deposit back'] },
      { name: 'Living', topics: ['Renting with roommates', 'Renter-friendly upgrades', 'Renters insurance', 'Dealing with landlords'] },
      { name: 'Landlording', topics: ['Becoming a landlord', 'Screening tenants', 'Rental maintenance', 'Rent collection'] },
      { name: 'Disputes', topics: ['Repair disputes', 'Rent increases', 'Ending a tenancy early'] },
    ],
  },
  {
    id: 'home-maintenance', name: 'Home Maintenance & Systems', group: 'Home & Living', niche: 'creative', business: 'Home Services',
    industry: 'Home Services', monetization: 'Medium', demand: 'Medium', audience: ['Individuals'], mods: ['for beginners', 'on a budget'],
    subs: [
      { name: 'Seasonal', topics: ['Seasonal home maintenance', 'Winterising a home', 'Gutter maintenance', 'Roof inspection'] },
      { name: 'Systems', topics: ['HVAC maintenance', 'Water heater care', 'Electrical panel basics', 'Plumbing maintenance', 'Septic system care'] },
      { name: 'Efficiency', topics: ['Home insulation', 'Energy audits', 'Solar for homes', 'Reducing utility bills', 'Smart thermostats'] },
      { name: 'Problems', topics: ['Damp & mould', 'Pest control', 'Foundation issues', 'Emergency home repairs'] },
      { name: 'Appliances', topics: ['Appliance repair basics', 'Appliance lifespan', 'When to replace vs repair'] },
    ],
  },
  {
    id: 'home-security-safety', name: 'Home Security & Safety', group: 'Home & Living', niche: 'tech', business: 'Home Services',
    industry: 'Home Services', monetization: 'Medium', demand: 'Medium', competition: 'Low', audience: ['Individuals', 'Parents'], mods: ['for beginners'],
    subs: [
      { name: 'Security', topics: ['Home security systems', 'Smart locks & cameras', 'Deterring burglars', 'Securing a rental'] },
      { name: 'Safety', topics: ['Fire safety at home', 'Carbon monoxide safety', 'Childproofing a home', 'Home first aid kits'] },
      { name: 'Preparedness', topics: ['Emergency preparedness', 'Power outage planning', 'Natural disaster readiness', 'Home emergency fund'] },
      { name: 'Travel', topics: ['Securing a home while away', 'House sitting', 'Holiday security'] },
    ],
  },
  {
    id: 'cleaning-household', name: 'Cleaning & Household Systems', group: 'Home & Living', niche: 'mind', business: 'Home Organization',
    industry: 'Home Services', monetization: 'Medium', demand: 'Medium', audience: ['Individuals', 'Parents'], mods: ['for beginners', 'for small homes'],
    subs: [
      { name: 'Cleaning', topics: ['Cleaning routines', 'Deep cleaning', 'Natural cleaning products', 'Speed cleaning', 'Cleaning schedules'] },
      { name: 'Laundry & Textiles', topics: ['Laundry systems', 'Stain removal', 'Fabric care', 'Clothing repair', 'Wardrobe maintenance'] },
      { name: 'Household Management', topics: ['Household chore systems', 'Sharing domestic labour', 'Meal & household planning', 'Home inventory'] },
      { name: 'Business', topics: ['Starting a cleaning business', 'Cleaning business pricing', 'Professional organizing services'] },
      { name: 'Specialist Cleaning', topics: ['Carpet cleaning', 'Window cleaning', 'Post-renovation cleaning', 'Move-out cleaning'] },
    ],
  },
  {
    id: 'home-office-workspace', name: 'Home Office & Workspace', group: 'Home & Living', niche: 'career', business: 'Remote Work',
    industry: 'Workplace', monetization: 'Medium', demand: 'High', audience: ['Professionals', 'Creators'], mods: ['for beginners'],
    subs: [
      { name: 'Setup', topics: ['Home office design', 'Desk setup', 'Ergonomic seating', 'Lighting for video calls', 'Cable management'] },
      { name: 'Tech', topics: ['Home office tech', 'Monitor setups', 'Home networking for work', 'Audio setup for calls'] },
      { name: 'Working from Home', topics: ['Work-from-home routines', 'Separating work and home', 'Home office tax deductions', 'Working from small spaces'] },
      { name: 'Shared Spaces', topics: ['Coworking vs home', 'Garden offices', 'Shared household workspaces'] },
    ],
  },
  {
    id: 'sustainable-home', name: 'Sustainable & Self-Sufficient Living', group: 'Home & Living', niche: 'health', business: 'Green Living',
    industry: 'Sustainability', monetization: 'Low', demand: 'Medium', competition: 'Low', audience: ['Individuals', 'Parents'], mods: ['for beginners'],
    subs: [
      { name: 'Self-Sufficiency', topics: ['Homesteading', 'Backyard chickens', 'Food preservation at home', 'Rainwater harvesting', 'Off-grid living'] },
      { name: 'Low Waste', topics: ['Plastic-free home', 'Refill & bulk buying', 'Repair culture', 'Secondhand living'] },
      { name: 'Energy', topics: ['Home energy independence', 'Heat pumps', 'Electric vehicle charging at home', 'Home battery storage'] },
      { name: 'Food', topics: ['Growing your own food', 'Community gardens', 'Seasonal eating at home'] },
    ],
  },
];
