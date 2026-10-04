import assert from "node:assert/strict";
import test from "node:test";
import {
  addBookmarks,
  addFolder,
  moveBetweenLists,
  moveBookmark,
  moveWithinList,
  normalizeCollection,
  normalizeUrl,
  removeBookmark,
  removeFolder,
  renameFolder,
  reorderBookmarks,
  reorderFolders,
  restoreBookmark,
  updateBookmark,
  updateFolderSettings,
  type EditEnv,
} from "../src/features/dashboard/collectionEdits.ts";
import type { Bookmark, Collection, Folder } from "../src/types.ts";

const testEnv = (): EditEnv => {
  let counter = 0;
  return {
    generateId: () => `id-${++counter}`,
    now: () => 1000,
  };
};

const bookmark = (id: string, extra: Partial<Bookmark> = {}): Bookmark => ({
  id,
  title: id,
  url: `https://${id}.test`,
  note: "",
  createdAt: 1,
  ...extra,
});

const folder = (id: string, bookmarkIds: string[] = []): Folder => ({
  id,
  name: id,
  createdAt: 1,
  bookmarks: bookmarkIds.map((bookmarkId) => bookmark(bookmarkId)),
});

const collection = (...folders: Folder[]): Collection => ({
  id: "c",
  name: "Collection",
  createdAt: 1,
  updatedAt: 1,
  folders,
});

const ids = (value: Collection, folderId: string) =>
  value.folders
    .find((entry) => entry.id === folderId)!
    .bookmarks.map((entry) => entry.id);

const findFolder = (value: Collection, folderId: string) =>
  value.folders.find((entry) => entry.id === folderId)!;

test("id-list move helpers clamp the index and dedupe", () => {
  const key = (id: string) => id;
  assert.deepEqual(moveWithinList(["a", "b", "c"], "a", 2, key), [
    "b",
    "c",
    "a",
  ]);
  assert.deepEqual(moveWithinList(["a", "b", "c"], "c", -5, key), [
    "c",
    "a",
    "b",
  ]);
  assert.deepEqual(moveBetweenLists(["a", "b"], ["x"], "a", 99, key), {
    source: ["b"],
    target: ["x", "a"],
  });
});

test("moves a bookmark within a folder with index clamping", () => {
  const start = collection(folder("f", ["a", "b", "c"]));
  assert.deepEqual(ids(moveBookmark(start, "f", "f", "a", 1), "f"), [
    "b",
    "a",
    "c",
  ]);
  assert.deepEqual(ids(moveBookmark(start, "f", "f", "a", 10), "f"), [
    "b",
    "c",
    "a",
  ]);
  assert.deepEqual(ids(moveBookmark(start, "f", "f", "c", -1), "f"), [
    "c",
    "a",
    "b",
  ]);
});

test("moves a bookmark across folders with index clamping", () => {
  const start = collection(folder("s", ["a", "b"]), folder("t", ["x", "y"]));

  const middle = moveBookmark(start, "s", "t", "a", 1);
  assert.deepEqual(ids(middle, "s"), ["b"]);
  assert.deepEqual(ids(middle, "t"), ["x", "a", "y"]);

  const end = moveBookmark(start, "s", "t", "b", 50);
  assert.deepEqual(ids(end, "t"), ["x", "y", "b"]);

  const negative = moveBookmark(start, "s", "t", "b", -1);
  assert.deepEqual(ids(negative, "t"), ["b", "x", "y"]);
});

test("move ignores an empty bookmark id and reports missing entities", () => {
  const start = collection(folder("s", ["a"]), folder("t"));
  assert.equal(moveBookmark(start, "s", "t", "", 0), start);
  assert.throws(() => moveBookmark(start, "nope", "t", "a", 0), {
    message: "Source folder not found.",
  });
  assert.throws(() => moveBookmark(start, "s", "t", "zzz", 0), {
    message: "Bookmark not found in source folder.",
  });
  assert.throws(() => moveBookmark(start, "s", "nope", "a", 0), {
    message: "Target folder not found.",
  });
});

