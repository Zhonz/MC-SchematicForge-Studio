export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface BreakpointConfig {
  breakpoints: Record<Breakpoint, number>
  containerWidths: Record<Breakpoint, number>
  gutter: number
}

export const DEFAULT_BREAKPOINT_CONFIG: BreakpointConfig = {
  breakpoints: {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },
  containerWidths: {
    xs: 300,
    sm: 600,
    md: 720,
    lg: 960,
    xl: 1140,
    '2xl': 1320
  },
  gutter: 16
}

export class ResponsiveLayout {
  private config: BreakpointConfig
  private listeners: Set<(breakpoint: Breakpoint) => void> = new Set()
  private currentBreakpoint: Breakpoint = 'md'

  constructor(config: BreakpointConfig = DEFAULT_BREAKPOINT_CONFIG) {
    this.config = config
    this.currentBreakpoint = this.getBreakpointFromWidth(window.innerWidth)
    this.setupListener()
  }

  private setupListener(): void {
    let resizeTimeout: ReturnType<typeof setTimeout>

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        const newBreakpoint = this.getBreakpointFromWidth(window.innerWidth)
        if (newBreakpoint !== this.currentBreakpoint) {
          this.currentBreakpoint = newBreakpoint
          this.notifyListeners()
        }
      }, 100)
    }

    window.addEventListener('resize', handleResize, { passive: true })
  }

  private getBreakpointFromWidth(width: number): Breakpoint {
    const { breakpoints } = this.config
    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
  }

  getBreakpoint(): Breakpoint {
    return this.currentBreakpoint
  }

  getWidth(): number {
    return window.innerWidth
  }

  getHeight(): number {
    return window.innerHeight
  }

  getAspectRatio(): 'portrait' | 'landscape' | 'square' {
    const width = this.getWidth()
    const height = this.getHeight()
    const ratio = width / height

    if (ratio < 0.9) return 'portrait'
    if (ratio > 1.1) return 'landscape'
    return 'square'
  }

  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  isMobile(): boolean {
    return this.currentBreakpoint === 'xs' || this.currentBreakpoint === 'sm'
  }

  isTablet(): boolean {
    return this.currentBreakpoint === 'md' || this.currentBreakpoint === 'lg'
  }

  isDesktop(): boolean {
    return this.currentBreakpoint === 'xl' || this.currentBreakpoint === '2xl'
  }

  isAtLeast(breakpoint: Breakpoint): boolean {
    const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = breakpoints.indexOf(this.currentBreakpoint)
    const targetIndex = breakpoints.indexOf(breakpoint)
    return currentIndex >= targetIndex
  }

  isAtMost(breakpoint: Breakpoint): boolean {
    const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = breakpoints.indexOf(this.currentBreakpoint)
    const targetIndex = breakpoints.indexOf(breakpoint)
    return currentIndex <= targetIndex
  }

  subscribe(callback: (breakpoint: Breakpoint) => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentBreakpoint)
      } catch (error) {
        console.error('Responsive layout listener error:', error)
      }
    })
  }

  getContainerWidth(): number {
    return this.config.containerWidths[this.currentBreakpoint]
  }

  getGutter(): number {
    return this.config.gutter * this.getGutterMultiplier()
  }

  private getGutterMultiplier(): number {
    if (this.isMobile()) return 0.75
    if (this.isTablet()) return 1
    return 1.25
  }

  getFontScale(): number {
    if (this.isMobile()) return 0.875
    if (this.isTablet()) return 0.9375
    return 1
  }

  getIconSize(): number {
    if (this.isMobile()) return 16
    if (this.isTablet()) return 20
    return 24
  }

  getSpacing(): {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
  } {
    const base = 4
    const scale = this.getFontScale()

    return {
      xs: Math.round(base * 0.5 * scale),
      sm: Math.round(base * 1 * scale),
      md: Math.round(base * 2 * scale),
      lg: Math.round(base * 3 * scale),
      xl: Math.round(base * 4 * scale),
      xxl: Math.round(base * 6 * scale)
    }
  }

  getGridColumns(): number {
    if (this.currentBreakpoint === 'xs') return 4
    if (this.currentBreakpoint === 'sm') return 6
    if (this.currentBreakpoint === 'md') return 8
    if (this.currentBreakpoint === 'lg') return 12
    return 16
  }

  getAnimationDuration(): {
    fast: number
    normal: number
    slow: number
  } {
    if (this.isMobile()) {
      return {
        fast: 100,
        normal: 200,
        slow: 300
      }
    }
    return {
      fast: 150,
      normal: 250,
      slow: 400
    }
  }

  shouldReduceMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  getDeviceInfo(): {
    breakpoint: Breakpoint
    width: number
    height: number
    aspectRatio: 'portrait' | 'landscape' | 'square'
    isTouch: boolean
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
  } {
    return {
      breakpoint: this.getBreakpoint(),
      width: this.getWidth(),
      height: this.getHeight(),
      aspectRatio: this.getAspectRatio(),
      isTouch: this.isTouchDevice(),
      isMobile: this.isMobile(),
      isTablet: this.isTablet(),
      isDesktop: this.isDesktop()
    }
  }
}

export const responsiveLayout = new ResponsiveLayout()

export function useResponsive() {
  return responsiveLayout.getDeviceInfo()
}

export function useBreakpoint() {
  return responsiveLayout.getBreakpoint()
}

export function createResponsiveStyles(
  base: React.CSSProperties,
  styles: Partial<Record<Breakpoint, React.CSSProperties>>
): React.CSSProperties {
  const currentBreakpoint = responsiveLayout.getBreakpoint()
  const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
  const currentIndex = breakpoints.indexOf(currentBreakpoint)

  const result = { ...base }

  for (let i = 0; i <= currentIndex; i++) {
    const breakpoint = breakpoints[i]
    if (styles[breakpoint]) {
      Object.assign(result, styles[breakpoint])
    }
  }

  return result
}
