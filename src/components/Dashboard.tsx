import { signOut } from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../firebase/client";
import { useCollections } from "../hooks/useCollections";
import {
  addBookmarkToFolder,
  createCollection,
  createFolder,
  deleteBookmarkFromFolder,
  deleteCollection,
  deleteFolder,
} from "../services/collections";
import type { Collection, Folder } from "../types";
import CollectionDetails from "./dashboard/CollectionDetails";
import CollectionsSidebar from "./dashboard/CollectionsSidebar";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardToasts from "./dashboard/DashboardToasts";
import { panelClass, type ToastTone } from "./dashboard/constants";
import { hasChromeTabsSupport } from "../utils/chrome";

export type BannerTone = ToastTone;

export type Banner = {
  text: string;
  tone: BannerTone;
};

export type BookmarkFormState = {
  title: string;
  url: string;
  note: string;
};

export type DashboardUser = {
  uid: string;
  email?: string | null;
};

type DashboardProps = {
  user: DashboardUser;
  allowSync: boolean;
  initialCollections?: Collection[];
};

const getInitialBookmarkFormState = (): BookmarkFormState => ({
  title: "",
  url: "",
  note: "",
});

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
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);
  const [newCollection, setNewCollection] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [bookmarkForm, setBookmarkForm] = useState<BookmarkFormState>(
    getInitialBookmarkFormState,
  );
  const [bookmarkModalFolderId, setBookmarkModalFolderId] = useState<
    string | null
  >(null);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [renderedBanner, setRenderedBanner] = useState<Banner | null>(null);
  const [syncToastVisible, setSyncToastVisible] = useState(false);
  const [syncToastShouldRender, setSyncToastShouldRender] = useState(false);
  const wasRestoringRef = useRef(!allowSync);

  useEffect(() => {
    if (!collections.length) {
      setSelectedCollectionId(null);
      return;
    }
    if (
      !selectedCollectionId ||
      !collections.some((collection) => collection.id === selectedCollectionId)
    ) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

  const selectedCollection = useMemo(
    () =>
      collections.find(
        (collection) => collection.id === selectedCollectionId,
      ) ?? null,
    [collections, selectedCollectionId],
  );

  useEffect(() => {
    setBookmarkModalFolderId(null);
    setBookmarkForm(getInitialBookmarkFormState());
  }, [selectedCollectionId]);

  const handleBookmarkFormChange = (
    field: keyof BookmarkFormState,
    value: string,
  ) => {
    setBookmarkForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const notify = (text: string, tone: BannerTone = "info") => {
    const nextBanner: Banner = { text, tone };
    setRenderedBanner(nextBanner);
    setBanner(nextBanner);
  };

  const guardSync = () => {
    if (!allowSync) {
      notify("Still restoring your workspace. Please wait…", "info");
      return true;
    }
    return false;
  };

  const closeBookmarkModal = () => {
    setBookmarkModalFolderId(null);
    setBookmarkForm(getInitialBookmarkFormState());
  };

  const openBookmarkModal = (folderId: string) => {
    if (!selectedCollection || guardSync()) {
      return;
    }
    setBookmarkModalFolderId(folderId);
    setBookmarkForm(getInitialBookmarkFormState());
  };

  useEffect(() => {
    if (!allowSync) {
      wasRestoringRef.current = true;
      setSyncToastVisible(false);
      setBookmarkModalFolderId(null);
      setBookmarkForm(getInitialBookmarkFormState());
      return;
    }
    if (wasRestoringRef.current && allowSync) {
      wasRestoringRef.current = false;
      setSyncToastShouldRender(true);
      setSyncToastVisible(true);
      const timeout = window.setTimeout(() => {
        setSyncToastVisible(false);
      }, 4000);
      return () => window.clearTimeout(timeout);
    }
    return;
  }, [allowSync]);

  useEffect(() => {
    if (!banner) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setBanner(null);
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  useEffect(() => {
    if (error) {
      notify(`Failed to sync collections: ${error.message}`, "danger");
    }
  }, [error]);

  const handleCreateCollection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCollection.trim() || guardSync()) {
      return;
    }
    setCreatingCollection(true);
    try {
      const id = await createCollection(user.uid, newCollection);
      setNewCollection("");
      setSelectedCollectionId(id);
      notify("Collection created.", "success");
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Unable to create collection.",
        "danger",
      );
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleDeleteCollection = async (collection: Collection) => {
    if (guardSync()) {
      return;
    }
    if (
      !window.confirm(
        `Delete collection "${collection.name}" and all folders within it?`,
      )
    ) {
      return;
    }
    try {
      await deleteCollection(user.uid, collection.id);
      notify("Collection removed.", "info");
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Unable to delete collection.",
        "danger",
      );
    }
  };

  const handleCreateFolder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCollection || !newFolder.trim() || guardSync()) {
      return;
    }
    setCreatingFolder(true);
    try {
      await createFolder(user.uid, selectedCollection.id, newFolder);
      setNewFolder("");
      notify("Folder created.", "success");
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Unable to create folder.",
        "danger",
      );
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (!selectedCollection || guardSync()) {
      return;
    }
    if (
      !window.confirm(
        `Delete folder "${folder.name}" and all of its bookmarks?`,
      )
    ) {
      return;
    }
    try {
      await deleteFolder(user.uid, selectedCollection.id, folder.id);
      notify("Folder removed.", "info");
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Unable to delete folder.",
        "danger",
      );
    }
  };

  const saveBookmarkToFolder = async (
    folderId: string,
    bookmarkData: BookmarkFormState,
    options: { closeModal?: boolean } = {},
  ) => {
    const { closeModal = false } = options;
    if (!selectedCollection || guardSync()) {
      notify("Create or select a collection first.", "danger");
      return;
    }
    const folder = selectedCollection.folders.find(
      (entry) => entry.id === folderId,
    );
    if (!folder) {
      notify("The selected folder is no longer available.", "danger");
      closeBookmarkModal();
      return;
    }
    if (!bookmarkData.url.trim()) {
      notify("Provide a URL before saving a bookmark.", "danger");
      return;
    }
    setSavingBookmark(true);
    try {
      await addBookmarkToFolder(
        user.uid,
        selectedCollection.id,
        folder.id,
        bookmarkData,
      );
      notify("Bookmark saved.", "success");
      if (closeModal) {
        closeBookmarkModal();
      } else {
        setBookmarkForm(getInitialBookmarkFormState());
      }
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Unable to save bookmark.",
        "danger",
      );
    } finally {
      setSavingBookmark(false);
    }
  };

  const handleAddBookmark = async (
    event: React.FormEvent,
    folderId: string,
  ) => {
    event.preventDefault();
    await saveBookmarkToFolder(folderId, bookmarkForm, { closeModal: true });
  };

  const handleDeleteBookmark = async (folderId: string, bookmarkId: string) => {
    if (!selectedCollection || guardSync()) {
      return;
    }
    try {
      await deleteBookmarkFromFolder(
        user.uid,
        selectedCollection.id,
        folderId,
        bookmarkId,
      );
      notify("Bookmark removed.", "info");
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Unable to delete bookmark.",
        "danger",
      );
    }
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
            onOpenBookmarkModal={openBookmarkModal}
            onCloseBookmarkModal={closeBookmarkModal}
            bookmarkModalFolderId={bookmarkModalFolderId}
            bookmarkForm={bookmarkForm}
            onBookmarkFormChange={handleBookmarkFormChange}
            onAddBookmark={handleAddBookmark}
            savingBookmark={savingBookmark}
            hasChromeTabsSupport={hasChromeTabsSupport}
            onDeleteBookmark={handleDeleteBookmark}
          />
        ) : (
          <section
            className={`${panelClass} min-h-[70vh] lg:max-h-[80vh] lg:overflow-hidden`}
          >
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
        onBannerExited={() => setRenderedBanner(null)}
        onBannerDismiss={() => setBanner(null)}
        onSyncToastExited={() => setSyncToastShouldRender(false)}
        onSyncToastDismiss={() => setSyncToastVisible(false)}
      />
    </div>
  );
};

export default Dashboard;
