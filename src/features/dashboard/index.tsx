import { signOut } from "firebase/auth";
import { useEffect, useState, useCallback } from "react";
import { auth } from "@/firebase/client";
import { useCollectionSync } from "./hooks/useCollectionSync";
import { useSelectedCollection } from "./hooks/useSelectedCollection";
import { useBookmarkModalState } from "./hooks/useBookmarkModalState";
import { useFolderSettingsModalState } from "./hooks/useFolderSettingsModalState";
import { useDashboardNotifications } from "./hooks/useDashboardNotifications";
import { useWorkspaceEditing } from "./hooks/useWorkspaceEditing";
import CollectionDetails from "./components/CollectionDetails";
import CollectionsSidebar from "./components/CollectionsSidebar";
import DashboardToasts from "./components/DashboardToasts";
import FolderSettingsModal from "./components/FolderSettingsModal";
import { panelClass } from "./components/constants";
import type { DashboardUser } from "./components/types";

type DashboardProps = {
  user: DashboardUser;
  allowSync: boolean;
  cacheReady: boolean;
};

const SIDEBAR_COLLAPSED_TRACK = "5rem";
const SIDEBAR_EXPANDED_TRACK = "16.75rem";

const getInitialSidebarCollapsed = () => {
  try {
    return localStorage.getItem("tabby-sidebar-collapsed") === "true";
  } catch {
    return false;
  }
};

const Dashboard = ({ user, allowSync, cacheReady }: DashboardProps) => {
  const {
    collections,
    source: syncSource,
    loading,
    error,
  } = useCollectionSync({ uid: user.uid, allowSync, cacheReady });
  const [editMode, setEditMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialSidebarCollapsed,
  );
  const { selectedCollectionId, setSelectedCollectionId, selectedCollection } =
    useSelectedCollection(collections);
  const {
    banner,
    renderedBanner,
    notify,
    syncToastVisible,
    syncToastShouldRender,
    syncToastKind,
    handleBannerDismiss,
    handleBannerExited,
    handleSyncToastDismiss,
    handleSyncToastExited,
  } = useDashboardNotifications(
    allowSync,
    syncSource,
    !allowSync || loading,
    Boolean(error),
  );

  const editing = useWorkspaceEditing({
    uid: user.uid,
    notify,
    allowSync,
    editMode,
    collection: selectedCollection,
  });
  const bookmarkModal = useBookmarkModalState(selectedCollectionId, editing);
  const folderSettings = useFolderSettingsModalState(
    selectedCollectionId,
    editing,
  );

  useEffect(() => {
    if (!allowSync) {
      setEditMode(false);
    }
  }, [allowSync]);

  useEffect(() => {
    localStorage.setItem(
      "tabby-sidebar-collapsed",
      JSON.stringify(sidebarCollapsed),
    );
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (error && syncSource !== "cache") {
      notify(`Failed to sync collections: ${error.message}`, "danger");
    }
  }, [error, notify, syncSource]);

  const { createCollection } = editing;
  const handleCreateCollection = useCallback(
    (name: string) => {
      void (async () => {
        const id = await createCollection(name);
        if (id) {
          setSelectedCollectionId(id);
        }
      })();
    },
    [createCollection, setSelectedCollectionId],
  );

  const noCollections = !loading && collections.length === 0;

  const handleSignOut = useCallback(() => {
    signOut(auth);
  }, []);

  return (
    <div className="h-full overflow-hidden p-2.5 sm:p-4 lg:p-5">
      <div
        className="dashboard-grid grid h-full min-h-0 min-w-0 items-stretch gap-2.5 sm:gap-4 transition-[grid-template-columns] duration-300 ease-out"
        style={
          {
            "--sidebar-width": `${
              sidebarCollapsed
                ? SIDEBAR_COLLAPSED_TRACK
                : SIDEBAR_EXPANDED_TRACK
            }`,
          } as React.CSSProperties
        }
      >
        <CollectionsSidebar
          allowSync={allowSync}
          editMode={editMode}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          creatingCollection={editing.creatingCollection}
          onCreateCollection={handleCreateCollection}
          onSelectCollection={setSelectedCollectionId}
          onDeleteCollection={editing.deleteCollection}
          noCollections={noCollections}
          loading={loading}
          user={user}
          isCollapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          onSignOut={handleSignOut}
          onToggleEditMode={() => setEditMode((prev) => !prev)}
        />
        {selectedCollection ? (
          <CollectionDetails
            collection={selectedCollection}
            editing={editing}
            bookmarkModal={bookmarkModal}
            onOpenFolderSettings={folderSettings.open}
          />
        ) : (
          <main className={`${panelClass} min-h-0 min-w-0 p-6`}>
            <div className="m-auto max-w-md rounded-[1.5rem] border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-10 text-center text-[var(--muted)]">
              {allowSync && loading
                ? "Loading your collections…"
                : "Create a collection on the left to begin."}
            </div>
          </main>
        )}
      </div>
      <DashboardToasts
        banner={banner}
        renderedBanner={renderedBanner}
        syncToastVisible={syncToastVisible}
        syncToastShouldRender={syncToastShouldRender}
        syncToastKind={syncToastKind}
        onBannerExited={handleBannerExited}
        onBannerDismiss={handleBannerDismiss}
        onSyncToastExited={handleSyncToastExited}
        onSyncToastDismiss={handleSyncToastDismiss}
      />
      <FolderSettingsModal
        folder={
          selectedCollection?.folders.find(
            (f) => f.id === folderSettings.folderId,
          ) ?? null
        }
        open={Boolean(folderSettings.folderId) && editing.canEdit}
        allowSync={editing.canEdit}
        folderForm={folderSettings.form}
        onFolderFormChange={folderSettings.changeField}
        onSave={folderSettings.save}
        saving={editing.savingFolderSettings}
        onClose={folderSettings.close}
      />
    </div>
  );
};

export default Dashboard;
