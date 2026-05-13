export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary'

export interface Metric {
  name: string
  type: MetricType
  value: number
  timestamp: number
  labels?: Record<string, string>
}

export interface Counter {
  name: string
  value: number
  labels?: Record<string, string>
}

export interface Gauge {
  name: string
  value: number
  labels?: Record<string, string>
}

export interface Histogram {
  name: string
  count: number
  sum: number
  buckets: Map<number, number>
  labels?: Record<string, string>
}

export interface Summary {
  name: string
  count: number
  sum: number
  quantiles: Map<number, number>
  labels?: Record<string, string>
}

export class MetricsCollector {
  private static instance: MetricsCollector
  private counters: Map<string, Counter> = new Map()
  private gauges: Map<string, Gauge> = new Map()
  private histograms: Map<string, Histogram> = new Map()
  private summaries: Map<string, Summary> = new Map()
  private observers: Array<(metric: Metric) => void> = []

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name
    const labelStr = Object.entries(labels).sort().map(([k, v]) => `${k}:${v}`).join(',')
    return `${name}{${labelStr}}`
  }

  private notifyObservers(metric: Metric): void {
    this.observers.forEach(observer => observer(metric))
  }

  counter(name: string, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels)
    const existing = this.counters.get(key)
    
    if (existing) {
      existing.value++
    } else {
      this.counters.set(key, { name, value: 1, labels })
    }

    this.notifyObservers({
      name,
      type: 'counter',
      value: this.counters.get(key)!.value,
      timestamp: Date.now(),
      labels
    })
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels)
    this.gauges.set(key, { name, value, labels })

    this.notifyObservers({
      name,
      type: 'gauge',
      value,
      timestamp: Date.now(),
      labels
    })
  }

  gaugeInc(name: string, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels)
    const existing = this.gauges.get(key)
    const value = (existing?.value || 0) + 1
    this.gauge(name, value, labels)
  }

  gaugeDec(name: string, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels)
    const existing = this.gauges.get(key)
    const value = (existing?.value || 0) - 1
    this.gauge(name, value, labels)
  }

  histogram(name: string, value: number, labels?: Record<string, string>, buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]): void {
    const key = this.getKey(name, labels)
    let histogram = this.histograms.get(key)

    if (!histogram) {
      histogram = {
        name,
        count: 0,
        sum: 0,
        buckets: new Map(buckets.map(b => [b, 0])),
        labels
      }
      this.histograms.set(key, histogram)
    }

    histogram.count++
    histogram.sum += value
    
    for (const bucket of buckets) {
      if (value <= bucket) {
        histogram.buckets.set(bucket, (histogram.buckets.get(bucket) || 0) + 1)
      }
    }

    this.notifyObservers({
      name,
      type: 'histogram',
      value,
      timestamp: Date.now(),
      labels
    })
  }

  summary(name: string, value: number, labels?: Record<string, string>, quantiles: number[] = [0.5, 0.9, 0.99]): void {
    const key = this.getKey(name, labels)
    let summary = this.summaries.get(key)

    if (!summary) {
      summary = {
        name,
        count: 0,
        sum: 0,
        quantiles: new Map(quantiles.map(q => [q, 0])),
        labels
      }
      this.summaries.set(key, summary)
    }

    summary.count++
    summary.sum += value

    const values = this.getSummaryValues(name, labels)
    values.push(value)
    values.sort((a, b) => a - b)

    for (const q of quantiles) {
      const index = Math.floor(q * values.length)
      summary.quantiles.set(q, values[index])
    }

    this.notifyObservers({
      name,
      type: 'summary',
      value,
      timestamp: Date.now(),
      labels
    })
  }

  private summaryValuesCache: Map<string, number[]> = new Map()

  private getSummaryValues(name: string, labels?: Record<string, string>): number[] {
    const key = this.getKey(name, labels)
    if (!this.summaryValuesCache.has(key)) {
      this.summaryValuesCache.set(key, [])
    }
    return this.summaryValuesCache.get(key)!
  }

  observe(name: string, value: number, labels?: Record<string, string>): void {
    this.histogram(name, value, labels)
  }

  timing(name: string, duration: number, labels?: Record<string, string>): void {
    this.histogram(name + '_duration_seconds', duration / 1000, labels)
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.getKey(name, labels)
    return this.counters.get(key)?.value || 0
  }

  getGauge(name: string, labels?: Record<string, string>): number {
    const key = this.getKey(name, labels)
    return this.gauges.get(key)?.value || 0
  }

  getHistogram(name: string, labels?: Record<string, string>): Histogram | undefined {
    const key = this.getKey(name, labels)
    return this.histograms.get(key)
  }

  getSummary(name: string, labels?: Record<string, string>): Summary | undefined {
    const key = this.getKey(name, labels)
    return this.summaries.get(key)
  }

  getAllMetrics(): Metric[] {
    const metrics: Metric[] = []

    this.counters.forEach(counter => {
      metrics.push({
        name: counter.name,
        type: 'counter',
        value: counter.value,
        timestamp: Date.now(),
        labels: counter.labels
      })
    })

    this.gauges.forEach(gauge => {
      metrics.push({
        name: gauge.name,
        type: 'gauge',
        value: gauge.value,
        timestamp: Date.now(),
        labels: gauge.labels
      })
    })

    return metrics
  }

  subscribe(observer: (metric: Metric) => void): () => void {
    this.observers.push(observer)
    return () => {
      const index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  reset(): void {
    this.counters.clear()
    this.gauges.clear()
    this.histograms.clear()
    this.summaries.clear()
    this.summaryValuesCache.clear()
  }

  export(): string {
    const metrics = this.getAllMetrics()
    return metrics.map(m => {
      const labels = m.labels ? `{${Object.entries(m.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : ''
      return `${m.name}${labels} ${m.value}`
    }).join('\n')
  }
}

export const metrics = MetricsCollector.getInstance()

export function measure<T>(name: string, fn: () => T, labels?: Record<string, string>): T {
  const start = performance.now()
  try {
    return fn()
  } finally {
    const duration = performance.now() - start
    metrics.timing(name, duration, labels)
  }
}

export async function measureAsync<T>(name: string, fn: () => Promise<T>, labels?: Record<string, string>): Promise<T> {
  const start = performance.now()
  try {
    return await fn()
  } finally {
    const duration = performance.now() - start
    metrics.timing(name, duration, labels)
  }
}
