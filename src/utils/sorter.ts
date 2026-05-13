export type SortOrder = 'asc' | 'desc'

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1

  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b)
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  return String(a).localeCompare(String(b))
}

export class Sorter {
  static sort<T>(array: T[], field: keyof T, order: SortOrder = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]
      const cmp = compareValues(aVal, bVal)
      return order === 'desc' ? -cmp : cmp
    })
  }

  static sortBy<T>(array: T[], fieldFn: (item: T) => unknown, order: SortOrder = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aVal = fieldFn(a)
      const bVal = fieldFn(b)
      const cmp = compareValues(aVal, bVal)
      return order === 'desc' ? -cmp : cmp
    })
  }

  static sortWith<T>(array: T[], comparator: (a: T, b: T) => number): T[] {
    return [...array].sort(comparator)
  }

  static sortMultiple<T>(array: T[], configs: Array<{ field: keyof T | ((item: T) => unknown); order?: SortOrder; comparator?: (a: T, b: T) => number }>): T[] {
    return [...array].sort((a, b) => {
      for (const config of configs) {
        let cmp = 0

        if (config.comparator) {
          cmp = config.comparator(a, b)
        } else {
          const aVal = typeof config.field === 'function' ? config.field(a) : a[config.field as keyof T]
          const bVal = typeof config.field === 'function' ? config.field(b) : b[config.field as keyof T]
          cmp = compareValues(aVal, bVal)
        }

        const ord = config.order || 'asc'
        if (cmp !== 0) {
          return ord === 'desc' ? -cmp : cmp
        }
      }
      return 0
    })
  }

  static stableSort<T>(array: T[], field: keyof T, order: SortOrder = 'asc'): T[] {
    return array.map((item, index) => ({ item, index })).sort((a, b) => {
      const cmp = compareValues(a.item[field], b.item[field])
      return order === 'desc' ? -cmp : cmp
    }).map(({ item }) => item)
  }

  static compare(a: unknown, b: unknown): number {
    return compareValues(a, b)
  }

  static isSorted<T>(array: T[], field: keyof T, order: SortOrder = 'asc'): boolean {
    for (let i = 0; i < array.length - 1; i++) {
      const cmp = compareValues(array[i][field], array[i + 1][field])
      if (order === 'asc' && cmp > 0) return false
      if (order === 'desc' && cmp < 0) return false
    }
    return true
  }
}

export class QuickSorter {
  static sort<T>(array: T[], comparator: (a: T, b: T) => number): T[] {
    const arr = [...array]
    QuickSorter.quickSort(arr, 0, arr.length - 1, comparator)
    return arr
  }

  private static quickSort<T>(arr: T[], low: number, high: number, comparator: (a: T, b: T) => number): void {
    if (low < high) {
      const pivot = QuickSorter.partition(arr, low, high, comparator)
      QuickSorter.quickSort(arr, low, pivot - 1, comparator)
      QuickSorter.quickSort(arr, pivot + 1, high, comparator)
    }
  }

  private static partition<T>(arr: T[], low: number, high: number, comparator: (a: T, b: T) => number): number {
    const pivot = arr[high]
    let i = low - 1

    for (let j = low; j < high; j++) {
      if (comparator(arr[j], pivot) <= 0) {
        i++
        QuickSorter.swap(arr, i, j)
      }
    }

    QuickSorter.swap(arr, i + 1, high)
    return i + 1
  }

  private static swap<T>(arr: T[], i: number, j: number): void {
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
}

export class MergeSorter {
  static sort<T>(array: T[], comparator: (a: T, b: T) => number): T[] {
    if (array.length <= 1) return array

    const mid = Math.floor(array.length / 2)
    const left = MergeSorter.sort(array.slice(0, mid), comparator)
    const right = MergeSorter.sort(array.slice(mid), comparator)

    return MergeSorter.merge(left, right, comparator)
  }

  private static merge<T>(left: T[], right: T[], comparator: (a: T, b: T) => number): T[] {
    const result: T[] = []
    let i = 0
    let j = 0

    while (i < left.length && j < right.length) {
      if (comparator(left[i], right[j]) <= 0) {
        result.push(left[i++])
      } else {
        result.push(right[j++])
      }
    }

    return result.concat(left.slice(i)).concat(right.slice(j))
  }
}

export class HeapSorter {
  static sort<T>(array: T[], comparator: (a: T, b: T) => number): T[] {
    const arr = [...array]
    const n = arr.length

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      HeapSorter.heapify(arr, n, i, comparator)
    }

    for (let i = n - 1; i > 0; i--) {
      HeapSorter.swap(arr, 0, i)
      HeapSorter.heapify(arr, i, 0, comparator)
    }

    return arr
  }

  private static heapify<T>(arr: T[], n: number, i: number, comparator: (a: T, b: T) => number): void {
    let largest = i
    const left = 2 * i + 1
    const right = 2 * i + 2

    if (left < n && comparator(arr[left], arr[largest]) > 0) {
      largest = left
    }

    if (right < n && comparator(arr[right], arr[largest]) > 0) {
      largest = right
    }

    if (largest !== i) {
      HeapSorter.swap(arr, i, largest)
      HeapSorter.heapify(arr, n, largest, comparator)
    }
  }

  private static swap<T>(arr: T[], i: number, j: number): void {
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
}

export function sortBy<T>(array: T[], field: keyof T, order: SortOrder = 'asc'): T[] {
  return Sorter.sort(array, field, order)
}

export function sortWith<T>(array: T[], comparator: (a: T, b: T) => number): T[] {
  return Sorter.sortWith(array, comparator)
}
