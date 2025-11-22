import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical } from "@fortawesome/free-solid-svg-icons";
import type { Bookmark } from "../../../types";
import BookmarkCard from "./BookmarkCard";

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

  const placeAfter =
    showPlaceholder && isSameFolder && dragIndex < index;
  
  // For cross-folder drag, default to placing before (insert at current index)
  const placeBefore =
    showPlaceholder && (!isSameFolder || dragIndex > index);

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      style={style}
      className="relative max-w-90 shrink-0"
    >
      {placeBefore && (
        <div className="absolute -left-2 top-0 bottom-0 w-1 rounded bg-indigo-500 z-20" />
      )}
      <BookmarkCard
        folderId={folderId}
        bookmark={bookmark}
        allowSync={allowSync}
        faviconSrc={faviconSrc}
        onDeleteBookmark={onDeleteBookmark}
        dragHandle={
          allowSync ? (
            <button
              type="button"
              className="absolute left-3 top-4 z-10 rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-500 cursor-grab active:cursor-grabbing h-6 w-6 flex items-center justify-center transition-colors"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label={`Reorder bookmark ${bookmark.title}`}
            >
              <FontAwesomeIcon icon={faGripVertical} className="text-xs" />
            </button>
          ) : undefined
        }
      />
      {placeAfter && (
        <div className="absolute -right-2 top-0 bottom-0 w-1 rounded bg-indigo-500 z-20" />
      )}
    </div>
  );
};

export default SortableBookmarkCard;
