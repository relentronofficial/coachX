/**
 * Firebase client SDK — single reusable initializer.
 *
 * Uses the modular Firebase v9+ API (tree-shakeable). Config comes from public
 * env vars (NEXT_PUBLIC_FIREBASE_*), so this module is safe to import in client
 * components. `getApps()` guards against re-initialising during HMR / repeated
 * imports.
 *
 * Set the values in `.env.local` (see `.env.example`). If they are missing the
 * SDK still initialises but calls will fail at runtime — check `isFirebaseConfigured`.
 */
import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const env = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True only when real config is supplied via env. */
export const isFirebaseConfigured = Boolean(env.apiKey && env.projectId);

/**
 * Cloud Storage is a *separate* capability from the database. On the free
 * (Spark) plan a new project has Auth + Firestore but no Storage bucket, so
 * Storage must be switchable independently. It is ON whenever Firebase is
 * configured, unless explicitly disabled with
 * `NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED=false` (what the free-tier .env.local
 * sets). Upload UIs and helpers check this and degrade gracefully.
 */
export const isStorageConfigured =
  isFirebaseConfigured && process.env.NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED !== 'false';

/**
 * When env is missing (local/CI without a project) we still initialise with
 * non-empty placeholders so `getAuth`/`getFirestore` don't THROW at import
 * (which would break SSR). Actual network calls fail until real config is set —
 * guard with `isFirebaseConfigured`.
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: env.apiKey || 'unconfigured-api-key',
  authDomain: env.authDomain || 'unconfigured.firebaseapp.com',
  projectId: env.projectId || 'unconfigured',
  storageBucket: env.storageBucket || 'unconfigured.appspot.com',
  messagingSenderId: env.messagingSenderId || '000000000000',
  appId: env.appId || '1:000000000000:web:unconfigured',
};

/** Initialise once (idempotent across HMR / multiple imports). */
export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/** Firebase Authentication instance. */
export const auth: Auth = getAuth(firebaseApp);

/** Cloud Firestore instance. */
export const db: Firestore = getFirestore(firebaseApp);

/** Cloud Storage instance. */
export const storage: FirebaseStorage = getStorage(firebaseApp);

export default firebaseApp;
