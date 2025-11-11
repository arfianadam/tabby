import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faFolder,
  faFolderOpen,
  faGripVertical,
  faPlus,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { Bookmark, Collection, Folder } from "../../types";
import type { BookmarkFormState } from "../Dashboard";
import type { BrowserTab } from "../../utils/chrome";
import { useBookmarkFavicons } from "../../hooks/useBookmarkFavicons";
import {
  actionButtonClasses,
  inputClasses,
  panelClass,
  subtleButtonClasses,
} from "./constants";
import AddBookmarkModal from "./AddBookmarkModal";

type CollectionDetailsProps = {
  collection: Collection;
  allowSync: boolean;
  onDeleteCollection: (collection: Collection) => void;
  newFolder: string;
  onNewFolderChange: (value: string) => void;
  creatingFolder: boolean;
  onCreateFolder: (event: React.FormEvent<HTMLFormElement>) => void;
  onDeleteFolder: (folder: Folder) => void;
  onOpenBookmarkModal: (folderId: string) => void;
  onCloseBookmarkModal: () => void;
  bookmarkModalFolderId: string | null;
  bookmarkForm: BookmarkFormState;
  onBookmarkFormChange: (field: keyof BookmarkFormState, value: string) => void;
  onAddBookmark: (
    event: React.FormEvent<HTMLFormElement>,
    folderId: string,
  ) => void;
  onAddSelectedTabs: (folderId: string, tabs: BrowserTab[]) => void;
  savingBookmark: boolean;
  hasChromeTabsSupport: boolean;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  onReorderFolders: (orderedFolderIds: string[]) => void;
  onReorderBookmarks: (folderId: string, orderedBookmarkIds: string[]) => void;
};

