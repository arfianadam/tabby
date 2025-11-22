import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import type { Bookmark } from "../../../types";

type BookmarkCardProps = {
  folderId: string;
  bookmark: Bookmark;
  allowSync: boolean;
  faviconSrc: string | null;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
  dragHandle?: React.ReactNode;
};

const BookmarkCard = ({
  folderId,
  bookmark,
  allowSync,
  faviconSrc,
  onDeleteBookmark,
  dragHandle,
}: BookmarkCardProps) => {
  const fallbackInitial = (() => {
    const source =
      bookmark.title.trim() || bookmark.url.replace(/^https?:\/\//i, "");
    return source ? source.charAt(0).toUpperCase() : "•";
  })();

  return (
    <article className="relative group rounded-2xl border border-slate-200 bg-white transition-colors hover:border-indigo-200 focus-within:border-indigo-200 max-w-90 shrink-0 h-full">
      <a
        href={bookmark.url}
        target="_self"
        className={`block h-full rounded-2xl p-4 ${
          allowSync ? "pr-12 pl-12" : "pr-4.5"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
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
      {dragHandle}
      {allowSync && (
        <button
          className="absolute right-3 top-4 z-10 rounded-full text-slate-400 hover:bg-rose-50 cursor-pointer hover:text-rose-600 h-6 w-6 flex items-center justify-center"
          type="button"
          onClick={() => onDeleteBookmark(folderId, bookmark.id)}
          disabled={!allowSync}
          aria-label={`Delete bookmark ${bookmark.title}`}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}
    </article>
  );
};

export default BookmarkCard;
