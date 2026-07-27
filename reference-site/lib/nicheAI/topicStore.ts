'use client';

/**
 * Firestore overlay for admin Topic Management. The code library (topicEngine)
 * is the base; this stores admin changes on top:
 *  - `nicheTopics/{id}`   — enable/disable of built-ins + full custom topics
 *  - `topicCategories/{id}` — custom categories / category enable + order
 *
 * Degrades gracefully: with no Firebase, reads return empty overrides (the base
 * library is used) and writes throw a clear error. Non-blocking for the user.
 */

import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { deriveTopic, type Audience, type Difficulty, type EnrichedTopic, type Monetization, type NicheCat } from './topicEngine';

export const TOPIC_COLLECTION = 'nicheTopics';
export const TOPIC_CAT_COLLECTION = 'topicCategories';

export type TopicStatus = 'draft' | 'pending' | 'published' | 'archived';

export interface TopicDoc {
  id: string;
  label: string;
  group: string;
  parentCategory: string;
  categoryId: string;
  subcategory: string;
  niche: NicheCat;
  businessCategory: string;
  difficulty: Difficulty;
  monetization: Monetization;
  audience: Audience[];
  keywords: string[];
  custom: boolean;
  enabled: boolean;
  order?: number;
  industry?: string;
  description?: string;
  /**
   * Editorial workflow. Only `published` topics reach the public explorer;
   * `archived` is a soft delete so a topic can be restored with its history.
   */
  status?: TopicStatus;
  submittedBy?: string;
  approvedBy?: string;
  version?: number;
  updatedBy?: string;
  archivedAt?: number | null;
  /** Set when this topic was merged into another; kept for auditability. */
  mergedInto?: string | null;
}

export interface TopicCategoryDoc {
  id: string;
  name: string;
  group: string;
  niche: NicheCat;
  business: string;
  enabled: boolean;
  order: number;
  custom: boolean;
}

export interface TopicOverrides {
  disabled: Set<string>;
  custom: EnrichedTopic[];
  docs: TopicDoc[];
}

const EMPTY: TopicOverrides = { disabled: new Set(), custom: [], docs: [] };

/** Load admin overrides (disabled ids + custom topics). Never throws. */
export async function loadTopicOverrides(): Promise<TopicOverrides> {
  if (!isFirebaseConfigured) return EMPTY;
  try {
    const snap = await getDocs(collection(db, TOPIC_COLLECTION));
    const docs = snap.docs.map((d) => d.data() as TopicDoc);
    // Hidden from the public explorer: explicitly disabled, archived, or still
    // working through the approval workflow (draft/pending).
    const isLive = (d: TopicDoc) => d.enabled !== false && (!d.status || d.status === 'published');
    const disabled = new Set(docs.filter((d) => !isLive(d)).map((d) => d.id));
    const custom: EnrichedTopic[] = docs
      .filter((d) => d.custom && isLive(d))
      .map((d) => deriveTopic({
        id: d.id, label: d.label, group: d.group, parentCategory: d.parentCategory, categoryId: d.categoryId,
        subcategory: d.subcategory, niche: d.niche, businessCategory: d.businessCategory,
        keywords: d.keywords ?? [], difficulty: d.difficulty, audience: d.audience ?? ['Individuals'],
        monetization: d.monetization, industry: d.industry, description: d.description,
      }));
    return { disabled, custom, docs };
  } catch {
    return EMPTY;
  }
}

export async function listCategoryDocs(): Promise<TopicCategoryDoc[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(query(collection(db, TOPIC_CAT_COLLECTION), orderBy('order')));
    return snap.docs.map((d) => d.data() as TopicCategoryDoc);
  } catch {
    return [];
  }
}

// ---- Admin writes (guarded by Firestore rules → admins only) -------------

export async function setTopicEnabled(t: Pick<TopicDoc, 'id' | 'label' | 'categoryId' | 'niche'>, enabled: boolean): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, TOPIC_COLLECTION, t.id), { ...t, enabled, updatedAt: serverTimestamp() }, { merge: true });
}

export async function upsertCustomTopic(t: TopicDoc): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, TOPIC_COLLECTION, t.id), { ...t, custom: true, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteCustomTopic(id: string): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(db, TOPIC_COLLECTION, id));
}

export async function bulkUpsertTopics(topics: TopicDoc[]): Promise<number> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  let n = 0;
  for (const t of topics) {
    await setDoc(doc(db, TOPIC_COLLECTION, t.id), { ...t, custom: true, updatedAt: serverTimestamp() }, { merge: true });
    n++;
  }
  return n;
}

export async function upsertCategory(c: TopicCategoryDoc): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, TOPIC_CAT_COLLECTION, c.id), c, { merge: true });
}

export async function deleteCategory(id: string): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(db, TOPIC_CAT_COLLECTION, id));
}

