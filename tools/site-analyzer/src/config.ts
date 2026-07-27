import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Tool root (parent of src/). */
export const TOOL_ROOT = path.resolve(__dirname, '..');

function bool(v: string | undefined, dflt: boolean): boolean {
  if (v === undefined) return dflt;
  return /^(1|true|yes|on)$/i.test(v.trim());
}
function num(v: string | undefined, dflt: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
}

const TARGET_URL = process.env.TARGET_URL ?? 'https://internetlifestylehub.com';
const targetUrl = new URL(TARGET_URL);

/** Viewport definitions used for screenshots & responsive checks. */
export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

export interface AppConfig {
  targetUrl: string;
  origin: string;
  host: string;
  seedUrl: string;

  maxConcurrency: number;
  minConcurrency: number;
  maxRequestRetries: number;
  maxRequests: number;
  maxCrawlDepth: number;

  requestHandlerTimeoutSecs: number;
  navigationTimeoutSecs: number;

  minDelayMs: number;
  maxJitterMs: number;

  userAgent: string;

  respectRobots: boolean;
  takeScreenshots: boolean;
  runAccessibility: boolean;
  checkBrokenLinks: boolean;
  headless: boolean;

  maxExcerptChars: number;

  outputDir: string;
  screenshotsDir: string;
  storageDir: string;

  /**
   * Route prefixes that are ALWAYS rejected regardless of robots.txt — these
   * encode the user's legal/safety boundaries (auth, admin, checkout, etc.).
   * Matched case-insensitively against the pathname.
   */
  rejectPathPrefixes: string[];
  /** Substrings that, if present anywhere in the path, cause rejection. */
  rejectPathContains: string[];
  /** Query keys that indicate a sensitive/signed URL — reject if present. */
  rejectQueryKeys: string[];
}

const outputDir = path.resolve(TOOL_ROOT, process.env.OUTPUT_DIR ?? 'output');
const storageDir = path.resolve(TOOL_ROOT, 'storage');

// Point Crawlee's persistent RequestQueue/Dataset at our storage dir. Set here
// (config is imported before crawlee) so the env var is in place on first read.
process.env.CRAWLEE_STORAGE_DIR = process.env.CRAWLEE_STORAGE_DIR ?? storageDir;

export const config: AppConfig = {
  targetUrl: TARGET_URL,
  origin: targetUrl.origin,
  host: targetUrl.hostname.toLowerCase(),
  seedUrl: targetUrl.origin + '/',

  maxConcurrency: num(process.env.MAX_CONCURRENCY, 2),
  minConcurrency: num(process.env.MIN_CONCURRENCY, 1),
  maxRequestRetries: num(process.env.MAX_REQUEST_RETRIES, 3),
  maxRequests: num(process.env.MAX_REQUESTS, 0),
  maxCrawlDepth: num(process.env.MAX_CRAWL_DEPTH, 4),

  requestHandlerTimeoutSecs: num(process.env.REQUEST_HANDLER_TIMEOUT_SECS, 120),
  navigationTimeoutSecs: num(process.env.NAVIGATION_TIMEOUT_SECS, 60),

  minDelayMs: num(process.env.MIN_DELAY_MS, 1500),
  maxJitterMs: num(process.env.MAX_JITTER_MS, 3000),

  userAgent:
    process.env.USER_AGENT ??
    'Mozilla/5.0 (compatible; SiteAnalyzer/1.0; +site-inventory analysis; respects robots.txt)',

  respectRobots: bool(process.env.RESPECT_ROBOTS, true),
  takeScreenshots: bool(process.env.TAKE_SCREENSHOTS, true),
  runAccessibility: bool(process.env.RUN_ACCESSIBILITY, true),
  checkBrokenLinks: bool(process.env.CHECK_BROKEN_LINKS, true),
  headless: bool(process.env.HEADLESS, true),

  maxExcerptChars: num(process.env.MAX_EXCERPT_CHARS, 300),

  outputDir,
  screenshotsDir: path.join(outputDir, 'screenshots'),
  storageDir,

  // Legal / safety boundaries — independent of robots.txt.
  rejectPathPrefixes: [
    '/admin',
    '/dashboard',
    '/account',
    '/profile',
    '/login',
    '/logout',
    '/signin',
    '/signout',
    '/register',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/checkout',
    '/cart',
    '/payment',
    '/pay',
    '/billing',
    '/order',
    '/submit',
    '/edit',
    '/publisher-handbook',
    '/wp-admin',
    '/wp-login',
  ],
  rejectPathContains: [
    '/logout',
    '/checkout',
    '/-ty', // thank-you pages (e.g. masterclass-ty)
    '/pause',
    '/stop',
    '/delete',
  ],
  rejectQueryKeys: ['token', 'access_token', 'auth', 'session', 'sig', 'signature', 'password', 'otp'],
};

/** Sensitive query keys that, if present, mark a URL as a signed/sensitive URL. */
export function hasSensitiveQuery(u: URL): boolean {
  for (const key of u.searchParams.keys()) {
    if (config.rejectQueryKeys.includes(key.toLowerCase())) return true;
  }
  return false;
}
