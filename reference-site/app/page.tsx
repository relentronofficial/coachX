import type { Metadata } from 'next';
import {
  Hero,
  StatBar,
  LogoCloud,
  Features,
  Process,
  ProgramCards,
  Testimonials,
  Founder,
  CTA,
} from '@/components/sections';
import { FAQ } from '@/components/FAQ';
import { Section } from '@/components/ui';
import { getHomepage } from '@/lib/cms/store';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getHomepage();
  return { title: seo.title, description: seo.description };
}

export default async function HomePage() {
  const { hero } = await getHomepage();
  return (
    <>
      <Hero content={hero} />
      <StatBar />
      <LogoCloud />
      <Features />
      <Process />
      <ProgramCards limit={3} />
      <Testimonials />
      <Founder />
      <Section id="faq" className="bg-white">
        <FAQ />
      </Section>
      <CTA />
    </>
  );
}
