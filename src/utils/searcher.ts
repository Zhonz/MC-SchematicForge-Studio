export type MatchType = 'exact' | 'partial' | 'fuzzy' | 'regex'

export interface SearchOptions {
  caseSensitive?: boolean
  matchType?: MatchType
  threshold?: number
  keys?: string[]
}

export interface SearchResult<T> {
  item: T
  score: number
  matches: Array<{ key: string; value: unknown; indices: Array<[number, number]> }>
}

export class Search<T extends Record<string, unknown>> {
  private items: T[]
  private options: Required<SearchOptions>

  constructor(items: T[] = [], options: SearchOptions = {}) {
    this.items = items
    this.options = {
      caseSensitive: options.caseSensitive ?? false,
      matchType: options.matchType ?? 'partial',
      threshold: options.threshold ?? 0.4,
      keys: options.keys ?? []
    }
  }

  setItems(items: T[]): void {
    this.items = items
  }

  search(query: string): SearchResult<T>[] {
    if (!query.trim()) {
      return this.items.map(item => ({ item, score: 0, matches: [] }))
    }

    const results: SearchResult<T>[] = []

    for (const item of this.items) {
      const result = this.searchItem(item, query)
      if (result) {
        results.push(result)
      }
    }

    return results.sort((a, b) => b.score - a.score)
  }

  private searchItem(item: T, query: string): SearchResult<T> | null {
    const matches: Array<{ key: string; value: unknown; indices: Array<[number, number]> }> = []
    let totalScore = 0

    const keysToSearch = this.options.keys.length > 0
      ? this.options.keys
      : Object.keys(item)

    for (const key of keysToSearch) {
      const value = item[key]
      if (value === null || value === undefined) continue

      const valueStr = String(value)
      const matchResult = this.matchString(valueStr, query)

      if (matchResult) {
        matches.push({ key, value, indices: matchResult.indices })
        totalScore += matchResult.score
      }
    }

    if (matches.length === 0) {
      return null
    }

    return {
      item,
      score: totalScore / matches.length,
      matches
    }
  }

  private matchString(text: string, query: string): { score: number; indices: Array<[number, number]> } | null {
    if (this.options.matchType === 'exact') {
      return this.exactMatch(text, query)
    } else if (this.options.matchType === 'partial') {
      return this.partialMatch(text, query)
    } else if (this.options.matchType === 'fuzzy') {
      return this.fuzzyMatch(text, query)
    } else if (this.options.matchType === 'regex') {
      try {
        const regex = new RegExp(query, this.options.caseSensitive ? '' : 'i')
        const match = text.match(regex)
        if (match && match.index !== undefined) {
          return {
            score: 1,
            indices: [[match.index, match.index + match[0].length - 1]]
          }
        }
      } catch {
        return null
      }
    }
    return null
  }

  private exactMatch(text: string, query: string): { score: number; indices: Array<[number, number]> } | null {
    const searchText = this.options.caseSensitive ? text : text.toLowerCase()
    const searchQuery = this.options.caseSensitive ? query : query.toLowerCase()

    const index = searchText.indexOf(searchQuery)
    if (index !== -1) {
      return {
        score: query.length / text.length,
        indices: [[index, index + query.length - 1]]
      }
    }
    return null
  }

  private partialMatch(text: string, query: string): { score: number; indices: Array<[number, number]> } | null {
    const searchText = this.options.caseSensitive ? text : text.toLowerCase()
    const searchQuery = this.options.caseSensitive ? query : query.toLowerCase()

    const words = searchQuery.split(/\s+/)
    const allIndices: Array<[number, number]> = []
    let matchedWords = 0

    for (const word of words) {
      const index = searchText.indexOf(word)
      if (index !== -1) {
        allIndices.push([index, index + word.length - 1])
        matchedWords++
      }
    }

    if (matchedWords === 0) return null

    const score = (matchedWords / words.length) * (query.length / text.length)

    return {
      score,
      indices: allIndices.sort((a, b) => a[0] - b[0])
    }
  }

  private fuzzyMatch(text: string, query: string): { score: number; indices: Array<[number, number]> } | null {
    const searchText = this.options.caseSensitive ? text : text.toLowerCase()
    const searchQuery = this.options.caseSensitive ? query : query.toLowerCase()

    let queryIndex = 0
    let textIndex = 0
    const indices: Array<[number, number]> = []
    let matches = 0
    let sequentialMatches = 0
    let lastMatchIndex = -1

    while (queryIndex < searchQuery.length && textIndex < searchText.length) {
      if (searchQuery[queryIndex] === searchText[textIndex]) {
        if (lastMatchIndex === -1 || textIndex === lastMatchIndex + 1) {
          sequentialMatches++
        }
        indices.push([textIndex, textIndex])
        lastMatchIndex = textIndex
        matches++
        queryIndex++
      }
      textIndex++
    }

    if (matches < searchQuery.length * (1 - this.options.threshold)) {
      return null
    }

    const score = (matches / searchQuery.length) * (matches / text.length) * (1 + sequentialMatches / 10)

    return { score, indices }
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate)
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate)
  }
}

export class FuzzySearch<T extends Record<string, unknown>> {
  private searcher: Search<T>

  constructor(items: T[] = [], options: Omit<SearchOptions, 'matchType'> = {}) {
    this.searcher = new Search(items, { ...options, matchType: 'fuzzy' })
  }

  search(query: string): SearchResult<T>[] {
    return this.searcher.search(query)
  }

  setItems(items: T[]): void {
    this.searcher.setItems(items)
  }
}

export function search<T extends Record<string, unknown>>(items: T[], query: string, options?: SearchOptions): SearchResult<T>[] {
  const searcher = new Search(items, options)
  return searcher.search(query)
}
