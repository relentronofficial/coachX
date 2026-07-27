import 'server-only';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { asRole, type Role } from './permissions';

/**
 * Server-side verification of a Firebase ID token WITHOUT firebase-admin.
 *
 * Firebase ID tokens are RS256 JWTs signed by Google. We verify the signature
 * against Google's public JWKS and check issuer/audience == our project. This
 * is the trust boundary for the session bridge — the client is never trusted.
 * Then we read the user's role/status from Firestore via the REST API using the
 * same token (so Firestore Security Rules still apply).
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';

// Google's public keys for Firebase Secure Token service (JWK format).
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

export interface FirebaseIdentity {
  uid: string;
  email: string;
  name: string;
}

/** Verify signature + iss/aud. Returns the identity or null. */
export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseIdentity | null> {
  if (!idToken || !PROJECT_ID) return null;
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    const uid = String(payload.sub ?? payload.user_id ?? '');
    if (!uid) return null;
    return {
      uid,
      email: String(payload.email ?? ''),
      name: String((payload.name as string) ?? (payload.email as string)?.split('@')[0] ?? 'User'),
    };
  } catch {
    return null;
  }
}

interface FirestoreValue {
  stringValue?: string;
  booleanValue?: boolean;
}

/**
 * Read `users/{uid}` via the Firestore REST API using the verified ID token.
 * Returns the stored role + status (defaults: role 'user', status 'active').
 * Security Rules still apply because we send the user's own token.
 */
export async function readUserRole(uid: string, idToken: string): Promise<{ role: Role; status: string }> {
  if (!PROJECT_ID) return { role: 'user', status: 'active' };
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { role: 'user', status: 'active' };
    const doc = (await res.json()) as { fields?: Record<string, FirestoreValue> };
    const role = asRole(doc.fields?.role?.stringValue);
    const status = doc.fields?.status?.stringValue ?? 'active';
    return { role, status };
  } catch {
    return { role: 'user', status: 'active' };
  }
}
