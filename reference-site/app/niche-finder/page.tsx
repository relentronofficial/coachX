import type { Metadata } from 'next';
import { NicheFinderApp } from '@/components/nicheAI/NicheFinderApp';

export const metadata: Metadata = {
  title: 'AI Niche Finder',
  description:
    'Discover your most profitable coaching niche with the CoachX AI Niche Finder — an intelligent assessment that ranks your best-fit niches and delivers a full growth blueprint.',
};

/** Immersive, client-driven premium experience (its own dark/light theme). */
export default function NicheFinderAIPage() {
  return <NicheFinderApp />;
}