const CollectionDetails = ({
  collection,
  allowSync,
  onDeleteCollection,
  newFolder,
  onNewFolderChange,
  creatingFolder,
  onCreateFolder,
  onDeleteFolder,
  onOpenBookmarkModal,
  onCloseBookmarkModal,
  bookmarkModalFolderId,
  bookmarkForm,
  onBookmarkFormChange,
  onAddBookmark,
  onAddSelectedTabs,
  savingBookmark,
  hasChromeTabsSupport,
  onDeleteBookmark,
  onReorderFolders,
  onReorderBookmarks,
}: CollectionDetailsProps) => {
  const activeBookmarkFolder =
    collection.folders.find((folder) => folder.id === bookmarkModalFolderId) ??
    null;
  const allBookmarks = useMemo(
    () => collection.folders.flatMap((folder) => folder.bookmarks),
    [collection.folders],
  );
  const faviconMap = useBookmarkFavicons(allBookmarks);
  const folderIds = useMemo(
    () => collection.folders.map((folder) => folder.id),
    [collection.folders],
  );
  const [folderOrder, setFolderOrder] = useState(folderIds);
  useEffect(() => {
    setFolderOrder((prev) => (arraysMatch(prev, folderIds) ? prev : folderIds));
  }, [folderIds]);
  const folderMap = useMemo(() => {
    const map = new Map<string, Folder>();
    collection.folders.forEach((folder) => map.set(folder.id, folder));
    return map;
  }, [collection.folders]);
  const orderedFolders = folderOrder
    .map((id) => folderMap.get(id))
    .filter((folder): folder is Folder => Boolean(folder));
  const knownFolderIds = new Set(folderOrder);
  const remainingFolders = collection.folders.filter(
    (folder) => !knownFolderIds.has(folder.id),
  );
  const foldersToRender = [...orderedFolders, ...remainingFolders];
  const folderSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleFolderDragEnd = (event: DragEndEvent) => {
    if (!allowSync) {
      return;
    }
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      return;
    }
    setFolderOrder((prev) => {
      const oldIndex = prev.indexOf(activeId);
      const newIndex = prev.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      const orderedFolderIds = arrayMove(prev, oldIndex, newIndex);
      onReorderFolders(orderedFolderIds);
      return orderedFolderIds;
    });
  };

  return (
    <section className={`${panelClass} min-h-0`}>
      <div className="flex flex-col gap-4 h-full overflow-hidden">
        <div className="flex gap-2 items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {collection.name}
          </h2>
          <button
            className={`${subtleButtonClasses} text-rose-600 hover:text-rose-700`}
            type="button"
            onClick={() => onDeleteCollection(collection)}
            disabled={!allowSync}
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Delete collection
          </button>
        </div>
        <form className="space-y-1" onSubmit={onCreateFolder}>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            New folder
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: Launch inspiration"
              value={newFolder}
              disabled={!collection || !allowSync}
              onChange={(event) => onNewFolderChange(event.target.value)}
              className={`${inputClasses} ${
                !collection || !allowSync ? "cursor-not-allowed opacity-60" : ""
              }`}
            />
            <button
              type="submit"
              disabled={creatingFolder || !collection || !allowSync}
              className={`${actionButtonClasses} gap-2`}
            >
              <FontAwesomeIcon
                icon={creatingFolder ? faSpinner : faPlus}
                spin={creatingFolder}
              />
              {creatingFolder ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
        <div className="grow flex flex-col gap-4 overflow-hidden">
          {collection.folders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
              <p className="flex items-center justify-center gap-2 text-sm">
                <FontAwesomeIcon icon={faFolder} />
                No folders yet. Add one above to start saving bookmarks.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={folderSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFolderDragEnd}
            >
              <SortableContext
                items={foldersToRender.map((folder) => folder.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grow overflow-y-auto pr-2 flex flex-col gap-4">
                  {foldersToRender.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      allowSync={allowSync}
                      onOpenBookmarkModal={onOpenBookmarkModal}
                      onDeleteFolder={onDeleteFolder}
                      onDeleteBookmark={onDeleteBookmark}
                      onReorderBookmarks={onReorderBookmarks}
                      faviconMap={faviconMap}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
      <AddBookmarkModal
        folder={activeBookmarkFolder}
        open={Boolean(activeBookmarkFolder)}
        allowSync={allowSync}
        bookmarkForm={bookmarkForm}
        onBookmarkFormChange={onBookmarkFormChange}
        onAddBookmark={onAddBookmark}
        onAddSelectedTabs={onAddSelectedTabs}
        savingBookmark={savingBookmark}
        hasChromeTabsSupport={hasChromeTabsSupport}
        onClose={onCloseBookmarkModal}
      />
    </section>
  );
};

export default CollectionDetails;

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

type FolderBookmarksProps = {
  folderId: string;
  bookmarks: Bookmark[];
  allowSync: boolean;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  onReorderBookmarks: (folderId: string, orderedBookmarkIds: string[]) => void;
  faviconMap: Record<string, string | null>;
};

const FolderBookmarks = ({
  folderId,
  bookmarks,
  allowSync,
  onDeleteBookmark,
  onReorderBookmarks,
  faviconMap,
}: FolderBookmarksProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );
  const bookmarkIds = useMemo(
    () => bookmarks.map((bookmark) => bookmark.id),
    [bookmarks],
  );
  const [bookmarkOrder, setBookmarkOrder] = useState(bookmarkIds);
  useEffect(() => {
    setBookmarkOrder((prev) =>
      arraysMatch(prev, bookmarkIds) ? prev : bookmarkIds,
    );
  }, [bookmarkIds]);
  const bookmarkMap = useMemo(() => {
    const map = new Map<string, Bookmark>();
    bookmarks.forEach((bookmark) => map.set(bookmark.id, bookmark));
    return map;
  }, [bookmarks]);
  const orderedBookmarks = bookmarkOrder
    .map((id) => bookmarkMap.get(id))
    .filter((bookmark): bookmark is Bookmark => Boolean(bookmark));
  const knownIds = new Set(bookmarkOrder);
  const remainingBookmarks = bookmarks.filter(
    (bookmark) => !knownIds.has(bookmark.id),
  );
  const bookmarksToRender = [...orderedBookmarks, ...remainingBookmarks];

  const handleDragEnd = (event: DragEndEvent) => {
    if (!allowSync) {
      return;
    }
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      return;
    }
    setBookmarkOrder((prev) => {
      const oldIndex = prev.indexOf(activeId);
      const newIndex = prev.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      const orderedBookmarkIds = arrayMove(prev, oldIndex, newIndex);
      onReorderBookmarks(folderId, orderedBookmarkIds);
      return orderedBookmarkIds;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={bookmarksToRender.map((bookmark) => bookmark.id)}
        strategy={rectSortingStrategy}
      >
        <div className="mt-3 flex gap-3 flex-wrap">
          {bookmarksToRender.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              folderId={folderId}
              bookmark={bookmark}
              allowSync={allowSync}
              faviconSrc={faviconMap[bookmark.id] ?? null}
              onDeleteBookmark={onDeleteBookmark}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

type BookmarkCardProps = {
  folderId: string;
  bookmark: Bookmark;
  allowSync: boolean;
  faviconSrc: string | null;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
};

const BookmarkCard = ({
  folderId,
  bookmark,
  allowSync,
  faviconSrc,
  onDeleteBookmark,
}: BookmarkCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    disabled: !allowSync,
  });
  const dragHandleProps = allowSync ? { ...attributes, ...listeners } : {};
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.95 : undefined,
  };
  const fallbackInitial = (() => {
    const source =
      bookmark.title.trim() || bookmark.url.replace(/^https?:\/\//i, "");
    return source ? source.charAt(0).toUpperCase() : "•";
  })();

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="relative group rounded-2xl border border-slate-200 bg-white transition-colors hover:border-indigo-200 focus-within:border-indigo-200 w-90 shrink-0"
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...dragHandleProps}
        className="absolute left-4 top-4 z-10 text-slate-400 hover:text-slate-600 h-6 w-6 flex items-center justify-center cursor-grab disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
        aria-label={`Reorder bookmark ${bookmark.title}`}
        disabled={!allowSync}
      >
        <FontAwesomeIcon icon={faGripVertical} />
      </button>
      <a
        href={bookmark.url}
        target="_self"
        className="block h-full rounded-2xl p-4 pl-10 pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="h-6 w-6 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {faviconSrc ? (
                <img
                  src={faviconSrc}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  {fallbackInitial}
                </span>
              )}
            </span>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 transition group-hover:text-indigo-600 line-clamp-2">
              {bookmark.title}
            </p>
          </div>
          {bookmark.note && (
            <p className="text-sm text-slate-700">{bookmark.note}</p>
          )}
        </div>
      </a>
      <button
        className="absolute right-4 top-4 z-10 rounded-full text-slate-400 hover:bg-rose-50 cursor-pointer hover:text-rose-600 h-6 w-6 flex items-center justify-center"
        type="button"
        onClick={() => onDeleteBookmark(folderId, bookmark.id)}
        disabled={!allowSync}
        aria-label={`Delete bookmark ${bookmark.title}`}
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </article>
  );
};

const arraysMatch = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);
