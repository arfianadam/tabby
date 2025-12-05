import { memo } from "react";
import { useDndContext } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
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
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: folder.id,
    data: { type: "folder", folder, index },
    disabled: !editingEnabled,
  });

  // Use dnd-kit's transition directly - it manages timing for drag and sort animations
  const style = editingEnabled
    ? {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }
    : undefined;

  const isBookmarkOver =
    isOver &&
    active?.data.current?.type === "bookmark" &&
    active.data.current?.folderId !== folder.id &&
    !isDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-2xl w-105 shrink-0 break-inside-avoid mb-4 ${
        isBookmarkOver
          ? "ring-2 ring-indigo-500 bg-indigo-50/50 dark:ring-indigo-600 dark:bg-indigo-900/20"
          : ""
      }`}
    >
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
    </div>
  );
});

export default SortableFolderCard;
