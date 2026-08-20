import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import type { Bookmark } from "@/types";
import {
  dangerEditorControlButtonClasses,
  editorControlButtonClasses,
} from "../constants";

type BookmarkCardProps = {
  folderId: string;
  bookmark: Bookmark;
  allowSync: boolean;
  faviconSrc: string | null;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  onEditBookmark: (folderId: string, bookmark: Bookmark) => void;
  dragHandle?: React.ReactNode;
};

const BookmarkCard = ({
  folderId,
  bookmark,
  allowSync,
  faviconSrc,
  onDeleteBookmark,
  onEditBookmark,
  dragHandle,
}: BookmarkCardProps) => {
  const fallbackInitial = (() => {
    const source =
      bookmark.title.trim() || bookmark.url.replace(/^https?:\/\//i, "");
    return source ? source.charAt(0).toUpperCase() : "•";
  })();
  const bookmarkMeta = (() => {
    if (bookmark.note?.trim()) {
      return bookmark.note.trim();
    }
    try {
      return new URL(bookmark.url).hostname.replace(/^www\./, "");
    } catch {
      return bookmark.url;
    }
  })();

  return (
    <article className="group relative rounded-xl border border-transparent bg-transparent transition-all hover:border-[var(--line)] hover:bg-[var(--surface-muted)] focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-muted)]">
      <a
        href={bookmark.url}
        target="_self"
        className={`block h-full rounded-xl py-2 ${
          allowSync ? "pr-20 pl-12" : "px-2"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-8 w-8 shrink-0 overflow-hidden rounded-[0.65rem] border border-[var(--line)] bg-[var(--surface-raised)] text-[0.65rem] font-bold uppercase tracking-wide text-[var(--muted)] shadow-sm">
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
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.82rem] font-semibold text-[var(--ink)] transition group-hover:text-[var(--accent-strong)]">
              {bookmark.title}
            </span>
            <span className="mt-0.5 block truncate text-[0.66rem] text-[var(--muted)]">
              {bookmarkMeta}
            </span>
          </span>
        </div>
      </a>
      {dragHandle}
      {allowSync && (
        <div className="absolute right-[3px] top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <button
            className={`${editorControlButtonClasses} cursor-pointer`}
            type="button"
            onClick={() => onEditBookmark(folderId, bookmark)}
            disabled={!allowSync}
            aria-label={`Edit bookmark ${bookmark.title}`}
          >
            <FontAwesomeIcon icon={faPen} className="text-xs" />
          </button>
          <button
            className={`${dangerEditorControlButtonClasses} cursor-pointer`}
            type="button"
            onClick={() => onDeleteBookmark(folderId, bookmark.id)}
            disabled={!allowSync}
            aria-label={`Delete bookmark ${bookmark.title}`}
          >
            <FontAwesomeIcon icon={faTrash} className="text-xs" />
          </button>
        </div>
      )}
    </article>
  );
};

export default BookmarkCard;
