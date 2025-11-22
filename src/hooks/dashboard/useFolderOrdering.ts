import { useCallback, useEffect, useMemo, useState } from "react";
import type { Bookmark, Folder } from "../../types";
import { arraysMatch } from "../../utils/arrays";

export const useFolderOrdering = (folders: Folder[]) => {
  const folderIds = useMemo(
    () => folders.map((folder) => folder.id),
    [folders],
  );
  const [folderOrder, setFolderOrder] = useState(folderIds);
  const [bookmarkOrders, setBookmarkOrders] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    setFolderOrder((prev) => (arraysMatch(prev, folderIds) ? prev : folderIds));
  }, [folderIds]);

  useEffect(() => {
    setBookmarkOrders((prev) => {
      const next = { ...prev };
      let changed = false;
      folders.forEach((folder) => {
        const currentOrder = prev[folder.id];
        const remoteIds = folder.bookmarks.map((b) => b.id);
        if (
          !currentOrder ||
          !arraysMatch(currentOrder, remoteIds)
        ) {
             const currentSet = new Set(currentOrder || []);
             const remoteSet = new Set(remoteIds);
             if (currentSet.size !== remoteSet.size || [...currentSet].some(id => !remoteSet.has(id))) {
                 next[folder.id] = remoteIds;
                 changed = true;
             }
        }
      });
      return changed ? next : prev;
    });
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
        
      const knownBIds = new Set(bOrder);
      const remainingBookmarks = folder.bookmarks.filter(
        (b) => !knownBIds.has(b.id),
      );
      
      return {
        ...folder,
        bookmarks: [...orderedBookmarks, ...remainingBookmarks],
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
