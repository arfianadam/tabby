import assert from "node:assert/strict";
import test from "node:test";
import {
  createWorkspaceEditor,
  NO_COLLECTION_MESSAGE,
  RESTORING_MESSAGE,
  type WorkspaceBusy,
  type WorkspaceEditingState,
} from "../src/features/dashboard/workspaceEditing.ts";
import type { Banner } from "../src/features/dashboard/components/types.ts";
import type { Bookmark, Collection, Folder } from "../src/types.ts";

const bookmark = (id: string): Bookmark => ({
  id,
  title: id,
  url: `https://${id}.test`,
  note: "",
  createdAt: 1,
});

const folder = (id: string, bookmarkIds: string[] = []): Folder => ({
  id,
  name: `Folder ${id}`,
  createdAt: 1,
  bookmarks: bookmarkIds.map(bookmark),
});

const collection = (folders: Folder[] = [folder("f1", ["a", "b", "c"])]) =>
  ({
    id: "c1",
    name: "Work",
    createdAt: 1,
    updatedAt: 1,
    folders,
  }) satisfies Collection;

type Setup = {
  state?: Partial<WorkspaceEditingState>;
  failWith?: unknown;
  confirmAnswer?: boolean;
};

const setup = ({ state = {}, failWith, confirmAnswer = true }: Setup = {}) => {
  const current: WorkspaceEditingState = {
    allowSync: true,
    editMode: true,
    collection: collection(),
    ...state,
  };
  const store = new Map<string, Collection>();
  if (current.collection) {
    store.set(current.collection.id, current.collection);
  }
  const notices: Banner[] = [];
  const busyLog: WorkspaceBusy[] = [];
  const confirms: string[] = [];
  const calls: string[] = [];

  const fail = () => {
    if (failWith !== undefined) {
      throw failWith;
    }
  };

  const editor = createWorkspaceEditor({
    persistence: {
      createCollection: async (name) => {
        calls.push(`create:${name}`);
        fail();
        return "new-id";
      },
      deleteCollection: async (id) => {
        calls.push(`delete:${id}`);
        fail();
      },
      applyEdit: async (id, edit) => {
        calls.push(`edit:${id}`);
        fail();
        const target = store.get(id);
        if (!target) {
          throw new Error("Collection not found.");
        }
        store.set(id, edit(target));
      },
    },
    notify: (text, tone = "info", action) =>
      notices.push(action ? { text, tone, action } : { text, tone }),
    confirm: (message) => {
      confirms.push(message);
      return confirmAnswer;
    },
    getState: () => current,
    onBusyChange: (busy) => busyLog.push(busy),
  });

  const bookmarkIds = (folderId = "f1") =>
    store
      .get("c1")
      ?.folders.find((entry) => entry.id === folderId)
      ?.bookmarks.map((entry) => entry.id);

  return {
    editor,
    current,
    store,
    notices,
    busyLog,
    confirms,
    calls,
    bookmarkIds,
  };
};

const texts = (notices: Banner[]) =>
  notices.map(({ text, tone }) => ({ text, tone }));

test("blocks every edit with one restoring notice while sync is not allowed", async () => {
  const { editor, notices, calls } = setup({ state: { allowSync: false } });

  assert.equal(
    await editor.saveBookmarks("f1", [{ title: "", url: "x.test" }]),
    false,
  );
  assert.deepEqual(texts(notices), [{ text: RESTORING_MESSAGE, tone: "info" }]);

  assert.equal(await editor.createCollection("New"), null);
  assert.equal(editor.ensureCanEdit(), false);
  assert.equal(notices.length, 3);
  assert.ok(notices.every((notice) => notice.text === RESTORING_MESSAGE));
  assert.deepEqual(calls, []);
});

test("restoring notice wins over the missing collection notice", async () => {
  const { editor, notices } = setup({
    state: { allowSync: false, collection: null },
  });
  await editor.saveBookmarks("f1", [{ title: "", url: "x.test" }]);
  assert.deepEqual(texts(notices), [{ text: RESTORING_MESSAGE, tone: "info" }]);
});

test("browse mode silently blocks edits", async () => {
  const { editor, notices, calls } = setup({ state: { editMode: false } });
  assert.equal(await editor.createFolder("Reading"), false);
  assert.equal(await editor.deleteBookmark("f1", "a"), false);
  assert.equal(editor.ensureCanEdit(), false);
  assert.deepEqual(notices, []);
  assert.deepEqual(calls, []);
});

test("collection edits require a selected collection", async () => {
  const { editor, notices, calls } = setup({ state: { collection: null } });
  assert.equal(editor.ensureCanEdit(), false);
  assert.equal(await editor.reorderFolders(["f1"]), false);
  assert.deepEqual(texts(notices), [
    { text: NO_COLLECTION_MESSAGE, tone: "danger" },
    { text: NO_COLLECTION_MESSAGE, tone: "danger" },
  ]);
  assert.deepEqual(calls, []);

  assert.equal(await editor.createCollection("  Inbox  "), "new-id");
  assert.deepEqual(calls, ["create:Inbox"]);
});

