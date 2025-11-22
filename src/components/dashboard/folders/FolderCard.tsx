import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faCheck,
  faFolderOpen,
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
  dragHandle?: ReactNode;
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
  dragHandle,
}: FolderCardProps) => {
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
    <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col dark:bg-slate-800/60 dark:border-slate-700">
      <div className="flex gap-2 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 text-slate-900 font-semibold dark:text-slate-100">
          {dragHandle}
          <FontAwesomeIcon
            icon={faFolderOpen}
            className="text-indigo-500 dark:text-indigo-400"
          />
          <span>{folder.name}</span>
          <span className="flex items-center gap-1 text-xs font-normal text-slate-500 dark:text-slate-400">
            <FontAwesomeIcon icon={faBookmark} />
            {bookmarks.length} bookmark
            {bookmarks.length === 1 ? "" : "s"}
          </span>
        </div>
        {allowSync && (
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              className={`${subtleButtonClasses} text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200`}
              onClick={() => onOpenBookmarkModal(folder.id)}
              disabled={!allowSync}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            {!editingName && (
              <button
                type="button"
                className={`${subtleButtonClasses} text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300`}
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
              className={`${subtleButtonClasses} text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300`}
              onClick={() => onDeleteFolder(folder)}
              disabled={!allowSync}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        )}
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
