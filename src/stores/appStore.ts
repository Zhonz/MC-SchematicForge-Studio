import { create } from 'zustand'
import { AppError, LogEntry, PerformanceMetrics, AppConfig } from '@/types'
import { errorService } from '@/services/errorService'
import { logger } from '@/services/loggerService'
import { performanceService } from '@/services/performanceService'
import { configService } from '@/services/configService'

interface AppStore {
  errors: AppError[]
  logs: LogEntry[]
  metrics: PerformanceMetrics
  config: AppConfig
  isInitialized: boolean
  
  initialize: () => void
  addError: (error: AppError) => void
  clearErrors: () => void
  addLog: (log: LogEntry) => void
  clearLogs: () => void
  updateMetrics: (metrics: PerformanceMetrics) => void
  updateConfig: (config: AppConfig) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  errors: [],
  logs: [],
  metrics: {
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    blockCount: 0,
    lastUpdate: Date.now()
  },
  config: {},
  isInitialized: false,

  initialize: () => {
    const state = get()
    if (state.isInitialized) return

    errorService.subscribe(error => {
      set(prev => ({ errors: [...prev.errors.slice(-50), error] }))
    })

    logger.subscribe(log => {
      set(prev => ({ logs: [...prev.logs.slice(-100), log] }))
    })

    performanceService.subscribe(metrics => {
      set({ metrics })
    })

    configService.subscribe(config => {
      set({ config })
    })

    set({
      config: configService.getAll(),
      isInitialized: true
    })

    performanceService.startMonitoring()
    logger.info('App initialized successfully')
  },

  addError: (error: AppError) => {
    set(prev => ({ errors: [...prev.errors.slice(-50), error] }))
  },

  clearErrors: () => {
    set({ errors: [] })
    errorService.clearErrors()
  },

  addLog: (log: LogEntry) => {
    set(prev => ({ logs: [...prev.logs.slice(-100), log] }))
  },

  clearLogs: () => {
    set({ logs: [] })
    logger.clearLogs()
  },

  updateMetrics: (metrics: PerformanceMetrics) => {
    set({ metrics })
  },

  updateConfig: (config: AppConfig) => {
    set({ config })
  }
}))
