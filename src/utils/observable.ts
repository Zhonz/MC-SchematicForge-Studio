export type Observer<T = unknown> = (data: T) => void;
export type Unsubscribe = () => void;

export interface ObservableOptions {
  fireImmediately?: boolean;
  once?: boolean;
}

export interface SubjectOptions extends ObservableOptions {
  async?: boolean;
  bufferSize?: number;
}

export class Observable<T = unknown> {
  private observers: Set<Observer<T>> = new Set();
  private options: Required<ObservableOptions>;

  constructor(options: ObservableOptions = {}) {
    this.options = {
      fireImmediately: options.fireImmediately ?? false,
      once: options.once ?? false,
    };
  }

  subscribe(observer: Observer<T>): Unsubscribe {
    this.observers.add(observer);
    return () => this.unsubscribe(observer);
  }

  unsubscribe(observer: Observer<T>): void {
    this.observers.delete(observer);
  }

  unsubscribeAll(): void {
    this.observers.clear();
  }

  notify(data: T): void {
    const observers = [...this.observers];
    for (const observer of observers) {
      observer(data);
    }
  }

  notifyAsync(data: T): Promise<void> {
    return Promise.all([...this.observers].map(observer => Promise.resolve(observer(data)))).then();
  }

  hasObservers(): boolean {
    return this.observers.size > 0;
  }

  getObserverCount(): number {
    return this.observers.size;
  }

  static fromEvent<T extends Event>(element: EventTarget, eventName: string): Observable<T> {
    const observable = new Observable<T>();
    const handler = (event: T) => observable.notify(event);
    element.addEventListener(eventName, handler as EventListener);
    return observable;
  }
}

export class Subject<T = unknown> {
  private observers: Set<Observer<T>> = new Set();
  private value: T;
  private subjectError: Error | null = null;
  private completed = false;
  private options: Required<ObservableOptions>;

  constructor(initialValue?: T, options?: SubjectOptions) {
    this.options = {
      fireImmediately: options?.fireImmediately ?? false,
      once: options?.once ?? false,
    };
    this.value = initialValue as T;
    
    if (options?.fireImmediately && initialValue !== undefined) {
      this.notify(initialValue);
    }
  }

  subscribe(observer: Observer<T>): Unsubscribe {
    this.observers.add(observer);
    if (!this.completed && !this.subjectError) {
      observer(this.value);
    }
    return () => this.observers.delete(observer);
  }

  unsubscribe(observer: Observer<T>): void {
    this.observers.delete(observer);
  }

  unsubscribeAll(): void {
    this.observers.clear();
  }

  notify(data: T): void {
    const observers = [...this.observers];
    for (const observer of observers) {
      observer(data);
    }
  }

  notifyAsync(data: T): Promise<void> {
    return Promise.all([...this.observers].map(observer => Promise.resolve(observer(data)))).then();
  }

  hasObservers(): boolean {
    return this.observers.size > 0;
  }

  getObserverCount(): number {
    return this.observers.size;
  }

  getValue(): T {
    if (this.subjectError) throw this.subjectError;
    return this.value;
  }

  next(value: T): void {
    if (this.completed) return;
    this.value = value;
    this.subjectError = null;
    this.notify(value);
  }

  error(err: Error): void {
    if (this.completed) return;
    this.subjectError = err;
    this.notify(err as unknown as T);
  }

  complete(): void {
    if (this.completed) return;
    this.completed = true;
  }

  asObservable(): Observable<T> {
    const subject = this;
    return {
      subscribe: (obs: Observer<T>) => subject.subscribe(obs),
      unsubscribe: (obs: Observer<T>) => subject.unsubscribe(obs),
      unsubscribeAll: () => subject.unsubscribeAll(),
      notify: (data: T) => subject.notify(data),
      notifyAsync: (data: T) => subject.notifyAsync(data),
      hasObservers: () => subject.hasObservers(),
      getObserverCount: () => subject.getObserverCount(),
    } as unknown as Observable<T>;
  }

  isCompleted(): boolean {
    return this.completed;
  }

  hasError(): boolean {
    return this.subjectError !== null;
  }

  getError(): Error | null {
    return this.subjectError;
  }
}

export class BehaviorSubject<T = unknown> extends Subject<T> {
  constructor(initialValue: T, options?: SubjectOptions) {
    super(initialValue, options);
  }
}

export class ReplaySubject<T = unknown> extends Subject<T> {
  private buffer: T[] = [];
  private bufferSize: number;
  private windowTime?: number;
  private timestamped: { value: T; time: number }[] = [];

  constructor(bufferSize = 1, windowTime?: number) {
    super();
    this.bufferSize = bufferSize;
    this.windowTime = windowTime;
  }

