import {
  OMNIBOX_INDEX_KEY,
  formatDefaultSuggestion,
  formatOmniboxSuggestion,
  resolveEnteredUrl,
  searchOmniboxEntries,
  type OmniboxBookmarkEntry,
} from "./omnibox";

let cachedEntries: OmniboxBookmarkEntry[] | null = null;

const isValidEntries = (value: unknown): value is OmniboxBookmarkEntry[] =>
  Array.isArray(value);

const loadEntries = async (): Promise<OmniboxBookmarkEntry[]> => {
  if (cachedEntries !== null) {
    return cachedEntries;
  }
  try {
    const result = await chrome.storage.local.get(OMNIBOX_INDEX_KEY);
    const stored = result[OMNIBOX_INDEX_KEY];
    cachedEntries = isValidEntries(stored) ? stored : [];
  } catch {
    cachedEntries = [];
  }
  return cachedEntries;
};

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !(OMNIBOX_INDEX_KEY in changes)) {
    return;
  }
  const next = changes[OMNIBOX_INDEX_KEY]?.newValue;
  cachedEntries = isValidEntries(next) ? next : [];
});

chrome.omnibox.onInputStarted.addListener(() => {
  void loadEntries().then((entries) => {
    chrome.omnibox.setDefaultSuggestion({
      description: formatDefaultSuggestion(entries, entries, ""),
    });
  });
});

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  void loadEntries().then((entries) => {
    const matches = searchOmniboxEntries(entries, text, 6);
    chrome.omnibox.setDefaultSuggestion({
      description: formatDefaultSuggestion(entries, matches, text),
    });
    // When the top match is shown in the default suggestion, still list all matches
    // (or remaining matches when the query is non-empty) so arrowing down stays intuitive.
    const suggestionMatches = text.trim() ? matches.slice(1) : matches;
    suggest(
      suggestionMatches.map((entry) => formatOmniboxSuggestion(entry, text)),
    );
  });
});

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  void loadEntries().then((entries) => {
    const fallbackUrl = chrome.runtime.getURL("index.html");
    const url = resolveEnteredUrl(entries, text, fallbackUrl);

    if (disposition === "newForegroundTab") {
      void chrome.tabs.create({ url, active: true });
    } else if (disposition === "newBackgroundTab") {
      void chrome.tabs.create({ url, active: false });
    } else {
      void chrome.tabs.update({ url });
    }
  });
});
