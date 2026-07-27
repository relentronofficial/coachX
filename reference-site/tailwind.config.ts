import type { Config } from 'tailwindcss';

/**
 * Design tokens derived from the crawl's `design-system.json`.
 * The site's neutrals map onto Tailwind's default `slate` scale, so we only
 * extend with the custom accent palette + radii/shadows observed on the site.
 * Values are structural design tokens, not any brand's content.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ---- CoachX brand palette (matched to the logo) ----
      // Sampled from the CoachX wordmark: green #105030 ("Coach") + gold
      // #d0a030 ("X"). Token names are kept semantic so existing components
      // pick up the new brand values automatically:
      //   `teal`   = primary brand GREEN
      //   `violet` = brand GREEN accent (badge text)
      //   `amber`  = brand GOLD accent
      //   `blush`  = soft green tint (badge background)
      colors: {
        ink: {
          DEFAULT: '#0a2e1e', // deep forest green-black — dominant dark surface
          800: '#0c3d24',
          700: '#0f5132',
        },
        teal: {
          DEFAULT: '#105030', // brand green (primary)
          dark: '#0c3d24',
        },
        amber: {
          DEFAULT: '#d0a030', // brand gold
          dark: '#b8862a',
        },
        violet: {
          DEFAULT: '#105030', // brand green (secondary accent)
        },
        blush: '#e7f1ec', // soft green tint
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Lora', 'Georgia', 'serif'],
      },
      fontSize: {
        // Observed scale (px → rem).
        display: ['3rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }], // 48
        h1: ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }], // 44
        h2: ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }], // 36
        h3: ['1.875rem', { lineHeight: '1.2' }], // 30
      },
      borderRadius: {
        card: '16px',
        pill: '9999px',
        xl2: '24px',
      },
      boxShadow: {
        soft: '0 4px 6px -1px rgba(15,23,42,0.06), 0 10px 20px -5px rgba(15,23,42,0.10), 0 20px 40px -10px rgba(15,23,42,0.08)',
        // Brand-green tinted glow to match the primary CTA colour.
        glow: '0 10px 15px -3px rgba(16,80,48,0.20), 0 4px 6px -4px rgba(16,80,48,0.20)',
        'glow-lg': '0 20px 25px -5px rgba(16,80,48,0.20), 0 8px 10px -6px rgba(16,80,48,0.20)',
      },
      maxWidth: {
        container: '1200px',
        wide: '1440px',
      },
    },
  },
  plugins: [],
};

export default config;
