import { useEffect, useMemo, useState } from "react";
import type { Bookmark } from "../../types";
import { arraysMatch } from "../../utils/arrays";

export const useBookmarkOrdering = (bookmarks: Bookmark[]) => {
  const bookmarkIds = useMemo(
    () => bookmarks.map((bookmark) => bookmark.id),
    [bookmarks],
  );
  const [bookmarkOrder, setBookmarkOrder] = useState(bookmarkIds);

  useEffect(() => {
    setBookmarkOrder((prev) =>
      arraysMatch(prev, bookmarkIds) ? prev : bookmarkIds,
    );
  }, [bookmarkIds]);

  const bookmarkMap = useMemo(() => {
    const map = new Map<string, Bookmark>();
    bookmarks.forEach((bookmark) => map.set(bookmark.id, bookmark));
    return map;
  }, [bookmarks]);

  const orderedBookmarks = bookmarkOrder
    .map((id) => bookmarkMap.get(id))
    .filter((bookmark): bookmark is Bookmark => Boolean(bookmark));
  const knownIds = new Set(bookmarkOrder);
  const remainingBookmarks = bookmarks.filter(
    (bookmark) => !knownIds.has(bookmark.id),
  );

  return {
    bookmarksToRender: [...orderedBookmarks, ...remainingBookmarks],
    bookmarkOrder,
    setBookmarkOrder,
  };
};
