export interface EventEmitter {
  on(event: string, handler: (...args: unknown[]) => void): () => void;
  off(event: string, handler?: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
  once(event: string, handler: (...args: unknown[]) => void): () => void;
  clear(event?: string): void;
}

export function createEventEmitter(): EventEmitter {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();

  return {
    on(event: string, handler: (...args: unknown[]) => void): () => void {
      if (!handlers.has(event)) {
        handlers.set(event, new Set());
      }
      handlers.get(event)!.add(handler);
      return () => this.off(event, handler);
    },

    off(event: string, handler?: (...args: unknown[]) => void): void {
      if (handler) {
        handlers.get(event)?.delete(handler);
      } else {
        handlers.delete(event);
      }
    },

    emit(event: string, ...args: unknown[]): void {
      handlers.get(event)?.forEach((handler) => handler(...args));
    },

    once(event: string, handler: (...args: unknown[]) => void): () => void {
      const wrapped = (...args: unknown[]) => {
        handler(...args);
        handlers.get(event)?.delete(wrapped);
      };
      return this.on(event, wrapped);
    },

    clear(event?: string): void {
      if (event) {
        handlers.delete(event);
      } else {
        handlers.clear();
      }
    },
  };
}

export class PubSub {
  private channels = new Map<string, Set<(...args: unknown[]) => void>>();

  subscribe(channel: string, handler: (...args: unknown[]) => void): () => void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(handler);
    return () => this.unsubscribe(channel, handler);
  }

  unsubscribe(channel: string, handler: (...args: unknown[]) => void): void {
    this.channels.get(channel)?.delete(handler);
  }

  publish(channel: string, ...args: unknown[]): void {
    this.channels.get(channel)?.forEach((handler) => handler(...args));
  }

  hasChannel(channel: string): boolean {
    return (this.channels.get(channel)?.size ?? 0) > 0;
  }

  clearChannel(channel: string): void {
    this.channels.delete(channel);
  }

  clear(): void {
    this.channels.clear();
  }
}

export const pubsub = new PubSub();
