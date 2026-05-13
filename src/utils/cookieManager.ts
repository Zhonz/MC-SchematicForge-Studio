export interface CookieOptions {
  expires?: number | Date
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  httpOnly?: boolean
}

export interface CookieData {
  value: string
  options: CookieOptions
}

export class CookieManager {
  private static cache: Map<string, CookieData> = new Map()

  static set(name: string, value: string, options: CookieOptions = {}): void {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

    if (options.expires) {
      if (options.expires instanceof Date) {
        cookie += `; Expires=${options.expires.toUTCString()}`
      } else {
        const date = new Date()
        date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000)
        cookie += `; Expires=${date.toUTCString()}`
      }
    }

    if (options.path) cookie += `; Path=${options.path}`
    if (options.domain) cookie += `; Domain=${options.domain}`
    if (options.secure) cookie += `; Secure`
    if (options.sameSite) cookie += `; SameSite=${options.sameSite}`
    if (options.httpOnly) cookie += `; HttpOnly`

    document.cookie = cookie
    this.cache.set(name, { value, options })
  }

  static get(name: string): string | null {
    if (this.cache.has(name)) {
      return this.cache.get(name)!.value
    }

    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=')
      if (decodeURIComponent(cookieName) === name) {
        const value = decodeURIComponent(cookieValue)
        this.cache.set(name, { value, options: {} })
        return value
      }
    }
    return null
  }

  static has(name: string): boolean {
    return this.get(name) !== null
  }

  static delete(name: string, options?: { path?: string; domain?: string }): void {
    const cookieOptions: CookieOptions = {
      ...options,
      expires: new Date(0)
    }
    this.set(name, '', cookieOptions)
    this.cache.delete(name)
  }

  static clear(): void {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name] = cookie.trim().split('=')
      if (name) this.delete(decodeURIComponent(name))
    }
    this.cache.clear()
  }

  static getAll(): Record<string, string> {
    const cookies = document.cookie.split(';')
    const result: Record<string, string> = {}

    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name) {
        result[decodeURIComponent(name)] = decodeURIComponent(value || '')
      }
    }

    return result
  }

  static getWithMetadata(name: string): CookieData | null {
    const value = this.get(name)
    if (value === null) return null

    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [cookieName] = cookie.trim().split('=')
      if (decodeURIComponent(cookieName) === name) {
        const rawCookie = cookie.trim()
        const options: CookieOptions = {}

        if (rawCookie.includes('Expires=')) {
          const match = rawCookie.match(/Expires=([^;]+)/)
          if (match) options.expires = new Date(match[1])
        }
        if (rawCookie.includes('Path=')) {
          const match = rawCookie.match(/Path=([^;]+)/)
          if (match) options.path = match[1]
        }
        if (rawCookie.includes('Domain=')) {
          const match = rawCookie.match(/Domain=([^;]+)/)
          if (match) options.domain = match[1]
        }
        if (rawCookie.includes('Secure')) options.secure = true
        if (rawCookie.includes('SameSite=Strict')) options.sameSite = 'strict'
        if (rawCookie.includes('SameSite=Lax')) options.sameSite = 'lax'
        if (rawCookie.includes('SameSite=None')) options.sameSite = 'none'
        if (rawCookie.includes('HttpOnly')) options.httpOnly = true

        return { value, options }
      }
    }

    return { value, options: {} }
  }

  static isEnabled(): boolean {
    try {
      const testKey = '__cookie_test__'
      this.set(testKey, 'true')
      const result = this.has(testKey)
      this.delete(testKey)
      return result
    } catch {
      return false
    }
  }
}
