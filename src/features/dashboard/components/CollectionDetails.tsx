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
import { faFolder, faTrash } from "@fortawesome/free-solid-svg-icons";
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
    if (!editingEnabled || !over || active.id === over.id) {
      return;
    }

    const type = active.data.current?.type;

    if (type === "folder") {
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
    <section className={`${panelClass} min-h-0`}>
      <div className="flex flex-col gap-4 h-full overflow-hidden">
        <div className="flex gap-2 items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {collection.name}
          </h2>
          {editingEnabled && (
            <button
              className={`${subtleButtonClasses} text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300`}
              type="button"
              onClick={() => onDeleteCollection(collection)}
              disabled={!editingEnabled}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
        </div>
        {editingEnabled && (
          <CreateFolderForm
            onCreateFolder={onCreateFolder}
            creatingFolder={creatingFolder}
            disabled={!collection || !editingEnabled}
          />
        )}
        <div className="grow flex flex-col gap-4 overflow-hidden">
          {collection.folders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <p className="flex items-center justify-center gap-2 text-sm">
                <FontAwesomeIcon icon={faFolder} />
                {editingEnabled
                  ? "No folders yet. Add one above to start saving bookmarks."
                  : "No folders yet. Enable edit mode to add folders."}
              </p>
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
                <div className="max-h-full overflow-y-auto p-2 flex flex-wrap justify-start gap-4 items-start">
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
    </section>
  );
});

export default CollectionDetails;
