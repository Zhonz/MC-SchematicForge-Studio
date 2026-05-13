export interface IteratorResult<T> {
  value: T;
  done: boolean;
}

export interface Iterator<T> {
  next(): IteratorResult<T>;
}

export interface Iterable<T> {
  [Symbol.iterator](): Iterator<T>;
}

export class RangeIterator implements Iterator<number> {
  private current: number;
  private end: number;
  private step: number;

  constructor(start: number, end: number, step = 1) {
    this.current = start;
    this.end = end;
    this.step = step;
  }

  next(): IteratorResult<number> {
    if (this.current >= this.end) {
      return { value: 0, done: true };
    }
    const value = this.current;
    this.current += this.step;
    return { value, done: false };
  }

  [Symbol.iterator](): Iterator<number> {
    return this;
  }
}

export class ArrayIterator<T> implements Iterator<T> {
  private current = 0;
  private array: T[];

  constructor(array: T[]) {
    this.array = array;
  }

  next(): IteratorResult<T> {
    if (this.current >= this.array.length) {
      return { value: undefined as unknown as T, done: true };
    }
    return { value: this.array[this.current++], done: false };
  }

  [Symbol.iterator](): Iterator<T> {
    return this;
  }
}

export class ObjectIterator<T> implements Iterator<[string, T]> {
  private keys: string[];
  private current = 0;
  private object: Record<string, T>;

  constructor(object: Record<string, T>) {
    this.object = object;
    this.keys = Object.keys(object);
  }

  next(): IteratorResult<[string, T]> {
    if (this.current >= this.keys.length) {
      return { value: undefined as unknown as [string, T], done: true };
    }
    const key = this.keys[this.current++];
    return { value: [key, this.object[key]], done: false };
  }

  [Symbol.iterator](): Iterator<[string, T]> {
    return this;
  }
}

export class MapIterator<K, V> implements Iterator<[K, V]> {
  private current = 0;
  private entries: Array<[K, V]>;

  constructor(map: Map<K, V>) {
    this.entries = Array.from(map.entries());
  }

  next(): IteratorResult<[K, V]> {
    if (this.current >= this.entries.length) {
      return { value: undefined as unknown as [K, V], done: true };
    }
    return { value: this.entries[this.current++], done: false };
  }

  [Symbol.iterator](): Iterator<[K, V]> {
    return this;
  }
}

export class SetIterator<T> implements Iterator<T> {
  private current = 0;
  private values: T[];

  constructor(set: Set<T>) {
    this.values = Array.from(set);
  }

  next(): IteratorResult<T> {
    if (this.current >= this.values.length) {
      return { value: undefined as unknown as T, done: true };
    }
    return { value: this.values[this.current++], done: false };
  }

  [Symbol.iterator](): Iterator<T> {
    return this;
  }
}

export class FilterIterator<T> implements Iterator<T> {
  private current = 0;
  private filtered: T[] | null = null;

  constructor(
    private iterator: Iterator<T>,
    private predicate: (value: T, index: number) => boolean
  ) {}

  private ensureFiltered(): void {
    if (this.filtered === null) {
      this.filtered = [];
      let index = 0;
      let result = this.iterator.next();
      while (!result.done) {
        if (this.predicate(result.value, index++)) {
          this.filtered.push(result.value);
        }
        result = this.iterator.next();
      }
    }
  }

  next(): IteratorResult<T> {
    this.ensureFiltered();
    if (this.current >= (this.filtered?.length ?? 0)) {
      return { value: undefined as unknown as T, done: true };
    }
    const filtered = this.filtered as T[];
    return { value: filtered[this.current++], done: false };
  }
}

export class MapIteratorTransform<T, U> implements Iterator<U> {
  private current = 0;
  private mapped: U[] | null = null;

  constructor(
    private iterator: Iterator<T>,
    private transform: (value: T, index: number) => U
  ) {}

  private ensureMapped(): void {
    if (this.mapped === null) {
      this.mapped = [];
      let index = 0;
      let result = this.iterator.next();
      while (!result.done) {
        this.mapped.push(this.transform(result.value, index++));
        result = this.iterator.next();
      }
    }
  }

