import 'server-only';
import { cookies } from 'next/headers';
import { verifyToken, SESSION_COOKIE, type SessionUser } from './jwt';
import { isAdminRole } from './permissions';

/**
 * Server-only session reader. Reads + validates the signed JWT from the
 * httpOnly cookie — never trusting client state. Credential checking lives in
 * the login route; the *mechanics* (sign/verify/expiry) live in ./jwt.
 */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}

/** Server helper: the current user if they may enter the admin panel, else null. */
export async function getAdmin(): Promise<SessionUser | null> {
  const user = await getSession();
  return user && isAdminRole(user.role) ? user : null;
}

export type { SessionUser };
