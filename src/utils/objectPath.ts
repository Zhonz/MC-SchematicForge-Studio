export type ObjectPath = string | string[];
export type Comparator<T = unknown> = (a: T, b: T) => number;

export interface MergeOptions {
  deep?: boolean;
  concatArrays?: boolean;
  overwrite?: boolean;
}

export class ObjectPathUtil {
  static get<T = unknown>(obj: Record<string, unknown>, path: ObjectPath, defaultValue?: T): T | undefined {
    const keys = typeof path === 'string' ? path.split('.') : path;
    let current: unknown = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return defaultValue;
      }
      current = (current as Record<string, unknown>)[key];
    }
    
    return (current as T) ?? defaultValue;
  }

  static set(obj: Record<string, unknown>, path: ObjectPath, value: unknown): boolean {
    const keys = typeof path === 'string' ? path.split('.') : [...path];
    const lastKey = keys.pop();
    
    if (!lastKey) return false;
    
    let current: Record<string, unknown> = obj;
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    
    current[lastKey] = value;
    return true;
  }

  static has(obj: Record<string, unknown>, path: ObjectPath): boolean {
    return this.get(obj, path) !== undefined;
  }

  static delete(obj: Record<string, unknown>, path: ObjectPath): boolean {
    const keys = typeof path === 'string' ? path.split('.') : [...path];
    const lastKey = keys.pop();
    
    if (!lastKey) return false;
    
    let current: Record<string, unknown> = obj;
    for (const key of keys) {
      if (!(key in current)) return false;
      current = current[key] as Record<string, unknown>;
    }
    
    delete current[lastKey];
    return true;
  }

  static paths(obj: unknown, prefix = ''): string[] {
    if (typeof obj !== 'object' || obj === null) {
      return prefix ? [prefix] : [];
    }

    const results: string[] = [];
    const entries = Object.entries(obj as Record<string, unknown>);

    for (const [key, value] of entries) {
      const newPath = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        results.push(...this.paths(value, newPath));
      } else {
        results.push(newPath);
      }
    }

    return results;
  }

  static merge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
    const result = { ...target };

    for (const source of sources) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          const sourceValue = source[key];
          const targetValue = result[key];

          if (
            typeof sourceValue === 'object' &&
            sourceValue !== null &&
            !Array.isArray(sourceValue) &&
            typeof targetValue === 'object' &&
            targetValue !== null &&
            !Array.isArray(targetValue)
          ) {
            result[key] = this.merge(
              targetValue as Record<string, unknown>,
              sourceValue as Record<string, unknown>
            ) as T[Extract<keyof T, string>];
          } else {
            result[key] = sourceValue as T[Extract<keyof T, string>];
          }
        }
      }
    }

    return result;
  }

  static flatten<T = unknown>(obj: Record<string, unknown>, separator = '.'): Record<string, T> {
    const result: Record<string, T> = {};

    const traverse = (current: Record<string, unknown>, path: string) => {
      for (const key in current) {
        const value = current[key];
        const newPath = path ? `${path}${separator}${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          traverse(value as Record<string, unknown>, newPath);
        } else {
          result[newPath] = value as T;
        }
      }
    };

    traverse(obj, '');
    return result;
  }

  static unflatten<T = unknown>(obj: Record<string, T>, separator = '.'): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const path in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, path)) {
        this.set(result, path.split(separator), obj[path]);
      }
    }

    return result;
  }

  static pick<T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> {
    const result = {} as Pick<T, K>;
    
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    
    return result;
  }

  static omit<T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> {
    const result = { ...obj };
    
    for (const key of keys) {
      delete result[key];
    }
    
    return result as Omit<T, K>;
  }

  static cloneDeep<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.cloneDeep(item)) as unknown as T;
    }

    const cloned = {} as Record<string, unknown>;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.cloneDeep((obj as Record<string, unknown>)[key]);
      }
    }

    return cloned as T;
  }

  static equals(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object' && typeof b === 'object') {
      const objA = a as Record<string, unknown>;
      const objB = b as Record<string, unknown>;

      const keysA = Object.keys(objA);
      const keysB = Object.keys(objB);

      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.equals(objA[key], objB[key])) return false;
      }

      return true;
    }

    return false;
  }

  static diff(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>
  ): { added: Record<string, unknown>; removed: Record<string, unknown>; changed: Record<string, { from: unknown; to: unknown }> } {
    const added: Record<string, unknown> = {};
    const removed: Record<string, unknown> = {};
    const changed: Record<string, { from: unknown; to: unknown }> = {};

    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of allKeys) {
      const in1 = key in obj1;
      const in2 = key in obj2;

      if (in2 && !in1) {
        added[key] = obj2[key];
      } else if (in1 && !in2) {
        removed[key] = obj1[key];
      } else if (!this.equals(obj1[key], obj2[key])) {
        changed[key] = { from: obj1[key], to: obj2[key] };
      }
    }

    return { added, removed, changed };
  }
}

export const objectPath = {
  get: ObjectPathUtil.get,
  set: ObjectPathUtil.set,
  has: ObjectPathUtil.has,
  delete: ObjectPathUtil.delete,
  paths: ObjectPathUtil.paths,
  merge: ObjectPathUtil.merge,
  flatten: ObjectPathUtil.flatten,
  unflatten: ObjectPathUtil.unflatten,
  pick: ObjectPathUtil.pick,
  omit: ObjectPathUtil.omit,
  cloneDeep: ObjectPathUtil.cloneDeep,
  equals: ObjectPathUtil.equals,
  diff: ObjectPathUtil.diff,
};
