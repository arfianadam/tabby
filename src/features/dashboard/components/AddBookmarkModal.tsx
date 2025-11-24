import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faCheck,
  faListUl,
  faSpinner,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { Folder } from "@/types";
import type { BookmarkFormState } from "./types";
import { actionButtonClasses, inputClasses } from "./constants";
import { getCurrentWindowTabs } from "@/utils/chrome";
import type { BrowserTab } from "@/utils/chrome";
import { useFavicons } from "@/hooks/useFavicons";

type AddBookmarkModalProps = {
  folder: Folder | null;
  open: boolean;
  allowSync: boolean;
  isEditing: boolean;
  bookmarkForm: BookmarkFormState;
  onBookmarkFormChange: (field: keyof BookmarkFormState, value: string) => void;
  onAddBookmark: (
    event: React.FormEvent<HTMLFormElement>,
    folderId: string,
  ) => void;
  onAddSelectedTabs: (
    folderId: string,
    tabs: BrowserTab[],
  ) => Promise<void> | void;
  savingBookmark: boolean;
  hasChromeTabsSupport: boolean;
  onClose: () => void;
};

const AddBookmarkModal = ({
  folder,
  open,
  allowSync,
  isEditing,
  bookmarkForm,
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
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>([]);
  const tabFavicons = useFavicons(tabs);

  useEffect(() => {
    if (!open || isEditing) {
      setTabs([]);
      setActiveTabId(null);
      setSelectedTabIds([]);
      setTabError(null);
      setTabsLoading(false);
      return;
    }
    if (!hasChromeTabsSupport) {
      setTabs([]);
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
    fetchTabs();
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

  const handleAddSelectedTabs = () => {
    if (!selectedTabIds.length) {
      return;
    }
    const orderedTabs = [...tabs].reverse();
    const selectedTabs = orderedTabs.filter((tab) =>
      selectedTabIds.includes(tab.id),
    );
    if (!selectedTabs.length) {
      return;
    }
    void onAddSelectedTabs(folder.id, selectedTabs);
  };

  const titleId = `add-bookmark-${folder.id}`;
  const orderedTabs = [...tabs].reverse();
  const selectedTabCount = selectedTabIds.length;
  const addSelectedDisabled =
    !allowSync || savingBookmark || selectedTabCount === 0;
  const addSelectedLabel =
    selectedTabCount === 1 ? "Add selected tab" : "Add selected tabs";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex flex-col relative z-10 w-full rounded-2xl bg-white shadow-2xl dark:bg-slate-800 ${
          isEditing ? "max-w-xl h-auto" : "max-w-6xl h-125"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {isEditing ? "Edit bookmark" : "Add bookmark"}
            </p>
            <h3
              id={titleId}
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              {folder.name}
            </h3>
          </div>
          <button
            type="button"
            className=" cursor-pointer rounded-full h-6 w-6 flex items-center justify-center text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            onClick={onClose}
            aria-label="Close add bookmark modal"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <form
          className="grow min-h-0 flex px-5 py-4"
          onSubmit={(event) => onAddBookmark(event, folder.id)}
        >
          <div className="grow min-h-0 flex gap-5">
            <div className="flex-1 space-y-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Title
                <input
                  type="text"
                  value={bookmarkForm.title}
                  onChange={(event) =>
                    onBookmarkFormChange("title", event.target.value)
                  }
                  placeholder="Ex: Great GTM playbook"
                  className={inputClasses}
                  disabled={!allowSync}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                URL
                <input
                  type="url"
                  value={bookmarkForm.url}
                  onChange={(event) =>
                    onBookmarkFormChange("url", event.target.value)
                  }
                  placeholder="https://example.com"
                  className={inputClasses}
                  disabled={!allowSync}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Note (optional)
                <textarea
                  value={bookmarkForm.note}
                  onChange={(event) =>
                    onBookmarkFormChange("note", event.target.value)
                  }
                  className={`${inputClasses} resize-y`}
                  disabled={!allowSync}
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingBookmark || !allowSync}
                  className={`${actionButtonClasses} gap-2`}
                >
                  <FontAwesomeIcon
                    icon={savingBookmark ? faSpinner : faBookmark}
                    spin={savingBookmark}
                  />
                  {savingBookmark
                    ? "Saving…"
                    : isEditing
                      ? "Save changes"
                      : "Save bookmark"}
                </button>
              </div>
            </div>
            {!isEditing && (
              <div className="w-160 space-y-2 border-slate-100 border-l pl-4 flex flex-col dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <FontAwesomeIcon icon={faListUl} />
                    Select from tabs in this window
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {selectedTabCount > 0 && (
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {selectedTabCount}{" "}
                        {selectedTabCount === 1 ? "tab" : "tabs"} selected
                      </span>
                    )}
                    <button
                      type="button"
                      className={`${actionButtonClasses} gap-2 py-1.5 px-3 text-xs`}
                      disabled={addSelectedDisabled}
                      onClick={handleAddSelectedTabs}
                    >
                      <FontAwesomeIcon
                        icon={savingBookmark ? faSpinner : faBookmark}
                        spin={savingBookmark}
                      />
                      {savingBookmark && selectedTabCount > 0
                        ? "Saving…"
                        : addSelectedLabel}
                    </button>
                  </div>
                </div>
                {!hasChromeTabsSupport ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Load the built extension to list and capture tabs from the
                    current window.
                  </p>
                ) : tabsLoading ? (
                  <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Loading tabs…
                  </p>
                ) : tabError ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {tabError}
                  </p>
                ) : tabs.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No tabs detected in this window.
                  </p>
                ) : (
                  <ul className="grow min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white text-left dark:bg-slate-800 dark:border-slate-700">
                    {orderedTabs.map((tab) => {
                      const isActive = tab.id === activeTabId;
                      const isBatchSelected = selectedTabIds.includes(tab.id);
                      const faviconSrc = tabFavicons[tab.id] ?? null;
                      const fallbackInitial = (() => {
                        const source =
                          tab.title.trim() ||
                          tab.url.replace(/^https?:\/\//i, "");
                        return source ? source.charAt(0).toUpperCase() : "•";
                      })();
                      const toggleLabel = isBatchSelected
                        ? "Deselect tab for batch add"
                        : "Select tab for batch add";
                      return (
                        <li
                          key={tab.id}
                          className="border-b border-slate-100 last:border-b-0 dark:border-slate-700"
                        >
                          <div
                            className={`flex w-full items-start gap-3 p-3 text-left transition ${
                              isActive
                                ? "bg-indigo-50/80 dark:bg-indigo-900/50"
                                : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            }`}
                          >
                            <button
                              type="button"
                              className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition ${
                                isBatchSelected
                                  ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                                  : "border-slate-300 text-slate-400 hover:border-indigo-300 dark:border-slate-600 dark:text-slate-500 dark:hover:border-indigo-500"
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
                              className="flex-1 min-w-0 flex w-full items-start gap-3 text-left"
                              onClick={() => handleSelectTab(tab)}
                            >
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
                              <span className="flex min-w-0 flex-col">
                                <span className="text-sm font-medium text-slate-900 truncate dark:text-slate-200">
                                  {tab.title}
                                </span>
                                <span className="text-xs text-slate-500 break-all truncate dark:text-slate-400">
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
