export function parseJSON<T = unknown>(str: string): T | null {
  try { return JSON.parse(str); } catch { return null; }
}

export function stringifyJSON(obj: unknown, indent?: number): string {
  try { return JSON.stringify(obj, null, indent); } catch { return ''; }
}

export function cloneDeep<T>(obj: T): T | null {
  try { return JSON.parse(JSON.stringify(obj)); } catch { return null; }
}

export function mergeDeep(target: Record<string, unknown>, ...sources: Record<string, unknown>[]): Record<string, unknown> {
  const result = { ...target };
  for (const source of sources) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sVal = source[key];
        const tVal = result[key];
        if (isPlainObject(sVal) && isPlainObject(tVal)) {
          result[key] = mergeDeep(tVal as Record<string, unknown>, sVal as Record<string, unknown>);
        } else {
          result[key] = sVal;
        }
      }
    }
  }
  return result;
}

export function isPlainObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(k => { if (k in obj) result[k] = obj[k]; });
  return result;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(k => delete result[k]);
  return result as Omit<T, K>;
}

export function get(obj: Record<string, unknown>, path: string, defaultValue?: unknown): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return defaultValue;
    current = (current as Record<string, unknown>)[key];
  }
  return current ?? defaultValue;
}

export function set(obj: Record<string, unknown>, path: string, value: unknown): boolean {
  const keys = path.split('.');
  const last = keys.pop();
  if (!last) return false;
  let current: Record<string, unknown> = obj;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[last] = value;
  return true;
}

export function has(obj: Record<string, unknown>, path: string): boolean {
  return get(obj, path) !== undefined;
}

export function del(obj: Record<string, unknown>, path: string): boolean {
  const keys = path.split('.');
  const last = keys.pop();
  if (!last) return false;
  let current: Record<string, unknown> = obj;
  for (const key of keys) {
    if (!(key in current)) return false;
    current = current[key] as Record<string, unknown>;
  }
  delete current[last];
  return true;
}
