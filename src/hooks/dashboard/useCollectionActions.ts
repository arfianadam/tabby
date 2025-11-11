import { useCallback, useState } from "react";
import {
  addBookmarksToFolder,
  createCollection as requestCreateCollection,
  createFolder as requestCreateFolder,
  deleteBookmarkFromFolder,
  deleteCollection as requestDeleteCollection,
  deleteFolder as requestDeleteFolder,
  renameFolder as requestRenameFolder,
  reorderBookmarksInFolder,
  reorderFolders,
  restoreBookmarkToFolder,
} from "../../services/collections";
import type { Bookmark, BookmarkDraft, Collection, Folder } from "../../types";
import type { Banner } from "../../components/dashboard/types";

type NotifyFn = (
  text: string,
  tone?: Banner["tone"],
  action?: Banner["action"],
) => void;

export type SaveResult = {
  success: boolean;
  savedCount: number;
};

export const useCollectionActions = (
  userId: string,
  allowSync: boolean,
  notify: NotifyFn,
) => {
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);

  const guardSync = useCallback(() => {
    if (!allowSync) {
      notify("Still restoring your workspace. Please wait…", "info");
      return true;
    }
    return false;
  }, [allowSync, notify]);

  const createCollection = useCallback(
    async (name: string) => {
      if (!name.trim() || guardSync()) {
        return null;
      }
      setCreatingCollection(true);
      try {
        const id = await requestCreateCollection(userId, name.trim());
        notify("Collection created.", "success");
        return id;
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to create collection.",
          "danger",
        );
        return null;
      } finally {
        setCreatingCollection(false);
      }
    },
    [guardSync, notify, userId],
  );

  const deleteCollection = useCallback(
    async (collection: Collection) => {
      if (guardSync()) {
        return false;
      }
      try {
        await requestDeleteCollection(userId, collection.id);
        notify("Collection removed.", "info");
        return true;
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to delete collection.",
          "danger",
        );
        return false;
      }
    },
    [guardSync, notify, userId],
  );

  const createFolder = useCallback(
    async (collection: Collection | null, name: string) => {
      if (!collection || !name.trim() || guardSync()) {
        return false;
      }
      setCreatingFolder(true);
      try {
        await requestCreateFolder(userId, collection.id, name.trim());
        notify("Folder created.", "success");
        return true;
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to create folder.",
          "danger",
        );
        return false;
      } finally {
        setCreatingFolder(false);
      }
    },
    [guardSync, notify, userId],
  );

  const deleteFolder = useCallback(
    async (collection: Collection | null, folder: Folder) => {
      if (!collection || guardSync()) {
        return false;
      }
      try {
        await requestDeleteFolder(userId, collection.id, folder.id);
        notify("Folder removed.", "info");
        return true;
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to delete folder.",
          "danger",
        );
        return false;
      }
    },
    [guardSync, notify, userId],
  );

  const renameFolder = useCallback(
    async (collection: Collection | null, folder: Folder, name: string) => {
      if (!collection || guardSync()) {
        return false;
      }
      const trimmed = name.trim();
      if (!trimmed) {
        notify("Provide a folder name before saving.", "danger");
        return false;
      }
      try {
        await requestRenameFolder(userId, collection.id, folder.id, trimmed);
        notify("Folder renamed.", "success");
        return true;
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to rename folder.",
          "danger",
        );
        return false;
      }
    },
    [guardSync, notify, userId],
  );

  const saveBookmarks = useCallback(
    async (
      collection: Collection | null,
      folderId: string,
      bookmarks: BookmarkDraft[],
    ): Promise<SaveResult> => {
      if (!collection || guardSync()) {
        notify("Create or select a collection first.", "danger");
        return { success: false, savedCount: 0 };
      }

      const folder = collection.folders.find((entry) => entry.id === folderId);
      if (!folder) {
        notify("The selected folder is no longer available.", "danger");
        return { success: false, savedCount: 0 };
      }

      const trimmed = bookmarks.map((bookmark) => ({
        ...bookmark,
        url: bookmark.url.trim(),
      }));
      const valid = trimmed.filter((bookmark) => bookmark.url);
      if (!valid.length) {
        notify(
          bookmarks.length === 1
            ? "Provide a URL before saving a bookmark."
            : "None of the selected tabs have a valid URL.",
          "danger",
        );
        return { success: false, savedCount: 0 };
      }

      setSavingBookmark(true);
      try {
        await addBookmarksToFolder(userId, collection.id, folder.id, valid);
        notify(
          valid.length === 1
            ? "Bookmark saved."
            : `${valid.length} bookmarks saved.`,
          "success",
        );
        return { success: true, savedCount: valid.length };
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to save bookmark.",
          "danger",
        );
        return { success: false, savedCount: 0 };
      } finally {
        setSavingBookmark(false);
      }
    },
    [guardSync, notify, userId],
  );

  const restoreBookmark = useCallback(
    async (params: {
      bookmark: Bookmark;
      folderId: string;
      collectionId: string;
      targetIndex: number;
    }) => {
      const { bookmark, folderId, collectionId, targetIndex } = params;
      try {
        await restoreBookmarkToFolder(
          userId,
          collectionId,
          folderId,
          bookmark,
          targetIndex,
        );
        notify("Bookmark restored.", "success");
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to restore bookmark.",
          "danger",
        );
      }
    },
    [notify, userId],
  );

  const deleteBookmark = useCallback(
    async (
      collection: Collection | null,
      folderId: string,
      bookmarkId: string,
    ) => {
      if (!collection || guardSync()) {
        return;
      }
      const folder = collection.folders.find((entry) => entry.id === folderId);
      if (!folder) {
        notify("The selected folder is no longer available.", "danger");
        return;
      }
      const bookmarkIndex = folder.bookmarks.findIndex(
        (entry) => entry.id === bookmarkId,
      );
      if (bookmarkIndex === -1) {
        notify("The selected bookmark is no longer available.", "danger");
        return;
      }
      const bookmark = folder.bookmarks[bookmarkIndex];
      try {
        await deleteBookmarkFromFolder(
          userId,
          collection.id,
          folderId,
          bookmarkId,
        );
        notify("Bookmark removed.", "info", {
          label: "Undo",
          onClick: () =>
            void restoreBookmark({
              bookmark,
              folderId,
              collectionId: collection.id,
              targetIndex: bookmarkIndex,
            }),
        });
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to delete bookmark.",
          "danger",
        );
      }
    },
    [guardSync, notify, restoreBookmark, userId],
  );

  const handleReorderFolders = useCallback(
    async (collection: Collection | null, orderedFolderIds: string[]) => {
      if (!collection || guardSync()) {
        return;
      }
      try {
        await reorderFolders(userId, collection.id, orderedFolderIds);
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to reorder folders.",
          "danger",
        );
      }
    },
    [guardSync, notify, userId],
  );

  const handleReorderBookmarks = useCallback(
    async (
      collection: Collection | null,
      folderId: string,
      orderedBookmarkIds: string[],
    ) => {
      if (!collection || guardSync()) {
        return;
      }
      try {
        await reorderBookmarksInFolder(
          userId,
          collection.id,
          folderId,
          orderedBookmarkIds,
        );
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to reorder bookmarks.",
          "danger",
        );
      }
    },
    [guardSync, notify, userId],
  );

  return {
    creatingCollection,
    creatingFolder,
    savingBookmark,
    guardSync,
    createCollection,
    deleteCollection,
    createFolder,
    deleteFolder,
    renameFolder,
    saveBookmarks,
    deleteBookmark,
    reorderFolders: handleReorderFolders,
    reorderBookmarks: handleReorderBookmarks,
  };
};
