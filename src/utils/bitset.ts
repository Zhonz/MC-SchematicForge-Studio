export interface BitSetOptions {
  size: number;
}

export class BitSet {
  private bits: BigInt64Array;
  private size: number;

  constructor(options: BitSetOptions) {
    this.size = options.size;
    const arraySize = Math.ceil(options.size / 64);
    this.bits = new BigInt64Array(arraySize);
  }

  private getIndex(bit: number): { arrayIndex: number; bitIndex: number } {
    return {
      arrayIndex: Math.floor(bit / 64),
      bitIndex: bit % 64,
    };
  }

  set(bit: number, value: boolean = true): this {
    const { arrayIndex, bitIndex } = this.getIndex(bit);
    if (value) {
      this.bits[arrayIndex] |= BigInt(1) << BigInt(bitIndex);
    } else {
      this.bits[arrayIndex] &= ~(BigInt(1) << BigInt(bitIndex));
    }
    return this;
  }

  get(bit: number): boolean {
    const { arrayIndex, bitIndex } = this.getIndex(bit);
    return (this.bits[arrayIndex] & (BigInt(1) << BigInt(bitIndex))) !== BigInt(0);
  }

  clear(bit: number): this {
    return this.set(bit, false);
  }

  clearAll(): this {
    for (let i = 0; i < this.bits.length; i++) {
      this.bits[i] = BigInt(0);
    }
    return this;
  }

  setAll(): this {
    for (let i = 0; i < this.bits.length; i++) {
      this.bits[i] = BigInt(-1);
    }
    return this;
  }

  and(other: BitSet): this {
    for (let i = 0; i < this.bits.length; i++) {
      this.bits[i] &= other.bits[i] ?? BigInt(0);
    }
    return this;
  }

  or(other: BitSet): this {
    for (let i = 0; i < this.bits.length; i++) {
      this.bits[i] |= other.bits[i] ?? BigInt(0);
    }
    return this;
  }

  xor(other: BitSet): this {
    for (let i = 0; i < this.bits.length; i++) {
      this.bits[i] ^= other.bits[i] ?? BigInt(0);
    }
    return this;
  }

  not(): this {
    for (let i = 0; i < this.bits.length; i++) {
      this.bits[i] = ~this.bits[i]!;
    }
    return this;
  }

  count(): number {
    let count = 0;
    for (const bits of this.bits) {
      let n = bits;
      while (n !== BigInt(0)) {
        n &= n - BigInt(1);
        count++;
      }
    }
    return count;
  }

  isEmpty(): boolean {
    for (const bits of this.bits) {
      if (bits !== BigInt(0)) return false;
    }
    return true;
  }

  toArray(): number[] {
    const result: number[] = [];
    for (let i = 0; i < this.size; i++) {
      if (this.get(i)) result.push(i);
    }
    return result;
  }

  toString(): string {
    return this.bits.reduce((str, bits) => str + bits.toString(2).padStart(64, '0'), '');
  }

  getSize(): number {
    return this.size;
  }
}

export class IntSet {
  private bits: Int32Array;
  private maxValue: number;

  constructor(maxValue: number) {
    this.maxValue = maxValue;
    this.bits = new Int32Array(Math.ceil((maxValue + 1) / 32));
  }

  add(value: number): this {
    if (value < 0 || value > this.maxValue) return this;
    const index = Math.floor(value / 32);
    const bit = value % 32;
    this.bits[index] |= 1 << bit;
    return this;
  }

  has(value: number): boolean {
    if (value < 0 || value > this.maxValue) return false;
    const index = Math.floor(value / 32);
    const bit = value % 32;
    return (this.bits[index] & (1 << bit)) !== 0;
  }

  delete(value: number): this {
    if (value < 0 || value > this.maxValue) return this;
    const index = Math.floor(value / 32);
    const bit = value % 32;
    this.bits[index] &= ~(1 << bit);
    return this;
  }

  clear(): void {
    this.bits.fill(0);
  }

  union(other: IntSet): IntSet {
    const result = new IntSet(Math.max(this.maxValue, other.maxValue));
    for (let i = 0; i < Math.min(this.bits.length, other.bits.length); i++) {
      result.bits[i] = this.bits[i]! | other.bits[i]!;
    }
    return result;
  }

  intersect(other: IntSet): IntSet {
    const result = new IntSet(Math.max(this.maxValue, other.maxValue));
    for (let i = 0; i < Math.min(this.bits.length, other.bits.length); i++) {
      result.bits[i] = this.bits[i]! & other.bits[i]!;
    }
    return result;
  }
}
