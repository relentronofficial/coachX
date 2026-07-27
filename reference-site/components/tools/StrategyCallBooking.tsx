'use client';

/**
 * Standalone host for the FREE 1-to-1 strategy call booking.
 *
 * This adds NO booking system of its own — it renders the existing
 * `components/nicheAI/Booking` flow (same form, same `/api/submit` ingestion
 * with `formKey: 'strategy-call'`, same admin inbox) outside the Niche Finder,
 * so the Codex result pages have somewhere to send people. `Booking` is styled
 * against the scoped `[data-cx-theme]` design system, hence the `cx-root`
 * wrapper — without it the glass surfaces have no CSS variables to resolve.
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Booking } from '@/components/nicheAI/Booking';
import { fromBookingQuery } from '@/lib/tools/booking';

function BookingScreen() {
  const params = useSearchParams();
  const { user } = useAuth();
  const context = fromBookingQuery(params);

  return (
    <Booking
      user={user ? { name: user.name, email: user.email } : null}
      source={context?.assessment ?? 'Assessment result'}
      context={context}
      // Arriving from a result page, so open on the form — no thank-you screen.
      skipIntro
    />
  );
}

export function StrategyCallBooking() {
  return (
    <div data-cx-theme="light" className="cx-root">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Suspense fallback={<p className="cx-muted text-center text-sm">Loading…</p>}>
          <BookingScreen />
        </Suspense>
      </div>
    </div>
  );
}
