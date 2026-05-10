import { WikiArticle, WikiSearchResult, WikiCacheEntry } from '@/types/wiki'

const API_BASE = 'https://minecraft.wiki/api.php'
const WIKI_BASE = 'https://minecraft.wiki/w/'
const ZH_WIKI_BASE = 'https://zh.minecraft.wiki/w/'

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes
const MAX_CACHE_SIZE = 100

const cache = new Map<string, WikiCacheEntry>()

export async function searchWiki(query: string): Promise<WikiSearchResult> {
  if (!query.trim()) {
    return { query: '', results: [] }
  }

  const cacheKey = `search:${query.toLowerCase()}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return {
      query,
      results: [cached.article],
    }
  }

  try {
    const params = new URLSearchParams({
      action: 'opensearch',
      search: query,
      limit: '10',
      namespace: '0',
      format: 'json',
      origin: '*',
    })

    const response = await fetch(`${API_BASE}?${params}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const data = await response.json()
    const titles: string[] = data[1] || []
    const descriptions: string[] = data[2] || []
    const urls: string[] = data[3] || []

    const results: WikiArticle[] = titles.map((title, i) => ({
      title,
      titleZh: title,
      extract: descriptions[i] || '',
      url: urls[i] || `${WIKI_BASE}${encodeURIComponent(title)}`,
      categories: [],
      lastFetched: Date.now(),
    }))

    return { query, results }
  } catch (error) {
    console.error('Wiki search failed:', error)
    return { query, results: [] }
  }
}

export async function fetchArticle(title: string): Promise<{ html: string; article: WikiArticle } | null> {
  const cacheKey = `article:${title}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { html: cached.html, article: cached.article }
  }

  try {
    const params = new URLSearchParams({
      action: 'parse',
      page: title,
      prop: 'text|images|categories|extract',
      format: 'json',
      origin: '*',
      redirects: '1',
    })

    const response = await fetch(`${API_BASE}?${params}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const data = await response.json()
    if (data.error) throw new Error(data.error.info)

    const parse = data.parse
    const html = parse.text?.['*'] || ''
    const extract = parse.extract?.['*'] || parse.extract || ''
    const images = parse.images?.map((img: any) => img['*']) || []
    const thumbnail = images.find((img: string) => img.endsWith('.png') || img.endsWith('.jpg'))?.replace(/.*\//, '')

    const article: WikiArticle = {
      title: parse.title,
      titleZh: parse.title,
      extract: extract.substring(0, 500),
      thumbnail: thumbnail ? `https://minecraft.wiki/images/${thumbnail}` : undefined,
      url: `${WIKI_BASE}${encodeURIComponent(parse.title)}`,
      categories: parse.categories?.map((cat: any) => cat['*']) || [],
      lastFetched: Date.now(),
    }

    if (cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) cache.delete(oldestKey)
    }
    cache.set(cacheKey, { article, timestamp: Date.now(), html })

    return { html, article }
  } catch (error) {
    console.error('Wiki fetch article failed:', error)
    return null
  }
}

export async function fetchBlockWiki(blockName: string): Promise<WikiArticle | null> {
  const mapping: Record<string, string> = {
    'minecraft:stone': 'Stone',
    'minecraft:cobblestone': 'Cobblestone',
    'minecraft:oak_planks': 'Oak_Planks',
    'minecraft:spruce_planks': 'Spruce_Planks',
    'minecraft:birch_planks': 'Birch_Planks',
    'minecraft:bricks': 'Bricks',
    'minecraft:stone_bricks': 'Stone_Bricks',
    'minecraft:glass': 'Glass',
    'minecraft:white_wool': 'White_Wool',
    'minecraft:grass_block': 'Grass_Block',
    'minecraft:dirt': 'Dirt',
    'minecraft:oak_log': 'Oak_Log',
    'minecraft:spruce_log': 'Spruce_Log',
    'minecraft:sand': 'Sand',
    'minecraft:gravel': 'Gravel',
    'minecraft:redstone_block': 'Block_of_Redstone',
    'minecraft:redstone_wire': 'Redstone_Dust',
    'minecraft:redstone_torch': 'Redstone_Torch',
    'minecraft:repeater': 'Redstone_Repeater',
    'minecraft:comparator': 'Redstone_Comparator',
    'minecraft:lever': 'Lever',
    'minecraft:stone_button': 'Stone_Button',
    'minecraft:piston': 'Piston',
    'minecraft:sticky_piston': 'Sticky_Piston',
    'minecraft:observer': 'Observer',
    'minecraft:torch': 'Torch',
    'minecraft:ladder': 'Ladder',
    'minecraft:iron_bars': 'Iron_Bars',
    'minecraft:crafting_table': 'Crafting_Table',
    'minecraft:furnace': 'Furnace',
    'minecraft:chest': 'Chest',
    'minecraft:iron_block': 'Block_of_Iron',
    'minecraft:gold_block': 'Block_of_Gold',
    'minecraft:diamond_block': 'Block_of_Diamond',
  }

  const wikiTitle = mapping[blockName]
  if (!wikiTitle) return null

  const result = await fetchArticle(wikiTitle)
  return result?.article || null
}

export function getWikiUrl(title: string): string {
  return `${WIKI_BASE}${encodeURIComponent(title)}`
}

export function clearCache() {
  cache.clear()
}

export function getCacheSize(): number {
  return cache.size
}
