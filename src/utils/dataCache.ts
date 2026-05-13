export type CacheStrategy = 'cache-first' | 'cache-and-network' | 'network-only' | 'stale-while-revalidate'

export interface CacheOptions {
  ttl?: number
  maxSize?: number
  staleWhileRevalidate?: number
  onExpire?: (key: string, value: unknown) => void
}

export interface CacheEntry<T = unknown> {
  key: string
  value: T
  createdAt: number
  accessedAt: number
  expiresAt?: number
  size: number
}

export interface CacheStats {
  hits: number
  misses: number
  size: number
  maxSize: number
  hitRate: number
}

export class Cache<T = unknown> {
  private storage: Map<string, CacheEntry<T>> = new Map()
  private ttl: number
  private maxSize: number
  private staleWhileRevalidate: number
  private onExpire?: (key: string, value: unknown) => void
  private stats: { hits: number; misses: number } = { hits: 0, misses: 0 }

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl || 300000
    this.maxSize = options.maxSize || 100
    this.staleWhileRevalidate = options.staleWhileRevalidate || 60000
    this.onExpire = options.onExpire
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      accessedAt: now,
      expiresAt: now + (ttl || this.ttl),
      size: this.estimateSize(value)
    }

    if (this.storage.size >= this.maxSize) {
      this.evict()
    }

    this.storage.set(key, entry)
  }

  get(key: string): T | undefined {
    const entry = this.storage.get(key)
    
    if (!entry) {
      this.stats.misses++
      return undefined
    }

    const now = Date.now()

    if (entry.expiresAt && now > entry.expiresAt) {
      this.delete(key)
      this.stats.misses++
      return undefined
    }

    entry.accessedAt = now
    this.stats.hits++
    return entry.value
  }

  has(key: string): boolean {
    const entry = this.storage.get(key)
    if (!entry) return false

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    const entry = this.storage.get(key)
    if (entry) {
      this.onExpire?.(key, entry.value)
      return this.storage.delete(key)
    }
    return false
  }

  clear(): void {
    if (this.onExpire) {
      this.storage.forEach((entry, key) => {
        this.onExpire!(key, entry.value)
      })
    }
    this.storage.clear()
    this.stats = { hits: 0, misses: 0 }
  }

  private evict(): void {
    const now = Date.now()
    const keys = Array.from(this.storage.keys())
    let oldestKey: string | null = null
    let oldestTime = now

    for (const key of keys) {
      const entry = this.storage.get(key)
      if (entry) {
        if (entry.accessedAt < oldestTime) {
          oldestTime = entry.accessedAt
          oldestKey = key
        }
        if (entry.expiresAt && now > entry.expiresAt + this.staleWhileRevalidate) {
          this.storage.delete(key)
        }
      }
    }

    if (oldestKey !== null) {
      const entry = this.storage.get(oldestKey)
      if (entry) {
        this.onExpire?.(oldestKey, entry.value)
        this.storage.delete(oldestKey)
      }
    }
  }

  private estimateSize(value: unknown): number {
    try {
      return JSON.stringify(value).length
    } catch {
      return 1
    }
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.storage.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this.stats.hits / total : 0
    }
  }

  keys(): string[] {
    return Array.from(this.storage.keys())
  }

  values(): T[] {
    return Array.from(this.storage.values()).map(entry => entry.value)
  }

  entries(): Array<[string, T]> {
    return Array.from(this.storage.entries()).map(([key, entry]) => [key, entry.value])
  }

  prune(): number {
    const now = Date.now()
    let count = 0

    this.storage.forEach((entry, key) => {
      if (entry.expiresAt && now > entry.expiresAt + this.staleWhileRevalidate) {
        this.delete(key)
        count++
      }
    })

    return count
  }

  setTTL(ttl: number): void {
    this.ttl = ttl
  }

  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize
    if (this.storage.size > maxSize) {
      this.evict()
    }
  }
}

export class MemoryCache<T = unknown> extends Cache<T> {
  private static instance: MemoryCache

  static getInstance<T>(): MemoryCache<T> {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache<T>()
    }
    return MemoryCache.instance as MemoryCache<T>
  }
}

export class LRUCache<T = unknown> extends Cache<T> {
  private ordering: string[] = []

  set(key: string, value: T, ttl?: number): void {
    super.set(key, value, ttl)
    this.updateOrder(key)
  }

  get(key: string): T | undefined {
    const value = super.get(key)
    if (value !== undefined) {
      this.updateOrder(key)
    }
    return value
  }

  private updateOrder(key: string): void {
    const index = this.ordering.indexOf(key)
    if (index !== -1) {
      this.ordering.splice(index, 1)
    }
    this.ordering.push(key)
  }

  evictLRU(): void {
    const maxSize = this.getStats().maxSize
    while (this.ordering.length > maxSize) {
      const oldest = this.ordering.shift()
      if (oldest) {
        this.delete(oldest)
      }
    }
  }
}

export function createCache<T>(options?: CacheOptions): Cache<T> {
  return new Cache<T>(options)
}

export function createMemoryCache<T>(options?: CacheOptions): MemoryCache<T> {
  return MemoryCache.getInstance<T>()
}

export function createLRUCache<T>(options?: CacheOptions): LRUCache<T> {
  return new LRUCache<T>(options)
}
