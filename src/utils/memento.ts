export interface StateSnapshot<T> {
  state: T
  timestamp: number
  label?: string
}

export interface MementoHistory<T> {
  past: StateSnapshot<T>[]
  present: StateSnapshot<T>
  future: StateSnapshot<T>[]
}

export interface Command<T> {
  execute: (state: T) => T
  undo: (state: T) => T
  description: string
}

export class MementoManager<T> {
  private history: MementoHistory<T>
  private maxHistory: number
  private listeners: Array<(history: MementoHistory<T>) => void> = []

  constructor(initialState: T, maxHistory: number = 100) {
    this.maxHistory = maxHistory
    this.history = {
      past: [],
      present: { state: initialState, timestamp: Date.now() },
      future: []
    }
  }

  save(label?: string): void {
    const snapshot: StateSnapshot<T> = {
      state: this.cloneState(this.history.present.state),
      timestamp: Date.now(),
      label
    }

    this.history.past.push(snapshot)

    if (this.history.past.length > this.maxHistory) {
      this.history.past.shift()
    }

    this.history.future = []
    this.notifyListeners()
  }

  undo(): boolean {
    if (this.history.past.length === 0) {
      return false
    }

    const previous = this.history.past.pop()!
    const current: StateSnapshot<T> = {
      state: this.cloneState(this.history.present.state),
      timestamp: Date.now()
    }

    this.history.future.unshift(current)
    this.history.present = previous
    this.notifyListeners()
    return true
  }

  redo(): boolean {
    if (this.history.future.length === 0) {
      return false
    }

    const next = this.history.future.shift()!
    const current: StateSnapshot<T> = {
      state: this.cloneState(this.history.present.state),
      timestamp: Date.now()
    }

    this.history.past.push(current)
    this.history.present = next
    this.notifyListeners()
    return true
  }

  canUndo(): boolean {
    return this.history.past.length > 0
  }

  canRedo(): boolean {
    return this.history.future.length > 0
  }

  getState(): T {
    return this.history.present.state
  }

  getHistory(): MementoHistory<T> {
    return {
      past: [...this.history.past],
      present: { ...this.history.present, state: this.cloneState(this.history.present.state) },
      future: [...this.history.future]
    }
  }

  clear(): void {
    this.history.past = []
    this.history.future = []
    this.notifyListeners()
  }

  jumpTo(index: number): boolean {
    if (index < 0 || index >= this.history.past.length) {
      return false
    }

    const target = this.history.past[index]
    const current: StateSnapshot<T> = {
      state: this.cloneState(this.history.present.state),
      timestamp: Date.now()
    }

    this.history.future = [current, ...this.history.future]
    this.history.present = target
    this.history.past = this.history.past.slice(0, index)
    this.notifyListeners()
    return true
  }

  subscribe(listener: (history: MementoHistory<T>) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    const history = this.getHistory()
    this.listeners.forEach(listener => listener(history))
  }

  private cloneState(state: T): T {
    if (state instanceof Map) {
      return new Map(state) as unknown as T
    }
    if (state instanceof Set) {
      return new Set(state) as unknown as T
    }
    if (Array.isArray(state)) {
      return [...state] as unknown as T
    }
    if (typeof state === 'object' && state !== null) {
      return JSON.parse(JSON.stringify(state))
    }
    return state
  }
}

export class CommandManager<T> {
  private undoStack: Command<T>[] = []
  private redoStack: Command<T>[] = []
  private currentState: T
  private listeners: Array<(canUndo: boolean, canRedo: boolean) => void> = []

  constructor(initialState: T) {
    this.currentState = initialState
  }

  execute(command: Command<T>): void {
    this.currentState = command.execute(this.currentState)
    this.undoStack.push(command)
    this.redoStack = []
    this.notifyListeners()
  }

  undo(): boolean {
    const command = this.undoStack.pop()
    if (!command) {
      return false
    }

    this.currentState = command.undo(this.currentState)
    this.redoStack.push(command)
    this.notifyListeners()
    return true
  }

  redo(): boolean {
    const command = this.redoStack.pop()
    if (!command) {
      return false
    }

    this.currentState = command.execute(this.currentState)
    this.undoStack.push(command)
    this.notifyListeners()
    return true
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  getState(): T {
    return this.currentState
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
    this.notifyListeners()
  }

  subscribe(listener: (canUndo: boolean, canRedo: boolean) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.canUndo(), this.canRedo()))
  }
}

export function createCommand<T>(
  execute: (state: T) => T,
  undo: (state: T) => T,
  description: string
): Command<T> {
  return { execute, undo, description }
}
