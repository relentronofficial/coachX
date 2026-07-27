'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mainNav } from '@/lib/site';
import { Button, Container } from './ui';
import { Logo } from './Logo';
import { useAuth } from './auth/AuthProvider';
import { isAdminRole } from '@/lib/auth/permissions';

/** Announcement bar + sticky navbar with a responsive mobile menu. */
export function Header() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  async function onLogout() {
    await logout();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-ink text-white">
        <Container className="flex h-9 items-center justify-center text-center text-xs sm:text-sm">
          <span className="opacity-90">
            3-day live workshop · 04–06 Aug 2026 — <Link href="/masterclass" className="font-semibold underline underline-offset-2">reserve your spot →</Link>
          </span>
        </Container>
      </div>

      {/* Navbar */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" aria-label="CoachX home" className="shrink-0">
            <Logo height={32} poweredBy priority />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {mainNav.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-600 hover:text-ink">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <>
                {user && isAdminRole(user.role) ? (
                  <Link href="/admin" className="text-sm font-semibold text-teal hover:underline" data-testid="admin-link">
                    Admin
                  </Link>
                ) : null}
                <span className="max-w-[140px] truncate text-sm font-medium text-slate-600" title={user?.email}>
                  {user?.name}
                </span>
                <button onClick={onLogout} className="text-sm font-medium text-slate-600 hover:text-ink" data-testid="logout">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-ink" data-testid="login-link">
                  Log in
                </Link>
                <Link href="/signup" className="text-sm font-semibold text-teal hover:underline" data-testid="signup-link">
                  Sign up
                </Link>
              </>
            )}
            <Button href="/masterclass" variant="amber">
              Reserve your spot
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-pill text-ink hover:bg-slate-100 md:hidden"
          >
            <span className="text-xl">{open ? '✕' : '☰'}</span>
          </button>
        </Container>

        {/* Mobile menu */}
        {open ? (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <Container className="flex flex-col gap-1 py-4">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-pill px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                {isAuthenticated ? (
                  <button onClick={onLogout} className="btn-secondary">Log out ({user?.name})</button>
                ) : (
                  <>
                    <Button href="/login" variant="secondary">Log in</Button>
                    <Button href="/signup" variant="primary">Sign up</Button>
                  </>
                )}
                <Button href="/masterclass" variant="amber">Reserve your spot</Button>
              </div>
            </Container>
          </div>
        ) : null}
      </div>
    </header>
  );
}
