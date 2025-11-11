import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faCheck,
  faFolderOpen,
  faGripVertical,
  faPen,
  faPlus,
  faSpinner,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { Bookmark, Folder } from "../../../types";
import {
  actionButtonClasses,
  inputClasses,
  subtleButtonClasses,
} from "../constants";
import FolderBookmarks from "./FolderBookmarks";

type FolderCardProps = {
  folder: Folder;
  bookmarks: Bookmark[];
  allowSync: boolean;
  onOpenBookmarkModal: (folderId: string) => void;
  onDeleteFolder: (folder: Folder) => void;
  onRenameFolder: (folder: Folder, name: string) => Promise<boolean>;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  faviconMap: Record<string, string | null>;
};

const FolderCard = ({
  folder,
  bookmarks,
  allowSync,
  onOpenBookmarkModal,
  onDeleteFolder,
  onRenameFolder,
  onDeleteBookmark,
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
    data: {
      type: "folder",
      folderId: folder.id,
    },
  });
  const dragHandleProps = allowSync ? { ...attributes, ...listeners } : {};
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    visibility: isDragging ? "hidden" : undefined,
  };
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(folder.name);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    if (!editingName) {
      setNameDraft(folder.name);
    }
  }, [editingName, folder.name]);

  useEffect(() => {
    if (!allowSync && editingName) {
      setEditingName(false);
      setRenaming(false);
      setNameDraft(folder.name);
    }
  }, [allowSync, editingName, folder.name]);

  const handleRenameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!allowSync || renaming) {
      return;
    }
    setRenaming(true);
    try {
      const success = await onRenameFolder(folder, nameDraft);
      if (success) {
        setEditingName(false);
      }
    } finally {
      setRenaming(false);
    }
  };

  const cancelEditing = () => {
    setEditingName(false);
    setNameDraft(folder.name);
    setRenaming(false);
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
            {bookmarks.length} bookmark
            {bookmarks.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            className={`${subtleButtonClasses} text-indigo-700 hover:text-indigo-800`}
            onClick={() => onOpenBookmarkModal(folder.id)}
            disabled={!allowSync}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
          {!editingName && (
            <button
              type="button"
              className={`${subtleButtonClasses} text-slate-600 hover:text-slate-700`}
              onClick={() => {
                setNameDraft(folder.name);
                setEditingName(true);
              }}
              disabled={!allowSync}
            >
              <FontAwesomeIcon icon={faPen} />
            </button>
          )}
          <button
            type="button"
            className={`${subtleButtonClasses} text-rose-600 hover:text-rose-700`}
            onClick={() => onDeleteFolder(folder)}
            disabled={!allowSync}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>
      {editingName && (
        <form
          className="mt-3 flex flex-wrap gap-2 items-center"
          onSubmit={handleRenameSubmit}
        >
          <input
            type="text"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            className={`${inputClasses} flex-1 min-w-[180px]`}
            placeholder="Folder name"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                cancelEditing();
              }
            }}
            disabled={!allowSync || renaming}
          />
          <button
            type="submit"
            className={`${actionButtonClasses} gap-2`}
            disabled={!allowSync || renaming}
          >
            <FontAwesomeIcon
              icon={renaming ? faSpinner : faCheck}
              spin={renaming}
            />
            {renaming ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className={`${subtleButtonClasses} gap-2`}
            onClick={cancelEditing}
            disabled={renaming}
          >
            <FontAwesomeIcon icon={faXmark} />
            Cancel
          </button>
        </form>
      )}
      <FolderBookmarks
        folderId={folder.id}
        bookmarks={bookmarks}
        allowSync={allowSync}
        onDeleteBookmark={onDeleteBookmark}
        faviconMap={faviconMap}
      />
    </article>
  );
};

export default FolderCard;
