export class EventEmitter<T = unknown> {
  private events: Map<string, Set<(data: T) => void>> = new Map();

  on(event: string, handler: (data: T) => void): () => void {
    if (!this.events.has(event)) this.events.set(event, new Set());
    this.events.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  once(event: string, handler: (data: T) => void): () => void {
    return this.on(event, (data) => {
      handler(data);
      this.off(event, handler);
    });
  }

  off(event: string, handler: (data: T) => void): void {
    this.events.get(event)?.delete(handler);
  }

  emit(event: string, data: T): void {
    this.events.get(event)?.forEach(handler => {
      try { handler(data); } catch (e) { console.error(e); }
    });
  }

  clear(event?: string): void {
    if (event) this.events.delete(event);
    else this.events.clear();
  }
}

export class PubSub {
  private channels: Map<string, Set<(data: unknown) => void>> = new Map();

  subscribe(channel: string, handler: (data: unknown) => void): () => void {
    if (!this.channels.has(channel)) this.channels.set(channel, new Set());
    this.channels.get(channel)!.add(handler);
    return () => this.unsubscribe(channel, handler);
  }

  unsubscribe(channel: string, handler: (data: unknown) => void): void {
    this.channels.get(channel)?.delete(handler);
  }

  publish(channel: string, data: unknown): void {
    this.channels.get(channel)?.forEach(handler => {
      try { handler(data); } catch (e) { console.error(e); }
    });
  }

  clear(channel?: string): void {
    if (channel) this.channels.delete(channel);
    else this.channels.clear();
  }
}

export class Signal<T> {
  private value: T;
  private handlers: Set<(value: T) => void> = new Set();

  constructor(initial: T) {
    this.value = initial;
  }

  get(): T {
    return this.value;
  }

  set(value: T): void {
    this.value = value;
    this.handlers.forEach(h => h(value));
  }

  update(fn: (value: T) => T): void {
    this.set(fn(this.value));
  }

  subscribe(handler: (value: T) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}
