export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
}

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  get<T>(key: string): T | null {
    const item = localStorage.getItem(this.prefix + key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  }

  set<T>(key: string, value: T): void {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(this.prefix + key, serialized);
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (!this.prefix) {
      localStorage.clear();
    } else {
      const keys = this.keys();
      keys.forEach((key) => localStorage.removeItem(this.prefix + key));
    }
  }

  keys(): string[] {
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        result.push(key.slice(this.prefix.length));
      }
    }
    return result;
  }
}

export class SessionStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  get<T>(key: string): T | null {
    const item = sessionStorage.getItem(this.prefix + key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  }

  set<T>(key: string, value: T): void {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    sessionStorage.setItem(this.prefix + key, serialized);
  }

  remove(key: string): void {
    sessionStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (!this.prefix) {
      sessionStorage.clear();
    } else {
      const keys = this.keys();
      keys.forEach((key) => sessionStorage.removeItem(this.prefix + key));
    }
  }

  keys(): string[] {
    const result: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        result.push(key.slice(this.prefix.length));
      }
    }
    return result;
  }
}

export class MemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, unknown> = new Map();

  get<T>(key: string): T | null {
    const value = this.store.get(key);
    if (value === undefined) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    }
    return value as T;
  }

  set<T>(key: string, value: T): void {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    this.store.set(key, serialized);
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }
}

export class CacheStorage implements StorageAdapter {
  private cache: Map<string, { value: unknown; expiresAt: number }>;
  private storage: StorageAdapter;
  private defaultTTL: number;

  constructor(storage: StorageAdapter, defaultTTL: number = 3600000) {
    this.storage = storage;
    this.defaultTTL = defaultTTL;
    this.cache = new Map();
  }

  private isExpired(entry: { value: unknown; expiresAt: number }): boolean {
    return Date.now() > entry.expiresAt;
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      return cached.value as T;
    }
    const value = this.storage.get<T>(key);
    if (value !== null) {
      this.cache.set(key, { value, expiresAt: Date.now() + this.defaultTTL });
    }
    return value;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? this.defaultTTL),
    });
    this.storage.set(key, value);
  }

  remove(key: string): void {
    this.cache.delete(key);
    this.storage.remove(key);
  }

  clear(): void {
    this.cache.clear();
    this.storage.clear();
  }

  keys(): string[] {
    return this.storage.keys();
  }
}

export const localStorage$ = new LocalStorageAdapter('sf_');
export const sessionStorage$ = new SessionStorageAdapter('sf_');
export const memoryStorage$ = new MemoryStorageAdapter();
