import type { FirestoreError } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import type { Collection } from '../types'
import { subscribeToCollections } from '../services/collections'
import { setCachedCollections } from '../utils/cache'

type UseCollectionsOptions = {
  initialData?: Collection[]
  cacheKey?: string
}

export const useCollections = (
  uid: string | undefined,
  options?: UseCollectionsOptions,
) => {
  const { initialData = [], cacheKey } = options ?? {}
  const [collections, setCollections] = useState<Collection[]>(initialData)
  const [loading, setLoading] = useState(() => Boolean(uid))
  const [error, setError] = useState<FirestoreError | null>(null)

  useEffect(() => {
    if (!uid) {
      setCollections(initialData)
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToCollections(
      uid,
      (nextCollections) => {
        setCollections(nextCollections)
        setLoading(false)
        if (cacheKey) {
          void setCachedCollections(cacheKey, nextCollections).catch(() => {
            // best-effort cache write; ignore crypto failures
          })
        }
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [uid, cacheKey, initialData])

  const derivedLoading = useMemo(
    () => (uid ? loading : false),
    [uid, loading],
  )

  return { collections, loading: derivedLoading, error }
}
