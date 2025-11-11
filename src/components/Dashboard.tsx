import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../firebase/client";
import { useCollections } from "../hooks/useCollections";
import { useSelectedCollection } from "../hooks/dashboard/useSelectedCollection";
import { useBookmarkModalState } from "../hooks/dashboard/useBookmarkModalState";
import { useDashboardNotifications } from "../hooks/dashboard/useDashboardNotifications";
import { useCollectionActions } from "../hooks/dashboard/useCollectionActions";
import type { BookmarkDraft, Collection, Folder } from "../types";
import CollectionDetails from "./dashboard/CollectionDetails";
import CollectionsSidebar from "./dashboard/CollectionsSidebar";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardToasts from "./dashboard/DashboardToasts";
import { panelClass } from "./dashboard/constants";
import type { DashboardUser } from "./dashboard/types";
import { hasChromeTabsSupport } from "../utils/chrome";
import type { BrowserTab } from "../utils/chrome";

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
  const [newCollection, setNewCollection] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const { selectedCollectionId, setSelectedCollectionId, selectedCollection } =
    useSelectedCollection(collections);
  const {
    bookmarkModalFolderId,
    bookmarkForm,
    openBookmarkModal,
    closeBookmarkModal,
    handleBookmarkFormChange,
  } = useBookmarkModalState(selectedCollectionId);
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
    creatingFolder,
    savingBookmark,
    guardSync,
    createCollection: createCollectionAction,
    deleteCollection: deleteCollectionAction,
    createFolder: createFolderAction,
    deleteFolder: deleteFolderAction,
    renameFolder: renameFolderAction,
    saveBookmarks,
    deleteBookmark: deleteBookmarkAction,
    reorderFolders: reorderFoldersAction,
    reorderBookmarks: reorderBookmarksAction,
    moveBookmark: moveBookmarkAction,
  } = useCollectionActions(user.uid, allowSync, notify);

  useEffect(() => {
    if (!allowSync) {
      closeBookmarkModal();
    }
  }, [allowSync, closeBookmarkModal]);

  useEffect(() => {
    if (error) {
      notify(`Failed to sync collections: ${error.message}`, "danger");
    }
  }, [error, notify]);

  const handleCreateCollection = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void (async () => {
      const id = await createCollectionAction(newCollection);
      if (id) {
        setNewCollection("");
        setSelectedCollectionId(id);
      }
    })();
  };

  const handleDeleteCollection = (collection: Collection) => {
    if (
      !window.confirm(
        `Delete collection "${collection.name}" and all folders within it?`,
      )
    ) {
      return;
    }
    void deleteCollectionAction(collection);
  };

  const handleCreateFolder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void (async () => {
      const created = await createFolderAction(selectedCollection, newFolder);
      if (created) {
        setNewFolder("");
      }
    })();
  };

  const handleDeleteFolder = (folder: Folder) => {
    if (
      !window.confirm(
        `Delete folder "${folder.name}" and all of its bookmarks?`,
      )
    ) {
      return;
    }
    void deleteFolderAction(selectedCollection, folder);
  };

  const handleRenameFolder = (folder: Folder, nextName: string) =>
    renameFolderAction(selectedCollection, folder, nextName);

  const handleOpenBookmarkModal = (folderId: string) => {
    if (!selectedCollection) {
      notify("Create or select a collection first.", "danger");
      return;
    }
    if (guardSync()) {
      return;
    }
    openBookmarkModal(folderId);
  };

  const handleAddBookmark = (
    event: React.FormEvent<HTMLFormElement>,
    folderId: string,
  ) => {
    event.preventDefault();
    void (async () => {
      const result = await saveBookmarks(selectedCollection, folderId, [
        bookmarkForm,
      ]);
      if (result.success) {
        closeBookmarkModal();
      }
    })();
  };

  const handleAddBookmarksFromTabs = (
    folderId: string,
    tabsToAdd: BrowserTab[],
  ) => {
    if (!tabsToAdd.length) {
      return;
    }
    const drafts: BookmarkDraft[] = tabsToAdd.map((tab) => ({
      title: tab.title,
      url: tab.url,
    }));
    void (async () => {
      const result = await saveBookmarks(selectedCollection, folderId, drafts);
      if (result.success) {
        closeBookmarkModal();
      }
    })();
  };

  const handleDeleteBookmark = (folderId: string, bookmarkId: string) => {
    void deleteBookmarkAction(selectedCollection, folderId, bookmarkId);
  };

  const handleReorderFolders = (orderedFolderIds: string[]) => {
    void reorderFoldersAction(selectedCollection, orderedFolderIds);
  };

  const handleReorderBookmarks = (
    folderId: string,
    orderedBookmarkIds: string[],
  ) => {
    void reorderBookmarksAction(
      selectedCollection,
      folderId,
      orderedBookmarkIds,
    );
  };

  const handleMoveBookmark = (
    bookmarkId: string,
    sourceFolderId: string,
    targetFolderId: string,
    targetIndex: number,
  ) => {
    void moveBookmarkAction(selectedCollection, {
      bookmarkId,
      sourceFolderId,
      targetFolderId,
      targetIndex,
    });
  };

  const noCollections = !loading && collections.length === 0;

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="h-full flex flex-col gap-2 p-3 overflow-hidden">
      <DashboardHeader
        allowSync={allowSync}
        user={user}
        onSignOut={handleSignOut}
      />
      <div className="grow grid gap-2 grid-cols-[260px_1fr] min-h-0 items-stretch">
        <CollectionsSidebar
          allowSync={allowSync}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          newCollection={newCollection}
          onNewCollectionChange={setNewCollection}
          creatingCollection={creatingCollection}
          onCreateCollection={handleCreateCollection}
          onSelectCollection={setSelectedCollectionId}
          onDeleteCollection={handleDeleteCollection}
          noCollections={noCollections}
          loading={loading}
        />
        {selectedCollection ? (
          <CollectionDetails
            collection={selectedCollection}
            allowSync={allowSync}
            onDeleteCollection={handleDeleteCollection}
            newFolder={newFolder}
            onNewFolderChange={setNewFolder}
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
          />
        ) : (
          <section className={`${panelClass} grow min-h-0`}>
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
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
    </div>
  );
};

export default Dashboard;
