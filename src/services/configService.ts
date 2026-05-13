import { AppConfig, ConfigOption } from '@/types'
import { logger } from './loggerService'

class ConfigService {
  private config: AppConfig = {}
  private storageKey = 'schematicforge_config'
  private subscribers: ((config: AppConfig) => void)[] = []

  constructor() {
    this.loadFromStorage()
    this.setDefaults()
  }

  private setDefaults(): void {
    const defaults: Record<string, Partial<ConfigOption>> = {
      'rendering.quality': {
        type: 'string',
        defaultValue: 'high',
        description: 'Rendering quality: low, medium, high'
      },
      'rendering.antialiasing': {
        type: 'boolean',
        defaultValue: true,
        description: 'Enable antialiasing'
      },
      'performance.showMetrics': {
        type: 'boolean',
        defaultValue: false,
        description: 'Show performance metrics'
      },
      'ai.enabled': {
        type: 'boolean',
        defaultValue: true,
        description: 'Enable AI features'
      },
      'ai.autoSave': {
        type: 'boolean',
        defaultValue: true,
        description: 'Auto-save AI generated content'
      },
      'ui.theme': {
        type: 'string',
        defaultValue: 'dark',
        description: 'UI theme: light, dark'
      },
      'ui.language': {
        type: 'string',
        defaultValue: 'zh',
        description: 'UI language: zh, en'
      },
      'notifications.enabled': {
        type: 'boolean',
        defaultValue: true,
        description: 'Enable notifications'
      }
    }

    for (const [key, option] of Object.entries(defaults)) {
      if (!this.config[key]) {
        this.config[key] = {
          key,
          value: option.defaultValue,
          type: option.type as any,
          defaultValue: option.defaultValue,
          description: option.description
        }
      }
    }
  }

  get<T>(key: string): T | null {
    const option = this.config[key]
    return option ? option.value as T : null
  }

  set<T>(key: string, value: T): boolean {
    const option = this.config[key]
    if (!option) {
      logger.warn(`Config key not found: ${key}`)
      return false
    }

    if (!this.validateType(value, option.type)) {
      logger.error(`Invalid type for ${key}: expected ${option.type}`)
      return false
    }

    this.config[key].value = value
    this.saveToStorage()
    this.notifySubscribers()
    logger.info(`Config updated: ${key} = ${JSON.stringify(value)}`)
    return true
  }

  getOption(key: string): ConfigOption | null {
    return this.config[key] || null
  }

  getAll(): AppConfig {
    return { ...this.config }
  }

  reset(key: string): boolean {
    const option = this.config[key]
    if (!option) return false

    this.config[key].value = option.defaultValue
    this.saveToStorage()
    this.notifySubscribers()
    return true
  }

  resetAll(): void {
    for (const key in this.config) {
      this.config[key].value = this.config[key].defaultValue
    }
    this.saveToStorage()
    this.notifySubscribers()
  }

  subscribe(callback: (config: AppConfig) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback)
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback({ ...this.config }))
  }

  private saveToStorage(): void {
    try {
      const data = JSON.stringify(this.config)
      localStorage.setItem(this.storageKey, data)
    } catch (error) {
      logger.error('Failed to save config to storage', error as Error)
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (data) {
        this.config = JSON.parse(data)
      }
    } catch (error) {
      logger.error('Failed to load config from storage', error as Error)
    }
  }

  private validateType(value: unknown, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'boolean':
        return typeof value === 'boolean'
      case 'object':
        return typeof value === 'object' && value !== null
      default:
        return false
    }
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }

  importConfig(data: string): boolean {
    try {
      const imported = JSON.parse(data)
      this.config = { ...this.config, ...imported }
      this.saveToStorage()
      this.notifySubscribers()
      logger.info('Config imported successfully')
      return true
    } catch (error) {
      logger.error('Failed to import config', error as Error)
      return false
    }
  }
}

export const configService = new ConfigService()
