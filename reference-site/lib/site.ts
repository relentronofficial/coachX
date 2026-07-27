/**
 * Site configuration + content for the CoachX reference site.
 *
 * Brand: CoachX by Tamil Business Tribe. Content reflects the user's own brand
 * (a 3-day coaching-growth workshop). Testimonial quotes are placeholders —
 * replace with your members' real words. Swap images/links for your assets.
 */

export const brand = {
  name: 'CoachX by Tamil Business Tribe',
  short: 'CoachX',
  tagline: 'Scale your coaching business in just 3 days.',
  email: 'support@tamilbusinesstribe.com',
};

export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Programs', href: '/programs' },
  { label: 'Tools', href: '/tools' },
  { label: 'Testimonials', href: '/stories' },
  { label: 'FAQs', href: '/#faq' },
];

export const footerNav: { title: string; links: NavItem[] }[] = [
  {
    title: 'Explore',
    links: [
      { label: 'About', href: '/about' },
      { label: 'The Workshop', href: '/masterclass' },
      { label: 'Programs', href: '/programs' },
      { label: 'Testimonials', href: '/stories' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Guides', href: '/guides' },
      { label: 'Free Tools', href: '/tools' },
      { label: 'Events', href: '/events' },
      { label: 'Reserve Your Spot', href: '/join' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Refund Policy', href: '#' },
    ],
  },
];

export const stats = [
  { value: '3 Days', label: 'live coaching-growth workshop' },
  { value: '₹499', label: 'one-time entry' },
  { value: '5-Week', label: 'growth framework' },
  { value: '7 AM IST', label: 'daily, live on Zoom' },
];

export const logos = ['Tamil Business Tribe', 'Marketing Mafia', 'the6.in'];

export const features = [
  {
    icon: '◆',
    title: 'Lead system',
    body: 'Attract high-quality leads with a zero-rupee marketing system that works consistently.',
  },
  {
    icon: '◆',
    title: 'Conversion system',
    body: 'Turn leads into paying clients with proven scripts, offers, and follow-up.',
  },
  {
    icon: '◆',
    title: 'Predictable revenue',
    body: 'Build a repeatable revenue system so growth stops depending on luck.',
  },
  {
    icon: '◆',
    title: 'Automation & scale',
    body: 'Put simple systems in place so your coaching business scales without burnout.',
  },
];

// The 5-week Coaching Growth Framework.
export const process = [
  { step: '01', title: 'Lead System Setup', body: 'Build a dependable pipeline of high-quality leads.' },
  { step: '02', title: 'Conversion System', body: 'Convert conversations into paying clients.' },
  { step: '03', title: 'Growth & Automation', body: 'Automate follow-up and delivery to save time.' },
  { step: '04', title: 'Optimization', body: 'Tune your offer, pricing, and messaging with data.' },
  { step: '05', title: 'Scaling', body: 'Scale to lakhs in predictable monthly revenue.' },
];

export type Program = {
  slug: string;
  name: string;
  price: string;
  cadence: string;
  summary: string;
  featured?: boolean;
  perks: string[];
};

export const programs: Program[] = [
  {
    slug: 'workshop',
    name: '3-Day Workshop',
    price: '₹499',
    cadence: 'one-time',
    summary: 'The flagship 3-day live workshop to install a predictable coaching-revenue system.',
    featured: true,
    perks: [
      '3 live Zoom sessions (7:00–8:30 AM IST)',
      'The complete CoachX framework',
      'Workshop workbook & templates',
      'Community access',
      'Recordings for a limited time',
    ],
  },
  {
    slug: 'mentorship',
    name: 'Mentorship',
    price: 'Custom',
    cadence: 'by application',
    summary: 'Ongoing group mentorship to implement the framework with guidance.',
    perks: ['Everything in the Workshop', 'Weekly group coaching', 'Accountability pods', 'Feedback on your funnel'],
  },
  {
    slug: 'done-with-you',
    name: 'Done-With-You',
    price: 'Custom',
    cadence: 'by application',
    summary: 'High-touch support to build and scale your revenue system with our team.',
    perks: ['Everything in Mentorship', '1:1 strategy reviews', 'System build support', 'Priority access'],
  },
];

export type Tool = { slug: string; name: string; blurb: string; tag: string };

export const tools: Tool[] = [
  { slug: 'lead-score', name: 'Lead Score Quiz', blurb: 'See how strong your current lead system really is.', tag: 'Quiz' },
  { slug: 'revenue-calculator', name: 'Revenue Calculator', blurb: 'Model clients, pricing, and predictable monthly revenue.', tag: 'Calculator' },
  { slug: 'niche-finder', name: 'Niche Finder', blurb: 'Pin down a focused, profitable coaching niche.', tag: 'Quiz' },
  { slug: 'content-planner', name: 'Content Planner', blurb: 'Plan zero-rupee content that attracts leads.', tag: 'Worksheet' },
];

export type Story = { slug: string; name: string; role: string; result: string; quote: string };

// Real member names/results from the brand; quotes are placeholders — replace with real ones.
export const stories: Story[] = [
  { slug: 'rajkamal', name: 'Rajkamal', role: 'SkilxNation', result: '₹10 Lakhs revenue', quote: 'The framework gave me a predictable system to grow.' },
  { slug: 'anusha', name: 'Anusha', role: 'Glorious', result: '₹10 Lakhs revenue', quote: 'I finally have a clear path from leads to paying clients.' },
  { slug: 'annamalai', name: 'Annamalai', role: 'Dream Zone', result: '₹15 Lakhs revenue', quote: 'Predictable revenue changed how I run my business.' },
  { slug: 'member-4', name: 'Member Name', role: 'Coaching business', result: 'Placeholder result', quote: 'Replace with a real member testimonial.' },
  { slug: 'member-5', name: 'Member Name', role: 'Coaching business', result: 'Placeholder result', quote: 'Replace with a real member testimonial.' },
  { slug: 'member-6', name: 'Member Name', role: 'Coaching business', result: 'Placeholder result', quote: 'Replace with a real member testimonial.' },
];

export type Guide = { slug: string; title: string; excerpt: string; minutes: number };

export const guides: Guide[] = [
  { slug: 'zero-rupee-marketing', title: 'Zero-rupee marketing for coaches', excerpt: 'How to attract leads without spending on ads.', minutes: 7 },
  { slug: 'lead-to-client', title: 'From lead to paying client', excerpt: 'A simple conversion system that works.', minutes: 8 },
  { slug: 'predictable-revenue', title: 'Building predictable revenue', excerpt: 'Turn one-off sales into a repeatable system.', minutes: 6 },
  { slug: 'scale-without-burnout', title: 'Scaling without burnout', excerpt: 'Automation and delegation for coaches.', minutes: 9 },
];

export type EventItem = { slug: string; name: string; when: string; format: string; blurb: string };

export const events: EventItem[] = [
  { slug: 'coachx-workshop', name: 'CoachX 3-Day Workshop', when: '04–06 Aug 2026', format: 'Zoom Live', blurb: '07:00–08:30 AM IST daily. Install a predictable coaching-revenue system.' },
  { slug: 'growth-masterclass', name: 'Growth Masterclass', when: 'Monthly', format: 'Online', blurb: 'A free live session on attracting and converting leads.' },
  { slug: 'tribe-meetup', name: 'Tribe Meetup', when: 'Quarterly', format: 'Hybrid', blurb: 'Network with coaches in the Tamil Business Tribe community.' },
];

export const faqs = [
  { q: 'Who is this workshop for?', a: 'Coaches, trainers, and consultants who want a predictable system to attract leads and convert them into paying clients.' },
  { q: 'Do I need an existing audience?', a: 'No. The framework covers attracting high-quality leads from scratch using a zero-rupee marketing approach.' },
  { q: 'When and where does it happen?', a: 'Three live Zoom sessions from 7:00–8:30 AM IST across the workshop dates. Recordings are available for a limited time.' },
  { q: 'How much does it cost?', a: 'A one-time ₹499 entry for the full 3-day live workshop.' },
  { q: 'Is the fee refundable?', a: 'The ₹499 workshop fee is a one-time, non-refundable payment.' },
];

/** Deterministic placeholder image. Swap for your own brand assets. */
export const img = (seed: string | number, w = 800, h = 600) => `https://picsum.photos/seed/cx-${seed}/${w}/${h}`;