test("reorders bookmarks, skipping unknown ids and keeping missing ones last", () => {
  const start = collection(folder("f", ["a", "b", "c", "d"]));
  assert.deepEqual(
    ids(reorderBookmarks(start, "f", ["c", "ghost", "a"]), "f"),
    ["c", "a", "b", "d"],
  );
  const unchanged = reorderBookmarks(start, "f", []);
  assert.equal(findFolder(unchanged, "f"), findFolder(start, "f"));
  assert.throws(() => reorderBookmarks(start, "nope", ["a"]), {
    message: "Folder not found.",
  });
});

test("reorders folders, skipping unknown ids and keeping missing ones last", () => {
  const start = collection(folder("a"), folder("b"), folder("c"));
  assert.deepEqual(
    reorderFolders(start, ["c", "ghost"]).folders.map((entry) => entry.id),
    ["c", "a", "b"],
  );
  assert.equal(reorderFolders(start, []), start);
});

test("restores a bookmark at an index, deduping an existing copy", () => {
  const start = collection(folder("f", ["a", "b", "c"]));
  assert.deepEqual(ids(restoreBookmark(start, "f", bookmark("z"), 1), "f"), [
    "a",
    "z",
    "b",
    "c",
  ]);
  const restored = restoreBookmark(
    start,
    "f",
    bookmark("a", { title: "Restored" }),
    2,
  );
  assert.deepEqual(ids(restored, "f"), ["b", "c", "a"]);
  assert.equal(findFolder(restored, "f").bookmarks[2].title, "Restored");
  assert.deepEqual(ids(restoreBookmark(start, "f", bookmark("z"), 99), "f"), [
    "a",
    "b",
    "c",
    "z",
  ]);
  assert.throws(() => restoreBookmark(start, "nope", bookmark("z"), 0), {
    message: "Folder not found.",
  });
});

test("adds bookmarks with URL normalisation, empty-URL filtering and title fallback", () => {
  const start = collection(folder("f", ["old"]));
  const next = addBookmarks(
    start,
    "f",
    [
      { title: "  Example  ", url: " example.com ", note: " hi " },
      { title: "", url: "http://plain.test", faviconUrl: " https://i.test " },
      { title: "Skipped", url: "   " },
      { title: "Secure", url: "HTTPS://Secure.test", faviconUrl: "  " },
    ],
    testEnv(),
  );

  assert.deepEqual(findFolder(next, "f").bookmarks, [
    {
      id: "id-1",
      title: "Example",
      url: "https://example.com",
      note: "hi",
      createdAt: 1000,
    },
    {
      id: "id-2",
      title: "http://plain.test",
      url: "http://plain.test",
      note: "",
      createdAt: 1000,
      faviconUrl: "https://i.test",
    },
    {
      id: "id-3",
      title: "Secure",
      url: "HTTPS://Secure.test",
      note: "",
      createdAt: 1000,
    },
    bookmark("old"),
  ]);
});

test("adding bookmarks requires a URL and an existing folder", () => {
  const start = collection(folder("f"));
  assert.throws(() => addBookmarks(start, "f", [{ title: "x", url: " " }]), {
    message: "Provide at least one URL to save a bookmark.",
  });
  assert.throws(
    () => addBookmarks(start, "nope", [{ title: "x", url: "x.test" }]),
    { message: "Folder not found." },
  );
});

test("updates a bookmark, setting and clearing the favicon", () => {
  const start = collection(folder("f", []), {
    ...folder("g"),
    bookmarks: [bookmark("a", { faviconUrl: "https://old.test/icon" })],
  });

  const untouched = updateBookmark(start, "g", "a", { title: "  " });
  assert.deepEqual(findFolder(untouched, "g").bookmarks[0], {
    ...bookmark("a", { faviconUrl: "https://old.test/icon" }),
    title: "Untitled bookmark",
  });

  const set = updateBookmark(start, "g", "a", {
    url: "new.test",
    note: " n ",
    faviconUrl: " https://new.test/icon ",
  });
  assert.deepEqual(findFolder(set, "g").bookmarks[0], {
    ...bookmark("a"),
    url: "https://new.test",
    note: "n",
    faviconUrl: "https://new.test/icon",
  });

  const cleared = updateBookmark(start, "g", "a", { faviconUrl: "  " });
  assert.equal("faviconUrl" in findFolder(cleared, "g").bookmarks[0], false);

  assert.throws(() => updateBookmark(start, "nope", "a", {}), {
    message: "Folder not found.",
  });
  assert.throws(() => updateBookmark(start, "g", "zzz", {}), {
    message: "Bookmark not found.",
  });
});

