import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faFolder,
  faMagnifyingGlass,
  faXmark,
} from "@/utils/uiIcons";
import type { Bookmark, Collection, Folder } from "@/types";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { useBookmarkFavicons } from "@/hooks/useBookmarkFavicons";
import { hasChromeTabsSupport, openWithTabs } from "@/utils/chrome";

type QuickSearchModalProps = {
  open: boolean;
  collections: Collection[];
  onClose: () => void;
  onSelectCollection: (collectionId: string) => void;
};

type SearchResultItem =
  | {
      kind: "bookmark";
      id: string;
      collection: Collection;
      folder: Folder;
      bookmark: Bookmark;
      domain: string;
    }
  | {
      kind: "folder";
      id: string;
      collection: Collection;
      folder: Folder;
    };

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const QuickSearchModal = ({
  open,
  collections,
  onClose,
  onSelectCollection,
}: QuickSearchModalProps) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [brokenFavicons, setBrokenFavicons] = useState<Record<string, boolean>>(
    {},
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useDialogA11y({
    open,
    containerRef: dialogRef,
    initialFocusRef: inputRef,
    onClose,
  });

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const allBookmarks = useMemo(
    () =>
      collections.flatMap((collection) =>
        collection.folders.flatMap((folder) => folder.bookmarks),
      ),
    [collections],
  );
  const faviconMap = useBookmarkFavicons(open ? allBookmarks : []);

  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const matchedBookmarks: SearchResultItem[] = [];
    const matchedFolders: SearchResultItem[] = [];

    for (const collection of collections) {
      for (const folder of collection.folders) {
        if (
          q &&
          (folder.name.toLowerCase().includes(q) ||
            collection.name.toLowerCase().includes(q))
        ) {
          matchedFolders.push({
            kind: "folder",
            id: `folder:${collection.id}:${folder.id}`,
            collection,
            folder,
          });
        }

        for (const bookmark of folder.bookmarks) {
          const domain = getHostname(bookmark.url);
          if (
            !q ||
            bookmark.title.toLowerCase().includes(q) ||
            bookmark.url.toLowerCase().includes(q) ||
            (bookmark.note ?? "").toLowerCase().includes(q) ||
            folder.name.toLowerCase().includes(q) ||
            collection.name.toLowerCase().includes(q)
          ) {
            matchedBookmarks.push({
              kind: "bookmark",
              id: `bookmark:${collection.id}:${folder.id}:${bookmark.id}`,
              collection,
              folder,
              bookmark,
              domain,
            });
          }
        }
      }
    }

    return [...matchedBookmarks, ...matchedFolders].slice(0, 60);
  }, [collections, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const activeItem = listRef.current?.children[activeIndex] as
      HTMLElement | undefined;
    activeItem?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) {
    return null;
  }

  const activateItem = (item: SearchResultItem, newTab: boolean) => {
    if (item.kind === "folder") {
      onSelectCollection(item.collection.id);
      onClose();
      return;
    }
    openWithTabs(item.bookmark.url, newTab);
    onClose();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) =>
        results.length ? (prev + 1) % results.length : 0,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) =>
        results.length ? (prev - 1 + results.length) % results.length : 0,
      );
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      activateItem(results[activeIndex], event.metaKey || event.ctrlKey);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-[10vh] sm:p-5 sm:pt-[12vh]">
      <div
        className="absolute inset-0 bg-[#171a17]/72 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search links and folders"
        tabIndex={-1}
        className="relative z-10 flex max-h-[74vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_32px_100px_rgba(0,0,0,0.36)] focus:outline-none"
      >
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5 sm:px-5">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="text-base text-[var(--accent)]"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search links, notes, folders, or collections…"
            aria-label="Search links, notes, folders, or collections"
            className="w-full bg-transparent text-sm font-medium text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none sm:text-base"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="hidden cursor-pointer rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-1 text-[0.6875rem] font-semibold text-[var(--muted)] transition hover:text-[var(--ink)] sm:inline-flex"
          >
            ESC
          </button>
        </div>

        <div className="soft-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--muted)]">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="mb-2.5 text-2xl opacity-40"
              />
              <p className="text-sm font-semibold text-[var(--ink)]">
                {allBookmarks.length === 0
                  ? "No saved links yet"
                  : `No matches for "${query}"`}
              </p>
              <p className="mt-1 text-xs">
                {allBookmarks.length === 0
                  ? "Add links to your folders to jump to them instantly."
                  : "Try searching by title, domain, note, or folder name."}
              </p>
            </div>
          ) : (
            <ul
              ref={listRef}
              role="listbox"
              aria-label="Search results"
              className="space-y-0.5"
            >
              {results.map((item, index) => {
                const isActive = index === activeIndex;
                if (item.kind === "folder") {
                  return (
                    <li key={item.id} role="option" aria-selected={isActive}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => activateItem(item, false)}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                          isActive
                            ? "bg-[var(--surface-muted)] ring-1 ring-[var(--accent)]/40"
                            : "hover:bg-[var(--surface-muted)]"
                        }`}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] text-xs text-[var(--accent)]">
                          <FontAwesomeIcon icon={faFolder} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                            {item.folder.name}
                          </span>
                          <span className="block truncate text-xs text-[var(--muted)]">
                            Folder in {item.collection.name} ·{" "}
                            {item.folder.bookmarks.length}{" "}
                            {item.folder.bookmarks.length === 1
                              ? "link"
                              : "links"}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-[var(--surface-raised)] px-2 py-0.5 text-[0.6875rem] font-semibold text-[var(--muted)]">
                          Jump
                        </span>
                      </button>
                    </li>
                  );
                }

                const favicon =
                  !brokenFavicons[item.bookmark.id] &&
                  faviconMap[item.bookmark.id];
                const fallbackInitial = (
                  item.bookmark.title.trim() || item.domain
                )
                  .charAt(0)
                  .toUpperCase();

                return (
                  <li key={item.id} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={(event) =>
                        activateItem(item, event.metaKey || event.ctrlKey)
                      }
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        isActive
                          ? "bg-[var(--surface-muted)] ring-1 ring-[var(--accent)]/40"
                          : "hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] p-1 text-xs font-bold text-[var(--muted)]">
                        {favicon ? (
                          <img
                            src={favicon}
                            alt=""
                            className="h-full w-full object-contain"
                            onError={() =>
                              setBrokenFavicons((prev) => ({
                                ...prev,
                                [item.bookmark.id]: true,
                              }))
                            }
                          />
                        ) : (
                          fallbackInitial || "•"
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                          {item.bookmark.title}
                        </span>
                        <span className="block truncate text-xs text-[var(--muted)]">
                          {item.bookmark.note?.trim()
                            ? `${item.bookmark.note.trim()} · ${item.domain}`
                            : item.domain}
                        </span>
                      </span>
                      <span className="hidden max-w-44 shrink-0 truncate rounded-full border border-[var(--line)] bg-[var(--surface-raised)] px-2.5 py-0.5 text-[0.6875rem] font-medium text-[var(--muted)] sm:inline-block">
                        {item.collection.name} › {item.folder.name}
                      </span>
                      <FontAwesomeIcon
                        icon={faArrowUpRightFromSquare}
                        className="shrink-0 text-xs text-[var(--muted)]"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--surface-muted)]/60 px-4 py-2.5 text-[0.6875rem] text-[var(--muted)]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-[var(--line)] bg-[var(--surface-raised)] px-1.5 py-0.5 font-sans font-semibold text-[var(--ink)]">
                ↑↓
              </kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="rounded border border-[var(--line)] bg-[var(--surface-raised)] px-1.5 py-0.5 font-sans font-semibold text-[var(--ink)]">
                ↵
              </kbd>{" "}
              open
            </span>
            <span className="hidden sm:inline">
              <kbd className="rounded border border-[var(--line)] bg-[var(--surface-raised)] px-1.5 py-0.5 font-sans font-semibold text-[var(--ink)]">
                ⌘↵
              </kbd>{" "}
              new tab
            </span>
            {hasChromeTabsSupport && (
              <span className="hidden md:inline">
                · Tip: type{" "}
                <kbd className="rounded border border-[var(--line)] bg-[var(--surface-raised)] px-1.5 py-0.5 font-sans font-semibold text-[var(--ink)]">
                  t
                </kbd>{" "}
                + space in the address bar
              </span>
            )}
          </div>
          <span>
            {results.length} {results.length === 1 ? "result" : "results"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickSearchModal;
