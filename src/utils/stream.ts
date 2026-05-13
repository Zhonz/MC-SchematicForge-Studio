export interface StreamOptions {
  highWaterMark?: number;
}

export class Stream<T> {
  private buffer: T[] = [];
  private options: Required<StreamOptions>;
  private listeners: {
    data: Array<(chunk: T) => void>;
    end: Array<() => void>;
    error: Array<(error: Error) => void>;
  } = { data: [], end: [], error: [] };
  private ended = false;

  constructor(options: StreamOptions = {}) {
    this.options = {
      highWaterMark: options.highWaterMark ?? 16,
    };
  }

  write(chunk: T): boolean {
    if (this.ended) return false;
    if (this.listeners.data.length === 0) {
      if (this.buffer.length >= this.options.highWaterMark) {
        return false;
      }
      this.buffer.push(chunk);
      return true;
    }
    this.listeners.data.forEach((listener) => listener(chunk));
    return true;
  }

  read(): T | undefined {
    return this.buffer.shift();
  }

  onData(listener: (chunk: T) => void): () => void {
    this.listeners.data.push(listener);
    if (this.buffer.length > 0) {
      this.buffer.forEach((chunk) => listener(chunk));
      this.buffer = [];
    }
    return () => {
      this.listeners.data = this.listeners.data.filter((l) => l !== listener);
    };
  }

  onEnd(listener: () => void): () => void {
    this.listeners.end.push(listener);
    if (this.ended) listener();
    return () => {
      this.listeners.end = this.listeners.end.filter((l) => l !== listener);
    };
  }

  onError(listener: (error: Error) => void): () => void {
    this.listeners.error.push(listener);
    return () => {
      this.listeners.error = this.listeners.error.filter((l) => l !== listener);
    };
  }

  end(): void {
    this.ended = true;
    this.listeners.end.forEach((listener) => listener());
  }

  isEnded(): boolean {
    return this.ended;
  }

  pipe<U>(destination: Stream<U>, transform?: (chunk: T) => U): Stream<U> {
    this.onData((chunk) => {
      const transformed = transform ? transform(chunk) : (chunk as unknown as U);
      destination.write(transformed);
    });
    this.onEnd(() => destination.end());
    return destination;
  }
}

export class TransformStream<T, U> extends Stream<U> {
  private transform?: (chunk: T) => U;
  private source?: Stream<T>;

  constructor(transform?: (chunk: T) => U) {
    super();
    this.transform = transform;
  }

  connect(source: Stream<T>): this {
    this.source = source;
    source.onData((chunk) => {
      const transformed = this.transform ? this.transform(chunk) : (chunk as unknown as U);
      this.write(transformed);
    });
    source.onEnd(() => this.end());
    return this;
  }
}

export class WritableStream<T> {
  private chunks: T[] = [];
  private options: Required<StreamOptions>;
  private ended = false;
  private error: Error | null = null;
  private resolve?: () => void;

  constructor(options: StreamOptions = {}) {
    this.options = {
      highWaterMark: options.highWaterMark ?? 16,
    };
  }

  write(chunk: T): Promise<void> {
    if (this.error) throw this.error;
    if (this.ended) throw new Error('Stream already ended');
    this.chunks.push(chunk);
    return Promise.resolve();
  }

  end(): void {
    this.ended = true;
    this.resolve?.();
  }

  getChunks(): T[] {
    return [...this.chunks];
  }

  isEnded(): boolean {
    return this.ended;
  }

  wait(): Promise<void> {
    if (this.ended) return Promise.resolve();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
}

export class ReadableStream<T> {
  private chunks: T[] = [];
  private options: Required<StreamOptions>;
  private position = 0;
  private closed = false;

  constructor(chunks: T[] = [], options: StreamOptions = {}) {
    this.chunks = chunks;
    this.options = {
      highWaterMark: options.highWaterMark ?? 16,
    };
  }

  read(): T | null {
    if (this.position >= this.chunks.length) {
      return this.closed ? null : undefined as unknown as null;
    }
    return this.chunks[this.position++];
  }

  readAll(): T[] {
    return this.chunks.slice(this.position);
  }

  close(): void {
    this.closed = true;
  }

  isClosed(): boolean {
    return this.closed;
  }

  getRemaining(): T[] {
    return this.chunks.slice(this.position);
  }
}