test("folder settings drop the default or empty icon", () => {
  const start = collection({ ...folder("f"), icon: "faStar" });

  const custom = updateFolderSettings(start, "f", "  Work ", "faBook");
  assert.equal(findFolder(custom, "f").name, "Work");
  assert.equal(findFolder(custom, "f").icon, "faBook");

  for (const icon of ["faFolderOpen", ""]) {
    const reset = updateFolderSettings(start, "f", " ", icon);
    assert.equal(findFolder(reset, "f").name, "Untitled folder");
    assert.equal("icon" in findFolder(reset, "f"), false);
  }

  assert.throws(() => updateFolderSettings(start, "nope", "x", "faBook"), {
    message: "Folder not found.",
  });
});

test("adds, renames and removes folders", () => {
  const added = addFolder(collection(folder("a")), "  ", testEnv());
  assert.deepEqual(added.folders[1], {
    id: "id-1",
    name: "Untitled folder",
    createdAt: 1000,
    bookmarks: [],
  });

  const renamed = renameFolder(added, "id-1", " Reading ");
  assert.equal(findFolder(renamed, "id-1").name, "Reading");
  assert.throws(() => renameFolder(added, "nope", "x"), {
    message: "Folder not found.",
  });

  assert.deepEqual(
    removeFolder(renamed, "a").folders.map((entry) => entry.id),
    ["id-1"],
  );
});

test("removes a bookmark from a folder", () => {
  const start = collection(folder("f", ["a", "b"]), folder("g", ["a"]));
  const next = removeBookmark(start, "f", "a");
  assert.deepEqual(ids(next, "f"), ["b"]);
  assert.deepEqual(ids(next, "g"), ["a"]);
});

test("normalizes a raw collection snapshot", () => {
  const normalized = normalizeCollection(
    "c1",
    {
      name: "  ",
      folders: [
        {
          name: "",
          bookmarks: [{ title: " ", faviconUrl: " " } as Bookmark],
        } as unknown as Folder,
      ],
    },
    testEnv(),
  );
  assert.deepEqual(normalized, {
    id: "c1",
    name: "Untitled collection",
    createdAt: 1000,
    updatedAt: 1000,
    folders: [
      {
        id: "id-1",
        name: "Untitled folder",
        createdAt: 1000,
        bookmarks: [
          {
            id: "id-2",
            title: "Untitled bookmark",
            url: "",
            note: "",
            createdAt: 1000,
          },
        ],
      },
    ],
  });
});

test("edits do not mutate the input collection", () => {
  const start = collection(folder("s", ["a", "b"]), folder("t", ["x"]));
  const snapshot = structuredClone(start);
  moveBookmark(start, "s", "t", "a", 0);
  restoreBookmark(start, "s", bookmark("z"), 0);
  updateBookmark(start, "s", "a", { faviconUrl: "" });
  updateFolderSettings(start, "s", "x", "faFolderOpen");
  assert.deepEqual(start, snapshot);
});

test("urls keep any scheme and default to https without one", () => {
  assert.equal(
    normalizeUrl(" chrome://inspect/#remote-debugging "),
    "chrome://inspect/#remote-debugging",
  );
  assert.equal(normalizeUrl("file:///tmp/a.html"), "file:///tmp/a.html");
  assert.equal(normalizeUrl("about:blank"), "about:blank");
  assert.equal(normalizeUrl("http://plain.test"), "http://plain.test");
  assert.equal(normalizeUrl("example.com"), "https://example.com");
  assert.equal(normalizeUrl("localhost:3000"), "https://localhost:3000");
});
