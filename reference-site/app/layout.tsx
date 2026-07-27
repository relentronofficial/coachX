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
  // Absolute base for every relative URL Next generates (OG images, canonical
  // links). Without it, share previews on WhatsApp/LinkedIn get a relative
  // path they cannot resolve, and the card renders without an image.
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s · ${brand.short}`,
  },
  description: brand.description,
  alternates: { canonical: '/' },
  applicationName: brand.short,
  keywords: ['coaching business', 'coach training', 'niche finder', 'Tamil Business Tribe', 'CoachX'],
  openGraph: {
    type: 'website',
    siteName: brand.name,
    url: brand.url,
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    locale: 'en_IN',
    images: [{ url: '/brand/coachx-logo.png', width: 1617, height: 444, alt: brand.short }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    images: ['/brand/coachx-logo.png'],
  },
  robots: { index: true, follow: true },
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