test("creating a collection trims the name and toggles its busy flag", async () => {
  const { editor, notices, busyLog, calls } = setup();
  assert.equal(await editor.createCollection("   "), null);
  assert.deepEqual(notices, []);
  assert.deepEqual(busyLog, []);

  assert.equal(await editor.createCollection("  Inbox "), "new-id");
  assert.deepEqual(calls, ["create:Inbox"]);
  assert.deepEqual(
    busyLog.map((busy) => busy.creatingCollection),
    [true, false],
  );
  assert.deepEqual(texts(notices), [
    { text: "Collection created.", tone: "success" },
  ]);
});

test("failures surface the error message, or the fallback for non-errors", async () => {
  const withError = setup({ failWith: new Error("Permission denied") });
  assert.equal(await withError.editor.createFolder("Reading"), false);
  assert.deepEqual(texts(withError.notices), [
    { text: "Permission denied", tone: "danger" },
  ]);
  assert.deepEqual(
    withError.busyLog.map((busy) => busy.creatingFolder),
    [true, false],
  );

  const withValue = setup({ failWith: "boom" });
  assert.equal(await withValue.editor.reorderBookmarks("f1", ["c"]), false);
  assert.deepEqual(texts(withValue.notices), [
    { text: "Unable to reorder bookmarks.", tone: "danger" },
  ]);
});

test("destructive edits ask for confirmation first", async () => {
  const declined = setup({ confirmAnswer: false });
  assert.equal(await declined.editor.deleteFolder(folder("f1")), false);
  assert.deepEqual(declined.confirms, [
    'Delete folder "Folder f1" and all of its bookmarks?',
  ]);
  assert.deepEqual(declined.calls, []);
  assert.deepEqual(declined.notices, []);

  const accepted = setup();
  assert.equal(await accepted.editor.deleteCollection(collection()), true);
  assert.deepEqual(accepted.confirms, [
    'Delete collection "Work" and all folders within it?',
  ]);
  assert.deepEqual(accepted.calls, ["delete:c1"]);
  assert.deepEqual(texts(accepted.notices), [
    { text: "Collection removed.", tone: "info" },
  ]);
});

test("folder names are validated and trimmed", async () => {
  const { editor, notices, store, busyLog } = setup();
  assert.equal(await editor.renameFolder(folder("f1"), "  "), false);
  assert.equal(await editor.updateFolderSettings("f1", "", "faStar"), false);
  assert.deepEqual(texts(notices), [
    { text: "Provide a folder name before saving.", tone: "danger" },
    { text: "Provide a folder name before saving.", tone: "danger" },
  ]);
  assert.deepEqual(busyLog, []);

  notices.length = 0;
  assert.equal(await editor.renameFolder(folder("f1"), "  Reading "), true);
  assert.equal(store.get("c1")?.folders[0].name, "Reading");
  assert.equal(
    await editor.updateFolderSettings("f1", " Later ", "faStar"),
    true,
  );
  assert.equal(store.get("c1")?.folders[0].name, "Later");
  assert.equal(store.get("c1")?.folders[0].icon, "faStar");
  assert.deepEqual(
    busyLog.map((busy) => busy.savingFolderSettings),
    [true, false],
  );
  assert.deepEqual(texts(notices), [
    { text: "Folder renamed.", tone: "success" },
    { text: "Folder settings updated.", tone: "success" },
  ]);
});

test("updating settings of a vanished folder is silently ignored", async () => {
  const { editor, notices, calls } = setup();
  assert.equal(await editor.updateFolderSettings("gone", "Name", ""), false);
  assert.deepEqual(notices, []);
  assert.deepEqual(calls, []);
});

test("saving bookmarks keeps only drafts with a URL", async () => {
  const { editor, notices, busyLog, store } = setup();
  const saved = await editor.saveBookmarks("f1", [
    { title: "One", url: "  one.test " },
    { title: "Empty", url: "   " },
    { title: "", url: "two.test" },
  ]);
  assert.equal(saved, true);
  const bookmarks = store.get("c1")?.folders[0].bookmarks ?? [];
  assert.deepEqual(
    bookmarks.slice(0, 2).map(({ title, url }) => ({ title, url })),
    [
      { title: "One", url: "https://one.test" },
      { title: "two.test", url: "https://two.test" },
    ],
  );
  assert.equal(bookmarks.length, 5);
  assert.deepEqual(texts(notices), [
    { text: "2 bookmarks saved.", tone: "success" },
  ]);
  assert.deepEqual(
    busyLog.map((busy) => busy.savingBookmark),
    [true, false],
  );
});

