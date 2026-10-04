import type {
  Bookmark,
  BookmarkDraft,
  Collection,
  Folder,
} from "../../types.ts";
import type { Banner, BannerTone } from "./components/types.ts";
import * as edits from "./collectionEdits.ts";

export type Notify = (
  text: string,
  tone?: BannerTone,
  action?: Banner["action"],
) => void;

export type WorkspacePersistence = {
  createCollection: (name: string) => Promise<string>;
  deleteCollection: (collectionId: string) => Promise<void>;
  applyEdit: (
    collectionId: string,
    edit: edits.CollectionEdit,
  ) => Promise<void>;
};

export type WorkspaceEditingState = {
  allowSync: boolean;
  editMode: boolean;
  collection: Collection | null;
};

export type WorkspaceBusy = {
  creatingCollection: boolean;
  creatingFolder: boolean;
  savingBookmark: boolean;
  savingFolderSettings: boolean;
};

export type WorkspaceEditingDeps = {
  persistence: WorkspacePersistence;
  notify: Notify;
  confirm: (message: string) => boolean;
  getState: () => WorkspaceEditingState;
  onBusyChange?: (busy: WorkspaceBusy) => void;
};

export const idleBusy: WorkspaceBusy = {
  creatingCollection: false,
  creatingFolder: false,
  savingBookmark: false,
  savingFolderSettings: false,
};

export const RESTORING_MESSAGE = "Still restoring your workspace. Please wait…";
export const NO_COLLECTION_MESSAGE = "Create or select a collection first.";
const MISSING_FOLDER_MESSAGE = "The selected folder is no longer available.";
const MISSING_URL_MESSAGE = "Provide a URL before saving a bookmark.";
const MISSING_FOLDER_NAME_MESSAGE = "Provide a folder name before saving.";

// A planned edit: either rejected up front (null stays silent) or ready to run.
type Plan<T> =
  | { rejected: string | null }
  | {
      perform: () => Promise<T>;
      failure: string;
      success?: Banner;
      confirm?: string;
      busy?: keyof WorkspaceBusy;
    };

type Outcome<T> = { value: T } | null;

const reject = (message: string | null = null) => ({ rejected: message });

const findFolder = (collection: Collection, folderId: string) =>
  collection.folders.find((folder) => folder.id === folderId);

