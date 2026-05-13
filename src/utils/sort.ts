export type SortOrder = 'asc' | 'desc'

export interface SortableItem<T> {
  item: T
  sortKey: string | number
}

export class QuickSort<T> {
  sort(items: T[], getKey: (item: T) => string | number, order: SortOrder = 'asc'): T[] {
    const sortable: SortableItem<T>[] = items.map(item => ({
      item,
      sortKey: getKey(item)
    }))

    this.quickSort(sortable, 0, sortable.length - 1)

    const result = sortable.map(s => s.item)
    return order === 'desc' ? result.reverse() : result
  }

  private quickSort(items: SortableItem<T>[], low: number, high: number): void {
    if (low < high) {
      const pivot = this.partition(items, low, high)
      this.quickSort(items, low, pivot - 1)
      this.quickSort(items, pivot + 1, high)
    }
  }

  private partition(items: SortableItem<T>[], low: number, high: number): number {
    const pivot = items[high].sortKey
    let i = low - 1

    for (let j = low; j < high; j++) {
      if (items[j].sortKey <= pivot) {
        i++
        this.swap(items, i, j)
      }
    }

    this.swap(items, i + 1, high)
    return i + 1
  }

  private swap(items: SortableItem<T>[], i: number, j: number): void {
    const temp = items[i]
    items[i] = items[j]
    items[j] = temp
  }
}

export class MergeSort<T> {
  sort(items: T[], getKey: (item: T) => string | number, order: SortOrder = 'asc'): T[] {
    if (items.length <= 1) return items

    const mid = Math.floor(items.length / 2)
    const left = this.sort(items.slice(0, mid), getKey, order)
    const right = this.sort(items.slice(mid), getKey, order)

    return this.merge(left, right, getKey, order)
  }

  private merge(left: T[], right: T[], getKey: (item: T) => string | number, order: SortOrder): T[] {
    const result: T[] = []
    let i = 0, j = 0

    while (i < left.length && j < right.length) {
      const leftKey = getKey(left[i])
      const rightKey = getKey(right[j])

      const shouldTake = order === 'asc' ? leftKey <= rightKey : leftKey >= rightKey

      if (shouldTake) {
        result.push(left[i++])
      } else {
        result.push(right[j++])
      }
    }

    return result.concat(left.slice(i)).concat(right.slice(j))
  }
}

export class HeapSort<T> {
  sort(items: T[], getKey: (item: T) => string | number, order: SortOrder = 'asc'): T[] {
    const n = items.length

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      this.heapify(items, n, i, getKey, order)
    }

    for (let i = n - 1; i > 0; i--) {
      this.swap(items, 0, i)
      this.heapify(items, i, 0, getKey, order)
    }

    return order === 'desc' ? items.reverse() : items
  }

  private heapify(items: T[], n: number, i: number, getKey: (item: T) => string | number, order: SortOrder): void {
    let largest = i
    const left = 2 * i + 1
    const right = 2 * i + 2

    const compare = (a: string | number, b: string | number) => {
      return order === 'asc' ? a <= b : a >= b
    }

    if (left < n && compare(getKey(items[left]), getKey(items[largest]))) {
      largest = left
    }

    if (right < n && compare(getKey(items[right]), getKey(items[largest]))) {
      largest = right
    }

    if (largest !== i) {
      this.swap(items, i, largest)
      this.heapify(items, n, largest, getKey, order)
    }
  }

  private swap(items: T[], i: number, j: number): void {
    const temp = items[i]
    items[i] = items[j]
    items[j] = temp
  }
}

export class BubbleSort<T> {
  sort(items: T[], getKey: (item: T) => string | number, order: SortOrder = 'asc'): T[] {
    const n = items.length
    const result = [...items]

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        const a = getKey(result[j])
        const b = getKey(result[j + 1])

        const shouldSwap = order === 'asc' ? a > b : a < b

        if (shouldSwap) {
          const temp = result[j]
          result[j] = result[j + 1]
          result[j + 1] = temp
        }
      }
    }

    return result
  }
}

export class InsertionSort<T> {
  sort(items: T[], getKey: (item: T) => string | number, order: SortOrder = 'asc'): T[] {
    const result = [...items]

    for (let i = 1; i < result.length; i++) {
      const key = getKey(result[i])
      let j = i - 1

      const shouldMove = order === 'asc'
        ? getKey(result[j]) > key
        : getKey(result[j]) < key

      while (j >= 0 && shouldMove) {
        result[j + 1] = result[j]
        j--
      }

      result[j + 1] = items[i]
    }

    return result
  }
}

export type SortAlgorithm = 'quick' | 'merge' | 'heap' | 'bubble' | 'insertion'

export class Sorter {sort<T>(items: T[], getKey: (item: T) => string | number, order: SortOrder = 'asc', algorithm: SortAlgorithm = 'quick'): T[] {
    const quick = new QuickSort<T>()
    const merge = new MergeSort<T>()
    const heap = new HeapSort<T>()
    const bubble = new BubbleSort<T>()
    const insertion = new InsertionSort<T>()

    switch (algorithm) {
      case 'merge':
        return merge.sort(items, getKey, order)
      case 'heap':
        return heap.sort(items, getKey, order)
      case 'bubble':
        return bubble.sort(items, getKey, order)
      case 'insertion':
        return insertion.sort(items, getKey, order)
      default:
        return quick.sort(items, getKey, order)
    }
  }
}

export const sorter = new Sorter()

export function sort<T>(items: T[], getKey: (item: T) => string | number, order?: SortOrder, algorithm?: SortAlgorithm): T[] {
  return sorter.sort(items, getKey, order, algorithm)
}
