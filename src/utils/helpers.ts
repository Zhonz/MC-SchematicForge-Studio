export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  resolver?: (...args: Parameters<T>) => unknown
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = resolver
      ? JSON.stringify(resolver(...args))
      : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args) as ReturnType<T>
    cache.set(key, result)
    return result
  }) as T
}

export function once<T extends (...args: unknown[]) => unknown>(fn: T): T {
  let called = false
  let result: ReturnType<T>

  return ((...args: Parameters<T>) => {
    if (!called) {
      result = fn(...args) as ReturnType<T>
      called = true
    }
    return result
  }) as T
}

export function partial<T extends (...args: unknown[]) => unknown, U extends unknown[]>(
  fn: T,
  ...initialArgs: U
): (...rest: Parameters<T> extends [...args: U, ...rest: infer R] ? R : never) => ReturnType<T> {
  return (...rest: Parameters<T> extends [...args: U, ...rest: infer R] ? R : never) => {
    return fn(...initialArgs, ...rest) as ReturnType<T>
  }
}

export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (value: T) => fns.reduceRight((acc, fn) => fn(acc), value)
}

export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (value: T) => fns.reduce((acc, fn) => fn(acc), value)
}

export function curry<T extends (...args: unknown[]) => unknown>(
  fn: T,
  arity: number = fn.length
): T {
  return function curried(...args: unknown[]): unknown {
    if (args.length >= arity) {
      return fn(...args)
    }
    return (...moreArgs: unknown[]) => curried(...args, ...moreArgs)
  } as T
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number
    delay?: number
    onRetry?: (error: Error, attempt: number) => void
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, onRetry } = options

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      if (onRetry && error instanceof Error) {
        onRetry(error, attempt)
      }
      await sleep(delay * attempt)
    }
  }

  throw new Error('Retry failed')
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

export function groupBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string | number)
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' 
      ? String(key(item)) 
      : String(item[key])
    
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(
  array: T[],
  key: keyof T | ((item: T) => unknown),
  order: 'asc' | 'desc' = 'asc'
): T[] {
  const sorted = [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key as keyof T]
    const bVal = typeof key === 'function' ? key(b) : b[key as keyof T]

    if (aVal == null || bVal == null) return 0
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })

  return sorted
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result as Omit<T, K>
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T
  }

  if (obj instanceof Object) {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }

  return obj
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false

  const keysA = Object.keys(a as object)
  const keysB = Object.keys(b as object)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false
    }
  }

  return true
}

export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1)
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
