export class ArrayUtils2 {
  static isEmpty<T>(array: T[]): boolean {
    return array.length === 0;
  }

  static isNotEmpty<T>(array: T[]): boolean {
    return array.length > 0;
  }

  static first<T>(array: T[]): T | undefined {
    return array[0];
  }

  static last<T>(array: T[]): T | undefined {
    return array[array.length - 1];
  }

  static head<T>(array: T[]): T | undefined {
    return this.first(array);
  }

  static tail<T>(array: T[]): T[] {
    return array.slice(1);
  }

  static init<T>(array: T[]): T[] {
    return array.slice(0, -1);
  }

  static append<T>(array: T[], item: T): T[] {
    return [...array, item];
  }

  static prepend<T>(array: T[], item: T): T[] {
    return [item, ...array];
  }

  static concat<T>(array: T[], ...arrays: T[][]): T[] {
    return [...array, ...arrays.flat()];
  }

  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  static uniqueBy<T>(array: T[], keyFn: (item: T) => unknown): T[] {
    const seen = new Set<unknown>();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  static duplicate<T>(array: T[]): T[] {
    return array.filter((item, index) => array.indexOf(item) !== index);
  }

  static frequency<T>(array: T[]): Map<T, number> {
    const map = new Map<T, number>();
    array.forEach(item => {
      map.set(item, (map.get(item) || 0) + 1);
    });
    return map;
  }

  static groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  static partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
    const pass: T[] = [];
    const fail: T[] = [];
    array.forEach(item => {
      if (predicate(item)) pass.push(item);
      else fail.push(item);
    });
    return [pass, fail];
  }

  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static flatten<T>(array: (T | T[])[]): T[] {
    return array.flat() as T[];
  }

  static flattenDeep<T>(array: unknown[]): T[] {
    return array.flatMap(item => {
      if (Array.isArray(item)) {
        return this.flattenDeep<T>(item);
      }
      return [item] as T[];
    });
  }

  static difference<T>(array: T[], ...arrays: T[][]): T[] {
    const toExclude = new Set(arrays.flat());
    return array.filter(item => !toExclude.has(item));
  }

  static intersection<T>(array: T[], ...arrays: T[][]): T[] {
    const sets = arrays.map(arr => new Set(arr));
    return array.filter(item => sets.every(set => set.has(item)));
  }

  static union<T>(...arrays: T[][]): T[] {
    return this.unique(arrays.flat());
  }

  static sortBy<T>(array: T[], keyFn: (item: T) => number | string): T[] {
    return [...array].sort((a, b) => {
      const aKey = keyFn(a);
      const bKey = keyFn(b);
      if (aKey < bKey) return -1;
      if (aKey > bKey) return 1;
      return 0;
    });
  }

