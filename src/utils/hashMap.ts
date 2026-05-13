export interface HashMap<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  size: number;
  keys(): K[];
  values(): V[];
  entries(): Array<[K, V]>;
}

export function createHashMap<K, V>(hashFn: (key: K) => string): HashMap<K, V> {
  const buckets = new Map<string, Array<[K, V]>>();

  function getBucket(key: K): Array<[K, V]> {
    const hash = hashFn(key);
    if (!buckets.has(hash)) {
      buckets.set(hash, []);
    }
    return buckets.get(hash) as Array<[K, V]>;
  }

  return {
    get(key: K): V | undefined {
      const bucket = getBucket(key);
      const hash = hashFn(key);
      const entry = bucket.find(([k]) => hashFn(k) === hash);
      return entry?.[1];
    },

    set(key: K, value: V): void {
      const bucket = getBucket(key);
      const hash = hashFn(key);
      const existing = bucket.findIndex(([k]) => hashFn(k) === hash);
      if (existing >= 0) {
        bucket[existing] = [key, value];
      } else {
        bucket.push([key, value]);
      }
    },

    has(key: K): boolean {
      const bucket = getBucket(key);
      const hash = hashFn(key);
      return bucket.some(([k]) => hashFn(k) === hash);
    },

    delete(key: K): boolean {
      const bucket = getBucket(key);
      const hash = hashFn(key);
      const index = bucket.findIndex(([k]) => hashFn(k) === hash);
      if (index >= 0) {
        bucket.splice(index, 1);
        return true;
      }
      return false;
    },

    clear(): void {
      buckets.clear();
    },

    get size(): number {
      let count = 0;
      buckets.forEach((bucket) => {
        count += bucket.length;
      });
      return count;
    },

    keys(): K[] {
      const result: K[] = [];
      buckets.forEach((bucket) => {
        bucket.forEach(([key]) => {
          result.push(key);
        });
      });
      return result;
    },

    values(): V[] {
      const result: V[] = [];
      buckets.forEach((bucket) => {
        bucket.forEach(([, value]) => {
          result.push(value);
        });
      });
      return result;
    },

    entries(): Array<[K, V]> {
      const result: Array<[K, V]> = [];
      buckets.forEach((bucket) => {
        bucket.forEach((entry) => {
          result.push(entry);
        });
      });
      return result;
    },
  };
}

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function hashNumber(num: number): string {
  return num.toString(36);
}

export function hashObject(obj: unknown): string {
  return hashString(JSON.stringify(obj));
}

export class HashSet<T> {
  private map: HashMap<T, true>;

  constructor(hashFn: (key: T) => string) {
    this.map = createHashMap<T, true>(hashFn) as HashMap<T, true>;
  }

  add(item: T): this {
    this.map.set(item, true);
    return this;
  }

  has(item: T): boolean {
    return this.map.has(item);
  }

  delete(item: T): boolean {
    return this.map.delete(item);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  values(): T[] {
    return this.map.keys();
  }
}

export function createStringSet(): HashSet<string> {
  return new HashSet<string>(hashString);
}

export function createNumberSet(): HashSet<number> {
  return new HashSet<number>(hashNumber);
}

export function createObjectSet<T>(): HashSet<T> {
  return new HashSet<T>(hashObject);
}
