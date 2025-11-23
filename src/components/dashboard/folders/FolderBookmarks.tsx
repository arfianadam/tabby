import type { Bookmark } from "../../../types";
import SortableBookmarkCard from "./SortableBookmarkCard";

type FolderBookmarksProps = {
  folderId: string;
  bookmarks: Bookmark[];
  allowSync: boolean;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  faviconMap: Record<string, string | null>;
  onEditBookmark: (folderId: string, bookmark: Bookmark) => void;
};

const FolderBookmarks = ({
  folderId,
  bookmarks,
  allowSync,
  onDeleteBookmark,
  faviconMap,
  onEditBookmark,
}: FolderBookmarksProps) => {
  return (
    <div className="mt-3">
      {bookmarks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500 text-sm dark:border-slate-700 dark:text-slate-400">
          <p>
            {allowSync
              ? "This folder is empty. Use “Add bookmark” to save links here."
              : "This folder is empty. Enable edit mode to add bookmarks."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1">
          {bookmarks.map((bookmark, index) => (
            <SortableBookmarkCard
              key={bookmark.id}
              folderId={folderId}
              bookmark={bookmark}
              index={index}
              allowSync={allowSync}
              faviconSrc={faviconMap[bookmark.id] ?? null}
              onDeleteBookmark={onDeleteBookmark}
              onEditBookmark={onEditBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderBookmarks;
