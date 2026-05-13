export interface IDGeneratorOptions {
  prefix?: string
  timestamp?: boolean
  random?: boolean
  uppercase?: boolean
  length?: number
}

export class IDGenerator {
  private static instance: IDGenerator
  private counters: Map<string, number> = new Map()
  private options: Required<IDGeneratorOptions>

  private constructor() {
    this.options = {
      prefix: '',
      timestamp: true,
      random: true,
      uppercase: false,
      length: 12
    }
  }

  static getInstance(): IDGenerator {
    if (!IDGenerator.instance) {
      IDGenerator.instance = new IDGenerator()
    }
    return IDGenerator.instance
  }

  setOptions(options: IDGeneratorOptions): void {
    Object.assign(this.options, options)
  }

  generate(customOptions?: IDGeneratorOptions): string {
    const opts = { ...this.options, ...customOptions }
    const parts: string[] = []

    if (opts.prefix) {
      parts.push(opts.prefix)
    }

    if (opts.timestamp) {
      parts.push(Date.now().toString(36))
    }

    if (opts.random) {
      parts.push(this.randomString(opts.length - parts.join('').length))
    }

    let id = parts.join('')

    if (opts.uppercase) {
      id = id.toUpperCase()
    }

    return id
  }

  private randomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  generateNanoId(size: number = 21): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    let id = ''
    const bytes = crypto.getRandomValues(new Uint8Array(size))
    for (let i = 0; i < size; i++) {
      id += alphabet[bytes[i] & 63]
    }
    return id
  }

  generateShortId(): string {
    return Math.random().toString(36).substring(2, 10)
  }

  increment(name: string): number {
    const current = this.counters.get(name) || 0
    const next = current + 1
    this.counters.set(name, next)
    return next
  }

  reset(name?: string): void {
    if (name) {
      this.counters.delete(name)
    } else {
      this.counters.clear()
    }
  }

  parse(id: string): { prefix?: string; timestamp?: string; random?: string } {
    const parts = id.split('-')
    return {
      prefix: parts.length > 1 ? parts[0] : undefined,
      timestamp: parts.length > 2 ? parts[1] : undefined,
      random: parts.length > 2 ? parts.slice(2).join('-') : undefined
    }
  }
}

export const idGenerator = IDGenerator.getInstance()

export function generateId(options?: IDGeneratorOptions): string {
  return idGenerator.generate(options)
}

export function generateUUID(): string {
  return idGenerator.generateUUID()
}

export function generateNanoId(size?: number): string {
  return idGenerator.generateNanoId(size)
}

export function generateShortId(): string {
  return idGenerator.generateShortId()
}
