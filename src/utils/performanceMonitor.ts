export interface MemoryStats {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  timestamp: number
}

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  memory: MemoryStats
  drawCalls: number
  triangles: number
}

type MetricCallback = (metrics: PerformanceMetrics) => void

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private subscribers: Set<MetricCallback> = new Set()
  private fpsHistory: number[] = []
  private lastFrameTime: number = performance.now()
  private frameCount: number = 0
  private animationId: number | null = null
  private isRunning: boolean = false
  private memorySnapshots: MemoryStats[] = []
  private maxSnapshots: number = 100

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.measureFrame()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  subscribe(callback: MetricCallback): () => void {
    this.subscribers.add(callback)
    this.start()
    return () => {
      this.subscribers.delete(callback)
      if (this.subscribers.size === 0) {
        this.stop()
      }
    }
  }

  private measureFrame(): void {
    if (!this.isRunning) return

    this.animationId = requestAnimationFrame(() => {
      const now = performance.now()
      const frameTime = now - this.lastFrameTime
      this.lastFrameTime = now

      const fps = 1000 / frameTime
      this.fpsHistory.push(fps)
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift()
      }

      const memory = this.getMemoryStats()
      if (memory) {
        this.memorySnapshots.push(memory)
        if (this.memorySnapshots.length > this.maxSnapshots) {
          this.memorySnapshots.shift()
        }
      }

      const metrics: PerformanceMetrics = {
        fps: Math.round(fps),
        frameTime: Math.round(frameTime * 100) / 100,
        memory: memory || {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
          jsHeapSizeLimit: 0,
          timestamp: Date.now()
        },
        drawCalls: 0,
        triangles: 0
      }

      this.subscribers.forEach(callback => {
        try {
          callback(metrics)
        } catch (error) {
          console.error('Performance monitor callback error:', error)
        }
      })

      this.measureFrame()
    })
  }

  getMemoryStats(): MemoryStats | null {
    const performance = window.performance as Performance & {
      memory?: {
        usedJSHeapSize: number
        totalJSHeapSize: number
        jsHeapSizeLimit: number
      }
    }

    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      }
    }
    return null
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0)
    return Math.round(sum / this.fpsHistory.length)
  }

  getMemoryUsage(): number {
    const stats = this.getMemoryStats()
    if (!stats) return 0
    return Math.round((stats.usedJSHeapSize / stats.jsHeapSizeLimit) * 100 * 100) / 100
  }

  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memorySnapshots.length < 10) return 'stable'
    
    const recent = this.memorySnapshots.slice(-5)
    const older = this.memorySnapshots.slice(-10, -5)
    
    const recentAvg = recent.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / recent.length
    const olderAvg = older.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / older.length
    
    const change = (recentAvg - olderAvg) / olderAvg
    
    if (change > 0.05) return 'increasing'
    if (change < -0.05) return 'decreasing'
    return 'stable'
  }

  hasMemoryLeak(): boolean {
    if (this.memorySnapshots.length < 20) return false
    
    const recent = this.memorySnapshots.slice(-10)
    const older = this.memorySnapshots.slice(-20, -10)
    
    const recentAvg = recent.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / recent.length
    const olderAvg = older.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / older.length
    
    return recentAvg > olderAvg * 1.5
  }

  forceGC(): void {
    const win = window as Window & { gc?: () => void }
    if (win.gc) {
      win.gc()
    }
  }

  getStats(): {
    averageFPS: number
    currentFPS: number
    memoryUsage: number
    memoryTrend: 'increasing' | 'decreasing' | 'stable'
    hasLeak: boolean
    snapshotCount: number
  } {
    return {
      averageFPS: this.getAverageFPS(),
      currentFPS: this.fpsHistory[this.fpsHistory.length - 1] || 0,
      memoryUsage: this.getMemoryUsage(),
      memoryTrend: this.getMemoryTrend(),
      hasLeak: this.hasMemoryLeak(),
      snapshotCount: this.memorySnapshots.length
    }
  }

  clearHistory(): void {
    this.fpsHistory = []
    this.memorySnapshots = []
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

export function createMemoryGuard<T extends object>(
  name: string,
  target: T,
  onLeak?: (ref: T) => void
): T {
  const leaks = new WeakSet<T>()
  leaks.add(target)

  const originalTarget = target

  return new Proxy(target, {
    get(obj, prop, receiver) {
      return Reflect.get(obj, prop, receiver)
    },
    set(obj, prop, value, receiver) {
      return Reflect.set(obj, prop, value, receiver)
    }
  })
}

export function trackAllocation(name: string): () => void {
  const perf = window.performance as Performance & {
    memory?: { usedJSHeapSize: number }
  }
  const start = perf.memory?.usedJSHeapSize || 0
  return () => {
    const end = perf.memory?.usedJSHeapSize || 0
    const diff = end - start
    console.log(`[Memory] ${name}: ${diff > 0 ? '+' : ''}${Math.round(diff / 1024)}KB`)
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

export function createMemorySnapshot(): MemoryStats | null {
  return performanceMonitor.getMemoryStats()
}
