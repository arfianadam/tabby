import { useEffect, useMemo, useRef, useState } from 'react'
import type { Bookmark } from '../types'
import {
  fetchAndCacheFavicon,
  getCachedFaviconDataUrl,
} from '../utils/favicons'

type BookmarkIconMap = Record<string, string>

export const useBookmarkFavicons = (bookmarks: Bookmark[]) => {
  const [icons, setIcons] = useState<BookmarkIconMap>({})
  const requestedRef = useRef<Set<string>>(new Set())

  // Drop icons for bookmarks that have been removed to keep memory usage low.
  useEffect(() => {
    setIcons((prev) => {
      const next: BookmarkIconMap = {}
      bookmarks.forEach((bookmark) => {
        if (prev[bookmark.id]) {
          next[bookmark.id] = prev[bookmark.id]
        }
      })
      if (Object.keys(next).length === Object.keys(prev).length) {
        return prev
      }
      return next
    })
    requestedRef.current.forEach((id) => {
      if (!bookmarks.some((bookmark) => bookmark.id === id)) {
        requestedRef.current.delete(id)
      }
    })
  }, [bookmarks])

  useEffect(() => {
    if (!bookmarks.length) {
      return
    }

    const cachedUpdates: BookmarkIconMap = {}
    const toFetch = bookmarks.filter((bookmark) => {
      if (!bookmark.url || icons[bookmark.id]) {
        return false
      }
      const cached = getCachedFaviconDataUrl(bookmark.url)
      if (cached) {
        cachedUpdates[bookmark.id] = cached
        return false
      }
      if (requestedRef.current.has(bookmark.id)) {
        return false
      }
      requestedRef.current.add(bookmark.id)
      return true
    })

    if (Object.keys(cachedUpdates).length) {
      setIcons((prev) => ({ ...prev, ...cachedUpdates }))
    }

    if (!toFetch.length) {
      return
    }

    let cancelled = false
    const fetchIcons = async () => {
      const results = await Promise.allSettled(
        toFetch.map(async (bookmark) => {
          const icon = await fetchAndCacheFavicon(bookmark.url)
          return { id: bookmark.id, icon }
        }),
      )

      if (cancelled) {
        return
      }

      const updates: BookmarkIconMap = {}
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.icon) {
          updates[result.value.id] = result.value.icon
        }
      })

      if (Object.keys(updates).length) {
        setIcons((prev) => ({ ...prev, ...updates }))
      }
    }

    fetchIcons()

    return () => {
      cancelled = true
    }
  }, [bookmarks, icons])

  return useMemo(() => {
    const map: Record<string, string | null> = {}
    bookmarks.forEach((bookmark) => {
      map[bookmark.id] = icons[bookmark.id] ?? getCachedFaviconDataUrl(bookmark.url) ?? null
    })
    return map
  }, [bookmarks, icons])
}
