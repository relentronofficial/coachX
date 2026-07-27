#!/usr/bin/env node
/**
 * Firebase integration verifier.
 *
 * Checks the live project end-to-end — config, Auth, Firestore, Storage, rules,
 * roles — and prints a PASS/FAIL line per requirement. Every check hits the real
 * backend; nothing is inferred from the code. Exits non-zero if anything fails,
 * so it can gate CI.
 *
 *   node scripts/firebase-verify.mjs
 *   node scripts/firebase-verify.mjs --keep    (don't delete the temp user)
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KEEP = process.argv.includes('--keep');

// ---- tiny .env.local loader (no dependency on Next's loader) --------------
function loadEnv() {
  const path = join(ROOT, '.env.local');
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };
// Storage is a paid capability; the free (Spark) plan has none. When disabled,
// its checks are SKIPPED (not failed) so a fully-free project still verifies green.
const STORAGE_ENABLED = env.NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED !== 'false';
const results = [];
const skipped = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  const tag = ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`${tag}  ${name}${detail ? `  — ${detail}` : ''}`);
};
const skip = (name, why) => {
  skipped.push({ name, why });
  console.log(`\x1b[33mSKIP\x1b[0m  ${name}  — ${why}`);
};

const CONFIG_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

console.log('\n\x1b[1mFirebase integration verification\x1b[0m\n');

// ---- 1/2. Config present --------------------------------------------------
const missing = CONFIG_KEYS.filter((k) => !env[k]);
if (missing.length) {
  record('Firebase configuration (.env.local)', false, `missing: ${missing.join(', ')}`);
  console.log(`
\x1b[33mCannot continue.\x1b[0m Create reference-site/.env.local from .env.example with the
values from Firebase console → Project settings → General → Your apps → SDK setup.
Then re-run: node scripts/firebase-verify.mjs
`);
  process.exit(1);
}
record('Firebase configuration (.env.local)', true, `project ${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);

// ---- SDK bootstrap --------------------------------------------------------
const { initializeApp, deleteApp } = await import('firebase/app');
const {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, deleteUser, setPersistence, inMemoryPersistence,
} = await import('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp, collection, addDoc, getDocs, query, where, limit } = await import('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = await import('firebase/storage');

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
}, `verify-${Date.now()}`);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
await setPersistence(auth, inMemoryPersistence);

record('Firebase SDK initialization', true, 'app, auth, firestore, storage');

const stamp = Date.now();
const email = `verify_${stamp}@coachx-verify.example.com`;
const password = `Verify!${stamp}`;
let uid = null;
let created = null;

// ---- 3/14. Auth: Email/Password enabled + registration --------------------
try {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  uid = cred.user.uid;
  created = cred.user;
  record('Firebase Authentication — Email/Password enabled', true);
  record('Registration (createUserWithEmailAndPassword)', true, `uid ${uid.slice(0, 8)}…`);
} catch (e) {
  const code = e?.code ?? '';
  const hint = code.includes('operation-not-allowed')
    ? 'Email/Password provider is DISABLED — enable it in Console → Authentication → Sign-in method'
    : code || e.message;
  record('Firebase Authentication — Email/Password enabled', false, hint);
  record('Registration (createUserWithEmailAndPassword)', false, hint);
}

// ---- 15. Firestore user profile creation ----------------------------------
if (uid) {
  try {
    await setDoc(doc(db, 'users', uid), {
      uid, fullName: 'Verification User', email, phone: '', role: 'user', status: 'active',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(), lastLogin: serverTimestamp(),
    });
    const snap = await getDoc(doc(db, 'users', uid));
    record('Firestore connected + user profile created', snap.exists(), snap.exists() ? 'users/{uid} written and read back' : 'write succeeded but read returned nothing');
  } catch (e) {
    record('Firestore connected + user profile created', false, e?.code ?? e.message);
  }

  // ---- 6. Rules: self-escalation must be REJECTED --------------------------
  try {
    await setDoc(doc(db, 'users', uid), { role: 'super-admin' }, { merge: true });
    record('Firestore rules — role self-escalation blocked', false, 'SECURITY: client was allowed to set role=super-admin');
  } catch {
    record('Firestore rules — role self-escalation blocked', true, 'rejected as expected');
  }

  // ---- 6b. Rules: reading another user's profile must be REJECTED ----------
  try {
    await getDoc(doc(db, 'users', 'some-other-user-that-should-be-denied'));
    record('Firestore rules — cross-user read blocked', false, 'SECURITY: read of another profile allowed');
  } catch {
    record('Firestore rules — cross-user read blocked', true, 'rejected as expected');
  }
}

// ---- 16. Assessment submission stored in Firestore ------------------------
if (uid) {
  try {
    const ref1 = await addDoc(collection(db, 'nicheResults'), {
      uid, headlineScore: 72, topNiche: 'Verification niche', createdAt: serverTimestamp(),
      meta: { source: 'firebase-verify' },
    });
    const back = await getDocs(query(collection(db, 'nicheResults'), where('uid', '==', uid), limit(5)));
    record('Assessment submission stored in Firestore', back.size > 0, `nicheResults/${ref1.id.slice(0, 8)}… readable by owner`);
  } catch (e) {
    record('Assessment submission stored in Firestore', false, e?.code ?? e.message);
  }
}

// ---- 5/18. Storage upload ------------------------------------------------
if (uid && !STORAGE_ENABLED) {
  skip('Cloud Storage connected + upload works', 'Storage disabled (free plan — NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED=false)');
  skip('Storage rules — cross-user write blocked', 'Storage disabled (free plan)');
}
if (uid && STORAGE_ENABLED) {
  const path = `uploads/${uid}/verify_${stamp}.txt`;
  try {
    const body = new TextEncoder().encode(`coachx storage verification ${stamp}`);
    await uploadBytes(ref(storage, path), body, { contentType: 'text/plain' });
    const url = await getDownloadURL(ref(storage, path));
    const ok = typeof url === 'string' && url.startsWith('http');
    record('Cloud Storage connected + upload works', ok, ok ? 'uploaded, download URL issued' : 'no download URL');
    await deleteObject(ref(storage, path)).catch(() => {});
  } catch (e) {
    const code = e?.code ?? e.message;
    const hint = String(code).includes('unauthorized')
      ? 'upload denied — deploy storage.rules (firebase deploy --only storage)'
      : String(code).includes('no-default-bucket') || String(code).includes('bucket')
        ? 'no Storage bucket — enable Storage in the Firebase console'
        : code;
    record('Cloud Storage connected + upload works', false, hint);
  }

  // Storage rules: writing to another user's area must be REJECTED
  try {
    await uploadBytes(ref(storage, `uploads/not-my-uid-${stamp}/x.txt`), new TextEncoder().encode('x'));
    record('Storage rules — cross-user write blocked', false, 'SECURITY: wrote into another user’s folder');
    await deleteObject(ref(storage, `uploads/not-my-uid-${stamp}/x.txt`)).catch(() => {});
  } catch {
    record('Storage rules — cross-user write blocked', true, 'rejected as expected');
  }
}

// ---- 12. Logout -----------------------------------------------------------
try {
  await signOut(auth);
  record('Logout (signOut)', auth.currentUser === null, 'session cleared');
} catch (e) {
  record('Logout (signOut)', false, e?.code ?? e.message);
}

// ---- 11. Login (re-authenticate after logout) -----------------------------
try {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  record('Login (signInWithEmailAndPassword)', cred.user.uid === uid, 'same uid returned after re-login');
} catch (e) {
  record('Login (signInWithEmailAndPassword)', false, e?.code ?? e.message);
}

// ---- 13. Forgot password --------------------------------------------------
try {
  await sendPasswordResetEmail(auth, email);
  record('Forgot password (sendPasswordResetEmail)', true, 'reset email accepted by Firebase');
} catch (e) {
  const code = e?.code ?? e.message;
  record('Forgot password (sendPasswordResetEmail)', false, code);
}

// ---- Cleanup --------------------------------------------------------------
if (uid && !KEEP) {
  try {
    await deleteDoc(doc(db, 'users', uid)).catch(() => {});
    if (auth.currentUser) await deleteUser(auth.currentUser);
    console.log('\n\x1b[2mCleaned up the temporary verification user.\x1b[0m');
  } catch {
    console.log(`\n\x1b[33mCould not delete the temp user ${email} — remove it manually.\x1b[0m`);
  }
}

await deleteApp(app).catch(() => {});

// ---- Report ---------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
const skipNote = skipped.length ? ` · ${skipped.length} skipped (${skipped.map((s) => s.name).join(', ')})` : '';
console.log(`\n\x1b[1m${results.length - failed.length}/${results.length} checks passed${skipNote}\x1b[0m`);
if (failed.length) {
  console.log('\n\x1b[31mFailed:\x1b[0m');
  for (const f of failed) console.log(`  · ${f.name} — ${f.detail}`);
  process.exit(1);
}
console.log('\x1b[32mFirebase integration verified end-to-end.\x1b[0m\n');
