import { onAuthStateChanged, type User } from 'firebase/auth'
import { useEffect, useMemo, useRef, useState } from 'react'
import { auth } from '../firebase/client'
import {
  clearCachedCollections,
  getCachedUser,
  setCachedUser,
  type CachedUser,
} from '../utils/cache'

const toCachedUser = (firebaseUser: User): CachedUser => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
})

export const useAuthState = () => {
  const initialFirebaseUser = auth.currentUser
  const initialCachedUser = initialFirebaseUser
    ? toCachedUser(initialFirebaseUser)
    : getCachedUser()

  const [user, setUser] = useState<User | null>(initialFirebaseUser)
  const [cachedUser, setCachedUserState] = useState<CachedUser | null>(
    initialCachedUser,
  )
  const [initializing, setInitializing] = useState(
    !initialFirebaseUser && !initialCachedUser,
  )
  const [error, setError] = useState<Error | null>(null)
  const lastCachedUidRef = useRef<string | null>(initialCachedUser?.uid ?? null)

  useEffect(() => {
    if (initialFirebaseUser) {
      const summary = toCachedUser(initialFirebaseUser)
      setCachedUser(summary)
      setCachedUserState(summary)
      lastCachedUidRef.current = summary.uid
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        if (nextUser) {
          const summary = toCachedUser(nextUser)
          setCachedUser(summary)
          setCachedUserState(summary)
          lastCachedUidRef.current = summary.uid
        } else {
          setCachedUser(null)
          setCachedUserState(null)
          if (lastCachedUidRef.current) {
            clearCachedCollections(lastCachedUidRef.current)
            lastCachedUidRef.current = null
          }
        }
        setInitializing(false)
      },
      (err) => {
        setError(err)
        setInitializing(false)
      },
    )

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effectiveCachedUser = useMemo(
    () => (user ? toCachedUser(user) : cachedUser),
    [user, cachedUser],
  )

  return { user, cachedUser: effectiveCachedUser, initializing, error }
}
