export interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  expiry?: number;
  prefix?: string;
}

export interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry?: number;
}

export class StorageUtils2 {
  private static defaultPrefix = 'sf_';

  static isAvailable(storage: Storage): boolean {
    try {
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  static isLocalStorageAvailable(): boolean {
    return this.isAvailable(localStorage);
  }

  static isSessionStorageAvailable(): boolean {
    return this.isAvailable(sessionStorage);
  }

  static set<T>(
    key: string,
    value: T,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean {
    try {
      const prefix = options.prefix || this.defaultPrefix;
      const finalKey = `${prefix}${key}`;

      let processedValue: string;

      if (options.expiry) {
        const item: StorageItem<T> = {
          value,
          timestamp: Date.now(),
          expiry: options.expiry
        };
        processedValue = JSON.stringify(item);
      } else {
        processedValue = JSON.stringify(value);
      }

      if (options.compress) {
        processedValue = this.compress(processedValue);
      }

      if (options.encrypt) {
        processedValue = this.encrypt(processedValue);
      }

      storage.setItem(finalKey, processedValue);
      return true;
    } catch {
      return false;
    }
  }

  static get<T>(
    key: string,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): T | null {
    try {
      const prefix = options.prefix || this.defaultPrefix;
      const finalKey = `${prefix}${key}`;

      const rawValue = storage.getItem(finalKey);
      if (!rawValue) return null;

      let processedValue = rawValue;

      if (options.encrypt) {
        processedValue = this.decrypt(processedValue);
      }

      if (options.compress) {
        processedValue = this.decompress(processedValue);
      }

      const parsed = JSON.parse(processedValue);

      if (parsed && typeof parsed === 'object' && 'timestamp' in parsed) {
        const item = parsed as StorageItem<T>;
        
        if (item.expiry) {
          const now = Date.now();
          const age = now - item.timestamp;
          if (age > item.expiry) {
            this.remove(key, storage, options);
            return null;
          }
        }
        
        return item.value;
      }

      return parsed as T;
    } catch {
      return null;
    }
  }

  static remove(
    key: string,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean {
    try {
      const prefix = options.prefix || this.defaultPrefix;
      const finalKey = `${prefix}${key}`;
      storage.removeItem(finalKey);
      return true;
    } catch {
      return false;
    }
  }

  static clear(storage: Storage = localStorage, prefix?: string): void {
    const searchPrefix = prefix || this.defaultPrefix;
    
    if (!prefix) {
      Object.keys(storage).forEach(key => {
        if (key.startsWith(searchPrefix)) {
          storage.removeItem(key);
        }
      });
    } else {
      Object.keys(storage).forEach(key => {
        if (key.startsWith(searchPrefix)) {
          storage.removeItem(key);
        }
      });
    }
  }

  static has(
    key: string,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean {
    const prefix = options.prefix || this.defaultPrefix;
    const finalKey = `${prefix}${key}`;
    return storage.getItem(finalKey) !== null;
  }

  static keys(storage: Storage = localStorage, prefix?: string): string[] {
    const searchPrefix = prefix || this.defaultPrefix;
    return Object.keys(storage).filter(key => key.startsWith(searchPrefix));
  }

  static size(storage: Storage = localStorage): number {
    let total = 0;
    Object.keys(storage).forEach(key => {
      const value = storage.getItem(key);
      if (value) {
        total += key.length + value.length;
      }
    });
    return total;
  }

  static getUsedPercentage(storage: Storage = localStorage): number {
    const maxSize = 5 * 1024 * 1024;
    return (this.size(storage) / maxSize) * 100;
  }

  static setObject(
    key: string,
    obj: Record<string, unknown>,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean {
    return this.set(key, obj, storage, options);
  }

  static getObject<T extends Record<string, unknown>>(
    key: string,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): T | null {
    return this.get<T>(key, storage, options);
  }

  static mergeObject(
    key: string,
    updates: Record<string, unknown>,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean {
    const existing = this.getObject<Record<string, unknown>>(key, storage, options);
    const merged = existing ? { ...existing, ...updates } : updates;
    return this.setObject(key, merged, storage, options);
  }

  static setArray<T>(
    key: string,
    array: T[],
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean {
    return this.set(key, array, storage, options);
  }

  static getArray<T>(
    key: string,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): T[] | null {
    return this.get<T[]>(key, storage, options);
  }

  static pushToArray<T>(
    key: string,
    item: T,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean {
    const array = this.getArray<T>(key, storage, options) || [];
    array.push(item);
    return this.setArray(key, array, storage, options);
  }

  static pullFromArray<T>(
    key: string,
    predicate: (item: T) => boolean,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean {
    const array = this.getArray<T>(key, storage, options) || [];
    const filtered = array.filter(item => !predicate(item));
    return this.setArray(key, filtered, storage, options);
  }

  static moveToSession<T>(
    key: string,
    value?: T
  ): boolean {
    const item = value !== undefined ? value : this.get<T>(key);
    if (item === null) return false;
    
    sessionStorage.setItem(`${this.defaultPrefix}${key}`, JSON.stringify(item));
    this.remove(key);
    return true;
  }

  static moveToLocal<T>(
    key: string,
    value?: T
  ): boolean {
    const item = value !== undefined ? value : this.get<T>(key, sessionStorage);
    if (item === null) return false;
    
    localStorage.setItem(`${this.defaultPrefix}${key}`, JSON.stringify(item));
    this.remove(key, sessionStorage);
    return true;
  }

  static clone<T>(
    key: string,
    newKey: string,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean {
    const value = this.get<T>(key, storage, options);
    if (value === null) return false;
    return this.set(newKey, value, storage, options);
  }

  static rename(
    key: string,
    newKey: string,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean {
    return this.clone(key, newKey, storage, options) && this.remove(key, storage, options);
  }

  static increment(
    key: string,
    delta: number = 1,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): number | null {
    const current = this.get<number>(key, storage, options) || 0;
    const newValue = current + delta;
    return this.set(key, newValue, storage, options) ? newValue : null;
  }

  static toggle(
    key: string,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean | null {
    const current = this.get<boolean>(key, storage, options);
    if (current === null) return null;
    const newValue = !current;
    return this.set(key, newValue, storage, options) ? newValue : null;
  }

  static getExpiry(key: string, storage: Storage = localStorage, options: StorageOptions = {}): number | null {
    try {
      const prefix = options.prefix || this.defaultPrefix;
      const finalKey = `${prefix}${key}`;
      const rawValue = storage.getItem(finalKey);
      if (!rawValue) return null;

      let processedValue = rawValue;
      if (options.encrypt) {
        processedValue = this.decrypt(processedValue);
      }
      if (options.compress) {
        processedValue = this.decompress(processedValue);
      }

      const parsed = JSON.parse(processedValue);
      if (parsed && typeof parsed === 'object' && 'timestamp' in parsed) {
        const item = parsed as StorageItem<unknown>;
        if (item.expiry) {
          const age = Date.now() - item.timestamp;
          return Math.max(0, item.expiry - age);
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  static setExpiry(
    key: string,
    expiry: number,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean {
    const value = this.get(key, storage, { ...options, expiry: undefined });
    if (value === null) return false;
    return this.set(key, value, storage, { ...options, expiry });
  }

  static touch(
    key: string,
    storage: Storage = localStorage,
    options: StorageOptions = {}
  ): boolean {
    return this.setExpiry(key, options.expiry || 7 * 24 * 60 * 60 * 1000, storage, options);
  }

  private static encrypt(data: string): string {
    return btoa(encodeURIComponent(data));
  }

  private static decrypt(data: string): string {
    return decodeURIComponent(atob(data));
  }

  private static compress(data: string): string {
    return btoa(encodeURIComponent(data));
  }

  private static decompress(data: string): string {
    return decodeURIComponent(atob(data));
  }
}

export class CacheStorage<T> {
  private cache: Map<string, { value: T; expiry: number | null }> = new Map();
  private maxSize: number;
  private defaultTTL: number | null;

  constructor(maxSize: number = 100, defaultTTL?: number) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL || null;
  }

  set(key: string, value: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    const expiry = ttl 
      ? Date.now() + ttl 
      : this.defaultTTL 
        ? Date.now() + this.defaultTTL 
        : null;

    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    const now = Date.now();
    const validKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (!item.expiry || item.expiry > now) {
        validKeys.push(key);
      }
    });

    return validKeys;
  }

  size(): number {
    return this.keys().length;
  }

  cleanup(): void {
    const now = Date.now();
    this.cache.forEach((item, key) => {
      if (item.expiry && item.expiry <= now) {
        this.cache.delete(key);
      }
    });
  }
}

export class IndexedDBStorage {
  private dbName: string;
  private version: number;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = 'schematicforge_db', version: number = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  async open(storeName: string): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async set<T>(
    key: string,
    value: T,
    storeName: string = 'default'
  ): Promise<boolean> {
    try {
      const db = await this.open(storeName);
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put({ key, value, timestamp: Date.now() });

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return false;
    }
  }

  async get<T>(
    key: string,
    storeName: string = 'default'
  ): Promise<T | null> {
    try {
      const db = await this.open(storeName);
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  async remove(
    key: string,
    storeName: string = 'default'
  ): Promise<boolean> {
    try {
      const db = await this.open(storeName);
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return false;
    }
  }

  async clear(storeName: string = 'default'): Promise<boolean> {
    try {
      const db = await this.open(storeName);
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return false;
    }
  }

  async keys(storeName: string = 'default'): Promise<string[]> {
    try {
      const db = await this.open(storeName);
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAllKeys();

        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export default StorageUtils2;