  static sortByMultiple<T>(array: T[], ...keyFns: Array<(item: T) => number | string>): T[] {
    return [...array].sort((a, b) => {
      for (const keyFn of keyFns) {
        const aKey = keyFn(a);
        const bKey = keyFn(b);
        if (aKey < bKey) return -1;
        if (aKey > bKey) return 1;
      }
      return 0;
    });
  }

  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  static sample<T>(array: T[], count: number = 1): T[] {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, count);
  }

  static sampleOne<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
  }

  static zip<T, U>(array1: T[], array2: U[]): [T, U][] {
    const length = Math.min(array1.length, array2.length);
    const result: [T, U][] = [];
    for (let i = 0; i < length; i++) {
      result.push([array1[i], array2[i]]);
    }
    return result;
  }

  static unzip<T, U>(array: [T, U][]): [T[], U[]] {
    const array1: T[] = [];
    const array2: U[] = [];
    array.forEach(([a, b]) => {
      array1.push(a);
      array2.push(b);
    });
    return [array1, array2];
  }

  static range(start: number, end: number, step: number = 1): number[] {
    const result: number[] = [];
    if (step > 0) {
      for (let i = start; i < end; i += step) {
        result.push(i);
      }
    } else if (step < 0) {
      for (let i = start; i > end; i += step) {
        result.push(i);
      }
    }
    return result;
  }

  static rangeInclusive(start: number, end: number, step: number = 1): number[] {
    return this.range(start, end + (step > 0 ? 1 : -1), step);
  }

  static countBy<T>(array: T[], predicate: (item: T) => boolean): number {
    return array.filter(predicate).length;
  }

  static sumBy<T>(array: T[], valueFn: (item: T) => number): number {
    return array.reduce((sum, item) => sum + valueFn(item), 0);
  }

  static averageBy<T>(array: T[], valueFn: (item: T) => number): number {
    if (array.length === 0) return 0;
    return this.sumBy(array, valueFn) / array.length;
  }

  static min<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array.reduce((min, item) => item < min ? item : min);
  }

  static max<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array.reduce((max, item) => item > max ? item : max);
  }

  static minBy<T>(array: T[], valueFn: (item: T) => number): T | undefined {
    if (array.length === 0) return undefined;
    return array.reduce((min, item) => 
      valueFn(item) < valueFn(min) ? item : min
    );
  }

  static maxBy<T>(array: T[], valueFn: (item: T) => number): T | undefined {
    if (array.length === 0) return undefined;
    return array.reduce((max, item) => 
      valueFn(item) > valueFn(max) ? item : max
    );
  }

  static forEachRight<T>(array: T[], callback: (item: T, index: number) => void): void {
    for (let i = array.length - 1; i >= 0; i--) {
      callback(array[i], i);
    }
  }

  static mapRight<T, U>(array: T[], callback: (item: T, index: number) => U): U[] {
    const result: U[] = [];
    for (let i = array.length - 1; i >= 0; i--) {
      result.unshift(callback(array[i], i));
    }
    return result;
  }

  static take<T>(array: T[], count: number): T[] {
    return array.slice(0, count);
  }

  static takeRight<T>(array: T[], count: number): T[] {
    return array.slice(-count);
  }

  static takeWhile<T>(array: T[], predicate: (item: T) => boolean): T[] {
    const result: T[] = [];
    for (const item of array) {
      if (predicate(item)) result.push(item);
      else break;
    }
    return result;
  }

  static drop<T>(array: T[], count: number): T[] {
    return array.slice(count);
  }

  static dropRight<T>(array: T[], count: number): T[] {
    return array.slice(0, -count);
  }

  static dropWhile<T>(array: T[], predicate: (item: T) => boolean): T[] {
    let i = 0;
    while (i < array.length && predicate(array[i])) {
      i++;
    }
    return array.slice(i);
  }

  static compact<T>(array: (T | null | undefined | false | 0 | '')[]): T[] {
    return array.filter(Boolean) as T[];
  }

  static pluck<T, K extends keyof T>(array: T[], key: K): T[K][] {
    return array.map(item => item[key]);
  }

  static invoke<T>(array: T[], methodName: string, ...args: unknown[]): unknown[] {
    return array.map(item => {
      const method = (item as unknown as Record<string, unknown>)[methodName];
      return typeof method === 'function' ? method.apply(item, args) : undefined;
    });
  }

  static sortNumbers(array: number[], descending: boolean = false): number[] {
    return [...array].sort((a, b) => descending ? b - a : a - b);
  }

  static sortStrings(array: string[], descending: boolean = false, caseSensitive: boolean = false): string[] {
    return [...array].sort((a, b) => {
      const aStr = caseSensitive ? a : a.toLowerCase();
      const bStr = caseSensitive ? b : b.toLowerCase();
      const result = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      return descending ? -result : result;
    });
  }

  static move<T>(array: T[], fromIndex: number, toIndex: number): T[] {
    const result = [...array];
    const [item] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, item);
    return result;
  }

  static insertAt<T>(array: T[], index: number, item: T): T[] {
    const result = [...array];
    result.splice(index, 0, item);
    return result;
  }

  static removeAt<T>(array: T[], index: number): T[] {
    const result = [...array];
    result.splice(index, 1);
    return result;
  }

  static replaceAt<T>(array: T[], index: number, item: T): T[] {
    const result = [...array];
    result[index] = item;
    return result;
  }

  static keyBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T> {
    return array.reduce((obj, item) => {
      obj[keyFn(item)] = item;
      return obj;
    }, {} as Record<string, T>);
  }

  static indexBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T> {
    return this.keyBy(array, keyFn);
  }

  static toMap<T, K>(array: T[], keyFn: (item: T) => K): Map<K, T> {
    return new Map(array.map(item => [keyFn(item), item]));
  }

  static toSet<T>(array: T[]): Set<T> {
    return new Set(array);
  }

  static isEqual<T>(array1: T[], array2: T[]): boolean {
    if (array1.length !== array2.length) return false;
    return array1.every((item, index) => item === array2[index]);
  }

  static includes<T>(array: T[], item: T): boolean {
    return array.includes(item);
  }

  static findIndex<T>(array: T[], predicate: (item: T) => boolean): number {
    return array.findIndex(predicate);
  }

  static findLastIndex<T>(array: T[], predicate: (item: T) => boolean): number {
    for (let i = array.length - 1; i >= 0; i--) {
      if (predicate(array[i])) return i;
    }
    return -1;
  }

  static cycle<T>(array: T[], times: number): T[] {
    const result: T[] = [];
    for (let i = 0; i < times; i++) {
      result.push(...array);
    }
    return result;
  }

  static transpose<T>(matrix: T[][]): T[][] {
    if (matrix.length === 0) return [];
    return matrix[0].map((_, colIndex) => 
      matrix.map(row => row[colIndex])
    );
  }

  static zipWith<T, U, V>(
    array1: T[],
    array2: U[],
    combiner: (item1: T, item2: U) => V
  ): V[] {
    const length = Math.min(array1.length, array2.length);
    const result: V[] = [];
    for (let i = 0; i < length; i++) {
      result.push(combiner(array1[i], array2[i]));
    }
    return result;
  }

  static windowed<T>(array: T[], size: number, step: number = 1): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length - size + 1; i += step) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  static countOccurrences<T>(array: T[], item: T): number {
    return array.filter(i => i === item).length;
  }
}

