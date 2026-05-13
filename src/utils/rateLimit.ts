export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private options: Required<RateLimitOptions>;

  constructor(options: RateLimitOptions) {
    this.options = options;
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) ?? [];
    const validTimestamps = timestamps.filter((t) => now - t < this.options.windowMs);
    const allowed = validTimestamps.length < this.options.maxRequests;
    if (allowed) {
      validTimestamps.push(now);
    }
    this.requests.set(identifier, validTimestamps);
    const oldest = validTimestamps[0];
    const resetAt = oldest ? oldest + this.options.windowMs : now;
    return {
      allowed,
      remaining: Math.max(0, this.options.maxRequests - validTimestamps.length),
      resetAt,
    };
  }

  attempt(identifier: string): RateLimitResult {
    return this.check(identifier);
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  clear(): void {
    this.requests.clear();
  }
}

export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private capacity: number;
  private refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  tryConsume(tokens: number = 1): { allowed: boolean; remaining: number } {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return { allowed: true, remaining: this.tokens };
    }
    return { allowed: false, remaining: this.tokens };
  }

  availableTokens(): number {
    this.refill();
    return this.tokens;
  }
}
