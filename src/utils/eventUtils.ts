export type EventHandler<T = unknown> = (event: T) => void;

export interface EventSubscription {
  unsubscribe: () => void;
}

export interface EventOptions {
  once?: boolean;
  capture?: boolean;
  passive?: boolean;
}

export class EventEmitter<TEventMap extends Record<string, unknown> = Record<string, unknown>> {
  private handlers: Map<string, Set<EventHandler<unknown>>> = new Map();
  private onceHandlers: Map<string, Set<EventHandler<unknown>>> = new Map();
  private wildcardHandlers: Array<{ pattern: RegExp; handler: EventHandler<unknown> }> = [];

  on<K extends string>(event: K, handler: EventHandler<unknown>, options?: EventOptions): EventSubscription {
    if (options?.once) {
      if (!this.onceHandlers.has(event)) {
        this.onceHandlers.set(event, new Set());
      }
      this.onceHandlers.get(event)!.add(handler);
    } else {
      if (!this.handlers.has(event)) {
        this.handlers.set(event, new Set());
      }
      this.handlers.get(event)!.add(handler);
    }

    return {
      unsubscribe: () => this.off(event, handler),
    };
  }

  off<K extends string>(event: K, handler?: EventHandler<unknown>): void {
    if (handler) {
      this.handlers.get(event)?.delete(handler);
      this.onceHandlers.get(event)?.delete(handler);
    } else {
      this.handlers.delete(event);
      this.onceHandlers.delete(event);
    }
  }

  emit<K extends string>(event: K, data?: TEventMap[Extract<keyof TEventMap, string>]): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(data as TEventMap[Extract<keyof TEventMap, string>]);
      }
    }

    const onceHandlers = this.onceHandlers.get(event);
    if (onceHandlers) {
      for (const handler of onceHandlers) {
        handler(data as TEventMap[Extract<keyof TEventMap, string>]);
      }
      this.onceHandlers.delete(event);
    }

    for (const { pattern, handler } of this.wildcardHandlers) {
      if (pattern.test(event)) {
        handler({ type: event, data });
      }
    }
  }

  once<K extends string>(event: K, handler: EventHandler<unknown>): EventSubscription {
    return this.on(event, handler, { once: true });
  }

  onWildcard(pattern: RegExp, handler: EventHandler<unknown>): EventSubscription {
    this.wildcardHandlers.push({ pattern, handler });
    return {
      unsubscribe: () => {
        const index = this.wildcardHandlers.findIndex((w) => w.handler === handler);
        if (index !== -1) {
          this.wildcardHandlers.splice(index, 1);
        }
      },
    };
  }

  listenerCount<K extends string>(event: K): number {
    return (this.handlers.get(event)?.size ?? 0) + (this.onceHandlers.get(event)?.size ?? 0);
  }

  hasListeners<K extends string>(event?: K): boolean {
    if (event) {
      return this.listenerCount(event) > 0;
    }
    return this.handlers.size > 0 || this.onceHandlers.size > 0;
  }

  clear(): void {
    this.handlers.clear();
    this.onceHandlers.clear();
    this.wildcardHandlers = [];
  }
}

export class DOMEeventBinder {
  private targets: WeakMap<EventTarget, Map<string, EventListener>> = new WeakMap();

  bind(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): () => void {
    if (!this.targets.has(target)) {
      this.targets.set(target, new Map());
    }

    const listeners = this.targets.get(target)!;
    listeners.set(`${type}-${listener.toString()}`, listener);

    target.addEventListener(type, listener, options);

    return () => {
      target.removeEventListener(type, listener, options);
      listeners.delete(`${type}-${listener.toString()}`);
    };
  }

  bindMultiple(
    target: EventTarget,
    events: Record<string, EventListener>,
    options?: AddEventListenerOptions
  ): () => void {
    const unbinds: Array<() => void> = [];

    for (const [type, listener] of Object.entries(events)) {
      unbinds.push(this.bind(target, type, listener, options));
    }

    return () => unbinds.forEach((unbind) => unbind());
  }

  unbindAll(target: EventTarget): void {
    const listeners = this.targets.get(target);
    if (!listeners) return;

    for (const [key, listener] of listeners) {
      const [type] = key.split('-');
      target.removeEventListener(type, listener);
    }

    listeners.clear();
  }
}

