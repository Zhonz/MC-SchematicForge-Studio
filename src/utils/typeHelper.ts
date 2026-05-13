export type KeyOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

export type ValueOf<T> = T[keyof T];

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Nullable<T> = { [P in keyof T]: T[P] | null };

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type AtLeast<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Constructor<T = unknown> = new (...args: unknown[]) => T;

export type AbstractClass<T = unknown> = abstract new (...args: unknown[]) => T;

export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? K : never;
}[keyof T];

export type FunctionProperties<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => R : never;
};

export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K;
}[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type Promisable<T> = T | Promise<T>;

export type AsyncReturnType<T extends (...args: unknown[]) => Promise<unknown>> =
  T extends (...args: unknown[]) => Promise<infer R> ? R : never;

export type Intersection<T, U> = T extends object ? (U extends object ? {
  [K in keyof T & keyof U]: K extends keyof T ? T[K] : never;
} : never) : never;

export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

export type DistributeUnion<T> = T extends unknown ? T : never;

export type ExcludeNull<T> = T extends null ? never : T;

export type ExcludeUndefined<T> = T extends undefined ? never : T;

export type AtLeastOne<T> = {
  [K in keyof T]: Pick<T, K>;
}[keyof T];

export type ExactlyOne<T> = {
  [K in keyof T]: Pick<T, K> & Partial<Record<Exclude<keyof T, K>, never>>;
}[keyof T] & Partial<Record<keyof T, never>>;

export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: T[P] extends object ? ReadonlyDeep<T[P]> : T[P];
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export class TypeHelper {
  static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  static isPlainObject(value: unknown): value is Record<string, unknown> {
    if (!this.isObject(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  static getType(value: unknown): string {
    return Object.prototype.toString.call(value).slice(8, -1);
  }

  static isType(value: unknown, type: string): boolean {
    return this.getType(value) === type;
  }

  static clone<T>(value: T): T {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(item => this.clone(item)) as unknown as T;
    }
    const cloned = {} as Record<string, unknown>;
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        cloned[key] = this.clone((value as Record<string, unknown>)[key]);
      }
    }
    return cloned as T;
  }

  static merge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
    const result = { ...target };
    for (const source of sources) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          const sourceValue = source[key];
          const targetValue = result[key];
          if (this.isPlainObject(sourceValue) && this.isPlainObject(targetValue)) {
            result[key] = this.merge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>) as T[Extract<keyof T, string>];
          } else {
            result[key] = sourceValue as T[Extract<keyof T, string>];
          }
        }
      }
    }
    return result;
  }

  static pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  static omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result as Omit<T, K>;
  }

  static invert<T extends Record<string, string | number>>(obj: T): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in obj) {
      result[String(obj[key])] = key;
    }
    return result;
  }

  static keyBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T> {
    const result: Record<string, T> = {};
    for (const item of array) {
      const k = typeof key === 'function' ? key(item) : String(item[key]);
      result[k] = item;
    }
    return result;
  }

  static groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
    const result: Record<string, T[]> = {};
    for (const item of array) {
      const k = typeof key === 'function' ? key(item) : String(item[key]);
      if (!result[k]) result[k] = [];
      result[k].push(item);
    }
    return result;
  }

  static uniq<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  static uniqBy<T>(array: T[], key: keyof T | ((item: T) => unknown)): T[] {
    const seen = new Set();
    const result: T[] = [];
    for (const item of array) {
      const k = typeof key === 'function' ? key(item) : item[key];
      if (!seen.has(k)) {
        seen.add(k);
        result.push(item);
      }
    }
    return result;
  }

  static chunk<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  static difference<T>(array: T[], ...others: T[][]): T[] {
    const set = new Set(others.flat());
    return array.filter(item => !set.has(item));
  }

  static intersection<T>(array: T[], ...others: T[][]): T[] {
    const set = new Set(others.flat());
    return array.filter(item => set.has(item));
  }

  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  static sample<T>(array: T[], count = 1): T[] {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  static range(start: number, end: number, step = 1): number[] {
    const result: number[] = [];
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
    return result;
  }

  static times<T>(count: number, fn: (index: number) => T): T[] {
    return Array.from({ length: count }, (_, i) => fn(i));
  }

  static debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  static throttle<T extends (...args: unknown[]) => void>(
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  }

  static memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
    const cache = new Map<string, unknown>();
    return ((...args: unknown[]): unknown => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  static once<T extends (...args: unknown[]) => unknown>(fn: T): T {
    let called = false;
    let result: unknown;
    return ((...args: unknown[]): unknown => {
      if (!called) {
        called = true;
        result = fn(...args);
      }
      return result;
    }) as T;
  }
}

export type TypeTransform<T, R> = {
  [K in keyof T]: T[K] extends infer V
    ? V extends (...args: infer A) => infer B
      ? (...args: A) => R
      : V extends object
        ? TypeTransform<V, R>
        : R
    : R;
};
