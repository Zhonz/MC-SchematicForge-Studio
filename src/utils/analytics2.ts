export type EventType = 'click' | 'doubleClick' | 'hover' | 'focus' | 'blur' | 'input' | 'change' | 'submit' | 'keydown' | 'keyup' | 'scroll' | 'resize' | 'drag' | 'drop' | 'touchstart' | 'touchmove' | 'touchend'

export interface AnalyticsEvent {
  type: EventType
  category: string
  action: string
  label?: string
  value?: number
  metadata?: Record<string, unknown>
  timestamp: number
  userId?: string
  sessionId?: string
  page?: string
  element?: string
}

export interface FunnelStep {
  name: string
  events: string[]
  conversionRate?: number
  dropoffRate?: number
}

export interface UserSegment {
  id: string
  name: string
  criteria: Record<string, unknown>
  count: number
}

export interface CohortData {
  period: string
  users: number
  retention: number[]
}

export interface DashboardMetrics {
  pageViews: number
  uniqueVisitors: number
  bounceRate: number
  avgSessionDuration: number
  conversions: number
  conversionRate: number
}

interface EventFilter {
  category?: string
  type?: EventType
  action?: string
  since?: number
}

export class Analytics {
  private static instance: Analytics
  private events: AnalyticsEvent[] = []
  private sessionId: string
  private userId?: string
  private startTime: number
  private listeners: Map<string, Set<(event: AnalyticsEvent) => void>> = new Map()
  private maxEvents: number = 10000

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics()
    }
    return Analytics.instance
  }

  setUserId(userId: string): void {
    this.userId = userId
  }

  getSessionId(): string {
    return this.sessionId
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  track(event: Partial<AnalyticsEvent>): void {
    const fullEvent: AnalyticsEvent = {
      type: event.type || 'click',
      category: event.category || 'general',
      action: event.action || 'unknown',
      label: event.label,
      value: event.value,
      metadata: event.metadata,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      page: event.page || this.getCurrentPage()
    }

    this.events.push(fullEvent)

    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }

    this.notifyListeners(fullEvent)
  }

  trackClick(action: string, category?: string, label?: string, metadata?: Record<string, unknown>): void {
    this.track({ type: 'click', category: category || 'ui', action, label, metadata })
  }

  trackPageView(page: string, metadata?: Record<string, unknown>): void {
    this.track({ type: 'click', category: 'navigation', action: 'page_view', metadata: { ...metadata, page } })
  }

  trackConversion(action: string, value?: number, metadata?: Record<string, unknown>): void {
    this.track({ type: 'click', category: 'conversion', action, value, metadata })
  }

  trackError(error: Error, metadata?: Record<string, unknown>): void {
    this.track({
      type: 'click',
      category: 'error',
      action: error.name,
      metadata: { ...metadata, message: error.message, stack: error.stack }
    })
  }

  trackTiming(category: string, name: string, duration: number, metadata?: Record<string, unknown>): void {
    this.track({
      type: 'click',
      category: 'timing',
      action: name,
      metadata: { ...metadata, duration }
    })
  }

  private getCurrentPage(): string {
    return typeof window !== 'undefined' ? window.location.pathname : ''
  }

  private notifyListeners(event: AnalyticsEvent): void {
    const categoryListeners = this.listeners.get(event.category)
    categoryListeners?.forEach(listener => listener(event))

    const typeListeners = this.listeners.get(event.type)
    typeListeners?.forEach(listener => listener(event))

    const allListeners = this.listeners.get('*')
    allListeners?.forEach(listener => listener(event))
  }

  subscribe(category: string, listener: (event: AnalyticsEvent) => void): () => void {
    if (!this.listeners.has(category)) {
      this.listeners.set(category, new Set())
    }
    this.listeners.get(category)!.add(listener)

    return () => {
      this.listeners.get(category)?.delete(listener)
    }
  }

  getEvents(filter?: EventFilter): AnalyticsEvent[] {
    let filtered = [...this.events]

    if (filter?.category) {
      filtered = filtered.filter(e => e.category === filter.category)
    }
    if (filter?.type) {
      filtered = filtered.filter(e => e.type === filter.type)
    }
    if (filter?.action) {
      filtered = filtered.filter(e => e.action === filter.action)
    }
    if (filter?.since) {
      filtered = filtered.filter(e => e.timestamp >= filter.since!)
    }

    return filtered
  }

  getEventCount(filter?: EventFilter): number {
    return this.getEvents(filter).length
  }

  getConversionRate(conversionAction: string, totalAction: string): number {
    const total = this.getEventCount({ action: totalAction })
    const conversions = this.getEventCount({ action: conversionAction })
    return total > 0 ? (conversions / total) * 100 : 0
  }

  getFunnel(steps: FunnelStep[]): FunnelStep[] {
    const result: FunnelStep[] = []

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepEvents = this.getEvents({ action: step.events[0] })
      const count = stepEvents.length

      if (i === 0) {
        result.push({ ...step, conversionRate: 100 })
      } else {
        const prevCount = result[i - 1].conversionRate! * (this.getEvents({ action: steps[i - 1].events[0] }).length / 100)
        const conversionRate = (count / prevCount) * 100
        result.push({ ...step, conversionRate, dropoffRate: 100 - conversionRate })
      }
    }

    return result
  }

  getCohortData(periods: number = 7): CohortData[] {
    const cohorts: CohortData[] = []
    const now = Date.now()
    const periodMs = 24 * 60 * 60 * 1000

    for (let i = 0; i < periods; i++) {
      const periodStart = now - (periods - i) * periodMs
      const periodEnd = periodStart + periodMs
      const usersInPeriod = this.events.filter(
        e => e.timestamp >= periodStart && e.timestamp < periodEnd && e.userId
      )

      const uniqueUsers = new Set(usersInPeriod.map(e => e.userId)).size
      const retention: number[] = []

      for (let j = i; j < periods; j++) {
        const nextPeriodStart = now - (periods - j) * periodMs
        const nextPeriodEnd = nextPeriodStart + periodMs
        const retainedUsers = new Set(
          this.events.filter(
            e => e.timestamp >= nextPeriodStart && 
            e.timestamp < nextPeriodEnd &&
            e.userId &&
            usersInPeriod.some(ue => ue.userId === e.userId)
          ).map(e => e.userId)
        ).size

        retention.push(uniqueUsers > 0 ? (retainedUsers / uniqueUsers) * 100 : 0)
      }

      cohorts.push({
        period: new Date(periodStart).toLocaleDateString(),
        users: uniqueUsers,
        retention
      })
    }

    return cohorts
  }

  getDashboardMetrics(): DashboardMetrics {
    const events = this.getEvents()
    const sessionDuration = (Date.now() - this.startTime) / 1000
    const pageViews = events.filter(e => e.action === 'page_view').length
    const uniqueVisitors = new Set(events.filter(e => e.userId).map(e => e.userId)).size
    const conversions = events.filter(e => e.category === 'conversion').length
    const bounceRate = pageViews > 0 ? ((pageViews - 1) / pageViews) * 100 : 0

    return {
      pageViews,
      uniqueVisitors,
      bounceRate,
      avgSessionDuration: sessionDuration,
      conversions,
      conversionRate: pageViews > 0 ? (conversions / pageViews) * 100 : 0
    }
  }

  segmentUsers(criteria: Record<string, unknown>): UserSegment[] {
    const segments: Map<string, AnalyticsEvent[]> = new Map()

    for (const event of this.events) {
      const key = JSON.stringify(criteria)
      if (!segments.has(key)) {
        segments.set(key, [])
      }
      segments.get(key)!.push(event)
    }

    return Array.from(segments.entries()).map(([key, evts]) => ({
      id: this.hashString(key),
      name: key,
      criteria,
      count: new Set(evts.map(e => e.userId)).size
    }))
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  export(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.startTime,
      events: this.events
    })
  }

  clear(): void {
    this.events = []
  }

  endSession(): void {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
  }
}

export const analytics = Analytics.getInstance()

export function track(action: string, category?: string, metadata?: Record<string, unknown>): void {
  analytics.trackClick(action, category, undefined, metadata)
}

export function pageView(path: string, metadata?: Record<string, unknown>): void {
  analytics.trackPageView(path, metadata)
}

export function identify(userId: string): void {
  analytics.setUserId(userId)
}
