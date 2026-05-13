export type CommandHandler<T = unknown, R = unknown> = (params?: T) => R | Promise<R>;
export type UndoHandler = () => void | Promise<void>;

export interface Command<T = unknown, R = unknown> {
  name: string;
  execute: CommandHandler<T, R>;
  undo?: UndoHandler;
  redo?: CommandHandler<T, R>;
  canExecute?: () => boolean;
}

export class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private history: Array<Command> = [];
  private historyIndex = -1;
  private maxHistorySize = 100;

  register<T = unknown, R = unknown>(command: Command<T, R>): void {
    this.commands.set(command.name, command as Command);
  }

  unregister(name: string): boolean {
    return this.commands.delete(name);
  }

  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  execute<T = unknown, R = unknown>(name: string, params?: T): R | Promise<R> | undefined {
    const command = this.commands.get(name);
    if (!command) {
      throw new Error(`Command not found: ${name}`);
    }

    if (command.canExecute && !command.canExecute()) {
      throw new Error(`Command cannot execute: ${name}`);
    }

    const result = command.execute(params);

    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(command);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;

    return result as R;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    const command = this.history[this.historyIndex];
    if (command?.undo) {
      command.undo();
      this.historyIndex--;
      return true;
    }
    return false;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;

    const command = this.history[this.historyIndex + 1];
    if (command) {
      command.execute();
      this.historyIndex++;
      return true;
    }
    return false;
  }

  canUndo(): boolean {
    return this.historyIndex >= 0 && this.history[this.historyIndex]?.undo !== undefined;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
  }

  getHistory(): ReadonlyArray<Command> {
    return this.history;
  }
}

export class MacroCommand implements Command {
  name: string;
  commands: Command[] = [];
  undoHandler?: UndoHandler;

  constructor(name: string, commands: Command[] = [], undoHandler?: UndoHandler) {
    this.name = name;
    this.commands = [...commands];
    this.undoHandler = undoHandler;
  }

  execute(): void {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo(): void {
    if (this.undoHandler) {
      this.undoHandler();
    } else {
      for (let i = this.commands.length - 1; i >= 0; i--) {
        this.commands[i].undo?.();
      }
    }
  }
}

export class BatchCommand implements Command {
  name: string;
  commands: Command[] = [];

  constructor(name: string) {
    this.name = name;
  }

  add(command: Command): void {
    this.commands.push(command);
  }

  remove(command: Command): void {
    const index = this.commands.indexOf(command);
    if (index > -1) {
      this.commands.splice(index, 1);
    }
  }

  execute(): void {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo(): void {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo?.();
    }
  }
}

export const globalCommandRegistry = new CommandRegistry();

export function createCommand<T = unknown, R = unknown>(
  name: string,
  execute: CommandHandler<T, R>,
  options?: {
    undo?: UndoHandler;
    redo?: CommandHandler<T, R>;
    canExecute?: () => boolean;
  }
): Command<T, R> {
  return {
    name,
    execute,
    undo: options?.undo,
    redo: options?.redo,
    canExecute: options?.canExecute
  };
}
