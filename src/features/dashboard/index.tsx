import { signOut } from "firebase/auth";
import { useEffect, useState, useCallback } from "react";
import { auth } from "@/firebase/client";
import { useCollections } from "@/hooks/useCollections";
import { useSelectedCollection } from "./hooks/useSelectedCollection";
import { useBookmarkModalState } from "./hooks/useBookmarkModalState";
import { useFolderSettingsModalState } from "./hooks/useFolderSettingsModalState";
import { useDashboardNotifications } from "./hooks/useDashboardNotifications";
import { useCollectionActions } from "./hooks/useCollectionActions";
import { useFolderActions } from "./hooks/useFolderActions";
import { useBookmarkActions } from "./hooks/useBookmarkActions";
import type { Bookmark, BookmarkDraft, Collection, Folder } from "@/types";
import CollectionDetails from "./components/CollectionDetails";
import CollectionsSidebar from "./components/CollectionsSidebar";
import DashboardToasts from "./components/DashboardToasts";
import FolderSettingsModal from "./components/FolderSettingsModal";
import { panelClass } from "./components/constants";
import type { DashboardUser } from "./components/types";
import { hasChromeTabsSupport } from "@/utils/chrome";
import type { BrowserTab } from "@/utils/chrome";

type DashboardProps = {
  user: DashboardUser;
  allowSync: boolean;
  initialCollections?: Collection[];
};

