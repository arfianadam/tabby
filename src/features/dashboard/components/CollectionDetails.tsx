import { useMemo, memo, useRef } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  DragOverlay,
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
} from "@dnd-kit/sortable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faFolder,
  faLayerGroup,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { Bookmark, Collection, Folder } from "@/types";
import type { BookmarkFormState } from "./types";
import type { BrowserTab } from "@/utils/chrome";
import { useBookmarkFavicons } from "@/hooks/useBookmarkFavicons";
import { useFolderOrdering } from "../hooks/useFolderOrdering";
import { panelClass, subtleButtonClasses } from "./constants";
import AddBookmarkModal from "./AddBookmarkModal";
import SortableFolderCard from "./folders/SortableFolderCard";
import CreateFolderForm from "./CreateFolderForm";

const collisionDetectionStrategy: CollisionDetection = (args) => {
  const { active, droppableContainers } = args;

  // For folders, use rectIntersection among folders only
  if (active.data.current?.type === "folder") {
    return rectIntersection({
      ...args,
      droppableContainers: droppableContainers.filter(
        (c) => c.data.current?.type === "folder",
      ),
    });
  }

  // For bookmarks, prioritize pointer detection for precise positioning
  if (active.data.current?.type === "bookmark") {
    // Priority 1: Pointer over any bookmark
    const pointerCollisions = pointerWithin({
      ...args,
      droppableContainers: droppableContainers.filter(
        (c) => c.data.current?.type === "bookmark",
      ),
    });

    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // Priority 2: Fall back to folder detection for cross-folder moves
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
  allowSync: boolean;
  editMode: boolean;
  onDeleteCollection: (collection: Collection) => void;
  creatingFolder: boolean;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (folder: Folder) => void;
  onRenameFolder: (folder: Folder, name: string) => Promise<boolean>;
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
  onMoveBookmark: (
    bookmarkId: string,
    sourceFolderId: string,
    targetFolderId: string,
    targetIndex: number,
  ) => void;
  isEditing: boolean;
  onEditBookmark: (folderId: string, bookmark: Bookmark) => void;
  onOpenFolderSettings: (folder: Folder) => void;
};

const CollectionDetails = memo(function CollectionDetails(
  props: CollectionDetailsProps,
) {
  const {
    collection,
    allowSync,
    editMode,
    onDeleteCollection,
    creatingFolder,
    onCreateFolder,
    onDeleteFolder,
    onRenameFolder,
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
    onMoveBookmark,
    isEditing,
    onEditBookmark,
    onOpenFolderSettings,
  } = props;

  const editingEnabled = allowSync && editMode;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const activeBookmarkFolder =
    collection.folders.find((folder) => folder.id === bookmarkModalFolderId) ??
    null;
  const allBookmarks = useMemo<Bookmark[]>(
    () => collection.folders.flatMap((folder) => folder.bookmarks),
    [collection.folders],
  );
  const faviconMap = useBookmarkFavicons(allBookmarks);
  const { foldersToRender, folderOrder, setFolderOrder, moveBookmark } =
    useFolderOrdering(collection.folders);

  // Track original folder for cross-folder moves
  const originalFolderRef = useRef<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "bookmark") {
      originalFolderRef.current = active.data.current.folderId;
    }
  };

  // Handle drag over for bookmark moves (both cross-folder and same-folder)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.data.current?.type !== "bookmark") {
      return;
    }

    // Don't process if dropping on self
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

    // Compute target index from current folder state, not stale rendered index
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

    // Update local state during drag to keep DOM order in sync with visual order
    // This prevents jumps when transforms reset on drag end
    moveBookmark(activeId, sourceFolderId, targetFolderId, targetIndex);

    // Update the active data's folderId for cross-folder moves
    if (sourceFolderId !== targetFolderId) {
      active.data.current.folderId = targetFolderId;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const originalFolder = originalFolderRef.current;
    originalFolderRef.current = null;

    const { active, over } = event;
    if (!editingEnabled || !over) {
      return;
    }

    const type = active.data.current?.type;

    if (type === "folder") {
      if (active.id === over.id) return;
      const oldIndex = folderOrder.indexOf(String(active.id));
      const newIndex = folderOrder.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
      const reordered = arrayMove(folderOrder, oldIndex, newIndex);
      setFolderOrder(reordered);
      onReorderFolders(reordered);
    } else if (type === "bookmark") {
      const bookmarkId = String(active.id);
      // Use the current folderId (may have been updated during drag)
      const currentFolderId = active.data.current?.folderId;

      if (!currentFolderId || !originalFolder) {
        return;
      }

      // Local state was already updated during handleDragOver
      // Now sync with server based on final position

      if (originalFolder === currentFolderId) {
        // Same folder reorder - get final order from local state
        const folder = foldersToRender.find((f) => f.id === currentFolderId);
        if (folder) {
          const reorderedIds = folder.bookmarks.map((b) => b.id);
          onReorderBookmarks(currentFolderId, reorderedIds);
        }
      } else {
        // Cross-folder move - get target index from local state
        const targetFolder = foldersToRender.find(
          (f) => f.id === currentFolderId,
        );
        if (targetFolder) {
          const targetIndex = targetFolder.bookmarks.findIndex(
            (b) => b.id === bookmarkId,
          );
          onMoveBookmark(
            bookmarkId,
            originalFolder,
            currentFolderId,
            targetIndex >= 0 ? targetIndex : targetFolder.bookmarks.length,
          );
        }
      }
    }
  };

  return (
    <main className={`${panelClass} min-h-0 min-w-0 overflow-hidden`}>
      <div className="flex h-full flex-col overflow-hidden">
        <header className="shrink-0 border-b border-[var(--line)] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                <span>Workspace</span>
                <span className="size-1 rounded-full bg-[var(--accent)]" />
                <span>
                  {editingEnabled ? "Editing enabled" : "Browse mode"}
                </span>
              </div>
              <h2 className="truncate text-2xl font-bold tracking-[-0.04em] text-[var(--ink)] sm:text-3xl">
                {collection.name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] sm:flex">
                <FontAwesomeIcon icon={faLayerGroup} />
                {collection.folders.length} folders
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] sm:flex">
                <FontAwesomeIcon icon={faBookmark} />
                {allBookmarks.length} links
              </div>
              {editingEnabled && (
                <button
                  className={`${subtleButtonClasses} size-9 border-transparent bg-transparent p-0 text-rose-500 hover:border-rose-500/20 hover:bg-rose-500/8 hover:text-rose-600`}
                  type="button"
                  onClick={() => onDeleteCollection(collection)}
                  disabled={!editingEnabled}
                  aria-label={`Delete ${collection.name}`}
                  title="Delete collection"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
            </div>
          </div>
          {editingEnabled && (
            <div className="mt-5">
              <CreateFolderForm
                onCreateFolder={onCreateFolder}
                creatingFolder={creatingFolder}
                disabled={!collection || !editingEnabled}
              />
            </div>
          )}
        </header>
        <div className="grow overflow-hidden p-2 sm:p-3">
          {collection.folders.length === 0 ? (
            <div className="flex h-full min-h-56 items-center justify-center rounded-[1.35rem] border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-8 text-center text-[var(--muted)]">
              <div>
                <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-raised)] text-[var(--accent)] shadow-sm">
                  <FontAwesomeIcon icon={faFolder} />
                </span>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  This collection is ready for its first folder
                </p>
                <p className="mt-1 text-xs">
                  {editingEnabled
                    ? "Add one above to start organising your links."
                    : "Enable edit mode to add folders and bookmarks."}
                </p>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={collisionDetectionStrategy}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
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
                      onOpenBookmarkModal={onOpenBookmarkModal}
                      onDeleteFolder={onDeleteFolder}
                      onRenameFolder={onRenameFolder}
                      onDeleteBookmark={onDeleteBookmark}
                      faviconMap={faviconMap}
                      onEditBookmark={onEditBookmark}
                      onOpenFolderSettings={onOpenFolderSettings}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>{null}</DragOverlay>
            </DndContext>
          )}
        </div>
      </div>
      <AddBookmarkModal
        folder={activeBookmarkFolder}
        open={Boolean(activeBookmarkFolder) && editingEnabled}
        allowSync={editingEnabled}
        isEditing={isEditing}
        bookmarkForm={bookmarkForm}
        onBookmarkFormChange={onBookmarkFormChange}
        onAddBookmark={onAddBookmark}
        onAddSelectedTabs={onAddSelectedTabs}
        savingBookmark={savingBookmark}
        hasChromeTabsSupport={hasChromeTabsSupport}
        onClose={onCloseBookmarkModal}
      />
    </main>
  );
});

export default CollectionDetails;
