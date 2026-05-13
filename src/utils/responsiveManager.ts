export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export interface BreakpointConfig {
  xs?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
  xxl?: number
}

export interface ResponsiveValue<T> {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  xxl?: T
  base?: T
}

export interface ViewportSize {
  width: number
  height: number
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
}

export class ResponsiveManager {
  private static instance: ResponsiveManager
  private config: BreakpointConfig = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
  }
  private listeners: Set<(size: ViewportSize) => void> = new Set()
  private currentSize: ViewportSize

  private constructor() {
    this.currentSize = this.getViewportSize()
    this.setupListener()
  }

  static getInstance(): ResponsiveManager {
    if (!ResponsiveManager.instance) {
      ResponsiveManager.instance = new ResponsiveManager()
    }
    return ResponsiveManager.instance
  }

  setConfig(config: BreakpointConfig): void {
    this.config = { ...this.config, ...config }
    this.currentSize = this.getViewportSize()
    this.notifyListeners()
  }

  getConfig(): BreakpointConfig {
    return { ...this.config }
  }

  getViewportSize(): ViewportSize {
    const width = typeof window !== 'undefined' ? window.innerWidth : 0
    const height = typeof window !== 'undefined' ? window.innerHeight : 0

    let breakpoint: Breakpoint = 'xs'
    if (width >= this.config.xxl!) breakpoint = 'xxl'
    else if (width >= this.config.xl!) breakpoint = 'xl'
    else if (width >= this.config.lg!) breakpoint = 'lg'
    else if (width >= this.config.md!) breakpoint = 'md'
    else if (width >= this.config.sm!) breakpoint = 'sm'

    return {
      width,
      height,
      breakpoint,
      isMobile: breakpoint === 'xs' || breakpoint === 'sm',
      isTablet: breakpoint === 'md' || breakpoint === 'lg',
      isDesktop: breakpoint === 'xl' || breakpoint === 'xxl',
      isLargeDesktop: breakpoint === 'xxl'
    }
  }

  getBreakpoint(): Breakpoint {
    return this.currentSize.breakpoint
  }

  isBelow(breakpoint: Breakpoint): boolean {
    const widths = Object.values(this.config)
    const index = Object.keys(this.config).indexOf(breakpoint)
    return this.currentSize.width < widths[index]
  }

  isAbove(breakpoint: Breakpoint): boolean {
    const widths = Object.values(this.config)
    const index = Object.keys(this.config).indexOf(breakpoint)
    return this.currentSize.width >= widths[index + 1]
  }

  isBetween(start: Breakpoint, end: Breakpoint): boolean {
    return !this.isBelow(start) && !this.isAbove(end)
  }

  subscribe(listener: (size: ViewportSize) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private setupListener(): void {
    if (typeof window === 'undefined') return

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        this.currentSize = this.getViewportSize()
        this.notifyListeners()
      }, 100)
    }

    window.addEventListener('resize', handleResize)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentSize))
  }
}

export const responsive = ResponsiveManager.getInstance()

export function getValue<T>(responsiveValue: ResponsiveValue<T>): T | undefined {
  const size = responsive.getViewportSize()
  
  return (
    responsiveValue[size.breakpoint] ||
    responsiveValue[size.isMobile ? 'sm' : size.isTablet ? 'md' : size.isDesktop ? 'lg' : 'xl'] ||
    responsiveValue.base
  )
}

export function useResponsiveValue<T>(responsiveValue: ResponsiveValue<T>): T | undefined {
  return getValue(responsiveValue)
}

export function getBreakpointWidth(breakpoint: Breakpoint): number {
  return responsive.getConfig()[breakpoint] || 0
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function isRetinaDisplay(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window.devicePixelRatio && window.devicePixelRatio > 1)
}

export function getPixelRatio(): number {
  if (typeof window === 'undefined') return 1
  return window.devicePixelRatio || 1
}

export function getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }

  const style = window.getComputedStyle(document.documentElement)
  
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0')
  }
}
