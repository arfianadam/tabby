import { useMemo } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
} from "@dnd-kit/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faPlus,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { Bookmark, Collection, Folder } from "../../types";
import type { BookmarkFormState } from "./types";
import type { BrowserTab } from "../../utils/chrome";
import { useBookmarkFavicons } from "../../hooks/useBookmarkFavicons";
import { useFolderOrdering } from "../../hooks/dashboard/useFolderOrdering";
import {
  actionButtonClasses,
  inputClasses,
  panelClass,
  subtleButtonClasses,
} from "./constants";
import AddBookmarkModal from "./AddBookmarkModal";
import SortableFolderCard from "./folders/SortableFolderCard";

const collisionDetectionStrategy: CollisionDetection = (args) => {
  const { active, droppableContainers } = args;

  // 1. For folders, stick to closestCenter among folders
  if (active.data.current?.type === "folder") {
    return closestCenter({
      ...args,
      droppableContainers: droppableContainers.filter(
        (c) => c.data.current?.type === "folder",
      ),
    });
  }

  // 2. For bookmarks
  if (active.data.current?.type === "bookmark") {
    // Priority 1: Exact pointer match on any bookmark
    const pointerCollisions = pointerWithin({
      ...args,
      droppableContainers: droppableContainers.filter(
        (c) => c.data.current?.type === "bookmark",
      ),
    });

    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // Priority 2: Check if we are over a folder
    const folderCollisions = rectIntersection({
      ...args,
      droppableContainers: droppableContainers.filter(
        (c) => c.data.current?.type === "folder",
      ),
    });

    if (folderCollisions.length > 0) {
      const topFolder = folderCollisions[0];
      const folderId = topFolder.data?.current?.folder?.id;

      if (folderId) {
        const folderBookmarks = droppableContainers.filter(
          (c) =>
            c.data.current?.type === "bookmark" &&
            c.data.current?.folderId === folderId,
        );

        // Priority 3: Magnetic pull to nearest bookmark in this folder
        const magneticBookmarkCollisions = closestCenter({
          ...args,
          droppableContainers: folderBookmarks,
        });

        if (magneticBookmarkCollisions.length > 0) {
          return magneticBookmarkCollisions;
        }
      }

      // Priority 4: Empty folder (or far from any bookmark in it)
      return folderCollisions;
    }

    // 3. Fallback: Not over any folder, check closest bookmarks globally
    return closestCenter({
      ...args,
      droppableContainers: droppableContainers.filter(
        (c) => c.data.current?.type === "bookmark",
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
  newFolder: string;
  onNewFolderChange: (value: string) => void;
  creatingFolder: boolean;
  onCreateFolder: (event: React.FormEvent<HTMLFormElement>) => void;
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
};

const CollectionDetails = (props: CollectionDetailsProps) => {
  const {
    collection,
    allowSync,
    editMode,
    onDeleteCollection,
    newFolder,
    onNewFolderChange,
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
  const {
    foldersToRender,
    folderOrder,
    setFolderOrder,
    moveBookmark,
  } = useFolderOrdering(collection.folders);

  const handleDragEnd = (event: DragEndEvent) => {
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
      const reordered = [...folderOrder];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      setFolderOrder(reordered);
      onReorderFolders(reordered);
    } else if (type === "bookmark") {
      const bookmarkId = String(active.id);
      const sourceFolderId = active.data.current?.folderId;
      let targetFolderId: string | undefined;
      let targetIndex = 0;

      if (over.data.current?.type === "folder") {
        targetFolderId = over.data.current.folder.id;
        const folder = foldersToRender.find((f) => f.id === targetFolderId);
        if (folder) {
          targetIndex = folder.bookmarks.length;
        }
      } else if (over.data.current?.type === "bookmark") {
        targetFolderId = over.data.current.folderId;
        targetIndex = over.data.current.index;
      }

      if (!sourceFolderId || !targetFolderId) {
        return;
      }

      // Move locally
      moveBookmark(bookmarkId, sourceFolderId, targetFolderId, targetIndex);

      // Sync remotely
      if (sourceFolderId === targetFolderId) {
        const folder = foldersToRender.find((f) => f.id === sourceFolderId);
        if (folder) {
          const list = folder.bookmarks.map((b) => b.id);
          const oldIdx = list.indexOf(bookmarkId);
          if (oldIdx > -1) {
            list.splice(oldIdx, 1);
            let insertionIndex = targetIndex;
            insertionIndex = Math.max(0, Math.min(insertionIndex, list.length));
            list.splice(insertionIndex, 0, bookmarkId);
            onReorderBookmarks(sourceFolderId, list);
          }
        }
      } else {
        onMoveBookmark(bookmarkId, sourceFolderId, targetFolderId, targetIndex);
      }
    }
  };

  return (
    <section className={`${panelClass} min-h-0`}>
      <div className="flex flex-col gap-4 h-full overflow-hidden">
        <div className="flex gap-2 items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {collection.name}
          </h2>
          {editingEnabled && (
            <button
              className={`${subtleButtonClasses} text-rose-600 hover:text-rose-700`}
              type="button"
              onClick={() => onDeleteCollection(collection)}
              disabled={!editingEnabled}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
        </div>
        {editingEnabled && (
          <form className="space-y-1" onSubmit={onCreateFolder}>
            <label className="flex flex-col gap-1 text-sm font-medium uppercase text-slate-700">
              New folder
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Launch inspiration"
                  value={newFolder}
                  disabled={!collection || !editingEnabled}
                  onChange={(event) => onNewFolderChange(event.target.value)}
                  className={`${inputClasses} ${
                    !collection || !editingEnabled
                      ? "cursor-not-allowed opacity-60"
                      : ""
                  }`}
                />
                <button
                  type="submit"
                  disabled={creatingFolder || !collection || !editingEnabled}
                  className={`${actionButtonClasses} gap-2`}
                >
                  <FontAwesomeIcon
                    icon={creatingFolder ? faSpinner : faPlus}
                    spin={creatingFolder}
                  />
                  {creatingFolder ? "Adding…" : "Add"}
                </button>
              </div>
            </label>
          </form>
        )}
        <div className="grow flex flex-col gap-4 overflow-hidden">
          {collection.folders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
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
              onDragEnd={handleDragEnd}
            >
              <div className="grow overflow-y-auto flex flex-col gap-4 p-2">
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
                  />
                ))}
              </div>
            </DndContext>
          )}
        </div>
      </div>
      <AddBookmarkModal
        folder={activeBookmarkFolder}
        open={Boolean(activeBookmarkFolder) && editingEnabled}
        allowSync={editingEnabled}
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
