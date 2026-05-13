export type PubSubEventType = string | symbol;

export interface PubSubOptions {
  once?: boolean;
  priority?: number;
  async?: boolean;
}

export interface Subscription<T = unknown> {
  unsubscribe: () => void;
  eventType: PubSubEventType;
  listener: (data: T) => void;
}

export class PubSub<TEventMap extends Record<string, unknown> = Record<string, unknown>> {
  protected listeners: Map<PubSubEventType, Set<{ listener: (data: unknown) => void; options: PubSubOptions }>> = new Map();
  private wildcardListeners: Array<{ pattern: RegExp; listener: (type: string, data: unknown) => void; options: PubSubOptions }> = [];
  private subscriptionCounter = 0;

  subscribe<K extends keyof TEventMap>(
    eventType: K,
    listener: (data: TEventMap[K]) => void,
    options: PubSubOptions = {}
  ): Subscription<TEventMap[K]> {
    const listeners = this.listeners;

    if (options.once) {
      const onceWrapper = (data: unknown) => {
        listener(data as TEventMap[K]);
        this.unsubscribe(eventType as PubSubEventType, onceWrapper);
      };
      
      if (!listeners.has(eventType as PubSubEventType)) {
        listeners.set(eventType as PubSubEventType, new Set());
      }
      listeners.get(eventType as PubSubEventType)!.add({ listener: onceWrapper, options });

      this.subscriptionCounter++;

      return {
        unsubscribe: () => this.unsubscribe(eventType as PubSubEventType, onceWrapper),
        eventType: eventType as PubSubEventType,
        listener: onceWrapper as (data: TEventMap[K]) => void,
      };
    }

    if (!listeners.has(eventType as PubSubEventType)) {
      listeners.set(eventType as PubSubEventType, new Set());
    }
    listeners.get(eventType as PubSubEventType)!.add({ listener: listener as (data: unknown) => void, options });

    this.subscriptionCounter++;

    return {
      unsubscribe: () => this.unsubscribe(eventType as PubSubEventType, listener as (data: unknown) => void),
      eventType: eventType as PubSubEventType,
      listener,
    };
  }

  unsubscribe(eventType: PubSubEventType, listener?: (data: unknown) => void): void {
    if (listener) {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        for (const entry of listeners) {
          if (entry.listener === listener) {
            listeners.delete(entry);
            break;
          }
        }
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    } else {
      this.listeners.delete(eventType);
    }
  }

  async publish<K extends keyof TEventMap>(eventType: K, data: TEventMap[K]): Promise<void> {
    const listeners = this.listeners.get(eventType as PubSubEventType);
    if (!listeners || listeners.size === 0) return;

    const promises: Promise<void>[] = [];

    for (const { listener, options } of listeners) {
      const invoke = async () => {
        if (options.async) {
          await listener(data);
        } else {
          listener(data);
        }
      };
      promises.push(invoke());
    }

    await Promise.all(promises);
  }

  emit<K extends keyof TEventMap>(eventType: K, data: TEventMap[K]): void {
    this.publish(eventType, data);
  }

  subscribeWildcard(pattern: RegExp, listener: (type: string, data: unknown) => void, options: PubSubOptions = {}): Subscription {
    this.wildcardListeners.push({ pattern, listener, options });

    const wrappedListener = (data: unknown) => {
      listener(pattern.toString(), data);
    };

    return {
      unsubscribe: () => {
        const index = this.wildcardListeners.findIndex(w => w.listener === listener);
        if (index !== -1) {
          this.wildcardListeners.splice(index, 1);
        }
      },
      eventType: pattern as unknown as PubSubEventType,
      listener: wrappedListener,
    };
  }

  once<K extends keyof TEventMap>(eventType: K, listener: (data: TEventMap[K]) => void): Subscription<TEventMap[K]> {
    return this.subscribe(eventType, listener, { once: true });
  }

  hasSubscribers(eventType: PubSubEventType): boolean {
    const listeners = this.listeners.get(eventType);
    return listeners !== undefined && listeners.size > 0;
  }

  getSubscriberCount(eventType: PubSubEventType): number {
    const listeners = this.listeners.get(eventType);
    return listeners?.size ?? 0;
  }

  clear(): void {
    this.listeners.clear();
    this.wildcardListeners = [];
  }
}

export class AsyncPubSub<TEventMap extends Record<string, unknown> = Record<string, unknown>> extends PubSub<TEventMap> {
  async publish<K extends keyof TEventMap>(eventType: K, data: TEventMap[K]): Promise<void> {
    const listeners = this.listeners.get(eventType as PubSubEventType);
    if (!listeners || listeners.size === 0) return;

    await Promise.all(
      Array.from(listeners).map(async ({ listener }) => {
        await listener(data);
      })
    );
  }
}

export class BufferedPubSub<TEventMap extends Record<string, unknown> = Record<string, unknown>> extends PubSub<TEventMap> {
  private buffer: Map<PubSubEventType, unknown[]> = new Map();
  private bufferSize: number;
  private flushInterval: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(bufferSize = 100, flushInterval = 1000) {
    super();
    this.bufferSize = bufferSize;
    this.flushInterval = flushInterval;
  }

  async publish<K extends keyof TEventMap>(eventType: K, data: TEventMap[K]): Promise<void> {
    if (!this.buffer.has(eventType as PubSubEventType)) {
      this.buffer.set(eventType as PubSubEventType, []);
    }

    const events = this.buffer.get(eventType as PubSubEventType)!;
    events.push(data);

    if (events.length >= this.bufferSize) {
      this.flushEvent(eventType as PubSubEventType);
    }
  }

  startAutoFlush(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.flushAll(), this.flushInterval);
  }

  stopAutoFlush(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  flushEvent(eventType: PubSubEventType): void {
    const events = this.buffer.get(eventType);
    if (!events || events.length === 0) return;

    for (const data of events) {
      super.publish(eventType as keyof TEventMap, data as TEventMap[keyof TEventMap]);
    }

    this.buffer.set(eventType, []);
  }

  flushAll(): void {
    for (const eventType of this.buffer.keys()) {
      this.flushEvent(eventType);
    }
  }
}

export function createPubSub<TEventMap extends Record<string, unknown> = Record<string, unknown>>(): PubSub<TEventMap> {
  return new PubSub<TEventMap>();
}

export function createAsyncPubSub<TEventMap extends Record<string, unknown> = Record<string, unknown>>(): AsyncPubSub<TEventMap> {
  return new AsyncPubSub<TEventMap>();
}

export function createBufferedPubSub<TEventMap extends Record<string, unknown> = Record<string, unknown>>(
  bufferSize?: number,
  flushInterval?: number
): BufferedPubSub<TEventMap> {
  return new BufferedPubSub<TEventMap>(bufferSize, flushInterval);
}
