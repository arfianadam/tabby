import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faCheck,
  faChevronDown,
  faListUl,
  faMagnifyingGlass,
  faSpinner,
  faXmark,
} from "@/utils/uiIcons";
import type { Collection, Folder } from "@/types";
import type { BookmarkFormState } from "./types";
import {
  actionButtonClasses,
  inputClasses,
  subtleButtonClasses,
} from "./constants";
import { getCurrentWindowTabs } from "@/utils/chrome";
import type { BrowserTab } from "@/utils/chrome";
import { useFavicons } from "@/hooks/useFavicons";
import { useDialogA11y } from "@/hooks/useDialogA11y";

type AddBookmarkModalProps = {
  folder: Folder | null;
  collections: Collection[];
  open: boolean;
  allowSync: boolean;
  isEditing: boolean;
  bookmarkForm: BookmarkFormState;
  destination: { collectionId: string; folderId: string } | null;
  onDestinationChange: (collectionId: string, folderId: string) => void;
  onBookmarkFormChange: (field: keyof BookmarkFormState, value: string) => void;
  onAddBookmark: (folderId: string) => void;
  onAddSelectedTabs: (folderId: string, tabs: BrowserTab[]) => void;
  savingBookmark: boolean;
  hasChromeTabsSupport: boolean;
  onClose: () => void;
};

const normalizeForCompare = (url: string) =>
  url.trim().replace(/\/+$/, "").toLowerCase();

