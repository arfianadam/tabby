import type { Collection } from '../types'

export type CachedUser = {
  uid: string
  email?: string | null
}

const USER_KEY = 'tabby:lastUser'
const collectionsKey = (uid: string) => `tabby:collections:${uid}`

const hasWindow = () => typeof window !== 'undefined'

const safeGet = (key: string) => {
  if (!hasWindow()) {
    return null
  }
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeSet = (key: string, value: string | null) => {
  if (!hasWindow()) {
    return
  }
  try {
    if (value === null) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, value)
    }
  } catch {
    // ignore quota/security errors
  }
}

export const getCachedUser = (): CachedUser | null => {
  const raw = safeGet(USER_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as CachedUser
  } catch {
    return null
  }
}

export const setCachedUser = (user: CachedUser | null) => {
  if (user) {
    safeSet(USER_KEY, JSON.stringify(user))
  } else {
    safeSet(USER_KEY, null)
  }
}

export const getCachedCollections = (uid: string): Collection[] => {
  const raw = safeGet(collectionsKey(uid))
  if (!raw) {
    return []
  }
  try {
    return JSON.parse(raw) as Collection[]
  } catch {
    return []
  }
}

export const setCachedCollections = (uid: string, collections: Collection[]) => {
  safeSet(collectionsKey(uid), JSON.stringify(collections))
}

export const clearCachedCollections = (uid: string) => {
  safeSet(collectionsKey(uid), null)
}
