export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

export class Logger {
  private static logs: LogEntry[] = [];
  private static maxLogs: number = 1000;
  private static minLevel: LogLevel = 'debug';
  private static listeners: Set<(entry: LogEntry) => void> = new Set();
  private static context: Record<string, unknown> = {};

  static setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context };
  }

  static clearContext(): void {
    this.context = {};
  }

  static setMinLevel(level: LogLevel): void {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    this.minLevel = level;
  }

  static debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  static info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  static warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  static error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  private static log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    if (levels[level] < levels[this.minLevel]) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context: { ...this.context, ...context }
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const prefix = `[${level.toUpperCase()}]`;
    const time = new Date(entry.timestamp).toISOString();
    const fullMessage = `${time} ${prefix} ${message}`;
    const fullContext = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

    switch (level) {
      case 'debug':
        console.debug(fullMessage + fullContext);
        break;
      case 'info':
        console.info(fullMessage + fullContext);
        break;
      case 'warn':
        console.warn(fullMessage + fullContext);
        break;
      case 'error':
        console.error(fullMessage + fullContext);
        break;
    }

    this.listeners.forEach(listener => listener(entry));
  }

  static subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  static getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  static clear(): void {
    this.logs = [];
  }

  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  static importLogs(json: string): number {
    try {
      const imported = JSON.parse(json) as LogEntry[];
      this.logs.push(...imported);
      return imported.length;
    } catch {
      return 0;
    }
  }
}

export class GroupedLogger {
  private logger: typeof Logger;
  private groupName: string;
  private collapsed: boolean;

  constructor(groupName: string, collapsed: boolean = false) {
    this.logger = Logger;
    this.groupName = groupName;
    this.collapsed = collapsed;
  }

  log(message: string, context?: Record<string, unknown>): void {
    if (this.collapsed) {
      console.log(`${this.groupName}: ${message}`, context || '');
    } else {
      console.log(`[${this.groupName}] ${message}`, context || '');
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(`[${this.groupName}] ${message}`, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(`[${this.groupName}] ${message}`, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(`[${this.groupName}] ${message}`, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.logger.error(`[${this.groupName}] ${message}`, context);
  }
}

export default Logger;
