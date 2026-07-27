import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container, Section } from '@/components/ui';
import { AssessmentWizard } from '@/components/tools/AssessmentWizard';
import { engineToolBySlug } from '@/lib/tools/configs';
import { getSession } from '@/lib/auth/session';
import { RequireAuthGate } from '@/components/auth/RequireAuthGate';
import { isProtectedToolSlug } from '@/lib/auth/protected';

// Auth is checked per request → render dynamically.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const { tool } = await params;
  const cfg = engineToolBySlug(tool);
  return cfg ? { title: cfg.name, description: cfg.description } : { title: 'Tool' };
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const cfg = engineToolBySlug(tool);
  if (!cfg) notFound();

  // SERVER-SIDE auth guard — the wizard is never sent to unauthenticated users.
  const session = isProtectedToolSlug(cfg.slug) ? await getSession() : { email: '', name: '' };

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_50%_0%,rgba(208,160,48,0.22),transparent_70%)]" />
        <Container className="relative py-12 text-center sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Free tool · {cfg.category}</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-h1 text-white">{cfg.name}</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-slate-300">{cfg.tagline}</p>
        </Container>
      </section>

      <Section>
        {session ? <AssessmentWizard slug={cfg.slug} /> : <RequireAuthGate toolName={cfg.name} />}
      </Section>

      <div className="border-t border-slate-200 bg-slate-50">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-sm text-slate-500 sm:flex-row">
          <span>Your answers are scored on your device and never stored on a server.</span>
          <Link href="/tools" className="font-semibold text-teal hover:underline">
            ← All tools
          </Link>
        </Container>
      </div>
    </>
  );
}
