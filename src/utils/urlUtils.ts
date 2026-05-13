export interface QueryParams {
  [key: string]: string | number | boolean | undefined | null
}

export interface ParsedQuery {
  [key: string]: string
}

export class URLUtils {
  static buildQuery(params: QueryParams): string {
    const filtered = Object.entries(params).filter(([, value]) => value !== undefined && value !== null)

    if (filtered.length === 0) return ''

    return filtered.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&')
  }

  static parseQuery(query: string): ParsedQuery {
    const cleanQuery = query.startsWith('?') ? query.slice(1) : query

    if (!cleanQuery) return {}

    const result: ParsedQuery = {}
    cleanQuery.split('&').forEach(pair => {
      const [key, value] = pair.split('=')
      if (key) {
        result[decodeURIComponent(key)] = decodeURIComponent(value || '')
      }
    })

    return result
  }

  static getQueryParam(key: string): string | null {
    const params = this.parseQuery(window.location.search)
    return params[key] || null
  }

  static setQueryParam(key: string, value: string): void {
    const url = new URL(window.location.href)
    url.searchParams.set(key, value)
    window.history.replaceState({}, '', url.toString())
  }

  static removeQueryParam(key: string): void {
    const url = new URL(window.location.href)
    url.searchParams.delete(key)
    window.history.replaceState({}, '', url.toString())
  }

  static updateQueryParams(params: QueryParams): void {
    const url = new URL(window.location.href)
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        url.searchParams.delete(key)
      } else {
        url.searchParams.set(key, String(value))
      }
    })
    window.history.replaceState({}, '', url.toString())
  }

  static buildURL(base: string, path: string, params?: QueryParams): string {
    let url = base.replace(/\/$/, '') + '/' + path.replace(/^\//, '')

    if (params && Object.keys(params).length > 0) {
      const queryString = this.buildQuery(params)
      if (queryString) {
        url += '?' + queryString
      }
    }

    return url
  }

  static parseURL(urlString: string): { protocol: string; host: string; port: string; pathname: string; query: ParsedQuery; hash: string } | null {
    try {
      const url = new URL(urlString)
      return {
        protocol: url.protocol.replace(':', ''),
        host: url.hostname,
        port: url.port,
        pathname: url.pathname,
        query: this.parseQuery(url.search),
        hash: url.hash.replace('#', '')
      }
    } catch {
      return null
    }
  }

  static isAbsoluteURL(url: string): boolean {
    return /^[a-z][a-z0-9+.-]*:/.test(url)
  }

  static isRelativeURL(url: string): boolean {
    return !this.isAbsoluteURL(url)
  }

  static resolveURL(base: string, relative: string): string {
    return new URL(relative, base).href
  }

  static getOrigin(url: string): string | null {
    try {
      return new URL(url).origin
    } catch {
      return null
    }
  }

  static getPathname(url: string): string | null {
    try {
      return new URL(url).pathname
    } catch {
      return null
    }
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

  static camelCase(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
  }

  static snakeCase(text: string): string {
    return text
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
  }

  static kebabCase(text: string): string {
    return text
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
  }

  static truncate(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - suffix.length) + suffix
  }

  static stripTags(html: string): string {
    return html.replace(/<[^>]*>/g, '')
  }

  static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return text.replace(/[&<>"']/g, char => map[char])
  }

  static unescapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'"
    }
    return text.replace(/&(amp|lt|gt|quot|#39);/g, entity => map[entity] || entity)
  }

  static isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  static isValidURL(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  static isValidPhone(phone: string): boolean {
    const regex = /^[\d\s\-+()]+$/
    return regex.test(phone) && phone.replace(/\D/g, '').length >= 10
  }
}
