import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical, faTrash } from "@fortawesome/free-solid-svg-icons";
import type { Bookmark } from "../../../types";

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
    data: {
      type: "bookmark",
      folderId,
      bookmarkId: bookmark.id,
      bookmark,
    },
  });
  const dragHandleProps = allowSync ? { ...attributes, ...listeners } : {};
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    visibility: isDragging ? "hidden" : undefined,
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

export default BookmarkCard;
