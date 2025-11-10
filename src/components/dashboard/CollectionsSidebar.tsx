import { actionButtonClasses, inputClasses, panelClass } from './constants'
import type { Collection } from '../../types'

type CollectionsSidebarProps = {
  allowSync: boolean
  collections: Collection[]
  selectedCollectionId: string | null
  newCollection: string
  onNewCollectionChange: (value: string) => void
  creatingCollection: boolean
  onCreateCollection: (event: React.FormEvent<HTMLFormElement>) => void
  onSelectCollection: (collectionId: string) => void
  onDeleteCollection: (collection: Collection) => void
  noCollections: boolean
  loading: boolean
}

const CollectionsSidebar = ({
  allowSync,
  collections,
  selectedCollectionId,
  newCollection,
  onNewCollectionChange,
  creatingCollection,
  onCreateCollection,
  onSelectCollection,
  onDeleteCollection,
  noCollections,
  loading,
}: CollectionsSidebarProps) => {
  const handleCollectionClick = (collectionId: string) => onSelectCollection(collectionId)

  return (
    <aside className={`${panelClass} min-h-0`}>
      <form className="space-y-2" onSubmit={onCreateCollection}>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Create collection
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Product research"
            value={newCollection}
            onChange={(event) => onNewCollectionChange(event.target.value)}
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
            Start by creating a collection. Collections contain folders and bookmarks.
          </p>
        )}
        {collections.map((collection) => {
          const isActive = collection.id === selectedCollectionId
          return (
            <div
              key={collection.id}
              role="button"
              tabIndex={0}
              className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-sm transition ${
                isActive
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
              }`}
              onClick={() => handleCollectionClick(collection.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  handleCollectionClick(collection.id)
                }
              }}
            >
              <div>
                <p className="font-medium">{collection.name}</p>
                <p className="text-xs text-slate-500">
                  {collection.folders.length} folder{collection.folders.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteCollection(collection)
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
  )
}

export default CollectionsSidebar
