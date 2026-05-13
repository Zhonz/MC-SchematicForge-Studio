export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }
  return cloned as T;
}

export function deepMerge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
  const result = { ...target };
  
  for (const source of sources) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sVal = source[key];
        const tVal = result[key];
        
        if (isPlainObject(sVal) && isPlainObject(tVal)) {
          result[key] = deepMerge(tVal as Record<string, unknown>, sVal as Record<string, unknown>) as T[Extract<keyof T, string>];
        } else {
          result[key] = sVal as T[Extract<keyof T, string>];
        }
      }
    }
  }
  
  return result;
}

export function isPlainObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  
  if (isPlainObject(a) && isPlainObject(b)) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
  }
  
  return false;
}

export function deepGet(obj: unknown, path: string, defaultValue?: unknown): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) return defaultValue;
    if (typeof current !== 'object') return defaultValue;
    current = (current as Record<string, unknown>)[key];
  }
  
  return current !== undefined ? current : defaultValue;
}

export function deepSet(obj: Record<string, unknown>, path: string, value: unknown): boolean {
  const keys = path.split('.');
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

export function deepHas(obj: unknown, path: string): boolean {
  return deepGet(obj, path) !== undefined;
}

export function deepDelete(obj: Record<string, unknown>, path: string): boolean {
  const keys = path.split('.');
  const lastKey = keys.pop();
  if (!lastKey) return false;
  
  let current: Record<string, unknown> = obj;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') return false;
    current = current[key] as Record<string, unknown>;
  }
  
  if (lastKey in current) {
    delete current[lastKey];
    return true;
  }
  return false;
}

export function deepKeys(obj: unknown, prefix = ''): string[] {
  if (!isPlainObject(obj) && !Array.isArray(obj)) return prefix ? [prefix] : [];
  
  const keys: string[] = [];
  const source = obj as Record<string, unknown>;
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      const value = source[key];
      
      if (isPlainObject(value) || Array.isArray(value)) {
        keys.push(...deepKeys(value, fullPath));
      } else {
        keys.push(fullPath);
      }
    }
  }
  
  return keys;
}

export function deepValues(obj: unknown): unknown[] {
  if (!isPlainObject(obj) && !Array.isArray(obj)) return [obj];
  
  const values: unknown[] = [];
  const source = Array.isArray(obj) ? obj : Object.values(obj as Record<string, unknown>);
  
  for (const value of source) {
    if (isPlainObject(value)) {
      values.push(...deepValues(value));
    } else if (Array.isArray(value)) {
      values.push(...deepValues(value));
    } else {
      values.push(value);
    }
  }
  
  return values;
}

export function deepEntries(obj: unknown, prefix = ''): Array<[string, unknown]> {
  if (!isPlainObject(obj) && !Array.isArray(obj)) {
    return prefix ? [[prefix, obj]] : [];
  }
  
  const entries: Array<[string, unknown]> = [];
  const source = obj as Record<string, unknown>;
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      const value = source[key];
      
      if (isPlainObject(value) || Array.isArray(value)) {
        entries.push(...deepEntries(value, fullPath));
      } else {
        entries.push([fullPath, value]);
      }
    }
  }
  
  return entries;
}
