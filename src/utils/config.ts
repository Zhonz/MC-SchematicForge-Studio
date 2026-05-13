export interface StorageInterface {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  has(key: string): boolean;
  clear(): void;
  keys(): string[];
  size(): number;
  getOrSet<T>(key: string, factory: () => T): T;
  update<T>(key: string, updater: (value: T | null) => T): T;
}

export interface ConfigOptions {
  storage?: StorageInterface;
  key?: string;
}

export class Config {
  private storage: StorageInterface;
  private key: string;
  private cache: Map<string, unknown>;
  private listeners: Map<string, Set<(value: unknown) => void>>;

  constructor(options: ConfigOptions = {}) {
    this.storage = options.storage ?? {
      get: <T>(key: string): T | null => {
        const item = localStorage.getItem(key);
        if (item === null) return null;
        try { return JSON.parse(item) as T; }
        catch { return item as unknown as T; }
      },
      set: <T>(key: string, value: T): void => {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      },
      remove: (key: string): void => { localStorage.removeItem(key); },
      has: (key: string): boolean => localStorage.getItem(key) !== null,
      clear: (): void => { localStorage.clear(); },
      keys: (): string[] => {
        const result: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k) result.push(k);
        }
        return result;
      },
      size: (): number => localStorage.length,
      getOrSet: <T>(key: string, factory: () => T): T => {
        const existing = localStorage.getItem(key);
        if (existing !== null) {
          try { return JSON.parse(existing) as T; }
          catch { return existing as unknown as T; }
        }
        const value = factory();
        localStorage.setItem(key, JSON.stringify(value));
        return value;
      },
      update: <T>(key: string, updater: (value: T | null) => T): T => {
        const item = localStorage.getItem(key);
        const existing = item ? (JSON.parse(item) as T) : null;
        const updated = updater(existing);
        localStorage.setItem(key, JSON.stringify(updated));
        return updated;
      },
    };
    this.key = options.key ?? 'app_config';
    this.cache = new Map();
    this.listeners = new Map();
    this.load();
  }

  private load(): void {
    const data = this.storage.get<Record<string, unknown>>(this.key);
    if (data) {
      Object.entries(data).forEach(([k, v]) => this.cache.set(k, v));
    }
  }

  private save(): void {
    const data: Record<string, unknown> = {};
    this.cache.forEach((v, k) => { data[k] = v; });
    this.storage.set(this.key, data);
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }
    return defaultValue;
  }

  set<T>(key: string, value: T): this {
    this.cache.set(key, value);
    this.save();
    this.notify(key, value);
    return this;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.save();
      this.notify(key, undefined);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.save();
  }

  onChange(key: string, listener: (value: unknown) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);
    return () => { this.listeners.get(key)?.delete(listener); };
  }

  private notify(key: string, value: unknown): void {
    this.listeners.get(key)?.forEach((l) => l(value));
  }

  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    this.cache.forEach((v, k) => { result[k] = v; });
    return result;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export const config = new Config();
