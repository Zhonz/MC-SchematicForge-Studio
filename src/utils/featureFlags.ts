export type FeatureKey = string
export type VersionString = string

export interface FeatureFlag {
  key: FeatureKey
  enabled: boolean
  rollout?: number
  variants?: Record<string, number>
  conditions?: FeatureConditions
  metadata?: Record<string, unknown>
}

export interface FeatureConditions {
  userId?: string[]
  percentage?: number
  dateRange?: { start: Date; end: Date }
  environment?: string[]
  custom?: (context: FeatureContext) => boolean
}

export interface FeatureContext {
  userId?: string
  userGroup?: string
  environment?: string
  timestamp: number
  attributes?: Record<string, unknown>
}

export interface FeatureResult {
  enabled: boolean
  variant?: string
  reason?: string
}

export class FeatureManager {
  private static instance: FeatureManager
  private flags: Map<FeatureKey, FeatureFlag> = new Map()
  private listeners: Map<FeatureKey, Set<(result: FeatureResult) => void>> = new Map()
  private globalListeners: Set<(key: FeatureKey, result: FeatureResult) => void> = new Set()

  private constructor() {
    this.loadFromStorage()
  }

  static getInstance(): FeatureManager {
    if (!FeatureManager.instance) {
      FeatureManager.instance = new FeatureManager()
    }
    return FeatureManager.instance
  }

  register(key: FeatureKey, config: Partial<FeatureFlag>): void {
    const flag: FeatureFlag = {
      key,
      enabled: config.enabled ?? false,
      rollout: config.rollout,
      variants: config.variants,
      conditions: config.conditions,
      metadata: config.metadata
    }
    this.flags.set(key, flag)
    this.saveToStorage()
  }

  unregister(key: FeatureKey): void {
    this.flags.delete(key)
    this.saveToStorage()
  }

  isEnabled(key: FeatureKey, context: FeatureContext = { timestamp: Date.now() }): boolean {
    const flag = this.flags.get(key)
    if (!flag) return false

    const result = this.evaluate(key, flag, context)
    return result.enabled
  }

  getVariant(key: FeatureKey, context: FeatureContext = { timestamp: Date.now() }): string | undefined {
    const flag = this.flags.get(key)
    if (!flag || !flag.variants) return undefined

    const result = this.evaluate(key, flag, context)
    return result.variant
  }

  evaluate(key: FeatureKey, flag: FeatureFlag, context: FeatureContext): FeatureResult {
    if (!flag.enabled) {
      return { enabled: false, reason: 'Feature disabled' }
    }

    if (flag.conditions) {
      const conditionResult = this.checkConditions(flag.conditions, context)
      if (!conditionResult.pass) {
        return { enabled: false, reason: conditionResult.reason }
      }
    }

    if (flag.rollout !== undefined) {
      const hash = this.hash(context.userId || key + context.timestamp)
      const percentage = hash % 100
      if (percentage >= flag.rollout) {
        return { enabled: false, reason: 'Rollout percentage not reached' }
      }
    }

    let variant: string | undefined
    if (flag.variants) {
      variant = this.getVariantByHash(flag.variants, context.userId || key)
    }

    const featureResult = { enabled: true, variant, reason: 'All conditions passed' }
    this.notifyListeners(key, featureResult)
    return featureResult
  }

  private checkConditions(
    conditions: FeatureConditions,
    context: FeatureContext
  ): { pass: boolean; reason?: string } {
    if (conditions.userId && conditions.userId.length > 0) {
      if (!context.userId || !conditions.userId.includes(context.userId)) {
        return { pass: false, reason: 'User not in allowed list' }
      }
    }

    if (conditions.percentage !== undefined) {
      const hash = this.hash(context.userId || String(context.timestamp))
      const percentage = hash % 100
      if (percentage >= conditions.percentage) {
        return { pass: false, reason: 'User not in percentage' }
      }
    }

    if (conditions.dateRange) {
      const now = new Date(context.timestamp)
      if (now < conditions.dateRange.start || now > conditions.dateRange.end) {
        return { pass: false, reason: 'Outside date range' }
      }
    }

    if (conditions.environment && conditions.environment.length > 0) {
      if (!context.environment || !conditions.environment.includes(context.environment)) {
        return { pass: false, reason: 'Environment not allowed' }
      }
    }

    if (conditions.custom && !conditions.custom(context)) {
      return { pass: false, reason: 'Custom condition failed' }
    }

    return { pass: true }
  }

  private getVariantByHash(variants: Record<string, number>, id: string): string | undefined {
    const hash = this.hash(id)
    let cumulative = 0

    for (const [variant, weight] of Object.entries(variants)) {
      cumulative += weight
      if (hash % 100 < cumulative) {
        return variant
      }
    }

    return undefined
  }

  private hash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  subscribe(key: FeatureKey, callback: (result: FeatureResult) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(callback)

    return () => {
      this.listeners.get(key)?.delete(callback)
    }
  }

  subscribeAll(callback: (key: FeatureKey, result: FeatureResult) => void): () => void {
    this.globalListeners.add(callback)
    return () => {
      this.globalListeners.delete(callback)
    }
  }

  private notifyListeners(key: FeatureKey, result: FeatureResult): void {
    this.listeners.get(key)?.forEach(callback => callback(result))
    this.globalListeners.forEach(callback => callback(key, result))
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values())
  }

  getFlag(key: FeatureKey): FeatureFlag | undefined {
    return this.flags.get(key)
  }

  enable(key: FeatureKey): void {
    const flag = this.flags.get(key)
    if (flag) {
      flag.enabled = true
      this.saveToStorage()
    }
  }

  disable(key: FeatureKey): void {
    const flag = this.flags.get(key)
    if (flag) {
      flag.enabled = false
      this.saveToStorage()
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.flags.entries())
      localStorage.setItem('feature_flags', JSON.stringify(data))
    } catch {}
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('feature_flags')
      if (data) {
        const entries = JSON.parse(data) as [FeatureKey, FeatureFlag][]
        this.flags = new Map(entries)
      }
    } catch {}
  }

  reset(): void {
    this.flags.clear()
    this.saveToStorage()
  }
}

export const features = FeatureManager.getInstance()

export function isFeatureEnabled(key: FeatureKey, context?: FeatureContext): boolean {
  return features.isEnabled(key, context)
}

export function withFeature<T>(
  key: FeatureKey,
  enabled: () => T,
  disabled?: () => T
): T {
  if (features.isEnabled(key)) {
    return enabled()
  }
  return disabled ? disabled() : (undefined as unknown as T)
}
