import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@/utils/uiIcons";
import type { Bookmark } from "@/types";
import {
  dangerEditorControlButtonClasses,
  editorControlButtonClasses,
} from "../constants";
import { needsTabsNavigation, openWithTabs } from "@/utils/chrome";

type BookmarkCardProps = {
  folderId: string;
  bookmark: Bookmark;
  allowSync: boolean;
  faviconSrc: string | null;
  onDeleteBookmark?: (folderId: string, bookmarkId: string) => void;
  onEditBookmark?: (folderId: string, bookmark: Bookmark) => void;
  dragHandle?: React.ReactNode;
  isOverlay?: boolean;
};

const BookmarkCard = ({
  folderId,
  bookmark,
  allowSync,
  faviconSrc,
  onDeleteBookmark,
  onEditBookmark,
  dragHandle,
  isOverlay = false,
}: BookmarkCardProps) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [faviconSrc]);

  const fallbackInitial = (() => {
    const source =
      bookmark.title.trim() ||
      bookmark.url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
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

  const handleOpen = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isOverlay) {
      event.preventDefault();
      return;
    }
    if (!needsTabsNavigation(bookmark.url)) {
      return;
    }
    event.preventDefault();
    openWithTabs(
      bookmark.url,
      event.button === 1 || event.metaKey || event.ctrlKey,
    );
  };

  const showImage = Boolean(faviconSrc) && !imageError;

  return (
    <article
      className={`group relative rounded-xl border transition-all ${
        isOverlay
          ? "border-[var(--accent)]/50 bg-[var(--surface-raised)] shadow-[0_16px_40px_rgba(0,0,0,0.22)] ring-1 ring-[var(--accent)]/25"
          : "border-transparent bg-transparent hover:border-[var(--line)] hover:bg-[var(--surface-muted)] focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-muted)]"
      }`}
    >
      <a
        href={bookmark.url}
        target="_self"
        onClick={handleOpen}
        onAuxClick={(event) => {
          if (event.button === 1) {
            handleOpen(event);
          }
        }}
        className={`block h-full rounded-xl py-2 ${
          allowSync ? "pr-17 pl-9" : "px-2.5"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[0.65rem] border border-[var(--line)] bg-[var(--surface-raised)] p-1 text-xs font-bold uppercase tracking-wide text-[var(--muted)] shadow-sm">
            {showImage ? (
              <img
                src={faviconSrc ?? undefined}
                alt=""
                className="h-full w-full object-contain"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              <span>{fallbackInitial}</span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.875rem] font-semibold leading-snug text-[var(--ink)] transition group-hover:text-[var(--accent-strong)]">
              {bookmark.title}
            </span>
            <span className="mt-0.5 block truncate text-xs leading-snug text-[var(--muted)]">
              {bookmarkMeta}
            </span>
          </span>
        </div>
      </a>
      {dragHandle}
      {allowSync && !isOverlay && onEditBookmark && onDeleteBookmark && (
        <div className="absolute top-1/2 right-1 z-10 flex -translate-y-1/2 items-center gap-0.5 opacity-60 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            className={`${editorControlButtonClasses} cursor-pointer`}
            type="button"
            onClick={() => onEditBookmark(folderId, bookmark)}
            disabled={!allowSync}
            title="Edit bookmark"
            aria-label={`Edit bookmark ${bookmark.title}`}
          >
            <FontAwesomeIcon icon={faPen} className="text-xs" />
          </button>
          <button
            className={`${dangerEditorControlButtonClasses} cursor-pointer`}
            type="button"
            onClick={() => onDeleteBookmark(folderId, bookmark.id)}
            disabled={!allowSync}
            title="Delete bookmark"
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
