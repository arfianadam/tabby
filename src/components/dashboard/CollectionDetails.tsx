import { useMemo } from "react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faPlus,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { Collection, Folder } from "../../types";
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
import FolderCard from "./folders/FolderCard";

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
  const { foldersToRender, setFolderOrder } = useFolderOrdering(
    collection.folders,
  );
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
