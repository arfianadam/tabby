import {
  memo,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faCheck,
  faGear,
  faPlus,
  faSpinner,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { Bookmark, Folder } from "@/types";
import {
  actionButtonClasses,
  dangerEditorControlButtonClasses,
  editorControlButtonClasses,
  inputClasses,
  subtleButtonClasses,
} from "../constants";
import FolderBookmarks from "./FolderBookmarks";
import { getFolderColor } from "@/utils/colors";
import { getIconDefinition } from "@/components/IconPicker";

type FolderCardProps = {
  folder: Folder;
  bookmarks: Bookmark[];
  allowSync: boolean;
  onOpenBookmarkModal: (folderId: string) => void;
  onDeleteFolder: (folder: Folder) => void;
  onRenameFolder: (folder: Folder, name: string) => Promise<boolean>;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  faviconMap: Record<string, string | null>;
  onEditBookmark: (folderId: string, bookmark: Bookmark) => void;
  onOpenFolderSettings: (folder: Folder) => void;
  dragHandle?: ReactNode;
};

const FolderCard = memo(function FolderCard({
  folder,
  bookmarks,
  allowSync,
  onOpenBookmarkModal,
  onDeleteFolder,
  onRenameFolder,
  onDeleteBookmark,
  faviconMap,
  onEditBookmark,
  onOpenFolderSettings,
  dragHandle,
}: FolderCardProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(folder.name);
  const [renaming, setRenaming] = useState(false);

  const colors = getFolderColor(folder.name);
  const folderIcon = getIconDefinition(folder.icon);

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
    <article className="group/folder flex min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-[var(--surface-raised)] shadow-[0_10px_30px_rgba(36,38,33,0.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(36,38,33,0.09)] dark:shadow-none">
      <div className="flex min-h-16 items-center justify-between gap-2 border-b border-[var(--line)] p-3">
        {editingName ? (
          <form
            className="flex w-full gap-2 items-center"
            onSubmit={handleRenameSubmit}
          >
            <FontAwesomeIcon
              icon={folderIcon}
              className={`shrink-0 ${colors.icon}`}
            />
            <input
              type="text"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              className={`${inputClasses} min-w-0 flex-1 px-2 py-1 text-sm`}
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
                className={`${actionButtonClasses} flex h-8 w-8 items-center justify-center px-2! py-1!`}
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
                className={`${subtleButtonClasses} flex h-8 w-8 items-center justify-center px-2! py-1!`}
                onClick={cancelEditing}
                disabled={renaming}
                title="Cancel"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          </form>
        ) : (
          <div className="flex w-full min-w-0 items-center gap-2">
            {dragHandle}
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${colors.bg} ${colors.icon}`}
            >
              <FontAwesomeIcon icon={folderIcon} />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-[0.95rem] font-bold tracking-[-0.01em] text-[var(--ink)]">
                {folder.name}
              </span>
              <span className="mt-0.5 block text-[0.65rem] font-semibold uppercase tracking-[0.11em] text-[var(--muted)]">
                {bookmarks.length} {bookmarks.length === 1 ? "link" : "links"}
              </span>
            </div>
            {!allowSync && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.65rem] font-bold ${colors.badgeBg} ${colors.badgeText}`}
              >
                <FontAwesomeIcon icon={faBookmark} />
                {bookmarks.length}
              </span>
            )}
            {allowSync && (
              <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover/folder:opacity-100 sm:group-focus-within/folder:opacity-100">
                <button
                  type="button"
                  className={`${editorControlButtonClasses} cursor-pointer`}
                  onClick={() => onOpenBookmarkModal(folder.id)}
                  disabled={!allowSync}
                  title="Add bookmark"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
                <button
                  type="button"
                  className={`${editorControlButtonClasses} cursor-pointer`}
                  onClick={() => onOpenFolderSettings(folder)}
                  disabled={!allowSync}
                  title="Folder settings"
                >
                  <FontAwesomeIcon icon={faGear} />
                </button>
                <button
                  type="button"
                  className={`${dangerEditorControlButtonClasses} cursor-pointer`}
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
        onEditBookmark={onEditBookmark}
      />
    </article>
  );
});

export default FolderCard;
