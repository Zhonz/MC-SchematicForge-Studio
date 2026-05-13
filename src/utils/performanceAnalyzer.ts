export interface WebVitalsMetrics {
  FCP?: number
  LCP?: number
  FID?: number
  CLS?: number
  TTFB?: number
  INP?: number
}

interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface LayoutShift {
  value: number
  hadRecentInput: boolean
}

interface InteractionTiming {
  duration: number
}

export interface PerformanceMetrics {
  navigation: PerformanceNavigationTiming | null
  paint: PerformancePaintTiming | null
  memory: PerformanceMemory | null
  timing: PerformanceTiming | null
  resources: PerformanceResourceTiming[]
  marks: PerformanceMark[]
  measures: PerformanceMeasure[]
}

export interface ResourceMetrics {
  totalResources: number
  cachedResources: number
  uncachedResources: number
  averageLoadTime: number
  largestResources: Array<{ name: string; size: number; duration: number }>
}

export interface TimingMetrics {
  pageLoad: number
  domContentLoaded: number
  domComplete: number
  scriptLoad: number
  styleLoad: number
  firstPaint: number
  firstContentfulPaint: number
}

export class PerformanceAnalyzer {
  private static instance: PerformanceAnalyzer
  private metrics: WebVitalsMetrics = {}
  private observers: Map<string, PerformanceObserver | null> = new Map()
  private listeners: Array<(metrics: WebVitalsMetrics) => void> = []

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initWebVitals()
    }
  }

  static getInstance(): PerformanceAnalyzer {
    if (!PerformanceAnalyzer.instance) {
      PerformanceAnalyzer.instance = new PerformanceAnalyzer()
    }
    return PerformanceAnalyzer.instance
  }

  private initWebVitals(): void {
    this.observeFCP()
    this.observeLCP()
    this.observeCLS()
    this.observeINP()
  }

  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = entry.startTime
            this.notifyListeners()
          }
        }
      })
      observer.observe({ type: 'paint', buffered: true })
      this.observers.set('fcp', observer)
    } catch {
      this.observers.set('fcp', null)
    }
  }

  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry
        this.metrics.LCP = lastEntry.startTime
        this.notifyListeners()
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      this.observers.set('lcp', observer)
    } catch {
      this.observers.set('lcp', null)
    }
  }

  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return

    let clsValue = 0
    let clsEntries: PerformanceEntry[] = []

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shiftEntry = entry as unknown as Record<string, unknown>
          if (shiftEntry && !shiftEntry.hadRecentInput) {
            clsEntries.push(entry)
            clsValue += shiftEntry.value as number
          }
        }
        this.metrics.CLS = clsValue
        this.notifyListeners()
      })
      observer.observe({ type: 'layout-shift', buffered: true })
      this.observers.set('cls', observer)
    } catch {
      this.observers.set('cls', null)
    }
  }

  private observeINP(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const inpEntry = entry as PerformanceEntry & InteractionTiming
          if (inpEntry.duration > 40) {
            this.metrics.INP = inpEntry.duration
            this.notifyListeners()
          }
        }
      })
      observer.observe({ type: 'event', buffered: true })
      this.observers.set('inp', observer)
    } catch {
      this.observers.set('inp', null)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.metrics))
  }

  subscribe(listener: (metrics: WebVitalsMetrics) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  getMetrics(): WebVitalsMetrics {
    const metrics: WebVitalsMetrics = { ...this.metrics }

    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navTiming) {
          metrics.TTFB = navTiming.responseStart - navTiming.requestStart
        }
      } catch {}
    }

    return metrics
  }

  getResourceMetrics(): ResourceMetrics {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    let cachedResources = 0
    let totalLoadTime = 0

    resources.forEach(resource => {
      if (resource.transferSize === 0) {
        cachedResources++
      }
      totalLoadTime += resource.responseEnd - resource.startTime
    })

    const largestResources = resources
      .map(r => ({
        name: r.name,
        size: r.transferSize,
        duration: r.responseEnd - r.startTime
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 5)

    return {
      totalResources: resources.length,
      cachedResources,
      uncachedResources: resources.length - cachedResources,
      averageLoadTime: resources.length > 0 ? totalLoadTime / resources.length : 0,
      largestResources
    }
  }

  getTimingMetrics(): TimingMetrics | null {
    if (typeof window === 'undefined') return null

    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paintTiming = performance.getEntriesByType('paint')

    if (!navTiming) return null

    const getPaintTime = (name: string): number => {
      const entry = paintTiming.find(p => p.name === name)
      return entry?.startTime || 0
    }

    return {
      pageLoad: navTiming.loadEventEnd - navTiming.startTime,
      domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.startTime,
      domComplete: navTiming.domComplete - navTiming.startTime,
      scriptLoad: navTiming.domContentLoadedEventEnd - navTiming.fetchStart,
      styleLoad: navTiming.domComplete - navTiming.domContentLoadedEventEnd,
      firstPaint: getPaintTime('first-paint'),
      firstContentfulPaint: getPaintTime('first-contentful-paint')
    }
  }

  getMemoryUsage(): { used: number; total: number; limit: number } | null {
    if (typeof window === 'undefined') return null

    const perf = performance as unknown as { memory?: PerformanceMemory }
    const memory = perf.memory
    if (!memory) return null

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    }
  }

  mark(name: string): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(name)
    }
  }

  measure(name: string, startMark: string, endMark?: string): number | null {
    if (typeof window === 'undefined' || !('performance' in window)) return null

    try {
      performance.measure(name, startMark, endMark)
      const measures = performance.getEntriesByName(name) as PerformanceMeasure[]
      const lastMeasure = measures[measures.length - 1]
      return lastMeasure?.duration || null
    } catch {
      return null
    }
  }

  clearMarks(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.clearMarks()
    }
  }

  clearMeasures(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.clearMeasures()
    }
  }

  disconnect(): void {
    this.observers.forEach(observer => observer?.disconnect())
    this.observers.clear()
    this.listeners = []
  }
}

export const perfAnalyzer = PerformanceAnalyzer.getInstance()

export function getWebVitalsScore(): { score: number; rating: 'good' | 'needs-improvement' | 'poor' } {
  const metrics = perfAnalyzer.getMetrics()
  
  let score = 100

  if (metrics.FCP) {
    if (metrics.FCP > 3000) score -= 30
    else if (metrics.FCP > 1800) score -= 15
  }

  if (metrics.LCP) {
    if (metrics.LCP > 4000) score -= 25
    else if (metrics.LCP > 2500) score -= 10
  }

  if (metrics.CLS) {
    if (metrics.CLS > 0.25) score -= 20
    else if (metrics.CLS > 0.1) score -= 10
  }

  if (metrics.FID || metrics.INP) {
    const fid = metrics.FID || metrics.INP || 0
    if (fid > 300) score -= 15
    else if (fid > 100) score -= 5
  }

  const rating = score >= 90 ? 'good' : score >= 50 ? 'needs-improvement' : 'poor'

  return { score: Math.max(0, score), rating }
}