export class MatrixUtils {
  static create<T>(rows: number, cols: number, fillValue: T): T[][] {
    return Array.from({ length: rows }, () => Array(cols).fill(fillValue));
  }

  static identity(size: number): number[][] {
    return Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => i === j ? 1 : 0)
    );
  }

  static transpose<T>(matrix: T[][]): T[][] {
    if (matrix.length === 0) return [];
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
  }

  static multiply<T extends number>(a: T[][], b: T[][]): T[][] {
    const rowsA = a.length;
    const colsA = a[0]?.length || 0;
    const colsB = b[0]?.length || 0;

    const result: T[][] = [];
    for (let i = 0; i < rowsA; i++) {
      result[i] = [];
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += (a[i][k] as number) * (b[k][j] as number);
        }
        result[i][j] = sum as T;
      }
    }
    return result;
  }

  static add<T extends number>(a: T[][], b: T[][]): T[][] {
    return a.map((row, i) => row.map((val, j) => (val + b[i][j]) as T));
  }

  static subtract<T extends number>(a: T[][], b: T[][]): T[][] {
    return a.map((row, i) => row.map((val, j) => (val - b[i][j]) as T));
  }

  static scalarMultiply<T extends number>(matrix: T[][], scalar: number): T[][] {
    return matrix.map(row => row.map(val => (val * scalar) as T));
  }

  static determinant(matrix: number[][]): number {
    const n = matrix.length;
    if (n === 1) return matrix[0][0];
    if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

    let det = 0;
    for (let j = 0; j < n; j++) {
      det += Math.pow(-1, j) * matrix[0][j] * this.determinant(
        matrix.slice(1).map(row => [...row.slice(0, j), ...row.slice(j + 1)])
      );
    }
    return det;
  }

  static trace(matrix: number[][]): number {
    return matrix.reduce((sum, row, i) => sum + row[i], 0);
  }

  static diagonal<T>(varArgs: T[]): T[][] {
    const size = varArgs.length;
    return varArgs.map((val, i) =>
      Array.from({ length: size }, (_, j) => i === j ? val : 0 as unknown as T)
    );
  }

  static row<T>(matrix: T[][], index: number): T[] {
    return matrix[index] || [];
  }

  static column<T>(matrix: T[][], index: number): T[] {
    return matrix.map(row => row[index]);
  }

  static flatten<T>(matrix: T[][]): T[] {
    return matrix.flat();
  }
}

export default ArrayUtils2;
