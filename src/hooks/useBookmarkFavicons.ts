import { useMemo } from "react";
import type { Bookmark } from "../types";
import { useFavicons } from "./useFavicons";

export const useBookmarkFavicons = (bookmarks: Bookmark[]) => {
  const targets = useMemo(
    () =>
      bookmarks.map((bookmark) => ({
        id: bookmark.id,
        url: bookmark.url,
      })),
    [bookmarks],
  );

  return useFavicons(targets);
};
