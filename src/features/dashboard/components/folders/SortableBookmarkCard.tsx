import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Bookmark } from "@/types";
import BookmarkCard from "./BookmarkCard";
import DragHandle from "./DragHandle";

type SortableBookmarkCardProps = {
  folderId: string;
  bookmark: Bookmark;
  allowSync: boolean;
  index: number;
  faviconSrc: string | null;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  onEditBookmark: (folderId: string, bookmark: Bookmark) => void;
};

const SortableBookmarkCard = ({
  folderId,
  bookmark,
  allowSync,
  index,
  faviconSrc,
  onDeleteBookmark,
  onEditBookmark,
}: SortableBookmarkCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    data: { type: "bookmark", folderId, bookmark, index },
    disabled: !allowSync,
  });

  // Apply scale for lift effect when dragging
  const finalTransform =
    isDragging && transform
      ? { ...transform, scaleX: 1.03, scaleY: 1.03 }
      : transform;

  // Use dnd-kit's transition directly - it manages timing for drag and sort animations
  const style = {
    transform: CSS.Transform.toString(finalTransform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging ? "0 8px 20px rgba(0,0,0,0.15)" : undefined,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} className="py-1.5">
      <BookmarkCard
        folderId={folderId}
        bookmark={bookmark}
        allowSync={allowSync}
        faviconSrc={faviconSrc}
        onDeleteBookmark={onDeleteBookmark}
        onEditBookmark={onEditBookmark}
        dragHandle={
          allowSync ? (
            <DragHandle
              label={`Reorder bookmark ${bookmark.title}`}
              setActivatorNodeRef={setActivatorNodeRef}
              attributes={attributes}
              listeners={listeners}
              className="absolute left-2 top-1.25 z-10"
            />
          ) : undefined
        }
      />
    </div>
  );
};

export default SortableBookmarkCard;
