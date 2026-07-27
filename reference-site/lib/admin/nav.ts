export type AdminGroup = 'Overview' | 'Submissions' | 'Catalog' | 'Content' | 'Media' | 'System';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  group: AdminGroup;
}

/** Admin modules. Adding a nav item never requires touching the guard. */
export const adminNav: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: '📊', group: 'Overview' },
  { label: 'Users', href: '/admin/users', icon: '👤', group: 'Overview' },
  { label: 'Roles & Permissions', href: '/admin/roles', icon: '🔐', group: 'Overview' },

  { label: 'Forms', href: '/admin/forms', icon: '🗂️', group: 'Submissions' },
  { label: 'Leads', href: '/admin/leads', icon: '🎯', group: 'Submissions' },
  { label: 'Assessments', href: '/admin/assessments', icon: '🧠', group: 'Submissions' },
  { label: 'Payments', href: '/admin/payments', icon: '💳', group: 'Submissions' },

  { label: 'Orders', href: '/admin/orders', icon: '🧾', group: 'Catalog' },
  { label: 'Programs', href: '/admin/programs', icon: '🎓', group: 'Catalog' },
  { label: 'Tools', href: '/admin/tools', icon: '🧰', group: 'Catalog' },
  { label: 'AI Niche Finder', href: '/admin/niche-finder', icon: '🧭', group: 'Catalog' },
  { label: 'Questions', href: '/admin/questions', icon: '❓', group: 'Catalog' },
  { label: 'Categories', href: '/admin/categories', icon: '🏷️', group: 'Catalog' },

  { label: 'Pages', href: '/admin/pages', icon: '📄', group: 'Content' },
  { label: 'Hero Sections', href: '/admin/hero-sections', icon: '🖼️', group: 'Content' },
  { label: 'Blogs', href: '/admin/blogs', icon: '✍️', group: 'Content' },
  { label: 'Testimonials', href: '/admin/testimonials', icon: '⭐', group: 'Content' },
  { label: 'FAQs', href: '/admin/faqs', icon: '💬', group: 'Content' },
  { label: 'Pricing', href: '/admin/pricing', icon: '💲', group: 'Content' },
  { label: 'Banners', href: '/admin/banners', icon: '📢', group: 'Content' },
  { label: 'Navigation Menu', href: '/admin/navigation', icon: '🧭', group: 'Content' },

  { label: 'Images', href: '/admin/images', icon: '🌄', group: 'Media' },
  { label: 'Videos', href: '/admin/videos', icon: '🎞️', group: 'Media' },
  { label: 'Files', href: '/admin/files', icon: '📎', group: 'Media' },

  { label: 'Notifications', href: '/admin/notifications', icon: '🔔', group: 'System' },
  { label: 'Emails', href: '/admin/emails', icon: '✉️', group: 'System' },
  { label: 'Reports', href: '/admin/reports', icon: '📈', group: 'System' },
  { label: 'Analytics', href: '/admin/analytics', icon: '📉', group: 'System' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: '📜', group: 'System' },
  { label: 'Site Settings', href: '/admin/settings', icon: '⚙️', group: 'System' },
  { label: 'SEO Settings', href: '/admin/seo', icon: '🔎', group: 'System' },
  { label: 'Theme Settings', href: '/admin/theme', icon: '🎨', group: 'System' },
];

export const adminGroups: AdminGroup[] = ['Overview', 'Submissions', 'Catalog', 'Content', 'Media', 'System'];

/** Forms considered assessments (tool completions). */
export const ASSESSMENT_FORM_KEYS = [
  'niche-finder',
  'niche-assessment',
  'personal-codex',
  'coach-persona-codex',
  'freedom-business-codex',
  'skills-strength-scorecard',
  'viral-reels-challenge',
  'youtube-domination',
];
