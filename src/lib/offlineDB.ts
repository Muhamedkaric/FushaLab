/**
 * IndexedDB wrapper for offline content caching.
 *
 * Stores:
 *   content  — key: url string  → value: parsed JSON
 *   levels   — key: 'cat/level' → value: { downloadedAt, itemCount }
 */

const DB_NAME = 'fushalab_offline'
const DB_VERSION = 1
const STORE_CONTENT = 'content'
const STORE_LEVELS = 'levels'

export interface LevelMeta {
  downloadedAt: number
  itemCount: number
}

let _db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_CONTENT)) db.createObjectStore(STORE_CONTENT)
      if (!db.objectStoreNames.contains(STORE_LEVELS)) db.createObjectStore(STORE_LEVELS)
    }
    req.onsuccess = () => {
      _db = req.result
      resolve(_db)
    }
    req.onerror = () => reject(req.error ?? new Error('IDB open failed'))
  })
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    db =>
      new Promise((resolve, reject) => {
        const req = fn(db.transaction(store, mode).objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error ?? new Error('IDB transaction failed'))
      })
  )
}

export function getContent<T>(url: string): Promise<T | undefined> {
  return tx<T | undefined>(STORE_CONTENT, 'readonly', s => s.get(url) as IDBRequest<T | undefined>)
}

export function putContent(url: string, data: unknown): Promise<IDBValidKey> {
  return tx<IDBValidKey>(STORE_CONTENT, 'readwrite', s => s.put(data, url))
}

export function deleteContentByPrefix(prefix: string): Promise<void> {
  return openDB().then(
    db =>
      new Promise((resolve, reject) => {
        const store = db.transaction(STORE_CONTENT, 'readwrite').objectStore(STORE_CONTENT)
        const req = store.openCursor()
        req.onsuccess = () => {
          const cursor = req.result
          if (!cursor) return resolve()
          if ((cursor.key as string).startsWith(prefix)) cursor.delete()
          cursor.continue()
        }
        req.onerror = () => reject(req.error ?? new Error('IDB cursor failed'))
      })
  )
}

export function getLevelMeta(category: string, level: string): Promise<LevelMeta | undefined> {
  return tx<LevelMeta | undefined>(
    STORE_LEVELS,
    'readonly',
    s => s.get(`${category}/${level}`) as IDBRequest<LevelMeta | undefined>
  )
}

export function putLevelMeta(
  category: string,
  level: string,
  meta: LevelMeta
): Promise<IDBValidKey> {
  return tx<IDBValidKey>(STORE_LEVELS, 'readwrite', s => s.put(meta, `${category}/${level}`))
}

export function deleteLevelMeta(category: string, level: string): Promise<undefined> {
  return tx<undefined>(STORE_LEVELS, 'readwrite', s => s.delete(`${category}/${level}`))
}
