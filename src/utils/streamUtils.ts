export interface StreamOptions {
  highWaterMark?: number;
}

export class Stream<T> {
  private buffer: T[] = [];
  private subscribers: Array<(data: T) => void> = [];
  private ended = false;
  private highWaterMark: number;

  constructor(options: StreamOptions = {}) {
    this.highWaterMark = options.highWaterMark ?? 100;
  }

  write(data: T): boolean {
    if (this.ended) return false;

    if (this.buffer.length >= this.highWaterMark) {
      return false;
    }

    this.buffer.push(data);
    this.flush();
    return true;
  }

  private flush(): void {
    while (this.buffer.length > 0 && this.subscribers.length > 0) {
      const data = this.buffer.shift();
      if (data !== undefined) {
        for (const subscriber of this.subscribers) {
          subscriber(data);
        }
      }
    }
  }

  subscribe(callback: (data: T) => void): () => void {
    this.subscribers.push(callback);

    while (this.buffer.length > 0) {
      const data = this.buffer.shift();
      if (data !== undefined) {
        callback(data);
      }
    }

    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  pipe<U>(transformer: (data: T) => U | null): Stream<U> {
    const output = new Stream<U>({ highWaterMark: this.highWaterMark });

    this.subscribe((data) => {
      const result = transformer(data);
      if (result !== null) {
        output.write(result);
      }
    });

    return output;
  }

  filter(predicate: (data: T) => boolean): Stream<T> {
    return this.pipe((data) => predicate(data) ? data : null);
  }

  map<U>(mapper: (data: T) => U): Stream<U> {
    return this.pipe((data) => mapper(data));
  }

  take(count: number): Stream<T> {
    let taken = 0;
    const output = new Stream<T>({ highWaterMark: this.highWaterMark });

    this.subscribe((data) => {
      if (taken < count) {
        output.write(data);
        taken++;
      }
      if (taken >= count) {
        output.end();
      }
    });

    return output;
  }

  takeWhile(predicate: (data: T) => boolean): Stream<T> {
    const output = new Stream<T>({ highWaterMark: this.highWaterMark });
    let taking = true;

    this.subscribe((data) => {
      if (taking && predicate(data)) {
        output.write(data);
      } else {
        taking = false;
        output.end();
      }
    });

    return output;
  }

  end(): void {
    this.ended = true;
  }

  isEnded(): boolean {
    return this.ended;
  }

  getBufferSize(): number {
    return this.buffer.length;
  }

  getSubscriberCount(): number {
    return this.subscribers.length;
  }
}

export class TransformStream<T, U> {
  private input: Stream<T>;
  private output: Stream<U>;
  private transformer: (data: T) => U | null;

  constructor(transformer: (data: T) => U | null, options: StreamOptions = {}) {
    this.transformer = transformer;
    this.input = new Stream<T>(options);
    this.output = new Stream<U>(options);

    this.input.pipe(transformer);
  }

  getInput(): Stream<T> {
    return this.input;
  }

  getOutput(): Stream<U> {
    return this.output;
  }

  write(data: T): boolean {
    return this.input.write(data);
  }

  end(): void {
    this.input.end();
  }
}

export class MergeStream<T> {
  private output: Stream<T>;
  private inputs: Stream<T>[] = [];
  private unsubscribers: Array<() => void> = [];

  constructor(options: StreamOptions = {}) {
    this.output = new Stream<T>(options);
  }

  add(stream: Stream<T>): void {
    this.inputs.push(stream);
    const unsubscribe = stream.subscribe((data) => {
      this.output.write(data);
    });
    this.unsubscribers.push(unsubscribe);
  }

  remove(stream: Stream<T>): void {
    const index = this.inputs.indexOf(stream);
    if (index !== -1) {
      this.inputs.splice(index, 1);
      this.unsubscribers[index]();
      this.unsubscribers.splice(index, 1);
    }
  }

  getOutput(): Stream<T> {
    return this.output;
  }

  end(): void {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.inputs = [];
    this.unsubscribers = [];
    this.output.end();
  }
}

export class BufferStream<T> {
  private chunks: T[][] = [];
  private output: Stream<T[]>;
  private bufferSize: number;
  private currentChunk: T[] = [];

  constructor(bufferSize = 10, options: StreamOptions = {}) {
    this.bufferSize = bufferSize;
    this.output = new Stream<T[]>(options);
  }

  write(data: T): boolean {
    this.currentChunk.push(data);

    if (this.currentChunk.length >= this.bufferSize) {
      return this.flush();
    }

    return true;
  }

  flush(): boolean {
    if (this.currentChunk.length === 0) return true;

    const chunk = [...this.currentChunk];
    this.currentChunk = [];
    this.chunks.push(chunk);

    return this.output.write(chunk);
  }

  getOutput(): Stream<T[]> {
    return this.output;
  }

  end(): void {
    this.flush();
    this.output.end();
  }
}

export function fromArray<T>(array: T[], options: StreamOptions = {}): Stream<T> {
  const stream = new Stream<T>(options);

  for (const item of array) {
    stream.write(item);
  }
  stream.end();

  return stream;
}

export function createStream<T>(options?: StreamOptions): Stream<T> {
  return new Stream<T>(options);
}