  next(): IteratorResult<U> {
    this.ensureMapped();
    if (this.current >= (this.mapped?.length ?? 0)) {
      return { value: undefined as unknown as U, done: true };
    }
    const mapped = this.mapped as U[];
    return { value: mapped[this.current++], done: false };
  }
}

export class FlatMapIterator<T, U> implements Iterator<U> {
  private outerIterator: Iterator<T>;
  private innerIterator: Iterator<U> | null = null;
  private current: U | undefined;

  constructor(
    iterator: Iterator<T>,
    private transform: (value: T, index: number) => Iterable<U> | Iterator<U>
  ) {
    this.outerIterator = iterator;
  }

  next(): IteratorResult<U> {
    while (true) {
      if (this.innerIterator) {
        const innerResult = this.innerIterator.next();
        if (!innerResult.done) {
          return { value: innerResult.value, done: false };
        }
        this.innerIterator = null;
      }

      const outerResult = this.outerIterator.next();
      if (outerResult.done) {
        return { value: undefined as unknown as U, done: true };
      }

      const iterable = this.transform(outerResult.value, 0);
      if (Symbol.iterator in iterable) {
        this.innerIterator = (iterable as Iterable<U>)[Symbol.iterator]();
      }
    }
  }
}

export class TakeIterator<T> implements Iterator<T> {
  private count = 0;

  constructor(
    private iterator: Iterator<T>,
    private limit: number
  ) {}

  next(): IteratorResult<T> {
    if (this.count >= this.limit) {
      return { value: undefined as unknown as T, done: true };
    }
    this.count++;
    return this.iterator.next();
  }
}

export class SkipIterator<T> implements Iterator<T> {
  private skipped = 0;

  constructor(
    private iterator: Iterator<T>,
    private count: number
  ) {}

  next(): IteratorResult<T> {
    while (this.skipped < this.count) {
      const result = this.iterator.next();
      if (result.done) return result;
      this.skipped++;
    }
    return this.iterator.next();
  }
}

export class EnumerateIterator<T> implements Iterator<[number, T]> {
  private count = 0;

  constructor(private iterator: Iterator<T>) {}

  next(): IteratorResult<[number, T]> {
    const result = this.iterator.next();
    if (result.done) {
      return { value: undefined as unknown as [number, T], done: true };
    }
    return { value: [this.count++, result.value], done: false };
  }
}

export class ZipIterator<T, U> implements Iterator<[T, U]> {
  constructor(
    private iterator1: Iterator<T>,
    private iterator2: Iterator<U>
  ) {}

  next(): IteratorResult<[T, U]> {
    const result1 = this.iterator1.next();
    const result2 = this.iterator2.next();

    if (result1.done || result2.done) {
      return { value: undefined as unknown as [T, U], done: true };
    }

    return { value: [result1.value, result2.value], done: false };
  }
}

export class CycleIterator<T> implements Iterator<T> {
  private current = 0;

  constructor(private array: T[]) {
    if (array.length === 0) {
      throw new Error('Cannot cycle an empty array');
    }
  }

  next(): IteratorResult<T> {
    const value = this.array[this.current];
    this.current = (this.current + 1) % this.array.length;
    return { value, done: false };
  }
}

export class RepeatIterator<T> implements Iterator<T> {
  private count = 0;

  constructor(
    private value: T,
    private times?: number
  ) {}

  next(): IteratorResult<T> {
    if (this.times !== undefined && this.count >= this.times) {
      return { value: undefined as unknown as T, done: true };
    }
    this.count++;
    return { value: this.value, done: false };
  }
}

export class ChainIterator<T> implements Iterator<T> {
  private currentIterator: Iterator<T> | null = null;
  private currentIndex = 0;

  constructor(private iterators: Array<Iterator<T>>) {}

  next(): IteratorResult<T> {
    while (this.currentIndex < this.iterators.length) {
      if (!this.currentIterator) {
        this.currentIterator = this.iterators[this.currentIndex];
      }

      const result = this.currentIterator.next();
      if (!result.done) {
        return result;
      }

      this.currentIterator = null;
      this.currentIndex++;
    }

    return { value: undefined as unknown as T, done: true };
  }
}

export class ChunkIterator<T> implements Iterator<T[]> {
  private current = 0;

