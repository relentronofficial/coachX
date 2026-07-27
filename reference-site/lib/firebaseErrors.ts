/** Map Firebase Auth error codes to friendly, non-leaky messages. */
export function firebaseAuthMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak (use at least 6 characters).';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Authentication is not configured yet.';
    default:
      return (err as Error)?.message || 'Something went wrong. Please try again.';
  }
}
