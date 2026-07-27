'use client';

/** Read a cookie value in the browser. */
function cookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}

/**
 * fetch wrapper for admin mutations — attaches the CSRF token header and JSON
 * content type. Use for POST/PATCH/DELETE to /api/admin/*.
 */
export function adminFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  headers.set('x-csrf-token', cookie('cx_csrf'));
  return fetch(url, { ...init, headers, cache: 'no-store' });
}
