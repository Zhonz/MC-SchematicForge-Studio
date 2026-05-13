export interface VirtualScrollOptions<T> {
  items: T[]
  itemHeight: number
  overscan?: number
  renderItem: (item: T, index: number) => HTMLElement
  container: HTMLElement
}

export class VirtualScroller<T> {
  private items: T[]
  private itemHeight: number
  private overscan: number
  private renderItem: (item: T, index: number) => HTMLElement
  private container: HTMLElement
  private scrollTop: number = 0
  private containerHeight: number = 0
  private visibleItems: Map<number, HTMLElement> = new Map()
  private content: HTMLElement
  private removeScrollListener: (() => void) | null = null

  constructor(options: VirtualScrollOptions<T>) {
    this.items = options.items
    this.itemHeight = options.itemHeight
    this.overscan = options.overscan ?? 3
    this.renderItem = options.renderItem
    this.container = options.container

    this.content = document.createElement('div')
    this.content.style.position = 'relative'
    this.content.style.height = `${this.items.length * this.itemHeight}px`
    this.container.appendChild(this.content)

    this.containerHeight = this.container.clientHeight

    this.removeScrollListener = this.addEventListener(this.container, 'scroll', this.onScroll)
    this.render()
  }

  private addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void
  ): () => void {
    const wrapped = handler as EventListener
    element.addEventListener(event, wrapped)
    return () => element.removeEventListener(event, wrapped)
  }

  private onScroll = (): void => {
    this.scrollTop = this.container.scrollTop
    this.render()
  }

  private render(): void {
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.overscan)
    const endIndex = Math.min(
      this.items.length,
      Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight) + this.overscan
    )

    const currentIndices = new Set<number>()
    for (let i = startIndex; i < endIndex; i++) {
      currentIndices.add(i)
    }

    for (const [index] of this.visibleItems) {
      if (!currentIndices.has(index)) {
        const el = this.visibleItems.get(index)!
        el.remove()
        this.visibleItems.delete(index)
      }
    }

    for (let i = startIndex; i < endIndex; i++) {
      if (!this.visibleItems.has(i)) {
        const el = this.renderItem(this.items[i], i)
        el.style.position = 'absolute'
        el.style.top = `${i * this.itemHeight}px`
        el.style.left = '0'
        el.style.right = '0'
        el.style.height = `${this.itemHeight}px`
        this.content.appendChild(el)
        this.visibleItems.set(i, el)
      }
    }
  }

  setItems(items: T[]): void {
    this.items = items
    this.content.style.height = `${this.items.length * this.itemHeight}px`
    this.clear()
    this.render()
  }

  clear(): void {
    for (const [, el] of this.visibleItems) {
      el.remove()
    }
    this.visibleItems.clear()
  }

  scrollToIndex(index: number): void {
    this.container.scrollTop = index * this.itemHeight
  }

  scrollToItem(predicate: (item: T) => boolean): void {
    const index = this.items.findIndex(predicate)
    if (index !== -1) {
      this.scrollToIndex(index)
    }
  }

  getVisibleRange(): { start: number; end: number } {
    const start = Math.floor(this.scrollTop / this.itemHeight)
    const end = Math.min(this.items.length, Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight))
    return { start, end }
  }

  destroy(): void {
    this.removeScrollListener?.()
    this.clear()
    this.content.remove()
  }
}

export function virtualScroll<T>(options: VirtualScrollOptions<T>): VirtualScroller<T> {
  return new VirtualScroller(options)
}
