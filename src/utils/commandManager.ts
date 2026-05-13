export interface Command {
  id: string;
  name: string;
  execute: () => unknown;
  undo: () => unknown;
  redo?: () => unknown;
  metadata?: Record<string, unknown>;
}

export class CommandManager2 {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxStackSize: number;
  private listeners: Set<(type: 'execute' | 'undo' | 'redo', command: Command) => void> = new Set();

  constructor(maxStackSize: number = 100) {
    this.maxStackSize = maxStackSize;
  }

  execute(command: Command): unknown {
    const result = command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.notify('execute', command);
    return result;
  }

  undo(): unknown {
    const command = this.undoStack.pop();
    if (!command) return undefined;
    const result = command.undo();
    this.redoStack.push(command);
    this.notify('undo', command);
    return result;
  }

  redo(): unknown {
    const command = this.redoStack.pop();
    if (!command) return undefined;
    const result = command.redo ? command.redo() : command.execute();
    this.undoStack.push(command);
    this.notify('redo', command);
    return result;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  getUndoStack(): Command[] {
    return [...this.undoStack];
  }

  getRedoStack(): Command[] {
    return [...this.redoStack];
  }

  onChange(listener: (type: 'execute' | 'undo' | 'redo', command: Command) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(type: 'execute' | 'undo' | 'redo', command: Command): void {
    this.listeners.forEach((listener) => listener(type, command));
  }
}

export function createCommand(
  id: string,
  name: string,
  execute: () => unknown,
  undo: () => unknown,
  redo?: () => unknown
): Command {
  return { id, name, execute, undo, redo };
}

export class MacroCommand implements Command {
  id: string;
  name: string;
  commands: Command[];
  metadata?: Record<string, unknown>;

  constructor(id: string, name: string, commands: Command[]) {
    this.id = id;
    this.name = name;
    this.commands = commands;
  }

  execute(): unknown {
    return this.commands.map((cmd) => cmd.execute());
  }

  undo(): unknown {
    return [...this.commands].reverse().map((cmd) => cmd.undo());
  }

  redo?(): unknown {
    return this.commands.map((cmd) => (cmd.redo ? cmd.redo() : cmd.execute()));
  }
}
