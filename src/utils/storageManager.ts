export type StorageType = 'local' | 'session' | 'memory' | 'indexeddb'

export interface StorageOptions {
  type?: StorageType
  prefix?: string
  ttl?: number
  serializer?: 'json' | 'string' | 'base64'
  encrypted?: boolean
}

export interface CacheEntry<T = unknown> {
  value: T
  timestamp: number
  ttl?: number
}

export interface StorageStats {
  keys: number
  size: number
  oldestEntry: number
  newestEntry: number
}

export class StorageManager {
  private static instance: StorageManager
  private memoryStorage: Map<string, string> = new Map()
  private prefix: string
  private serializer: 'json' | 'string' | 'base64'
  private listeners: Map<string, Set<(key: string, value: unknown) => void>> = new Map()

  private constructor() {
    this.prefix = ''
    this.serializer = 'json'
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  setOptions(options: StorageOptions): void {
    if (options.prefix) this.prefix = options.prefix
    if (options.serializer) this.serializer = options.serializer
  }

  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key
  }

  set<T>(key: string, value: T, options?: { ttl?: number; type?: StorageType }): void {
    const fullKey = this.getKey(key)
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: options?.ttl
    }

    const serialized = this.serialize(entry)

    if (options?.type === 'memory' || !options?.type) {
      this.memoryStorage.set(fullKey, serialized)
    }

    if (options?.type === 'local' || (!options?.type && typeof localStorage !== 'undefined')) {
      try {
        localStorage.setItem(fullKey, serialized)
      } catch {}
    }

    if (options?.type === 'session' || (!options?.type && typeof sessionStorage !== 'undefined')) {
      try {
        sessionStorage.setItem(fullKey, serialized)
      } catch {}
    }

