'use client';

import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Role } from './auth/permissions';

/**
 * Firestore user profiles at `users/{uid}`. The client may read/write only its
 * OWN document (enforced by Firestore Security Rules); admins may read/write
 * any. Role & status are the source of truth for authorization.
 */
export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: 'active' | 'disabled';
  /** Cloud Storage download URL for the user's avatar, if they've set one. */
  avatarUrl?: string;
  createdAt: unknown;
  updatedAt: unknown;
  lastLogin: unknown;
}

export const USERS_COLLECTION = 'users';

/** Create the profile at first registration. Default role = 'user'. */
export async function createUserProfile(input: {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
}): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, input.uid);
  await setDoc(ref, {
    uid: input.uid,
    fullName: input.fullName,
    email: input.email.toLowerCase(),
    phone: input.phone ?? '',
    role: 'user' as Role,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/** Update lastLogin (called after a successful login). */
/**
 * Persist the avatar's download URL onto the profile. Kept separate from the
 * upload so Storage and Firestore failures surface independently — a successful
 * upload with a failed profile write is a recoverable state, not a lost file.
 */
export async function setAvatarUrl(uid: string, avatarUrl: string): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), { avatarUrl, updatedAt: serverTimestamp() });
}

export async function touchLastLogin(uid: string): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    lastLogin: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
