import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import type { Bookmark } from "../../../types";
import { useBookmarkOrdering } from "../../../hooks/dashboard/useBookmarkOrdering";
import BookmarkCard from "./BookmarkCard";

type FolderBookmarksProps = {
  folderId: string;
  bookmarks: Bookmark[];
  allowSync: boolean;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  onReorderBookmarks: (folderId: string, orderedBookmarkIds: string[]) => void;
  faviconMap: Record<string, string | null>;
};

const FolderBookmarks = ({
  folderId,
  bookmarks,
  allowSync,
  onDeleteBookmark,
  onReorderBookmarks,
  faviconMap,
}: FolderBookmarksProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );
  const { bookmarksToRender, setBookmarkOrder } =
    useBookmarkOrdering(bookmarks);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!allowSync) {
      return;
    }
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      return;
    }
    setBookmarkOrder((prev) => {
      const oldIndex = prev.indexOf(activeId);
      const newIndex = prev.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      const orderedBookmarkIds = arrayMove(prev, oldIndex, newIndex);
      onReorderBookmarks(folderId, orderedBookmarkIds);
      return orderedBookmarkIds;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={bookmarksToRender.map((bookmark) => bookmark.id)}
        strategy={rectSortingStrategy}
      >
        <div className="mt-3 flex gap-3 flex-wrap">
          {bookmarksToRender.map((bookmark) => (
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
      </SortableContext>
    </DndContext>
  );
};

export default FolderBookmarks;
