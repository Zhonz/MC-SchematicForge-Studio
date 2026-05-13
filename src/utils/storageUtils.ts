export class LocalStorage<T = unknown> {
  get(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch { return null; }
  }

  set(key: string, value: T): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  remove(key: string): void { localStorage.removeItem(key); }
  clear(): void { localStorage.clear(); }
  has(key: string): boolean { return localStorage.getItem(key) !== null; }
  keys(): string[] { return Object.keys(localStorage); }
}

export class SessionStorage<T = unknown> {
  get(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch { return null; }
  }

  set(key: string, value: T): void {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  remove(key: string): void { sessionStorage.removeItem(key); }
  clear(): void { sessionStorage.clear(); }
  has(key: string): boolean { return sessionStorage.getItem(key) !== null; }
}

export class Cookie {
  get(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  }

  set(name: string, value: string, days = 7, path = '/'): void {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=${path}`;
  }

  remove(name: string, path = '/'): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
  }

  has(name: string): boolean {
    return this.get(name) !== null;
  }
}

export class MemoryStorage<T = unknown> {
  private store: Map<string, T> = new Map();
  private expiry: Map<string, number> = new Map();

  get(key: string): T | null {
    const exp = this.expiry.get(key);
    if (exp && Date.now() > exp) {
      this.store.delete(key);
      this.expiry.delete(key);
      return null;
    }
    return this.store.get(key) ?? null;
  }

  set(key: string, value: T, ttl?: number): void {
    this.store.set(key, value);
    if (ttl) this.expiry.set(key, Date.now() + ttl);
  }

  remove(key: string): void {
    this.store.delete(key);
    this.expiry.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.expiry.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  size(): number {
    return this.store.size;
  }
}
