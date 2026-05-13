export type OperationType = 'set' | 'add' | 'remove' | 'toggle';
export type HistoryMode = 'undo' | 'redo' | 'both';

export interface HistoryEntry<T = unknown> {
  id: string;
  timestamp: number;
  description: string;
  previousState: T;
  nextState: T;
  operation: OperationType;
}

export interface HistoryOptions {
  maxSize?: number;
  onChange?: (history: HistoryEntry[]) => void;
  debounce?: number;
}

export class History<T = unknown> {
  private past: HistoryEntry<T>[] = [];
  private future: HistoryEntry<T>[] = [];
  private maxSize: number;
  private onChange?: (history: HistoryEntry<T>[]) => void;
  private debounceTimer?: ReturnType<typeof setTimeout>;
  private debounceMs: number;
  private idCounter = 0;

  constructor(options: HistoryOptions = {}) {
    this.maxSize = options.maxSize ?? 100;
    this.onChange = options.onChange;
    this.debounceMs = options.debounce ?? 0;
  }

  push(description: string, previousState: T, nextState: T, operation: OperationType = 'set'): void {
    const entry: HistoryEntry<T> = {
      id: `h${++this.idCounter}`,
      timestamp: Date.now(),
      description,
      previousState: this.clone(previousState),
      nextState: this.clone(nextState),
      operation,
    };

    this.past.push(entry);

    if (this.past.length > this.maxSize) {
      this.past.shift();
    }

    this.future = [];

    this.notify();
  }

  undo(): HistoryEntry<T> | null {
    if (this.past.length === 0) return null;

    const entry = this.past.pop()!;
    this.future.unshift(entry);

    this.notify();
    return entry;
  }

  redo(): HistoryEntry<T> | null {
    if (this.future.length === 0) return null;

    const entry = this.future.shift()!;
    this.past.push(entry);

    this.notify();
    return entry;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  getUndoEntry(): HistoryEntry<T> | null {
    return this.past[this.past.length - 1] ?? null;
  }

  getRedoEntry(): HistoryEntry<T> | null {
    return this.future[0] ?? null;
  }

  getHistory(mode: HistoryMode = 'both'): HistoryEntry<T>[] {
    switch (mode) {
      case 'undo':
        return [...this.past];
      case 'redo':
        return [...this.future];
      case 'both':
        return [...this.past, ...this.future];
    }
  }

  clear(): void {
    this.past = [];
    this.future = [];
    this.notify();
  }

  getSize(): { undo: number; redo: number; total: number } {
    return {
      undo: this.past.length,
      redo: this.future.length,
      total: this.past.length + this.future.length,
    };
  }

  getLastEntry(): HistoryEntry<T> | null {
    return this.past[this.past.length - 1] ?? null;
  }

  getFirstEntry(): HistoryEntry<T> | null {
    return this.past[0] ?? null;
  }

  private clone<T>(state: T): T {
    if (state === null || state === undefined) return state;
    if (typeof state === 'object') {
      return JSON.parse(JSON.stringify(state)) as T;
    }
    return state;
  }

  private notify(): void {
    if (!this.onChange) return;

    if (this.debounceMs > 0) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.onChange?.([...this.past]);
      }, this.debounceMs);
    } else {
      this.onChange([...this.past]);
    }
  }

  compress(keepFirst = true, keepLast = true): number {
    const removed = this.past.length;
    if (keepFirst && this.past.length > 1) {
      const first = this.past.shift()!;
      this.past = [first];
      if (keepLast) {
        this.past.push(...this.past.slice(-1));
      }
    }
    return removed - this.past.length;
  }

  filter(predicate: (entry: HistoryEntry<T>) => boolean): number {
    const originalLength = this.past.length;
    this.past = this.past.filter(predicate);
    this.future = [];
    this.notify();
    return originalLength - this.past.length;
  }

  search(query: string): HistoryEntry<T>[] {
    const lowerQuery = query.toLowerCase();
    return this.past.filter(entry =>
      entry.description.toLowerCase().includes(lowerQuery)
    );
  }

  export(): string {
    return JSON.stringify({
      past: this.past,
      future: this.future,
      maxSize: this.maxSize,
    }, null, 2);
  }

  import(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.past) this.past = parsed.past;
      if (parsed.future) this.future = parsed.future;
      if (parsed.maxSize) this.maxSize = parsed.maxSize;
      this.notify();
      return true;
    } catch {
      return false;
    }
  }
}

export class CommandHistory<T = unknown> extends History<T> {
  private commands: Map<string, () => void> = new Map();

  registerCommand(id: string, execute: () => void): void {
    this.commands.set(id, execute);
  }

  executeCommand(id: string): boolean {
    const command = this.commands.get(id);
    if (command) {
      command();
      return true;
    }
    return false;
  }

  getCommand(id: string): (() => void) | undefined {
    return this.commands.get(id);
  }

  listCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}

export class Transaction<T = unknown> {
  private history: History<T>;
  private started = false;
  private states: { prev: T; next: T }[] = [];
  private description: string;
  private operation: OperationType;

  constructor(history: History<T>, description: string, operation: OperationType = 'set') {
    this.history = history;
    this.description = description;
    this.operation = operation;
  }

  start(currentState: T): void {
    if (this.started) return;
    this.started = true;
    this.states.push({ prev: currentState, next: currentState });
  }

  update(state: T): void {
    if (!this.started) return;
    this.states[this.states.length - 1].next = state;
  }

  commit(finalState: T): void {
    if (!this.started) return;
    this.states[this.states.length - 1].next = finalState;
    const first = this.states[0];
    const last = this.states[this.states.length - 1];
    this.history.push(this.description, first.prev, last.next, this.operation);
  }

  rollback(): void {
    this.states = [];
    this.started = false;
  }

  get isStarted(): boolean {
    return this.started;
  }

  get updateCount(): number {
    return this.states.length;
  }
}
