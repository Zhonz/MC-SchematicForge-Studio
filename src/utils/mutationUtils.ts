export type MutationCallback<T = unknown> = (mutation: MutationRecord, target: T) => void;

export interface MutationOptions {
  childList?: boolean;
  subtree?: boolean;
  attributes?: boolean;
  attributeFilter?: string[];
  attributeOldValue?: boolean;
  characterData?: boolean;
  characterDataOldValue?: boolean;
}

export class MutationTracker {
  private observer: MutationObserver | null = null;
  private callbacks: Set<MutationCallback> = new Set();
  private history: MutationRecord[] = [];
  private maxHistory: number;

  constructor(options: MutationOptions = {}, maxHistory: number = 100) {
    this.maxHistory = maxHistory;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        this.history.push(mutation);
        if (this.history.length > this.maxHistory) {
          this.history.shift();
        }
      });

      this.callbacks.forEach((callback) => {
        mutations.forEach((mutation) => {
          callback(mutation, mutation.target as any);
        });
      });
    });

    const observerOptions: MutationObserverInit = {
      childList: options.childList ?? true,
      subtree: options.subtree ?? true,
      attributes: options.attributes ?? true,
      attributeFilter: options.attributeFilter,
      attributeOldValue: options.attributeOldValue ?? true,
      characterData: options.characterData ?? true,
      characterDataOldValue: options.characterDataOldValue ?? true,
    };

    this.observer.observe(document.body, observerOptions);
  }

  observe(target: Element, options?: MutationOptions): void {
    if (!this.observer) return;

    const observerOptions: MutationObserverInit = {
      childList: options?.childList ?? true,
      subtree: options?.subtree ?? true,
      attributes: options?.attributes ?? true,
      attributeFilter: options?.attributeFilter,
      attributeOldValue: options?.attributeOldValue ?? true,
      characterData: options?.characterData ?? true,
      characterDataOldValue: options?.characterDataOldValue ?? true,
    };

    this.observer.observe(target, observerOptions);
  }

  disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  onMutation(callback: MutationCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  offMutation(callback: MutationCallback): void {
    this.callbacks.delete(callback);
  }

  getHistory(): MutationRecord[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  getAddedNodes(): Element[] {
    const added: Element[] = [];
    this.history.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            added.push(node);
          }
        });
      }
    });
    return added;
  }

  getRemovedNodes(): Element[] {
    const removed: Element[] = [];
    this.history.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.removedNodes.forEach((node) => {
          if (node instanceof Element) {
            removed.push(node);
          }
        });
      }
    });
    return removed;
  }

  getChangedAttributes(): Array<{ element: Element; name: string; oldValue: string | null; newValue: string | null }> {
    const changed: Array<{ element: Element; name: string; oldValue: string | null; newValue: string | null }> = [];
    this.history.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        const element = mutation.target as Element;
        changed.push({
          element,
          name: mutation.attributeName || '',
          oldValue: mutation.oldValue,
          newValue: element.getAttribute(mutation.attributeName || ''),
        });
      }
    });
    return changed;
  }
}

export class DeepWatcher<T extends object> {
  private proxy: T;
  private callbacks: Set<(path: string[], oldValue: unknown, newValue: unknown) => void> = new Set();
  private path: string[] = [];

  constructor(target: T) {
    this.proxy = this.createProxy(target, []);
  }

  private createProxy<T extends object>(target: T, path: string[]): T {
    const self = this;

    return new Proxy(target, {
      get(obj, prop, receiver) {
        const value = Reflect.get(obj, prop, receiver);
        if (value !== null && typeof value === 'object') {
          return self.createProxy(value as object, [...path, String(prop)]);
        }
        return value;
      },

      set(obj, prop, value, receiver) {
        const oldValue = Reflect.get(obj, prop, receiver);
        const result = Reflect.set(obj, prop, value, receiver);

        if (result) {
          const currentPath = [...path, String(prop)];
          self.callbacks.forEach((callback) => {
            callback(currentPath, oldValue, value);
          });
        }

        return result;
      },

      deleteProperty(target: T, p: string | symbol): boolean {
        const prop = String(p);
        const oldValue = Reflect.get(target, prop);
        const result = Reflect.deleteProperty(target, prop);

        if (result) {
          const currentPath = [...path, prop];
          self.callbacks.forEach((callback) => {
            callback(currentPath, oldValue, undefined);
          });
        }

        return result;
      },
    }) as T;
  }

  getProxy(): T {
    return this.proxy;
  }

