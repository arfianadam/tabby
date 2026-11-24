import {
  lazy,
  memo,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faCheck,
  faFolder,
  faLayerGroup,
  faMagnifyingGlass,
  faPen,
  faPenToSquare,
  faPlus,
  faSpinner,
  faXmark,
} from "@/utils/uiIcons";
import type { Bookmark, Collection, Folder } from "@/types";
import { hasChromeTabsSupport } from "@/utils/chrome";
import type { WorkspaceEditing } from "../hooks/useWorkspaceEditing";
import type { BookmarkModal } from "../hooks/useBookmarkModalState";
import { useBookmarkFavicons } from "@/hooks/useBookmarkFavicons";
import {
  useFolderOrdering,
  type OrderingSnapshot,
} from "../hooks/useFolderOrdering";
import {
  actionButtonClasses,
  inputClasses,
  panelClass,
  subtleButtonClasses,
} from "./constants";
import SortableFolderCard from "./folders/SortableFolderCard";
import BookmarkCard from "./folders/BookmarkCard";
import FolderCard from "./folders/FolderCard";
import CreateFolderForm from "./CreateFolderForm";

const AddBookmarkModal = lazy(() => import("./AddBookmarkModal"));

type ActiveDragItem =
  | { type: "folder"; folder: Folder }
  | { type: "bookmark"; bookmark: Bookmark; folderId: string };

const collisionDetectionStrategy: CollisionDetection = (args) => {
  const { active, droppableContainers } = args;

  if (active.data.current?.type === "folder") {
    return rectIntersection({
      ...args,
      droppableContainers: droppableContainers.filter(
        (c) => c.data.current?.type === "folder",
      ),
    });
  }

  if (active.data.current?.type === "bookmark") {
    const pointerCollisions = pointerWithin({
      ...args,
      droppableContainers: droppableContainers.filter(
        (c) => c.data.current?.type === "bookmark",
      ),
    });

    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    return rectIntersection({
      ...args,
      droppableContainers: droppableContainers.filter(
        (c) => c.data.current?.type === "folder",
      ),
    });
  }

  return [];
};

type CollectionDetailsProps = {
  collection: Collection;
  collections: Collection[];
  allowSync: boolean;
  editMode: boolean;
  onToggleEditMode: () => void;
  onOpenSearch: () => void;
  editing: WorkspaceEditing;
  bookmarkModal: BookmarkModal;
  onOpenFolderSettings: (folder: Folder) => void;
};

