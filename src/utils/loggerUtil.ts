export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

export interface LoggerOptions {
  level?: LogLevel;
  name?: string;
  colors?: boolean;
  timestamps?: boolean;
  prettyPrint?: boolean;
  context?: Record<string, unknown>;
  onLog?: (entry: LogEntry) => void;
}

export class Logger {
  private name: string;
  private level: LogLevel;
  private colors: boolean;
  private timestamps: boolean;
  private prettyPrint: boolean;
  private context: Record<string, unknown>;
  private onLog?: (entry: LogEntry) => void;
  private entries: LogEntry[] = [];
  private maxEntries: number;
  private static levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };
  private static defaultLogger: Logger | null = null;

  constructor(options: LoggerOptions = {}) {
    this.name = options.name || 'app';
    this.level = options.level || 'info';
    this.colors = options.colors ?? true;
    this.timestamps = options.timestamps ?? true;
    this.prettyPrint = options.prettyPrint ?? false;
    this.context = options.context || {};
    this.onLog = options.onLog;
    this.maxEntries = 1000;
  }

  static getInstance(options?: LoggerOptions): Logger {
    if (!Logger.defaultLogger) {
      Logger.defaultLogger = new Logger(options);
    }
    return Logger.defaultLogger;
  }

  static resetInstance(): void {
    Logger.defaultLogger = null;
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.levels[level] >= Logger.levels[this.level];
  }

  private formatTimestamp(): string {
    const now = new Date();
    if (this.prettyPrint) {
      return now.toISOString();
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const parts: string[] = [];
    
    if (this.timestamps) {
      parts.push(`[${this.formatTimestamp()}]`);
    }
    
    const levelStr = this.colors ? this.getColoredLevel(level) : level.toUpperCase();
    parts.push(levelStr);
    
    if (this.name) {
      parts.push(`[${this.name}]`);
    }
    
    parts.push(message);
    
    if (args.length > 0) {
      parts.push(...args.map(arg => this.formatArg(arg)));
    }
    
    return parts.join(' ');
  }

  private getColoredLevel(level: LogLevel): string {
    if (typeof window === 'undefined') return level.toUpperCase();
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      fatal: '\x1b[35m',
    };
    return `${colors[level]}${level.toUpperCase()}\x1b[0m`;
  }

  private formatArg(arg: unknown): string {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, this.prettyPrint ? 2 : 0);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: Object.keys(this.context).length > 0 ? { ...this.context } : undefined,
    };

    if (args.length > 0 && typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null) {
      const lastArg = args[args.length - 1];
      if (lastArg instanceof Error) {
        entry.error = lastArg;
        entry.context = {
          ...entry.context,
          stack: lastArg.stack,
        };
      } else if (!(lastArg instanceof Date) && !Array.isArray(lastArg)) {
        entry.context = {
          ...entry.context,
          ...(lastArg as Record<string, unknown>),
        };
        args = args.slice(0, -1);
      }
    }

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    const formattedMessage = this.formatMessage(level, message, ...args);
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, entry.context || '');
        break;
      case 'info':
        console.info(formattedMessage, entry.context || '');
        break;
      case 'warn':
        console.warn(formattedMessage, entry.context || '');
        break;
      case 'error':
      case 'fatal':
        console.error(formattedMessage, entry.context || '');
        break;
    }

    this.onLog?.(entry);
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }

  fatal(message: string, ...args: unknown[]): void {
    this.log('fatal', message, ...args);
  }

  logEntry(entry: LogEntry): void {
    this.log(entry.level, entry.message);
  }

  child(context: Record<string, unknown>): Logger {
    const childLogger = new Logger({
      name: this.name,
      level: this.level,
      colors: this.colors,
      timestamps: this.timestamps,
      prettyPrint: this.prettyPrint,
      context: { ...this.context, ...context },
      onLog: this.onLog,
    });
    childLogger.maxEntries = this.maxEntries;
    return childLogger;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  getEntries(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.entries.filter(e => e.level === level);
    }
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  getStats(): Record<LogLevel, number> {
    const stats: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0,
    };
    for (const entry of this.entries) {
      stats[entry.level]++;
    }
    return stats;
  }

  export(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  exportAsCSV(): string {
    const headers = ['timestamp', 'level', 'message', 'context'];
    const rows = this.entries.map(e => [
      e.timestamp.toISOString(),
      e.level,
      `"${e.message.replace(/"/g, '""')}"`,
      e.context ? JSON.stringify(e.context) : '',
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const logger = Logger.getInstance();
export const createLogger = (options?: LoggerOptions) => new Logger(options);
