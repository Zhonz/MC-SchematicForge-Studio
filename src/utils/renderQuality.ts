export type RenderQuality = 'low' | 'medium' | 'high' | 'ultra'

export interface RenderSettings {
  quality: RenderQuality
  shadowQuality: 'off' | 'low' | 'medium' | 'high'
  textureQuality: 'low' | 'medium' | 'high'
  antialiasing: boolean
  vsync: boolean
  targetFPS: number
  adaptiveQuality: boolean
}

export interface PerformanceProfile {
  name: string
  settings: RenderSettings
  recommendedFor: string
}

const PERFORMANCE_PROFILES: PerformanceProfile[] = [
  {
    name: '性能优先',
    recommendedFor: '低配置设备',
    settings: {
      quality: 'low',
      shadowQuality: 'off',
      textureQuality: 'low',
      antialiasing: false,
      vsync: true,
      targetFPS: 30,
      adaptiveQuality: true
    }
  },
  {
    name: '平衡',
    recommendedFor: '中等配置设备',
    settings: {
      quality: 'medium',
      shadowQuality: 'low',
      textureQuality: 'medium',
      antialiasing: true,
      vsync: true,
      targetFPS: 60,
      adaptiveQuality: true
    }
  },
  {
    name: '质量优先',
    recommendedFor: '高配置设备',
    settings: {
      quality: 'high',
      shadowQuality: 'medium',
      textureQuality: 'high',
      antialiasing: true,
      vsync: true,
      targetFPS: 60,
      adaptiveQuality: false
    }
  },
  {
    name: '最高画质',
    recommendedFor: '旗舰设备',
    settings: {
      quality: 'ultra',
      shadowQuality: 'high',
      textureQuality: 'high',
      antialiasing: true,
      vsync: false,
      targetFPS: 144,
      adaptiveQuality: false
    }
  }
]

export class RenderQualityManager {
  private currentSettings: RenderSettings
  private performanceHistory: number[] = []
  private maxHistorySize: number = 60
  private lastAdjustmentTime: number = 0
  private adjustmentCooldown: number = 5000
  private onSettingsChange?: (settings: RenderSettings) => void

  constructor(initialSettings?: Partial<RenderSettings>) {
    this.currentSettings = {
      quality: 'medium',
      shadowQuality: 'medium',
      textureQuality: 'medium',
      antialiasing: true,
      vsync: true,
      targetFPS: 60,
      adaptiveQuality: true,
      ...initialSettings
    }
  }

  setOnSettingsChange(callback: (settings: RenderSettings) => void): void {
    this.onSettingsChange = callback
  }

  getSettings(): RenderSettings {
    return { ...this.currentSettings }
  }

