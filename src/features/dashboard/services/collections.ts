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
import type { Bookmark, BookmarkDraft, Collection, Folder } from "@/types";

type CollectionSnapshot = {
  id?: string;
  name?: string;
  createdAt?: number;
  updatedAt?: number;
  folders?: Folder[];
};

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);

const normalizeBookmark = (bookmark: Partial<Bookmark>): Bookmark => {
  const base: Bookmark = {
    id: bookmark.id ?? generateId(),
    title: (bookmark.title ?? "").trim() || "Untitled bookmark",
    url: bookmark.url ?? "",
    note: bookmark.note?.trim() || "",
    createdAt: bookmark.createdAt ?? Date.now(),
  };
  const faviconUrl = bookmark.faviconUrl?.trim();
  if (faviconUrl) {
    base.faviconUrl = faviconUrl;
  }
  return base;
};

const normalizeFolder = (folder: Partial<Folder>): Folder => {
  const normalized: Folder = {
    id: folder.id ?? generateId(),
    name: (folder.name ?? "").trim() || "Untitled folder",
    createdAt: folder.createdAt ?? Date.now(),
    bookmarks: Array.isArray(folder.bookmarks)
      ? folder.bookmarks.map(normalizeBookmark)
      : [],
  };
  if (folder.icon) {
    normalized.icon = folder.icon;
  }
  return normalized;
};

const normalizeCollection = (
  id: string,
  snapshot?: CollectionSnapshot,
): Collection => ({
  id,
  name: (snapshot?.name ?? "").trim() || "Untitled collection",
  createdAt: snapshot?.createdAt ?? Date.now(),
  updatedAt: snapshot?.updatedAt ?? Date.now(),
  folders: Array.isArray(snapshot?.folders)
    ? snapshot.folders.map(normalizeFolder)
    : [],
});

const clone = <T>(value: T): T =>
  typeof structuredClone === "function"
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);

const userCollectionsRef = (uid: string) =>
  collection(db, "users", uid, "collections");

const collectionDocRef = (uid: string, collectionId: string) =>
  doc(db, "users", uid, "collections", collectionId);

export const subscribeToCollections = (
  uid: string,
  onChange: (collections: Collection[]) => void,
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
          const normalized = normalizeCollection(
            change.doc.id,
            change.doc.data(),
          );
          collectionCache.set(change.doc.id, normalized);
        }
      });

      const nextCollections = snapshot.docs.map((doc) => {
        return (
          collectionCache.get(doc.id) ?? normalizeCollection(doc.id, doc.data())
        );
      });

      onChange(nextCollections);
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

const mutateCollection = async (
  uid: string,
  collectionId: string,
  updater: (collection: Collection) => Collection,
) => {
  const ref = collectionDocRef(uid, collectionId);
  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) {
      throw new Error("Collection not found.");
    }
    const current = normalizeCollection(snapshot.id, snapshot.data());
    const next = updater(clone(current));
    tx.set(ref, {
      ...next,
      updatedAt: Date.now(),
    });
  });
};

export const createFolder = async (
  uid: string,
  collectionId: string,
  name: string,
) =>
  mutateCollection(uid, collectionId, (collection) => ({
    ...collection,
    folders: [
      ...collection.folders,
      {
        id: generateId(),
        name: name.trim() || "Untitled folder",
        createdAt: Date.now(),
        bookmarks: [],
      },
    ],
  }));

export const deleteFolder = async (
  uid: string,
  collectionId: string,
  folderId: string,
) =>
  mutateCollection(uid, collectionId, (collection) => ({
    ...collection,
    folders: collection.folders.filter((folder) => folder.id !== folderId),
  }));

export const renameFolder = async (
  uid: string,
  collectionId: string,
  folderId: string,
  name: string,
) =>
  mutateCollection(uid, collectionId, (collection) => {
    let folderFound = false;
    const folders = collection.folders.map((folder) => {
      if (folder.id !== folderId) {
        return folder;
      }
      folderFound = true;
      const trimmed = name.trim();
      return {
        ...folder,
        name: trimmed || "Untitled folder",
      };
    });

    if (!folderFound) {
      throw new Error("Folder not found.");
    }

    return {
      ...collection,
      folders,
    };
  });

