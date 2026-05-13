export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private entries: LogEntry[] = [];
  private maxEntries = 1000;
  private minLevel: LogLevel;
  private listeners: Array<(entry: LogEntry) => void> = [];

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    this.notifyListeners(entry);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
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

  onLog(listener: (entry: LogEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  private notifyListeners(entry: LogEntry): void {
    this.listeners.forEach(listener => listener(entry));
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

export const logger = new Logger();

export function createLogger(name: string, minLevel?: LogLevel): Logger {
  const l = new Logger(minLevel);
  const originalLog = l['log'].bind(l);
  l.debug = (message: string, context?: Record<string, unknown>) => {
    originalLog('debug', `[${name}] ${message}`, context);
  };
  l.info = (message: string, context?: Record<string, unknown>) => {
    originalLog('info', `[${name}] ${message}`, context);
  };
  l.warn = (message: string, context?: Record<string, unknown>) => {
    originalLog('warn', `[${name}] ${message}`, context);
  };
  l.error = (message: string, context?: Record<string, unknown>) => {
    originalLog('error', `[${name}] ${message}`, context);
  };
  return l;
}

export class ConsoleInterceptor {
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
  };
  private logger: Logger;
  private active = false;

  constructor(logger: Logger) {
    this.logger = logger;
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };
  }

  start(): void {
    if (this.active) return;
    this.active = true;

    console.log = (...args) => {
      this.logger.debug(args.map(formatArg).join(' '));
      this.originalConsole.log.apply(console, args);
    };

    console.info = (...args) => {
      this.logger.info(args.map(formatArg).join(' '));
      this.originalConsole.info.apply(console, args);
    };

    console.warn = (...args) => {
      this.logger.warn(args.map(formatArg).join(' '));
      this.originalConsole.warn.apply(console, args);
    };

    console.error = (...args) => {
      this.logger.error(args.map(formatArg).join(' '));
      this.originalConsole.error.apply(console, args);
    };
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;

    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
  }
}

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

export class LogExporter {
  exportToJSON(logs: LogEntry[]): string {
    return JSON.stringify(logs, null, 2);
  }

  exportToCSV(logs: LogEntry[]): string {
    const headers = ['timestamp', 'level', 'message'];
    const rows = logs.map(entry => [
      new Date(entry.timestamp).toISOString(),
      entry.level,
      `"${entry.message.replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  downloadAsFile(content: string, filename: string, type = 'application/json'): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
