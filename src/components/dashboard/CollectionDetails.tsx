import type { Folder } from '../../types'
import type { Collection } from '../../types'
import type { BookmarkFormState } from '../Dashboard'
import {
  actionButtonClasses,
  inputClasses,
  panelClass,
  subtleButtonClasses,
} from './constants'

type CollectionDetailsProps = {
  collection: Collection
  selectedFolder: Folder | null
  selectedFolderId: string | null
  allowSync: boolean
  onDeleteCollection: (collection: Collection) => void
  onSelectFolder: (folderId: string) => void
  newFolder: string
  onNewFolderChange: (value: string) => void
  creatingFolder: boolean
  onCreateFolder: (event: React.FormEvent<HTMLFormElement>) => void
  onDeleteFolder: (folder: Folder) => void
  bookmarkForm: BookmarkFormState
  onBookmarkFormChange: (field: keyof BookmarkFormState, value: string) => void
  onAddBookmark: (event: React.FormEvent<HTMLFormElement>) => void
  savingBookmark: boolean
  onUseCurrentTab: () => void
  hasChromeTabsSupport: boolean
  onDeleteBookmark: (bookmarkId: string) => void
}

const CollectionDetails = ({
  collection,
  selectedFolder,
  selectedFolderId,
  allowSync,
  onDeleteCollection,
  onSelectFolder,
  newFolder,
  onNewFolderChange,
  creatingFolder,
  onCreateFolder,
  onDeleteFolder,
  bookmarkForm,
  onBookmarkFormChange,
  onAddBookmark,
  savingBookmark,
  onUseCurrentTab,
  hasChromeTabsSupport,
  onDeleteBookmark,
}: CollectionDetailsProps) => (
  <section className={`${panelClass} min-h-0`}>
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{collection.name}</h2>
          <p className="text-sm text-slate-500">
            {collection.folders.length} folder{collection.folders.length === 1 ? '' : 's'} synced to
            the cloud.
          </p>
        </div>
        <button
          className={`${subtleButtonClasses} text-rose-600 hover:text-rose-700`}
          type="button"
          onClick={() => onDeleteCollection(collection)}
          disabled={!allowSync}
        >
          Delete collection
        </button>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="flex flex-wrap items-center gap-2">
          {collection.folders.map((folder) => {
            const isActive = folder.id === selectedFolderId
            return (
              <button
                key={folder.id}
                type="button"
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                  isActive
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
                onClick={() => onSelectFolder(folder.id)}
              >
                <span>{folder.name}</span>
                <span className="text-xs text-slate-400">{folder.bookmarks.length}</span>
                <span
                  role="button"
                  className="text-slate-400"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDeleteFolder(folder)
                  }}
                >
                  ×
                </span>
              </button>
            )
          })}
          {collection.folders.length === 0 && (
            <p className="text-sm text-slate-500">No folders yet. Add one to start saving bookmarks.</p>
          )}
        </div>
        <form className="flex-1 space-y-1" onSubmit={onCreateFolder}>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            New folder
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: Launch inspiration"
              value={newFolder}
              disabled={!collection || !allowSync}
              onChange={(event) => onNewFolderChange(event.target.value)}
              className={`${inputClasses} ${!collection || !allowSync ? 'cursor-not-allowed opacity-60' : ''}`}
            />
            <button
              type="submit"
              disabled={creatingFolder || !collection || !allowSync}
              className={actionButtonClasses}
            >
              {creatingFolder ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
      {selectedFolder ? (
        <div className="grow flex flex-col gap-4 min-h-0">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Add bookmark to {selectedFolder.name}
            </h3>
            <form className="mt-3 space-y-3" onSubmit={onAddBookmark}>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Title
                <input
                  type="text"
                  value={bookmarkForm.title}
                  onChange={(event) => onBookmarkFormChange('title', event.target.value)}
                  placeholder="Ex: Great GTM playbook"
                  className={inputClasses}
                  disabled={!allowSync}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                URL
                <input
                  type="url"
                  value={bookmarkForm.url}
                  onChange={(event) => onBookmarkFormChange('url', event.target.value)}
                  placeholder="https://example.com"
                  className={inputClasses}
                  disabled={!allowSync}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Note (optional)
                <textarea
                  value={bookmarkForm.note}
                  onChange={(event) => onBookmarkFormChange('note', event.target.value)}
                  className={`${inputClasses} resize-y`}
                  disabled={!allowSync}
                />
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  className={subtleButtonClasses}
                  type="button"
                  disabled={!allowSync || !hasChromeTabsSupport}
                  onClick={onUseCurrentTab}
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
          <div className="grow flex flex-col gap-3 overflow-y-auto pr-2">
            {selectedFolder.bookmarks.length === 0 && (
              <p className="text-sm text-slate-500">
                This folder is empty. Add bookmarks above or capture the current tab.
              </p>
            )}
            {selectedFolder.bookmarks.map((bookmark) => (
              <article key={bookmark.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <a
                      href={bookmark.url}
                      target="_self"
                      className="text-base font-semibold text-slate-900 hover:text-indigo-600"
                    >
                      {bookmark.title}
                    </a>
                    <p className="break-all text-xs text-slate-500">{bookmark.url}</p>
                  </div>
                  <button
                    className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    type="button"
                    onClick={() => onDeleteBookmark(bookmark.id)}
                    disabled={!allowSync}
                  >
                    ×
                  </button>
                </div>
                {bookmark.note && <p className="mt-2 text-sm text-slate-700">{bookmark.note}</p>}
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
  </section>
)

export default CollectionDetails