export const updateFolderSettings = async (
  uid: string,
  collectionId: string,
  folderId: string,
  name: string,
  icon: string,
) =>
  mutateCollection(uid, collectionId, (collection) => {
    let folderFound = false;
    const folders = collection.folders.map((folder) => {
      if (folder.id !== folderId) {
        return folder;
      }
      folderFound = true;
      const trimmed = name.trim();
      const updatedFolder = {
        ...folder,
        name: trimmed || "Untitled folder",
      };
      if (icon && icon !== "faFolderOpen") {
        updatedFolder.icon = icon;
      } else {
        delete updatedFolder.icon;
      }
      return updatedFolder;
    });

    if (!folderFound) {
      throw new Error("Folder not found.");
    }

    return {
      ...collection,
      folders,
    };
  });

const normalizeUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const createBookmarkFromDraft = (draft: BookmarkDraft): Bookmark => {
  const base: Bookmark = {
    id: generateId(),
    title: draft.title.trim() || draft.url,
    url: normalizeUrl(draft.url),
    note: draft.note?.trim() || "",
    createdAt: Date.now(),
  };
  const faviconUrl = draft.faviconUrl?.trim();
  if (faviconUrl) {
    base.faviconUrl = faviconUrl;
  }
  return base;
};

export const addBookmarksToFolder = async (
  uid: string,
  collectionId: string,
  folderId: string,
  payloads: BookmarkDraft[],
) => {
  const validPayloads = payloads.filter((payload) => payload.url.trim());
  if (!validPayloads.length) {
    throw new Error("Provide at least one URL to save a bookmark.");
  }

  return mutateCollection(uid, collectionId, (collection) => {
    let targetFolderFound = false;

    const folders = collection.folders.map((folder) => {
      if (folder.id !== folderId) {
        return folder;
      }
      targetFolderFound = true;
      const bookmarks = validPayloads.map(createBookmarkFromDraft);
      return {
        ...folder,
        bookmarks: [...bookmarks, ...folder.bookmarks],
      };
    });

    if (!targetFolderFound) {
      throw new Error("Folder not found.");
    }

    return {
      ...collection,
      folders,
    };
  });
};

export const updateBookmarkInFolder = async (
  uid: string,
  collectionId: string,
  folderId: string,
  bookmarkId: string,
  payload: Partial<BookmarkDraft>,
) =>
  mutateCollection(uid, collectionId, (collection) => {
    let folderFound = false;
    let bookmarkFound = false;

    const folders = collection.folders.map((folder) => {
      if (folder.id !== folderId) {
        return folder;
      }
      folderFound = true;

      const bookmarks = folder.bookmarks.map((bookmark) => {
        if (bookmark.id !== bookmarkId) {
          return bookmark;
        }
        bookmarkFound = true;
        const updated: Bookmark = {
          ...bookmark,
          title:
            (payload.title ?? bookmark.title).trim() || "Untitled bookmark",
          url: normalizeUrl(payload.url ?? bookmark.url),
          note: (payload.note ?? bookmark.note ?? "").trim(),
        };
        // Handle faviconUrl: only set if non-empty, delete if cleared
        if (payload.faviconUrl !== undefined) {
          const trimmedFaviconUrl = payload.faviconUrl.trim();
          if (trimmedFaviconUrl) {
            updated.faviconUrl = trimmedFaviconUrl;
          } else {
            delete updated.faviconUrl;
          }
        }
        return updated;
      });

      return {
        ...folder,
        bookmarks,
      };
    });

    if (!folderFound) {
      throw new Error("Folder not found.");
    }

    if (!bookmarkFound) {
      throw new Error("Bookmark not found.");
    }

    return {
      ...collection,
      folders,
    };
  });

export const deleteBookmarkFromFolder = async (
  uid: string,
  collectionId: string,
  folderId: string,
  bookmarkId: string,
) =>
  mutateCollection(uid, collectionId, (collection) => ({
    ...collection,
    folders: collection.folders.map((folder) =>
      folder.id === folderId
        ? {
            ...folder,
            bookmarks: folder.bookmarks.filter(
              (bookmark) => bookmark.id !== bookmarkId,
            ),
          }
        : folder,
    ),
  }));

export const restoreBookmarkToFolder = async (
  uid: string,
  collectionId: string,
  folderId: string,
  bookmark: Bookmark,
  targetIndex: number,
) =>
  mutateCollection(uid, collectionId, (collection) => {
    let folderFound = false;

    const folders = collection.folders.map((folder) => {
      if (folder.id !== folderId) {
        return folder;
      }
      folderFound = true;
      const dedupedBookmarks = folder.bookmarks.filter(
        (entry) => entry.id !== bookmark.id,
      );
      const insertionIndex = Math.min(
        Math.max(targetIndex, 0),
        dedupedBookmarks.length,
      );
      const nextBookmarks = [...dedupedBookmarks];
      nextBookmarks.splice(insertionIndex, 0, bookmark);
      return {
        ...folder,
        bookmarks: nextBookmarks,
      };
    });

    if (!folderFound) {
      throw new Error("Folder not found.");
    }

    return {
      ...collection,
      folders,
    };
  });

