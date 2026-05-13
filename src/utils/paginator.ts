export interface PaginationOptions {
  total: number
  page?: number
  pageSize?: number
  siblingCount?: number
  boundaryCount?: number
}

export interface PaginationState {
  currentPage: number
  totalPages: number
  startPage: number
  endPage: number
  pages: (number | 'ellipsis')[]
}

export class Paginator {
  private total: number
  private pageSize: number
  private currentPage: number
  private siblingCount: number
  private boundaryCount: number

  constructor(options: PaginationOptions) {
    this.total = options.total
    this.pageSize = options.pageSize || 10
    this.currentPage = options.page || 1
    this.siblingCount = options.siblingCount ?? 1
    this.boundaryCount = options.boundaryCount ?? 1
  }

  getState(): PaginationState {
    const totalPages = Math.ceil(this.total / this.pageSize)
    
    if (totalPages <= 0) {
      return {
        currentPage: 1,
        totalPages: 0,
        startPage: 1,
        endPage: 0,
        pages: []
      }
    }

    const pages = this.generatePages()
    
    return {
      currentPage: this.currentPage,
      totalPages,
      startPage: 1,
      endPage: totalPages,
      pages
    }
  }

  private generatePages(): (number | 'ellipsis')[] {
    const totalPages = Math.ceil(this.total / this.pageSize)
    const { currentPage } = this

    const range = (start: number, end: number): number[] => {
      return Array.from({ length: end - start + 1 }, (_, i) => start + i)
    }

    const boundaryStart = range(1, Math.min(this.boundaryCount, totalPages))
    const boundaryEnd = range(Math.max(1, totalPages - this.boundaryCount + 1), totalPages)

    const siblingsStart = Math.max(
      Math.min(
        currentPage - this.siblingCount,
        totalPages - this.boundaryCount - this.siblingCount * 2 - 1
      ),
      this.boundaryCount + 2
    )
    const siblingsEnd = Math.min(
      Math.max(
        currentPage + this.siblingCount,
        this.boundaryCount + this.siblingCount * 2 + 2
      ),
      totalPages - this.boundaryCount - 1
    )

    const showLeftEllipsis = siblingsStart > this.boundaryCount + 2
    const showRightEllipsis = siblingsEnd < totalPages - this.boundaryCount - 1

    if (showLeftEllipsis && !showRightEllipsis) {
      const leftRange = range(this.boundaryCount + 2, siblingsEnd)
      return [...boundaryStart, 'ellipsis', ...leftRange, ...boundaryEnd]
    }

    if (!showLeftEllipsis && showRightEllipsis) {
      const rightRange = range(siblingsStart, totalPages - this.boundaryCount - 1)
      return [...boundaryStart, ...rightRange, 'ellipsis', ...boundaryEnd]
    }

    if (showLeftEllipsis && showRightEllipsis) {
      const middleRange = range(siblingsStart, siblingsEnd)
      return [...boundaryStart, 'ellipsis', ...middleRange, 'ellipsis', ...boundaryEnd]
    }

    const middleRange = range(this.boundaryCount + 1, totalPages - this.boundaryCount)
    return [...boundaryStart, ...middleRange, ...boundaryEnd]
  }

  goTo(page: number): void {
    this.currentPage = Math.max(1, Math.min(page, this.getState().totalPages))
  }

  next(): void {
    this.goTo(this.currentPage + 1)
  }

  prev(): void {
    this.goTo(this.currentPage - 1)
  }

  first(): void {
    this.goTo(1)
  }

  last(): void {
    this.goTo(this.getState().totalPages)
  }

  getOffset(): number {
    return (this.currentPage - 1) * this.pageSize
  }

  getLimit(): number {
    return this.pageSize
  }

  hasNext(): boolean {
    return this.currentPage < this.getState().totalPages
  }

  hasPrev(): boolean {
    return this.currentPage > 1
  }

  setPageSize(pageSize: number): void {
    const currentOffset = (this.currentPage - 1) * this.pageSize
    this.pageSize = pageSize
    this.currentPage = Math.max(1, Math.ceil((currentOffset + 1) / this.pageSize))
  }

  setTotal(total: number): void {
    this.total = total
    this.currentPage = Math.max(1, Math.min(this.currentPage, Math.ceil(total / this.pageSize) || 1))
  }
}

export function createPagination(options: PaginationOptions): Paginator {
  return new Paginator(options)
}

export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return range(1, totalPages)
  }

  const halfVisible = Math.floor(maxVisible / 2)
  let startPage = currentPage - halfVisible
  let endPage = currentPage + halfVisible

  if (startPage < 1) {
    startPage = 1
    endPage = maxVisible
  }

  if (endPage > totalPages) {
    endPage = totalPages
    startPage = totalPages - maxVisible + 1
  }

  const pages: (number | 'ellipsis')[] = []

  if (startPage > 1) {
    pages.push(1)
    if (startPage > 2) {
      pages.push('ellipsis')
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push('ellipsis')
    }
    pages.push(totalPages)
  }

  return pages
}

export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}