const Dashboard = ({
  user,
  allowSync,
  initialCollections = [],
}: DashboardProps) => {
  const { collections, loading, error } = useCollections(
    allowSync ? user.uid : undefined,
    {
      initialData: initialCollections,
      cacheKey: allowSync ? user.uid : undefined,
    },
  );
  const [editMode, setEditMode] = useState(false);
  const editingEnabled = allowSync && editMode;
  const { selectedCollectionId, setSelectedCollectionId, selectedCollection } =
    useSelectedCollection(collections);
  const {
    bookmarkModalFolderId,
    editingBookmarkId,
    bookmarkForm,
    openBookmarkModal,
    openEditBookmarkModal,
    closeBookmarkModal,
    handleBookmarkFormChange,
  } = useBookmarkModalState(selectedCollectionId);
  const {
    settingsModalFolderId,
    folderSettingsForm,
    openFolderSettingsModal,
    closeFolderSettingsModal,
    handleFolderSettingsFormChange,
  } = useFolderSettingsModalState(selectedCollectionId);
  const {
    banner,
    renderedBanner,
    notify,
    syncToastVisible,
    syncToastShouldRender,
    handleBannerDismiss,
    handleBannerExited,
    handleSyncToastDismiss,
    handleSyncToastExited,
  } = useDashboardNotifications(allowSync);

  const {
    creatingCollection,
    guardSync,
    createCollection: createCollectionAction,
    deleteCollection: deleteCollectionAction,
  } = useCollectionActions(user.uid, allowSync, notify);

  const {
    creatingFolder,
    createFolder: createFolderAction,
    deleteFolder: deleteFolderAction,
    renameFolder: renameFolderAction,
    reorderFolders: reorderFoldersAction,
    updateFolderSettings: updateFolderSettingsAction,
  } = useFolderActions(user.uid, allowSync, notify);

  const [savingFolderSettings, setSavingFolderSettings] = useState(false);

  const {
    savingBookmark,
    saveBookmarks,
    updateBookmark,
    deleteBookmark: deleteBookmarkAction,
    reorderBookmarks: reorderBookmarksAction,
    moveBookmark: moveBookmarkAction,
  } = useBookmarkActions(user.uid, allowSync, notify);

  useEffect(() => {
    if (!allowSync) {
      closeBookmarkModal();
      closeFolderSettingsModal();
      setEditMode(false);
    }
  }, [allowSync, closeBookmarkModal, closeFolderSettingsModal]);

  useEffect(() => {
    if (!editMode) {
      closeBookmarkModal();
      closeFolderSettingsModal();
    }
  }, [editMode, closeBookmarkModal, closeFolderSettingsModal]);

  useEffect(() => {
    if (error) {
      notify(`Failed to sync collections: ${error.message}`, "danger");
    }
  }, [error, notify]);

  const handleCreateCollection = useCallback(
    (name: string) => {
      if (!editingEnabled) {
        return;
      }
      void (async () => {
        const id = await createCollectionAction(name);
        if (id) {
          setSelectedCollectionId(id);
        }
      })();
    },
    [editingEnabled, createCollectionAction, setSelectedCollectionId],
  );

  const handleDeleteCollection = useCallback(
    (collection: Collection) => {
      if (!editingEnabled) {
        return;
      }
      if (
        !window.confirm(
          `Delete collection "${collection.name}" and all folders within it?`,
        )
      ) {
        return;
      }
      void deleteCollectionAction(collection);
    },
    [editingEnabled, deleteCollectionAction],
  );

  const handleCreateFolder = useCallback(
    (name: string) => {
      if (!editingEnabled) {
        return;
      }
      void (async () => {
        await createFolderAction(selectedCollection, name);
      })();
    },
    [editingEnabled, createFolderAction, selectedCollection],
  );

  const handleDeleteFolder = useCallback(
    (folder: Folder) => {
      if (!editingEnabled) {
        return;
      }
      if (
        !window.confirm(
          `Delete folder "${folder.name}" and all of its bookmarks?`,
        )
      ) {
        return;
      }
      void deleteFolderAction(selectedCollection, folder);
    },
    [editingEnabled, deleteFolderAction, selectedCollection],
  );

  const handleRenameFolder = useCallback(
    (folder: Folder, nextName: string) => {
      if (!editingEnabled) {
        return Promise.resolve(false);
      }
      return renameFolderAction(selectedCollection, folder, nextName);
    },
    [editingEnabled, renameFolderAction, selectedCollection],
  );

  const handleOpenFolderSettings = useCallback(
    (folder: Folder) => {
      if (!editingEnabled) {
        return;
      }
      if (!selectedCollection) {
        notify("Create or select a collection first.", "danger");
        return;
      }
      if (guardSync()) {
        return;
      }
      openFolderSettingsModal(folder);
    },
    [
      editingEnabled,
      selectedCollection,
      guardSync,
      openFolderSettingsModal,
      notify,
    ],
  );

  const handleSaveFolderSettings = useCallback(
    (event: React.FormEvent<HTMLFormElement>, folderId: string) => {
      event.preventDefault();
      if (!editingEnabled) {
        return;
      }
      const folder = selectedCollection?.folders.find((f) => f.id === folderId);
      if (!folder) {
        return;
      }
      void (async () => {
        setSavingFolderSettings(true);
        try {
          const success = await updateFolderSettingsAction(
            selectedCollection,
            folder,
            folderSettingsForm.name,
            folderSettingsForm.icon,
          );
          if (success) {
            closeFolderSettingsModal();
          }
        } finally {
          setSavingFolderSettings(false);
        }
      })();
    },
    [
      editingEnabled,
      selectedCollection,
      folderSettingsForm,
      updateFolderSettingsAction,
      closeFolderSettingsModal,
    ],
  );

  const handleOpenBookmarkModal = useCallback(
    (folderId: string) => {
      if (!editingEnabled) {
        return;
      }
      if (!selectedCollection) {
        notify("Create or select a collection first.", "danger");
        return;
      }
      if (guardSync()) {
        return;
      }
      openBookmarkModal(folderId);
    },
    [editingEnabled, selectedCollection, guardSync, openBookmarkModal, notify],
  );

  const handleEditBookmark = useCallback(
    (folderId: string, bookmark: Bookmark) => {
      if (!editingEnabled) {
        return;
      }
      if (!selectedCollection) {
        notify("Create or select a collection first.", "danger");
        return;
      }
      if (guardSync()) {
        return;
      }
      openEditBookmarkModal(folderId, bookmark);
    },
    [
      editingEnabled,
      selectedCollection,
      guardSync,
      openEditBookmarkModal,
      notify,
    ],
  );

  const handleAddBookmark = useCallback(
    (event: React.FormEvent<HTMLFormElement>, folderId: string) => {
      event.preventDefault();
      if (!editingEnabled) {
        return;
      }
      void (async () => {
        if (editingBookmarkId) {
          const success = await updateBookmark(
            selectedCollection,
            folderId,
            editingBookmarkId,
            bookmarkForm,
          );
          if (success) {
            closeBookmarkModal();
          }
        } else {
          const result = await saveBookmarks(selectedCollection, folderId, [
            bookmarkForm,
          ]);
          if (result.success) {
            closeBookmarkModal();
          }
        }
      })();
    },
    [
      editingEnabled,
      editingBookmarkId,
      updateBookmark,
      selectedCollection,
      bookmarkForm,
      closeBookmarkModal,
      saveBookmarks,
    ],
  );

  const handleAddBookmarksFromTabs = useCallback(
    (folderId: string, tabsToAdd: BrowserTab[]) => {
      if (!editingEnabled) {
        return;
      }
      if (!tabsToAdd.length) {
        return;
      }
      const drafts: BookmarkDraft[] = tabsToAdd.map((tab) => ({
        title: tab.title,
        url: tab.url,
      }));
      void (async () => {
        const result = await saveBookmarks(
          selectedCollection,
          folderId,
          drafts,
        );
        if (result.success) {
          closeBookmarkModal();
        }
      })();
    },
    [editingEnabled, saveBookmarks, selectedCollection, closeBookmarkModal],
  );

  const handleDeleteBookmark = useCallback(
    (folderId: string, bookmarkId: string) => {
      if (!editingEnabled) {
        return;
      }
      void deleteBookmarkAction(selectedCollection, folderId, bookmarkId);
    },
    [editingEnabled, deleteBookmarkAction, selectedCollection],
  );

  const handleReorderFolders = useCallback(
    (orderedFolderIds: string[]) => {
      if (!editingEnabled) {
        return;
      }
      void reorderFoldersAction(selectedCollection, orderedFolderIds);
    },
    [editingEnabled, reorderFoldersAction, selectedCollection],
  );

  const handleReorderBookmarks = useCallback(
    (folderId: string, orderedBookmarkIds: string[]) => {
      if (!editingEnabled) {
        return;
      }
      void reorderBookmarksAction(
        selectedCollection,
        folderId,
        orderedBookmarkIds,
      );
    },
    [editingEnabled, reorderBookmarksAction, selectedCollection],
  );

  const handleMoveBookmark = useCallback(
    (
      bookmarkId: string,
      sourceFolderId: string,
      targetFolderId: string,
      targetIndex: number,
    ) => {
      if (!editingEnabled) {
        return;
      }
      void moveBookmarkAction(selectedCollection, {
        bookmarkId,
        sourceFolderId,
        targetFolderId,
        targetIndex,
      });
    },
    [editingEnabled, moveBookmarkAction, selectedCollection],
  );

  const noCollections = !loading && collections.length === 0;

  const handleSignOut = useCallback(() => {
    signOut(auth);
  }, []);

  return (
    <div className="h-full flex flex-col gap-2 p-3 overflow-hidden">
      <div className="grow grid gap-2 grid-cols-[auto_1fr] min-h-0 items-stretch">
        <CollectionsSidebar
          allowSync={allowSync}
          editMode={editMode}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          creatingCollection={creatingCollection}
          onCreateCollection={handleCreateCollection}
          onSelectCollection={setSelectedCollectionId}
          onDeleteCollection={handleDeleteCollection}
          noCollections={noCollections}
          loading={loading}
          user={user}
          onSignOut={handleSignOut}
          onToggleEditMode={() => setEditMode((prev) => !prev)}
        />
        {selectedCollection ? (
          <CollectionDetails
            collection={selectedCollection}
            allowSync={allowSync}
            editMode={editMode}
            onDeleteCollection={handleDeleteCollection}
            creatingFolder={creatingFolder}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onRenameFolder={handleRenameFolder}
            onOpenBookmarkModal={handleOpenBookmarkModal}
            onCloseBookmarkModal={closeBookmarkModal}
            bookmarkModalFolderId={bookmarkModalFolderId}
            bookmarkForm={bookmarkForm}
            onBookmarkFormChange={handleBookmarkFormChange}
            onAddBookmark={handleAddBookmark}
            onAddSelectedTabs={handleAddBookmarksFromTabs}
            savingBookmark={savingBookmark}
            hasChromeTabsSupport={hasChromeTabsSupport}
            onDeleteBookmark={handleDeleteBookmark}
            onReorderFolders={handleReorderFolders}
            onReorderBookmarks={handleReorderBookmarks}
            onMoveBookmark={handleMoveBookmark}
            isEditing={!!editingBookmarkId}
            onEditBookmark={handleEditBookmark}
            onOpenFolderSettings={handleOpenFolderSettings}
          />
        ) : (
          <section className={`${panelClass} grow min-h-0`}>
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {allowSync && loading
                ? "Loading your collections…"
                : "Create a collection on the left to begin."}
            </div>
          </section>
        )}
      </div>
      <DashboardToasts
        banner={banner}
        renderedBanner={renderedBanner}
        syncToastVisible={syncToastVisible}
        syncToastShouldRender={syncToastShouldRender}
        onBannerExited={handleBannerExited}
        onBannerDismiss={handleBannerDismiss}
        onSyncToastExited={handleSyncToastExited}
        onSyncToastDismiss={handleSyncToastDismiss}
      />
      <FolderSettingsModal
        folder={
          selectedCollection?.folders.find(
            (f) => f.id === settingsModalFolderId,
          ) ?? null
        }
        open={Boolean(settingsModalFolderId) && editingEnabled}
        allowSync={editingEnabled}
        folderForm={folderSettingsForm}
        onFolderFormChange={handleFolderSettingsFormChange}
        onSave={handleSaveFolderSettings}
        saving={savingFolderSettings}
        onClose={closeFolderSettingsModal}
      />
    </div>
  );
};

export default Dashboard;