export const reorderFolders = async (
  uid: string,
  collectionId: string,
  orderedFolderIds: string[],
) =>
  mutateCollection(uid, collectionId, (collection) => {
    if (!orderedFolderIds.length) {
      return collection;
    }

    const seen = new Set(orderedFolderIds);
    const ordered: Folder[] = [];
    for (const folderId of orderedFolderIds) {
      const folder = collection.folders.find((entry) => entry.id === folderId);
      if (folder) {
        ordered.push(folder);
      }
    }
    const remaining = collection.folders.filter(
      (folder) => !seen.has(folder.id),
    );

    return {
      ...collection,
      folders: [...ordered, ...remaining],
    };
  });

export const moveBookmarkBetweenFolders = async (
  uid: string,
  collectionId: string,
  sourceFolderId: string,
  targetFolderId: string,
  bookmarkId: string,
  targetIndex: number,
) =>
  mutateCollection(uid, collectionId, (collection) => {
    if (!bookmarkId) {
      return collection;
    }

    const sourceFolder = collection.folders.find(
      (folder) => folder.id === sourceFolderId,
    );
    if (!sourceFolder) {
      throw new Error("Source folder not found.");
    }

    const bookmark = sourceFolder.bookmarks.find(
      (entry) => entry.id === bookmarkId,
    );
    if (!bookmark) {
      throw new Error("Bookmark not found in source folder.");
    }

    const targetFolder = collection.folders.find(
      (folder) => folder.id === targetFolderId,
    );
    if (!targetFolder) {
      throw new Error("Target folder not found.");
    }

    if (sourceFolderId === targetFolderId) {
      const filtered = sourceFolder.bookmarks.filter(
        (entry) => entry.id !== bookmarkId,
      );
      const boundedIndex = Math.max(0, Math.min(targetIndex, filtered.length));
      const reordered = [...filtered];
      reordered.splice(boundedIndex, 0, bookmark);
      return {
        ...collection,
        folders: collection.folders.map((folder) =>
          folder.id === sourceFolderId
            ? {
                ...folder,
                bookmarks: reordered,
              }
            : folder,
        ),
      };
    }

    const sourceBookmarks = sourceFolder.bookmarks.filter(
      (entry) => entry.id !== bookmarkId,
    );
    const targetBookmarks = targetFolder.bookmarks.filter(
      (entry) => entry.id !== bookmarkId,
    );
    const boundedIndex = Math.max(
      0,
      Math.min(targetIndex, targetBookmarks.length),
    );
    const nextTargetBookmarks = [...targetBookmarks];
    nextTargetBookmarks.splice(boundedIndex, 0, bookmark);

    return {
      ...collection,
      folders: collection.folders.map((folder) => {
        if (folder.id === sourceFolderId) {
          return {
            ...folder,
            bookmarks: sourceBookmarks,
          };
        }
        if (folder.id === targetFolderId) {
          return {
            ...folder,
            bookmarks: nextTargetBookmarks,
          };
        }
        return folder;
      }),
    };
  });

export const reorderBookmarksInFolder = async (
  uid: string,
  collectionId: string,
  folderId: string,
  orderedBookmarkIds: string[],
) =>
  mutateCollection(uid, collectionId, (collection) => {
    let folderFound = false;

    const folders = collection.folders.map((folder) => {
      if (folder.id !== folderId) {
        return folder;
      }

      folderFound = true;

      if (!orderedBookmarkIds.length) {
        return folder;
      }

      const seen = new Set(orderedBookmarkIds);
      const ordered: Bookmark[] = [];
      for (const bookmarkId of orderedBookmarkIds) {
        const bookmark = folder.bookmarks.find(
          (entry) => entry.id === bookmarkId,
        );
        if (bookmark) {
          ordered.push(bookmark);
        }
      }
      const remaining = folder.bookmarks.filter(
        (bookmark) => !seen.has(bookmark.id),
      );

      return {
        ...folder,
        bookmarks: [...ordered, ...remaining],
      };
    });

    if (!folderFound) {
      throw new Error("Folder not found.");
    }

    return {
      ...collection,
      folders,
    };
  });
