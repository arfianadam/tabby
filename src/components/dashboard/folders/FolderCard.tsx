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
        {editingName ? (
          <form
            className="flex w-full gap-2 items-center"
            onSubmit={handleRenameSubmit}
          >
            <FontAwesomeIcon
              icon={faFolderOpen}
              className={`shrink-0 ${colors.icon}`}
            />
            <input
              type="text"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              className={`${inputClasses} flex-1 min-w-0 py-1 px-2 text-sm`}
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
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="submit"
                className={`${actionButtonClasses} px-2! py-1! h-8 w-8 flex items-center justify-center`}
                disabled={!allowSync || renaming}
                title="Save"
              >
                <FontAwesomeIcon
                  icon={renaming ? faSpinner : faCheck}
                  spin={renaming}
                />
              </button>
              <button
                type="button"
                className={`${subtleButtonClasses} px-2! py-1! h-8 w-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700`}
                onClick={cancelEditing}
                disabled={renaming}
                title="Cancel"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          </form>
        ) : (
          <div
            className={`flex items-baseline gap-2 font-semibold ${colors.text} w-full min-w-0`}
          >
            {dragHandle}
            <FontAwesomeIcon
              icon={faFolderOpen}
              className={`relative top-0.5 shrink-0 ${colors.icon}`}
            />
            <div className="grow shrink min-w-0 wrap-break-word">
              <span className="mr-2">{folder.name}</span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md align-middle ${colors.badgeBg} ${colors.badgeText}`}
              >
                <FontAwesomeIcon icon={faBookmark} />
                {bookmarks.length}
              </span>
            </div>
            {allowSync && (
              <div className="flex items-center flex-wrap gap-1 shrink-0 ml-1 self-start">
                <button
                  type="button"
                  className={`${subtleButtonClasses} ${colors.text} opacity-70 hover:opacity-100`}
                  onClick={() => onOpenBookmarkModal(folder.id)}
                  disabled={!allowSync}
                  title="Add bookmark"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
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
        )}
      </div>
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
