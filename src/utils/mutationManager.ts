export type MutationType = 'create' | 'update' | 'delete' | 'move' | 'copy' | 'batch'

export interface Mutation<T = unknown> {
  id: string
  type: MutationType
  timestamp: number
  data: T
  previousData?: T
  metadata?: Record<string, unknown>
}

export interface MutationOptions<T = unknown> {
  maxHistory?: number
  onMutation?: (mutation: Mutation<T>) => void
  onUndo?: (mutation: Mutation<T>) => void
  onRedo?: (mutation: Mutation<T>) => void
  validate?: (mutation: Mutation<T>) => boolean
}

export class MutationManager<T = unknown> {
  private history: Mutation<T>[] = []
  private future: Mutation<T>[] = []
  private options: Required<MutationOptions<T>>
  private listeners: Map<string, Set<(mutation: Mutation<T>) => void>> = new Map()

  constructor(options: MutationOptions<T> = {}) {
    this.options = {
      maxHistory: options.maxHistory || 100,
      onMutation: options.onMutation || (() => {}),
      onUndo: options.onUndo || (() => {}),
      onRedo: options.onRedo || (() => {}),
      validate: options.validate || (() => true)
    }
  }

  record(type: MutationType, data: T, previousData?: T, metadata?: Record<string, unknown>): Mutation<T> {
    const mutation: Mutation<T> = {
      id: this.generateId(),
      type,
      timestamp: Date.now(),
      data,
      previousData,
      metadata
    }

    if (!this.options.validate(mutation)) {
      throw new Error('Mutation validation failed')
    }

    this.history.push(mutation)

    if (this.history.length > this.options.maxHistory) {
      this.history.shift()
    }

    this.future = []
    this.options.onMutation(mutation)
    this.notifyListeners('mutation', mutation)

    return mutation
  }

  create(data: T, metadata?: Record<string, unknown>): Mutation<T> {
    return this.record('create', data, undefined, metadata)
  }

  update(data: T, previousData: T, metadata?: Record<string, unknown>): Mutation<T> {
    return this.record('update', data, previousData, metadata)
  }

  delete(data: T, previousData: T, metadata?: Record<string, unknown>): Mutation<T> {
    return this.record('delete', data, previousData, metadata)
  }

  move(data: T, previousData: T, metadata?: Record<string, unknown>): Mutation<T> {
    return this.record('move', data, previousData, metadata)
  }

  copy(data: T, previousData: T, metadata?: Record<string, unknown>): Mutation<T> {
    return this.record('copy', data, previousData, metadata)
  }

  batch(mutations: Mutation<T>[], metadata?: Record<string, unknown>): Mutation<T> {
    return this.record('batch', mutations as unknown as T, undefined, { mutations, ...metadata })
  }

  undo(): Mutation<T> | null {
    const mutation = this.history.pop()
    if (!mutation) return null

    this.future.push(mutation)
    this.options.onUndo(mutation)
    this.notifyListeners('undo', mutation)

    return mutation
  }

  redo(): Mutation<T> | null {
    const mutation = this.future.pop()
    if (!mutation) return null

    this.history.push(mutation)
    this.options.onRedo(mutation)
    this.notifyListeners('redo', mutation)

    return mutation
  }

  canUndo(): boolean {
    return this.history.length > 0
  }

  canRedo(): boolean {
    return this.future.length > 0
  }

  getHistory(): Mutation<T>[] {
    return [...this.history]
  }

  getFuture(): Mutation<T>[] {
    return [...this.future]
  }

  getLastMutation(): Mutation<T> | undefined {
    return this.history[this.history.length - 1]
  }

  getMutation(id: string): Mutation<T> | undefined {
    return this.history.find(m => m.id === id) || this.future.find(m => m.id === id)
  }

  clear(): void {
    this.history = []
    this.future = []
    this.notifyListeners('clear', {} as Mutation<T>)
  }

  subscribe(event: 'mutation' | 'undo' | 'redo' | 'clear', listener: (mutation: Mutation<T>) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)

    return () => {
      this.listeners.get(event)?.delete(listener)
    }
  }

  private notifyListeners(event: string, mutation: Mutation<T>): void {
    this.listeners.get(event)?.forEach(listener => listener(mutation))
  }

  private generateId(): string {
    return `mut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  export(): string {
    return JSON.stringify({
      history: this.history,
      future: this.future
    })
  }

  import(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      this.history = parsed.history || []
      this.future = parsed.future || []
      return true
    } catch {
      return false
    }
  }
}

export function createMutationManager<T>(options?: MutationOptions<T>): MutationManager<T> {
  return new MutationManager(options)
}

export const mutationManager = createMutationManager()
