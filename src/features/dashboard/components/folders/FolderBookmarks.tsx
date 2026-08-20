import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Bookmark } from "@/types";
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
    <div className="p-2">
      {bookmarks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-muted)] px-5 py-8 text-center text-xs text-[var(--muted)]">
          <p className="leading-relaxed">
            {allowSync
              ? 'This folder is empty. Use "Add bookmark" to save links here.'
              : "This folder is empty. Enable edit mode to add bookmarks."}
          </p>
        </div>
      ) : (
        <SortableContext
          items={bookmarks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1">
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
        </SortableContext>
      )}
    </div>
  );
};

export default FolderBookmarks;
