export interface BloomFilterOptions {
  size?: number;
  hashCount?: number;
}

export class BloomFilter {
  private bits: boolean[];
  private size: number;
  private hashCount: number;

  constructor(options: BloomFilterOptions = {}) {
    this.size = options.size ?? 1000;
    this.hashCount = options.hashCount ?? 7;
    this.bits = new Array(this.size).fill(false);
  }

  private hash(value: string, seed: number): number {
    let hash = seed;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) + hash) + value.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % this.size);
  }

  private getHashes(value: string): number[] {
    const hashes: number[] = [];
    for (let i = 0; i < this.hashCount; i++) {
      hashes.push(this.hash(value, i * 1000 + 12345));
    }
    return hashes;
  }

  add(value: string): this {
    const hashes = this.getHashes(value);
    for (const h of hashes) {
      this.bits[h] = true;
    }
    return this;
  }

  contains(value: string): boolean {
    const hashes = this.getHashes(value);
    return hashes.every((h) => this.bits[h]);
  }

  clear(): void {
    this.bits.fill(false);
  }

  getFalsePositiveRate(): number {
    let setBits = 0;
    for (const bit of this.bits) {
      if (bit) setBits++;
    }
    const k = this.hashCount;
    const m = this.size;
    const x = (setBits / m) ** k;
    return x;
  }

  static fromArray(values: string[], options?: BloomFilterOptions): BloomFilter {
    const filter = new BloomFilter(options);
    values.forEach((value) => filter.add(value));
    return filter;
  }
}

export interface CountMinSketchOptions {
  width?: number;
  depth?: number;
}

export class CountMinSketch {
  private counts: number[][];
  private width: number;
  private depth: number;

  constructor(options: CountMinSketchOptions = {}) {
    this.width = options.width ?? 1000;
    this.depth = options.depth ?? 5;
    this.counts = Array.from({ length: this.depth }, () => new Array(this.width).fill(0));
  }

  private hash(value: string, seed: number): number {
    let hash = seed;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) + hash) + value.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % this.width);
  }

  add(value: string, count: number = 1): this {
    for (let i = 0; i < this.depth; i++) {
      const index = this.hash(value, i * 1000 + 12345);
      this.counts[i]![index] += count;
    }
    return this;
  }

  estimate(value: string): number {
    let min = Infinity;
    for (let i = 0; i < this.depth; i++) {
      const index = this.hash(value, i * 1000 + 12345);
      min = Math.min(min, this.counts[i]![index]!);
    }
    return min;
  }

  clear(): void {
    for (const row of this.counts) {
      row.fill(0);
    }
  }

  merge(other: CountMinSketch): this {
    if (this.width !== other.width || this.depth !== other.depth) {
      throw new Error('Cannot merge CountMinSketch with different dimensions');
    }
    for (let i = 0; i < this.depth; i++) {
      for (let j = 0; j < this.width; j++) {
        this.counts[i]![j] += other.counts[i]![j]!;
      }
    }
    return this;
  }
}

export interface HyperLogLogOptions {
  precision?: number;
}

export class HyperLogLog {
  private registers: number[];
  private precision: number;

  constructor(options: HyperLogLogOptions = {}) {
    this.precision = options.precision ?? 10;
    this.registers = new Array(2 ** this.precision).fill(0);
  }

  private hash(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private rho(hash: number): number {
    if (hash === 0) return this.precision;
    return this.precision - Math.floor(Math.log2(hash));
  }

  add(value: string): this {
    const hash = this.hash(value);
    const index = hash & ((2 ** this.precision) - 1);
    const zeros = this.rho(hash >>> this.precision);
    this.registers[index] = Math.max(this.registers[index]!, zeros);
    return this;
  }

  count(): number {
    const m = 2 ** this.precision;
    const sum = this.registers.reduce((acc, r) => acc + 2 ** -r, 0);
    const alpha = 0.7213 / (1 + 1.079 / m);
    return Math.round(alpha * m * m / sum);
  }

  merge(other: HyperLogLog): this {
    if (this.precision !== other.precision) {
      throw new Error('Cannot merge HyperLogLog with different precision');
    }
    for (let i = 0; i < this.registers.length; i++) {
      this.registers[i] = Math.max(this.registers[i]!, other.registers[i]!);
    }
    return this;
  }

  clear(): void {
    this.registers.fill(0);
  }
}