  constructor(
    private iterator: Iterator<T>,
    private size: number
  ) {}

  next(): IteratorResult<T[]> {
    const chunk: T[] = [];
    let result = this.iterator.next();

    while (!result.done && chunk.length < this.size) {
      chunk.push(result.value);
      result = this.iterator.next();
    }

    if (chunk.length === 0) {
      return { value: undefined as unknown as T[], done: true };
    }

    return { value: chunk, done: false };
  }
}

export class WindowIterator<T> implements Iterator<T[]> {
  private buffer: T[] = [];
  private current = 0;

  constructor(
    private iterator: Iterator<T>,
    private size: number,
    private fill?: T
  ) {
    if (fill === undefined) {
      for (let i = 0; i < this.size - 1; i++) {
        const result = this.iterator.next();
        if (!result.done) {
          this.buffer.push(result.value);
        }
      }
    } else {
      for (let i = 0; i < this.size - 1; i++) {
        this.buffer.push(fill);
      }
    }
  }

  next(): IteratorResult<T[]> {
    const result = this.iterator.next();
    if (result.done && this.buffer.length === 0) {
      return { value: undefined as unknown as T[], done: true };
    }

    if (result.done) {
      const window = [...this.buffer];
      this.buffer.shift();
      return { value: window, done: true };
    }

    const window = [...this.buffer, result.value];
    this.buffer.push(result.value);
    if (this.buffer.length >= this.size) {
      this.buffer.shift();
    }

    return { value: window, done: false };
  }
}

export function range(start: number, end?: number, step?: number): RangeIterator {
  if (end === undefined) {
    return new RangeIterator(0, start, step);
  }
  return new RangeIterator(start, end, step);
}

export function enumerate<T>(iterable: Iterable<T>): EnumerateIterator<T> {
  return new EnumerateIterator((iterable as Iterable<T>)[Symbol.iterator]());
}

export function zip<T, U>(iterable1: Iterable<T>, iterable2: Iterable<U>): ZipIterator<T, U> {
  return new ZipIterator(
    (iterable1 as Iterable<T>)[Symbol.iterator](),
    (iterable2 as Iterable<U>)[Symbol.iterator]()
  );
}

export function chain<T>(...iterables: Array<Iterable<T>>): ChainIterator<T> {
  return new ChainIterator(iterables.map((i) => (i as Iterable<T>)[Symbol.iterator]()));
}

export function cycle<T>(array: T[]): CycleIterator<T> {
  return new CycleIterator(array);
}

export function repeat<T>(value: T, times?: number): RepeatIterator<T> {
  return new RepeatIterator(value, times);
}

export function chunk<T>(iterable: Iterable<T>, size: number): ChunkIterator<T> {
  return new ChunkIterator((iterable as Iterable<T>)[Symbol.iterator](), size);
}

export function window<T>(iterable: Iterable<T>, size: number, fill?: T): WindowIterator<T> {
  return new WindowIterator((iterable as Iterable<T>)[Symbol.iterator](), size, fill);
}

export function toArray<T>(iterable: Iterable<T>): T[] {
  return Array.from(iterable as Iterable<T>);
}

export function filter<T>(iterable: Iterable<T>, predicate: (value: T, index: number) => boolean): FilterIterator<T> {
  return new FilterIterator((iterable as Iterable<T>)[Symbol.iterator](), predicate);
}

export function map<T, U>(iterable: Iterable<T>, transform: (value: T, index: number) => U): MapIteratorTransform<T, U> {
  return new MapIteratorTransform((iterable as Iterable<T>)[Symbol.iterator](), transform);
}

export function flatMap<T, U>(iterable: Iterable<T>, transform: (value: T, index: number) => Iterable<U>): FlatMapIterator<T, U> {
  return new FlatMapIterator((iterable as Iterable<T>)[Symbol.iterator](), transform);
}

export function take<T>(iterable: Iterable<T>, count: number): TakeIterator<T> {
  return new TakeIterator((iterable as Iterable<T>)[Symbol.iterator](), count);
}

export function skip<T>(iterable: Iterable<T>, count: number): SkipIterator<T> {
  return new SkipIterator((iterable as Iterable<T>)[Symbol.iterator](), count);
}
