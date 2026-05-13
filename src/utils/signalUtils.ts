export type SignalListener<T> = (value: T) => void;
export type SignalCleanup = () => void;

export interface ISignal<T> {
  get: () => T;
  set: (value: T) => void;
  update: (updater: (value: T) => T) => void;
  subscribe: (listener: SignalListener<T>) => SignalCleanup;
  peek: () => T;
}

export interface IComputedSignal<T> extends ISignal<T> {
  invalidate: () => void;
}

export class Signal<T> {
  private value: T;
  private listeners: Set<SignalListener<T>> = new Set();
  private batched: SignalListener<T>[] = [];
  private isBatching = false;

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  get(): T {
    return this.value;
  }

  set(newValue: T): void {
    if (this.value === newValue) return;
    
    this.value = newValue;
    
    if (this.isBatching) {
      this.batched.push((v) => {
        this.listeners.forEach((listener) => listener(v));
      });
    } else {
      this.notify();
    }
  }

  update(updater: (value: T) => T): void {
    this.set(updater(this.value));
  }

  subscribe(listener: SignalListener<T>): SignalCleanup {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  peek(): T {
    return this.value;
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.value));
  }

  batch(callback: () => void): void {
    if (this.isBatching) {
      callback();
      return;
    }

    this.isBatching = true;
    this.batched = [];
    callback();
    this.isBatching = false;

    const listeners = new Set(this.listeners);
    const batchedValue = this.value;
    listeners.forEach((listener) => listener(batchedValue));
  }

  dispose(): void {
    this.listeners.clear();
    this.batched = [];
  }
}

export function createSignal<T>(initialValue: T): ISignal<T> {
  return new Signal(initialValue);
}

export function createComputed<T>(
  compute: () => T,
  equalityFn: (a: T, b: T) => boolean = (a, b) => a === b
): IComputedSignal<T> {
  let value = compute();
  let dirty = true;
  const signal = new Signal<T>(value);

  return {
    get(): T {
      if (dirty) {
        value = compute();
        dirty = false;
        signal.set(value);
      }
      return value;
    },
    set(): void {
      throw new Error('Cannot set a computed signal');
    },
    update(): void {
      throw new Error('Cannot update a computed signal');
    },
    subscribe: (listener: SignalListener<T>) => signal.subscribe(listener),
    peek: () => value,
    invalidate: () => {
      dirty = true;
      const newValue = compute();
      if (!equalityFn(value, newValue)) {
        value = newValue;
        signal.set(value);
      }
    },
  };
}

export function createEffect<T>(fn: () => T, initialValue?: T): SignalCleanup {
  let previousValue = initialValue;
  let cleanup: SignalCleanup | undefined;

  const run = () => {
    const newValue = fn();
    previousValue = newValue;
  };

  run();

  return () => {
    cleanup?.();
  };
}

export function createMemo<T>(
  compute: () => T,
  initialValue?: T
): () => T {
  const signal = createComputed(compute);
  let initialized = false;
  let cached: T;

  return () => {
    if (!initialized && initialValue !== undefined) {
      cached = initialValue;
      initialized = true;
    }
    return initialized ? signal.get() : (cached = signal.get(), initialized = true, cached);
  };
}

export class SignalMap<TKey, TValue> {
  private signals: Map<TKey, Signal<TValue>> = new Map();
  private keys: ISignal<Set<TKey>>;

  constructor() {
    this.keys = createSignal(new Set<TKey>());
  }

  get(key: TKey): Signal<TValue> | undefined {
    return this.signals.get(key);
  }

  set(key: TKey, value: TValue): void {
    if (!this.signals.has(key)) {
      const sig = createSignal(value);
      this.signals.set(key, sig as Signal<TValue>);
      this.keys.update((keys) => new Set(keys).add(key));
    } else {
      this.signals.get(key)!.set(value);
    }
  }

  has(key: TKey): boolean {
    return this.signals.has(key);
  }

  delete(key: TKey): boolean {
    const signal = this.signals.get(key);
    if (signal) {
      signal.dispose();
      this.signals.delete(key);
      this.keys.update((keys) => {
        const newKeys = new Set(keys);
        newKeys.delete(key);
        return newKeys;
      });
      return true;
    }
    return false;
  }

  clear(): void {
    for (const signal of this.signals.values()) {
      signal.dispose();
    }
    this.signals.clear();
    this.keys.set(new Set());
  }

  getKeys(): ISignal<Set<TKey>> {
    return this.keys;
  }

  size(): number {
    return this.signals.size;
  }

  entries(): IterableIterator<[TKey, Signal<TValue>]> {
    return this.signals.entries();
  }

  values(): IterableIterator<Signal<TValue>> {
    return this.signals.values();
  }
}

export class BatchSignal<T> {
  private signal: ISignal<T>;
  private pending: T | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private delay: number;

  constructor(initialValue: T, delay = 0) {
    this.signal = createSignal(initialValue);
    this.delay = delay;
  }

  set(value: T): void {
    this.pending = value;

    if (this.delay === 0) {
      this.flush();
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flush(), this.delay);
    }
  }

  private flush(): void {
    if (this.pending !== null) {
      this.signal.set(this.pending);
      this.pending = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  get(): T {
    return this.signal.get();
  }

  subscribe(listener: SignalListener<T>): SignalCleanup {
    return this.signal.subscribe(listener);
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pending = null;
  }
}

export function batchSignal<T>(
  signal: Signal<T>,
  delay?: number
): { set: (value: T) => void; get: () => T; subscribe: (listener: SignalListener<T>) => SignalCleanup } {
  const batcher = new BatchSignal(signal.get(), delay);
  return {
    set: (value: T) => batcher.set(value),
    get: () => batcher.get(),
    subscribe: (listener: SignalListener<T>) => batcher.subscribe(listener),
  };
}

export class DerivedSignal<T, D> {
  private signal: ISignal<T>;
  private derive: (value: T) => D;
  private derivedSignal: ISignal<D>;

  constructor(signal: ISignal<T>, derive: (value: T) => D) {
    this.signal = signal;
    this.derive = derive;
    this.derivedSignal = createSignal(derive(signal.get()));

    signal.subscribe((value) => {
      this.derivedSignal.set(derive(value));
    });
  }

  get(): D {
    return this.derivedSignal.get();
  }

  subscribe(listener: SignalListener<D>): SignalCleanup {
    return this.derivedSignal.subscribe(listener);
  }
}

export function derive<T, D>(
  signal: Signal<T>,
  derive: (value: T) => D
): ISignal<D> {
  const derived = createSignal(derive(signal.get()));

  signal.subscribe((value) => {
    derived.set(derive(value));
  });

  return derived;
}

export interface SignalEffect {
  dispose: () => void;
  pause: () => void;
  resume: () => void;
  isActive: () => boolean;
}

export function createSignalEffect(
  fn: () => void | (() => void),
  deps: Signal<unknown>[]
): SignalEffect {
  let active = true;
  let cleanup: (() => void) | void;

  const run = () => {
    if (!active) return;
    cleanup?.();
    cleanup = fn();
  };

  const unsubscribes = deps.map((dep) =>
    dep.subscribe(() => run())
  );

  run();

  return {
    dispose: () => {
      cleanup?.();
      unsubscribes.forEach((unsub) => unsub());
    },
    pause: () => {
      active = false;
    },
    resume: () => {
      active = true;
      run();
    },
    isActive: () => active,
  };
}
