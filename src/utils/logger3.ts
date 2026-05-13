export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  name: string;
  level?: LogLevel;
  enabled?: boolean;
}

export class Logger3 {
  private name: string;
  private level: LogLevel;
  private enabled: boolean;
  private static defaultLevel: LogLevel = 'info';

  constructor(config: LoggerConfig) {
    this.name = config.name;
    this.level = config.level ?? Logger3.defaultLevel;
    this.enabled = config.enabled ?? true;
  }

  static setDefaultLevel(level: LogLevel): void {
    Logger3.defaultLevel = level;
  }

  private static readonly LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    return Logger3.LEVEL_PRIORITY[level] >= Logger3.LEVEL_PRIORITY[this.level];
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[${this.name}] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(`[${this.name}] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[${this.name}] ${message}`, ...args);
    }
  }

  error(message: string, error?: Error, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`[${this.name}] ${message}`, error ?? '', ...args);
    }
  }

  group(label: string, fn: () => void): void {
    console.group(`[${this.name}] ${label}`);
    fn();
    console.groupEnd();
  }

  groupCollapsed(label: string, fn: () => void): void {
    console.groupCollapsed(`[${this.name}] ${label}`);
    fn();
    console.groupEnd();
  }

  time(label: string): void {
    console.time(`[${this.name}] ${label}`);
  }

  timeEnd(label: string): void {
    console.timeEnd(`[${this.name}] ${label}`);
  }

  table(data: unknown): void {
    console.table(data);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  createChild(name: string): Logger3 {
    return new Logger3({
      name: `${this.name}.${name}`,
      level: this.level,
      enabled: this.enabled,
    });
  }
}

export function createLogger(name: string, level?: LogLevel): Logger3 {
  return new Logger3({ name, level });
}

export const logger3 = createLogger('app');
