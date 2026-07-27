import type { Metadata } from 'next';
import { StrategyCallBooking } from '@/components/tools/StrategyCallBooking';

export const metadata: Metadata = {
  title: 'Book your FREE 1-to-1 Strategy Call',
  description:
    'Turn your assessment result into a plan. Book a free one-to-one strategy call with a CoachX strategist for personalised guidance and clear next steps.',
};

/** Destination for the low-clarity CTA on every assessment result page. */
export default function BookStrategyCallPage() {
  return <StrategyCallBooking />;
}
