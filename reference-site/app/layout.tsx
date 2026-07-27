import type { Metadata, Viewport } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { brand } from '@/lib/site';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { getSession } from '@/lib/auth/session';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const lora = Lora({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s · ${brand.short}`,
  },
  description:
    'Original reference scaffold of a coaching-community website. Neutral placeholder content and design tokens — not affiliated with any real brand.',
  openGraph: {
    title: brand.name,
    description: brand.tagline,
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a2e1e',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body>
        <AuthProvider initialUser={user ? { uid: '', email: user.email, name: user.name, role: user.role } : null}>
          <Header />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
