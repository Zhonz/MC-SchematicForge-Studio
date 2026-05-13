export type StateListener<T> = (state: T, prevState: T) => void;
export type Selector<T, R> = (state: T) => R;
export type EqualityFn<T> = (a: T, b: T) => boolean;

export interface Store<T> {
  getState: () => T;
  setState: (state: Partial<T> | ((prev: T) => Partial<T>)) => void;
  subscribe: (listener: StateListener<T>) => () => void;
  subscribeWithSelector: <R>(selector: Selector<T, R>, listener: (value: R, prevValue: R) => void) => () => void;
  destroy: () => void;
}

export function createStore<T extends object>(initialState: T): Store<T> {
  let state = { ...initialState };
  const listeners = new Set<StateListener<T>>();
  const selectorListeners = new Map<Selector<T, unknown>, Set<(value: unknown, prevValue: unknown) => void>>();

  const notify = (prevState: T) => {
    listeners.forEach((listener) => listener(state, prevState));

    selectorListeners.forEach((subs, selector) => {
      const newValue = selector(state);
      const prevValue = selector(prevState);
      if (newValue !== prevValue) {
        subs.forEach((listener) => listener(newValue, prevValue));
      }
    });
  };

  return {
    getState: () => state,
    setState: (partial) => {
      const prevState = state;
      const nextPartial = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...nextPartial };
      notify(prevState);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeWithSelector: <R>(selector: Selector<T, R>, listener: (value: R, prevValue: R) => void) => {
      if (!selectorListeners.has(selector)) {
        selectorListeners.set(selector, new Set());
      }
      const subs = selectorListeners.get(selector)!;
      subs.add(listener as (value: unknown, prevValue: unknown) => void);

      return () => {
        subs.delete(listener as (value: unknown, prevValue: unknown) => void);
        if (subs.size === 0) {
          selectorListeners.delete(selector);
        }
      };
    },
    destroy: () => {
      listeners.clear();
      selectorListeners.clear();
    },
  };
}

export class StateMachine<T extends string, S extends object> {
  private state: T;
  private context: S;
  private transitions: Map<string, Map<string, (context: S) => S | void>> = new Map();
  private listeners: Set<(state: T, context: S) => void> = new Set();
  private history: Array<{ state: T; context: S }> = [];

  constructor(initialState: T, initialContext: S) {
    this.state = initialState;
    this.context = initialContext;
    this.history.push({ state: initialState, context: { ...initialContext } });
  }

  transition(event: string, updateContext?: Partial<S>): boolean {
    const stateTransitions = this.transitions.get(this.state);
    if (!stateTransitions) return false;

    const transition = stateTransitions.get(event);
    if (!transition) return false;

    const prevState = this.state;
    const prevContext = { ...this.context };

    if (updateContext) {
      this.context = { ...this.context, ...updateContext };
    }

    const contextUpdate = transition(this.context);
    if (contextUpdate) {
      this.context = { ...this.context, ...contextUpdate };
    }

    const stateUpdate = stateTransitions.get(`__${event}_STATE__`);
    if (stateUpdate) {
      const newState = stateUpdate(this.context);
      if (newState) {
        this.state = newState as unknown as T;
      }
    }

    this.history.push({ state: this.state, context: { ...this.context } });
    this.notify(prevState, prevContext);

    return true;
  }

  addTransition(fromState: T, event: string, handler: (context: S) => S | void): this {
    if (!this.transitions.has(fromState)) {
      this.transitions.set(fromState, new Map());
    }
    this.transitions.get(fromState)!.set(event, handler);
    return this;
  }

  addStateTransition(fromState: T, event: string, toState: T): this {
    if (!this.transitions.has(fromState)) {
      this.transitions.set(fromState, new Map());
    }
    this.transitions.get(fromState)!.set(`__${event}_STATE__`, () => toState as unknown as S);
    return this;
  }

  canTransition(event: string): boolean {
    const stateTransitions = this.transitions.get(this.state);
    return stateTransitions?.has(event) ?? false;
  }

  getState(): T {
    return this.state;
  }

  getContext(): Readonly<S> {
    return this.context;
  }

  getHistory(): ReadonlyArray<{ state: T; context: S }> {
    return [...this.history];
  }

  subscribe(listener: (state: T, context: S) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(prevState: T, prevContext: S): void {
    this.listeners.forEach((listener) => listener(this.state, this.context));
  }

  reset(initialState?: T, initialContext?: S): void {
    if (initialState !== undefined) this.state = initialState;
    if (initialContext !== undefined) this.context = initialContext;
    this.history = [{ state: this.state, context: { ...this.context } }];
    this.notify(this.state, this.context);
  }
}

export function createSelector<T, R1>(getter1: () => R1, transform: (v1: R1) => R1): () => R1;
export function createSelector<T, R1, R2, R>(
  getter1: () => R1,
  getter2: () => R2,
  transform: (v1: R1, v2: R2) => R
): () => R;
export function createSelector<T, R1, R2, R3, R>(
  getter1: () => R1,
  getter2: () => R2,
  getter3: () => R3,
  transform: (v1: R1, v2: R2, v3: R3) => R
): () => R;
export function createSelector<T, R1, R2, R3, R4, R>(
  getter1: () => R1,
  getter2: () => R2,
  getter3: () => R3,
  getter4: () => R4,
  transform: (v1: R1, v2: R2, v3: R3, v4: R4) => R
): () => R;
export function createSelector<T, R>(
  ...args: [...getters: Array<() => unknown>, transform: (...values: unknown[]) => R]
): () => R {
  const transformFn = args[args.length - 1] as (...values: unknown[]) => R;
  const getters = args.slice(0, -1) as Array<() => unknown>;

  return () => {
    const values = getters.map((getter) => getter());
    return transformFn(...values);
  };
}

export class Computed<T> {
  private value: T | undefined;
  private dirty = true;
  private subscribers: Set<(value: T) => void> = new Set();
  private compute: () => T;
  private equalityFn: EqualityFn<T>;

  constructor(compute: () => T, equalityFn: EqualityFn<T> = Object.is) {
    this.compute = compute;
    this.equalityFn = equalityFn;
  }

  get(): T {
    if (this.dirty) {
      const newValue = this.compute();
      if (this.value === undefined || !this.equalityFn(this.value, newValue)) {
        const prevValue = this.value;
        this.value = newValue;
        if (prevValue !== undefined) {
          this.notify(prevValue);
        }
      }
      this.dirty = false;
    }
    return this.value as T;
  }

  invalidate(): void {
    this.dirty = true;
  }

  subscribe(listener: (value: T) => void): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  private notify(prevValue: T): void {
    const currentValue = this.value as T;
    this.subscribers.forEach((listener) => listener(currentValue));
  }
}

export interface ImmerHelper<T> {
  draft: T;
  finishDraft: () => T;
}

export function produce<T>(base: T, recipe: (draft: T) => void | T): T {
  const draft = deepClone(base);
  const result = recipe(draft);
  return (result === undefined ? draft : result) as T;
}

function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

export function createImmer<T>(initialState: T): {
  getState: () => T;
  setState: (recipe: (draft: T) => void | T) => void;
  subscribe: (listener: StateListener<T>) => () => void;
} {
  let state = initialState;
  const listeners = new Set<StateListener<T>>();

  return {
    getState: () => state,
    setState: (recipe) => {
      const prevState = state;
      state = produce(state, recipe);
      listeners.forEach((listener) => listener(state, prevState));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
