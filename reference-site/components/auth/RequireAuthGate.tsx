'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoginRequiredModal } from './LoginRequiredModal';

/**
 * Rendered by a protected page (server-decided) when there is no valid session.
 * Shows a locked placeholder + the Login Required modal. The tool itself is
 * never rendered, so Next / Results / saved-progress are all unreachable.
 */
export function RequireAuthGate({ toolName }: { toolName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-card border border-slate-200 bg-white p-10 text-center shadow-soft">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-pill bg-blush text-2xl">🔒</div>
        <h2 className="mt-4 text-h3">{toolName} is a member tool</h2>
        <p className="mt-2 text-slate-500">Log in to open this tool, continue your steps and save your progress.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => setOpen(true)} className="btn-primary">
            Log in to continue
          </button>
          <button onClick={() => router.push('/tools')} className="btn-secondary">
            Back to tools
          </button>
        </div>
      </div>

      <LoginRequiredModal open={open} onCancel={() => setOpen(false)} next={pathname} />
    </div>
  );
}
