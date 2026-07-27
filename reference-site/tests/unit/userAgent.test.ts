import { describe, it, expect } from 'vitest';
import { parseUserAgent } from '@/lib/admin/userAgent';

describe('parseUserAgent', () => {
  it('detects Chrome on Windows desktop', () => {
    const r = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36');
    expect(r).toEqual({ browser: 'Chrome', os: 'Windows', device: 'Desktop' });
  });

  it('detects Safari on iPhone (mobile)', () => {
    const r = parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1');
    expect(r.os).toBe('iOS');
    expect(r.device).toBe('Mobile');
    expect(r.browser).toBe('Safari');
  });

  it('detects Firefox on Linux', () => {
    const r = parseUserAgent('Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0');
    expect(r.browser).toBe('Firefox');
    expect(r.os).toBe('Linux');
  });

  it('detects Android tablet', () => {
    const r = parseUserAgent('Mozilla/5.0 (Linux; Android 13; Tablet) AppleWebKit/537.36 Chrome/120.0 Safari/537.36');
    expect(r.os).toBe('Android');
    expect(r.device).toBe('Tablet');
  });

  it('handles empty/unknown gracefully', () => {
    expect(parseUserAgent('')).toEqual({ browser: 'Unknown', os: 'Unknown', device: 'Unknown' });
    expect(parseUserAgent(null)).toEqual({ browser: 'Unknown', os: 'Unknown', device: 'Unknown' });
  });
});
