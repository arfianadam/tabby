import type {
  Bookmark,
  BookmarkDraft,
  Collection,
  Folder,
} from "../../types.ts";

export type CollectionSnapshot = {
  id?: string;
  name?: string;
  createdAt?: number;
  updatedAt?: number;
  folders?: Folder[];
};

export type EditEnv = {
  generateId: () => string;
  now: () => number;
};

export type CollectionEdit = (collection: Collection) => Collection;

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);

export const defaultEnv: EditEnv = {
  generateId,
  now: () => Date.now(),
};

export const DEFAULT_FOLDER_ICON = "faFolderOpen";

export const clampIndex = (index: number, length: number) =>
  Math.max(0, Math.min(index, length));

export const insertAt = <T>(items: readonly T[], item: T, index: number) => {
  const next = [...items];
  next.splice(clampIndex(index, items.length), 0, item);
  return next;
};

// Removes every entry sharing the item's key, then inserts the item at the clamped index.
export const moveWithinList = <T>(
  items: readonly T[],
  item: T,
  targetIndex: number,
  keyOf: (entry: T) => string,
) => {
  const key = keyOf(item);
  return insertAt(
    items.filter((entry) => keyOf(entry) !== key),
    item,
    targetIndex,
  );
};

export const moveBetweenLists = <T>(
  source: readonly T[],
  target: readonly T[],
  item: T,
  targetIndex: number,
  keyOf: (entry: T) => string,
) => {
  const key = keyOf(item);
  return {
    source: source.filter((entry) => keyOf(entry) !== key),
    target: moveWithinList(target, item, targetIndex, keyOf),
  };
};

const bookmarkKey = (bookmark: Bookmark) => bookmark.id;

export const normalizeBookmark = (
  bookmark: Partial<Bookmark>,
  env: EditEnv = defaultEnv,
): Bookmark => {
  const base: Bookmark = {
    id: bookmark.id ?? env.generateId(),
    title: (bookmark.title ?? "").trim() || "Untitled bookmark",
    url: bookmark.url ?? "",
    note: bookmark.note?.trim() || "",
    createdAt: bookmark.createdAt ?? env.now(),
  };
  const faviconUrl = bookmark.faviconUrl?.trim();
  if (faviconUrl) {
    base.faviconUrl = faviconUrl;
  }
  return base;
};

export const normalizeFolder = (
  folder: Partial<Folder>,
  env: EditEnv = defaultEnv,
): Folder => {
  const normalized: Folder = {
    id: folder.id ?? env.generateId(),
    name: (folder.name ?? "").trim() || "Untitled folder",
    createdAt: folder.createdAt ?? env.now(),
    bookmarks: Array.isArray(folder.bookmarks)
      ? folder.bookmarks.map((bookmark) => normalizeBookmark(bookmark, env))
      : [],
  };
  if (folder.icon) {
    normalized.icon = folder.icon;
  }
  return normalized;
};

export const normalizeCollection = (
  id: string,
  snapshot?: CollectionSnapshot,
  env: EditEnv = defaultEnv,
): Collection => ({
  id,
  name: (snapshot?.name ?? "").trim() || "Untitled collection",
  createdAt: snapshot?.createdAt ?? env.now(),
  updatedAt: snapshot?.updatedAt ?? env.now(),
  folders: Array.isArray(snapshot?.folders)
    ? snapshot.folders.map((folder) => normalizeFolder(folder, env))
    : [],
});

// Any "scheme://" (chrome://, file://, …) is kept; "host:port" is not a scheme.
const HAS_SCHEME = /^([a-z][a-z0-9+.-]*:\/\/|(about|mailto):)/i;

