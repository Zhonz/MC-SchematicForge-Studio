import { CacheEntry } from '@/types'

class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>()
  private defaultTTL = 5 * 60 * 1000

  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl
    }
    this.cache.set(key, entry as CacheEntry<unknown>)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  clearExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  getOrSet<T>(key: string, factory: () => T, ttl?: number): T {
    const cached = this.get<T>(key)
    if (cached !== null) return cached

    const value = factory()
    this.set(key, value, ttl)
    return value
  }

  async getOrSetAsync<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) return cached

    const value = await factory()
    this.set(key, value, ttl)
    return value
  }

  size(): number {
    this.clearExpired()
    return this.cache.size
  }

  keys(): string[] {
    this.clearExpired()
    return Array.from(this.cache.keys())
  }

  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl
  }

  getStats(): {
    size: number
    keys: string[]
    memoryEstimate: number
  } {
    this.clearExpired()
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryEstimate: this.estimateMemory()
    }
  }

  private estimateMemory(): number {
    let total = 0
    for (const entry of this.cache.values()) {
      try {
        total += JSON.stringify(entry).length * 2
      } catch {
        total += 100
      }
    }
    return Math.round(total / 1024)
  }
}

export const cacheService = new CacheService()
