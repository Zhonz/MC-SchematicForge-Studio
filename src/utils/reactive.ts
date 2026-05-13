export function createSignal<T>(initialValue: T): {
  get: () => T;
  set: (value: T | ((prev: T) => T)) => void;
  subscribe: (callback: (value: T) => void) => () => void;
} {
  let value = initialValue;
  const subscribers = new Set<(value: T) => void>();

  return {
    get: () => value,
    set: (newValue) => {
      const next = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(value) 
        : newValue;
      if (next !== value) {
        value = next;
        subscribers.forEach(cb => cb(value));
      }
    },
    subscribe: (callback) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    }
  };
}

export function createMemo<T>(
  fn: () => T,
  deps: () => unknown[]
): () => T {
  let cached: T;
  let prevDeps: unknown[] = [];
  let initialized = false;

  return () => {
    const currentDeps = deps();
    if (!initialized || !areEqual(prevDeps, currentDeps)) {
      cached = fn();
      prevDeps = currentDeps;
      initialized = true;
    }
    return cached;
  };
}

function areEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function createEffect(
  fn: () => void,
  deps: () => unknown[]
): () => void {
  let prevDeps: unknown[] = [];
  let cleanup: (() => void) | undefined;

  const run = () => {
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }
    const currentDeps = deps();
    if (areEqual(prevDeps, currentDeps) && cleanup !== undefined) {
      return;
    }
    prevDeps = currentDeps;
    cleanup = fn() as (() => void) | undefined;
  };

  run();

  return () => {
    if (cleanup) {
      cleanup();
    }
  };
}

export class Computed<T> {
  private value: T | undefined;
  private stale = true;
  private subscribers = new Set<(value: T) => void>();

  constructor(
    private compute: () => T,
    private deps: () => unknown[]
  ) {}

  get(): T {
    if (this.stale) {
      this.value = this.compute();
      this.stale = false;
    }
    return this.value as T;
  }

  invalidate(): void {
    this.stale = true;
    this.notify();
  }

  private notify(): void {
    this.subscribers.forEach(cb => cb(this.get()));
  }
}

export class ReactiveMap<K, V> extends Map<K, V> {
  private changeListeners: Array<(key: K, value: V | undefined, type: 'add' | 'delete' | 'update') => void> = [];

  set(key: K, value: V): this {
    const isUpdate = this.has(key);
    super.set(key, value);
    this.emit(key, value, isUpdate ? 'update' : 'add');
    return this;
  }

  delete(key: K): boolean {
    if (this.has(key)) {
      const value = this.get(key);
      super.delete(key);
      this.emit(key, value, 'delete');
      return true;
    }
    return false;
  }

  onChange(listener: (key: K, value: V | undefined, type: 'add' | 'delete' | 'update') => void): () => void {
    this.changeListeners.push(listener);
    return () => {
      const index = this.changeListeners.indexOf(listener);
      if (index > -1) this.changeListeners.splice(index, 1);
    };
  }

  private emit(key: K, value: V | undefined, type: 'add' | 'delete' | 'update'): void {
    this.changeListeners.forEach(listener => listener(key, value, type));
  }
}

export class ReactiveSet<T> extends Set<T> {
  private changeListeners: Array<(value: T, type: 'add' | 'delete') => void> = [];

  add(value: T): this {
    const isNew = !this.has(value);
    super.add(value);
    if (isNew) this.emit(value, 'add');
    return this;
  }

  delete(value: T): boolean {
    if (this.has(value)) {
      super.delete(value);
      this.emit(value, 'delete');
      return true;
    }
    return false;
  }

  onChange(listener: (value: T, type: 'add' | 'delete') => void): () => void {
    this.changeListeners.push(listener);
    return () => {
      const index = this.changeListeners.indexOf(listener);
      if (index > -1) this.changeListeners.splice(index, 1);
    };
  }

  private emit(value: T, type: 'add' | 'delete'): void {
    this.changeListeners.forEach(listener => listener(value, type));
  }
}

export class Observable<T> {
  private observers: Map<string, (value: T) => void> = new Map();
  private value: T;

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  getValue(): T {
    return this.value;
  }

  setValue(newValue: T): void {
    this.value = newValue;
    this.notify();
  }

  update(updater: (value: T) => T): void {
    this.value = updater(this.value);
    this.notify();
  }

  subscribe(id: string, observer: (value: T) => void): () => void {
    this.observers.set(id, observer);
    observer(this.value);
    return () => this.observers.delete(id);
  }

  private notify(): void {
    this.observers.forEach(observer => observer(this.value));
  }
}

export function batch<T extends (...args: unknown[]) => void>(fn: T): T {
  let scheduled = false;
  const batched: Parameters<T>[] = [];

  return ((...args: Parameters<T>) => {
    batched.push(args);
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(() => {
        batched.forEach(args => fn(...args));
        batched.length = 0;
        scheduled = false;
      });
    }
  }) as T;
}

export function untrack<T>(fn: () => T): T {
  return fn();
}