export const normalizeUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }
  if (HAS_SCHEME.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const createBookmarkFromDraft = (
  draft: BookmarkDraft,
  env: EditEnv = defaultEnv,
): Bookmark => {
  const base: Bookmark = {
    id: env.generateId(),
    title: draft.title.trim() || draft.url,
    url: normalizeUrl(draft.url),
    note: draft.note?.trim() || "",
    createdAt: env.now(),
  };
  const faviconUrl = draft.faviconUrl?.trim();
  if (faviconUrl) {
    base.faviconUrl = faviconUrl;
  }
  return base;
};

// Drops drafts without a URL; throws when nothing is left to save.
export const validBookmarkDrafts = (drafts: BookmarkDraft[]) => {
  const valid = drafts.filter((draft) => draft.url.trim());
  if (!valid.length) {
    throw new Error("Provide at least one URL to save a bookmark.");
  }
  return valid;
};

const updateFolder = (
  collection: Collection,
  folderId: string,
  update: (folder: Folder) => Folder,
): Collection => {
  let folderFound = false;
  const folders = collection.folders.map((folder) => {
    if (folder.id !== folderId) {
      return folder;
    }
    folderFound = true;
    return update(folder);
  });

  if (!folderFound) {
    throw new Error("Folder not found.");
  }

  return {
    ...collection,
    folders,
  };
};

const orderByIds = <T extends { id: string }>(
  items: readonly T[],
  orderedIds: readonly string[],
) => {
  const seen = new Set(orderedIds);
  const ordered: T[] = [];
  for (const id of orderedIds) {
    const item = items.find((entry) => entry.id === id);
    if (item) {
      ordered.push(item);
    }
  }
  const remaining = items.filter((item) => !seen.has(item.id));
  return [...ordered, ...remaining];
};

export const addFolder = (
  collection: Collection,
  name: string,
  env: EditEnv = defaultEnv,
): Collection => ({
  ...collection,
  folders: [
    ...collection.folders,
    {
      id: env.generateId(),
      name: name.trim() || "Untitled folder",
      createdAt: env.now(),
      bookmarks: [],
    },
  ],
});

export const removeFolder = (
  collection: Collection,
  folderId: string,
): Collection => ({
  ...collection,
  folders: collection.folders.filter((folder) => folder.id !== folderId),
});

export const renameFolder = (
  collection: Collection,
  folderId: string,
  name: string,
): Collection =>
  updateFolder(collection, folderId, (folder) => ({
    ...folder,
    name: name.trim() || "Untitled folder",
  }));

export const updateFolderSettings = (
  collection: Collection,
  folderId: string,
  name: string,
  icon: string,
): Collection =>
  updateFolder(collection, folderId, (folder) => {
    const updatedFolder: Folder = {
      ...folder,
      name: name.trim() || "Untitled folder",
    };
    if (icon && icon !== DEFAULT_FOLDER_ICON) {
      updatedFolder.icon = icon;
    } else {
      delete updatedFolder.icon;
    }
    return updatedFolder;
  });

export const reorderFolders = (
  collection: Collection,
  orderedFolderIds: string[],
): Collection => {
  if (!orderedFolderIds.length) {
    return collection;
  }
  return {
    ...collection,
    folders: orderByIds(collection.folders, orderedFolderIds),
  };
};

export const addBookmarks = (
  collection: Collection,
  folderId: string,
  drafts: BookmarkDraft[],
  env: EditEnv = defaultEnv,
): Collection => {
  const validDrafts = validBookmarkDrafts(drafts);
  return updateFolder(collection, folderId, (folder) => ({
    ...folder,
    bookmarks: [
      ...validDrafts.map((draft) => createBookmarkFromDraft(draft, env)),
      ...folder.bookmarks,
    ],
  }));
};

export const updateBookmark = (
  collection: Collection,
  folderId: string,
  bookmarkId: string,
  payload: Partial<BookmarkDraft>,
): Collection => {
  let bookmarkFound = false;
  const next = updateFolder(collection, folderId, (folder) => ({
    ...folder,
    bookmarks: folder.bookmarks.map((bookmark) => {
      if (bookmark.id !== bookmarkId) {
        return bookmark;
      }
      bookmarkFound = true;
      const updated: Bookmark = {
        ...bookmark,
        title: (payload.title ?? bookmark.title).trim() || "Untitled bookmark",
        url: normalizeUrl(payload.url ?? bookmark.url),
        note: (payload.note ?? bookmark.note ?? "").trim(),
      };
      // An empty faviconUrl clears it; undefined leaves it untouched
      if (payload.faviconUrl !== undefined) {
        const trimmedFaviconUrl = payload.faviconUrl.trim();
        if (trimmedFaviconUrl) {
          updated.faviconUrl = trimmedFaviconUrl;
        } else {
          delete updated.faviconUrl;
        }
      }
      return updated;
    }),
  }));

  if (!bookmarkFound) {
    throw new Error("Bookmark not found.");
  }

  return next;
};

export const removeBookmark = (
  collection: Collection,
  folderId: string,
  bookmarkId: string,
): Collection => ({
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
});

export const restoreBookmark = (
  collection: Collection,
  folderId: string,
  bookmark: Bookmark,
  targetIndex: number,
): Collection =>
  updateFolder(collection, folderId, (folder) => ({
    ...folder,
    bookmarks: moveWithinList(
      folder.bookmarks,
      bookmark,
      targetIndex,
      bookmarkKey,
    ),
  }));

export const moveBookmark = (
  collection: Collection,
  sourceFolderId: string,
  targetFolderId: string,
  bookmarkId: string,
  targetIndex: number,
): Collection => {
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
    const reordered = moveWithinList(
      sourceFolder.bookmarks,
      bookmark,
      targetIndex,
      bookmarkKey,
    );
    return {
      ...collection,
      folders: collection.folders.map((folder) =>
        folder.id === sourceFolderId
          ? { ...folder, bookmarks: reordered }
          : folder,
      ),
    };
  }

  const moved = moveBetweenLists(
    sourceFolder.bookmarks,
    targetFolder.bookmarks,
    bookmark,
    targetIndex,
    bookmarkKey,
  );

  return {
    ...collection,
    folders: collection.folders.map((folder) => {
      if (folder.id === sourceFolderId) {
        return { ...folder, bookmarks: moved.source };
      }
      if (folder.id === targetFolderId) {
        return { ...folder, bookmarks: moved.target };
      }
      return folder;
    }),
  };
};

export const reorderBookmarks = (
  collection: Collection,
  folderId: string,
  orderedBookmarkIds: string[],
): Collection =>
  updateFolder(collection, folderId, (folder) =>
    orderedBookmarkIds.length
      ? {
          ...folder,
          bookmarks: orderByIds(folder.bookmarks, orderedBookmarkIds),
        }
      : folder,
  );
