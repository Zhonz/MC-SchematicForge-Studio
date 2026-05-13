export interface MediaQuery {
  media: string
  matches: boolean
}

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export interface BreakpointInfo {
  name: Breakpoint
  minWidth: number
  maxWidth: number
}

export class Responsive {
  private static queries: Map<string, MediaQueryList> = new Map()
  private static listeners: Map<string, Set<(query: MediaQuery) => void>> = new Map()

  static readonly breakpoints: Record<Breakpoint, { min: number; max: number }> = {
    xs: { min: 0, max: 575 },
    sm: { min: 576, max: 767 },
    md: { min: 768, max: 991 },
    lg: { min: 992, max: 1199 },
    xl: { min: 1200, max: 1399 },
    xxl: { min: 1400, max: Infinity }
  }

  static getCurrentBreakpoint(): Breakpoint {
    const width = window.innerWidth

    if (width >= this.breakpoints.xxl.min) return 'xxl'
    if (width >= this.breakpoints.xl.min) return 'xl'
    if (width >= this.breakpoints.lg.min) return 'lg'
    if (width >= this.breakpoints.md.min) return 'md'
    if (width >= this.breakpoints.sm.min) return 'sm'
    return 'xs'
  }

  static isMobile(): boolean {
    return this.getCurrentBreakpoint() === 'xs' || this.getCurrentBreakpoint() === 'sm'
  }

  static isTablet(): boolean {
    return this.getCurrentBreakpoint() === 'md'
  }

  static isDesktop(): boolean {
    return this.getCurrentBreakpoint() === 'lg' || this.getCurrentBreakpoint() === 'xl' || this.getCurrentBreakpoint() === 'xxl'
  }

  static match(query: string): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  }

  static registerQuery(query: string): MediaQuery {
    if (this.queries.has(query)) {
      const existing = this.queries.get(query)!
      return { media: query, matches: existing.matches }
    }

    const mediaQuery = window.matchMedia(query)
    this.queries.set(query, mediaQuery)

    const handler = (event: MediaQueryListEvent): void => {
      const queryData: MediaQuery = { media: query, matches: event.matches }
      this.notifyListeners(query, queryData)
    }

    mediaQuery.addEventListener('change', handler)

    return { media: query, matches: mediaQuery.matches }
  }

  static subscribe(query: string, callback: (query: MediaQuery) => void): () => void {
    const queryData = this.registerQuery(query)

    if (!this.listeners.has(query)) {
      this.listeners.set(query, new Set())
    }

    this.listeners.get(query)!.add(callback)

    callback(queryData)

    return () => {
      this.listeners.get(query)?.delete(callback)
    }
  }

  private static notifyListeners(query: string, queryData: MediaQuery): void {
    const listeners = this.listeners.get(query)
    if (listeners) {
      listeners.forEach(callback => callback(queryData))
    }
  }

  static getBreakpointInfo(breakpoint: Breakpoint): BreakpointInfo {
    const range = this.breakpoints[breakpoint]
    return {
      name: breakpoint,
      minWidth: range.min,
      maxWidth: range.max
    }
  }

  static isBreakpoint(breakpoint: Breakpoint): boolean {
    return this.getCurrentBreakpoint() === breakpoint
  }

  static isBreakpointUp(breakpoint: Breakpoint): boolean {
    const width = window.innerWidth
    return width >= this.breakpoints[breakpoint].min
  }

  static isBreakpointDown(breakpoint: Breakpoint): boolean {
    const width = window.innerWidth
    return width <= this.breakpoints[breakpoint].max
  }

  static onResize(callback: () => void, debounce = 100): () => void {
    let timeout: ReturnType<typeof setTimeout> | null = null

    const handler = (): void => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(callback, debounce)
    }

    window.addEventListener('resize', handler)

    return () => {
      window.removeEventListener('resize', handler)
      if (timeout) clearTimeout(timeout)
    }
  }

  static onOrientationChange(callback: () => void): () => void {
    const handler = (): void => {
      callback()
    }

    window.addEventListener('orientationchange', handler)

    return () => {
      window.removeEventListener('orientationchange', handler)
    }
  }

  static getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  }

  static supports(property: string): boolean {
    if (typeof window === 'undefined') return false
    return property in window.document.body.style
  }

  static getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1
  }

  static isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  static isRetina(): boolean {
    return this.getDevicePixelRatio() > 1
  }

  static isPrefersReducedMotion(): boolean {
    return this.match('(prefers-reduced-motion: reduce)')
  }

  static isPrefersDarkMode(): boolean {
    return this.match('(prefers-color-scheme: dark)')
  }

  static isPrintMode(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('print').matches
  }
}
