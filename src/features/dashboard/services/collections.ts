import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  type FirestoreError,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import type { Collection } from "@/types";
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

      const nextCollections = snapshot.docs.map((doc) => {
        return (
          collectionCache.get(doc.id) ??
          edits.normalizeCollection(doc.id, doc.data())
        );
      });

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
