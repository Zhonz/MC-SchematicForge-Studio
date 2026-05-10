export interface WikiArticle {
  title: string
  titleZh: string
  extract: string
  thumbnail?: string
  url: string
  categories: string[]
  lastFetched: number
}

export interface WikiSearchResult {
  query: string
  results: WikiArticle[]
  suggestion?: string
}

export interface WikiCacheEntry {
  article: WikiArticle
  timestamp: number
  html: string
}

export interface WikiState {
  searchQuery: string
  currentArticle: WikiArticle | null
  searchResults: WikiSearchResult | null
  isLoading: boolean
  error: string | null
}
