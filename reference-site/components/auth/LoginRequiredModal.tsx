'use client';

import { useRouter } from 'next/navigation';
import { Modal } from '../Modal';

/**
 * "🔒 Login Required" modal. Login → /login (with a `next` redirect back),
 * Cancel → onCancel. Never uses browser alert().
 */
export function LoginRequiredModal({
  open,
  onCancel,
  next,
}: {
  open: boolean;
  onCancel: () => void;
  next?: string;
}) {
  const router = useRouter();
  const suffix = next ? `?next=${encodeURIComponent(next)}` : '';
  const loginHref = `/login${suffix}`;
  const signupHref = `/signup${suffix}`;

  return (
    <Modal open={open} onClose={onCancel} title={<span>🔒 Login Required</span>}>
      <p className="mt-3 text-slate-600">You must log in to continue.</p>
      <p className="mt-1 text-sm text-slate-500">Please sign in to access this tool and save your progress.</p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button onClick={onCancel} className="btn-secondary" data-testid="login-cancel">
          Cancel
        </button>
        <button onClick={() => router.push(loginHref)} className="btn-primary" data-testid="login-go">
          Login
        </button>
      </div>
      <p className="mt-4 text-center text-sm text-slate-500">
        New here?{' '}
        <button onClick={() => router.push(signupHref)} className="font-semibold text-teal hover:underline" data-testid="signup-go">
          Create an account
        </button>
      </p>
    </Modal>
  );
}
