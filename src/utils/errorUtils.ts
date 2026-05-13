export type ErrorLevel = 'error' | 'warning' | 'info' | 'debug';

export interface ErrorInfo {
  message: string;
  stack?: string;
  level: ErrorLevel;
  timestamp: number;
  context?: Record<string, unknown>;
  userAgent?: string;
  url?: string;
}

export class ErrorUtils {
  private static errorLog: ErrorInfo[] = [];
  private static maxLogSize: number = 100;
  private static listeners: Set<(error: ErrorInfo) => void> = new Set();
  private static globalHandler: ((error: Error) => void) | null = null;
  private static unhandledRejectionHandler: ((reason: unknown) => void) | null = null;

  static captureError(
    error: Error | string,
    options: {
      level?: ErrorLevel;
      context?: Record<string, unknown>;
    } = {}
  ): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      level: options.level || 'error',
      timestamp: Date.now(),
      context: options.context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errorLog.push(errorInfo);

    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    this.listeners.forEach(listener => listener(errorInfo));

    return errorInfo;
  }

  static captureMessage(
    message: string,
    level: ErrorLevel = 'info',
    context?: Record<string, unknown>
  ): ErrorInfo {
    return this.captureError(message, { level, context });
  }

  static captureWarning(error: Error | string, context?: Record<string, unknown>): ErrorInfo {
    return this.captureError(error, { level: 'warning', context });
  }

  static captureInfo(error: Error | string, context?: Record<string, unknown>): ErrorInfo {
    return this.captureError(error, { level: 'info', context });
  }

  static captureDebug(error: Error | string, context?: Record<string, unknown>): ErrorInfo {
    return this.captureError(error, { level: 'debug', context });
  }

  static setupGlobalHandlers(): () => void {
    const globalHandler = (event: ErrorEvent) => {
      this.captureError(event.error || new Error(event.message), {
        level: 'error',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    };

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      this.captureError(message, {
        level: 'error',
        context: {
          stack: reason instanceof Error ? reason.stack : undefined,
          type: 'unhandledRejection'
        }
      });
    };

    window.addEventListener('error', globalHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);

    return () => {
      window.removeEventListener('error', globalHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    };
  }

  static subscribe(listener: (error: ErrorInfo) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  static getErrors(): ErrorInfo[] {
    return [...this.errorLog];
  }

  static getErrorsByLevel(level: ErrorLevel): ErrorInfo[] {
    return this.errorLog.filter(e => e.level === level);
  }

  static getRecentErrors(count: number = 10): ErrorInfo[] {
    return this.errorLog.slice(-count);
  }

  static clearErrors(): void {
    this.errorLog = [];
  }

  static setMaxLogSize(size: number): void {
    this.maxLogSize = size;
    while (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  static formatError(error: Error | string): string {
    if (typeof error === 'string') return error;
    return `${error.message}\n${error.stack || ''}`;
  }

  static parseStackTrace(stack: string): {
    file: string;
    line: number;
    column: number;
    function: string;
  }[] {
    const lines = stack.split('\n');
    const result: { file: string; line: number; column: number; function: string }[] = [];

    const lineRegex = /at\s+(?:(.+?)\s+)?\(?(.+?):(\d+):(\d+)\)?/;

    for (const line of lines) {
      const match = line.match(lineRegex);
      if (match) {
        result.push({
          function: match[1] || 'anonymous',
          file: match[2],
          line: parseInt(match[3], 10),
          column: parseInt(match[4], 10)
        });
      }
    }

    return result;
  }
}

export class ErrorBoundary extends Error {
  public readonly name = 'ErrorBoundary';
  public readonly originalError?: Error;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, originalError?: Error, context?: Record<string, unknown>) {
    super(message);
    this.name = 'ErrorBoundary';
    this.originalError = originalError;
    this.context = context;
  }
}

export class AsyncErrorBoundary {
  private error: Error | null = null;

  async wrap<T>(fn: () => Promise<T>, fallback?: T): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      this.error = e instanceof Error ? e : new Error(String(e));
      return fallback as T;
    }
  }

  hasError(): boolean {
    return this.error !== null;
  }

  getError(): Error | null {
    return this.error;
  }

  clearError(): void {
    this.error = null;
  }
}

export function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    onRetry
  } = options;

  return new Promise((resolve, reject) => {
    let currentDelay = delay;
    let attempts = 0;

    const attempt = async () => {
      attempts++;
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(error);
          return;
        }

        onRetry?.(attempts, error as Error);

        setTimeout(() => {
          currentDelay *= backoff;
          attempt();
        }, currentDelay);
      }
    };

    attempt();
  });
}

export function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<{ data: T | typeof fallback; error: Error | null }> {
  return fn()
    .then(data => ({ data, error: null }))
    .catch(error => ({
      data: fallback,
      error: error instanceof Error ? error : new Error(String(error))
    }));
}

export class ErrorHandler {
  static handle(error: unknown, context?: Record<string, unknown>): void {
    if (error instanceof Error) {
      ErrorUtils.captureError(error, { context });
    } else {
      ErrorUtils.captureError(new Error(String(error)), { context });
    }
  }

  static handleAsync<T>(
    promise: Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T | null> {
    return promise.catch(error => {
      this.handle(error, context);
      return null;
    });
  }

  static wrap<T extends (...args: unknown[]) => unknown>(
    fn: T,
    context?: Record<string, unknown>
  ): T {
    return ((...args: unknown[]) => {
      try {
        return fn(...args);
      } catch (error) {
        this.handle(error, context);
        throw error;
      }
    }) as T;
  }
}

export default ErrorUtils;
