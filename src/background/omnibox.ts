import type { Collection } from "../types.ts";

export const OMNIBOX_INDEX_KEY = "tabby:omniboxIndex:v1";

export type OmniboxBookmarkEntry = {
  title: string;
  url: string;
  note?: string;
  folderName: string;
  collectionName: string;
};

export type OmniboxSuggestion = {
  content: string;
  description: string;
};

export const buildOmniboxIndex = (
  collections: readonly Collection[],
): OmniboxBookmarkEntry[] => {
  const entries: OmniboxBookmarkEntry[] = [];
  for (const collection of collections) {
    for (const folder of collection.folders) {
      for (const bookmark of folder.bookmarks) {
        const url = bookmark.url.trim();
        if (!url) continue;
        const entry: OmniboxBookmarkEntry = {
          title: bookmark.title.trim() || url,
          url,
          folderName: folder.name,
          collectionName: collection.name,
        };
        const note = bookmark.note?.trim();
        if (note) {
          entry.note = note;
        }
        entries.push(entry);
      }
    }
  }
  return entries;
};

export const escapeOmniboxXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const getDisplayHost = (url: string): string => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    const compact = `${host}${path}`;
    return compact.length > 48 ? `${compact.slice(0, 47)}…` : compact;
  } catch {
    return url.length > 48 ? `${url.slice(0, 47)}…` : url;
  }
};

const highlightText = (text: string, tokens: readonly string[]): string => {
  if (!tokens.length || !text) {
    return escapeOmniboxXml(text);
  }

  const lower = text.toLowerCase();
  const ranges: Array<[number, number]> = [];

  for (const token of tokens) {
    let start = 0;
    while (start < lower.length) {
      const idx = lower.indexOf(token, start);
      if (idx === -1) break;
      ranges.push([idx, idx + token.length]);
      start = idx + token.length;
    }
  }

  if (!ranges.length) {
    return escapeOmniboxXml(text);
  }

  ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged: Array<[number, number]> = [ranges[0]];
  for (let i = 1; i < ranges.length; i += 1) {
    const prev = merged[merged.length - 1];
    const curr = ranges[i];
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }

  let cursor = 0;
  let result = "";
  for (const [start, end] of merged) {
    if (start > cursor) {
      result += escapeOmniboxXml(text.slice(cursor, start));
    }
    result += `<match>${escapeOmniboxXml(text.slice(start, end))}</match>`;
    cursor = end;
  }
  if (cursor < text.length) {
    result += escapeOmniboxXml(text.slice(cursor));
  }
  return result;
};

const tokenize = (query: string): string[] =>
  query.trim().toLowerCase().split(/\s+/).filter(Boolean);

const scoreEntry = (
  entry: OmniboxBookmarkEntry,
  tokens: readonly string[],
): number => {
  const title = entry.title.toLowerCase();
  const url = entry.url.toLowerCase();
  const host = getDisplayHost(entry.url).toLowerCase();
  const note = (entry.note ?? "").toLowerCase();
  const folder = entry.folderName.toLowerCase();
  const collection = entry.collectionName.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (title.startsWith(token)) {
      score += 120;
    } else if (title.includes(token)) {
      score += 80;
    } else if (host.startsWith(token)) {
      score += 65;
    } else if (url.includes(token)) {
      score += 45;
    } else if (folder.includes(token)) {
      score += 30;
    } else if (collection.includes(token)) {
      score += 20;
    } else if (note.includes(token)) {
      score += 15;
    } else {
      return -1;
    }
  }

  return score;
};

export const searchOmniboxEntries = (
  entries: readonly OmniboxBookmarkEntry[],
  query: string,
  limit = 6,
): OmniboxBookmarkEntry[] => {
  const tokens = tokenize(query);
  if (!tokens.length) {
    return entries.slice(0, limit);
  }

  const scored: Array<{
    entry: OmniboxBookmarkEntry;
    score: number;
    idx: number;
  }> = [];
  entries.forEach((entry, idx) => {
    const score = scoreEntry(entry, tokens);
    if (score >= 0) {
      scored.push({ entry, score, idx });
    }
  });

  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
  return scored.slice(0, limit).map((item) => item.entry);
};

export const formatOmniboxSuggestion = (
  entry: OmniboxBookmarkEntry,
  query: string,
): OmniboxSuggestion => {
  const tokens = tokenize(query);
  const title = highlightText(entry.title, tokens);
  const host = escapeOmniboxXml(getDisplayHost(entry.url));
  const path = escapeOmniboxXml(
    `${entry.collectionName} › ${entry.folderName}`,
  );

  return {
    content: entry.url,
    description: `${title} <dim>— ${path}</dim> <url>${host}</url>`,
  };
};

export const formatDefaultSuggestion = (
  entries: readonly OmniboxBookmarkEntry[],
  matches: readonly OmniboxBookmarkEntry[],
  query: string,
): string => {
  if (!entries.length) {
    return "Open Tabby to sign in and sync your links";
  }
  const trimmed = query.trim();
  if (!trimmed) {
    return `Search ${entries.length} Tabby ${entries.length === 1 ? "link" : "links"}…`;
  }
  const top = matches[0];
  if (!top) {
    return `No Tabby links matching <match>${escapeOmniboxXml(trimmed)}</match> — press Enter to open Tabby`;
  }
  const title = highlightText(top.title, tokenize(trimmed));
  const path = escapeOmniboxXml(`${top.collectionName} › ${top.folderName}`);
  return `Open ${title} <dim>— ${path}</dim>`;
};

export const resolveEnteredUrl = (
  entries: readonly OmniboxBookmarkEntry[],
  text: string,
  fallbackUrl: string,
): string => {
  const trimmed = text.trim();
  if (!trimmed) {
    return fallbackUrl;
  }

  const exactMatch = entries.find((entry) => entry.url === trimmed);
  if (exactMatch) {
    return exactMatch.url;
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const [topMatch] = searchOmniboxEntries(entries, trimmed, 1);
  return topMatch ? topMatch.url : fallbackUrl;
};
