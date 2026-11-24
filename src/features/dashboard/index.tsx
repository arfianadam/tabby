import { signOut } from "firebase/auth";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderPlus, faPlus, faSpinner } from "@/utils/uiIcons";
import { auth } from "@/firebase/client";
import { clearOmniboxIndex, syncOmniboxIndex } from "@/utils/omniboxIndex";
import { useCollectionSync } from "./hooks/useCollectionSync";
import { useSelectedCollection } from "./hooks/useSelectedCollection";
import { useBookmarkModalState } from "./hooks/useBookmarkModalState";
import { useFolderSettingsModalState } from "./hooks/useFolderSettingsModalState";
import { useDashboardNotifications } from "./hooks/useDashboardNotifications";
import { useWorkspaceEditing } from "./hooks/useWorkspaceEditing";
import CollectionDetails from "./components/CollectionDetails";
import CollectionsSidebar from "./components/CollectionsSidebar";
import DashboardToasts from "./components/DashboardToasts";
import ConfirmDialog, {
  type ConfirmDialogRequest,
} from "./components/ConfirmDialog";
import QuickSearchModal from "./components/QuickSearchModal";
import {
  actionButtonClasses,
  inputClasses,
  panelClass,
} from "./components/constants";
import type { DashboardUser } from "./components/types";

const FolderSettingsModal = lazy(
  () => import("./components/FolderSettingsModal"),
);

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

const isEditableElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
};