test("saving a single bookmark uses singular messages", async () => {
  const { editor, notices } = setup();
  assert.equal(
    await editor.saveBookmarks("f1", [{ title: "", url: " " }]),
    false,
  );
  assert.equal(
    await editor.saveBookmarks("f1", [{ title: "", url: "one.test" }]),
    true,
  );
  assert.deepEqual(texts(notices), [
    { text: "Provide a URL before saving a bookmark.", tone: "danger" },
    { text: "Bookmark saved.", tone: "success" },
  ]);
});

test("saving tabs without any URL reports the plural message", async () => {
  const { editor, notices, calls, busyLog } = setup();
  const saved = await editor.saveBookmarks("f1", [
    { title: "A", url: "" },
    { title: "B", url: "  " },
  ]);
  assert.equal(saved, false);
  assert.deepEqual(texts(notices), [
    { text: "None of the selected tabs have a valid URL.", tone: "danger" },
  ]);
  assert.deepEqual(calls, []);
  assert.deepEqual(busyLog, []);
});

test("saving into a vanished folder is reported", async () => {
  const { editor, notices } = setup();
  await editor.saveBookmarks("gone", [{ title: "", url: "one.test" }]);
  await editor.updateBookmark("gone", "a", { url: "one.test" });
  assert.deepEqual(texts(notices), [
    { text: "The selected folder is no longer available.", tone: "danger" },
    { text: "The selected folder is no longer available.", tone: "danger" },
  ]);
});

test("updating a bookmark validates its URL", async () => {
  const { editor, notices, store } = setup();
  assert.equal(await editor.updateBookmark("f1", "a", { url: "   " }), false);
  assert.equal(
    await editor.updateBookmark("f1", "a", {
      title: "Renamed",
      url: "a.example",
    }),
    true,
  );
  assert.deepEqual(
    store.get("c1")?.folders[0].bookmarks[0].url,
    "https://a.example",
  );
  assert.deepEqual(texts(notices), [
    { text: "Provide a URL before saving a bookmark.", tone: "danger" },
    { text: "Bookmark updated.", tone: "success" },
  ]);
});

test("deleting a bookmark offers an undo that restores it at its index", async () => {
  const { editor, notices, bookmarkIds } = setup();
  assert.equal(await editor.deleteBookmark("f1", "b"), true);
  assert.deepEqual(bookmarkIds(), ["a", "c"]);

  const [removed] = notices;
  assert.equal(removed.text, "Bookmark removed.");
  assert.equal(removed.tone, "info");
  assert.equal(removed.action?.label, "Undo");

  removed.action?.onClick();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(bookmarkIds(), ["a", "b", "c"]);
  assert.deepEqual(
    notices.slice(1).map(({ text, tone }) => ({ text, tone })),
    [{ text: "Bookmark restored.", tone: "success" }],
  );
});

test("undo still restores after edit mode is turned off", async () => {
  const { editor, notices, bookmarkIds, current } = setup();
  await editor.deleteBookmark("f1", "a");
  current.editMode = false;
  notices[0].action?.onClick();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(bookmarkIds(), ["a", "b", "c"]);
});

test("deleting a missing bookmark is reported", async () => {
  const { editor, notices, calls } = setup();
  assert.equal(await editor.deleteBookmark("f1", "zzz"), false);
  assert.deepEqual(texts(notices), [
    { text: "The selected bookmark is no longer available.", tone: "danger" },
  ]);
  assert.deepEqual(calls, []);
});

test("reorder and move apply quietly", async () => {
  const { editor, notices, bookmarkIds, store } = setup({
    state: {
      collection: collection([folder("f1", ["a", "b"]), folder("f2", ["x"])]),
    },
  });
  assert.equal(await editor.reorderBookmarks("f1", ["b", "a"]), true);
  assert.deepEqual(bookmarkIds("f1"), ["b", "a"]);
  assert.equal(await editor.moveBookmark("b", "f1", "f2", 1), true);
  assert.deepEqual(bookmarkIds("f1"), ["a"]);
  assert.deepEqual(bookmarkIds("f2"), ["x", "b"]);
  assert.equal(await editor.reorderFolders(["f2", "f1"]), true);
  assert.deepEqual(
    store.get("c1")?.folders.map((entry) => entry.id),
    ["f2", "f1"],
  );
  assert.deepEqual(notices, []);
});

test("guard state is read at call time", async () => {
  const { editor, current, notices } = setup({ state: { editMode: false } });
  assert.equal(await editor.createFolder("A"), false);
  current.editMode = true;
  assert.equal(await editor.createFolder("A"), true);
  assert.deepEqual(texts(notices), [
    { text: "Folder created.", tone: "success" },
  ]);
});
