import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DroppableContainer,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
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
  faFolderOpen,
  faBookmark,
  faGripVertical,
  faPlus,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { Bookmark, Collection, Folder } from "../../types";
import type { BookmarkFormState } from "./types";
import type { BrowserTab } from "../../utils/chrome";
import { useBookmarkFavicons } from "../../hooks/useBookmarkFavicons";
import { useFolderOrdering } from "../../hooks/dashboard/useFolderOrdering";
import { arraysMatch } from "../../utils/arrays";
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

type BookmarkDragData = {
  type: "bookmark";
  folderId: string;
  bookmarkId: string;
  bookmark?: Bookmark;
};

type BookmarkContainerData = {
  type: "bookmark-container";
  folderId: string;
};

type CrossFolderUpdate = {
  bookmarkId: string;
  sourceFolderId: string;
  targetFolderId: string;
  targetIndex: number;
};

const isBookmarkDragData = (data: unknown): data is BookmarkDragData =>
  Boolean(data) && (data as BookmarkDragData).type === "bookmark";

const isBookmarkContainerData = (
  data: unknown,
): data is BookmarkContainerData =>
  Boolean(data) &&
  (data as BookmarkContainerData).type === "bookmark-container";

const CollectionDetails = ({
  collection,
  allowSync,
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
}: CollectionDetailsProps) => {
  const activeBookmarkFolder =
    collection.folders.find((folder) => folder.id === bookmarkModalFolderId) ??
    null;
  const allBookmarks = useMemo(
    () => collection.folders.flatMap((folder) => folder.bookmarks),
    [collection.folders],
  );
  const bookmarkById = useMemo(() => {
    const map = new Map<string, Bookmark>();
    allBookmarks.forEach((bookmark) => map.set(bookmark.id, bookmark));
    return map;
  }, [allBookmarks]);
  const folderBookmarkDefaults = useMemo(
    () =>
      new Map(
        collection.folders.map((folder) => [
          folder.id,
          folder.bookmarks.map((bookmark) => bookmark.id),
        ]),
      ),
    [collection.folders],
  );
  const faviconMap = useBookmarkFavicons(allBookmarks);
  const { foldersToRender, setFolderOrder } = useFolderOrdering(
    collection.folders,
  );
  const dragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );
  const filterBookmarkDroppables = useCallback(
    (containers: DroppableContainer[]) =>
      containers.filter((container) => {
        const data = container.data?.current;
        if (!data) {
          return false;
        }
        return (
          isBookmarkDragData(data) ||
          data.type === "bookmark" ||
          isBookmarkContainerData(data)
        );
      }),
    [],
  );
  const collisionDetection = useCallback<CollisionDetection>(
    (args) => {
      if (activeDragTypeRef.current === "bookmark") {
        const filteredContainers = filterBookmarkDroppables(
          args.droppableContainers,
        );
        const collisionArgs =
          filteredContainers.length > 0
            ? { ...args, droppableContainers: filteredContainers }
            : args;
        const pointerCollisions = pointerWithin(collisionArgs);
        if (pointerCollisions.length > 0) {
          return pointerCollisions;
        }
        const rectangleCollisions = rectIntersection(collisionArgs);
        if (rectangleCollisions.length > 0) {
          return rectangleCollisions;
        }
        return closestCenter(collisionArgs);
      }
      if (activeDragTypeRef.current === "folder") {
        const folderContainers = args.droppableContainers.filter((container) =>
          container.data?.current?.type
            ? container.data.current.type === "folder"
            : false,
        );
        const collisionArgs =
          folderContainers.length > 0
            ? { ...args, droppableContainers: folderContainers }
            : args;
        const pointerCollisions = pointerWithin(collisionArgs);
        if (pointerCollisions.length > 0) {
          return pointerCollisions;
        }
        const rectangleCollisions = rectIntersection(collisionArgs);
        if (rectangleCollisions.length > 0) {
          return rectangleCollisions;
        }
        return closestCenter(collisionArgs);
      }
      return closestCenter(args);
    },
    [filterBookmarkDroppables],
  );
  const [bookmarkOrders, setBookmarkOrders] = useState<Map<string, string[]>>(
    () =>
      new Map(
        collection.folders.map((folder) => [
          folder.id,
          folder.bookmarks.map((bookmark) => bookmark.id),
        ]),
      ),
  );
  const bookmarkOrdersBeforeDragRef = useRef<Map<string, string[]> | null>(
    null,
  );
  const bookmarkDragOriginRef = useRef<{
    bookmarkId: string;
    folderId: string;
  } | null>(null);
  const activeDragTypeRef = useRef<"bookmark" | "folder" | null>(null);
  const crossFolderUpdatePendingRef = useRef<CrossFolderUpdate | null>(null);
  const crossFolderUpdateFrameRef = useRef<number | null>(null);
  const [activeBookmarkId, setActiveBookmarkId] = useState<string | null>(null);
  const [activeBookmarkData, setActiveBookmarkData] = useState<Bookmark | null>(
    null,
  );
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const activeBookmarkFavicon = activeBookmarkId
    ? (faviconMap[activeBookmarkId] ?? null)
    : null;

  useEffect(() => {
    setBookmarkOrders((prev) => {
      let changed = false;
      const next = new Map(prev);
      const seen = new Set<string>();
      collection.folders.forEach((folder) => {
        const ids = folder.bookmarks.map((bookmark) => bookmark.id);
        seen.add(folder.id);
        const current = next.get(folder.id);
        if (!current || !arraysMatch(current, ids)) {
          next.set(folder.id, ids);
          changed = true;
        }
      });
      for (const key of Array.from(next.keys())) {
        if (!seen.has(key)) {
          next.delete(key);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [collection.folders]);

  useEffect(() => {
    return () => {
      cancelScheduledCrossFolderUpdate();
    };
  }, []);

  const getBookmarkOrder = (
    orders: Map<string, string[]>,
    folderId: string,
  ): string[] =>
    orders.get(folderId) ?? folderBookmarkDefaults.get(folderId) ?? [];

  const activeFolder = useMemo(
    () =>
      activeFolderId
        ? (collection.folders.find((folder) => folder.id === activeFolderId) ??
          null)
        : null,
    [activeFolderId, collection.folders],
  );
  const activeFolderBookmarkCount = activeFolder
    ? getBookmarkOrder(bookmarkOrders, activeFolder.id).length
    : 0;

  const findFolderIdForBookmark = (
    orders: Map<string, string[]>,
    bookmarkId: string,
  ): string | null => {
    for (const [folderId, ids] of orders.entries()) {
      if (ids.includes(bookmarkId)) {
        return folderId;
      }
    }
    return null;
  };

  const clampIndex = (value: number, length: number) =>
    Math.max(0, Math.min(value, length));

  const getBookmarksForFolder = (folder: Folder): Bookmark[] => {
    const order = getBookmarkOrder(bookmarkOrders, folder.id);
    return order
      .map((id) => bookmarkById.get(id))
      .filter((bookmark): bookmark is Bookmark => Boolean(bookmark));
  };

  const clearActiveFolderOverlay = () => {
    setActiveFolderId(null);
  };

  const cancelScheduledCrossFolderUpdate = () => {
    if (crossFolderUpdateFrameRef.current !== null) {
      cancelAnimationFrame(crossFolderUpdateFrameRef.current);
      crossFolderUpdateFrameRef.current = null;
    }
    crossFolderUpdatePendingRef.current = null;
  };

  const applyCrossFolderUpdate = (update: CrossFolderUpdate) => {
    setBookmarkOrders((prev) => {
      const next = new Map(prev);
      const currentSourceOrder = getBookmarkOrder(next, update.sourceFolderId);
      const currentTargetOrder = getBookmarkOrder(next, update.targetFolderId);
      const sourceOrder = currentSourceOrder.filter(
        (id) => id !== update.bookmarkId,
      );
      const targetOrder = currentTargetOrder.filter(
        (id) => id !== update.bookmarkId,
      );
      const insertionIndex = clampIndex(update.targetIndex, targetOrder.length);
      const updatedTarget = [...targetOrder];
      updatedTarget.splice(insertionIndex, 0, update.bookmarkId);
      if (
        arraysMatch(sourceOrder, currentSourceOrder) &&
        arraysMatch(updatedTarget, currentTargetOrder)
      ) {
        return prev;
      }
      next.set(update.sourceFolderId, sourceOrder);
      next.set(update.targetFolderId, updatedTarget);
      return next;
    });
  };

  const flushPendingCrossFolderUpdate = () => {
    if (crossFolderUpdateFrameRef.current !== null) {
      cancelAnimationFrame(crossFolderUpdateFrameRef.current);
      crossFolderUpdateFrameRef.current = null;
    }
    if (crossFolderUpdatePendingRef.current) {
      const pending = crossFolderUpdatePendingRef.current;
      crossFolderUpdatePendingRef.current = null;
      applyCrossFolderUpdate(pending);
    }
  };

  const scheduleCrossFolderUpdate = (update: CrossFolderUpdate) => {
    const pending = crossFolderUpdatePendingRef.current;
    if (
      pending &&
      pending.bookmarkId === update.bookmarkId &&
      pending.sourceFolderId === update.sourceFolderId &&
      pending.targetFolderId === update.targetFolderId &&
      pending.targetIndex === update.targetIndex
    ) {
      return;
    }
    crossFolderUpdatePendingRef.current = update;
    if (crossFolderUpdateFrameRef.current !== null) {
      return;
    }
    crossFolderUpdateFrameRef.current = requestAnimationFrame(() => {
      crossFolderUpdateFrameRef.current = null;
      const next = crossFolderUpdatePendingRef.current;
      crossFolderUpdatePendingRef.current = null;
      if (!next) {
        return;
      }
      applyCrossFolderUpdate(next);
    });
  };

  const resetBookmarkDragState = (revert = false) => {
    if (revert && bookmarkOrdersBeforeDragRef.current) {
      setBookmarkOrders(new Map(bookmarkOrdersBeforeDragRef.current));
    }
    cancelScheduledCrossFolderUpdate();
    bookmarkOrdersBeforeDragRef.current = null;
    bookmarkDragOriginRef.current = null;
    clearActiveFolderOverlay();
    activeDragTypeRef.current = null;
    setActiveBookmarkId(null);
    setActiveBookmarkData(null);
  };

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

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (!isBookmarkDragData(data)) {
      if (data?.type === "folder") {
        activeDragTypeRef.current = "folder";
        setActiveFolderId(data.folderId);
      } else {
        activeDragTypeRef.current = null;
      }
      return;
    }
    activeDragTypeRef.current = "bookmark";
    clearActiveFolderOverlay();
    bookmarkOrdersBeforeDragRef.current = new Map(bookmarkOrders);
    bookmarkDragOriginRef.current = {
      bookmarkId: data.bookmarkId,
      folderId: data.folderId,
    };
    cancelScheduledCrossFolderUpdate();
    setActiveBookmarkId(data.bookmarkId);
    setActiveBookmarkData(
      data.bookmark ?? bookmarkById.get(data.bookmarkId) ?? null,
    );
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!allowSync) {
      return;
    }
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeData = active.data.current;
    if (!isBookmarkDragData(activeData)) {
      return;
    }
    const overData = over.data.current;
    if (!isBookmarkDragData(overData) && !isBookmarkContainerData(overData)) {
      return;
    }
    const targetFolderId = overData.folderId;
    const currentFolderId =
      findFolderIdForBookmark(bookmarkOrders, activeData.bookmarkId) ??
      bookmarkDragOriginRef.current?.folderId ??
      activeData.folderId;
    if (!currentFolderId) {
      return;
    }
    const targetOrder = getBookmarkOrder(bookmarkOrders, targetFolderId);
    const overBookmarkId = isBookmarkDragData(overData)
      ? overData.bookmarkId
      : null;
    const targetIndex =
      overBookmarkId && targetOrder.includes(overBookmarkId)
        ? targetOrder.indexOf(overBookmarkId)
        : targetOrder.length;
    const boundedIndex = clampIndex(targetIndex, targetOrder.length);

    if (currentFolderId !== targetFolderId) {
      scheduleCrossFolderUpdate({
        bookmarkId: activeData.bookmarkId,
        sourceFolderId: currentFolderId,
        targetFolderId,
        targetIndex: boundedIndex,
      });
      return;
    }

    cancelScheduledCrossFolderUpdate();
    setBookmarkOrders((prev) => {
      const currentOrder = getBookmarkOrder(prev, currentFolderId);
      const oldIndex = currentOrder.indexOf(activeData.bookmarkId);
      if (oldIndex === -1 || oldIndex === boundedIndex) {
        return prev;
      }
      const reordered = arrayMove(currentOrder, oldIndex, boundedIndex);
      if (arraysMatch(currentOrder, reordered)) {
        return prev;
      }
      const next = new Map(prev);
      next.set(currentFolderId, reordered);
      return next;
    });
  };

  const commitBookmarkDrop = () => {
    const origin = bookmarkDragOriginRef.current;
    if (!origin) {
      resetBookmarkDragState();
      return;
    }
    const bookmarkId = origin.bookmarkId;
    flushPendingCrossFolderUpdate();
    const resolvedFolderId =
      findFolderIdForBookmark(bookmarkOrders, bookmarkId) ?? origin.folderId;
    if (resolvedFolderId !== origin.folderId) {
      const destinationOrder = getBookmarkOrder(
        bookmarkOrders,
        resolvedFolderId,
      );
      const destinationIndex = destinationOrder.indexOf(bookmarkId);
      if (destinationIndex === -1) {
        resetBookmarkDragState(true);
        return;
      }
      onMoveBookmark(
        bookmarkId,
        origin.folderId,
        resolvedFolderId,
        destinationIndex,
      );
      resetBookmarkDragState();
      return;
    }
    const destinationOrder = getBookmarkOrder(bookmarkOrders, resolvedFolderId);
    const destinationIndex = destinationOrder.indexOf(bookmarkId);
    if (destinationIndex === -1) {
      resetBookmarkDragState(true);
      return;
    }
    const previousOrder =
      bookmarkOrdersBeforeDragRef.current?.get(resolvedFolderId) ??
      folderBookmarkDefaults.get(resolvedFolderId) ??
      destinationOrder;
    if (!arraysMatch(previousOrder, destinationOrder)) {
      onReorderBookmarks(resolvedFolderId, destinationOrder);
    }
    resetBookmarkDragState();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current;
    if (isBookmarkDragData(data)) {
      if (!allowSync || !event.over) {
        resetBookmarkDragState(true);
        return;
      }
      commitBookmarkDrop();
      return;
    }
    if (data?.type === "folder") {
      handleFolderDragEnd(event);
      clearActiveFolderOverlay();
      activeDragTypeRef.current = null;
      return;
    }
    activeDragTypeRef.current = null;
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    const data = event?.active?.data?.current;
    if (isBookmarkDragData(data)) {
      resetBookmarkDragState(true);
    } else if (data?.type === "folder") {
      clearActiveFolderOverlay();
    }
    activeDragTypeRef.current = null;
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
            <FontAwesomeIcon icon={faTrash} />
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
              sensors={dragSensors}
              collisionDetection={collisionDetection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
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
                      bookmarks={getBookmarksForFolder(folder)}
                      allowSync={allowSync}
                      onOpenBookmarkModal={onOpenBookmarkModal}
                      onDeleteFolder={onDeleteFolder}
                      onRenameFolder={onRenameFolder}
                      onDeleteBookmark={onDeleteBookmark}
                      faviconMap={faviconMap}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay
                dropAnimation={{
                  duration: 180,
                  easing: "cubic-bezier(0.2, 0, 0.2, 1)",
                }}
              >
                {activeBookmarkData ? (
                  <BookmarkDragOverlayCard
                    bookmark={activeBookmarkData}
                    faviconSrc={activeBookmarkFavicon}
                  />
                ) : activeFolder ? (
                  <FolderDragOverlayCard
                    folder={activeFolder}
                    bookmarkCount={activeFolderBookmarkCount}
                  />
                ) : null}
              </DragOverlay>
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

const BookmarkDragOverlayCard = ({
  bookmark,
  faviconSrc,
}: {
  bookmark: Bookmark;
  faviconSrc: string | null;
}) => {
  const fallbackInitial = (() => {
    const source =
      bookmark.title.trim() || bookmark.url.replace(/^https?:\/\//i, "");
    return source ? source.charAt(0).toUpperCase() : "•";
  })();
  return (
    <article className="relative group rounded-2xl border border-slate-200 bg-white transition-colors hover:border-indigo-200 focus-within:border-indigo-200 w-90 shrink-0 pointer-events-none">
      <button
        type="button"
        className="absolute left-4 top-4 z-10 text-slate-400 hover:text-slate-600 h-6 w-6 flex items-center justify-center"
        aria-hidden
        tabIndex={-1}
        disabled
      >
        <FontAwesomeIcon icon={faGripVertical} />
      </button>
      <div className="block h-full rounded-2xl p-4 pl-10 pr-10">
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
            <p className="mt-0.5 text-sm font-semibold text-slate-900 line-clamp-2">
              {bookmark.title}
            </p>
          </div>
          {bookmark.note && (
            <p className="text-sm text-slate-700">{bookmark.note}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        className="absolute right-4 top-4 z-10 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 h-6 w-6 flex items-center justify-center"
        aria-hidden
        tabIndex={-1}
        disabled
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </article>
  );
};

const FolderDragOverlayCard = ({
  folder,
  bookmarkCount,
}: {
  folder: Folder;
  bookmarkCount: number;
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white shadow-xl w-[min(520px,90vw)] p-4 pointer-events-none">
    <div className="flex gap-2 items-center text-slate-900 font-semibold">
      <span className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-400 flex items-center justify-center">
        <FontAwesomeIcon icon={faGripVertical} />
      </span>
      <FontAwesomeIcon icon={faFolderOpen} className="text-indigo-500" />
      <span className="truncate">{folder.name}</span>
      <span className="flex items-center gap-1 text-xs font-normal text-slate-500">
        <FontAwesomeIcon icon={faBookmark} />
        {bookmarkCount} bookmark{bookmarkCount === 1 ? "" : "s"}
      </span>
    </div>
  </article>
);
