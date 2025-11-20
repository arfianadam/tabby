import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical } from "@fortawesome/free-solid-svg-icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Bookmark, Folder } from "../../../types";
import FolderCard from "./FolderCard";

type SortableFolderCardProps = {
  folder: Folder;
  bookmarks: Bookmark[];
  allowSync: boolean;
  editingEnabled: boolean;
  onOpenBookmarkModal: (folderId: string) => void;
  onDeleteFolder: (folder: Folder) => void;
  onRenameFolder: (folder: Folder, name: string) => Promise<boolean>;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  faviconMap: Record<string, string | null>;
};

const SortableFolderCard = ({
  folder,
  bookmarks,
  allowSync,
  editingEnabled,
  onOpenBookmarkModal,
  onDeleteFolder,
  onRenameFolder,
  onDeleteBookmark,
  faviconMap,
}: SortableFolderCardProps) => {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder.id,
    disabled: !editingEnabled,
  });

  const style = editingEnabled
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 5 : undefined,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style}>
      <FolderCard
        folder={folder}
        bookmarks={bookmarks}
        allowSync={allowSync}
        onOpenBookmarkModal={onOpenBookmarkModal}
        onDeleteFolder={onDeleteFolder}
        onRenameFolder={onRenameFolder}
        onDeleteBookmark={onDeleteBookmark}
        faviconMap={faviconMap}
        dragHandle={
          editingEnabled ? (
            <button
              type="button"
              aria-label={`Reorder folder ${folder.name}`}
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              className="cursor-grab rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
            >
              <FontAwesomeIcon icon={faGripVertical} />
            </button>
          ) : null
        }
      />
    </div>
  );
};

export default SortableFolderCard;