/**
 * Persist a new category order. Only the `order` field is written, so a reorder
 * never clobbers concurrent edits to a category's other fields.
 */
export async function reorderCategories(ids: string[]): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  for (let i = 0; i < ids.length; i++) {
    await setDoc(doc(db, TOPIC_CAT_COLLECTION, ids[i]), { id: ids[i], order: i, updatedAt: serverTimestamp() }, { merge: true });
  }
}

/**
 * Subcategory overrides. Built-in subcategories live in the code library; this
 * stores renames, ordering, enable/disable and admin-created subcategories.
 * Keyed `${categoryId}::${name}` so a rename keeps its identity.
 */
export const TOPIC_SUB_COLLECTION = 'topicSubcategories';

export interface TopicSubDoc {
  id: string;
  categoryId: string;
  name: string;
  label?: string;
  enabled: boolean;
  order: number;
  custom: boolean;
}

export const subKey = (categoryId: string, name: string) => `${categoryId}::${name}`;

export async function listSubcategoryDocs(): Promise<TopicSubDoc[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(collection(db, TOPIC_SUB_COLLECTION));
    return snap.docs.map((d) => d.data() as TopicSubDoc).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return [];
  }
}

export async function upsertSubcategory(s: TopicSubDoc): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, TOPIC_SUB_COLLECTION, s.id), { ...s, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteSubcategory(id: string): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(db, TOPIC_SUB_COLLECTION, id));
}

// ---- Editorial workflow: status, versions, restore, merge ----------------

export const TOPIC_VERSION_COLLECTION = 'nicheTopicVersions';

export interface TopicVersionDoc {
  id: string; // `${topicId}::${version}`
  topicId: string;
  version: number;
  snapshot: TopicDoc;
  actor: string;
  at: number;
}

/** Write a point-in-time snapshot before mutating a topic. */
export async function snapshotTopic(t: TopicDoc, actor: string): Promise<number> {
  const version = (t.version ?? 0) + 1;
  if (!isFirebaseConfigured) return version;
  try {
    await setDoc(doc(db, TOPIC_VERSION_COLLECTION, `${t.id}::${version}`), {
      id: `${t.id}::${version}`, topicId: t.id, version, snapshot: t, actor, at: Date.now(),
    });
  } catch {
    /* history is best-effort — never block the edit */
  }
  return version;
}

export async function listTopicVersions(topicId: string): Promise<TopicVersionDoc[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(query(collection(db, TOPIC_VERSION_COLLECTION), where('topicId', '==', topicId)));
    return snap.docs.map((d) => d.data() as TopicVersionDoc).sort((a, b) => b.version - a.version);
  } catch {
    return [];
  }
}

/** Roll a topic back to a stored version (itself recorded as a new version). */
export async function restoreTopicVersion(v: TopicVersionDoc, actor: string): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  const version = await snapshotTopic(v.snapshot, actor);
  await setDoc(doc(db, TOPIC_COLLECTION, v.topicId), { ...v.snapshot, version, updatedBy: actor, updatedAt: serverTimestamp() }, { merge: true });
}

export async function setTopicStatus(t: TopicDoc, status: TopicStatus, actor: string): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  const version = await snapshotTopic(t, actor);
  await setDoc(doc(db, TOPIC_COLLECTION, t.id), {
    ...t, status, version, updatedBy: actor,
    ...(status === 'published' ? { approvedBy: actor, enabled: true } : {}),
    ...(status === 'archived' ? { archivedAt: Date.now(), enabled: false } : { archivedAt: null }),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Soft-delete: archive rather than destroy, so it can be restored. */
export async function archiveTopic(t: TopicDoc, actor: string): Promise<void> {
  await setTopicStatus(t, 'archived', actor);
}

export async function restoreTopic(t: TopicDoc, actor: string): Promise<void> {
  await setTopicStatus(t, 'published', actor);
}

/**
 * Merge `from` into `into`: the loser is archived and stamped with `mergedInto`
 * so historical selections can still be resolved to the surviving topic.
 */
export async function mergeTopics(from: TopicDoc, into: TopicDoc, actor: string): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  const version = await snapshotTopic(from, actor);
  const keywords = Array.from(new Set([...(into.keywords ?? []), ...(from.keywords ?? [])]));
  await setDoc(doc(db, TOPIC_COLLECTION, into.id), { ...into, keywords, updatedBy: actor, updatedAt: serverTimestamp() }, { merge: true });
  await setDoc(doc(db, TOPIC_COLLECTION, from.id), {
    ...from, status: 'archived', enabled: false, mergedInto: into.id, version,
    updatedBy: actor, archivedAt: Date.now(), updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function logTopicAudit(actor: string, action: string, target: string | null, meta: Record<string, unknown> = {}): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    await addDoc(collection(db, 'auditLogs'), { actor, action, target, meta, at: serverTimestamp() });
  } catch {
    /* ignore */
  }
}
