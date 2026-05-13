export type SortDirection = 'asc' | 'desc';

export interface SortOptions<T> {
  direction?: SortDirection;
  comparator?: (a: T, b: T) => number;
  stable?: boolean;
}

export class QuickSort<T = number> {
  private arr: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.compare = comparator ?? ((a: T, b: T) => (a as any) - (b as any));
  }

  setArray(arr: T[]): this {
    this.arr = [...arr];
    return this;
  }

  sort(): T[] {
    if (this.arr.length <= 1) return [...this.arr];
    
    const result = [...this.arr];
    this.quicksort(result, 0, result.length - 1);
    return result;
  }

  private quicksort(arr: T[], low: number, high: number): void {
    if (low < high) {
      const pivot = this.partition(arr, low, high);
      this.quicksort(arr, low, pivot - 1);
      this.quicksort(arr, pivot + 1, high);
    }
  }

  private partition(arr: T[], low: number, high: number): number {
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (this.compare(arr[j], pivot) <= 0) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
  }
}

export class MergeSort<T = number> {
  private compare: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.compare = comparator ?? ((a: T, b: T) => (a as any) - (b as any));
  }

  sort(arr: T[]): T[] {
    if (arr.length <= 1) return [...arr];
    
    const result: T[] = [];
    const merge = (left: T[], right: T[]): T[] => {
      const merged: T[] = [];
      let i = 0, j = 0;

      while (i < left.length && j < right.length) {
        if (this.compare(left[i], right[j]) <= 0) {
          merged.push(left[i++]);
        } else {
          merged.push(right[j++]);
        }
      }

      return [...merged, ...left.slice(i), ...right.slice(j)];
    };

    const divide = (arr: T[]): T[] => {
      if (arr.length <= 1) return arr;
      
      const mid = Math.floor(arr.length / 2);
      const left = divide(arr.slice(0, mid));
      const right = divide(arr.slice(mid));
      
      return merge(left, right);
    };

    return divide(arr);
  }

  sortInPlace(arr: T[]): T[] {
    const sorted = this.sort(arr);
    arr.length = 0;
    arr.push(...sorted);
    return arr;
  }
}

export class HeapSort<T = number> {
  private compare: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.compare = comparator ?? ((a: T, b: T) => (a as any) - (b as any));
  }

  sort(arr: T[]): T[] {
    const result = [...arr];
    const n = result.length;

    const heapify = (size: number, root: number): void => {
      let largest = root;
      const left = 2 * root + 1;
      const right = 2 * root + 2;

      if (left < size && this.compare(result[left], result[largest]) > 0) {
        largest = left;
      }
      if (right < size && this.compare(result[right], result[largest]) > 0) {
        largest = right;
      }
      if (largest !== root) {
        [result[root], result[largest]] = [result[largest], result[root]];
        heapify(size, largest);
      }
    };

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      heapify(n, i);
    }

    for (let i = n - 1; i > 0; i--) {
      [result[0], result[i]] = [result[i], result[0]];
      heapify(i, 0);
    }

    return result;
  }
}

export class BinarySearch<T = number> {
  private compare: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.compare = comparator ?? ((a: T, b: T) => (a as any) - (b as any));
  }

  search(arr: T[], target: T): number {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const cmp = this.compare(arr[mid], target);

      if (cmp === 0) return mid;
      if (cmp < 0) left = mid + 1;
      else right = mid - 1;
    }

    return -1;
  }

  searchLeft(arr: T[], target: T): number {
    let left = 0;
    let right = arr.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.compare(arr[mid], target) < 0) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  searchRight(arr: T[], target: T): number {
    let left = 0;
    let right = arr.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.compare(arr[mid], target) <= 0) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left - 1;
  }
}

export interface SearchResult<T> {
  index: number;
  value: T;
  distance?: number;
}

