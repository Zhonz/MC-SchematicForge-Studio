export type GridDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'center';

export interface GridPosition {
  row: number;
  col: number;
}

export interface GridCell<T> {
  value: T;
  row: number;
  col: number;
  isEdge: boolean;
  isCorner: boolean;
}

export class Grid<T = unknown> {
  private data: T[][];
  private rowCount: number;
  private colCount: number;

  constructor(rowCount: number, colCount: number, defaultValue?: T) {
    this.rowCount = rowCount;
    this.colCount = colCount;
    this.data = this.createGrid(rowCount, colCount, defaultValue);
  }

  private createGrid(rowCount: number, colCount: number, defaultValue?: T): T[][] {
    if (defaultValue !== undefined) {
      return Array(rowCount).fill(null).map(() => Array(colCount).fill(defaultValue));
    }
    return Array(rowCount).fill(null).map(() => Array(colCount).fill(undefined) as T[]);
  }

  static from2DArray<T>(array: T[][]): Grid<T> {
    const grid = new Grid<T>(array.length, array[0]?.length ?? 0);
    grid.data = array.map(row => [...row]);
    return grid;
  }

  static from1DArray<T>(array: T[], cols: number): Grid<T> {
    const rows = Math.ceil(array.length / cols);
    const grid = new Grid<T>(rows, cols);
    for (let i = 0; i < array.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      grid.data[row][col] = array[i];
    }
    return grid;
  }

  get(row: number, col: number): T | undefined {
    if (!this.inBounds(row, col)) return undefined;
    return this.data[row][col];
  }

  set(row: number, col: number, value: T): boolean {
    if (!this.inBounds(row, col)) return false;
    this.data[row][col] = value;
    return true;
  }

  inBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.rowCount && col >= 0 && col < this.colCount;
  }

  getRow(row: number): T[] {
    return this.inBounds(row, 0) ? [...this.data[row]] : [];
  }

  getCol(col: number): T[] {
    if (!this.inBounds(0, col)) return [];
    return this.data.map(row => row[col]);
  }

  setRow(row: number, values: T[]): boolean {
    if (!this.inBounds(row, 0)) return false;
    for (let col = 0; col < Math.min(values.length, this.colCount); col++) {
      this.data[row][col] = values[col];
    }
    return true;
  }

  setCol(col: number, values: T[]): boolean {
    if (!this.inBounds(0, col)) return false;
    for (let row = 0; row < Math.min(values.length, this.rowCount); row++) {
      this.data[row][col] = values[row];
    }
    return true;
  }

  getCell(row: number, col: number): GridCell<T> | null {
    if (!this.inBounds(row, col)) return null;
    return {
      value: this.data[row][col],
      row,
      col,
      isEdge: row === 0 || row === this.rowCount - 1 || col === 0 || col === this.colCount - 1,
      isCorner: (row === 0 || row === this.rowCount - 1) && (col === 0 || col === this.colCount - 1),
    };
  }

  getNeighbors(row: number, col: number, diagonal = false): GridCell<T>[] {
    const neighbors: GridCell<T>[] = [];
    const directions = diagonal
      ? [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
      : [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      const cell = this.getCell(row + dr, col + dc);
      if (cell) neighbors.push(cell);
    }

    return neighbors;
  }

  getNeighborPositions(row: number, col: number, diagonal = false): GridPosition[] {
    const positions: GridPosition[] = [];
    const directions = diagonal
      ? [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
      : [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (this.inBounds(newRow, newCol)) {
        positions.push({ row: newRow, col: newCol });
      }
    }

    return positions;
  }

  fill(value: T): this {
    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        this.data[row][col] = value;
      }
    }
    return this;
  }

  fillIf(predicate: (cell: GridCell<T>) => boolean, value: T): this {
    this.forEach(cell => {
      if (predicate(cell)) {
        this.data[cell.row][cell.col] = value;
      }
    });
    return this;
  }

  map<U>(fn: (cell: GridCell<T>) => U): Grid<U> {
    const newGrid = new Grid<U>(this.rowCount, this.colCount);
    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        const cell = this.getCell(row, col)!;
        newGrid.data[row][col] = fn(cell);
      }
    }
    return newGrid;
  }

  forEach(fn: (cell: GridCell<T>) => void): void {
    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        fn(this.getCell(row, col)!);
      }
    }
  }

  filter(predicate: (cell: GridCell<T>) => boolean): GridCell<T>[] {
    const result: GridCell<T>[] = [];
    this.forEach(cell => {
      if (predicate(cell)) result.push(cell);
    });
    return result;
  }

  find(predicate: (cell: GridCell<T>) => boolean): GridCell<T> | null {
    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        const cell = this.getCell(row, col)!;
        if (predicate(cell)) return cell;
      }
    }
    return null;
  }

  some(predicate: (cell: GridCell<T>) => boolean): boolean {
    return this.find(predicate) !== null;
  }

  every(predicate: (cell: GridCell<T>) => boolean): boolean {
    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        if (!predicate(this.getCell(row, col)!)) return false;
      }
    }
    return true;
  }

  transpose(): Grid<T> {
    const newGrid = new Grid<T>(this.colCount, this.rowCount);
    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        newGrid.data[col][row] = this.data[row][col];
      }
    }
    return newGrid;
  }

  rotate(direction: 'cw' | 'ccw' | 180): Grid<T> {
    const rotations = direction === 'cw' ? 1 : direction === 'ccw' ? 3 : 2;
    let result: Grid<T> = this.clone();
    for (let i = 0; i < rotations; i++) {
      result = result.transpose();
      const transposed = result.to2DArray().map(row => [...row].reverse());
      result = Grid.from2DArray(transposed);
    }
    return result;
  }

  flip(horizontal: boolean): Grid<T> {
    const newGrid = new Grid<T>(this.rowCount, this.colCount);
    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        const newCol = horizontal ? this.colCount - 1 - col : col;
        const newRow = horizontal ? row : this.rowCount - 1 - row;
        newGrid.data[newRow][newCol] = this.data[row][col];
      }
    }
    return newGrid;
  }

  clone(): Grid<T> {
    const newGrid = new Grid<T>(this.rowCount, this.colCount);
    for (let row = 0; row < this.rowCount; row++) {
      newGrid.data[row] = [...this.data[row]];
    }
    return newGrid;
  }

  slice(rowStart: number, rowEnd: number, colStart: number, colEnd: number): Grid<T> {
    const newRowCount = Math.max(0, rowEnd - rowStart);
    const newColCount = Math.max(0, colEnd - colStart);
    const newGrid = new Grid<T>(newRowCount, newColCount);

    for (let row = 0; row < newRowCount; row++) {
      for (let col = 0; col < newColCount; col++) {
        const sourceRow = rowStart + row;
        const sourceCol = colStart + col;
        if (this.inBounds(sourceRow, sourceCol)) {
          newGrid.data[row][col] = this.data[sourceRow][sourceCol];
        }
      }
    }

    return newGrid;
  }

  concat(grid: Grid<T>, direction: 'horizontal' | 'vertical'): Grid<T> {
    if (direction === 'horizontal') {
      if (this.rowCount !== grid.rowCount) {
        throw new Error('Row counts must match for horizontal concatenation');
      }
      const newGrid = new Grid<T>(this.rowCount, this.colCount + grid.colCount);
      for (let row = 0; row < this.rowCount; row++) {
        for (let col = 0; col < this.colCount; col++) {
          newGrid.data[row][col] = this.data[row][col];
        }
        for (let col = 0; col < grid.colCount; col++) {
          newGrid.data[row][this.colCount + col] = grid.data[row][col];
        }
      }
      return newGrid;
    } else {
      if (this.colCount !== grid.colCount) {
        throw new Error('Column counts must match for vertical concatenation');
      }
      const newGrid = new Grid<T>(this.rowCount + grid.rowCount, this.colCount);
      for (let row = 0; row < this.rowCount; row++) {
        newGrid.data[row] = [...this.data[row]];
      }
      for (let row = 0; row < grid.rowCount; row++) {
        newGrid.data[this.rowCount + row] = [...grid.data[row]];
      }
      return newGrid;
    }
  }

  to1DArray(): T[] {
    return this.data.flat();
  }

  to2DArray(): T[][] {
    return this.data.map(row => [...row]);
  }

  get rows(): number {
    return this.rowCount;
  }

  get cols(): number {
    return this.colCount;
  }

  get size(): number {
    return this.rowCount * this.colCount;
  }

  get isEmpty(): boolean {
    return this.rowCount === 0 || this.colCount === 0;
  }

  private from(data: T[][]): this {
    this.data = data;
    this.rowCount = data.length;
    this.colCount = data[0]?.length ?? 0;
    return this;
  }
}

export const grid = {
  create: <T>(rows: number, cols: number, defaultValue?: T) => new Grid(rows, cols, defaultValue),
  from2D: <T>(array: T[][]) => Grid.from2DArray(array),
  from1D: <T>(array: T[], cols: number) => Grid.from1DArray(array, cols),
};
