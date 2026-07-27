'use client';

/**
 * Firestore data layer for the AI Niche Finder (client SDK + security rules,
 * mirroring lib/userProfile.ts).
 *
 * Collections: questionCategories, nicheQuestions, nicheAnswers, nicheResults,
 * reports, analytics, auditLogs, settings.
 *
 * Every function degrades gracefully: when Firebase is not configured (no
 * project env) or a call fails, config reads fall back to the in-code seed and
 * user writes become no-ops — so the whole experience works in local dev with
 * zero backend, exactly like the rest of the app.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { seedCategories, seedQuestions } from './questionBank';
import { DEFAULT_SETTINGS, type AnalysisResult, type Answers, type NicheSettings, type Question, type QuestionCategory } from './types';

export const COLLECTIONS = {
  categories: 'questionCategories',
  questions: 'nicheQuestions',
  answers: 'nicheAnswers',
  results: 'nicheResults',
  reports: 'reports',
  analytics: 'analytics',
  audit: 'auditLogs',
  settings: 'settings',
} as const;

// ---------------------------------------------------------------------------
// Effective config (categories + questions) — Firestore over seed.
// ---------------------------------------------------------------------------

export async function loadCategories(): Promise<QuestionCategory[]> {
  if (!isFirebaseConfigured) return seedCategories;
  try {
    const snap = await getDocs(query(collection(db, COLLECTIONS.categories), orderBy('order')));
    if (snap.empty) return seedCategories;
    return snap.docs.map((d) => d.data() as QuestionCategory);
  } catch {
    return seedCategories;
  }
}

export async function loadQuestions(): Promise<Question[]> {
  if (!isFirebaseConfigured) return seedQuestions;
  try {
    const snap = await getDocs(query(collection(db, COLLECTIONS.questions), orderBy('order')));
    if (snap.empty) return seedQuestions;
    return snap.docs.map((d) => d.data() as Question);
  } catch {
    return seedQuestions;
  }
}

/** Questions the assessment should actually render (enabled only). */
export async function loadEnabledQuestions(): Promise<Question[]> {
  return (await loadQuestions()).filter((q) => q.enabled);
}

// ---------------------------------------------------------------------------
// In-progress attempt (autosave / resume). One doc per user.
// ---------------------------------------------------------------------------

export async function saveAttempt(uid: string, answers: Answers, stepIndex: number): Promise<void> {
  if (!isFirebaseConfigured || !uid) return;
  try {
    await setDoc(
      doc(db, COLLECTIONS.answers, uid),
      { uid, answers, stepIndex, status: 'in-progress', updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    /* non-blocking — localStorage still holds progress */
  }
}

export async function loadAttempt(uid: string): Promise<{ answers: Answers; stepIndex: number } | null> {
  if (!isFirebaseConfigured || !uid) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.answers, uid));
    if (!snap.exists()) return null;
    const d = snap.data() as { answers?: Answers; stepIndex?: number; status?: string };
    if (d.status === 'completed') return null;
    return { answers: d.answers ?? {}, stepIndex: d.stepIndex ?? 0 };
  } catch {
    return null;
  }
}

export async function clearAttempt(uid: string): Promise<void> {
  if (!isFirebaseConfigured || !uid) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.answers, uid), { status: 'completed', updatedAt: serverTimestamp() });
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Results, reports, history, favourites.
// ---------------------------------------------------------------------------

/** Persist a completed analysis and its report summary. Returns the stored id (or the local id offline). */
export async function saveResult(result: AnalysisResult): Promise<string> {
  if (!isFirebaseConfigured || !result.uid) return result.id;
  try {
    const ref = await addDoc(collection(db, COLLECTIONS.results), {
      ...result,
      createdAt: serverTimestamp(),
    });
    const top = result.recommendations[0];
    await addDoc(collection(db, COLLECTIONS.reports), {
      uid: result.uid,
      resultId: ref.id,
      topNiche: top?.title ?? 'n/a',
      headlineScore: result.headlineScore,
      favourite: false,
      createdAt: serverTimestamp(),
    });
    await logAnalytics('assessment_completed', result.uid, { topNiche: top?.title, score: result.headlineScore });
    return ref.id;
  } catch {
    return result.id;
  }
}