export class InterpolationSearch<T = number> {
  private compare: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.compare = comparator ?? ((a: T, b: T) => (a as any) - (b as any));
  }

  search(arr: T[], target: T): number {
    let low = 0;
    let high = arr.length - 1;

    while (low <= high && this.compare(target, arr[low]) >= 0 && this.compare(target, arr[high]) <= 0) {
      if (low === high) {
        if (this.compare(arr[low], target) === 0) return low;
        return -1;
      }

      const pos = low + Math.floor(
        ((high - low) * (this.toNumber(target) - this.toNumber(arr[low]))) /
        (this.toNumber(arr[high]) - this.toNumber(arr[low]))
      );

      const cmp = this.compare(arr[pos], target);
      if (cmp === 0) return pos;
      if (cmp < 0) low = pos + 1;
      else high = pos - 1;
    }

    return -1;
  }

  private toNumber(value: T): number {
    return value as unknown as number;
  }
}

export class JumpSearch<T = number> {
  private compare: (a: T, b: T) => number;
  private jumpSize: number;

  constructor(comparator?: (a: T, b: T) => number, jumpSize?: number) {
    this.compare = comparator ?? ((a: T, b: T) => (a as any) - (b as any));
    this.jumpSize = jumpSize ?? Math.floor(Math.sqrt(100));
  }

  search(arr: T[], target: T): number {
    if (arr.length === 0) return -1;

    const step = Math.ceil(Math.sqrt(arr.length));
    let prev = 0;

    while (this.compare(arr[Math.min(step, arr.length) - 1], target) < 0) {
      prev = step;
      if (prev >= arr.length) return -1;
    }

    while (this.compare(arr[prev], target) < 0) {
      prev++;
      if (prev === Math.min(step, arr.length)) return -1;
    }

    if (this.compare(arr[prev], target) === 0) return prev;
    return -1;
  }
}

export class ExponentialSearch<T = number> {
  private compare: (a: T, b: T) => number;
  private binarySearch: BinarySearch<T>;

  constructor(comparator?: (a: T, b: T) => number) {
    this.compare = comparator ?? ((a: T, b: T) => (a as any) - (b as any));
    this.binarySearch = new BinarySearch(comparator);
  }

  search(arr: T[], target: T): number {
    if (arr.length === 0) return -1;

    if (this.compare(arr[0], target) === 0) return 0;

    let i = 1;
    while (i < arr.length && this.compare(arr[i], target) <= 0) {
      i *= 2;
    }

    return this.binarySearch.search(
      arr.slice(Math.floor(i / 2), Math.min(i, arr.length)),
      target
    ) + Math.floor(i / 2);
  }
}

export class FibonacciSearch<T = number> {
  private compare: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.compare = comparator ?? ((a: T, b: T) => (a as any) - (b as any));
  }

  search(arr: T[], target: T): number {
    const n = arr.length;
    if (n === 0) return -1;

    let fibM2 = 0;
    let fibM1 = 1;
    let fibM = fibM1 + fibM2;

    while (fibM < n) {
      fibM2 = fibM1;
      fibM1 = fibM;
      fibM = fibM1 + fibM2;
    }

    let offset = -1;

    while (fibM > 1) {
      const i = Math.min(offset + fibM2, n - 1);

      if (this.compare(arr[i], target) < 0) {
        fibM = fibM1;
        fibM1 = fibM2;
        fibM2 = fibM - fibM1;
        offset = i;
      } else if (this.compare(arr[i], target) > 0) {
        fibM = fibM2;
        fibM1 = fibM1 - fibM2;
        fibM2 = fibM - fibM1;
      } else {
        return i;
      }
    }

    if (fibM1 && offset + 1 < n && this.compare(arr[offset + 1], target) === 0) {
      return offset + 1;
    }

    return -1;
  }
}

export class Searching {
  static linearSearch<T>(arr: T[], target: T): number {
    return arr.findIndex(item => item === target);
  }

  static linearSearchBy<T, K>(
    arr: T[],
    target: K,
    keyFn: (item: T) => K
  ): number {
    return arr.findIndex(item => keyFn(item) === target);
  }

  static findAll<T>(arr: T[], predicate: (item: T) => boolean): T[] {
    return arr.filter(predicate);
  }

