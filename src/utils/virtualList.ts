export interface VirtualListOptions<T> {
  items: T[]
  itemHeight: number
  overscan?: number
  buffer?: number
}

export interface VirtualListState {
  scrollTop: number
  visibleStart: number
  visibleEnd: number
  offsetY: number
}

export class VirtualList<T> {
  private items: T[]
  private itemHeight: number
  private overscan: number
  private containerHeight: number = 0
  private scrollTop: number = 0
  private cache: Map<number, { index: number; data: T; height: number }> = new Map()
  private maxCacheSize: number = 100

  constructor(options: VirtualListOptions<T>) {
    this.items = options.items
    this.itemHeight = options.itemHeight
    this.overscan = options.overscan || 3
    this.maxCacheSize = options.buffer || 50
  }

  setItems(items: T[]): void {
    this.items = items
    this.cache.clear()
  }

  setContainerHeight(height: number): void {
    this.containerHeight = height
  }

  setScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop
  }

  getState(): VirtualListState {
    const visibleStart = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.overscan)
    const visibleEnd = Math.min(
      this.items.length,
      Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight) + this.overscan
    )
    const offsetY = visibleStart * this.itemHeight

    return {
      scrollTop: this.scrollTop,
      visibleStart,
      visibleEnd,
      offsetY
    }
  }

  getVisibleItems(): T[] {
    const { visibleStart, visibleEnd } = this.getState()
    const visibleItems: T[] = []

    for (let i = visibleStart; i < visibleEnd; i++) {
      if (i < this.items.length) {
        visibleItems.push(this.items[i])
      }
    }

    return visibleItems
  }

  getTotalHeight(): number {
    return this.items.length * this.itemHeight
  }

  scrollToIndex(index: number, align: 'start' | 'center' | 'end' = 'start'): number {
    let targetScroll = 0

    switch (align) {
      case 'center':
        targetScroll = index * this.itemHeight - this.containerHeight / 2 + this.itemHeight / 2
        break
      case 'end':
        targetScroll = (index + 1) * this.itemHeight - this.containerHeight
        break
      default:
        targetScroll = index * this.itemHeight
    }

    return Math.max(0, Math.min(targetScroll, this.getTotalHeight() - this.containerHeight))
  }

  findIndex(predicate: (item: T) => boolean): number {
    return this.items.findIndex(predicate)
  }

  getItem(index: number): T | undefined {
    return this.items[index]
  }

  get length(): number {
    return this.items.length
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export class FlatList<T> {
  private items: T[]
  private groups: Map<string, T[]> = new Map()
  private groupKeys: string[] = []
  private currentGroup: string | null = null

  constructor(items: T[] = []) {
    this.items = items
  }

  setItems(items: T[]): void {
    this.items = items
  }

  groupBy(getKey: (item: T) => string): void {
    this.groups.clear()
    this.groupKeys = []

    for (const item of this.items) {
      const key = getKey(item)
      if (!this.groups.has(key)) {
        this.groups.set(key, [])
        this.groupKeys.push(key)
      }
      this.groups.get(key)!.push(item)
    }
  }

  filter(predicate: (item: T) => boolean): FlatList<T> {
    return new FlatList(this.items.filter(predicate))
  }

  map<U>(mapper: (item: T, index: number) => U): FlatList<U> {
    return new FlatList(this.items.map(mapper))
  }

  sort(compare: (a: T, b: T) => number): FlatList<T> {
    return new FlatList([...this.items].sort(compare))
  }

  slice(start: number, end?: number): FlatList<T> {
    return new FlatList(this.items.slice(start, end))
  }

  forEach(callback: (item: T, index: number) => void): void {
    this.items.forEach(callback)
  }

  reduce<U>(reducer: (accumulator: U, item: T, index: number) => U, initial: U): U {
    return this.items.reduce(reducer, initial)
  }

  get length(): number {
    return this.items.length
  }

  get isEmpty(): boolean {
    return this.items.length === 0
  }

  get first(): T | undefined {
    return this.items[0]
  }

  get last(): T | undefined {
    return this.items[this.items.length - 1]
  }

  toArray(): T[] {
    return [...this.items]
  }

  *[Symbol.iterator](): Iterator<T> {
    yield* this.items
  }
}

export function createVirtualList<T>(items: T[], itemHeight: number): VirtualList<T> {
  return new VirtualList({ items, itemHeight })
}

export function createFlatList<T>(items: T[] = []): FlatList<T> {
  return new FlatList(items)
}
