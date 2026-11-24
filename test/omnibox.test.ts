import assert from "node:assert/strict";
import test from "node:test";
import type { Collection } from "../src/types.ts";
import {
  buildOmniboxIndex,
  escapeOmniboxXml,
  formatDefaultSuggestion,
  formatOmniboxSuggestion,
  resolveEnteredUrl,
  searchOmniboxEntries,
} from "../src/background/omnibox.ts";

const sampleCollections: Collection[] = [
  {
    id: "c1",
    name: "Work & Design",
    createdAt: 1,
    updatedAt: 1,
    folders: [
      {
        id: "f1",
        name: "Tools",
        createdAt: 1,
        bookmarks: [
          {
            id: "b1",
            title: "Figma <App> & Specs",
            url: "https://www.figma.com/files/recent",
            note: "design tokens",
            createdAt: 1,
          },
          {
            id: "b2",
            title: "GitHub Dashboard",
            url: "https://github.com/pulls",
            note: "code reviews",
            createdAt: 2,
          },
          {
            id: "b3",
            title: "Missing URL",
            url: "   ",
            createdAt: 3,
          },
        ],
      },
    ],
  },
  {
    id: "c2",
    name: "Personal",
    createdAt: 2,
    updatedAt: 2,
    folders: [
      {
        id: "f2",
        name: "Reading",
        createdAt: 2,
        bookmarks: [
          {
            id: "b4",
            title: "My Figma Notes",
            url: "https://notes.example.com/figma",
            createdAt: 4,
          },
        ],
      },
    ],
  },
];

test("buildOmniboxIndex flattens valid bookmarks and drops blank URLs", () => {
  const index = buildOmniboxIndex(sampleCollections);
  assert.equal(index.length, 3);
  assert.deepEqual(index[0], {
    title: "Figma <App> & Specs",
    url: "https://www.figma.com/files/recent",
    note: "design tokens",
    folderName: "Tools",
    collectionName: "Work & Design",
  });
  assert.equal("note" in index[2], false);
});

test("searchOmniboxEntries ranks title prefixes above substring and note matches", () => {
  const index = buildOmniboxIndex(sampleCollections);

  const figmaMatches = searchOmniboxEntries(index, "figma");
  assert.deepEqual(
    figmaMatches.map((entry) => entry.url),
    ["https://www.figma.com/files/recent", "https://notes.example.com/figma"],
  );

  const multiToken = searchOmniboxEntries(index, "work reviews");
  assert.deepEqual(
    multiToken.map((entry) => entry.url),
    ["https://github.com/pulls"],
  );

  assert.equal(searchOmniboxEntries(index, "", 2).length, 2);
});

test("formatOmniboxSuggestion escapes XML characters and highlights matched tokens", () => {
  const index = buildOmniboxIndex(sampleCollections);
  const suggestion = formatOmniboxSuggestion(index[0], "figma &");

  assert.equal(suggestion.content, "https://www.figma.com/files/recent");
  assert.equal(
    suggestion.description,
    "<match>Figma</match> &lt;App&gt; <match>&amp;</match> Specs <dim>— Work &amp; Design › Tools</dim> <url>figma.com/files/recent</url>",
  );
  assert.equal(
    escapeOmniboxXml(`a & <b> "c" 'd'`),
    "a &amp; &lt;b&gt; &quot;c&quot; &apos;d&apos;",
  );
});

test("formatDefaultSuggestion reflects empty, matching, and non-matching states", () => {
  const index = buildOmniboxIndex(sampleCollections);
  assert.match(formatDefaultSuggestion([], [], ""), /sign in/i);
  assert.equal(
    formatDefaultSuggestion(index, index, ""),
    "Search 3 Tabby links…",
  );
  assert.equal(
    formatDefaultSuggestion(index, [index[1]], "git"),
    "Open <match>Git</match>Hub Dashboard <dim>— Work &amp; Design › Tools</dim>",
  );
  assert.match(
    formatDefaultSuggestion(index, [], "nope"),
    /No Tabby links matching <match>nope<\/match>/,
  );
});

test("resolveEnteredUrl opens selected suggestion, top query match, or fallback", () => {
  const index = buildOmniboxIndex(sampleCollections);
  const fallback = "chrome-extension://abc/index.html";

  assert.equal(
    resolveEnteredUrl(index, "https://github.com/pulls", fallback),
    "https://github.com/pulls",
  );
  assert.equal(
    resolveEnteredUrl(index, "figma", fallback),
    "https://www.figma.com/files/recent",
  );
  assert.equal(resolveEnteredUrl(index, "unmatched-term", fallback), fallback);
  assert.equal(resolveEnteredUrl(index, "   ", fallback), fallback);
});
