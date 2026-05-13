export interface PatchOptions {
  compare?: (a: unknown, b: unknown) => boolean;
}

export class Patch<T = unknown> {
  private diffs: Array<[number, T]> = [];

  add(index: number, value: T): this {
    this.diffs.push([index, value]);
    return this;
  }

  remove(index: number): this {
    this.diffs.push([index, undefined as unknown as T]);
    return this;
  }

  getDiffs(): Array<[number, T | undefined]> {
    return this.diffs as Array<[number, T | undefined]>;
  }

  apply(array: T[], options: PatchOptions = {}): T[] {
    const result = [...array];
    const sortedDiffs = [...this.diffs].sort((a, b) => b[0] - a[0]);
    for (const [index, value] of sortedDiffs) {
      if (value === undefined) {
        result.splice(index, 1);
      } else {
        result.splice(index, 0, value);
      }
    }
    return result;
  }

  invert(original: T[]): Patch<T> {
    const inverted = new Patch<T>();
    let offset = 0;
    const sortedDiffs = [...this.diffs].sort((a, b) => a[0] - b[0]);
    for (const [index, value] of sortedDiffs) {
      if (value === undefined) {
        const originalValue = original[index + offset];
        inverted.add(index, originalValue);
        offset--;
      } else {
        inverted.remove(index);
        offset++;
      }
    }
    return inverted;
  }

  compose(other: Patch<T>): Patch<T> {
    return other;
  }

  clear(): void {
    this.diffs = [];
  }
}

export function createPatch<T>(diffs: Array<[number, T | undefined]>): Patch<T> {
  const patch = new Patch<T>();
  diffs.forEach(([index, value]) => {
    if (value === undefined) {
      patch.remove(index);
    } else {
      patch.add(index, value);
    }
  });
  return patch;
}

export function diff<T>(original: T[], target: T[], compare?: (a: T, b: T) => boolean): Patch<T> {
  const patch = new Patch<T>();
  const lcs = longestCommonSubsequence(original, target, compare);
  let oi = 0;
  let ti = 0;
  for (const [o, t] of lcs) {
    while (oi < o) {
      patch.remove(oi);
      oi++;
    }
    while (ti < t) {
      patch.add(oi, target[ti]!);
      ti++;
    }
    oi++;
    ti++;
  }
  while (oi < original.length) {
    patch.remove(oi);
    oi++;
  }
  while (ti < target.length) {
    patch.add(oi, target[ti]!);
    ti++;
  }
  return patch;
}

function longestCommonSubsequence<T>(
  a: T[],
  b: T[],
  compare?: (a: T, b: T) => boolean
): Array<[number, number]> {
  const isEqual = compare ?? ((x: T, y: T) => x === y);
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (isEqual(a[i - 1]!, b[j - 1]!)) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  const result: Array<[number, number]> = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (isEqual(a[i - 1]!, b[j - 1]!)) {
      result.unshift([i - 1, j - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return result;
}

export function patch<T>(original: T[], target: T[], compare?: (a: T, b: T) => boolean): T[] {
  return diff(original, target, compare).apply(original);
}
