import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faPlus } from "@/utils/uiIcons";
import type { Bookmark } from "@/types";
import SortableBookmarkCard from "./SortableBookmarkCard";

type FolderBookmarksProps = {
  folderId: string;
  bookmarks: Bookmark[];
  allowSync: boolean;
  canToggleEdit: boolean;
  onEnableEditMode: () => void;
  onOpenBookmarkModal: (folderId: string) => void;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  faviconMap: Record<string, string | null>;
  onEditBookmark: (folderId: string, bookmark: Bookmark) => void;
};

const FolderBookmarks = ({
  folderId,
  bookmarks,
  allowSync,
  canToggleEdit,
  onEnableEditMode,
  onOpenBookmarkModal,
  onDeleteBookmark,
  faviconMap,
  onEditBookmark,
}: FolderBookmarksProps) => {
  return (
    <div className="p-2">
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-muted)] px-5 py-7 text-center text-xs text-[var(--muted)]">
          <p className="leading-relaxed">
            {allowSync
              ? "No links in this folder yet."
              : "This folder is empty."}
          </p>
          {allowSync ? (
            <button
              type="button"
              onClick={() => onOpenBookmarkModal(folderId)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add bookmark
            </button>
          ) : canToggleEdit ? (
            <button
              type="button"
              onClick={onEnableEditMode}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <FontAwesomeIcon icon={faPenToSquare} />
              Enable edit mode
            </button>
          ) : null}
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