const Dashboard = ({ user, allowSync, cacheReady }: DashboardProps) => {
  const {
    collections,
    source: syncSource,
    loading,
    error,
  } = useCollectionSync({ uid: user.uid, allowSync, cacheReady });
  const [editMode, setEditMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [firstCollectionName, setFirstCollectionName] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialSidebarCollapsed,
  );
  const [confirmState, setConfirmState] = useState<ConfirmDialogRequest | null>(
    null,
  );
  const confirmResolverRef = useRef<((confirmed: boolean) => void) | null>(
    null,
  );

  const requestConfirm = useCallback(
    (request: ConfirmDialogRequest): Promise<boolean> =>
      new Promise((resolve) => {
        confirmResolverRef.current?.(false);
        confirmResolverRef.current = resolve;
        setConfirmState(request);
      }),
    [],
  );

  const handleConfirmResolve = useCallback((confirmed: boolean) => {
    const resolve = confirmResolverRef.current;
    confirmResolverRef.current = null;
    setConfirmState(null);
    resolve?.(confirmed);
  }, []);

  const confirmDelete = useCallback(
    (message: string) =>
      requestConfirm({
        title: "Confirm deletion",
        message,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        tone: "danger",
      }),
    [requestConfirm],
  );

  const { selectedCollectionId, setSelectedCollectionId, selectedCollection } =
    useSelectedCollection(collections);
  const {
    banner,
    renderedBanner,
    isOnline,
    notify,
    syncToastVisible,
    syncToastShouldRender,
    syncToastKind,
    handleBannerDismiss,
    handleBannerExited,
    handleBannerPause,
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
    confirm: confirmDelete,
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
    try {
      localStorage.setItem(
        "tabby-sidebar-collapsed",
        JSON.stringify(sidebarCollapsed),
      );
    } catch {
      // Ignore storage quota errors.
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (error && syncSource !== "cache") {
      notify(`Failed to sync collections: ${error.message}`, "danger");
    }
  }, [error, notify, syncSource]);

  useEffect(() => {
    if (syncSource !== "none") {
      syncOmniboxIndex(collections);
    }
  }, [collections, syncSource]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        event.code === "KeyK"
      ) {
        event.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isEditableElement(event.target)
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

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

  const handleFirstCollectionSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const trimmed = firstCollectionName.trim();
    if (!trimmed || !allowSync) {
      return;
    }
    if (!editMode) {
      setEditMode(true);
      window.setTimeout(() => {
        handleCreateCollection(trimmed);
      }, 0);
    } else {
      handleCreateCollection(trimmed);
    }
    setFirstCollectionName("");
  };

  const noCollections = !loading && collections.length === 0;
  const isSaving =
    editing.creatingCollection ||
    editing.creatingFolder ||
    editing.savingBookmark ||
    editing.savingFolderSettings;

  const handleSignOut = useCallback(() => {
    void (async () => {
      const confirmed = await requestConfirm({
        title: "Sign out of Tabby?",
        message:
          "Your synced collections stay safe in Firebase and will return next time you sign in.",
        confirmLabel: "Sign out",
        cancelLabel: "Stay signed in",
        tone: "default",
      });
      if (confirmed) {
        clearOmniboxIndex();
        await signOut(auth);
      }
    })();
  }, [requestConfirm]);

  const handleToggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
  }, []);

  const folderSettingsOpen =
    Boolean(folderSettings.folderId) && editing.canEdit;

  return (
    <div className="h-full overflow-hidden p-2.5 sm:p-4 lg:p-5">
      <div
        className="dashboard-grid grid h-full min-h-0 min-w-0 items-stretch gap-2.5 transition-[grid-template-columns] duration-300 ease-out sm:gap-4"
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
          syncSource={syncSource}
          syncError={error}
          isOnline={isOnline}
          isSaving={isSaving}
          editMode={editMode}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          creatingCollection={editing.creatingCollection}
          onCreateCollection={handleCreateCollection}
          onSelectCollection={setSelectedCollectionId}
          onDeleteCollection={editing.deleteCollection}
          onReorderCollections={editing.reorderCollections}
          noCollections={noCollections}
          loading={loading}
          user={user}
          isCollapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          onSignOut={handleSignOut}
          onToggleEditMode={handleToggleEditMode}
        />
        {selectedCollection ? (
          <CollectionDetails
            collection={selectedCollection}
            collections={collections}
            allowSync={allowSync}
            editMode={editMode}
            onToggleEditMode={handleToggleEditMode}
            onOpenSearch={() => setSearchOpen(true)}
            editing={editing}
            bookmarkModal={bookmarkModal}
            onOpenFolderSettings={folderSettings.open}
          />
        ) : (
          <main className={`${panelClass} min-h-0 min-w-0 p-6`}>
            <div className="m-auto w-full max-w-md rounded-[1.5rem] border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-8 text-center text-[var(--muted)] sm:p-10">
              {allowSync && loading ? (
                <div className="flex flex-col items-center gap-3">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-xl text-[var(--accent)]"
                  />
                  <p className="text-sm font-medium text-[var(--ink)]">
                    Loading your collections…
                  </p>
                </div>
              ) : (
                <div>
                  <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-raised)] text-[var(--accent)] shadow-sm">
                    <FontAwesomeIcon icon={faFolderPlus} />
                  </span>
                  <h2 className="text-lg font-bold tracking-tight text-[var(--ink)]">
                    Create your first collection
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed">
                    Group related folders and links into calm workspaces like
                    Work, Reading, or Personal.
                  </p>
                  <form
                    onSubmit={handleFirstCollectionSubmit}
                    className="mt-5 flex flex-col gap-2 sm:flex-row"
                  >
                    <input
                      type="text"
                      value={firstCollectionName}
                      onChange={(event) =>
                        setFirstCollectionName(event.target.value)
                      }
                      placeholder="Ex: Daily work"
                      aria-label="First collection name"
                      disabled={!allowSync || editing.creatingCollection}
                      className={`${inputClasses} bg-[var(--surface-raised)]`}
                    />
                    <button
                      type="submit"
                      disabled={
                        !allowSync ||
                        editing.creatingCollection ||
                        !firstCollectionName.trim()
                      }
                      className={`${actionButtonClasses} shrink-0 gap-2`}
                    >
                      <FontAwesomeIcon
                        icon={editing.creatingCollection ? faSpinner : faPlus}
                        spin={editing.creatingCollection}
                      />
                      Create
                    </button>
                  </form>
                </div>
              )}
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
        onBannerPause={handleBannerPause}
        onSyncToastExited={handleSyncToastExited}
        onSyncToastDismiss={handleSyncToastDismiss}
      />

      {folderSettingsOpen && (
        <Suspense fallback={null}>
          <FolderSettingsModal
            folder={
              selectedCollection?.folders.find(
                (f) => f.id === folderSettings.folderId,
              ) ?? null
            }
            open={folderSettingsOpen}
            allowSync={editing.canEdit}
            folderForm={folderSettings.form}
            onFolderFormChange={folderSettings.changeField}
            onSave={folderSettings.save}
            saving={editing.savingFolderSettings}
            onClose={folderSettings.close}
          />
        </Suspense>
      )}

      <QuickSearchModal
        open={searchOpen}
        collections={collections}
        onClose={() => setSearchOpen(false)}
        onSelectCollection={setSelectedCollectionId}
      />

      <ConfirmDialog request={confirmState} onResolve={handleConfirmResolve} />
    </div>
  );
};

export default Dashboard;
