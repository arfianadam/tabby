import { useMemo } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
  const { foldersToRender, folderOrder, setFolderOrder } = useFolderOrdering(
    collection.folders,
  );

  const handleFolderDragEnd = ({ active, over }: DragEndEvent) => {
    if (!editingEnabled || !over) {
      return;
    }
    if (active.id === over.id) {
      return;
    }
    const oldIndex = folderOrder.indexOf(String(active.id));
    const newIndex = folderOrder.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    const reordered = arrayMove(folderOrder, oldIndex, newIndex);
    setFolderOrder(reordered);
    onReorderFolders(reordered);
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
              collisionDetection={closestCenter}
              onDragEnd={handleFolderDragEnd}
            >
              <SortableContext
                items={folderOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="grow overflow-y-auto flex flex-col gap-4 overflow-hidden">
                  {foldersToRender.map((folder) => (
                    <SortableFolderCard
                      key={folder.id}
                      folder={folder}
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
              </SortableContext>
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
