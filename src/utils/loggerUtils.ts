export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  pretty?: boolean;
  output?: 'console' | 'memory' | 'none';
  maxEntries?: number;
}

export class Logger {
  private level: LogLevel;
  private prefix: string;
  private timestamp: boolean;
  private pretty: boolean;
  private output: 'console' | 'memory' | 'none';
  private entries: LogEntry[] = [];
  private maxEntries: number;
  private handlers: Array<(entry: LogEntry) => void> = [];

  private static levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'debug';
    this.prefix = options.prefix ?? '';
    this.timestamp = options.timestamp ?? true;
    this.pretty = options.pretty ?? false;
    this.output = options.output ?? 'console';
    this.maxEntries = options.maxEntries ?? 1000;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  addHandler(handler: (entry: LogEntry) => void): () => void {
    this.handlers.push(handler);
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.levelPriority[level] >= Logger.levelPriority[this.level];
  }

  private createEntry(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
    };
  }

  private log(entry: LogEntry): void {
    if (this.output !== 'none') {
      if (this.output === 'memory') {
        this.entries.push(entry);
        if (this.entries.length > this.maxEntries) {
          this.entries.shift();
        }
      } else {
        this.outputToConsole(entry);
      }
    }

    this.handlers.forEach(handler => {
      try {
        handler(entry);
      } catch (e) {
        console.error('Log handler error:', e);
      }
    });
  }

  private outputToConsole(entry: LogEntry): void {
    const parts: unknown[] = [];

    if (this.timestamp) {
      parts.push(`[${entry.timestamp.toISOString()}]`);
    }

    if (this.prefix) {
      parts.push(`[${this.prefix}]`);
    }

    parts.push(`[${entry.level.toUpperCase()}]`);
    parts.push(entry.message);

    switch (entry.level) {
      case 'debug':
        if (this.pretty && entry.context) {
          console.debug(...parts, entry.context);
        } else {
          console.debug(...parts);
        }
        break;
      case 'info':
        if (this.pretty && entry.context) {
          console.info(...parts, entry.context);
        } else {
          console.info(...parts);
        }
        break;
      case 'warn':
        if (this.pretty && entry.context) {
          console.warn(...parts, entry.context);
        } else {
          console.warn(...parts);
        }
        break;
      case 'error':
      case 'fatal':
        if (entry.error) {
          console.error(...parts, entry.error);
        } else if (this.pretty && entry.context) {
          console.error(...parts, entry.context);
        } else {
          console.error(...parts);
        }
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      this.log(this.createEntry('debug', message, context));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      this.log(this.createEntry('info', message, context));
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      this.log(this.createEntry('warn', message, context));
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      this.log(this.createEntry('error', message, context, error));
    }
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.shouldLog('fatal')) {
      this.log(this.createEntry('fatal', message, context, error));
    }
  }

  group(label?: string): void {
    console.group(label);
  }

  groupEnd(): void {
    console.groupEnd();
  }

  time(label: string): void {
    console.time(label);
  }

  timeEnd(label: string): void {
    console.timeEnd(label);
  }

  trace(message?: string): void {
    console.trace(message);
  }

  assert(condition: boolean, message: string): void {
    console.assert(condition, message);
  }

  clear(): void {
    this.entries = [];
  }

  getEntries(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.entries.filter(e => e.level === level);
    }
    return [...this.entries];
  }

  getFiltered(predicate: (entry: LogEntry) => boolean): LogEntry[] {
    return this.entries.filter(predicate);
  }

  export(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  exportJSON(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      entries: this.entries,
    });
  }
}

export const defaultLogger = new Logger({ level: 'info' });

export class PerformanceLogger {
  private measurements: Map<string, number> = new Map();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger ?? defaultLogger;
  }

  start(label: string): void {
    this.measurements.set(label, performance.now());
  }

  end(label: string, context?: Record<string, unknown>): number {
    const start = this.measurements.get(label);
    if (start === undefined) {
      this.logger.warn(`Performance measurement "${label}" was not started`);
      return 0;
    }

    const duration = performance.now() - start;
    this.measurements.delete(label);
    this.logger.info(`[PERF] ${label}: ${duration.toFixed(2)}ms`, context);
    return duration;
  }

  mark(label: string): void {
    performance.mark(label);
  }

  measure(name: string, startMark: string, endMark: string, context?: Record<string, unknown>): number {
    const duration = performance.measure(name, startMark, endMark);
    const durationMs = duration.duration;
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(name);
    this.logger.info(`[PERF] ${name}: ${durationMs.toFixed(2)}ms`, context);
    return durationMs;
  }

  now(): number {
    return performance.now();
  }
}

export class GroupLogger {
  private logger: Logger;
  private label: string;

  constructor(logger: Logger, label: string) {
    this.logger = logger;
    this.label = label;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(`[${this.label}] ${message}`, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(`[${this.label}] ${message}`, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(`[${this.label}] ${message}`, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.logger.error(`[${this.label}] ${message}`, error, context);
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.logger.fatal(`[${this.label}] ${message}`, error, context);
  }

  createChild(childLabel: string): GroupLogger {
    return new GroupLogger(this.logger, `${this.label}:${childLabel}`);
  }
}
