export type Operation = 'insert' | 'delete' | 'retain';

export interface EditAction {
  operation: Operation;
  count: number;
}

export class EditBuffer {
  private actions: EditAction[] = [];

  insert(count: number): this {
    this.actions.push({ operation: 'insert', count });
    return this;
  }

  delete(count: number): this {
    this.actions.push({ operation: 'delete', count });
    return this;
  }

  retain(count: number): this {
    this.actions.push({ operation: 'retain', count });
    return this;
  }

  getActions(): EditAction[] {
    return [...this.actions];
  }

  applyToLength(length: number): number {
    let result = length;
    for (const action of this.actions) {
      switch (action.operation) {
        case 'insert':
          result += action.count;
          break;
        case 'delete':
          result -= action.count;
          break;
        case 'retain':
          break;
      }
    }
    return Math.max(0, result);
  }

  invert(): EditBuffer {
    const inverted = new EditBuffer();
    for (const action of [...this.actions].reverse()) {
      switch (action.operation) {
        case 'insert':
          inverted.delete(action.count);
          break;
        case 'delete':
          inverted.insert(action.count);
          break;
        case 'retain':
          inverted.retain(action.count);
          break;
      }
    }
    return inverted;
  }

  compose(other: EditBuffer): EditBuffer {
    const composed = new EditBuffer();
    const all = [...this.actions, ...other.getActions()];
    for (const action of all) {
      switch (action.operation) {
        case 'insert':
          composed.insert(action.count);
          break;
        case 'delete':
          composed.delete(action.count);
          break;
        case 'retain':
          composed.retain(action.count);
          break;
      }
    }
    return composed;
  }

  clear(): void {
    this.actions = [];
  }
}
