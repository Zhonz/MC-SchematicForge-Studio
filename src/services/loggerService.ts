import { LogEntry, LogLevel } from '@/types'

class LoggerService {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private subscribers: ((log: LogEntry) => void)[] = []
  private minLevel: LogLevel = 'debug'

  private levelOrder: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error)
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('fatal', message, context, error)
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (this.levelOrder[level] < this.levelOrder[this.minLevel]) {
      return
    }

    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      message,
      context,
      error
    }

    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    this.subscribers.forEach(callback => callback(entry))
    this.outputToConsole(entry)
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`

    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.context)
        break
      case 'info':
        console.info(prefix, entry.message, entry.context)
        break
      case 'warn':
        console.warn(prefix, entry.message, entry.context)
        break
      case 'error':
      case 'fatal':
        console.error(prefix, entry.message, entry.context, entry.error)
        break
    }
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }

  subscribe(callback: (log: LogEntry) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback)
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  clearLogs(): void {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export const logger = new LoggerService()
