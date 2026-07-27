'use client';

/**
 * Signed-in user's profile: avatar upload to Cloud Storage, private file
 * uploads, and the Firestore profile record. This is the surface that exercises
 * Storage end-to-end (upload → download URL → render → delete).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useAuth } from './AuthProvider';
import { isFirebaseConfigured, isStorageConfigured } from '@/lib/firebase';
import { setAvatarUrl } from '@/lib/userProfile';
import {
  deleteUserFile, listUserFiles, uploadAvatar, uploadUserFile, validateImage, validateUpload,
  type StoredFile,
} from '@/lib/storage';

export function ProfilePanel() {
  const { user, profile, loading, refresh } = useAuth();
  const [avatar, setAvatar] = useState<string>('');
  const [avatarPct, setAvatarPct] = useState<number | null>(null);
  const [filePct, setFilePct] = useState<number | null>(null);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const avatarInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { if (profile?.avatarUrl) setAvatar(profile.avatarUrl); }, [profile?.avatarUrl]);

  const reloadFiles = useCallback(async () => {
    if (user?.uid) setFiles(await listUserFiles(user.uid));
  }, [user?.uid]);
  useEffect(() => { void reloadFiles(); }, [reloadFiles]);

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError(''); setNotice('');
    const invalid = validateImage(file);
    if (invalid) { setError(invalid); return; }
    try {
      setAvatarPct(0);
      const url = await uploadAvatar(user.uid, file, setAvatarPct);
      await setAvatarUrl(user.uid, url);
      setAvatar(url);
      setNotice('Avatar updated.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setAvatarPct(null);
      if (avatarInput.current) avatarInput.current.value = '';
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError(''); setNotice('');
    const invalid = validateUpload(file);
    if (invalid) { setError(invalid); return; }
    try {
      setFilePct(0);
      await uploadUserFile(user.uid, file, setFilePct);
      setNotice(`Uploaded ${file.name}.`);
      await reloadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setFilePct(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  if (loading) return <p className="text-slate-500" data-testid="profile-loading">Loading your profile…</p>;
  if (!user) return <p className="text-slate-500">You need to sign in to view this page.</p>;

  return (
    <div className="space-y-8" data-testid="profile-panel">
      {!isFirebaseConfigured ? (
        <div className="rounded-card border border-amber/40 bg-amber/10 p-3 text-sm text-amber-dark" data-testid="profile-unconfigured">
          Firebase is not configured, so uploads are disabled. Set <code>NEXT_PUBLIC_FIREBASE_*</code> in <code>.env.local</code>.
        </div>
      ) : !isStorageConfigured ? (
        <div className="rounded-card border border-amber/40 bg-amber/10 p-3 text-sm text-amber-dark" data-testid="profile-storage-disabled">
          File and photo uploads aren’t available on the current plan — everything else on your profile works normally.
        </div>
      ) : null}
      {error ? <div className="rounded-card bg-red-50 p-3 text-sm font-semibold text-red-600" data-testid="profile-error">{error}</div> : null}
      {notice ? <div className="rounded-card bg-teal/10 p-3 text-sm font-semibold text-teal" data-testid="profile-notice">{notice}</div> : null}

      {/* Avatar */}
      <section>
        <h2 className="mb-3 text-lg font-extrabold text-ink">Profile photo</h2>
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
            {avatar ? (
              <Image src={avatar} alt="Your profile photo" width={80} height={80} className="h-20 w-20 object-cover" unoptimized data-testid="profile-avatar" />
            ) : (
              <span className="text-2xl font-bold text-slate-400" data-testid="profile-avatar-empty">
                {(profile?.fullName || user.name || user.email || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <input
              ref={avatarInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={onAvatar}
              disabled={!isStorageConfigured || avatarPct !== null}
              className="block text-sm"
              aria-label="Upload profile photo"
              data-testid="avatar-input"
            />
            <p className="mt-1 text-xs text-slate-400">PNG, JPEG, WebP or GIF · up to 5MB</p>
            {avatarPct !== null ? (
              <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-slate-100" data-testid="avatar-progress">
                <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${avatarPct}%` }} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Private files */}
      <section>
        <h2 className="mb-1 text-lg font-extrabold text-ink">Your files</h2>
        <p className="mb-3 text-xs text-slate-500">Private to your account — only you and an administrator can open them.</p>
        <input
          ref={fileInput}
          type="file"
          onChange={onFile}
          disabled={!isStorageConfigured || filePct !== null}
          className="block text-sm"
          aria-label="Upload a file"
          data-testid="file-input"
        />
        {filePct !== null ? (
          <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-slate-100" data-testid="file-progress">
            <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${filePct}%` }} />
          </div>
        ) : null}

        <ul className="mt-4 space-y-2" data-testid="file-list">
          {files.map((f) => (
            <li key={f.path} className="flex items-center gap-3 rounded-card border border-slate-200 p-2 text-sm">
              <a href={f.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-medium text-teal hover:underline">{f.name}</a>
              <button
                onClick={async () => {
                  try { await deleteUserFile(f.path); await reloadFiles(); setNotice(`Deleted ${f.name}.`); }
                  catch { setError('Could not delete that file.'); }
                }}
                className="text-xs font-semibold text-red-500 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
          {!files.length ? <li className="text-sm text-slate-400" data-testid="file-list-empty">No files uploaded yet.</li> : null}
        </ul>
      </section>

      {/* Account record */}
      <section>
        <h2 className="mb-3 text-lg font-extrabold text-ink">Account</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2" data-testid="profile-record">
          <div><dt className="text-xs font-semibold uppercase text-slate-400">Name</dt><dd className="text-ink">{profile?.fullName || user.name || '—'}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-slate-400">Email</dt><dd className="text-ink">{user.email}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-slate-400">Role</dt><dd className="text-ink" data-testid="profile-role">{profile?.role ?? user.role}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-slate-400">Status</dt><dd className="text-ink">{profile?.status ?? 'active'}</dd></div>
        </dl>
      </section>
    </div>
  );
}
