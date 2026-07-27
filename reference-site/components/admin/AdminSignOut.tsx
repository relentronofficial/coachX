'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export function AdminSignOut({ compact = false }: { compact?: boolean }) {
  const { logout } = useAuth();
  const router = useRouter();

  async function onClick() {
    await logout();
    router.push('/');
    router.refresh();
  }

  if (compact) {
    return (
      <button onClick={onClick} className="mt-2 text-xs font-semibold text-teal hover:underline" data-testid="admin-signout">
        Sign out
      </button>
    );
  }
  return (
    <button onClick={onClick} className="btn-secondary" data-testid="admin-signout">
      Sign out
    </button>
  );
}