export const createWorkspaceEditor = (deps: WorkspaceEditingDeps) => {
  const { persistence, notify } = deps;
  let busy = idleBusy;

  const setBusy = (key: keyof WorkspaceBusy, value: boolean) => {
    busy = { ...busy, [key]: value };
    deps.onBusyChange?.(busy);
  };

  // The single "may this user edit right now" decision.
  const permit = (needsCollection: boolean) => {
    const { allowSync, editMode, collection } = deps.getState();
    if (!allowSync) {
      notify(RESTORING_MESSAGE, "info");
      return null;
    }
    if (!editMode) {
      return null;
    }
    if (needsCollection && !collection) {
      notify(NO_COLLECTION_MESSAGE, "danger");
      return null;
    }
    return { collection };
  };

  const execute = async <T>(plan: Plan<T>): Promise<Outcome<T>> => {
    if ("rejected" in plan) {
      if (plan.rejected) {
        notify(plan.rejected, "danger");
      }
      return null;
    }
    if (plan.confirm && !deps.confirm(plan.confirm)) {
      return null;
    }
    if (plan.busy) {
      setBusy(plan.busy, true);
    }
    try {
      const value = await plan.perform();
      if (plan.success) {
        notify(plan.success.text, plan.success.tone, plan.success.action);
      }
      return { value };
    } catch (err) {
      notify(err instanceof Error ? err.message : plan.failure, "danger");
      return null;
    } finally {
      if (plan.busy) {
        setBusy(plan.busy, false);
      }
    }
  };

  const editWorkspace = <T>(plan: () => Plan<T>) =>
    permit(false) ? execute(plan()) : Promise.resolve(null);

  const editCollection = <T>(plan: (collection: Collection) => Plan<T>) => {
    const collection = permit(true)?.collection;
    return collection ? execute(plan(collection)) : Promise.resolve(null);
  };

  const applyTo = (collectionId: string, edit: edits.CollectionEdit) => () =>
    persistence.applyEdit(collectionId, edit);

  const succeeded = async (outcome: Promise<Outcome<unknown>>) =>
    Boolean(await outcome);

  const restoreBookmark = (
    collectionId: string,
    folderId: string,
    bookmark: Bookmark,
    targetIndex: number,
  ) =>
    succeeded(
      execute({
        perform: applyTo(collectionId, (current) =>
          edits.restoreBookmark(current, folderId, bookmark, targetIndex),
        ),
        failure: "Unable to restore bookmark.",
        success: { text: "Bookmark restored.", tone: "success" },
      }),
    );

  return {
    ensureCanEdit: () => Boolean(permit(true)),

    createCollection: async (name: string) => {
      const outcome = await editWorkspace(() => {
        const trimmed = name.trim();
        if (!trimmed) {
          return reject();
        }
        return {
          perform: () => persistence.createCollection(trimmed),
          failure: "Unable to create collection.",
          success: { text: "Collection created.", tone: "success" },
          busy: "creatingCollection",
        };
      });
      return outcome?.value ?? null;
    },

    deleteCollection: (collection: Collection) =>
      succeeded(
        editWorkspace(() => ({
          perform: () => persistence.deleteCollection(collection.id),
          failure: "Unable to delete collection.",
          success: { text: "Collection removed.", tone: "info" },
          confirm: `Delete collection "${collection.name}" and all folders within it?`,
        })),
      ),

    createFolder: (name: string) =>
      succeeded(
        editCollection((collection) => {
          const trimmed = name.trim();
          if (!trimmed) {
            return reject();
          }
          return {
            perform: applyTo(collection.id, (current) =>
              edits.addFolder(current, trimmed),
            ),
            failure: "Unable to create folder.",
            success: { text: "Folder created.", tone: "success" },
            busy: "creatingFolder",
          };
        }),
      ),

    deleteFolder: (folder: Folder) =>
      succeeded(
        editCollection((collection) => ({
          perform: applyTo(collection.id, (current) =>
            edits.removeFolder(current, folder.id),
          ),
          failure: "Unable to delete folder.",
          success: { text: "Folder removed.", tone: "info" },
          confirm: `Delete folder "${folder.name}" and all of its bookmarks?`,
        })),
      ),

    renameFolder: (folder: Folder, name: string) =>
      succeeded(
        editCollection((collection) => {
          const trimmed = name.trim();
          if (!trimmed) {
            return reject(MISSING_FOLDER_NAME_MESSAGE);
          }
          return {
            perform: applyTo(collection.id, (current) =>
              edits.renameFolder(current, folder.id, trimmed),
            ),
            failure: "Unable to rename folder.",
            success: { text: "Folder renamed.", tone: "success" },
          };
        }),
      ),

    updateFolderSettings: (folderId: string, name: string, icon: string) =>
      succeeded(
        editCollection((collection) => {
          if (!findFolder(collection, folderId)) {
            return reject();
          }
          const trimmed = name.trim();
          if (!trimmed) {
            return reject(MISSING_FOLDER_NAME_MESSAGE);
          }
          return {
            perform: applyTo(collection.id, (current) =>
              edits.updateFolderSettings(current, folderId, trimmed, icon),
            ),
            failure: "Unable to update folder settings.",
            success: { text: "Folder settings updated.", tone: "success" },
            busy: "savingFolderSettings",
          };
        }),
      ),

    reorderFolders: (orderedFolderIds: string[]) =>
      succeeded(
        editCollection((collection) => ({
          perform: applyTo(collection.id, (current) =>
            edits.reorderFolders(current, orderedFolderIds),
          ),
          failure: "Unable to reorder folders.",
        })),
      ),

    saveBookmarks: (folderId: string, drafts: BookmarkDraft[]) =>
      succeeded(
        editCollection((collection) => {
          if (!drafts.length) {
            return reject();
          }
          if (!findFolder(collection, folderId)) {
            return reject(MISSING_FOLDER_MESSAGE);
          }
          const valid = drafts
            .map((draft) => ({ ...draft, url: draft.url.trim() }))
            .filter((draft) => draft.url);
          if (!valid.length) {
            return reject(
              drafts.length === 1
                ? MISSING_URL_MESSAGE
                : "None of the selected tabs have a valid URL.",
            );
          }
          return {
            perform: applyTo(collection.id, (current) =>
              edits.addBookmarks(current, folderId, valid),
            ),
            failure: "Unable to save bookmark.",
            success: {
              text:
                valid.length === 1
                  ? "Bookmark saved."
                  : `${valid.length} bookmarks saved.`,
              tone: "success",
            },
            busy: "savingBookmark",
          };
        }),
      ),

    updateBookmark: (
      folderId: string,
      bookmarkId: string,
      data: Partial<BookmarkDraft>,
    ) =>
      succeeded(
        editCollection((collection) => {
          if (!findFolder(collection, folderId)) {
            return reject(MISSING_FOLDER_MESSAGE);
          }
          if (data.url && !data.url.trim()) {
            return reject(MISSING_URL_MESSAGE);
          }
          return {
            perform: applyTo(collection.id, (current) =>
              edits.updateBookmark(current, folderId, bookmarkId, data),
            ),
            failure: "Unable to update bookmark.",
            success: { text: "Bookmark updated.", tone: "success" },
            busy: "savingBookmark",
          };
        }),
      ),

    deleteBookmark: (folderId: string, bookmarkId: string) =>
      succeeded(
        editCollection((collection) => {
          const folder = findFolder(collection, folderId);
          if (!folder) {
            return reject(MISSING_FOLDER_MESSAGE);
          }
          const index = folder.bookmarks.findIndex(
            (entry) => entry.id === bookmarkId,
          );
          if (index === -1) {
            return reject("The selected bookmark is no longer available.");
          }
          const bookmark = folder.bookmarks[index];
          return {
            perform: applyTo(collection.id, (current) =>
              edits.removeBookmark(current, folderId, bookmarkId),
            ),
            failure: "Unable to delete bookmark.",
            success: {
              text: "Bookmark removed.",
              tone: "info",
              action: {
                label: "Undo",
                onClick: () =>
                  void restoreBookmark(
                    collection.id,
                    folderId,
                    bookmark,
                    index,
                  ),
              },
            },
          };
        }),
      ),

    reorderBookmarks: (folderId: string, orderedBookmarkIds: string[]) =>
      succeeded(
        editCollection((collection) => ({
          perform: applyTo(collection.id, (current) =>
            edits.reorderBookmarks(current, folderId, orderedBookmarkIds),
          ),
          failure: "Unable to reorder bookmarks.",
        })),
      ),

    moveBookmark: (
      bookmarkId: string,
      sourceFolderId: string,
      targetFolderId: string,
      targetIndex: number,
    ) =>
      succeeded(
        editCollection((collection) => ({
          perform: applyTo(collection.id, (current) =>
            edits.moveBookmark(
              current,
              sourceFolderId,
              targetFolderId,
              bookmarkId,
              targetIndex,
            ),
          ),
          failure: "Unable to move bookmark between folders.",
        })),
      ),
  };
};

export type WorkspaceEditor = ReturnType<typeof createWorkspaceEditor>;
