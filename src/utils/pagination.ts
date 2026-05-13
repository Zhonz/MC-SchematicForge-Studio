export interface PaginationOptions {
  page?: number
  pageSize?: number
  total?: number
  siblingCount?: number
  onPageChange?: (page: number) => void
}

export interface PaginationResult {
  currentPage: number
  totalPages: number
  pageSize: number
  total: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  startIndex: number
  endIndex: number
  pages: (number | '...')[]
}

export class Pagination {
  private currentPage: number
  private pageSize: number
  private total: number
  private siblingCount: number
  private onPageChange?: (page: number) => void

  constructor(options: PaginationOptions = {}) {
    this.currentPage = options.page || 1
    this.pageSize = options.pageSize || 10
    this.total = options.total || 0
    this.siblingCount = options.siblingCount || 1
    this.onPageChange = options.onPageChange
  }

  setPage(page: number): void {
    if (page < 1 || page > this.getTotalPages()) return
    this.currentPage = page
    this.onPageChange?.(page)
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.setPage(this.currentPage + 1)
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.setPage(this.currentPage - 1)
    }
  }

  firstPage(): void {
    this.setPage(1)
  }

  lastPage(): void {
    this.setPage(this.getTotalPages())
  }

  getTotalPages(): number {
    return Math.ceil(this.total / this.pageSize)
  }

  hasNextPage(): boolean {
    return this.currentPage < this.getTotalPages()
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 1
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.total)
  }

  getOffset(): number {
    return (this.currentPage - 1) * this.pageSize
  }

  getPages(): (number | '...')[] {
    const totalPages = this.getTotalPages()
    const { currentPage, siblingCount } = this

    if (totalPages <= 2 * siblingCount + 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const showLeftDots = leftSiblingIndex > 2
    const showRightDots = rightSiblingIndex < totalPages - 1

    if (!showLeftDots && showRightDots) {
      const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1)
      return [...leftRange, '...', totalPages]
    }

    if (showLeftDots && !showRightDots) {
      const rightRange = Array.from(
        { length: 3 + 2 * siblingCount },
        (_, i) => totalPages - 2 - 2 * siblingCount + i
      )
      return [1, '...', ...rightRange]
    }

    if (showLeftDots && showRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      )
      return [1, '...', ...middleRange, '...', totalPages]
    }

    return []
  }

  getResult(): PaginationResult {
    return {
      currentPage: this.currentPage,
      totalPages: this.getTotalPages(),
      pageSize: this.pageSize,
      total: this.total,
      hasNextPage: this.hasNextPage(),
      hasPreviousPage: this.hasPreviousPage(),
      startIndex: this.getStartIndex(),
      endIndex: this.getEndIndex(),
      pages: this.getPages()
    }
  }

  setTotal(total: number): void {
    this.total = total
    if (this.currentPage > this.getTotalPages()) {
      this.currentPage = Math.max(1, this.getTotalPages())
    }
  }

  setPageSize(pageSize: number): void {
    const newTotalPages = Math.ceil(this.total / pageSize)
    if (this.currentPage > newTotalPages) {
      this.currentPage = Math.max(1, newTotalPages)
    }
    this.pageSize = pageSize
  }

  getCurrentPage(): number {
    return this.currentPage
  }

  getPageSize(): number {
    return this.pageSize
  }

  getTotal(): number {
    return this.total
  }
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; total: number; page: number; pageSize: number } {
  const total = items.length
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedItems = items.slice(startIndex, endIndex)

  return {
    items: paginatedItems,
    total,
    page,
    pageSize
  }
}

export function createPagination(options?: PaginationOptions): Pagination {
  return new Pagination(options)
}
