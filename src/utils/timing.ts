export interface DebounceOptions {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

export interface ThrottleOptions {
  leading?: boolean
  trailing?: boolean
}

export class TimingUtils {
  static debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    wait: number,
    options?: DebounceOptions
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastArgs: Parameters<T> | null = null
    let lastCallTime: number | null = null

    const { leading = false, trailing = true, maxWait } = options || {}

    const debounced = function (this: unknown, ...args: Parameters<T>): void {
      lastArgs = args
      const now = Date.now()

      if (timeoutId === null && leading) {
        fn.apply(this, args)
        lastCallTime = now
      }

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      if (maxWait !== undefined && lastCallTime !== null && now - lastCallTime >= maxWait) {
        fn.apply(this, lastArgs)
        lastCallTime = now
      }

      timeoutId = setTimeout(() => {
        if (trailing && lastArgs) {
          fn.apply(this, lastArgs)
        }
        timeoutId = null
        lastCallTime = null
      }, wait)
    }

    return debounced
  }

  static throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    wait: number,
    options?: ThrottleOptions
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastArgs: Parameters<T> | null = null
    let lastCallTime = 0

    const { leading = true, trailing = true } = options || {}

    const throttled = function (this: unknown, ...args: Parameters<T>): void {
      const now = Date.now()
      const remaining = wait - (now - lastCallTime)

      if (remaining <= 0 || remaining > wait) {
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        lastCallTime = now
        fn.apply(this, args)
      } else if (!timeoutId && trailing) {
        lastArgs = args
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now()
          timeoutId = null
          if (lastArgs) {
            fn.apply(this, lastArgs)
            lastArgs = null
          }
        }, remaining)
      }
    }

    return throttled
  }

  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static timeout<T>(promise: Promise<T>, ms: number, error?: Error): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(error || new Error('Timeout')), ms)
      )
    ])
  }

  static raf<T>(fn: () => T): Promise<T> {
    return new Promise(resolve => requestAnimationFrame(() => resolve(fn())))
  }

  static interval(fn: () => void, ms: number): () => void {
    const id = setInterval(fn, ms)
    return () => clearInterval(id)
  }

  static once<T extends (...args: unknown[]) => unknown>(fn: T): T {
    let called = false
    let result: ReturnType<T>

    return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
      if (!called) {
        result = fn.apply(this, args) as ReturnType<T>
        called = true
      }
      return result
    } as T
  }

  static memoize<T extends (...args: unknown[]) => unknown>(
    fn: T,
    resolver?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>()

    return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
      const key = resolver ? resolver(...args) : JSON.stringify(args)

      if (cache.has(key)) {
        return cache.get(key)!
      }

      const result = fn.apply(this, args) as ReturnType<T>
      cache.set(key, result)
      return result
    } as unknown as T
  }

  static memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    resolver?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, unknown>()
    const pending = new Map<string, Promise<unknown>>()

    return function (this: unknown, ...args: Parameters<T>): unknown {
      const key = resolver ? resolver(...args) : JSON.stringify(args)

      if (cache.has(key)) {
        return Promise.resolve(cache.get(key))
      }

      if (pending.has(key)) {
        return pending.get(key)!
      }

      const promise = fn.apply(this, args)
      pending.set(key, promise as Promise<unknown>)

      return promise.then(result => {
        cache.set(key, result)
        pending.delete(key)
        return result
      })
    } as unknown as T
  }

  static retry<T>(
    fn: () => Promise<T>,
    options: {
      attempts?: number
      delay?: number
      exponential?: boolean
      onRetry?: (attempt: number, error: Error) => void
    } = {}
  ): Promise<T> {
    const { attempts = 3, delay = 1000, exponential = false, onRetry } = options

    return fn().catch((error) => {
      if (attempts <= 1) throw error

      if (onRetry) {
        onRetry(1, error)
      }

      const wait = exponential ? delay * 2 : delay

      return new Promise<T>((resolve) => setTimeout(resolve, wait))
        .then(() => TimingUtils.retry(fn, {
          attempts: attempts - 1,
          delay: wait,
          exponential,
          onRetry
        }))
    })
  }

  static batch<T, R>(
    fn: (items: T[]) => Promise<R[]>,
    options: {
      size?: number
      delay?: number
    } = {}
  ): (item: T) => Promise<R> {
    const { size = 10, delay = 100 } = options
    let batch: T[] = []
    let resolver: ((result: R) => void) | null = null
    let rejecter: ((error: Error) => void) | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return function (item: T): Promise<R> {
      return new Promise<R>((resolve, reject) => {
        batch.push(item)
        resolver = resolve
        rejecter = reject

        if (batch.length >= size) {
          processBatch()
        } else if (!timeoutId) {
          timeoutId = setTimeout(processBatch, delay)
        }
      })
    }

    function processBatch(): void {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      const currentBatch = [...batch]
      const currentResolver = resolver!
      const currentRejecter = rejecter!
      batch = []
      resolver = null
      rejecter = null

      fn(currentBatch)
        .then(results => {
          results.forEach((result, index) => {
            if (index === 0) {
              currentResolver(result)
            }
          })
        })
        .catch(currentRejecter)
    }
  }
}

export const debounce = TimingUtils.debounce
export const throttle = TimingUtils.throttle
export const delay = TimingUtils.delay
export const timeout = TimingUtils.timeout
export const raf = TimingUtils.raf
export const once = TimingUtils.once
export const memoize = TimingUtils.memoize
export const retry = TimingUtils.retry
