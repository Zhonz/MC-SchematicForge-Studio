export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  maxDelay?: number;
  shouldRetry?: (error: Error) => boolean;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    maxDelay = 30000,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | undefined;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt >= maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, currentDelay));
      if (backoff === 'exponential') {
        currentDelay = Math.min(currentDelay * 2, maxDelay);
      }
    }
  }

  throw lastError;
}

export interface RetryWithFallbackOptions<T> extends RetryOptions {
  fallback?: () => T | Promise<T>;
}

export async function retryWithFallback<T>(
  fn: () => Promise<T>,
  options: RetryWithFallbackOptions<T> = {}
): Promise<T> {
  try {
    return await retry(fn, options);
  } catch {
    if (options.fallback) {
      return options.fallback();
    }
    throw new Error('All retry attempts failed and no fallback provided');
  }
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailure = 0;
  private failureThreshold: number;
  private resetTimeout: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure >= this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
  }
}