  static findKth<T>(
    arr: T[],
    k: number,
    compare: (a: T, b: T) => number
  ): T | undefined {
    if (k < 0 || k >= arr.length) return undefined;
    
    const sorted = [...arr].sort(compare);
    return sorted[k];
  }

  static twoSum(arr: number[], target: number): [number, number] | null {
    const map = new Map<number, number>();
    
    for (let i = 0; i < arr.length; i++) {
      const complement = target - arr[i];
      if (map.has(complement)) {
        return [map.get(complement)!, i];
      }
      map.set(arr[i], i);
    }
    
    return null;
  }
}

export class Sorting {
  static bubbleSort<T>(arr: T[], compare?: (a: T, b: T) => number): T[] {
    const cmp = compare ?? ((a: T, b: T) => (a as any) - (b as any));
    const result = [...arr];
    
    for (let i = 0; i < result.length - 1; i++) {
      for (let j = 0; j < result.length - i - 1; j++) {
        if (cmp(result[j], result[j + 1]) > 0) {
          [result[j], result[j + 1]] = [result[j + 1], result[j]];
        }
      }
    }
    
    return result;
  }

  static selectionSort<T>(arr: T[], compare?: (a: T, b: T) => number): T[] {
    const cmp = compare ?? ((a: T, b: T) => (a as any) - (b as any));
    const result = [...arr];
    
    for (let i = 0; i < result.length - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < result.length; j++) {
        if (cmp(result[j], result[minIdx]) < 0) {
          minIdx = j;
        }
      }
      [result[i], result[minIdx]] = [result[minIdx], result[i]];
    }
    
    return result;
  }

  static insertionSort<T>(arr: T[], compare?: (a: T, b: T) => number): T[] {
    const cmp = compare ?? ((a: T, b: T) => (a as any) - (b as any));
    const result = [...arr];
    
    for (let i = 1; i < result.length; i++) {
      const key = result[i];
      let j = i - 1;
      
      while (j >= 0 && cmp(result[j], key) > 0) {
        result[j + 1] = result[j];
        j--;
      }
      result[j + 1] = key;
    }
    
    return result;
  }

  static shellSort<T>(arr: T[], compare?: (a: T, b: T) => number): T[] {
    const cmp = compare ?? ((a: T, b: T) => (a as any) - (b as any));
    const result = [...arr];
    const n = result.length;
    
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < n; i++) {
        const temp = result[i];
        let j = i;
        
        while (j >= gap && cmp(result[j - gap], temp) > 0) {
          result[j] = result[j - gap];
          j -= gap;
        }
        result[j] = temp;
      }
    }
    
    return result;
  }

  static countingSort(arr: number[]): number[] {
    if (arr.length === 0) return [];
    
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min + 1;
    const count = new Array(range).fill(0);
    const output = new Array(arr.length);
    
    for (const num of arr) {
      count[num - min]++;
    }
    
    for (let i = 1; i < range; i++) {
      count[i] += count[i - 1];
    }
    
    for (let i = arr.length - 1; i >= 0; i--) {
      output[count[arr[i] - min] - 1] = arr[i];
      count[arr[i] - min]--;
    }
    
    return output;
  }

  static radixSort(arr: number[]): number[] {
    if (arr.length === 0) return [];
    
    const max = Math.max(...arr);
    let exp = 1;
    const output = [...arr];
    
    while (Math.floor(max / exp) > 0) {
      const count = new Array(10).fill(0);
      const temp = new Array(arr.length);
      
      for (let i = 0; i < output.length; i++) {
        count[Math.floor(output[i] / exp) % 10]++;
      }
      
      for (let i = 1; i < 10; i++) {
        count[i] += count[i - 1];
      }
      
      for (let i = output.length - 1; i >= 0; i--) {
        temp[count[Math.floor(output[i] / exp) % 10] - 1] = output[i];
        count[Math.floor(output[i] / exp) % 10]--;
      }
      
      for (let i = 0; i < output.length; i++) {
        output[i] = temp[i];
      }
      
      exp *= 10;
    }
    
    return output;
  }
}