export interface HistoryRow extends AnalysisResult {
  _id: string;
}

export async function listHistory(uid: string, max = 25): Promise<HistoryRow[]> {
  if (!isFirebaseConfigured || !uid) return [];
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.results), where('uid', '==', uid), orderBy('createdAt', 'desc'), fbLimit(max)),
    );
    return snap.docs.map((d) => ({ ...(d.data() as AnalysisResult), _id: d.id }));
  } catch {
    return [];
  }
}

export async function getResult(id: string): Promise<AnalysisResult | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.results, id));
    return snap.exists() ? (snap.data() as AnalysisResult) : null;
  } catch {
    return null;
  }
}

export async function deleteResult(id: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.results, id));
  } catch {
    /* ignore */
  }
}

export interface ReportRow {
  id: string;
  resultId: string;
  topNiche: string;
  headlineScore: number;
  favourite: boolean;
}

export async function listUserReports(uid: string, max = 50): Promise<ReportRow[]> {
  if (!isFirebaseConfigured || !uid) return [];
  try {
    const snap = await getDocs(query(collection(db, COLLECTIONS.reports), where('uid', '==', uid), orderBy('createdAt', 'desc'), fbLimit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReportRow, 'id'>) }));
  } catch {
    return [];
  }
}

export async function setFavourite(reportId: string, favourite: boolean): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.reports, reportId), { favourite });
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Settings (scoring weights, prompt templates, notifications).
// ---------------------------------------------------------------------------

const SETTINGS_DOC = 'nicheFinder';

export async function getSettings(): Promise<NicheSettings> {
  if (!isFirebaseConfigured) return DEFAULT_SETTINGS;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.settings, SETTINGS_DOC));
    if (!snap.exists()) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<NicheSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: NicheSettings): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, COLLECTIONS.settings, SETTINGS_DOC), s, { merge: true });
}

// ---------------------------------------------------------------------------
// Analytics + audit (fire-and-forget).
// ---------------------------------------------------------------------------

export async function logAnalytics(type: string, uid: string | null, meta: Record<string, unknown> = {}): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    await addDoc(collection(db, COLLECTIONS.analytics), { type, uid, meta, at: serverTimestamp() });
  } catch {
    /* ignore */
  }
}

export async function auditLog(actor: string, action: string, target: string | null, meta: Record<string, unknown> = {}): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    await addDoc(collection(db, COLLECTIONS.audit), { actor, action, target, meta, at: serverTimestamp() });
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Admin reads (guarded by Firestore rules → admins only).
// ---------------------------------------------------------------------------

export async function listAllResults(max = 200): Promise<HistoryRow[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(query(collection(db, COLLECTIONS.results), orderBy('createdAt', 'desc'), fbLimit(max)));
    return snap.docs.map((d) => ({ ...(d.data() as AnalysisResult), _id: d.id }));
  } catch {
    return [];
  }
}

export interface AnalyticsRow {
  type: string;
  uid: string | null;
  meta: Record<string, unknown>;
  at: unknown;
}

export async function listAnalytics(max = 500): Promise<AnalyticsRow[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(query(collection(db, COLLECTIONS.analytics), orderBy('at', 'desc'), fbLimit(max)));
    return snap.docs.map((d) => d.data() as AnalyticsRow);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Admin config writes (guarded by Firestore rules → admins only).
// ---------------------------------------------------------------------------

export async function upsertQuestion(q: Question): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, COLLECTIONS.questions, q.id), q, { merge: true });
}

export async function deleteQuestion(id: string): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(db, COLLECTIONS.questions, id));
}

export async function upsertCategory(c: QuestionCategory): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, COLLECTIONS.categories, c.id), c, { merge: true });
}

/** One-time seeding helper: push the in-code seed into Firestore. */
export async function seedFirestore(): Promise<{ categories: number; questions: number }> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  for (const c of seedCategories) await setDoc(doc(db, COLLECTIONS.categories, c.id), c, { merge: true });
  for (const q of seedQuestions) await setDoc(doc(db, COLLECTIONS.questions, q.id), q, { merge: true });
  return { categories: seedCategories.length, questions: seedQuestions.length };
}
