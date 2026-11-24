import {
  memo,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faCheck,
  faChevronDown,
  faChevronUp,
  faGear,
  faPlus,
  faSpinner,
  faTrash,
  faXmark,
} from "@/utils/uiIcons";
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
import { useFolderIcon } from "@/components/IconPicker/hooks/useFolderIcon";
import { openUrlsInNewTabs } from "@/utils/chrome";

type FolderCardProps = {
  folder: Folder;
  bookmarks: Bookmark[];
  allowSync: boolean;
  canToggleEdit: boolean;
  onEnableEditMode: () => void;
  onOpenBookmarkModal: (folderId: string) => void;
  onDeleteFolder: (folder: Folder) => void;
  onRenameFolder: (folder: Folder, name: string) => Promise<boolean>;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  faviconMap: Record<string, string | null>;
  onEditBookmark: (folderId: string, bookmark: Bookmark) => void;
  onOpenFolderSettings: (folder: Folder) => void;
  dragHandle?: ReactNode;
  isOverlay?: boolean;
};

const FolderCard = memo(function FolderCard({
  folder,
  bookmarks,
  allowSync,
  canToggleEdit,
  onEnableEditMode,
  onOpenBookmarkModal,
  onDeleteFolder,
  onRenameFolder,
  onDeleteBookmark,
  faviconMap,
  onEditBookmark,
  onOpenFolderSettings,
  dragHandle,
  isOverlay = false,
}: FolderCardProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(folder.name);
  const [renaming, setRenaming] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const colors = getFolderColor(folder.name, folder.color);
  const folderIcon = useFolderIcon(folder.icon);

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

  const handleOpenAll = () => {
    openUrlsInNewTabs(bookmarks.map((bookmark) => bookmark.url));
  };

  return (
    <article
      className={`group/folder flex min-w-0 flex-col overflow-hidden rounded-[1.35rem] border bg-[var(--surface-raised)] transition duration-200 ${
        isOverlay
          ? "border-[var(--accent)]/60 shadow-[0_24px_60px_rgba(0,0,0,0.28)] ring-2 ring-[var(--accent)]/25"
          : "border-[var(--line)] shadow-[0_10px_30px_rgba(36,38,33,0.045)] hover:shadow-[0_16px_40px_rgba(36,38,33,0.09)] dark:shadow-none"
      }`}
    >
      <div
        className={`flex min-h-16 items-center justify-between gap-2 p-3 ${
          collapsed ? "" : "border-b border-[var(--line)]"
        }`}
      >
        {editingName ? (
          <form
            className="flex w-full items-center gap-2"
            onSubmit={handleRenameSubmit}
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${colors.bg} ${colors.icon}`}
            >
              <FontAwesomeIcon icon={folderIcon} />
            </span>
            <input
              type="text"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              className={`${inputClasses} min-w-0 flex-1 px-2.5 py-1.5 text-sm`}
              placeholder="Folder name"
              aria-label="Folder name"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelEditing();
                }
              }}
              disabled={!allowSync || renaming}
            />
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="submit"
                className={`${actionButtonClasses} flex size-8 items-center justify-center px-0! py-0!`}
                disabled={!allowSync || renaming || !nameDraft.trim()}
                title="Save name"
                aria-label="Save folder name"
              >
                <FontAwesomeIcon
                  icon={renaming ? faSpinner : faCheck}
                  spin={renaming}
                />
              </button>
              <button
                type="button"
                className={`${subtleButtonClasses} flex size-8 items-center justify-center px-0! py-0!`}
                onClick={cancelEditing}
                disabled={renaming}
                title="Cancel rename"
                aria-label="Cancel folder rename"
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
              <span
                className={`block truncate text-[0.95rem] font-bold tracking-[-0.01em] text-[var(--ink)] ${
                  allowSync ? "cursor-text" : ""
                }`}
                onDoubleClick={() => {
                  if (allowSync && !isOverlay) {
                    setEditingName(true);
                  }
                }}
                title={
                  allowSync
                    ? `${folder.name} — double-click to rename`
                    : folder.name
                }
              >
                {folder.name}
              </span>
              <span className="mt-0.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                {bookmarks.length} {bookmarks.length === 1 ? "link" : "links"}
              </span>
            </div>

            {!isOverlay && !allowSync && (
              <div className="flex shrink-0 items-center gap-0.5">
                {bookmarks.length > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenAll}
                    title={`Open all ${bookmarks.length} links in new tabs`}
                    aria-label={`Open all links in ${folder.name}`}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[var(--muted)] opacity-0 transition hover:bg-black/5 hover:text-[var(--ink)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] group-hover/folder:opacity-100 group-focus-within/folder:opacity-100 dark:hover:bg-white/10"
                  >
                    <FontAwesomeIcon
                      icon={faArrowUpRightFromSquare}
                      className="text-[11px]"
                    />
                    <span>Open all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCollapsed((prev) => !prev)}
                  title={collapsed ? "Expand folder" : "Collapse folder"}
                  aria-label={
                    collapsed
                      ? `Expand folder ${folder.name}`
                      : `Collapse folder ${folder.name}`
                  }
                  aria-expanded={!collapsed}
                  className={`${editorControlButtonClasses} cursor-pointer opacity-45 transition hover:opacity-100 group-hover/folder:opacity-100`}
                >
                  <FontAwesomeIcon
                    icon={collapsed ? faChevronDown : faChevronUp}
                    className="text-xs"
                  />
                </button>
              </div>
            )}

            {!isOverlay && allowSync && (
              <div className="flex shrink-0 items-center gap-0.5 opacity-65 transition group-hover/folder:opacity-100 group-focus-within/folder:opacity-100">
                <button
                  type="button"
                  className={`${editorControlButtonClasses} cursor-pointer`}
                  onClick={() => onOpenBookmarkModal(folder.id)}
                  disabled={!allowSync}
                  title="Add bookmark"
                  aria-label={`Add bookmark to ${folder.name}`}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
                <button
                  type="button"
                  className={`${editorControlButtonClasses} cursor-pointer`}
                  onClick={() => onOpenFolderSettings(folder)}
                  disabled={!allowSync}
                  title="Folder settings"
                  aria-label={`Settings for ${folder.name}`}
                >
                  <FontAwesomeIcon icon={faGear} />
                </button>
                <button
                  type="button"
                  className={`${dangerEditorControlButtonClasses} cursor-pointer`}
                  onClick={() => onDeleteFolder(folder)}
                  disabled={!allowSync}
                  title="Delete folder"
                  aria-label={`Delete folder ${folder.name}`}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {!collapsed && !isOverlay && (
        <FolderBookmarks
          folderId={folder.id}
          bookmarks={bookmarks}
          allowSync={allowSync}
          canToggleEdit={canToggleEdit}
          onEnableEditMode={onEnableEditMode}
          onOpenBookmarkModal={onOpenBookmarkModal}
          onDeleteBookmark={onDeleteBookmark}
          faviconMap={faviconMap}
          onEditBookmark={onEditBookmark}
        />
      )}
    </article>
  );
});

export default FolderCard;
