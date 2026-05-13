export interface DiffOptions {
  ignoreKeys?: string[];
}

export type DiffType = 'added' | 'removed' | 'modified';

export interface DiffResult {
  type: DiffType;
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export class DeepDiff {
  private ignoreKeys: Set<string>;

  constructor(options: DiffOptions = {}) {
    this.ignoreKeys = new Set(options.ignoreKeys ?? []);
  }

  diff(oldObj: unknown, newObj: unknown, path: string = ''): DiffResult[] {
    const results: DiffResult[] = [];
    if (this.isEqual(oldObj, newObj)) {
      return results;
    }
    if (Array.isArray(oldObj) && Array.isArray(newObj)) {
      this.diffArray(oldObj, newObj, path, results);
    } else if (typeof oldObj === 'object' && typeof newObj === 'object' && oldObj !== null && newObj !== null) {
      this.diffObject(oldObj as Record<string, unknown>, newObj as Record<string, unknown>, path, results);
    } else {
      results.push({
        type: 'modified',
        path,
        oldValue: oldObj,
        newValue: newObj,
      });
    }
    return results;
  }

  private diffArray(oldArr: unknown[], newArr: unknown[], path: string, results: DiffResult[]): void {
    const maxLen = Math.max(oldArr.length, newArr.length);
    for (let i = 0; i < maxLen; i++) {
      const itemPath = `${path}[${i}]`;
      if (i >= oldArr.length) {
        results.push({ type: 'added', path: itemPath, newValue: newArr[i] });
      } else if (i >= newArr.length) {
        results.push({ type: 'removed', path: itemPath, oldValue: oldArr[i] });
      } else {
        results.push(...this.diff(oldArr[i], newArr[i], itemPath));
      }
    }
  }

  private diffObject(oldObj: Record<string, unknown>, newObj: Record<string, unknown>, path: string, results: DiffResult[]): void {
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    allKeys.forEach((key) => {
      if (this.ignoreKeys.has(key)) return;
      const itemPath = path ? `${path}.${key}` : key;
      if (!(key in oldObj)) {
        results.push({ type: 'added', path: itemPath, newValue: newObj[key] });
      } else if (!(key in newObj)) {
        results.push({ type: 'removed', path: itemPath, oldValue: oldObj[key] });
      } else {
        results.push(...this.diff(oldObj[key], newObj[key], itemPath));
      }
    });
  }

  private isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) => this.isEqual(item, b[i]));
    }
    if (typeof a === 'object' && typeof b === 'object') {
      const aKeys = Object.keys(a as object);
      const bKeys = Object.keys(b as object);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every((key) => this.isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
    }
    return false;
  }

  patch(obj: unknown, diffs: DiffResult[]): unknown {
    if (typeof obj !== 'object' || obj === null) return obj;
    const result = Array.isArray(obj) ? [...obj] : { ...obj };
    for (const diff of diffs) {
      this.applyPatch(result, diff);
    }
    return result;
  }

  private applyPatch(obj: unknown, diff: DiffResult): void {
    if (typeof obj !== 'object' || obj === null) return;
    const pathParts = diff.path.split(/\.|\[|\]/).filter(Boolean);
    const lastKey = pathParts.pop();
    if (!lastKey) return;
    let current: Record<string, unknown> = obj as Record<string, unknown>;
    for (const part of pathParts) {
      const index = part.match(/^\d+$/)?.[0];
      current = (current[index ?? part] as Record<string, unknown>) ?? {};
    }
    switch (diff.type) {
      case 'added':
      case 'modified':
        if (diff.newValue !== undefined) {
          current[lastKey] = diff.newValue;
        }
        break;
      case 'removed':
        delete current[lastKey];
        break;
    }
  }
}

export const deepDiff = new DeepDiff();

export function diff<T = unknown>(oldObj: T, newObj: T, ignoreKeys?: string[]): DiffResult[] {
  const differ = new DeepDiff({ ignoreKeys });
  return differ.diff(oldObj, newObj);
}

export function patch<T = unknown>(obj: T, diffs: DiffResult[]): T {
  return deepDiff.patch(obj, diffs) as T;
}