  next(value: T): void {
    if (this.windowTime) {
      const now = Date.now();
      this.timestamped.push({ value, time: now });
      this.timestamped = this.timestamped.filter(t => now - t.time <= this.windowTime!);
      this.buffer = this.timestamped.map(t => t.value);
    } else {
      this.buffer.push(value);
      if (this.buffer.length > this.bufferSize) {
        this.buffer.shift();
      }
    }
    super.next(value);
  }

  getBufferedValues(): T[] {
    return [...this.buffer];
  }

  subscribe(observer: Observer<T>): Unsubscribe {
    for (const value of this.buffer) {
      observer(value);
    }
    return super.subscribe(observer);
  }
}

export class AsyncSubject<T = unknown> extends Subject<T> {
  private lastValue?: T;
  private hasValue = false;

  constructor() {
    super();
  }

  next(value: T): void {
    this.lastValue = value;
    this.hasValue = true;
  }

  subscribe(observer: Observer<T>): Unsubscribe {
    if (this.isCompleted() && this.hasValue && this.lastValue !== undefined) {
      observer(this.lastValue);
    }
    return super.subscribe(observer);
  }

  complete(): void {
    if (this.hasValue && this.lastValue !== undefined) {
      super.next(this.lastValue);
    }
    super.complete();
  }
}

export class Operator<T = unknown, R = unknown> {
  constructor(private observable: Observable<T>) {}

  map(fn: (value: T) => R): Observable<R> {
    const obs = this.observable;
    return {
      subscribe: (observer: Observer<R>) => {
        return obs.subscribe(((value: T) => {
          try {
            observer(fn(value));
          } catch (error) {
            console.error('Map operator error:', error);
          }
        }) as Observer<T>);
      },
      unsubscribe: () => obs.unsubscribeAll(),
      unsubscribeAll: () => obs.unsubscribeAll(),
      notify: () => {},
      notifyAsync: async () => {},
      hasObservers: () => obs.hasObservers(),
      getObserverCount: () => obs.getObserverCount(),
    } as unknown as Observable<R>;
  }

  filter(predicate: (value: T) => boolean): Observable<T> {
    const obs = this.observable;
    return {
      subscribe: (observer: Observer<T>) => {
        return obs.subscribe((value: T) => {
          try {
            if (predicate(value)) {
              observer(value);
            }
          } catch (error) {
            console.error('Filter operator error:', error);
          }
        });
      },
      unsubscribe: () => obs.unsubscribeAll(),
      unsubscribeAll: () => obs.unsubscribeAll(),
      notify: () => {},
      notifyAsync: async () => {},
      hasObservers: () => obs.hasObservers(),
      getObserverCount: () => obs.getObserverCount(),
    } as unknown as Observable<T>;
  }

  tap(fn: (value: T) => void): Observable<T> {
    const obs = this.observable;
    return {
      subscribe: (observer: Observer<T>) => {
        return obs.subscribe((value: T) => {
          try {
            fn(value);
          } catch (error) {
            console.error('Tap operator error:', error);
          }
          observer(value);
        });
      },
      unsubscribe: () => obs.unsubscribeAll(),
      unsubscribeAll: () => obs.unsubscribeAll(),
      notify: () => {},
      notifyAsync: async () => {},
      hasObservers: () => obs.hasObservers(),
      getObserverCount: () => obs.getObserverCount(),
    } as unknown as Observable<T>;
  }

  debounceTime(ms: number): Observable<T> {
    const obs = this.observable;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return {
      subscribe: (observer: Observer<T>) => {
        return obs.subscribe((value: T) => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => observer(value), ms);
        });
      },
      unsubscribe: () => {
        if (timeoutId) clearTimeout(timeoutId);
        obs.unsubscribeAll();
      },
      unsubscribeAll: () => {
        if (timeoutId) clearTimeout(timeoutId);
        obs.unsubscribeAll();
      },
      notify: () => {},
      notifyAsync: async () => {},
      hasObservers: () => obs.hasObservers(),
      getObserverCount: () => obs.getObserverCount(),
    } as unknown as Observable<T>;
  }

  distinctUntilChanged(): Observable<T> {
    const obs = this.observable;
    let lastValue: T | undefined;
    let first = true;
    return {
      subscribe: (observer: Observer<T>) => {
        return obs.subscribe((value: T) => {
          if (first || value !== lastValue) {
            first = false;
            lastValue = value;
            observer(value);
          }
        });
      },
      unsubscribe: () => obs.unsubscribeAll(),
      unsubscribeAll: () => obs.unsubscribeAll(),
      notify: () => {},
      notifyAsync: async () => {},
      hasObservers: () => obs.hasObservers(),
      getObserverCount: () => obs.getObserverCount(),
    } as unknown as Observable<T>;
  }
}

export function from<T>(observable: Observable<T>): Operator<T> {
  return new Operator(observable);
}