  onChange(callback: (path: string[], oldValue: unknown, newValue: unknown) => void): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  getValue(path: string[]): unknown {
    let current: unknown = this.proxy;
    for (const key of path) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }

  setValue(path: string[], value: unknown): boolean {
    if (path.length === 0) return false;

    const target = this.getValue(path.slice(0, -1)) as Record<string, unknown>;
    if (target === null || target === undefined) return false;

    const key = path[path.length - 1];
    target[key] = value;
    return true;
  }
}

export class ChangeDetector {
  private snapshots: Map<string, unknown> = new Map();

  snapshot(key: string, value: unknown): void {
    this.snapshots.set(key, this.deepClone(value));
  }

  hasChanged(key: string, value: unknown): boolean {
    const snapshot = this.snapshots.get(key);
    if (!snapshot) return true;
    return !this.deepEqual(snapshot, value);
  }

  getChangedKeys<T extends object>(current: T, previous: T): (keyof T)[] {
    const changed: (keyof T)[] = [];
    const keys = new Set([...Object.keys(current), ...Object.keys(previous)]) as Set<keyof T>;

    keys.forEach((key) => {
      if (!this.deepEqual(current[key], previous[key])) {
        changed.push(key);
      }
    });

    return changed;
  }

  private deepClone<T>(value: T): T {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((v) => this.deepClone(v)) as T;

    const cloned = {} as T;
    for (const key of Object.keys(value as object)) {
      (cloned as Record<string, unknown>)[key] = this.deepClone((value as Record<string, unknown>)[key]);
    }
    return cloned;
  }

  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return false;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }

    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) =>
      this.deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  clear(key?: string): void {
    if (key) {
      this.snapshots.delete(key);
    } else {
      this.snapshots.clear();
    }
  }
}

export interface Diff<T = unknown> {
  type: 'added' | 'removed' | 'changed';
  path: string[];
  oldValue?: T;
  newValue?: T;
}

export class ObjectDiffer {
  static diff<T extends object>(oldObj: T, newObj: T): Diff[] {
    const diffs: Diff[] = [];
    this.compare('', oldObj, newObj, diffs);
    return diffs;
  }

  private static compare(path: string, oldValue: unknown, newValue: unknown, diffs: Diff[]): void {
    if (oldValue === newValue) return;

    if (oldValue === null || oldValue === undefined) {
      diffs.push({ type: 'added', path: path.split('.').filter(Boolean), newValue });
      return;
    }

    if (newValue === null || newValue === undefined) {
      diffs.push({ type: 'removed', path: path.split('.').filter(Boolean), oldValue });
      return;
    }

    if (typeof oldValue !== typeof newValue) {
      diffs.push({ type: 'changed', path: path.split('.').filter(Boolean), oldValue, newValue });
      return;
    }

    if (Array.isArray(oldValue) !== Array.isArray(newValue)) {
      diffs.push({ type: 'changed', path: path.split('.').filter(Boolean), oldValue, newValue });
      return;
    }

    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        const maxLen = Math.max(oldValue.length, newValue.length);
        for (let i = 0; i < maxLen; i++) {
          this.compare(`${path}.${i}`, oldValue[i], newValue[i], diffs);
        }
      } else {
        const allKeys = new Set([
          ...Object.keys(oldValue as object),
          ...Object.keys(newValue as object),
        ]);

        for (const key of allKeys) {
          this.compare(
            `${path}.${key}`,
            (oldValue as Record<string, unknown>)[key],
            (newValue as Record<string, unknown>)[key],
            diffs
          );
        }
      }
      return;
    }

    diffs.push({ type: 'changed', path: path.split('.').filter(Boolean), oldValue, newValue });
  }

  static patch<T extends object>(obj: T, diffs: Diff[]): T {
    const cloned = this.clone(obj);

    diffs.forEach((diff) => {
      const path = diff.path;
      if (path.length === 0) return;

      let current: Record<string, unknown> = cloned as unknown as Record<string, unknown>;

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]] as Record<string, unknown>;
        if (!current) return;
      }

      const lastKey = path[path.length - 1];

      switch (diff.type) {
        case 'added':
        case 'changed':
          current[lastKey] = diff.newValue;
          break;
        case 'removed':
          if (Array.isArray(current)) {
            current.splice(Number(lastKey), 1);
          } else {
            delete current[lastKey];
          }
          break;
      }
    });

    return cloned;
  }

  private static clone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((v) => this.clone(v)) as T;

    const cloned = {} as T;
    for (const key of Object.keys(obj as object)) {
      (cloned as Record<string, unknown>)[key] = this.clone((obj as Record<string, unknown>)[key]);
    }
    return cloned;
  }
}
