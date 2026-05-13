export interface ErrorInfo {
  componentStack?: string
  errorBoundary?: boolean
  resetError?: () => void
}

export interface ErrorLog {
  id: string
  message: string
  stack?: string
  componentStack?: string
  timestamp: number
  severity: 'error' | 'warning' | 'info'
  context?: Record<string, unknown>
  userAgent?: string
  url?: string
}

export interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  showDialog?: boolean
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private logs: ErrorLog[] = []
  private maxLogs: number = 100
  private listeners: Array<(error: ErrorLog) => void> = []
  private isDevelopment: boolean = false

  private constructor() {
    this.isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    this.setupGlobalHandler()
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  private setupGlobalHandler(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('error', (event) => {
      this.log({
        message: event.message,
        stack: event.error?.stack,
        severity: 'error',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
      
      this.log({
        message: error.message,
        stack: error.stack,
        severity: 'error',
        context: { type: 'unhandledrejection' }
      })
    })
  }

  log(error: Omit<ErrorLog, 'id' | 'timestamp' | 'userAgent' | 'url'>): string {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const log: ErrorLog = {
      id,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...error
    }

    this.logs.unshift(log)
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    if (this.isDevelopment) {
      console.group(`[ErrorHandler] ${error.severity.toUpperCase()}: ${error.message}`)
      if (error.stack) {
        console.error(error.stack)
      }
      console.groupEnd()
    }

    this.notifyListeners(log)

    return id
  }

  warn(message: string, context?: Record<string, unknown>): string {
    return this.log({
      message,
      severity: 'warning',
      context
    })
  }

  info(message: string, context?: Record<string, unknown>): string {
    return this.log({
      message,
      severity: 'info',
      context
    })
  }

  getLogs(severity?: ErrorLog['severity']): ErrorLog[] {
    if (severity) {
      return this.logs.filter(log => log.severity === severity)
    }
    return [...this.logs]
  }

  clearLogs(): void {
    this.logs = []
  }

  subscribe(callback: (error: ErrorLog) => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  private notifyListeners(error: ErrorLog): void {
    this.listeners.forEach(callback => {
      try {
        callback(error)
      } catch {
        // Silently ignore listener errors
      }
    })
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  importLogs(json: string): void {
    try {
      const logs = JSON.parse(json) as ErrorLog[]
      this.logs = [...logs, ...this.logs].slice(0, this.maxLogs)
    } catch (error) {
      this.warn('Failed to import error logs', { error: String(error) })
    }
  }

  getErrorCount(severity?: ErrorLog['severity']): number {
    if (severity) {
      return this.logs.filter(log => log.severity === severity).length
    }
    return this.logs.length
  }

  getRecentErrors(count: number = 10): ErrorLog[] {
    return this.logs.slice(0, count)
  }

  getErrorsByTimeRange(startTime: number, endTime: number): ErrorLog[] {
    return this.logs.filter(
      log => log.timestamp >= startTime && log.timestamp <= endTime
    )
  }

  analyzeErrors(): {
    total: number
    errors: number
    warnings: number
    info: number
    mostCommon: Array<{ message: string; count: number }>
  } {
    let totalCount = 0
    let errorCount = 0
    let warningCount = 0
    let infoCount = 0

    const messageCounts = new Map<string, number>()

    this.logs.forEach(log => {
      totalCount++
      if (log.severity === 'error') errorCount++
      else if (log.severity === 'warning') warningCount++
      else if (log.severity === 'info') infoCount++
      
      const count = messageCounts.get(log.message) || 0
      messageCounts.set(log.message, count + 1)
    })

    const mostCommon = Array.from(messageCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return { total: totalCount, errors: errorCount, warnings: warningCount, info: infoCount, mostCommon }
  }
}

export const errorHandler = ErrorHandler.getInstance()

export class RetryHandler {
  private static retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number
      initialDelay?: number
      maxDelay?: number
      backoffFactor?: number
      shouldRetry?: (error: Error) => boolean
      onRetry?: (attempt: number, delay: number, error: Error) => void
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      shouldRetry = () => true,
      onRetry
    } = options

    return new Promise((resolve, reject) => {
      let retries = 0

      const attempt = async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          
          if (retries >= maxRetries || !shouldRetry(err)) {
            reject(error)
            return
          }

          retries++
          const delay = Math.min(
            initialDelay * Math.pow(backoffFactor, retries - 1),
            maxDelay
          )

          if (onRetry) {
            onRetry(retries, delay, err)
          }

          setTimeout(attempt, delay)
        }
      }

      attempt()
    })
  }

  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    return this.retryWithBackoff(fn, { maxRetries })
  }

  static async retryWithExponentialBackoff<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number
      initialDelay?: number
      shouldRetry?: (error: Error) => boolean
    } = {}
  ): Promise<T> {
    return this.retryWithBackoff(fn, {
      ...options,
      backoffFactor: 2,
      maxDelay: 60000
    })
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends Error {
  constructor(
    message: string = 'Operation timed out',
    public timeout: number = 0
  ) {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class CacheError extends Error {
  constructor(
    message: string,
    public operation: 'read' | 'write' | 'delete' = 'read'
  ) {
    super(message)
    this.name = 'CacheError'
  }
}
