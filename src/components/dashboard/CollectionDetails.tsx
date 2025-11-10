import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faFolder,
  faFolderOpen,
  faPlus,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { Folder } from "../../types";
import type { Collection } from "../../types";
import type { BookmarkFormState } from "../Dashboard";
import { useBookmarkFavicons } from "../../hooks/useBookmarkFavicons";
import {
  actionButtonClasses,
  inputClasses,
  panelClass,
  subtleButtonClasses,
} from "./constants";
import AddBookmarkModal from "./AddBookmarkModal";

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
    folderId: string
  ) => void;
  savingBookmark: boolean;
  hasChromeTabsSupport: boolean;
  onDeleteBookmark: (folderId: string, bookmarkId: string) => void;
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
  savingBookmark,
  hasChromeTabsSupport,
  onDeleteBookmark,
}: CollectionDetailsProps) => {
  const activeBookmarkFolder =
    collection.folders.find((folder) => folder.id === bookmarkModalFolderId) ??
    null;
  const allBookmarks = useMemo(
    () => collection.folders.flatMap((folder) => folder.bookmarks),
    [collection.folders]
  );
  const faviconMap = useBookmarkFavicons(allBookmarks);

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
              <p className="flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faFolder} />
                No folders yet. Add one above to start saving bookmarks.
              </p>
            </div>
          ) : (
            <div className="grow overflow-y-auto pr-2 flex flex-col gap-4">
              {collection.folders.map((folder) => (
                <article
                  key={folder.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col"
                >
                  <div className="flex gap-2 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-slate-900 font-semibold">
                      <FontAwesomeIcon
                        icon={faFolderOpen}
                        className="text-indigo-500"
                      />
                      <span>{folder.name}</span>
                      <span className="flex items-center gap-1 text-xs font-normal text-slate-500">
                        <FontAwesomeIcon icon={faBookmark} />
                        {folder.bookmarks.length} bookmark
                        {folder.bookmarks.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`${subtleButtonClasses} gap-2 text-indigo-700 hover:text-indigo-800`}
                        onClick={() => onOpenBookmarkModal(folder.id)}
                        disabled={!allowSync}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        Add bookmark
                      </button>
                      <button
                        type="button"
                        className={`${subtleButtonClasses} gap-2 text-rose-600 hover:text-rose-700`}
                        onClick={() => onDeleteFolder(folder)}
                        disabled={!allowSync}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        Delete folder
                      </button>
                    </div>
                  </div>
                  {folder.bookmarks.length === 0 ? (
                    <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500 text-sm">
                      <p>
                        This folder is empty. Use “Add bookmark” to start
                        filling it.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
                      {folder.bookmarks.map((bookmark) => {
                        const faviconSrc = faviconMap[bookmark.id] ?? null;
                        const fallbackInitial = (() => {
                          const source =
                            bookmark.title.trim() ||
                            bookmark.url.replace(/^https?:\/\//i, "");
                          return source ? source.charAt(0).toUpperCase() : "•";
                        })();

                        return (
                          <article
                            key={bookmark.id}
                            className="relative group rounded-2xl border border-slate-200 bg-white transition hover:border-indigo-200 focus-within:border-indigo-200"
                          >
                            <a
                              href={bookmark.url}
                              target="_self"
                              className="block h-full rounded-2xl p-4 pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
                                  <p className="text-sm text-slate-700">
                                    {bookmark.note}
                                  </p>
                                )}
                              </div>
                            </a>
                            <button
                              className="absolute right-4 top-4 z-10 rounded-full text-slate-400 hover:bg-rose-50 cursor-pointer hover:text-rose-600 h-6 w-6 flex items-center justify-center"
                              type="button"
                              onClick={() =>
                                onDeleteBookmark(folder.id, bookmark.id)
                              }
                              disabled={!allowSync}
                              aria-label={`Delete bookmark ${bookmark.title}`}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </article>
              ))}
            </div>
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
        savingBookmark={savingBookmark}
        hasChromeTabsSupport={hasChromeTabsSupport}
        onClose={onCloseBookmarkModal}
      />
    </section>
  );
};

export default CollectionDetails;
