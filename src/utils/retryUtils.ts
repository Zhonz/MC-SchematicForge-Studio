export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
  onSuccess?: (result: unknown, attempt: number) => void;
  onFailure?: (error: unknown, attempts: number) => void;
}

export interface RetryState {
  attempt: number;
  delay: number;
  isRetrying: boolean;
  lastError: unknown;
  startTime: number;
  endTime?: number;
}

export type BackoffStrategy = 'exponential' | 'linear' | 'fixed';

export interface BackoffOptions {
  strategy?: BackoffStrategy;
  initialDelay?: number;
  maxDelay?: number;
  multiplier?: number;
  jitterFactor?: number;
}

export class RetryError extends Error {
  public readonly attempts: number;
  public readonly lastError: unknown;

  constructor(message: string, attempts: number, lastError: unknown) {
    super(message);
    this.name = 'RetryError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

export function calculateBackoff(
  attempt: number,
  options: BackoffOptions
): number {
  const {
    strategy = 'exponential',
    initialDelay = 1000,
    maxDelay = 30000,
    multiplier = 2,
    jitterFactor = 0.1,
  } = options;

  let delay: number;

  switch (strategy) {
    case 'exponential':
      delay = initialDelay * Math.pow(multiplier, attempt - 1);
      break;
    case 'linear':
      delay = initialDelay * attempt;
      break;
    case 'fixed':
      delay = initialDelay;
      break;
    default:
      delay = initialDelay;
  }

  delay = Math.min(delay, maxDelay);

  if (jitterFactor > 0) {
    const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
    delay = Math.max(0, delay + jitter);
  }

  return Math.floor(delay);
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = false,
    retryCondition,
    onRetry,
    onSuccess,
    onFailure,
  } = options;

  let lastError: unknown;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      const result = await fn();
      onSuccess?.(result, attempt);
      return result;
    } catch (error) {
      lastError = error;

      if (retryCondition && !retryCondition(error, attempt)) {
        throw error;
      }

      if (attempt >= maxAttempts) {
        onFailure?.(error, attempt);
        throw new RetryError(
          `Failed after ${attempt} attempts: ${error instanceof Error ? error.message : String(error)}`,
          attempt,
          error
        );
      }

      const delay = calculateBackoff(attempt, {
        strategy: 'exponential',
        initialDelay,
        maxDelay,
        multiplier: backoffMultiplier,
        jitterFactor: jitter ? 0.1 : 0,
      });

      onRetry?.(error, attempt, delay);
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function retryWithState<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<{ result: T; state: RetryState }> {
  const state: RetryState = {
    attempt: 0,
    delay: 0,
    isRetrying: false,
    lastError: null,
    startTime: Date.now(),
  };

  const result = await retry(fn, {
    ...options,
    onRetry: (error, attempt, delay) => {
      state.attempt = attempt;
      state.delay = delay;
      state.isRetrying = true;
      state.lastError = error;
      options.onRetry?.(error, attempt, delay);
    },
    onSuccess: () => {
      state.endTime = Date.now();
    },
  });

  return { result, state };
}

export function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeout: number,
  options: RetryOptions = {}
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout}ms`));
    }, timeout);
  });

  return Promise.race([retry(fn, options), timeoutPromise]);
}

export async function retryParallel<T>(
  tasks: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T[]> {
  return Promise.all(tasks.map(task => retry(task, options)));
}

export async function retryWithFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await retry(primaryFn, options);
  } catch {
    return fallbackFn();
  }
}

export class RetryableOperation<T> {
  private fn: () => Promise<T>;
  private options: RetryOptions;

  constructor(fn: () => Promise<T>, options: RetryOptions = {}) {
    this.fn = fn;
    this.options = options;
  }

  execute(): Promise<T> {
    return retry(this.fn, this.options);
  }

  executeWithState(): Promise<{ result: T; state: RetryState }> {
    return retryWithState(this.fn, this.options);
  }

  withTimeout(timeout: number): Promise<T> {
    return retryWithTimeout(this.fn, timeout, this.options);
  }

  withRetryCondition(condition: (error: unknown, attempt: number) => boolean): RetryableOperation<T> {
    return new RetryableOperation(this.fn, {
      ...this.options,
      retryCondition: condition,
    });
  }

  withOnRetry(callback: (error: unknown, attempt: number, delay: number) => void): RetryableOperation<T> {
    return new RetryableOperation(this.fn, {
      ...this.options,
      onRetry: callback,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createRetryable<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): RetryableOperation<T> {
  return new RetryableOperation(fn, options);
}
