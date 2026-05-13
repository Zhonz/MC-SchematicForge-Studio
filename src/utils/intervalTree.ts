export interface Interval {
  start: number;
  end: number;
}

export class IntervalTree {
  private intervals: Interval[] = [];

  add(start: number, end: number): this {
    this.intervals.push({ start, end });
    this.intervals.sort((a, b) => a.start - b.start);
    return this;
  }

  remove(start: number, end: number): this {
    this.intervals = this.intervals.filter(
      (i) => !(i.start === start && i.end === end)
    );
    return this;
  }

  query(point: number): Interval[] {
    return this.intervals.filter(
      (i) => i.start <= point && i.end >= point
    );
  }

  overlaps(interval: Interval): Interval[] {
    return this.intervals.filter(
      (i) => !(i.end < interval.start || i.start > interval.end)
    );
  }

  contains(interval: Interval): boolean {
    return this.intervals.some(
      (i) => i.start <= interval.start && i.end >= interval.end
    );
  }

  isEmpty(): boolean {
    return this.intervals.length === 0;
  }

  clear(): void {
    this.intervals = [];
  }

  getAll(): Interval[] {
    return [...this.intervals];
  }

  merge(): Interval[] {
    if (this.intervals.length === 0) return [];
    const merged: Interval[] = [this.intervals[0]!];
    for (let i = 1; i < this.intervals.length; i++) {
      const last = merged[merged.length - 1]!;
      const current = this.intervals[i]!;
      if (current.start <= last.end + 1) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push(current);
      }
    }
    return merged;
  }
}

export class SegmentTree {
  private tree: number[];
  private size: number;

  constructor(size: number) {
    this.size = size;
    this.tree = new Array(4 * size).fill(0);
  }

  build(node: number, start: number, end: number, values?: number[]): void {
    if (start === end) {
      this.tree[node] = values?.[start] ?? 0;
    } else {
      const mid = Math.floor((start + end) / 2);
      this.build(node * 2, start, mid, values);
      this.build(node * 2 + 1, mid + 1, end, values);
      this.tree[node] = this.tree[node * 2] + this.tree[node * 2 + 1];
    }
  }

  update(node: number, start: number, end: number, index: number, value: number): void {
    if (start === end) {
      this.tree[node] = value;
    } else {
      const mid = Math.floor((start + end) / 2);
      if (index <= mid) {
        this.update(node * 2, start, mid, index, value);
      } else {
        this.update(node * 2 + 1, mid + 1, end, index, value);
      }
      this.tree[node] = this.tree[node * 2] + this.tree[node * 2 + 1];
    }
  }

  query(node: number, start: number, end: number, left: number, right: number): number {
    if (right < start || left > end) return 0;
    if (left <= start && end <= right) return this.tree[node];
    const mid = Math.floor((start + end) / 2);
    return (
      this.query(node * 2, start, mid, left, right) +
      this.query(node * 2 + 1, mid + 1, end, left, right)
    );
  }

  buildWithValues(values?: number[]): void {
    this.build(1, 0, this.size - 1, values);
  }

  updateIndex(index: number, value: number): void {
    this.update(1, 0, this.size - 1, index, value);
  }

  rangeQuery(left: number, right: number): number {
    return this.query(1, 0, this.size - 1, left, right);
  }

  getSize(): number {
    return this.size;
  }
}

export class FenwickTree {
  private tree: number[];
  private size: number;

  constructor(size: number) {
    this.size = size;
    this.tree = new Array(size + 1).fill(0);
  }

  update(index: number, delta: number): void {
    index++;
    while (index <= this.size) {
      this.tree[index] += delta;
      index += index & -index;
    }
  }

  query(index: number): number {
    index++;
    let sum = 0;
    while (index > 0) {
      sum += this.tree[index];
      index -= index & -index;
    }
    return sum;
  }

  rangeQuery(left: number, right: number): number {
    return this.query(right) - (left > 0 ? this.query(left - 1) : 0);
  }

  findPrefixSum(target: number): number {
    let index = 0;
    let bitMask = 1 << (Math.floor(Math.log2(this.size)) + 1);
    while (bitMask !== 0) {
      const nextIndex = index + bitMask;
      if (nextIndex <= this.size && this.tree[nextIndex] <= target) {
        target -= this.tree[nextIndex];
        index = nextIndex;
      }
      bitMask >>= 1;
    }
    return index;
  }
}
