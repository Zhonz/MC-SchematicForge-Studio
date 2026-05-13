export interface SearchOptions<T> {
  keys: (keyof T | string)[]
  threshold?: number
  ignoreCase?: boolean
  ignoreAccents?: boolean
  matchAll?: boolean
}

export interface SearchResult<T> {
  item: T
  score: number
  matches: Array<{
    key: string
    value: string
    indices: Array<[number, number]>
  }>
}

export class Search<T extends Record<string, unknown>> {
  private items: T[] = []
  private indexedItems: Map<string, string>[] = []
  private options: SearchOptions<T>

  constructor(options: SearchOptions<T>) {
    this.options = {
      threshold: 0.4,
      ignoreCase: true,
      ignoreAccents: true,
      matchAll: false,
      ...options
    }
  }

  setItems(items: T[]): void {
    this.items = items
    this.indexItems()
  }

  private indexItems(): void {
    this.indexedItems = this.items.map(item => {
      const indexed = new Map<string, string>()
      
      for (const key of this.options.keys) {
        const value = this.getNestedValue(item, key as string)
        if (typeof value === 'string') {
          let processed = value
          if (this.options.ignoreCase) {
            processed = processed.toLowerCase()
          }
          if (this.options.ignoreAccents) {
            processed = this.removeAccents(processed)
          }
          indexed.set(key as string, processed)
        }
      }
      
      return indexed
    })
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.')
    let value: unknown = obj
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key]
      } else {
        return undefined
      }
    }
    
    return value
  }

  private removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  search(query: string): SearchResult<T>[] {
    if (!query.trim()) {
      return this.items.map(item => ({
        item,
        score: 0,
        matches: []
      }))
    }

    let processedQuery = query
    if (this.options.ignoreCase) {
      processedQuery = processedQuery.toLowerCase()
    }
    if (this.options.ignoreAccents) {
      processedQuery = this.removeAccents(processedQuery)
    }

    const results: SearchResult<T>[] = []

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i]
      const indexed = this.indexedItems[i]
      let totalScore = 0
      const matches: SearchResult<T>['matches'] = []

      for (const [key, indexedValue] of indexed) {
        const { score, indices } = this.calculateScore(processedQuery, indexedValue)
        
        if (score > 0) {
          totalScore += score
          matches.push({
            key,
            value: String(this.getNestedValue(item, key)),
            indices
          })
        }
      }

      if (totalScore > 0) {
        results.push({
          item,
          score: totalScore,
          matches
        })
      }
    }

    return results
      .filter(result => result.score >= (1 - this.options.threshold!))
      .sort((a, b) => b.score - a.score)
  }

  private calculateScore(query: string, text: string): { score: number; indices: Array<[number, number]> } {
    const indices: Array<[number, number]> = []
    
    if (text.includes(query)) {
      const startIndex = text.indexOf(query)
      indices.push([startIndex, startIndex + query.length - 1])
      return { score: 1, indices }
    }

    const words = query.split(/\s+/)
    let totalScore = 0

    for (const word of words) {
      if (text.includes(word)) {
        const startIndex = text.indexOf(word)
        indices.push([startIndex, startIndex + word.length - 1])
        totalScore += 0.5
      } else {
        const similarity = this.calculateSimilarity(word, text)
        if (similarity >= this.options.threshold!) {
          totalScore += similarity
        }
      }
    }

    return { score: totalScore, indices }
  }

  private calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1
    if (a.length === 0 || b.length === 0) return 0

    const aLower = a.toLowerCase()
    const bLower = b.toLowerCase()

    if (aLower === bLower) return 1

    const matrix: number[][] = Array(a.length + 1)
      .fill(null)
      .map(() => Array(b.length + 1).fill(0))

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = aLower[i - 1] === bLower[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        )
      }
    }

    const distance = matrix[a.length][b.length]
    const maxLength = Math.max(a.length, b.length)
    return 1 - distance / maxLength
  }

  filter(query: string): T[] {
    return this.search(query).map(result => result.item)
  }

  highlight(text: string, query: string): string {
    if (!query.trim()) return text

    const results = this.search(query)
    if (results.length === 0) return text

    const firstMatch = results[0].matches[0]
    if (!firstMatch) return text

    const { indices } = firstMatch
    let highlighted = text
    let offset = 0

    for (const [start, end] of indices) {
      const before = highlighted.substring(0, start + offset)
      const match = highlighted.substring(start + offset, end + offset + 1)
      const after = highlighted.substring(end + offset + 1)
      highlighted = `${before}<mark>${match}</mark>${after}`
      offset += 13
    }

    return highlighted
  }
}

export function createSearch<T extends Record<string, unknown>>(
  items: T[],
  options: SearchOptions<T>
): Search<T> {
  const search = new Search<T>(options)
  search.setItems(items)
  return search
}

export function fuzzySearch<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  keys: (keyof T | string)[]
): T[] {
  const search = createSearch(items, { keys })
  return search.filter(query)
}
