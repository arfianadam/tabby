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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open && !savingBookmark) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, open, savingBookmark]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div
        className="absolute inset-0 bg-[#171a17]/72 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_32px_100px_rgba(0,0,0,0.34)] ${
          isEditing ? "max-w-xl" : "max-w-6xl h-[min(40rem,90vh)]"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              {isEditing ? "Edit bookmark" : "Add bookmark"}
            </p>
            <h3
              id={titleId}
              className="mt-1 text-xl font-bold tracking-tight text-[var(--ink)]"
            >
              {folder.name}
            </h3>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
            onClick={onClose}
            aria-label="Close add bookmark modal"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <form
          className="flex min-h-0 grow overflow-y-auto px-5 py-5 sm:px-6"
          onSubmit={(event) => onAddBookmark(event, folder.id)}
        >
          <div className="flex min-h-0 grow flex-col gap-6 lg:flex-row">
            <div className="min-w-0 flex-1 space-y-4">
              <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
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
              <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
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
              <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
                Note (optional)
                <textarea
                  value={bookmarkForm.note}
                  onChange={(event) =>
                    onBookmarkFormChange("note", event.target.value)
                  }
                  className={`${inputClasses} min-h-24 resize-y`}
                  disabled={!allowSync}
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
                <span className="flex items-center gap-2">
                  Custom favicon URL
                  <span className="text-xs font-normal text-[var(--muted)]">
                    (optional)
                  </span>
                </span>
                <input
                  type="url"
                  value={bookmarkForm.faviconUrl}
                  onChange={(event) =>
                    onBookmarkFormChange("faviconUrl", event.target.value)
                  }
                  placeholder="https://example.com"
                  className={inputClasses}
                  disabled={!allowSync}
                />
                <span className="text-xs font-normal text-[var(--muted)]">
                  Override the auto-detected favicon with a custom source URL
                </span>
              </label>
              <div className="flex justify-end border-t border-[var(--line)] pt-4">
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
              <div className="flex min-h-72 w-full flex-col space-y-3 border-t border-[var(--line)] pt-5 lg:min-h-0 lg:w-[54%] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                    <FontAwesomeIcon icon={faListUl} />
                    Tabs in this window
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                    {selectedTabCount > 0 && (
                      <span className="font-semibold text-[var(--ink)]">
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
                  <p className="text-xs text-[var(--muted)]">
                    Load the built extension to list and capture tabs from the
                    current window.
                  </p>
                ) : tabsLoading ? (
                  <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Loading tabs…
                  </p>
                ) : tabError ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {tabError}
                  </p>
                ) : tabs.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">
                    No tabs detected in this window.
                  </p>
                ) : (
                  <ul className="soft-scrollbar min-h-0 grow overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] text-left">
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
                          className="border-b border-[var(--line)] last:border-b-0"
                        >
                          <div
                            className={`flex w-full items-start gap-3 p-3 text-left transition ${
                              isActive
                                ? "bg-orange-500/8"
                                : "hover:bg-[var(--surface-muted)]"
                            }`}
                          >
                            <button
                              type="button"
                              className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition ${
                                isBatchSelected
                                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
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
                              className="flex-1 min-w-0 flex w-full items-start gap-3 text-left"
                              onClick={() => handleSelectTab(tab)}
                            >
                              <span className="h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
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
                                <span className="truncate text-sm font-semibold text-[var(--ink)]">
                                  {tab.title}
                                </span>
                                <span className="truncate break-all text-xs text-[var(--muted)]">
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
