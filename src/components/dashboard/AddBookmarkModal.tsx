import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBookmark, faListUl, faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons'
import type { Folder } from '../../types'
import type { BookmarkFormState } from '../Dashboard'
import { actionButtonClasses, inputClasses } from './constants'
import { getCurrentWindowTabs } from '../../utils/chrome'
import type { BrowserTab } from '../../utils/chrome'

type AddBookmarkModalProps = {
  folder: Folder | null
  open: boolean
  allowSync: boolean
  bookmarkForm: BookmarkFormState
  onBookmarkFormChange: (field: keyof BookmarkFormState, value: string) => void
  onAddBookmark: (event: React.FormEvent<HTMLFormElement>, folderId: string) => void
  savingBookmark: boolean
  hasChromeTabsSupport: boolean
  onClose: () => void
}

const AddBookmarkModal = ({
  folder,
  open,
  allowSync,
  bookmarkForm,
  onBookmarkFormChange,
  onAddBookmark,
  savingBookmark,
  hasChromeTabsSupport,
  onClose,
}: AddBookmarkModalProps) => {
  const [tabs, setTabs] = useState<BrowserTab[]>([])
  const [tabsLoading, setTabsLoading] = useState(false)
  const [tabError, setTabError] = useState<string | null>(null)
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setTabs([])
      setSelectedTabId(null)
      setTabError(null)
      setTabsLoading(false)
      return
    }
    if (!hasChromeTabsSupport) {
      setTabs([])
      setSelectedTabId(null)
      return
    }
    let cancelled = false
    const fetchTabs = async () => {
      setTabsLoading(true)
      setTabError(null)
      try {
        const currentTabs = await getCurrentWindowTabs()
        if (!cancelled) {
          setTabs(currentTabs)
        }
      } catch (err) {
        if (!cancelled) {
          setTabError(err instanceof Error ? err.message : 'Unable to list tabs for this window.')
          setTabs([])
          setSelectedTabId(null)
        }
      } finally {
        if (!cancelled) {
          setTabsLoading(false)
        }
      }
    }
    fetchTabs()
    return () => {
      cancelled = true
    }
  }, [open, hasChromeTabsSupport])

  useEffect(() => {
    if (selectedTabId === null) {
      return
    }
    if (!tabs.some((tab) => tab.id === selectedTabId)) {
      setSelectedTabId(null)
    }
  }, [tabs, selectedTabId])

  if (!open || !folder) {
    return null
  }

  const handleSelectTab = (tab: BrowserTab) => {
    setSelectedTabId(tab.id)
    onBookmarkFormChange('title', tab.title)
    onBookmarkFormChange('url', tab.url)
  }

  const titleId = `add-bookmark-${folder.id}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex flex-col relative z-10 w-full max-w-4xl h-125 rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Add bookmark
            </p>
            <h3 id={titleId} className="text-lg font-semibold text-slate-900">
              {folder.name}
            </h3>
          </div>
          <button
            type="button"
            className=" cursor-pointer rounded-full h-6 w-6 flex items-center justify-center text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
            aria-label="Close add bookmark modal"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <form className="grow min-h-0 flex px-5 py-4" onSubmit={(event) => onAddBookmark(event, folder.id)}>
          <div className="grow min-h-0 flex gap-5">
            <div className="flex-1 space-y-3">
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
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingBookmark || !allowSync}
                  className={`${actionButtonClasses} gap-2`}
                >
                  <FontAwesomeIcon icon={savingBookmark ? faSpinner : faBookmark} spin={savingBookmark} />
                  {savingBookmark ? 'Saving…' : 'Save bookmark'}
                </button>
              </div>
            </div>
            <div className="w-96 space-y-2 border-slate-100 border-l pl-4 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FontAwesomeIcon icon={faListUl} />
                  Select from tabs in this window
                </p>
              </div>
              {!hasChromeTabsSupport ? (
                <p className="text-xs text-slate-500">
                  Load the built extension to list and capture tabs from the current window.
                </p>
              ) : tabsLoading ? (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Loading tabs…
                </p>
              ) : tabError ? (
                <p className="text-xs text-rose-600">{tabError}</p>
              ) : tabs.length === 0 ? (
                <p className="text-xs text-slate-500">No tabs detected in this window.</p>
              ) : (
                <ul className="grow min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white text-left">
                  {[...tabs].reverse().map((tab) => {
                    const isSelected = tab.id === selectedTabId
                    return (
                      <li key={tab.id} className="border-b border-slate-100 last:border-b-0">
                        <button
                          type="button"
                          className={`flex w-full items-start gap-3 p-3 text-left transition ${
                            isSelected ? 'bg-indigo-50/80' : 'hover:bg-slate-50'
                          }`}
                          onClick={() => handleSelectTab(tab)}
                        >
                          <span
                            className={`mt-1 h-2.5 w-2.5 rounded-full border shrink-0 ${
                              isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="flex min-w-0 flex-col">
                            <span className="text-sm font-medium text-slate-900 truncate">
                              {tab.title}
                            </span>
                            <span className="text-xs text-slate-500 break-all">{tab.url}</span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBookmarkModal
