export interface UUIDOptions {
  namespace?: string
  version?: 1 | 2 | 3 | 4 | 5
}

export class IDGenerator {
  private static counter: number = 0
  private static chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  static generate(size = 8): string {
    let result = ''
    for (let i = 0; i < size; i++) {
      result += this.chars.charAt(Math.floor(Math.random() * this.chars.length))
    }
    return result
  }

  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  static generateNanoID(size = 21): string {
    const id = this.generate(size)
    const index = Math.floor(Math.random() * (id.length - 1))
    const chars = 'useandom-2021'
    return id.slice(0, index) + chars[index % chars.length] + id.slice(index + 1)
  }

  static increment(prefix = ''): string {
    this.counter++
    return `${prefix}${this.counter}`
  }

  static timestamp(prefix = ''): string {
    return `${prefix}${Date.now()}-${this.counter++}`
  }

  static generateHash(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50)
      + '-' + this.generate(6)
  }

  static generateShortCode(length = 6): string {
    return this.generate(length)
  }

  static generateBatch(count: number, generator: () => string = () => this.generate()): string[] {
    return Array.from({ length: count }, generator)
  }

  static generateSequential(prefix = '', start = 1): () => string {
    let current = start
    return () => `${prefix}${current++}`
  }

  static parseUUID(uuid: string): { version: number; variant: string } | null {
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-([1-5])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const match = uuid.match(pattern)
    if (!match) return null

    return {
      version: parseInt(match[1], 10),
      variant: 'RFC4122'
    }
  }

  static isValidUUID(uuid: string): boolean {
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return pattern.test(uuid)
  }

  static generateUserId(): string {
    return `user_${this.generate(12)}`
  }

  static generateSessionId(): string {
    return `sess_${this.generate(24)}`
  }

  static generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${this.generate(8)}`
  }

  static generateTraceId(): string {
    return `${Date.now().toString(36)}-${this.generate(12)}-${this.generate(6)}`
  }
}

export function generateID(): string {
  return IDGenerator.generateUUID()
}

export function generateShortID(length = 8): string {
  return IDGenerator.generate(length)
}

export function generateNanoID(): string {
  return IDGenerator.generateNanoID()
}
