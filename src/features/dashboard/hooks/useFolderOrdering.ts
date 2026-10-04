import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Bookmark, Folder } from "@/types";
import { arraysMatch } from "@/utils/arrays";
import { moveBetweenLists, moveWithinList } from "../collectionEdits";

const idKey = (id: string) => id;

export const useFolderOrdering = (folders: Folder[]) => {
  const folderIds = useMemo(
    () => folders.map((folder) => folder.id),
    [folders],
  );
  const [folderOrder, setFolderOrder] = useState(folderIds);
  const [bookmarkOrders, setBookmarkOrders] = useState<
    Record<string, string[]>
  >({});

  // Track the last server state we processed to avoid overwriting local optimistic updates
  const lastServerStateRef = useRef<Record<string, string[]>>({});

  useEffect(() => {
    setFolderOrder((prev) => (arraysMatch(prev, folderIds) ? prev : folderIds));
  }, [folderIds]);

  useEffect(() => {
    const currentServerState: Record<string, string[]> = {};
    folders.forEach((f) => {
      currentServerState[f.id] = f.bookmarks.map((b) => b.id);
    });

    const previousServerState = lastServerStateRef.current;

    setBookmarkOrders((prev) => {
      const next = { ...prev };
      let changed = false;

      folders.forEach((folder) => {
        const folderId = folder.id;
        const serverIds = currentServerState[folderId];
        const lastServerIds = previousServerState[folderId];
        const localIds = prev[folderId];

        // Initialize if no local state
        if (!localIds) {
          next[folderId] = serverIds;
          changed = true;
          return;
        }

        // Only sync if the server state has actually changed since we last saw it
        if (!lastServerIds || !arraysMatch(serverIds, lastServerIds)) {
          next[folderId] = serverIds;
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    lastServerStateRef.current = currentServerState;
  }, [folders]);

  // Map of all bookmarks available in the collection
  const allBookmarksMap = useMemo(() => {
    const map = new Map<string, Bookmark>();
    folders.forEach((f) => f.bookmarks.forEach((b) => map.set(b.id, b)));
    return map;
  }, [folders]);

  const getOrderedFolders = useCallback(() => {
    const folderMap = new Map(folders.map((f) => [f.id, f]));
    const ordered = folderOrder
      .map((id) => folderMap.get(id))
      .filter((f): f is Folder => Boolean(f));
    const knownIds = new Set(folderOrder);
    const remaining = folders.filter((f) => !knownIds.has(f.id));

    return [...ordered, ...remaining].map((folder) => {
      const bOrder = bookmarkOrders[folder.id];
      if (!bOrder) return folder;

      // Use allBookmarksMap to resolve bookmarks, allowing moved bookmarks to be rendered
      const orderedBookmarks = bOrder
        .map((id) => allBookmarksMap.get(id))
        .filter((b): b is Bookmark => Boolean(b));

      return {
        ...folder,
        bookmarks: orderedBookmarks,
      };
    });
  }, [folders, folderOrder, bookmarkOrders, allBookmarksMap]);

  const setBookmarksOrder = (folderId: string, order: string[]) => {
    setBookmarkOrders((prev) => ({
      ...prev,
      [folderId]: order,
    }));
  };

  const moveBookmark = (
    bookmarkId: string,
    sourceFolderId: string,
    targetFolderId: string,
    targetIndex: number,
  ) => {
    setBookmarkOrders((prev) => {
      const next = { ...prev };

      // Helper to get current valid ID list for a folder
      const getList = (fId: string) => {
        if (next[fId]) return next[fId];
        const folder = folders.find((f) => f.id === fId);
        return folder ? folder.bookmarks.map((b) => b.id) : [];
      };

      if (sourceFolderId === targetFolderId) {
        const list = getList(sourceFolderId);
        if (list.includes(bookmarkId)) {
          next[sourceFolderId] = moveWithinList(
            list,
            bookmarkId,
            targetIndex,
            idKey,
          );
        }
      } else {
        // -1 appends to the target folder
        const moved = moveBetweenLists(
          getList(sourceFolderId),
          getList(targetFolderId),
          bookmarkId,
          targetIndex === -1 ? Number.POSITIVE_INFINITY : targetIndex,
          idKey,
        );
        next[sourceFolderId] = moved.source;
        next[targetFolderId] = moved.target;
      }

      return next;
    });
  };

  return {
    foldersToRender: getOrderedFolders(),
    folderOrder,
    setFolderOrder,
    setBookmarksOrder,
    moveBookmark,
  };
};
