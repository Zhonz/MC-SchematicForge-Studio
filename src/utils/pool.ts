export interface PoolOptions<T> {
  min?: number
  max?: number
  acquireTimeout?: number
  idleTimeout?: number
  evictionRunInterval?: number
  onCreate?: () => T | Promise<T>
  onDestroy?: (item: T) => void | Promise<void>
  validate?: (item: T) => boolean
}

export interface PooledItem<T> {
  item: T
  createdAt: number
  lastUsedAt: number
  inUse: boolean
}

export class ObjectPool<T> {
  private available: PooledItem<T>[] = []
  private inUse: Set<PooledItem<T>> = new Set()
  private options: Required<PoolOptions<T>>
  private evictionTimer: ReturnType<typeof setInterval> | null = null

  constructor(options: PoolOptions<T>) {
    this.options = {
      min: options.min || 0,
      max: options.max || 10,
      acquireTimeout: options.acquireTimeout || 5000,
      idleTimeout: options.idleTimeout || 30000,
      evictionRunInterval: options.evictionRunInterval || 10000,
      onCreate: options.onCreate || (() => ({}) as T),
      onDestroy: options.onDestroy || (() => {}),
      validate: options.validate || (() => true)
    }

    this.startEviction()
  }

  async acquire(): Promise<T> {
    const startTime = Date.now()

    while (true) {
      const pooledItem = this.available.find(item => 
        !item.inUse && this.options.validate(item.item)
      )

      if (pooledItem) {
        pooledItem.inUse = true
        pooledItem.lastUsedAt = Date.now()
        this.inUse.add(pooledItem)
        return pooledItem.item
      }

      if (this.available.length + this.inUse.size < this.options.max) {
        const item = await Promise.resolve(this.options.onCreate())
        const pooledItem: PooledItem<T> = {
          item,
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
          inUse: true
        }
        this.inUse.add(pooledItem)
        return item
      }

      if (Date.now() - startTime >= this.options.acquireTimeout) {
        throw new Error('Pool acquire timeout')
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  release(item: T): void {
    for (const pooledItem of this.inUse) {
      if (pooledItem.item === item) {
        pooledItem.inUse = false
        this.inUse.delete(pooledItem)

        if (this.available.length < this.options.max) {
          this.available.push(pooledItem)
        } else {
          Promise.resolve(this.options.onDestroy(item))
        }
        return
      }
    }
  }

  async drain(): Promise<void> {
    for (const item of [...this.available]) {
      await Promise.resolve(this.options.onDestroy(item.item))
    }
    this.available = []

    for (const item of [...this.inUse]) {
      await Promise.resolve(this.options.onDestroy(item.item))
    }
    this.inUse.clear()
  }

  private evict(): void {
    const now = Date.now()
    const toEvict: PooledItem<T>[] = []

    while (this.available.length > this.options.min) {
      const oldest = this.available.reduce((min, item) => 
        item.lastUsedAt < min.lastUsedAt ? item : min
      , this.available[0])

      if (now - oldest.lastUsedAt > this.options.idleTimeout) {
        toEvict.push(oldest)
        const index = this.available.indexOf(oldest)
        if (index !== -1) {
          this.available.splice(index, 1)
        }
      } else {
        break
      }
    }

    for (const item of toEvict) {
      Promise.resolve(this.options.onDestroy(item.item))
    }
  }

  private startEviction(): void {
    this.evictionTimer = setInterval(() => {
      this.evict()
    }, this.options.evictionRunInterval)
  }

  stopEviction(): void {
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer)
      this.evictionTimer = null
    }
  }

  getStats(): {
    total: number
    available: number
    inUse: number
    min: number
    max: number
  } {
    return {
      total: this.available.length + this.inUse.size,
      available: this.available.length,
      inUse: this.inUse.size,
      min: this.options.min,
      max: this.options.max
    }
  }

  clear(): void {
    this.drain()
    this.stopEviction()
  }
}

export class ConnectionPool {
  private pool: ObjectPool<{ id: string; busy: boolean }>

  constructor(options: { min?: number; max?: number } = {}) {
    let connectionId = 0

    this.pool = new ObjectPool<{ id: string; busy: boolean }>({
      min: options.min || 2,
      max: options.max || 10,
      onCreate: async () => ({
        id: `conn-${++connectionId}`,
        busy: false as boolean
      }),
      onDestroy: async () => {},
      validate: (conn: { id: string; busy: boolean }) => !conn.busy
    })
  }

  async acquire(): Promise<{ id: string; release: () => void }> {
    const conn = await this.pool.acquire()
    return {
      id: conn.id,
      release: () => this.pool.release(conn)
    }
  }

  async drain(): Promise<void> {
    await this.pool.drain()
  }
}

export function createPool<T>(options: PoolOptions<T>): ObjectPool<T> {
  return new ObjectPool(options)
}
