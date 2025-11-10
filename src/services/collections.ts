import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  type FirestoreError,
} from 'firebase/firestore'
import { db } from '../firebase/client'
import type { Bookmark, BookmarkDraft, Collection, Folder } from '../types'

type CollectionSnapshot = {
  id?: string
  name?: string
  createdAt?: number
  updatedAt?: number
  folders?: Folder[]
}

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11)

const normalizeBookmark = (bookmark: Partial<Bookmark>): Bookmark => ({
  id: bookmark.id ?? generateId(),
  title: (bookmark.title ?? '').trim() || 'Untitled bookmark',
  url: bookmark.url ?? '',
  note: bookmark.note?.trim(),
  createdAt: bookmark.createdAt ?? Date.now(),
})

const normalizeFolder = (folder: Partial<Folder>): Folder => ({
  id: folder.id ?? generateId(),
  name: (folder.name ?? '').trim() || 'Untitled folder',
  createdAt: folder.createdAt ?? Date.now(),
  bookmarks: Array.isArray(folder.bookmarks)
    ? folder.bookmarks.map(normalizeBookmark)
    : [],
})

const normalizeCollection = (
  id: string,
  snapshot?: CollectionSnapshot,
): Collection => ({
  id,
  name: (snapshot?.name ?? '').trim() || 'Untitled collection',
  createdAt: snapshot?.createdAt ?? Date.now(),
  updatedAt: snapshot?.updatedAt ?? Date.now(),
  folders: Array.isArray(snapshot?.folders)
    ? snapshot.folders.map(normalizeFolder)
    : [],
})

const clone = <T>(value: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T)

const userCollectionsRef = (uid: string) =>
  collection(db, 'users', uid, 'collections')

const collectionDocRef = (uid: string, collectionId: string) =>
  doc(db, 'users', uid, 'collections', collectionId)

export const subscribeToCollections = (
  uid: string,
  onChange: (collections: Collection[]) => void,
  onError?: (error: FirestoreError) => void,
) => {
  const q = query(userCollectionsRef(uid), orderBy('createdAt', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((docSnapshot) =>
        normalizeCollection(docSnapshot.id, docSnapshot.data()),
      )
      onChange(data)
    },
    (err) => {
      onError?.(err)
    },
  )
}

export const createCollection = async (uid: string, name: string) => {
  const ref = doc(userCollectionsRef(uid))
  const trimmed = name.trim()
  const payload: Collection = {
    id: ref.id,
    name: trimmed || 'Untitled collection',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    folders: [],
  }
  await setDoc(ref, payload)
  return ref.id
}

export const deleteCollection = async (uid: string, collectionId: string) =>
  deleteDoc(collectionDocRef(uid, collectionId))

const mutateCollection = async (
  uid: string,
  collectionId: string,
  updater: (collection: Collection) => Collection,
) => {
  const ref = collectionDocRef(uid, collectionId)
  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(ref)
    if (!snapshot.exists()) {
      throw new Error('Collection not found.')
    }
    const current = normalizeCollection(snapshot.id, snapshot.data())
    const next = updater(clone(current))
    tx.set(ref, {
      ...next,
      updatedAt: Date.now(),
    })
  })
}

export const createFolder = async (
  uid: string,
  collectionId: string,
  name: string,
) =>
  mutateCollection(uid, collectionId, (collection) => ({
    ...collection,
    folders: [
      ...collection.folders,
      {
        id: generateId(),
        name: name.trim() || 'Untitled folder',
        createdAt: Date.now(),
        bookmarks: [],
      },
    ],
  }))

export const deleteFolder = async (
  uid: string,
  collectionId: string,
  folderId: string,
) =>
  mutateCollection(uid, collectionId, (collection) => ({
    ...collection,
    folders: collection.folders.filter((folder) => folder.id !== folderId),
  }))

const normalizeUrl = (url: string) => {
  const trimmed = url.trim()
  if (!trimmed) {
    return ''
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

export const addBookmarkToFolder = async (
  uid: string,
  collectionId: string,
  folderId: string,
  payload: BookmarkDraft,
) =>
  mutateCollection(uid, collectionId, (collection) => {
    const folders = collection.folders.map((folder) => {
      if (folder.id !== folderId) {
        return folder
      }
      const bookmark: Bookmark = {
        id: generateId(),
        title: payload.title.trim() || payload.url,
        url: normalizeUrl(payload.url),
        note: payload.note?.trim(),
        createdAt: Date.now(),
      }
      return {
        ...folder,
        bookmarks: [bookmark, ...folder.bookmarks],
      }
    })

    if (!folders.some((folder) => folder.id === folderId)) {
      throw new Error('Folder not found.')
    }

    return {
      ...collection,
      folders,
    }
  })

export const deleteBookmarkFromFolder = async (
  uid: string,
  collectionId: string,
  folderId: string,
  bookmarkId: string,
) =>
  mutateCollection(uid, collectionId, (collection) => ({
    ...collection,
    folders: collection.folders.map((folder) =>
      folder.id === folderId
        ? {
            ...folder,
            bookmarks: folder.bookmarks.filter(
              (bookmark) => bookmark.id !== bookmarkId,
            ),
          }
        : folder,
    ),
  }))
