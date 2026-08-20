import {
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useDndContext } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Bookmark, Folder } from "@/types";
import FolderCard from "./FolderCard";
import DragHandle from "./DragHandle";

type SortableFolderCardProps = {
  folder: Folder;
  bookmarks: Bookmark[];
  allowSync: boolean;
  editingEnabled: boolean;
  index: number;
  onOpenBookmarkModal: (folderId: string) => void;
  onDeleteFolder: (folder: Folder) => void;
  onRenameFolder: (folder: Folder, name: string) => Promise<boolean>;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  faviconMap: Record<string, string | null>;
  onEditBookmark: (folderId: string, bookmark: Bookmark) => void;
  onOpenFolderSettings: (folder: Folder) => void;
};

const SortableFolderCard = memo(function SortableFolderCard({
  folder,
  bookmarks,
  allowSync,
  editingEnabled,
  index,
  onOpenBookmarkModal,
  onDeleteFolder,
  onRenameFolder,
  onDeleteBookmark,
  faviconMap,
  onEditBookmark,
  onOpenFolderSettings,
}: SortableFolderCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [gridRowSpan, setGridRowSpan] = useState(1);
  const { active } = useDndContext();
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: folder.id,
    data: { type: "folder", folder, index },
    disabled: !editingEnabled,
  });

  const updateGridRowSpan = useCallback(() => {
    const card = cardRef.current;
    const grid = card?.parentElement;
    const content = card?.firstElementChild;
    if (!card || !grid || !content) {
      return;
    }

    const gridStyles = window.getComputedStyle(grid);
    const rowHeight = Number.parseFloat(gridStyles.gridAutoRows) || 1;
    const visualGap = Number.parseFloat(gridStyles.columnGap) || 0;
    const contentHeight = content.getBoundingClientRect().height;
    setGridRowSpan(
      Math.max(1, Math.ceil((contentHeight + visualGap) / rowHeight)),
    );
  }, []);

  const setCardNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      cardRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

  useLayoutEffect(() => {
    const card = cardRef.current;
    const content = card?.firstElementChild;
    if (!card || !content) {
      return;
    }

    updateGridRowSpan();
    const resizeObserver = new ResizeObserver(updateGridRowSpan);
    resizeObserver.observe(content);
    window.addEventListener("resize", updateGridRowSpan);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateGridRowSpan);
    };
  }, [updateGridRowSpan]);

  // Use dnd-kit's transition directly - it manages timing for drag and sort animations
  const style: CSSProperties = {
    gridRowEnd: `span ${gridRowSpan}`,
    ...(editingEnabled
      ? {
          transform: CSS.Translate.toString(transform),
          transition,
          zIndex: isDragging ? 10 : undefined,
        }
      : {}),
  };

  const isBookmarkOver =
    isOver &&
    active?.data.current?.type === "bookmark" &&
    active.data.current?.folderId !== folder.id &&
    !isDragging;

  return (
    <div
      ref={setCardNodeRef}
      style={style}
      className={`relative min-w-0 break-inside-avoid rounded-[1.35rem] ${
        isBookmarkOver ? "bg-orange-500/5 ring-2 ring-[var(--accent)]" : ""
      }`}
    >
      <FolderCard
        folder={folder}
        bookmarks={bookmarks}
        allowSync={allowSync}
        onOpenBookmarkModal={onOpenBookmarkModal}
        onDeleteFolder={onDeleteFolder}
        onRenameFolder={onRenameFolder}
        onDeleteBookmark={onDeleteBookmark}
        faviconMap={faviconMap}
        onEditBookmark={onEditBookmark}
        onOpenFolderSettings={onOpenFolderSettings}
        dragHandle={
          editingEnabled ? (
            <DragHandle
              label={`Reorder folder ${folder.name}`}
              setActivatorNodeRef={setActivatorNodeRef}
              attributes={attributes}
              listeners={listeners}
            />
          ) : null
        }
      />
    </div>
  );
});

export default SortableFolderCard;
