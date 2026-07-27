'use client';

/**
 * Cloud Storage helpers.
 *
 * Paths mirror `storage.rules`: `avatars/{uid}/…` is world-readable and
 * owner-writable, `uploads/{uid}/…` is private to the owner. Validation here is
 * a convenience for the user — the rules are the actual control, so never rely
 * on these checks for security.
 */

import {
  deleteObject, getDownloadURL, listAll, ref, uploadBytesResumable, type UploadTask,
} from 'firebase/storage';
import { isStorageConfigured, storage } from './firebase';

export const AVATAR_MAX_MB = 5;
export const UPLOAD_MAX_MB = 20;
export const ACCEPTED_IMAGE = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export interface StoredFile {
  name: string;
  path: string;
  url: string;
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super('Cloud Storage is not available on this plan. File uploads are disabled (the free plan has no Storage bucket).');
    this.name = 'StorageNotConfiguredError';
  }
}

/** Human-readable validation. Returns null when the file is acceptable. */
export function validateImage(file: File, maxMb = AVATAR_MAX_MB): string | null {
  if (!ACCEPTED_IMAGE.includes(file.type)) return `Choose a PNG, JPEG, WebP or GIF (got ${file.type || 'unknown'}).`;
  if (file.size > maxMb * 1024 * 1024) return `Image must be under ${maxMb}MB (yours is ${(file.size / 1024 / 1024).toFixed(1)}MB).`;
  return null;
}

export function validateUpload(file: File, maxMb = UPLOAD_MAX_MB): string | null {
  if (file.size === 0) return 'That file is empty.';
  if (file.size > maxMb * 1024 * 1024) return `File must be under ${maxMb}MB (yours is ${(file.size / 1024 / 1024).toFixed(1)}MB).`;
  return null;
}

/**
 * Strip anything that would make a storage path ambiguous or unsafe.
 * Dots are allowed (extensions) but `..` sequences are collapsed, so a crafted
 * name can never contribute a traversal segment to the object path.
 */
export function safeFileName(name: string): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/_{2,}/g, '_')
    .replace(/^[._-]+/, '')
    .slice(-80);
  // A name made only of separators carries no information — don't ship it.
  return /[a-zA-Z0-9]/.test(cleaned) ? cleaned : 'file';
}

function task(path: string, file: File, onProgress?: (pct: number) => void): Promise<string> {
  if (!isStorageConfigured) return Promise.reject(new StorageNotConfiguredError());
  const upload: UploadTask = uploadBytesResumable(ref(storage, path), file, { contentType: file.type || 'application/octet-stream' });
  return new Promise<string>((resolve, reject) => {
    upload.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        try {
          resolve(await getDownloadURL(upload.snapshot.ref));
        } catch (e) {
          reject(e);
        }
      },
    );
  });
}

/** Upload (replacing) a user's avatar. Resolves to the public download URL. */
export function uploadAvatar(uid: string, file: File, onProgress?: (pct: number) => void): Promise<string> {
  const err = validateImage(file);
  if (err) return Promise.reject(new Error(err));
  // Fixed name so a new avatar replaces the old one rather than accumulating.
  return task(`avatars/${uid}/avatar_${safeFileName(file.name)}`, file, onProgress);
}

/** Upload an arbitrary file into the user's private area. */
export function uploadUserFile(uid: string, file: File, onProgress?: (pct: number) => void): Promise<string> {
  const err = validateUpload(file);
  if (err) return Promise.reject(new Error(err));
  return task(`uploads/${uid}/${Date.now()}_${safeFileName(file.name)}`, file, onProgress);
}

export async function listUserFiles(uid: string): Promise<StoredFile[]> {
  if (!isStorageConfigured) return [];
  try {
    const res = await listAll(ref(storage, `uploads/${uid}`));
    return await Promise.all(res.items.map(async (item) => ({
      name: item.name,
      path: item.fullPath,
      url: await getDownloadURL(item),
    })));
  } catch {
    return [];
  }
}

export async function deleteUserFile(path: string): Promise<void> {
  if (!isStorageConfigured) throw new StorageNotConfiguredError();
  await deleteObject(ref(storage, path));
}
