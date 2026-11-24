import type { Collection } from "@/types";
import { OMNIBOX_INDEX_KEY, buildOmniboxIndex } from "@/background/omnibox";

let lastWrittenPayload: string | null = null;

const hasChromeLocalStorage = () =>
  typeof chrome !== "undefined" && Boolean(chrome.storage?.local);

export const syncOmniboxIndex = (collections: readonly Collection[]) => {
  if (!hasChromeLocalStorage()) {
    return;
  }
  const entries = buildOmniboxIndex(collections);
  const serialized = JSON.stringify(entries);
  if (serialized === lastWrittenPayload) {
    return;
  }
  lastWrittenPayload = serialized;
  void chrome.storage.local.set({ [OMNIBOX_INDEX_KEY]: entries }).catch(() => {
    lastWrittenPayload = null;
  });
};

export const clearOmniboxIndex = () => {
  lastWrittenPayload = null;
  if (!hasChromeLocalStorage()) {
    return;
  }
  void chrome.storage.local.remove(OMNIBOX_INDEX_KEY).catch(() => {
    // Ignore storage removal errors.
  });
};
