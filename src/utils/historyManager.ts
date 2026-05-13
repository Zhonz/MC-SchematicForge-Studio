export interface HistoryState<T> {
  state: T;
  timestamp: number;
  label?: string;
}

export class History<T> {
  private states: HistoryState<T>[] = [];
  private position = -1;
  private maxSize: number;
  private listeners: Set<(state: HistoryState<T>) => void> = new Set();

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  push(state: T, label?: string): this {
    if (this.position < this.states.length - 1) {
      this.states = this.states.slice(0, this.position + 1);
    }
    this.states.push({ state, timestamp: Date.now(), label });
    if (this.states.length > this.maxSize) {
      this.states.shift();
    } else {
      this.position++;
    }
    this.notify();
    return this;
  }

  undo(): HistoryState<T> | null {
    if (this.position > 0) {
      this.position--;
      const state = this.states[this.position]!;
      this.notify();
      return state;
    }
    return null;
  }

  redo(): HistoryState<T> | null {
    if (this.position < this.states.length - 1) {
      this.position++;
      const state = this.states[this.position]!;
      this.notify();
      return state;
    }
    return null;
  }

  canUndo(): boolean {
    return this.position > 0;
  }

  canRedo(): boolean {
    return this.position < this.states.length - 1;
  }

  getCurrent(): HistoryState<T> | null {
    return this.states[this.position] ?? null;
  }

  getPrevious(): HistoryState<T> | null {
    return this.states[this.position - 1] ?? null;
  }

  getNext(): HistoryState<T> | null {
    return this.states[this.position + 1] ?? null;
  }

  clear(): void {
    this.states = [];
    this.position = -1;
    this.notify();
  }

  goTo(index: number): HistoryState<T> | null {
    if (index < 0 || index >= this.states.length) return null;
    this.position = index;
    this.notify();
    return this.states[this.position]!;
  }

  getAll(): HistoryState<T>[] {
    return [...this.states];
  }

  getSize(): number {
    return this.states.length;
  }

  getPosition(): number {
    return this.position;
  }

  onChange(listener: (state: HistoryState<T>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const current = this.getCurrent();
    if (current) {
      this.listeners.forEach((listener) => listener(current));
    }
  }
}

export class UndoManager<T> {
  private history: History<T>;
  private groups: Map<string, History<T>> = new Map();

  constructor(maxSize?: number) {
    this.history = new History(maxSize);
  }

  execute(state: T, label?: string): void {
    this.history.push(state, label);
  }

  undo(): T | null {
    const state = this.history.undo();
    return state?.state ?? null;
  }

  redo(): T | null {
    const state = this.history.redo();
    return state?.state ?? null;
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  beginGroup(name: string): void {
    this.groups.set(name, new History());
  }

  endGroup(name: string): void {
    const group = this.groups.get(name);
    if (group) {
      const states = group.getAll();
      if (states.length > 0) {
        const lastState = states[states.length - 1];
        if (lastState) {
          this.history.push(lastState.state, name);
        }
      }
      this.groups.delete(name);
    }
  }

  clear(): void {
    this.history.clear();
    this.groups.clear();
  }
}
