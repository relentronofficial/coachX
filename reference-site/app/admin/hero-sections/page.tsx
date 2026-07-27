import { HomepageEditor } from '@/components/admin/HomepageEditor';

export const dynamic = 'force-dynamic';

export default function AdminHeroSectionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Homepage — Hero & SEO</h1>
      <p className="mt-1 text-sm text-slate-500">Edit the homepage hero and meta tags. Changes go live immediately.</p>
      <div className="mt-6">
        <HomepageEditor />
      </div>
    </div>
  );
}
