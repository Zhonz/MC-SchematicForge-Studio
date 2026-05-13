export type EventName = string | symbol

export interface EventMap {
  [key: string]: unknown
}

export interface EventHandler<T = unknown> {
  (data: T): void | Promise<void>
}

export interface OnceHandler {
  handler: EventHandler
  called: boolean
}

export class EventEmitter<Events extends EventMap = EventMap> {
  private events: Map<string | symbol, Set<EventHandler>> = new Map()
  private onceHandlers: Map<string | symbol, Set<OnceHandler>> = new Map()
  private defaultHandler: EventHandler | null = null
  private isEmitting: Map<string | symbol, boolean> = new Map()

  on(event: string | symbol, handler: EventHandler): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  once(event: string | symbol, handler: EventHandler): () => void {
    if (!this.onceHandlers.has(event)) {
      this.onceHandlers.set(event, new Set())
    }

    const onceHandler: OnceHandler = { handler, called: false }
    this.onceHandlers.get(event)!.add(onceHandler)

    return () => {
      onceHandler.called = true
      this.onceHandlers.get(event)?.delete(onceHandler)
    }
  }

  off(event: string | symbol, handler?: EventHandler): void {
    if (!handler) {
      this.events.delete(event)
      this.onceHandlers.delete(event)
      return
    }

    this.events.get(event)?.delete(handler)
  }

  emit(event: string | symbol, data: unknown): void {
    this.isEmitting.set(event, true)

    const handlers = this.events.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          const result = handler(data)
          if (result instanceof Promise) {
            result.catch(error => {
              console.error(`Error in async event handler for "${String(event)}":`, error)
            })
          }
        } catch (error) {
          console.error(`Error in event handler for "${String(event)}":`, error)
        }
      })
    }

    const onceHandlers = this.onceHandlers.get(event)
    if (onceHandlers) {
      onceHandlers.forEach(onceHandler => {
        if (!onceHandler.called) {
          onceHandler.called = true
          try {
            onceHandler.handler(data)
          } catch (error) {
            console.error(`Error in once event handler for "${String(event)}":`, error)
          }
        }
      })
      onceHandlers.forEach(h => {
        if (h.called) onceHandlers.delete(h)
      })
    }

    if (this.defaultHandler) {
      this.defaultHandler(data)
    }

    this.isEmitting.set(event, false)
  }

  listenerCount(event: string | symbol): number {
    return (this.events.get(event)?.size || 0) + (this.onceHandlers.get(event)?.size || 0)
  }

  removeAllListeners(event?: string | symbol): void {
    if (event) {
      this.events.delete(event)
      this.onceHandlers.delete(event)
    } else {
      this.events.clear()
      this.onceHandlers.clear()
    }
  }

  setDefaultHandler(handler: EventHandler): void {
    this.defaultHandler = handler
  }

  getListeners(event: string | symbol): EventHandler[] {
    const handlers: EventHandler[] = []
    this.events.get(event)?.forEach(h => handlers.push(h))
    return handlers
  }

  isEmittingEvent(event: string | symbol): boolean {
    return this.isEmitting.get(event) || false
  }
}

export class PubSub<Events extends EventMap = EventMap> {
  private emitter: EventEmitter<Events>

  constructor() {
    this.emitter = new EventEmitter<Events>()
  }

  subscribe(event: string | symbol, handler: EventHandler): () => void {
    return this.emitter.on(event, handler)
  }

  unsubscribe(event: string | symbol, handler?: EventHandler): void {
    this.emitter.off(event, handler)
  }

  publish(event: string | symbol, data: unknown): void {
    this.emitter.emit(event, data)
  }

  once(event: string | symbol, handler: EventHandler): () => void {
    return this.emitter.once(event, handler)
  }

  clear(): void {
    this.emitter.removeAllListeners()
  }

  getSubscriberCount(event: string | symbol): number {
    return this.emitter.listenerCount(event)
  }
}

export const globalEvents = new EventEmitter()
