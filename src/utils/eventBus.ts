export type EventHandler<T = unknown> = (payload: T) => void;
export type AsyncEventHandler<T = unknown> = (payload: T) => Promise<void>;

export interface EventBusOptions {
  wildcard?: boolean;
  newListener?: boolean;
  maxListeners?: number;
}

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private wildcardHandlers: EventHandler[] = [];
  private options: EventBusOptions;
  private listenerCount = 0;

  constructor(options: EventBusOptions = {}) {
    this.options = {
      wildcard: false,
      newListener: false,
      maxListeners: 10,
      ...options
    };
  }

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler as EventHandler);
    this.handlers.set(event, handlers);
    this.listenerCount++;

    if (this.options.newListener) {
      this.emit('newListener', { event, handler });
    }

    if (this.options.maxListeners && this.listenerCount > this.options.maxListeners) {
      console.warn(`Possible EventEmitter memory leak detected. ${this.listenerCount} listeners added.`);
    }

    return () => this.off(event, handler);
  }

  once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = (payload) => {
      handler(payload);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler as EventHandler);
      if (index > -1) {
        handlers.splice(index, 1);
        this.listenerCount--;
      }
      if (handlers.length === 0) {
        this.handlers.delete(event);
      }
    }
  }

  emit<T = unknown>(event: string, payload?: T): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload as T);
        } catch (err) {
          console.error(`Error in event handler for '${event}':`, err);
        }
      }
    }

    if (this.options.wildcard) {
      for (const handler of this.wildcardHandlers) {
        try {
          handler({ event, payload });
        } catch (err) {
          console.error(`Error in wildcard event handler:`, err);
        }
      }
    }
  }

  onWildcard<T = unknown>(handler: EventHandler<{ event: string; payload: T }>): () => void {
    this.wildcardHandlers.push(handler as EventHandler);
    return () => {
      const index = this.wildcardHandlers.indexOf(handler as EventHandler);
      if (index > -1) this.wildcardHandlers.splice(index, 1);
    };
  }

  removeAllListeners(event?: string): void {
    if (event) {
      const count = this.handlers.get(event)?.length || 0;
      this.handlers.delete(event);
      this.listenerCount -= count;
    } else {
      this.handlers.clear();
      this.wildcardHandlers = [];
      this.listenerCount = 0;
    }
  }

  listenerCountFor(event?: string): number {
    if (event) {
      return this.handlers.get(event)?.length || 0;
    }
    return this.listenerCount;
  }

  eventNames(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const globalEventBus = new EventBus();

export function createEventBus(options?: EventBusOptions): EventBus {
  return new EventBus(options);
}

export class TypedEventBus<Events extends Record<string, unknown>> {
  private bus: EventBus;

  constructor(options?: EventBusOptions) {
    this.bus = new EventBus(options);
  }

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    return this.bus.on(String(event), handler as EventHandler);
  }

  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    return this.bus.once(String(event), handler as EventHandler);
  }

  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    this.bus.off(String(event), handler as EventHandler);
  }

  emit<K extends keyof Events>(event: K, payload?: Events[K]): void {
    this.bus.emit(String(event), payload);
  }

  removeAllListeners(): void {
    this.bus.removeAllListeners();
  }
}

export class EventChannel<T = unknown> {
  private handlers: Array<{
    filter?: (payload: T) => boolean;
    handler: EventHandler<T>;
  }> = [];

  subscribe(handler: EventHandler<T>, filter?: (payload: T) => boolean): () => void {
    const entry = { handler, filter };
    this.handlers.push(entry);
    return () => {
      const index = this.handlers.indexOf(entry);
      if (index > -1) this.handlers.splice(index, 1);
    };
  }

  publish(payload: T): void {
    for (const entry of this.handlers) {
      if (!entry.filter || entry.filter(payload)) {
        try {
          entry.handler(payload);
        } catch (err) {
          console.error('Error in channel handler:', err);
        }
      }
    }
  }

  clear(): void {
    this.handlers = [];
  }
}

export class EventBusMiddleware {
  private bus: EventBus;

  constructor() {
    this.bus = new EventBus();
  }

  use(handler: (action: unknown, next: () => void) => void): () => void {
    return this.bus.on('action', handler as EventHandler);
  }

  dispatch(action: unknown): void {
    this.bus.emit('action', action);
  }
}
