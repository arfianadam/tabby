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

const panelClass =
  'rounded-2xl bg-white/90 p-4 shadow-xl ring-1 ring-slate-100 backdrop-blur flex flex-col gap-4'
const inputClasses =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
const actionButtonClasses =
  'inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition disabled:opacity-50'
const subtleButtonClasses =
  'inline-flex items-center justify-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-60'

const toneClasses = {
  info: 'border-slate-200 bg-slate-50 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
} as const

type BannerTone = keyof typeof toneClasses

type Banner = {
  text: string
  tone: BannerTone
}

type DashboardUser = {
  uid: string
  email?: string | null
}

type DashboardProps = {
  user: DashboardUser
  allowSync: boolean
  initialCollections?: Collection[]
}

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
  )
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [newCollection, setNewCollection] = useState('')
  const [newFolder, setNewFolder] = useState('')
  const [bookmarkForm, setBookmarkForm] = useState({
    title: '',
    url: '',
    note: '',
  })
  const [creatingCollection, setCreatingCollection] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [savingBookmark, setSavingBookmark] = useState(false)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [syncToastVisible, setSyncToastVisible] = useState(false)
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
    () =>
      collections.find((collection) => collection.id === selectedCollectionId) ??
      null,
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
    () =>
      selectedCollection?.folders.find((folder) => folder.id === selectedFolderId) ??
      null,
    [selectedCollection, selectedFolderId],
  )

  useEffect(() => {
    setBookmarkForm({
      title: '',
      url: '',
      note: '',
    })
  }, [selectedFolderId])

  const notify = (text: string, tone: BannerTone = 'info') => {
    setBanner({ text, tone })
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
      setSyncToastVisible(true)
      const timeout = window.setTimeout(() => {
        setSyncToastVisible(false)
      }, 4000)
      return () => window.clearTimeout(timeout)
    }
    return
  }, [allowSync])

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
      notify(
        err instanceof Error ? err.message : 'Unable to create collection.',
        'danger',
      )
    } finally {
      setCreatingCollection(false)
    }
  }

  const handleDeleteCollection = async (collection: Collection) => {
    if (guardSync()) {
      return
    }
    if (
      !window.confirm(
        `Delete collection "${collection.name}" and all folders within it?`,
      )
    ) {
      return
    }
    try {
      await deleteCollection(user.uid, collection.id)
      notify('Collection removed.', 'info')
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Unable to delete collection.',
        'danger',
      )
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
      notify(
        err instanceof Error ? err.message : 'Unable to create folder.',
        'danger',
      )
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleDeleteFolder = async (folder: Folder) => {
    if (!selectedCollection || guardSync()) {
      return
    }
    if (
      !window.confirm(
        `Delete folder "${folder.name}" and all of its bookmarks?`,
      )
    ) {
      return
    }
    try {
      await deleteFolder(user.uid, selectedCollection.id, folder.id)
      notify('Folder removed.', 'info')
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Unable to delete folder.',
        'danger',
      )
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
      await addBookmarkToFolder(
        user.uid,
        selectedCollection.id,
        selectedFolder.id,
        bookmarkForm,
      )
      setBookmarkForm({ title: '', url: '', note: '' })
      notify('Bookmark saved.', 'success')
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Unable to save bookmark.',
        'danger',
      )
    } finally {
      setSavingBookmark(false)
    }
  }

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!selectedCollection || !selectedFolder || guardSync()) {
      return
    }
    try {
      await deleteBookmarkFromFolder(
        user.uid,
        selectedCollection.id,
        selectedFolder.id,
        bookmarkId,
      )
      notify('Bookmark removed.', 'info')
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Unable to delete bookmark.',
        'danger',
      )
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
        err instanceof Error
          ? err.message
          : 'Unable to read the currently active tab.',
        'danger',
      )
    }
  }

  const noCollections = !loading && collections.length === 0

  return (
    <div className="flex flex-col gap-4">
      <header
        className={`${panelClass} lg:flex-row lg:items-center lg:justify-between lg:gap-8`}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Synced workspace
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Tabby</h1>
          <p className="text-sm text-slate-600">
            Toby-style collections kept in sync with Firebase.
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {user.email ?? 'Signed in'}
            </p>
            <p className="text-xs text-slate-500">
              {allowSync ? 'Synced' : 'Restoring…'}
            </p>
          </div>
          <button
            className={subtleButtonClasses}
            onClick={() => {
              signOut(auth)
            }}
            type="button"
          >
            Sign out
          </button>
        </div>
      </header>
      {banner && (
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${toneClasses[banner.tone]}`}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            className="rounded-full p-1 text-slate-500 hover:bg-slate-200"
            onClick={() => setBanner(null)}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}
      {error && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses.danger}`}
        >
          Failed to sync collections: {error.message}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[260px,1fr]">
        <aside className={`${panelClass} max-h-[70vh]`}>
          <form className="space-y-2" onSubmit={handleCreateCollection}>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Create collection
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Product research"
                value={newCollection}
                onChange={(event) => setNewCollection(event.target.value)}
                className={inputClasses}
                disabled={!allowSync}
              />
              <button
                type="submit"
                disabled={!allowSync || creatingCollection}
                className={actionButtonClasses}
              >
                {creatingCollection ? 'Adding…' : 'Add'}
              </button>
            </div>
          </form>
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {noCollections && allowSync && !loading && (
              <p className="text-sm text-slate-500">
                Start by creating a collection. Collections contain folders and
                bookmarks.
              </p>
            )}
            {collections.map((collection) => {
              const isActive = collection.id === selectedCollection?.id
              return (
                <div
                  key={collection.id}
                  role="button"
                  tabIndex={0}
                  className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                    isActive
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedCollectionId(collection.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      setSelectedCollectionId(collection.id)
                    }
                  }}
                >
                  <div>
                    <p className="font-medium">{collection.name}</p>
                    <p className="text-xs text-slate-500">
                      {collection.folders.length} folder
                      {collection.folders.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <button
                    className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleDeleteCollection(collection)
                    }}
                    aria-label={`Delete ${collection.name}`}
                    disabled={!allowSync}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </aside>
        <section className={`${panelClass} min-h-[70vh] lg:max-h-[80vh] lg:overflow-hidden`}>
          {selectedCollection ? (
            <div className="flex flex-col gap-4 lg:min-h-0">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedCollection.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selectedCollection.folders.length} folder
                    {selectedCollection.folders.length === 1 ? '' : 's'} synced to the cloud.
                  </p>
                </div>
                <button
                  className={`${subtleButtonClasses} text-rose-600 hover:text-rose-700`}
                  type="button"
                  onClick={() => handleDeleteCollection(selectedCollection)}
                  disabled={!allowSync}
                >
                  Delete collection
                </button>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedCollection.folders.map((folder) => {
                    const isActive = folder.id === selectedFolder?.id
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                          isActive
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedFolderId(folder.id)}
                      >
                        <span>{folder.name}</span>
                        <span className="text-xs text-slate-400">
                          {folder.bookmarks.length}
                        </span>
                        <span
                          role="button"
                          className="text-slate-400"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleDeleteFolder(folder)
                          }}
                        >
                          ×
                        </span>
                      </button>
                    )
                  })}
                  {selectedCollection.folders.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No folders yet. Add one to start saving bookmarks.
                    </p>
                  )}
                </div>
                <form className="flex-1 space-y-1" onSubmit={handleCreateFolder}>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    New folder
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Launch inspiration"
                      value={newFolder}
                      disabled={!selectedCollection || !allowSync}
                      onChange={(event) => setNewFolder(event.target.value)}
                      className={`${inputClasses} ${
                        !selectedCollection || !allowSync ? 'cursor-not-allowed opacity-60' : ''
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={creatingFolder || !selectedCollection || !allowSync}
                      className={actionButtonClasses}
                    >
                      {creatingFolder ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
              {selectedFolder ? (
                <div className="flex flex-col gap-4 lg:min-h-0">
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Add bookmark to {selectedFolder.name}
                    </h3>
                    <form className="mt-3 space-y-3" onSubmit={handleAddBookmark}>
                      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                        Title
                        <input
                          type="text"
                          placeholder="Readable bookmark title"
                          value={bookmarkForm.title}
                          onChange={(event) =>
                            setBookmarkForm((prev) => ({
                              ...prev,
                              title: event.target.value,
                            }))
                          }
                          className={inputClasses}
                          disabled={!allowSync}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                        URL
                        <input
                          type="url"
                          required
                          placeholder="https://example.com"
                          value={bookmarkForm.url}
                          onChange={(event) =>
                            setBookmarkForm((prev) => ({
                              ...prev,
                              url: event.target.value,
                            }))
                          }
                          className={inputClasses}
                          disabled={!allowSync}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                        Notes (optional)
                        <textarea
                          placeholder="What makes this link useful?"
                          value={bookmarkForm.note}
                          rows={2}
                          onChange={(event) =>
                            setBookmarkForm((prev) => ({
                              ...prev,
                              note: event.target.value,
                            }))
                          }
                          className={`${inputClasses} resize-y`}
                          disabled={!allowSync}
                        />
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          className={subtleButtonClasses}
                          type="button"
                          disabled={!allowSync || !hasChromeTabsSupport}
                          onClick={hydrateWithCurrentTab}
                        >
                          Use current tab
                        </button>
                        <button
                          type="submit"
                          disabled={savingBookmark || !allowSync}
                          className={actionButtonClasses}
                        >
                          {savingBookmark ? 'Saving…' : 'Save bookmark'}
                        </button>
                      </div>
                      {!hasChromeTabsSupport && (
                        <p className="text-xs text-slate-500">
                          Load the built extension to capture the current tab automatically.
                        </p>
                      )}
                    </form>
                  </div>
                  <div className="flex flex-col gap-3 overflow-y-auto pr-2 lg:max-h-[45vh]">
                    {selectedFolder.bookmarks.length === 0 && (
                      <p className="text-sm text-slate-500">
                        This folder is empty. Add bookmarks above or capture the current tab.
                      </p>
                    )}
                    {selectedFolder.bookmarks.map((bookmark) => (
                      <article
                        key={bookmark.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <a
                              href={bookmark.url}
                              target="_self"
                              className="text-base font-semibold text-slate-900 hover:text-indigo-600"
                            >
                              {bookmark.title}
                            </a>
                            <p className="break-all text-xs text-slate-500">
                              {bookmark.url}
                            </p>
                          </div>
                          <button
                            className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            type="button"
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                            disabled={!allowSync}
                          >
                            ×
                          </button>
                        </div>
                        {bookmark.note && (
                          <p className="mt-2 text-sm text-slate-700">{bookmark.note}</p>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
                  Create a folder to start capturing bookmarks.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
              {allowSync && loading
                ? 'Loading your collections…'
                : 'Create a collection on the left to begin.'}
            </div>
          )}
        </section>
      </div>
      {syncToastVisible && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600/95 px-4 py-3 text-sm font-medium text-white shadow-2xl">
          <span>Workspace reconnected. Changes sync automatically.</span>
          <button
            type="button"
            className="rounded-full p-1 text-white/80 hover:bg-emerald-500/40"
            onClick={() => setSyncToastVisible(false)}
            aria-label="Dismiss sync status"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default Dashboard
