export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
  error?: Error;
}

export interface LoggerOptions {
  name?: string;
  level?: LogLevel;
  enabled?: boolean;
  format?: 'json' | 'simple';
  transports?: Transport[];
}

export interface Transport {
  log(entry: LogEntry): void;
}

export class ConsoleTransport implements Transport {
  log(entry: LogEntry): void {
    const time = new Date(entry.timestamp).toISOString();
    const prefix = `[${time}] [${entry.level.toUpperCase()}]`;
    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.context ?? '');
        break;
      case 'info':
        console.info(prefix, entry.message, entry.context ?? '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.context ?? '');
        break;
      case 'error':
        console.error(prefix, entry.message, entry.context ?? '', entry.error ?? '');
        break;
    }
  }
}

export class FileTransport implements Transport {
  private logs: LogEntry[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  log(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxSize) {
      this.logs.shift();
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private name: string;
  private level: LogLevel;
  private enabled: boolean;
  private format: 'json' | 'simple';
  private transports: Transport[];
  private parent?: Logger;

  constructor(options: LoggerOptions = {}) {
    this.name = options.name ?? 'logger';
    this.level = options.level ?? 'info';
    this.enabled = options.enabled ?? true;
    this.format = options.format ?? 'simple';
    this.transports = options.transports ?? [new ConsoleTransport()];
  }

  child(name: string): Logger {
    const child = new Logger({
      name: `${this.name}.${name}`,
      level: this.level,
      enabled: this.enabled,
      format: this.format,
      transports: this.transports,
    });
    child.parent = this;
    return child;
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

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.enabled) return;
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.level]) return;

    const entry: LogEntry = {
      level,
      message: `[${this.name}] ${message}`,
      timestamp: Date.now(),
      context,
      error,
    };

    this.transports.forEach((transport) => transport.log(entry));
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  addTransport(transport: Transport): this {
    this.transports.push(transport);
    return this;
  }

  clear(): void {
    this.transports = [];
  }
}

export const logger = new Logger({ name: 'app' });

export function createLogger(name: string, options?: LoggerOptions): Logger {
  return new Logger({ ...options, name });
}
