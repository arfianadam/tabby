import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
  type FirestoreError,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import type { BookmarkDraft, Collection } from "@/types";
import * as edits from "../collectionEdits";

const userCollectionsRef = (uid: string) =>
  collection(db, "users", uid, "collections");

const collectionDocRef = (uid: string, collectionId: string) =>
  doc(db, "users", uid, "collections", collectionId);

export const subscribeToCollections = (
  uid: string,
  onChange: (
    collections: Collection[],
    metadata: { fromCache: boolean },
  ) => void,
  onError?: (error: FirestoreError) => void,
) => {
  const q = query(userCollectionsRef(uid), orderBy("createdAt", "asc"));
  const collectionCache = new Map<string, Collection>();

  return onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "removed") {
          collectionCache.delete(change.doc.id);
        } else {
          const normalized = edits.normalizeCollection(
            change.doc.id,
            change.doc.data(),
          );
          collectionCache.set(change.doc.id, normalized);
        }
      });

      const nextCollections = edits.sortCollections(
        snapshot.docs.map(
          (docSnapshot) =>
            collectionCache.get(docSnapshot.id) ??
            edits.normalizeCollection(docSnapshot.id, docSnapshot.data()),
        ),
      );

      onChange(nextCollections, { fromCache: snapshot.metadata.fromCache });
    },
    (err) => {
      onError?.(err);
    },
  );
};

export const createCollection = async (uid: string, name: string) => {
  const ref = doc(userCollectionsRef(uid));
  const trimmed = name.trim();
  const payload: Collection = {
    id: ref.id,
    name: trimmed || "Untitled collection",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    folders: [],
  };
  await setDoc(ref, payload);
  return ref.id;
};

export const renameCollection = async (
  uid: string,
  collectionId: string,
  name: string,
) => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Provide a collection name before saving.");
  }
  await updateDoc(collectionDocRef(uid, collectionId), {
    name: trimmed,
    updatedAt: Date.now(),
  });
};

export const reorderCollections = async (
  uid: string,
  orderedCollectionIds: string[],
) => {
  if (!orderedCollectionIds.length) {
    return;
  }
  const batch = writeBatch(db);
  const now = Date.now();
  orderedCollectionIds.forEach((collectionId, index) => {
    batch.update(collectionDocRef(uid, collectionId), {
      order: index,
      updatedAt: now,
    });
  });
  await batch.commit();
};

export const deleteCollection = async (uid: string, collectionId: string) =>
  deleteDoc(collectionDocRef(uid, collectionId));

export const applyCollectionEdit = async (
  uid: string,
  collectionId: string,
  edit: edits.CollectionEdit,
) => {
  const ref = collectionDocRef(uid, collectionId);
  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) {
      throw new Error("Collection not found.");
    }
    const current = edits.normalizeCollection(snapshot.id, snapshot.data());
    const next = edit(current);
    tx.set(ref, {
      ...next,
      updatedAt: Date.now(),
    });
  });
};

export const moveBookmarkAcrossCollections = async (
  uid: string,
  sourceCollectionId: string,
  sourceFolderId: string,
  targetCollectionId: string,
  targetFolderId: string,
  bookmarkId: string,
  updatedData?: Partial<BookmarkDraft>,
) => {
  const sourceRef = collectionDocRef(uid, sourceCollectionId);
  const targetRef = collectionDocRef(uid, targetCollectionId);

  await runTransaction(db, async (tx) => {
    const [sourceSnap, targetSnap] = await Promise.all([
      tx.get(sourceRef),
      tx.get(targetRef),
    ]);
    if (!sourceSnap.exists()) {
      throw new Error("Source collection not found.");
    }
    if (!targetSnap.exists()) {
      throw new Error("Target collection not found.");
    }

    const source = edits.normalizeCollection(sourceSnap.id, sourceSnap.data());
    const target = edits.normalizeCollection(targetSnap.id, targetSnap.data());

    const sourceWithEdits = updatedData
      ? edits.updateBookmark(source, sourceFolderId, bookmarkId, updatedData)
      : source;

    const sourceFolder = sourceWithEdits.folders.find(
      (f) => f.id === sourceFolderId,
    );
    const bookmark = sourceFolder?.bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) {
      throw new Error("Bookmark not found.");
    }

    const nextSource = edits.removeBookmark(
      sourceWithEdits,
      sourceFolderId,
      bookmarkId,
    );
    const nextTarget = edits.restoreBookmark(
      target,
      targetFolderId,
      bookmark,
      0,
    );
    const now = Date.now();

    tx.set(sourceRef, { ...nextSource, updatedAt: now });
    tx.set(targetRef, { ...nextTarget, updatedAt: now });
  });
};
