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
import { getFolderColor } from "../../../utils/colors";

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

  const colors = getFolderColor(folder.name);

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
      <div
        className={`flex gap-2 items-center justify-between p-3 rounded-xl border mb-3 ${colors.bg} ${colors.border}`}
      >
        <div
          className={`flex items-baseline gap-2 font-semibold ${colors.text}`}
        >
          {dragHandle}
          <FontAwesomeIcon
            icon={faFolderOpen}
            className={`relative top-0.5 ${colors.icon}`}
          />
          <div className="grow shrink">
            <span>{folder.name}</span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ml-2 px-1 py-0.5 rounded-md relative top-px ${colors.badgeBg} ${colors.badgeText}`}
            >
              <FontAwesomeIcon icon={faBookmark} />
              {bookmarks.length}
            </span>
          </div>
        </div>
        {allowSync && (
          <div className="flex items-center flex-wrap gap-1">
            <button
              type="button"
              className={`${subtleButtonClasses} ${colors.text} opacity-70 hover:opacity-100`}
              onClick={() => onOpenBookmarkModal(folder.id)}
              disabled={!allowSync}
              title="Add bookmark"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            {!editingName && (
              <button
                type="button"
                className={`${subtleButtonClasses} ${colors.text} opacity-70 hover:opacity-100`}
                onClick={() => {
                  setNameDraft(folder.name);
                  setEditingName(true);
                }}
                disabled={!allowSync}
                title="Rename folder"
              >
                <FontAwesomeIcon icon={faPen} />
              </button>
            )}
            <button
              type="button"
              className={`${subtleButtonClasses} text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 opacity-70 hover:opacity-100`}
              onClick={() => onDeleteFolder(folder)}
              disabled={!allowSync}
              title="Delete folder"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        )}
      </div>
      {editingName && (
        <form
          className="mb-3 px-1 flex flex-wrap gap-2 items-center"
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
