import type { Metadata } from 'next';
import { ProfilePanel } from '@/components/auth/ProfilePanel';
import { Container, Section, SectionHeading } from '@/components/ui';

export const metadata: Metadata = { title: 'Your profile' };

/**
 * Protected by `middleware.ts` (guests are redirected to /login). The panel
 * itself re-checks the client auth state — never trust the middleware alone.
 */
export default function ProfilePage() {
  return (
    <Section>
      <Container>
        <SectionHeading eyebrow="Account" title="Your profile" lead="Your photo, files and account details." />
        <div className="mt-8 max-w-2xl">
          <ProfilePanel />
        </div>
      </Container>
    </Section>
  );
}
