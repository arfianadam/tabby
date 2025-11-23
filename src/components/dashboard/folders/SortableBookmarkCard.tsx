import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Bookmark } from "../../../types";
import BookmarkCard from "./BookmarkCard";
import DragHandle from "./DragHandle";

type SortableBookmarkCardProps = {
  folderId: string;
  bookmark: Bookmark;
  allowSync: boolean;
  index: number;
  faviconSrc: string | null;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
};

const SortableBookmarkCard = ({
  folderId,
  bookmark,
  allowSync,
  index,
  faviconSrc,
  onDeleteBookmark,
}: SortableBookmarkCardProps) => {
  const { active } = useDndContext();
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    setActivatorNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: bookmark.id,
    data: { type: "bookmark", folderId, bookmark, index },
    disabled: !allowSync,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: bookmark.id,
    data: { type: "bookmark", folderId, bookmark, index },
    disabled: !allowSync,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 5 : undefined,
    opacity: isDragging ? 0.5 : 1,
    pointerEvents: isDragging ? "none" : undefined,
  } as React.CSSProperties;

  const isSameFolder =
    active?.data.current?.type === "bookmark" &&
    active.data.current.folderId === folderId;

  const showPlaceholder =
    isOver && active?.data.current?.type === "bookmark" && !isDragging;

  const dragIndex = active?.data.current?.index || 0;

  const placeAfter = showPlaceholder && isSameFolder && dragIndex < index;

  // For cross-folder drag, default to placing before (insert at current index)
  const placeBefore = showPlaceholder && (!isSameFolder || dragIndex > index);

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      style={style}
      className="relative h-full"
    >
      {placeBefore && (
        <div className="absolute -top-2 left-0 right-0 h-1 rounded bg-indigo-500 z-20" />
      )}
      <BookmarkCard
        folderId={folderId}
        bookmark={bookmark}
        allowSync={allowSync}
        faviconSrc={faviconSrc}
        onDeleteBookmark={onDeleteBookmark}
        dragHandle={
          allowSync ? (
            <DragHandle
              label={`Reorder bookmark ${bookmark.title}`}
              setActivatorNodeRef={setActivatorNodeRef}
              attributes={attributes}
              listeners={listeners}
              className="absolute left-2 top-2 z-10"
            />
          ) : undefined
        }
      />
      {placeAfter && (
        <div className="absolute -bottom-2 left-0 right-0 h-1 rounded bg-indigo-500 z-20" />
      )}
    </div>
  );
};

export default SortableBookmarkCard;
