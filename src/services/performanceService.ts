import { PerformanceMetrics } from '@/types'

class PerformanceService {
  private metrics: PerformanceMetrics = {
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    blockCount: 0,
    lastUpdate: Date.now(),
  }

  private frameCount = 0
  private lastFpsUpdate = Date.now()
  private subscribers: ((metrics: PerformanceMetrics) => void)[] = []
  private isMonitoring = false
  private animationFrameId: number | null = null

  startMonitoring(): void {
    if (this.isMonitoring) return
    this.isMonitoring = true
    this.frameCount = 0
    this.lastFpsUpdate = Date.now()
    this.measureLoop()
  }

  stopMonitoring(): void {
    this.isMonitoring = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private measureLoop(): void {
    if (!this.isMonitoring) return

    this.frameCount++
    const now = Date.now()

    if (now - this.lastFpsUpdate >= 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate))
      this.frameCount = 0
      this.lastFpsUpdate = now
    }

    this.metrics.memoryUsage = this.getMemoryUsage()
    this.metrics.lastUpdate = now

    this.notifySubscribers()

    this.animationFrameId = requestAnimationFrame(() => this.measureLoop())
  }

  measureRenderTime<T>(renderFn: () => T): T {
    const start = performance.now()
    const result = renderFn()
    const end = performance.now()
    this.metrics.renderTime = end - start
    return result
  }

  updateBlockCount(count: number): void {
    this.metrics.blockCount = count
  }

  markFrameRender(): void {
    this.frameCount++
  }

  updateMetrics(metrics: Partial<PerformanceMetrics>): void {
    Object.assign(this.metrics, metrics)
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback)
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback({ ...this.metrics }))
  }

  private getMemoryUsage(): number {
    if (performance && 'memory' in performance) {
      const memory = (performance as any).memory
      return Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
    }
    return 0
  }

  getPerformanceReport(): string {
    return `
Performance Report
==================
FPS: ${this.metrics.fps}
Memory Usage: ${this.metrics.memoryUsage}%
Render Time: ${this.metrics.renderTime.toFixed(2)}ms
Block Count: ${this.metrics.blockCount}
Last Update: ${new Date(this.metrics.lastUpdate).toISOString()}
    `.trim()
  }

  reset(): void {
    this.metrics = {
      fps: 0,
      memoryUsage: 0,
      renderTime: 0,
      blockCount: 0,
      lastUpdate: Date.now(),
    }
    this.frameCount = 0
    this.lastFpsUpdate = Date.now()
  }
}

export const performanceService = new PerformanceService()
