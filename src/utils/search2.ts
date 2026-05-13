export type SearchAlgorithm = 'linear' | 'binary' | 'interpolation'

export class Search {
  linear<T>(items: T[], predicate: (item: T) => boolean): number {
    for (let i = 0; i < items.length; i++) {
      if (predicate(items[i])) {
        return i
      }
    }
    return -1
  }

  binary<T>(items: T[], target: T, compare: (a: T, b: T) => number): number {
    let low = 0
    let high = items.length - 1

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const comparison = compare(items[mid], target)

      if (comparison === 0) {
        return mid
      } else if (comparison < 0) {
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    return -1
  }

  interpolation(items: number[], target: number): number {
    let low = 0
    let high = items.length - 1

    while (low <= high && target >= items[low] && target <= items[high]) {
      if (low === high) {
        if (items[low] === target) return low
        return -1
      }

      const pos = low + Math.floor(
        ((target - items[low]) * (high - low)) / (items[high] - items[low])
      )

      if (items[pos] === target) {
        return pos
      } else if (items[pos] < target) {
        low = pos + 1
      } else {
        high = pos - 1
      }
    }

    return -1
  }

  findAll<T>(items: T[], predicate: (item: T) => boolean): number[] {
    const indices: number[] = []
    for (let i = 0; i < items.length; i++) {
      if (predicate(items[i])) {
        indices.push(i)
      }
    }
    return indices
  }

  fuzzy(text: string, pattern: string, threshold: number = 0.5): number {
    const textLower = text.toLowerCase()
    const patternLower = pattern.toLowerCase()

    if (patternLower.includes(textLower)) return 1

    const matchLength = this.longestCommonSubstring(textLower, patternLower).length
    const score = (2.0 * matchLength) / (textLower.length + patternLower.length)

    return score >= threshold ? score : 0
  }

  private longestCommonSubstring(s1: string, s2: string): string {
    const m = s1.length
    const n = s2.length
    let maxLen = 0
    let endIndex = 0

    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
          if (dp[i][j] > maxLen) {
            maxLen = dp[i][j]
            endIndex = i
          }
        }
      }
    }

    return s1.substring(endIndex - maxLen, endIndex)
  }

  wildcard(text: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')

    return new RegExp(`^${regexPattern}$`, 'i').test(text)
  }

  regex(text: string, pattern: RegExp): boolean {
    return pattern.test(text)
  }

  LevenshteinDistance(s1: string, s2: string): number {
    const m = s1.length
    const n = s2.length
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
        }
      }
    }

    return dp[m][n]
  }

  similarity(s1: string, s2: string): number {
    const maxLen = Math.max(s1.length, s2.length)
    if (maxLen === 0) return 1
    return 1 - this.LevenshteinDistance(s1, s2) / maxLen
  }

  contains<T>(items: T[], item: T, compare: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
    return items.some(i => compare(i, item))
  }

  findDuplicates<T>(items: T[], compare: (a: T, b: T) => boolean = (a, b) => a === b): T[] {
    const duplicates: T[] = []

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (compare(items[i], items[j])) {
          if (!duplicates.includes(items[i])) {
            duplicates.push(items[i])
          }
        }
      }
    }

    return duplicates
  }
}

export const search = new Search()

export function linearSearch<T>(items: T[], predicate: (item: T) => boolean): number {
  return search.linear(items, predicate)
}

export function binarySearch<T>(items: T[], target: T, compare: (a: T, b: T) => number): number {
  return search.binary(items, target, compare)
}

export function fuzzySearch(text: string, pattern: string, threshold?: number): number {
  return search.fuzzy(text, pattern, threshold)
}

export function levenshteinDistance(s1: string, s2: string): number {
  return search.LevenshteinDistance(s1, s2)
}

export function stringSimilarity(s1: string, s2: string): number {
  return search.similarity(s1, s2)
}
