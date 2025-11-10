import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFolder,
  faFolderOpen,
  faFolderPlus,
  faPlus,
  faSpinner,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import type { Collection } from '../../types'
import { actionButtonClasses, inputClasses, panelClass } from './constants'

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
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <FontAwesomeIcon icon={faFolderPlus} className="text-slate-400" />
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
            <FontAwesomeIcon
              icon={creatingCollection ? faSpinner : faPlus}
              spin={creatingCollection}
              className="mr-2"
            />
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
              className={`flex items-center cursor-pointer justify-between rounded-2xl border px-3 py-3 text-sm transition hover:border-indigo-300 hover:text-indigo-900 ${
                isActive
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                  : 'border-slate-200 bg-white text-slate-800'
              }`}
              onClick={() => handleCollectionClick(collection.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  handleCollectionClick(collection.id)
                }
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full p-2 text-sm ${
                    isActive ? 'bg-white/80 text-indigo-600' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <FontAwesomeIcon icon={isActive ? faFolderOpen : faFolder} />
                </span>
                <div>
                  <p className="font-medium">{collection.name}</p>
                  <p className="text-xs text-slate-500">
                    {collection.folders.length} folder
                    {collection.folders.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <button
                className="cursor-pointer rounded-full h-8 w-8 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteCollection(collection)
                }}
                aria-label={`Delete ${collection.name}`}
                disabled={!allowSync}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default CollectionsSidebar
