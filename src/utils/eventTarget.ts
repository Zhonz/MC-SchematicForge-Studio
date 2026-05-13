export class EventTarget<T = unknown> {
  private listeners: Map<string, Set<(data: T) => void>> = new Map();

  on(event: string, listener: (data: T) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  }

  off(event: string, listener?: (data: T) => void): this {
    if (listener) {
      this.listeners.get(event)?.delete(listener);
    } else {
      this.listeners.delete(event);
    }
    return this;
  }

  once(event: string, listener: (data: T) => void): this {
    const onceListener = (data: T) => {
      listener(data);
      this.off(event, onceListener);
    };
    return this.on(event, onceListener);
  }

  emit(event: string, data: T): this {
    this.listeners.get(event)?.forEach((listener) => listener(data));
    return this;
  }

  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event?: string): number {
    if (event) {
      return this.listeners.get(event)?.size ?? 0;
    }
    let count = 0;
    this.listeners.forEach((listeners) => (count += listeners.size));
    return count;
  }

  hasListeners(event?: string): boolean {
    if (event) {
      return (this.listeners.get(event)?.size ?? 0) > 0;
    }
    return this.listeners.size > 0;
  }
}

export class EventEmitter<T = unknown> {
  private events: Map<string, Array<{ listener: (data: T) => void; once?: boolean }>> = new Map();
  private maxListeners = 10;

  on(event: string, listener: (data: T) => void): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    const listeners = this.events.get(event)!;
    if (listeners.length >= this.maxListeners) {
      console.warn(`Warning: Possible EventEmitter memory leak. ${event} has ${listeners.length + 1} listeners.`);
    }
    listeners.push({ listener });
    return this;
  }

  once(event: string, listener: (data: T) => void): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push({ listener, once: true });
    return this;
  }

  off(event: string, listener?: (data: T) => void): this {
    if (!listener) {
      this.events.delete(event);
    } else {
      const listeners = this.events.get(event);
      if (listeners) {
        const filtered = listeners.filter((l) => l.listener !== listener);
        if (filtered.length === 0) {
          this.events.delete(event);
        } else {
          this.events.set(event, filtered);
        }
      }
    }
    return this;
  }

  emit(event: string, data: T): boolean {
    const listeners = this.events.get(event);
    if (!listeners || listeners.length === 0) return false;
    const toRemove: number[] = [];
    listeners.forEach((item, index) => {
      item.listener(data);
      if (item.once) toRemove.push(index);
    });
    if (toRemove.length > 0) {
      this.events.set(
        event,
        listeners.filter((_, i) => !toRemove.includes(i))
      );
    }
    return true;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  setMaxListeners(n: number): this {
    this.maxListeners = n;
    return this;
  }

  listenerCount(event?: string): number {
    if (event) {
      return this.events.get(event)?.length ?? 0;
    }
    let count = 0;
    this.events.forEach((listeners) => (count += listeners.length));
    return count;
  }

  eventNames(): string[] {
    return Array.from(this.events.keys());
  }

  listeners(event: string): Array<(data: T) => void> {
    return (this.events.get(event) ?? []).map((item) => item.listener);
  }
}