    this.notifyListeners(fullKey, value)
  }

  get<T>(key: string, options?: { type?: StorageType; defaultValue?: T }): T | undefined {
    const fullKey = this.getKey(key)

    let value: string | null = null

    if (options?.type === 'memory' || !options?.type) {
      value = this.memoryStorage.get(fullKey) || null
    }

    if (!value && (options?.type === 'local' || !options?.type)) {
      try {
        value = localStorage.getItem(fullKey)
      } catch {}
    }

    if (!value && (options?.type === 'session' || !options?.type)) {
      try {
        value = sessionStorage.getItem(fullKey)
      } catch {}
    }

    if (!value) {
      return options?.defaultValue
    }

    const entry = this.deserialize<CacheEntry<T>>(value)

    if (entry && entry.ttl) {
      const age = Date.now() - entry.timestamp
      if (age > entry.ttl) {
        this.remove(key, options)
        return options?.defaultValue
      }
    }

    return entry?.value
  }

  has(key: string, options?: { type?: StorageType }): boolean {
    const fullKey = this.getKey(key)

    if (options?.type === 'memory' || !options?.type) {
      if (this.memoryStorage.has(fullKey)) return true
    }

    if (options?.type === 'local' || !options?.type) {
      try {
        if (localStorage.getItem(fullKey)) return true
      } catch {}
    }

    if (options?.type === 'session' || !options?.type) {
      try {
        if (sessionStorage.getItem(fullKey)) return true
      } catch {}
    }

    return false
  }

  remove(key: string, options?: { type?: StorageType }): void {
    const fullKey = this.getKey(key)

    if (options?.type === 'memory' || !options?.type) {
      this.memoryStorage.delete(fullKey)
    }

    if (options?.type === 'local' || !options?.type) {
      try {
        localStorage.removeItem(fullKey)
      } catch {}
    }

    if (options?.type === 'session' || !options?.type) {
      try {
        sessionStorage.removeItem(fullKey)
      } catch {}
    }
  }

  clear(options?: { type?: StorageType; pattern?: RegExp }): void {
    if (options?.type === 'memory' || !options?.type) {
      if (options?.pattern) {
        for (const key of this.memoryStorage.keys()) {
          if (options.pattern.test(key)) {
            this.memoryStorage.delete(key)
          }
        }
      } else {
        this.memoryStorage.clear()
      }
    }

    if (options?.type === 'local' || !options?.type) {
      try {
        if (options?.pattern) {
          const keysToRemove: string[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && options.pattern.test(key)) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key))
        } else {
          localStorage.clear()
        }
      } catch {}
    }

    if (options?.type === 'session' || !options?.type) {
      try {
        if (options?.pattern) {
          const keysToRemove: string[] = []
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)
            if (key && options.pattern.test(key)) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => sessionStorage.removeItem(key))
        } else {
          sessionStorage.clear()
        }
      } catch {}
    }
  }

  keys(options?: { type?: StorageType; pattern?: RegExp }): string[] {
    const allKeys: string[] = []

    if (options?.type === 'memory' || !options?.type) {
      this.memoryStorage.forEach((_, key) => {
        if (!options?.pattern || options.pattern.test(key)) {
          allKeys.push(key.replace(this.prefix ? `${this.prefix}:` : '', ''))
        }
      })
    }

    if (options?.type === 'local' || !options?.type) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (!options?.pattern || options.pattern.test(key))) {
            allKeys.push(key.replace(this.prefix ? `${this.prefix}:` : '', ''))
          }
        }
      } catch {}
    }

    if (options?.type === 'session' || !options?.type) {
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key && (!options?.pattern || options.pattern.test(key))) {
            allKeys.push(key.replace(this.prefix ? `${this.prefix}:` : '', ''))
          }
        }
      } catch {}
    }

    return [...new Set(allKeys)]
  }

  getStats(options?: { type?: StorageType }): StorageStats {
    const keys = this.keys(options)
    let totalSize = 0
    let oldestEntry = Date.now()
    let newestEntry = 0

    for (const key of keys) {
      const value = this.get(key, options)
      if (value) {
        const serialized = JSON.stringify(value).length
        totalSize += serialized
      }
    }

    return {
      keys: keys.length,
      size: totalSize,
      oldestEntry,
      newestEntry
    }
  }

  private serialize<T>(value: T): string {
    switch (this.serializer) {
      case 'base64':
        return btoa(encodeURIComponent(JSON.stringify(value)))
      case 'string':
        return String(value)
      case 'json':
      default:
        return JSON.stringify(value)
    }
  }

  private deserialize<T>(value: string): T | null {
    try {
      switch (this.serializer) {
        case 'base64':
          return JSON.parse(decodeURIComponent(atob(value)))
        case 'string':
          return value as unknown as T
        case 'json':
        default:
          return JSON.parse(value)
      }
    } catch {
      return null
    }
  }

  subscribe(key: string, listener: (key: string, value: unknown) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(listener)

    return () => {
      this.listeners.get(key)?.delete(listener)
    }
  }

  private notifyListeners(key: string, value: unknown): void {
    this.listeners.get(key)?.forEach(listener => listener(key, value))
  }

  move(key: string, from: StorageType, to: StorageType): void {
    const value = this.get(key, { type: from })
    if (value !== undefined) {
      this.set(key, value, { type: to })
      this.remove(key, { type: from })
    }
  }

  copy(key: string, from: StorageType, to: StorageType): void {
    const value = this.get(key, { type: from })
    if (value !== undefined) {
      this.set(key, value, { type: to })
    }
  }
}

export const storage = StorageManager.getInstance()

export function setItem<T>(key: string, value: T, options?: { ttl?: number; type?: StorageType }): void {
  storage.set(key, value, options)
}

export function getItem<T>(key: string, options?: { type?: StorageType; defaultValue?: T }): T | undefined {
  return storage.get(key, options)
}

export function removeItem(key: string, options?: { type?: StorageType }): void {
  storage.remove(key, options)
}

export function clearStorage(options?: { type?: StorageType; pattern?: RegExp }): void {
  storage.clear(options)
}
