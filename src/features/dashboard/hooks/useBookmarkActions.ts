import { useCallback, useState } from "react";
import {
  addBookmarksToFolder as requestAddBookmarksToFolder,
  deleteBookmarkFromFolder,
  reorderBookmarksInFolder as requestReorderBookmarksInFolder,
  restoreBookmarkToFolder as requestRestoreBookmarkToFolder,
  moveBookmarkBetweenFolders as requestMoveBookmarkBetweenFolders,
  updateBookmarkInFolder as requestUpdateBookmarkInFolder,
} from "../services/collections";
import type { Bookmark, BookmarkDraft, Collection } from "@/types";
import type { Banner } from "../components/types";
import { useSyncGuard } from "./useSyncGuard";

type NotifyFn = (
  text: string,
  tone?: Banner["tone"],
  action?: Banner["action"],
) => void;

export type SaveResult = {
  success: boolean;
  savedCount: number;
};

type MoveBookmarkParams = {
  bookmarkId: string;
  sourceFolderId: string;
  targetFolderId: string;
  targetIndex: number;
};

export const useBookmarkActions = (
  userId: string,
  allowSync: boolean,
  notify: NotifyFn,
) => {
  const guardSync = useSyncGuard(allowSync, notify);
  const [savingBookmark, setSavingBookmark] = useState(false);

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
        await requestAddBookmarksToFolder(
          userId,
          collection.id,
          folder.id,
          valid,
        );
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

  const updateBookmark = useCallback(
    async (
      collection: Collection | null,
      folderId: string,
      bookmarkId: string,
      data: Partial<BookmarkDraft>,
    ) => {
      if (!collection || guardSync()) {
        return false;
      }
      const folder = collection.folders.find((entry) => entry.id === folderId);
      if (!folder) {
        notify("The selected folder is no longer available.", "danger");
        return false;
      }

      // Simple validation
      if (data.url && !data.url.trim()) {
        notify("Provide a URL before saving a bookmark.", "danger");
        return false;
      }

      setSavingBookmark(true);
      try {
        await requestUpdateBookmarkInFolder(
          userId,
          collection.id,
          folder.id,
          bookmarkId,
          data,
        );
        notify("Bookmark updated.", "success");
        return true;
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to update bookmark.",
          "danger",
        );
        return false;
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
        await requestRestoreBookmarkToFolder(
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

  const reorderBookmarks = useCallback(
    async (
      collection: Collection | null,
      folderId: string,
      orderedBookmarkIds: string[],
    ) => {
      if (!collection || guardSync()) {
        return;
      }
      try {
        await requestReorderBookmarksInFolder(
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

  const moveBookmark = useCallback(
    async (collection: Collection | null, params: MoveBookmarkParams) => {
      if (!collection || guardSync()) {
        return;
      }
      try {
        await requestMoveBookmarkBetweenFolders(
          userId,
          collection.id,
          params.sourceFolderId,
          params.targetFolderId,
          params.bookmarkId,
          params.targetIndex,
        );
      } catch (err) {
        notify(
          err instanceof Error
            ? err.message
            : "Unable to move bookmark between folders.",
          "danger",
        );
      }
    },
    [guardSync, notify, userId],
  );

  return {
    savingBookmark,
    saveBookmarks,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    moveBookmark,
  };
};