export const domEventBinder = new DOMEeventBinder();

export function on(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions
): () => void {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
}

export function once(
  target: EventTarget,
  type: string,
  listener: EventListener
): void {
  const wrappedListener = (event: Event) => {
    target.removeEventListener(type, wrappedListener);
    listener(event);
  };
  target.addEventListener(type, wrappedListener);
}

export class CustomEventEmitter<T = unknown> {
  private target: EventTarget;

  constructor(target?: EventTarget) {
    this.target = target || new EventTarget();
  }

  dispatch(type: string, detail?: T, options?: { bubbles?: boolean; cancelable?: boolean }): boolean {
    const event = new CustomEvent(type, { detail, bubbles: options?.bubbles, cancelable: options?.cancelable });
    return this.target.dispatchEvent(event);
  }

  on(type: string, listener: (detail: T) => void, options?: AddEventListenerOptions): () => void {
    const handler: EventListener = (event) => {
      listener((event as CustomEvent<T>).detail);
    };
    this.target.addEventListener(type, handler, options);
    return () => this.target.removeEventListener(type, handler, options);
  }

  off(type: string, listener?: (detail: T) => void): void {
    if (listener) {
      const handler: EventListener = (event) => {
        listener((event as CustomEvent<T>).detail);
      };
      this.target.removeEventListener(type, handler);
    }
  }

  once(type: string, listener: (detail: T) => void): void {
    const handler: EventListener = (event) => {
      this.target.removeEventListener(type, handler);
      listener((event as CustomEvent<T>).detail);
    };
    this.target.addEventListener(type, handler);
  }
}

export class EventBus<TEventMap extends Record<string, unknown> = Record<string, unknown>> extends EventEmitter<TEventMap> {
  private static instances: Map<string, EventBus> = new Map();
  private name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  static getInstance<T extends Record<string, unknown> = Record<string, unknown>>(name: string): EventBus<T> {
    if (!EventBus.instances.has(name)) {
      EventBus.instances.set(name, new EventBus(name) as EventBus<Record<string, unknown>>);
    }
    return EventBus.instances.get(name) as EventBus<T>;
  }

  static removeInstance(name: string): void {
    const instance = EventBus.instances.get(name);
    if (instance) {
      instance.clear();
      EventBus.instances.delete(name);
    }
  }

  static clearAll(): void {
    for (const instance of EventBus.instances.values()) {
      instance.clear();
    }
    EventBus.instances.clear();
  }

  getName(): string {
    return this.name;
  }
}

export interface EventThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export class ThrottledEvent<T> {
  private lastArgs: T | null = null;
  private lastTime = 0;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private handler: (args: T) => void,
    private wait: number,
    private options: EventThrottleOptions = { leading: true, trailing: true }
  ) {}

  emit(args: T): void {
    const now = Date.now();
    const timeSinceLast = now - this.lastTime;

    if (timeSinceLast >= this.wait) {
      if (this.options.leading) {
        this.handler(args);
        this.lastTime = now;
      } else {
        this.lastArgs = args;
        this.lastTime = now;
      }
    } else {
      this.lastArgs = args;

      if (this.options.trailing && !this.timeoutId) {
        this.timeoutId = setTimeout(() => {
          if (this.lastArgs !== null) {
            this.handler(this.lastArgs);
          }
          this.lastTime = Date.now();
          this.timeoutId = null;
        }, this.wait - timeSinceLast);
      }
    }
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.lastArgs = null;
  }
}

export class DebouncedEvent<T> {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private handler: (args: T) => void,
    private wait: number,
    private immediate = false
  ) {}

  emit(args: T): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    if (this.immediate && !this.timeoutId) {
      this.handler(args);
    }

    this.timeoutId = setTimeout(() => {
      if (!this.immediate) {
        this.handler(args);
      }
      this.timeoutId = null;
    }, this.wait);
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

export function createEventEmitter<TEventMap extends Record<string, unknown> = Record<string, unknown>>(): EventEmitter<TEventMap> {
  return new EventEmitter<TEventMap>();
}

export function createEventBus<T extends Record<string, unknown>>(name: string): EventBus<T> {
  return EventBus.getInstance<T>(name);
}
