import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Bookmark, Folder } from "@/types";
import { arraysMatch } from "@/utils/arrays";

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
        if (next[fId]) return [...next[fId]];
        const folder = folders.find((f) => f.id === fId);
        return folder ? folder.bookmarks.map((b) => b.id) : [];
      };

      if (sourceFolderId === targetFolderId) {
        const list = getList(sourceFolderId);
        const sIdx = list.indexOf(bookmarkId);
        if (sIdx > -1) {
          list.splice(sIdx, 1);
          let insertIdx = targetIndex;
          // Adjust index if moving down, as removal shifts indices
          insertIdx = Math.max(0, Math.min(insertIdx, list.length));
          list.splice(insertIdx, 0, bookmarkId);
          next[sourceFolderId] = list;
        }
      } else {
        const sourceList = getList(sourceFolderId);
        const targetList = getList(targetFolderId);

        // Remove from source
        const sIdx = sourceList.indexOf(bookmarkId);
        if (sIdx > -1) {
          sourceList.splice(sIdx, 1);
        }

        // Add to target
        if (targetIndex === -1) {
          targetList.push(bookmarkId);
        } else {
          const safeIndex = Math.min(
            Math.max(0, targetIndex),
            targetList.length,
          );
          targetList.splice(safeIndex, 0, bookmarkId);
        }

        next[sourceFolderId] = sourceList;
        next[targetFolderId] = targetList;
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
