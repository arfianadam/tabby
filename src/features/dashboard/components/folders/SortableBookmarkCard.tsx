import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Bookmark } from "@/types";
import BookmarkCard from "./BookmarkCard";
import DragHandle from "./DragHandle";
import { useEffect, useRef } from "react";

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
  const { active, over } = useDndContext();
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    setActivatorNodeRef,
    transform,
    isDragging,
    node,
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

  // Store the initial rect before dragging starts
  const initialRectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (isDragging && !initialRectRef.current) {
      initialRectRef.current = node.current?.getBoundingClientRect() ?? null;
    } else if (!isDragging) {
      initialRectRef.current = null;
    }
  }, [isDragging, node]);

  const isSameFolder =
    active?.data.current?.type === "bookmark" &&
    active.data.current.folderId === folderId;

  const showPlaceholder =
    isOver && active?.data.current?.type === "bookmark" && !isDragging;

  const dragIndex = active?.data.current?.index || 0;

  const placeAfter = showPlaceholder && isSameFolder && dragIndex < index;

  // For cross-folder drag, default to placing before (insert at current index)
  const placeBefore = showPlaceholder && (!isSameFolder || dragIndex > index);

  // Adjust transform Y based on position relative to the hovered element
  // Use the initial rect (before dragging) for stable position comparison
  // Only adjust when over a bookmark in the same folder
  const initialRect = initialRectRef.current;
  const overRect = over?.rect;
  const isOverBookmark = over?.data.current?.type === "bookmark";
  const isOverSameFolder = over?.data.current?.folderId === folderId;
  const isOverDifferent = over?.id !== bookmark.id;
  const shouldAdjustTransform =
    isOverBookmark && isOverSameFolder && isOverDifferent;
  const isAboveOver =
    shouldAdjustTransform &&
    initialRect &&
    overRect &&
    initialRect.top > overRect.top;
  const adjustedTransform = transform
    ? {
        ...transform,
        y: transform.y - (isAboveOver ? (overRect?.height ?? 0) : 0),
      }
    : null;

  const style = {
    transform: CSS.Translate.toString(adjustedTransform),
    zIndex: isDragging ? 5 : undefined,
    opacity: isDragging ? 0.5 : 1,
    pointerEvents: isDragging ? "none" : undefined,
  } as React.CSSProperties;

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      style={style}
      className="py-1.5"
    >
      {placeBefore && (
        <div className="h-10 rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 mb-3" />
      )}
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
      {placeAfter && (
        <div className="h-10 rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 mt-3" />
      )}
    </div>
  );
};

export default SortableBookmarkCard;
