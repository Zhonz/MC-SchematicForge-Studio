export type Handler = (data?: unknown) => void;
export type Unsubscribe = () => void;

export class PubSub {
  private handlers: Map<string, Set<Handler>> = new Map();
  private history: Array<{ topic: string; data: unknown; time: number }> = [];
  private maxHistory = 100;

  subscribe(topic: string, handler: Handler): Unsubscribe {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler);
    return () => this.unsubscribe(topic, handler);
  }

  unsubscribe(topic: string, handler: Handler): boolean {
    const handlers = this.handlers.get(topic);
    if (handlers) {
      return handlers.delete(handler);
    }
    return false;
  }

  once(topic: string, handler: Handler): Unsubscribe {
    const unsubscribe = this.subscribe(topic, (data) => {
      unsubscribe();
      handler(data);
    });
    return unsubscribe;
  }

  publish(topic: string, data?: unknown): void {
    const handlers = this.handlers.get(topic);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (err) {
          console.error(`PubSub error on ${topic}:`, err);
        }
      }
    }

    this.history.push({ topic, data, time: Date.now() });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  hasTopic(topic: string): boolean {
    const handlers = this.handlers.get(topic);
    return handlers !== undefined && handlers.size > 0;
  }

  getTopics(): string[] {
    return Array.from(this.handlers.keys());
  }

  clear(): void {
    this.handlers.clear();
  }

  getHistory(topic?: string): Array<{ topic: string; data: unknown; time: number }> {
    if (topic) {
      return this.history.filter(h => h.topic === topic);
    }
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}

export const pubsub = new PubSub();
