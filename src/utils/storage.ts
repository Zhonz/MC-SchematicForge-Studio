export interface StorageOptions {
  prefix?: string;
  storage?: globalThis.Storage;
}

export class StorageManager {
  private prefix: string;
  private storage: globalThis.Storage;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix ?? '';
    this.storage = options.storage ?? localStorage;
  }

  private getKey(key: string): string {
    return this.prefix + key;
  }

  get<T>(key: string): T | null {
    const item = this.storage.getItem(this.getKey(key));
    if (item === null) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  }

  set<T>(key: string, value: T): void {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    this.storage.setItem(this.getKey(key), serialized);
  }

  remove(key: string): void {
    this.storage.removeItem(this.getKey(key));
  }

  has(key: string): boolean {
    return this.storage.getItem(this.getKey(key)) !== null;
  }

  clear(): void {
    if (!this.prefix) {
      this.storage.clear();
    } else {
      const keys = this.keys();
      for (const key of keys) {
        this.storage.removeItem(this.getKey(key));
      }
    }
  }

  keys(): string[] {
    const result: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        result.push(key.slice(this.prefix.length));
      }
    }
    return result;
  }

  size(): number {
    return this.keys().length;
  }

  getOrSet<T>(key: string, factory: () => T): T {
    const existing = this.get<T>(key);
    if (existing !== null) return existing;
    const value = factory();
    this.set(key, value);
    return value;
  }

  update<T>(key: string, updater: (value: T | null) => T): T {
    const existing = this.get<T>(key);
    const updated = updater(existing);
    this.set(key, updated);
    return updated;
  }
}

export const localStorage$ = new StorageManager({ storage: localStorage, prefix: 'sf_' });
export const sessionStorage$ = new StorageManager({ storage: sessionStorage, prefix: 'sf_' });
