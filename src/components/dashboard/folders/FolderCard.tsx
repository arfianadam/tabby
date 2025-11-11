import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faFolderOpen,
  faGripVertical,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { Folder } from "../../../types";
import { subtleButtonClasses } from "../constants";
import FolderBookmarks from "./FolderBookmarks";

type FolderCardProps = {
  folder: Folder;
  allowSync: boolean;
  onOpenBookmarkModal: (folderId: string) => void;
  onDeleteFolder: (folder: Folder) => void;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  onReorderBookmarks: (folderId: string, orderedBookmarkIds: string[]) => void;
  faviconMap: Record<string, string | null>;
};

const FolderCard = ({
  folder,
  allowSync,
  onOpenBookmarkModal,
  onDeleteFolder,
  onDeleteBookmark,
  onReorderBookmarks,
  faviconMap,
}: FolderCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder.id,
    disabled: !allowSync,
  });
  const dragHandleProps = allowSync ? { ...attributes, ...listeners } : {};
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col"
    >
      <div className="flex gap-2 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 text-slate-900 font-semibold">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...dragHandleProps}
            className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-grab"
            aria-label={`Reorder folder ${folder.name}`}
            disabled={!allowSync}
          >
            <FontAwesomeIcon icon={faGripVertical} />
          </button>
          <FontAwesomeIcon icon={faFolderOpen} className="text-indigo-500" />
          <span>{folder.name}</span>
          <span className="flex items-center gap-1 text-xs font-normal text-slate-500">
            <FontAwesomeIcon icon={faBookmark} />
            {folder.bookmarks.length} bookmark
            {folder.bookmarks.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${subtleButtonClasses} gap-2 text-indigo-700 hover:text-indigo-800`}
            onClick={() => onOpenBookmarkModal(folder.id)}
            disabled={!allowSync}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add bookmark
          </button>
          <button
            type="button"
            className={`${subtleButtonClasses} gap-2 text-rose-600 hover:text-rose-700`}
            onClick={() => onDeleteFolder(folder)}
            disabled={!allowSync}
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete folder
          </button>
        </div>
      </div>
      {folder.bookmarks.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500 text-sm">
          <p>This folder is empty. Use “Add bookmark” to start filling it.</p>
        </div>
      ) : (
        <FolderBookmarks
          folderId={folder.id}
          bookmarks={folder.bookmarks}
          allowSync={allowSync}
          onDeleteBookmark={onDeleteBookmark}
          onReorderBookmarks={onReorderBookmarks}
          faviconMap={faviconMap}
        />
      )}
    </article>
  );
};

export default FolderCard;