const CollectionDetails = memo(function CollectionDetails({
  collection,
  collections,
  allowSync,
  editMode,
  onToggleEditMode,
  onOpenSearch,
  editing,
  bookmarkModal,
  onOpenFolderSettings,
}: CollectionDetailsProps) {
  const editingEnabled = editing.canEdit;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [activeDrag, setActiveDrag] = useState<ActiveDragItem | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState(false);
  const [collectionNameDraft, setCollectionNameDraft] = useState(
    collection.name,
  );
  const [renamingCollection, setRenamingCollection] = useState(false);

  const createFolderInputRef = useRef<HTMLInputElement>(null);
  const originalFolderRef = useRef<string | null>(null);
  const dragSnapshotRef = useRef<OrderingSnapshot | null>(null);

  useEffect(() => {
    setEditingCollectionName(false);
    setCollectionNameDraft(collection.name);
    setRenamingCollection(false);
  }, [collection.id, collection.name]);

  useEffect(() => {
    if (!editingEnabled && editingCollectionName) {
      setEditingCollectionName(false);
      setCollectionNameDraft(collection.name);
    }
  }, [editingEnabled, editingCollectionName, collection.name]);

  const activeBookmarkFolder =
    collection.folders.find((folder) => folder.id === bookmarkModal.folderId) ??
    null;
  const allBookmarks = useMemo<Bookmark[]>(
    () => collection.folders.flatMap((folder) => folder.bookmarks),
    [collection.folders],
  );
  const faviconMap = useBookmarkFavicons(allBookmarks);
  const {
    foldersToRender,
    folderOrder,
    setFolderOrder,
    moveBookmark,
    takeSnapshot,
    restoreSnapshot,
  } = useFolderOrdering(collection.folders);

  const handleCollectionRenameSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!editingEnabled || renamingCollection || !collectionNameDraft.trim()) {
      return;
    }
    setRenamingCollection(true);
    try {
      const ok = await editing.renameCollection(
        collection,
        collectionNameDraft,
      );
      if (ok) {
        setEditingCollectionName(false);
      }
    } finally {
      setRenamingCollection(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    dragSnapshotRef.current = takeSnapshot();

    if (active.data.current?.type === "bookmark") {
      originalFolderRef.current = active.data.current.folderId;
      setActiveDrag({
        type: "bookmark",
        bookmark: active.data.current.bookmark as Bookmark,
        folderId: active.data.current.folderId as string,
      });
    } else if (active.data.current?.type === "folder") {
      setActiveDrag({
        type: "folder",
        folder: active.data.current.folder as Folder,
      });
    }
  };

  const handleDragCancel = () => {
    originalFolderRef.current = null;
    setActiveDrag(null);
    if (dragSnapshotRef.current) {
      restoreSnapshot(dragSnapshotRef.current);
      dragSnapshotRef.current = null;
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.data.current?.type !== "bookmark") {
      return;
    }

    if (active.id === over.id) {
      return;
    }

    const activeId = String(active.id);
    const sourceFolderId = active.data.current.folderId;
    let targetFolderId: string | undefined;
    let targetIndex = 0;

    if (over.data.current?.type === "bookmark") {
      targetFolderId = over.data.current.folderId;
    } else if (over.data.current?.type === "folder") {
      targetFolderId = over.data.current.folder.id;
    }

    if (!targetFolderId) {
      return;
    }

    const folder = foldersToRender.find((f) => f.id === targetFolderId);
    if (!folder) {
      return;
    }

    if (over.data.current?.type === "bookmark") {
      const overIndex = folder.bookmarks.findIndex(
        (b) => b.id === String(over.id),
      );
      targetIndex = overIndex >= 0 ? overIndex : folder.bookmarks.length;
    } else {
      targetIndex = folder.bookmarks.length;
    }

    moveBookmark(activeId, sourceFolderId, targetFolderId, targetIndex);

    if (sourceFolderId !== targetFolderId) {
      active.data.current.folderId = targetFolderId;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const originalFolder = originalFolderRef.current;
    const preDragSnapshot = dragSnapshotRef.current;
    originalFolderRef.current = null;
    dragSnapshotRef.current = null;
    setActiveDrag(null);

    const { active, over } = event;
    if (!editingEnabled || !over) {
      if (preDragSnapshot) {
        restoreSnapshot(preDragSnapshot);
      }
      return;
    }

    const type = active.data.current?.type;

    if (type === "folder") {
      if (active.id === over.id) return;
      const oldIndex = folderOrder.indexOf(String(active.id));
      const newIndex = folderOrder.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) {
        if (preDragSnapshot) restoreSnapshot(preDragSnapshot);
        return;
      }
      const reordered = arrayMove(folderOrder, oldIndex, newIndex);
      setFolderOrder(reordered);
      void editing.reorderFolders(reordered).then((ok) => {
        if (!ok && preDragSnapshot) {
          restoreSnapshot(preDragSnapshot);
        }
      });
    } else if (type === "bookmark") {
      const bookmarkId = String(active.id);
      const currentFolderId = active.data.current?.folderId;

      if (!currentFolderId || !originalFolder) {
        if (preDragSnapshot) restoreSnapshot(preDragSnapshot);
        return;
      }

      if (originalFolder === currentFolderId) {
        const folder = foldersToRender.find((f) => f.id === currentFolderId);
        if (folder) {
          const reorderedIds = folder.bookmarks.map((b) => b.id);
          void editing
            .reorderBookmarks(currentFolderId, reorderedIds)
            .then((ok) => {
              if (!ok && preDragSnapshot) {
                restoreSnapshot(preDragSnapshot);
              }
            });
        }
      } else {
        const targetFolder = foldersToRender.find(
          (f) => f.id === currentFolderId,
        );
        if (targetFolder) {
          const targetIndex = targetFolder.bookmarks.findIndex(
            (b) => b.id === bookmarkId,
          );
          void editing
            .moveBookmark(
              bookmarkId,
              originalFolder,
              currentFolderId,
              targetIndex >= 0 ? targetIndex : targetFolder.bookmarks.length,
            )
            .then((ok) => {
              if (!ok && preDragSnapshot) {
                restoreSnapshot(preDragSnapshot);
              }
            });
        }
      }
    }
  };

  const folderCount = collection.folders.length;
  const linkCount = allBookmarks.length;
  const modalOpen = Boolean(activeBookmarkFolder) && editingEnabled;

  return (
    <main className={`${panelClass} min-h-0 min-w-0 overflow-hidden`}>
      <div className="flex h-full flex-col overflow-hidden">
        <header className="shrink-0 border-b border-[var(--line)] px-4 py-4 sm:px-7 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                <span>Workspace</span>
                <span className="size-1 rounded-full bg-[var(--accent)]" />
                <span>
                  {editingEnabled ? "Editing enabled" : "Browse mode"}
                </span>
              </div>
              {editingCollectionName ? (
                <form
                  onSubmit={handleCollectionRenameSubmit}
                  className="flex max-w-md items-center gap-2"
                >
                  <input
                    type="text"
                    value={collectionNameDraft}
                    onChange={(event) =>
                      setCollectionNameDraft(event.target.value)
                    }
                    aria-label="Collection name"
                    autoFocus
                    disabled={renamingCollection}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setEditingCollectionName(false);
                        setCollectionNameDraft(collection.name);
                      }
                    }}
                    className={`${inputClasses} py-1.5 text-lg font-bold`}
                  />
                  <button
                    type="submit"
                    disabled={renamingCollection || !collectionNameDraft.trim()}
                    aria-label="Save collection name"
                    className={`${actionButtonClasses} size-9 shrink-0 px-0! py-0!`}
                  >
                    <FontAwesomeIcon
                      icon={renamingCollection ? faSpinner : faCheck}
                      spin={renamingCollection}
                    />
                  </button>
                  <button
                    type="button"
                    disabled={renamingCollection}
                    aria-label="Cancel collection rename"
                    onClick={() => {
                      setEditingCollectionName(false);
                      setCollectionNameDraft(collection.name);
                    }}
                    className={`${subtleButtonClasses} size-9 shrink-0 px-0! py-0!`}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </form>
              ) : (
                <div className="flex min-w-0 items-center gap-2">
                  <h2
                    className={`truncate text-2xl font-bold tracking-[-0.04em] text-[var(--ink)] sm:text-3xl ${
                      editingEnabled ? "cursor-text" : ""
                    }`}
                    onDoubleClick={() => {
                      if (editingEnabled) {
                        setEditingCollectionName(true);
                      }
                    }}
                    title={
                      editingEnabled
                        ? `${collection.name} — double-click to rename`
                        : collection.name
                    }
                  >
                    {collection.name}
                  </h2>
                  {editingEnabled && (
                    <button
                      type="button"
                      onClick={() => setEditingCollectionName(true)}
                      aria-label={`Rename collection ${collection.name}`}
                      title="Rename collection"
                      className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      <FontAwesomeIcon icon={faPen} className="text-xs" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenSearch}
                aria-label="Search links and folders"
                title={
                  hasChromeTabsSupport
                    ? "Search links (/ or Alt+K, or type 't' in Chrome's address bar)"
                    : "Search links (/ or Alt+K)"
                }
                className="group inline-flex w-44 cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1.5 text-left text-xs text-[var(--muted)] transition hover:border-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:w-56 md:w-64"
              >
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="shrink-0 text-[var(--muted)] transition group-hover:text-[var(--accent)]"
                />
                <span className="min-w-0 flex-1 truncate font-medium">
                  Search links…
                </span>
                <kbd className="hidden shrink-0 rounded border border-[var(--line)] bg-[var(--surface-raised)] px-1.5 py-0.5 font-sans text-[10px] font-semibold text-[var(--muted)] sm:inline">
                  /
                </kbd>
              </button>

              <div className="hidden items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] xl:flex">
                <FontAwesomeIcon icon={faLayerGroup} />
                {folderCount} {folderCount === 1 ? "folder" : "folders"}
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] xl:flex">
                <FontAwesomeIcon icon={faBookmark} />
                {linkCount} {linkCount === 1 ? "link" : "links"}
              </div>

              <button
                type="button"
                onClick={onToggleEditMode}
                disabled={!allowSync}
                aria-pressed={editMode}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55 ${
                  editMode
                    ? "bg-[var(--accent-fill)] text-white hover:bg-[var(--accent-fill-hover)]"
                    : "border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                <FontAwesomeIcon icon={faPenToSquare} />
                <span>{editMode ? "Done" : "Edit"}</span>
              </button>
            </div>
          </div>
          {editingEnabled && (
            <div className="mt-4">
              <CreateFolderForm
                inputRef={createFolderInputRef}
                onCreateFolder={editing.createFolder}
                creatingFolder={editing.creatingFolder}
                disabled={!collection || !editingEnabled}
              />
            </div>
          )}
        </header>

        <div className="grow overflow-hidden p-2 sm:p-3">
          {collection.folders.length === 0 ? (
            <div className="flex h-full min-h-56 items-center justify-center rounded-[1.35rem] border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-8 text-center text-[var(--muted)]">
              <div className="max-w-xs">
                <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-raised)] text-[var(--accent)] shadow-sm">
                  <FontAwesomeIcon icon={faFolder} />
                </span>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  This collection is ready for its first folder
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  {editingEnabled
                    ? "Create a folder above to start organizing your links."
                    : "Turn on edit mode to add folders and capture bookmarks."}
                </p>
                <div className="mt-4 flex justify-center">
                  {editingEnabled ? (
                    <button
                      type="button"
                      onClick={() => createFolderInputRef.current?.focus()}
                      className={`${actionButtonClasses} gap-2 py-2 text-xs`}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      Add first folder
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!allowSync}
                      onClick={onToggleEditMode}
                      className={`${actionButtonClasses} gap-2 py-2 text-xs`}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                      Enable edit mode
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={collisionDetectionStrategy}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={folderOrder}
                strategy={rectSortingStrategy}
              >
                <div className="folder-grid soft-scrollbar h-full max-h-full overflow-y-auto p-3 sm:p-4">
                  {foldersToRender.map((folder, index) => (
                    <SortableFolderCard
                      key={folder.id}
                      folder={folder}
                      index={index}
                      bookmarks={folder.bookmarks}
                      allowSync={editingEnabled}
                      editingEnabled={editingEnabled}
                      canToggleEdit={allowSync}
                      onEnableEditMode={onToggleEditMode}
                      onOpenBookmarkModal={bookmarkModal.open}
                      onDeleteFolder={editing.deleteFolder}
                      onRenameFolder={editing.renameFolder}
                      onDeleteBookmark={editing.deleteBookmark}
                      faviconMap={faviconMap}
                      onEditBookmark={bookmarkModal.openEdit}
                      onOpenFolderSettings={onOpenFolderSettings}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeDrag?.type === "bookmark" ? (
                  <div className="w-72 max-w-[85vw]">
                    <BookmarkCard
                      folderId={activeDrag.folderId}
                      bookmark={activeDrag.bookmark}
                      allowSync={false}
                      faviconSrc={faviconMap[activeDrag.bookmark.id] ?? null}
                      isOverlay
                    />
                  </div>
                ) : activeDrag?.type === "folder" ? (
                  <div className="w-80 max-w-[85vw]">
                    <FolderCard
                      folder={activeDrag.folder}
                      bookmarks={activeDrag.folder.bookmarks}
                      allowSync={false}
                      canToggleEdit={false}
                      onEnableEditMode={() => {}}
                      onOpenBookmarkModal={() => {}}
                      onDeleteFolder={() => {}}
                      onRenameFolder={async () => false}
                      onDeleteBookmark={() => {}}
                      faviconMap={faviconMap}
                      onEditBookmark={() => {}}
                      onOpenFolderSettings={() => {}}
                      isOverlay
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      {modalOpen && (
        <Suspense fallback={null}>
          <AddBookmarkModal
            folder={activeBookmarkFolder}
            collections={collections}
            open={modalOpen}
            allowSync={editingEnabled}
            isEditing={bookmarkModal.isEditing}
            bookmarkForm={bookmarkModal.form}
            destination={bookmarkModal.destination}
            onDestinationChange={bookmarkModal.setDestination}
            onBookmarkFormChange={bookmarkModal.changeField}
            onAddBookmark={bookmarkModal.submit}
            onAddSelectedTabs={bookmarkModal.addTabs}
            savingBookmark={editing.savingBookmark}
            hasChromeTabsSupport={hasChromeTabsSupport}
            onClose={bookmarkModal.close}
          />
        </Suspense>
      )}
    </main>
  );
});

export default CollectionDetails;
