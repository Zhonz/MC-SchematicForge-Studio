export class Random {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Date.now();
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  pick<T>(array: T[]): T | undefined {
    return array[Math.floor(this.next() * array.length)];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j]!, result[i]!];
    }
    return result;
  }

  choice<T>(...items: T[]): T {
    return items[Math.floor(this.next() * items.length)]!;
  }

  boolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  string(length: number, charset?: string): string {
    const chars = charset ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[this.nextInt(0, chars.length - 1)];
    }
    return result;
  }

  uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = this.nextInt(0, 15);
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  gaussian(mean: number = 0, stddev: number = 1): number {
    let u = 0, v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stddev;
  }

  poisson(lambda: number): number {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= this.next();
    } while (p > L);
    return k - 1;
  }

  exponential(rate: number = 1): number {
    return -Math.log(1 - this.next()) / rate;
  }
}

export const globalRandom = new Random();

export function weightedRandom<T>(items: Array<{ item: T; weight: number }>): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let random = Math.random() * total;
  for (const { item, weight } of items) {
    random -= weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1]!.item;
}

export function sample<T>(array: T[], count: number, allowDuplicates: boolean = false): T[] {
  if (allowDuplicates) {
    const result: T[] = [];
    for (let i = 0; i < count; i++) {
      result.push(array[Math.floor(Math.random() * array.length)]!);
    }
    return result;
  }
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}
