import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import type { Bookmark } from "@/types";
import { dangerGhostButtonClasses } from "../constants";

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

  return (
    <article className="relative group rounded-2xl border border-slate-200 bg-white transition-colors hover:border-indigo-200 focus-within:border-indigo-200 w-full h-full dark:bg-slate-800 dark:border-slate-700 dark:hover:border-indigo-800">
      <a
        href={bookmark.url}
        target="_self"
        className={`block h-full rounded-2xl p-2 ${
          allowSync ? "pr-20 pl-10" : "pr-3.5"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-indigo-800 dark:focus-visible:ring-offset-slate-800`}
      >
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
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
          <p className="text-sm font-semibold text-slate-900 transition group-hover:text-indigo-600 truncate dark:text-slate-100 dark:group-hover:text-indigo-400">
            {bookmark.title}
          </p>
        </div>
      </a>
      {dragHandle}
      {allowSync && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
          <button
            className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            type="button"
            onClick={() => onEditBookmark(folderId, bookmark)}
            disabled={!allowSync}
            aria-label={`Edit bookmark ${bookmark.title}`}
          >
            <FontAwesomeIcon icon={faPen} className="text-xs" />
          </button>
          <button
            className={`h-7 w-7 flex items-center justify-center ${dangerGhostButtonClasses}`}
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
