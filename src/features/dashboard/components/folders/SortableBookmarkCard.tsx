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

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="py-0.5">
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
              className="absolute left-0.5 top-1/2 z-10 -translate-y-1/2"
            />
          ) : undefined
        }
      />
    </div>
  );
};

export default SortableBookmarkCard;