const AddBookmarkModal = ({
  folder,
  collections,
  open,
  allowSync,
  isEditing,
  bookmarkForm,
  destination,
  onDestinationChange,
  onBookmarkFormChange,
  onAddBookmark,
  onAddSelectedTabs,
  savingBookmark,
  hasChromeTabsSupport,
  onClose,
}: AddBookmarkModalProps) => {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [tabsLoading, setTabsLoading] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);
  const [tabSearch, setTabSearch] = useState("");
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>([]);
  const [savingSource, setSavingSource] = useState<"single" | "batch" | null>(
    null,
  );
  const [brokenFavicons, setBrokenFavicons] = useState<Record<string, boolean>>(
    {},
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const tabFavicons = useFavicons(tabs);

  const safeClose = () => {
    if (!savingBookmark) {
      onClose();
    }
  };

  useDialogA11y({
    open: Boolean(open && folder),
    containerRef: dialogRef,
    initialFocusRef: titleInputRef,
    locked: savingBookmark,
    onClose: safeClose,
  });

  useEffect(() => {
    if (!savingBookmark) {
      setSavingSource(null);
    }
  }, [savingBookmark]);

  useEffect(() => {
    if (!open || isEditing) {
      setTabs([]);
      setTabSearch("");
      setActiveTabId(null);
      setSelectedTabIds([]);
      setTabError(null);
      setTabsLoading(false);
      return;
    }
    if (!hasChromeTabsSupport) {
      setTabs([]);
      setTabSearch("");
      setActiveTabId(null);
      setSelectedTabIds([]);
      return;
    }
    let cancelled = false;
    const fetchTabs = async () => {
      setTabsLoading(true);
      setTabError(null);
      try {
        const currentTabs = await getCurrentWindowTabs();
        if (!cancelled) {
          setTabs(currentTabs);
        }
      } catch (err) {
        if (!cancelled) {
          setTabError(
            err instanceof Error
              ? err.message
              : "Unable to list tabs for this window.",
          );
          setTabs([]);
          setActiveTabId(null);
          setSelectedTabIds([]);
        }
      } finally {
        if (!cancelled) {
          setTabsLoading(false);
        }
      }
    };
    void fetchTabs();
    return () => {
      cancelled = true;
    };
  }, [open, hasChromeTabsSupport, isEditing]);

  useEffect(() => {
    if (activeTabId === null) {
      return;
    }
    if (!tabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(null);
    }
  }, [tabs, activeTabId]);

  useEffect(() => {
    setSelectedTabIds((prev) => {
      const next = prev.filter((id) => tabs.some((tab) => tab.id === id));
      if (next.length === prev.length) {
        return prev;
      }
      return next;
    });
  }, [tabs]);

  const existingUrls = useMemo(() => {
    const set = new Set<string>();
    folder?.bookmarks.forEach((b) => set.add(normalizeForCompare(b.url)));
    return set;
  }, [folder]);

  const orderedTabs = useMemo(() => [...tabs].reverse(), [tabs]);

  const filteredTabs = useMemo(() => {
    const q = tabSearch.trim().toLowerCase();
    if (!q) return orderedTabs;
    return orderedTabs.filter(
      (tab) =>
        tab.title.toLowerCase().includes(q) ||
        tab.url.toLowerCase().includes(q),
    );
  }, [orderedTabs, tabSearch]);

  const collectionsWithFolders = useMemo(
    () => collections.filter((c) => c.folders.length > 0),
    [collections],
  );

  const selectedDestCollection = useMemo(
    () =>
      collectionsWithFolders.find((c) => c.id === destination?.collectionId) ??
      collectionsWithFolders[0] ??
      null,
    [collectionsWithFolders, destination?.collectionId],
  );

  if (!open || !folder) {
    return null;
  }

  const handleSelectTab = (tab: BrowserTab) => {
    setActiveTabId(tab.id);
    onBookmarkFormChange("title", tab.title);
    onBookmarkFormChange("url", tab.url);
  };

  const toggleTabSelection = (tabId: string) => {
    setSelectedTabIds((prev) =>
      prev.includes(tabId)
        ? prev.filter((id) => id !== tabId)
        : [...prev, tabId],
    );
  };

  const allFilteredSelected =
    filteredTabs.length > 0 &&
    filteredTabs.every((tab) => selectedTabIds.includes(tab.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredTabs.map((t) => t.id));
      setSelectedTabIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      setSelectedTabIds((prev) => {
        const next = new Set(prev);
        filteredTabs.forEach((tab) => next.add(tab.id));
        return Array.from(next);
      });
    }
  };

  const handleAddSelectedTabs = () => {
    if (!selectedTabIds.length) {
      return;
    }
    const selectedTabs = orderedTabs.filter((tab) =>
      selectedTabIds.includes(tab.id),
    );
    if (!selectedTabs.length) {
      return;
    }
    setSavingSource("batch");
    onAddSelectedTabs(folder.id, selectedTabs);
  };

  const showTabsPanel = !isEditing && hasChromeTabsSupport;
  const titleId = `add-bookmark-${folder.id}`;
  const selectedTabCount = selectedTabIds.length;
  const addSelectedDisabled =
    !allowSync || savingBookmark || selectedTabCount === 0;
  const addSelectedLabel =
    selectedTabCount === 1
      ? "Add 1 selected tab"
      : selectedTabCount > 1
        ? `Add ${selectedTabCount} tabs`
        : "Add selected tabs";
  const singleSaving = savingBookmark && savingSource !== "batch";
  const batchSaving = savingBookmark && savingSource === "batch";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div
        className="absolute inset-0 bg-[#171a17]/72 backdrop-blur-sm"
        aria-hidden="true"
        onClick={safeClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_32px_100px_rgba(0,0,0,0.34)] focus:outline-none ${
          showTabsPanel ? "max-w-5xl h-[min(42rem,90vh)]" : "max-w-xl"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              {isEditing ? "Edit bookmark" : "Add bookmark"}
            </p>
            <h3
              id={titleId}
              className="mt-1 truncate text-xl font-bold tracking-tight text-[var(--ink)]"
            >
              {folder.name}
            </h3>
          </div>
          <button
            type="button"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={safeClose}
            disabled={savingBookmark}
            aria-label="Close bookmark modal"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form
          className="soft-scrollbar flex min-h-0 grow overflow-x-hidden overflow-y-auto px-5 py-5 sm:px-6"
          onSubmit={(event) => {
            event.preventDefault();
            setSavingSource("single");
            onAddBookmark(folder.id);
          }}
        >
          <div className="flex min-h-0 min-w-0 grow flex-col gap-6 lg:flex-row">
            <div className="min-w-0 flex-1 space-y-4">
              <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
                Title
                <input
                  ref={titleInputRef}
                  type="text"
                  value={bookmarkForm.title}
                  onChange={(event) =>
                    onBookmarkFormChange("title", event.target.value)
                  }
                  placeholder="Ex: Great GTM playbook"
                  className={inputClasses}
                  disabled={!allowSync || savingBookmark}
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
                URL
                <input
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={bookmarkForm.url}
                  onChange={(event) =>
                    onBookmarkFormChange("url", event.target.value)
                  }
                  placeholder="github.com or https://example.com"
                  className={inputClasses}
                  disabled={!allowSync || savingBookmark}
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
                <span>
                  Note{" "}
                  <span className="font-normal text-[var(--muted)]">
                    (optional)
                  </span>
                </span>
                <textarea
                  value={bookmarkForm.note}
                  onChange={(event) =>
                    onBookmarkFormChange("note", event.target.value)
                  }
                  placeholder="Short context or reminder…"
                  className={`${inputClasses} min-h-20 resize-y`}
                  disabled={!allowSync || savingBookmark}
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
                <span>
                  Alternate icon domain{" "}
                  <span className="font-normal text-[var(--muted)]">
                    (optional)
                  </span>
                </span>
                <input
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={bookmarkForm.faviconUrl}
                  onChange={(event) =>
                    onBookmarkFormChange("faviconUrl", event.target.value)
                  }
                  placeholder="https://github.com"
                  className={inputClasses}
                  disabled={!allowSync || savingBookmark}
                />
                <span className="text-xs font-normal text-[var(--muted)]">
                  Fetch the favicon from another site&apos;s domain (also reused
                  by other links on the same host).
                </span>
              </label>

              {isEditing &&
                destination &&
                collectionsWithFolders.length > 0 &&
                selectedDestCollection && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)]/70 p-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--ink)]">
                      Collection
                      <div className="relative">
                        <select
                          value={destination.collectionId}
                          onChange={(event) => {
                            const nextCollection = collectionsWithFolders.find(
                              (c) => c.id === event.target.value,
                            );
                            if (nextCollection && nextCollection.folders[0]) {
                              onDestinationChange(
                                nextCollection.id,
                                nextCollection.folders[0].id,
                              );
                            }
                          }}
                          disabled={!allowSync || savingBookmark}
                          className={`${inputClasses} cursor-pointer appearance-none bg-[var(--surface-raised)] py-2 pr-9 font-normal`}
                        >
                          {collectionsWithFolders.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.name}
                            </option>
                          ))}
                        </select>
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          aria-hidden="true"
                          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-[var(--muted)]"
                        />
                      </div>
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--ink)]">
                      Folder
                      <div className="relative">
                        <select
                          value={destination.folderId}
                          onChange={(event) =>
                            onDestinationChange(
                              selectedDestCollection.id,
                              event.target.value,
                            )
                          }
                          disabled={!allowSync || savingBookmark}
                          className={`${inputClasses} cursor-pointer appearance-none bg-[var(--surface-raised)] py-2 pr-9 font-normal`}
                        >
                          {selectedDestCollection.folders.map(
                            (targetFolder) => (
                              <option
                                key={targetFolder.id}
                                value={targetFolder.id}
                              >
                                {targetFolder.name}
                              </option>
                            ),
                          )}
                        </select>
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          aria-hidden="true"
                          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-[var(--muted)]"
                        />
                      </div>
                    </label>
                  </div>
                )}

              <div className="flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={safeClose}
                  disabled={savingBookmark}
                  className={subtleButtonClasses}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    savingBookmark || !allowSync || !bookmarkForm.url.trim()
                  }
                  className={`${actionButtonClasses} gap-2`}
                >
                  <FontAwesomeIcon
                    icon={singleSaving ? faSpinner : faBookmark}
                    spin={singleSaving}
                  />
                  {singleSaving
                    ? "Saving…"
                    : isEditing
                      ? "Save changes"
                      : "Save bookmark"}
                </button>
              </div>
            </div>

            {showTabsPanel && (
              <div className="flex min-h-72 w-full min-w-0 flex-col space-y-3 border-t border-[var(--line)] pt-5 lg:min-h-0 lg:w-[54%] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                      <FontAwesomeIcon icon={faListUl} />
                      Tabs in this window
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      Click a row to prefill, or check tabs to batch-add.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tabs.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleSelectAllFiltered}
                        disabled={savingBookmark}
                        className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      >
                        {allFilteredSelected ? "Clear all" : "Select all"}
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${
                        selectedTabCount > 0
                          ? actionButtonClasses
                          : subtleButtonClasses
                      } gap-2 px-3 py-1.5 text-xs`}
                      disabled={addSelectedDisabled}
                      onClick={handleAddSelectedTabs}
                    >
                      <FontAwesomeIcon
                        icon={batchSaving ? faSpinner : faBookmark}
                        spin={batchSaving}
                      />
                      {batchSaving ? "Saving…" : addSelectedLabel}
                    </button>
                  </div>
                </div>

                {tabs.length > 4 && (
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-[var(--muted)]"
                    />
                    <input
                      type="text"
                      value={tabSearch}
                      onChange={(event) => setTabSearch(event.target.value)}
                      placeholder="Filter open tabs…"
                      aria-label="Filter open tabs"
                      className={`${inputClasses} py-2 pr-8 pl-8 text-xs`}
                    />
                    {tabSearch && (
                      <button
                        type="button"
                        onClick={() => setTabSearch("")}
                        aria-label="Clear tab filter"
                        className="absolute top-1/2 right-2.5 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-[var(--muted)] hover:text-[var(--ink)]"
                      >
                        <FontAwesomeIcon icon={faXmark} className="text-xs" />
                      </button>
                    )}
                  </div>
                )}

                {tabsLoading ? (
                  <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Loading tabs…
                  </p>
                ) : tabError ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {tabError}
                  </p>
                ) : filteredTabs.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--line)] p-6 text-center text-xs text-[var(--muted)]">
                    {tabs.length === 0
                      ? "No open tabs detected in this window."
                      : `No tabs matching "${tabSearch}".`}
                  </p>
                ) : (
                  <ul className="soft-scrollbar min-h-0 grow overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] text-left">
                    {filteredTabs.map((tab) => {
                      const isActive = tab.id === activeTabId;
                      const isBatchSelected = selectedTabIds.includes(tab.id);
                      const isAlreadySaved = existingUrls.has(
                        normalizeForCompare(tab.url),
                      );
                      const faviconSrc = !brokenFavicons[tab.id]
                        ? (tabFavicons[tab.id] ?? null)
                        : null;
                      const fallbackInitial = (() => {
                        const source =
                          tab.title.trim() ||
                          tab.url.replace(/^https?:\/\//i, "");
                        return source ? source.charAt(0).toUpperCase() : "•";
                      })();
                      const toggleLabel = isBatchSelected
                        ? `Deselect ${tab.title}`
                        : `Select ${tab.title}`;
                      return (
                        <li
                          key={tab.id}
                          className="border-b border-[var(--line)] last:border-b-0"
                        >
                          <div
                            className={`flex w-full items-start gap-3 p-3 text-left transition ${
                              isActive
                                ? "bg-[var(--accent)]/8"
                                : "hover:bg-[var(--surface-muted)]"
                            }`}
                          >
                            <button
                              type="button"
                              className={`mt-0.5 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                                isBatchSelected
                                  ? "border-[var(--accent-fill)] bg-[var(--accent-fill)] text-white"
                                  : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)]"
                              }`}
                              aria-pressed={isBatchSelected}
                              aria-label={toggleLabel}
                              onClick={() => toggleTabSelection(tab.id)}
                            >
                              {isBatchSelected ? (
                                <FontAwesomeIcon icon={faCheck} />
                              ) : (
                                <span className="sr-only">{toggleLabel}</span>
                              )}
                            </button>
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg"
                              onClick={() => handleSelectTab(tab)}
                            >
                              <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                                {faviconSrc ? (
                                  <img
                                    src={faviconSrc}
                                    alt=""
                                    className="h-full w-full object-contain"
                                    loading="lazy"
                                    onError={() =>
                                      setBrokenFavicons((prev) => ({
                                        ...prev,
                                        [tab.id]: true,
                                      }))
                                    }
                                  />
                                ) : (
                                  fallbackInitial
                                )}
                              </span>
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className="flex items-center gap-1.5">
                                  <span className="truncate text-sm font-semibold text-[var(--ink)]">
                                    {tab.title}
                                  </span>
                                  {tab.active && (
                                    <span className="shrink-0 rounded-full bg-[var(--accent)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                                      Active
                                    </span>
                                  )}
                                  {isAlreadySaved && (
                                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                      Saved
                                    </span>
                                  )}
                                </span>
                                <span className="truncate text-xs text-[var(--muted)]">
                                  {tab.url}
                                </span>
                              </span>
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookmarkModal;
