/**
 * Minimal, dependency-free user-agent parsing → { browser, os, device }.
 * Good enough for admin display; swap for a full UA library if needed.
 */
export interface ParsedUA {
  browser: string;
  os: string;
  device: string;
}

export function parseUserAgent(ua: string | null | undefined): ParsedUA {
  const s = ua ?? '';
  if (!s) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };

  // Browser (order matters — Edge/Chrome/Safari overlap).
  let browser = 'Unknown';
  if (/edg[ea]?\//i.test(s)) browser = 'Edge';
  else if (/opr\/|opera/i.test(s)) browser = 'Opera';
  else if (/chrome\//i.test(s) && !/chromium/i.test(s)) browser = 'Chrome';
  else if (/chromium/i.test(s)) browser = 'Chromium';
  else if (/firefox\//i.test(s)) browser = 'Firefox';
  else if (/safari\//i.test(s) && /version\//i.test(s)) browser = 'Safari';

  // OS.
  let os = 'Unknown';
  if (/windows nt/i.test(s)) os = 'Windows';
  else if (/android/i.test(s)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(s)) os = 'iOS';
  else if (/mac os x/i.test(s)) os = 'macOS';
  else if (/linux/i.test(s)) os = 'Linux';

  // Device type.
  let device = 'Desktop';
  if (/ipad|tablet/i.test(s)) device = 'Tablet';
  else if (/mobi|iphone|android.*mobile/i.test(s)) device = 'Mobile';

  return { browser, os, device };
}