  setSettings(settings: Partial<RenderSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...settings }
    this.onSettingsChange?.(this.currentSettings)
  }

  getProfiles(): PerformanceProfile[] {
    return PERFORMANCE_PROFILES
  }

  applyProfile(profileName: string): boolean {
    const profile = PERFORMANCE_PROFILES.find(p => p.name === profileName)
    if (profile) {
      this.setSettings(profile.settings)
      return true
    }
    return false
  }

  recordFrameTime(frameTime: number): void {
    const fps = 1000 / frameTime
    this.performanceHistory.push(fps)
    
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift()
    }

    if (
      this.currentSettings.adaptiveQuality &&
      Date.now() - this.lastAdjustmentTime > this.adjustmentCooldown
    ) {
      this.adjustQuality()
    }
  }

  getAverageFPS(): number {
    if (this.performanceHistory.length === 0) return 0
    const sum = this.performanceHistory.reduce((a, b) => a + b, 0)
    return Math.round(sum / this.performanceHistory.length)
  }

  getPerformanceLevel(): 'poor' | 'fair' | 'good' | 'excellent' {
    const avgFPS = this.getAverageFPS()
    const targetFPS = this.currentSettings.targetFPS
    
    if (avgFPS < targetFPS * 0.6) return 'poor'
    if (avgFPS < targetFPS * 0.85) return 'fair'
    if (avgFPS < targetFPS * 1.1) return 'good'
    return 'excellent'
  }

  private adjustQuality(): void {
    const avgFPS = this.getAverageFPS()
    const targetFPS = this.currentSettings.targetFPS
    const level = this.getPerformanceLevel()

    let needsAdjustment = false
    const newSettings = { ...this.currentSettings }

    if (level === 'poor' && avgFPS < targetFPS * 0.5) {
      needsAdjustment = true
      if (newSettings.shadowQuality !== 'off') {
        const shadowLevels: Array<'off' | 'low' | 'medium' | 'high'> = ['off', 'low', 'medium', 'high']
        const currentIdx = shadowLevels.indexOf(newSettings.shadowQuality)
        if (currentIdx > 0) {
          newSettings.shadowQuality = shadowLevels[currentIdx - 1]
        }
      } else if (newSettings.textureQuality !== 'low') {
        const textureLevels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']
        const currentIdx = textureLevels.indexOf(newSettings.textureQuality)
        if (currentIdx > 0) {
          newSettings.textureQuality = textureLevels[currentIdx - 1]
        }
      } else if (newSettings.antialiasing) {
        newSettings.antialiasing = false
      } else if (newSettings.quality !== 'low') {
        const qualityLevels: RenderQuality[] = ['low', 'medium', 'high', 'ultra']
        const currentIdx = qualityLevels.indexOf(newSettings.quality)
        if (currentIdx > 0) {
          newSettings.quality = qualityLevels[currentIdx - 1]
        }
      }
    } else if (level === 'excellent' && avgFPS > targetFPS * 1.3) {
      needsAdjustment = true
      if (newSettings.quality !== 'ultra') {
        const qualityLevels: RenderQuality[] = ['low', 'medium', 'high', 'ultra']
        const currentIdx = qualityLevels.indexOf(newSettings.quality)
        if (currentIdx < qualityLevels.length - 1) {
          newSettings.quality = qualityLevels[currentIdx + 1]
        }
      } else if (!newSettings.antialiasing) {
        newSettings.antialiasing = true
      } else if (newSettings.shadowQuality !== 'high') {
        const shadowLevels: Array<'off' | 'low' | 'medium' | 'high'> = ['off', 'low', 'medium', 'high']
        const currentIdx = shadowLevels.indexOf(newSettings.shadowQuality)
        if (currentIdx < shadowLevels.length - 1) {
          newSettings.shadowQuality = shadowLevels[currentIdx + 1]
        }
      }
    }

    if (needsAdjustment) {
      this.currentSettings = newSettings
      this.lastAdjustmentTime = Date.now()
      this.onSettingsChange?.(this.currentSettings)
    }
  }

  detectPerformanceIssues(): {
    hasLowFPS: boolean
    hasHighMemory: boolean
    hasFrameDrops: boolean
    recommendation: string
  } {
    const avgFPS = this.getAverageFPS()
    const fpsVariance = this.calculateFPSVariance()
    
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    const memoryUsage = memory ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) : 0

    const hasLowFPS = avgFPS < this.currentSettings.targetFPS * 0.8
    const hasHighMemory = memoryUsage > 0.8
    const hasFrameDrops = fpsVariance > 20

    let recommendation = '性能良好'

    if (hasFrameDrops) {
      recommendation = '建议开启垂直同步以减少画面撕裂'
    }

    if (hasHighMemory) {
      recommendation = '内存使用较高，建议降低纹理质量或减少场景复杂度'
    }

    if (hasLowFPS && hasHighMemory) {
      recommendation = '建议切换到"性能优先"配置以获得更流畅的体验'
    }

    return {
      hasLowFPS,
      hasHighMemory,
      hasFrameDrops,
      recommendation
    }
  }

  private calculateFPSVariance(): number {
    if (this.performanceHistory.length < 2) return 0
    
    const mean = this.getAverageFPS()
    const squaredDiffs = this.performanceHistory.map(fps => Math.pow(fps - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length
    
    return Math.sqrt(avgSquaredDiff)
  }

  reset(): void {
    this.performanceHistory = []
    this.lastAdjustmentTime = 0
  }

  getQualityMultiplier(): number {
    switch (this.currentSettings.quality) {
      case 'low': return 0.5
      case 'medium': return 0.75
      case 'high': return 1.0
      case 'ultra': return 1.5
    }
  }

  getShadowMapSize(): number {
    switch (this.currentSettings.shadowQuality) {
      case 'off': return 0
      case 'low': return 512
      case 'medium': return 1024
      case 'high': return 2048
    }
  }
}

export const renderQualityManager = new RenderQualityManager()
