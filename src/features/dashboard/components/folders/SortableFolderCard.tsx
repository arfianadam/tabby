import { memo } from "react";
import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Bookmark, Folder } from "@/types";
import FolderCard from "./FolderCard";
import DragHandle from "./DragHandle";

type SortableFolderCardProps = {
  folder: Folder;
  bookmarks: Bookmark[];
  allowSync: boolean;
  editingEnabled: boolean;
  index: number;
  onOpenBookmarkModal: (folderId: string) => void;
  onDeleteFolder: (folder: Folder) => void;
  onRenameFolder: (folder: Folder, name: string) => Promise<boolean>;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  faviconMap: Record<string, string | null>;
  onEditBookmark: (folderId: string, bookmark: Bookmark) => void;
};

const SortableFolderCard = memo(function SortableFolderCard({
  folder,
  bookmarks,
  allowSync,
  editingEnabled,
  index,
  onOpenBookmarkModal,
  onDeleteFolder,
  onRenameFolder,
  onDeleteBookmark,
  faviconMap,
  onEditBookmark,
}: SortableFolderCardProps) {
  const { active } = useDndContext();
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: folder.id,
    data: { type: "folder", folder, index },
    disabled: !editingEnabled,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: folder.id,
    data: { type: "folder", folder, index },
    disabled: !editingEnabled,
  });

  const style = editingEnabled
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 5 : undefined,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const showPlaceholder =
    isOver && active?.data.current?.type === "folder" && !isDragging;
  const placeAfter =
    showPlaceholder && (active.data.current?.index || 0) < index;
  const placeBefore =
    showPlaceholder && (active.data.current?.index || 0) > index;

  const isBookmarkOver =
    isOver &&
    active?.data.current?.type === "bookmark" &&
    active.data.current?.folderId !== folder.id &&
    !isDragging;

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      style={style}
      className={`relative rounded-2xl w-full break-inside-avoid mb-4 ${
        isBookmarkOver ? "ring-2 ring-indigo-500 bg-indigo-50/50" : ""
      }`}
    >
      {placeBefore && (
        <div className="absolute -top-2 left-0 right-0 h-1 rounded bg-indigo-500" />
      )}
      <FolderCard
        folder={folder}
        bookmarks={bookmarks}
        allowSync={allowSync}
        onOpenBookmarkModal={onOpenBookmarkModal}
        onDeleteFolder={onDeleteFolder}
        onRenameFolder={onRenameFolder}
        onDeleteBookmark={onDeleteBookmark}
        faviconMap={faviconMap}
        onEditBookmark={onEditBookmark}
        dragHandle={
          editingEnabled ? (
            <DragHandle
              label={`Reorder folder ${folder.name}`}
              setActivatorNodeRef={setActivatorNodeRef}
              attributes={attributes}
              listeners={listeners}
            />
          ) : null
        }
      />
      {placeAfter && (
        <div className="absolute -bottom-2 left-0 right-0 h-1 rounded bg-indigo-500" />
      )}
    </div>
  );
});

export default SortableFolderCard;
