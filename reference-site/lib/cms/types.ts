/** CMS content shapes (shared by store + admin editors + public pages). */

export interface CtaContent {
  label: string;
  href: string;
}

export interface HomepageContent {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: CtaContent;
    secondaryCta: CtaContent;
    trust: string;
  };
  seo: { title: string; description: string };
}

export interface SiteSettings {
  site: { name: string; short: string; tagline: string; email: string };
  seo: { defaultTitle: string; defaultDescription: string; ogImage: string; robots: string };
  theme: { primary: string; accent: string; ink: string };
}

export interface CmsProgram {
  id: string;
  slug: string;
  name: string;
  price: string;
  cadence: string;
  summary: string;
  perks: string[];
  featured: boolean;
  published: boolean;
  order: number;
}
