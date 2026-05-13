export interface TokenBucket {
  tokens: number
  lastRefill: number
}

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  keyGenerator?: () => string
}

export interface CircuitBreakerOptions {
  failureThreshold: number
  resetTimeout: number
  monitorInterval?: number
}

export class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map()
  private options: RateLimitOptions
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor(options: RateLimitOptions) {
    this.options = options
    this.startCleanup()
  }

  private getBucket(key: string): TokenBucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, { tokens: this.options.maxRequests, lastRefill: Date.now() })
    }

    const bucket = this.buckets.get(key)!
    const now = Date.now()
    const elapsed = now - bucket.lastRefill
    const refillRate = (elapsed / this.options.windowMs) * this.options.maxRequests

    bucket.tokens = Math.min(this.options.maxRequests, bucket.tokens + refillRate)
    bucket.lastRefill = now

    return bucket
  }

  tryConsume(key: string): boolean {
    const bucket = this.getBucket(key)
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      return true
    }
    return false
  }

  getRemainingTokens(key: string): number {
    const bucket = this.getBucket(key)
    return Math.floor(bucket.tokens)
  }

  reset(key: string): void {
    this.buckets.delete(key)
  }

  resetAll(): void {
    this.buckets.clear()
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, bucket] of this.buckets) {
        if (now - bucket.lastRefill > this.options.windowMs * 2) {
          this.buckets.delete(key)
        }
      }
    }, this.options.windowMs)
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private failureCount: number = 0
  private lastFailureTime: number = 0
  private options: CircuitBreakerOptions
  private onStateChange?: (state: string) => void

  constructor(options: CircuitBreakerOptions, onStateChange?: (state: string) => void) {
    this.options = options
    this.onStateChange = onStateChange
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.transitionTo('half-open')
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.transitionTo('closed')
    }
    this.failureCount = 0
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.options.failureThreshold) {
      this.transitionTo('open')
    }
  }

  private transitionTo(state: 'closed' | 'open' | 'half-open'): void {
    if (this.state !== state) {
      this.state = state
      this.onStateChange?.(state)
    }
  }

  getState(): string {
    return this.state
  }

  reset(): void {
    this.state = 'closed'
    this.failureCount = 0
  }

  isOpen(): boolean {
    return this.state === 'open'
  }
}

export class RetryHandler {
  constructor(
    private maxRetries: number = 3,
    private baseDelay: number = 1000,
    private maxDelay: number = 30000,
    private backoffMultiplier: number = 2,
    private jitter: boolean = true
  ) {}

  async execute<T>(fn: () => Promise<T>, retries = this.maxRetries): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        if (attempt < retries) {
          const delay = this.calculateDelay(attempt)
          await this.sleep(delay)
        }
      }
    }

    throw lastError
  }

  private calculateDelay(attempt: number): number {
    let delay = Math.min(this.baseDelay * Math.pow(this.backoffMultiplier, attempt), this.maxDelay)

    if (this.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }

    return delay
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export class Bulkhead {
  private executing: number = 0
  private queue: Array<() => void> = []
  private maxConcurrent: number
  private maxQueue: number

  constructor(maxConcurrent: number, maxQueue: number) {
    this.maxConcurrent = maxConcurrent
    this.maxQueue = maxQueue
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.executing >= this.maxConcurrent) {
      if (this.queue.length >= this.maxQueue) {
        throw new Error('Bulkhead queue is full')
      }

      return new Promise<T>((resolve, reject) => {
        this.queue.push(async () => {
          try {
            const result = await fn()
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
      })
    }

    this.executing++
    try {
      return await fn()
    } finally {
      this.executing--
      this.processQueue()
    }
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.executing < this.maxConcurrent) {
      const next = this.queue.shift()
      if (next) {
        this.executing++
        next()
        this.executing--
        this.processQueue()
      }
    }
  }

  getExecutingCount(): number {
    return this.executing
  }

  getQueueLength(): number {
    return this.queue.length
  }
}

export class Throttler {
  private queue: Array<() => void> = []
  private executing: boolean = false
  private delayMs: number
  private maxConcurrent: number
  private currentConcurrent: number = 0

  constructor(delayMs: number, maxConcurrent = 1) {
    this.delayMs = delayMs
    this.maxConcurrent = maxConcurrent
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task = async () => {
        if (this.currentConcurrent >= this.maxConcurrent) {
          return
        }

        this.currentConcurrent++
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.currentConcurrent--
          this.processNext()
        }
      }

      this.queue.push(task)
      this.processNext()
    })
  }

  private async processNext(): Promise<void> {
    if (this.executing || this.queue.length === 0) return

    if (this.currentConcurrent >= this.maxConcurrent) return

    this.executing = true
    const task = this.queue.shift()

    if (task) {
      await this.sleep(this.delayMs)
      task()
    }

    this.executing = false
    this.processNext()
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  clear(): void {
    this.queue = []
  }
}
