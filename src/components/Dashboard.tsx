import { signOut } from 'firebase/auth'
import { useEffect, useMemo, useRef, useState } from 'react'
import { auth } from '../firebase/client'
import { useCollections } from '../hooks/useCollections'
import {
  addBookmarkToFolder,
  createCollection,
  createFolder,
  deleteBookmarkFromFolder,
  deleteCollection,
  deleteFolder,
} from '../services/collections'
import type { Collection, Folder } from '../types'
import { getActiveTabInfo, hasChromeTabsSupport } from '../utils/chrome'
import CollectionDetails from './dashboard/CollectionDetails'
import CollectionsSidebar from './dashboard/CollectionsSidebar'
import DashboardHeader from './dashboard/DashboardHeader'
import DashboardToasts from './dashboard/DashboardToasts'
import { panelClass, type ToastTone } from './dashboard/constants'

export type BannerTone = ToastTone

export type Banner = {
  text: string
  tone: BannerTone
}

export type BookmarkFormState = {
  title: string
  url: string
  note: string
}

export type DashboardUser = {
  uid: string
  email?: string | null
}

type DashboardProps = {
  user: DashboardUser
  allowSync: boolean
  initialCollections?: Collection[]
}

const Dashboard = ({ user, allowSync, initialCollections = [] }: DashboardProps) => {
  const { collections, loading, error } = useCollections(allowSync ? user.uid : undefined, {
    initialData: initialCollections,
    cacheKey: allowSync ? user.uid : undefined,
  })
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [newCollection, setNewCollection] = useState('')
  const [newFolder, setNewFolder] = useState('')
  const [bookmarkForm, setBookmarkForm] = useState<BookmarkFormState>({
    title: '',
    url: '',
    note: '',
  })
  const [creatingCollection, setCreatingCollection] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [savingBookmark, setSavingBookmark] = useState(false)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [renderedBanner, setRenderedBanner] = useState<Banner | null>(null)
  const [syncToastVisible, setSyncToastVisible] = useState(false)
  const [syncToastShouldRender, setSyncToastShouldRender] = useState(false)
  const wasRestoringRef = useRef(!allowSync)

  useEffect(() => {
    if (!collections.length) {
      setSelectedCollectionId(null)
      return
    }
    if (
      !selectedCollectionId ||
      !collections.some((collection) => collection.id === selectedCollectionId)
    ) {
      setSelectedCollectionId(collections[0].id)
    }
  }, [collections, selectedCollectionId])

  const selectedCollection = useMemo(
    () => collections.find((collection) => collection.id === selectedCollectionId) ?? null,
    [collections, selectedCollectionId],
  )

  useEffect(() => {
    if (!selectedCollection) {
      setSelectedFolderId(null)
      return
    }
    if (
      !selectedFolderId ||
      !selectedCollection.folders.some((folder) => folder.id === selectedFolderId)
    ) {
      setSelectedFolderId(selectedCollection.folders[0]?.id ?? null)
    }
  }, [selectedCollection, selectedFolderId])

  const selectedFolder = useMemo(
    () => selectedCollection?.folders.find((folder) => folder.id === selectedFolderId) ?? null,
    [selectedCollection, selectedFolderId],
  )

  useEffect(() => {
    setBookmarkForm({
      title: '',
      url: '',
      note: '',
    })
  }, [selectedFolderId])

  const handleBookmarkFormChange = (field: keyof BookmarkFormState, value: string) => {
    setBookmarkForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const notify = (text: string, tone: BannerTone = 'info') => {
    const nextBanner: Banner = { text, tone }
    setRenderedBanner(nextBanner)
    setBanner(nextBanner)
  }

  const guardSync = () => {
    if (!allowSync) {
      notify('Still restoring your workspace. Please wait…', 'info')
      return true
    }
    return false
  }

  useEffect(() => {
    if (!allowSync) {
      wasRestoringRef.current = true
      setSyncToastVisible(false)
      return
    }
    if (wasRestoringRef.current && allowSync) {
      wasRestoringRef.current = false
      setSyncToastShouldRender(true)
      setSyncToastVisible(true)
      const timeout = window.setTimeout(() => {
        setSyncToastVisible(false)
      }, 4000)
      return () => window.clearTimeout(timeout)
    }
    return
  }, [allowSync])

  useEffect(() => {
    if (!banner) {
      return
    }
    const timeout = window.setTimeout(() => {
      setBanner(null)
    }, 4000)
    return () => window.clearTimeout(timeout)
  }, [banner])

  useEffect(() => {
    if (error) {
      notify(`Failed to sync collections: ${error.message}`, 'danger')
    }
  }, [error])

  const handleCreateCollection = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newCollection.trim() || guardSync()) {
      return
    }
    setCreatingCollection(true)
    try {
      const id = await createCollection(user.uid, newCollection)
      setNewCollection('')
      setSelectedCollectionId(id)
      notify('Collection created.', 'success')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to create collection.', 'danger')
    } finally {
      setCreatingCollection(false)
    }
  }

  const handleDeleteCollection = async (collection: Collection) => {
    if (guardSync()) {
      return
    }
    if (!window.confirm(`Delete collection "${collection.name}" and all folders within it?`)) {
      return
    }
    try {
      await deleteCollection(user.uid, collection.id)
      notify('Collection removed.', 'info')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to delete collection.', 'danger')
    }
  }

  const handleCreateFolder = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedCollection || !newFolder.trim() || guardSync()) {
      return
    }
    setCreatingFolder(true)
    try {
      await createFolder(user.uid, selectedCollection.id, newFolder)
      setNewFolder('')
      notify('Folder created.', 'success')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to create folder.', 'danger')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleDeleteFolder = async (folder: Folder) => {
    if (!selectedCollection || guardSync()) {
      return
    }
    if (!window.confirm(`Delete folder "${folder.name}" and all of its bookmarks?`)) {
      return
    }
    try {
      await deleteFolder(user.uid, selectedCollection.id, folder.id)
      notify('Folder removed.', 'info')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to delete folder.', 'danger')
    }
  }

  const handleAddBookmark = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedCollection || guardSync()) {
      notify('Create or select a collection first.', 'danger')
      return
    }
    if (!selectedFolder) {
      notify('Create or select a folder before saving a bookmark.', 'danger')
      return
    }
    if (!bookmarkForm.url.trim()) {
      notify('Provide a URL before saving a bookmark.', 'danger')
      return
    }
    setSavingBookmark(true)
    try {
      await addBookmarkToFolder(user.uid, selectedCollection.id, selectedFolder.id, bookmarkForm)
      setBookmarkForm({ title: '', url: '', note: '' })
      notify('Bookmark saved.', 'success')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to save bookmark.', 'danger')
    } finally {
      setSavingBookmark(false)
    }
  }

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!selectedCollection || !selectedFolder || guardSync()) {
      return
    }
    try {
      await deleteBookmarkFromFolder(user.uid, selectedCollection.id, selectedFolder.id, bookmarkId)
      notify('Bookmark removed.', 'info')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to delete bookmark.', 'danger')
    }
  }

  const hydrateWithCurrentTab = async () => {
    if (guardSync()) {
      return
    }
    if (!hasChromeTabsSupport) {
      notify('Chrome tab access is only available in the extension build.', 'info')
      return
    }
    try {
      const activeTab = await getActiveTabInfo()
      setBookmarkForm((prev) => ({
        ...prev,
        title: activeTab.title,
        url: activeTab.url,
      }))
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Unable to read the currently active tab.',
        'danger',
      )
    }
  }

  const noCollections = !loading && collections.length === 0

  const handleSignOut = () => {
    signOut(auth)
  }

  return (
    <div className="h-full flex flex-col gap-2 p-3 overflow-hidden">
      <DashboardHeader allowSync={allowSync} user={user} onSignOut={handleSignOut} />
      <div className="grow grid gap-2 lg:grid-cols-[260px,1fr] min-h-0 items-stretch">
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
            selectedFolder={selectedFolder}
            selectedFolderId={selectedFolderId}
            allowSync={allowSync}
            onDeleteCollection={handleDeleteCollection}
            onSelectFolder={setSelectedFolderId}
            newFolder={newFolder}
            onNewFolderChange={setNewFolder}
            creatingFolder={creatingFolder}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            bookmarkForm={bookmarkForm}
            onBookmarkFormChange={handleBookmarkFormChange}
            onAddBookmark={handleAddBookmark}
            savingBookmark={savingBookmark}
            onUseCurrentTab={hydrateWithCurrentTab}
            hasChromeTabsSupport={hasChromeTabsSupport}
            onDeleteBookmark={handleDeleteBookmark}
          />
        ) : (
          <section className={`${panelClass} min-h-[70vh] lg:max-h-[80vh] lg:overflow-hidden`}>
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
              {allowSync && loading
                ? 'Loading your collections…'
                : 'Create a collection on the left to begin.'}
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
  )
}

export default Dashboard
