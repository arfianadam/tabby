import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { Bookmark } from "../../../types";
import BookmarkCard from "./BookmarkCard";

type FolderBookmarksProps = {
  folderId: string;
  bookmarks: Bookmark[];
  allowSync: boolean;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  faviconMap: Record<string, string | null>;
};

const FolderBookmarks = ({
  folderId,
  bookmarks,
  allowSync,
  onDeleteBookmark,
  faviconMap,
}: FolderBookmarksProps) => {
  const bookmarkIds = useMemo(
    () => bookmarks.map((bookmark) => bookmark.id),
    [bookmarks],
  );
  const { setNodeRef } = useDroppable({
    id: `folder-droppable-${folderId}`,
    disabled: !allowSync,
    data: {
      type: "bookmark-container",
      folderId,
    },
  });

  return (
    <SortableContext
      id={`folder-sortable-${folderId}`}
      items={bookmarkIds}
      strategy={rectSortingStrategy}
    >
      <div ref={setNodeRef} className="mt-3">
        {bookmarks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500 text-sm">
            <p>
              This folder is empty. Drag bookmarks here or use “Add bookmark”.
            </p>
          </div>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                folderId={folderId}
                bookmark={bookmark}
                allowSync={allowSync}
                faviconSrc={faviconMap[bookmark.id] ?? null}
                onDeleteBookmark={onDeleteBookmark}
              />
            ))}
          </div>
        )}
      </div>
    </SortableContext>
  );
};

export default FolderBookmarks;
