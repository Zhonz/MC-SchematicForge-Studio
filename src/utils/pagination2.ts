export interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class Paginator<T> {
  private data: T[] = [];

  setData(data: T[]): this {
    this.data = data;
    return this;
  }

  paginate(page: number, pageSize: number): PaginatedResult<T> {
    const total = this.data.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      data: this.data.slice(start, end),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  getPageCount(pageSize: number): number {
    return Math.ceil(this.data.length / pageSize);
  }

  getPage(page: number, pageSize: number): T[] {
    const start = (page - 1) * pageSize;
    return this.data.slice(start, start + pageSize);
  }
}

export function paginate<T>(data: T[], options: PaginationOptions): PaginatedResult<T> {
  const paginator = new Paginator<T>().setData(data);
  return paginator.paginate(options.page, options.pageSize);
}

export interface CursorPaginationOptions {
  cursor: unknown;
  limit: number;
  hasMore: boolean;
}

export class CursorPaginator<T> {
  private data: T[] = [];
  private cursorIndex = 0;

  setData(data: T[]): this {
    this.data = data;
    return this;
  }

  next(cursor: unknown, limit: number): { data: T[]; nextCursor: unknown; hasMore: boolean } {
    const startIndex = this.findCursorIndex(cursor);
    const slice = this.data.slice(startIndex, startIndex + limit + 1);
    const hasMore = slice.length > limit;
    const result = slice.slice(0, limit);
    const nextCursor = hasMore ? this.getCursor(result[result.length - 1]) : null;
    return { data: result, nextCursor, hasMore };
  }

  previous(cursor: unknown, limit: number): { data: T[]; previousCursor: unknown; hasMore: boolean } {
    const endIndex = this.findCursorIndex(cursor);
    const slice = this.data.slice(Math.max(0, endIndex - limit), endIndex);
    const hasMore = endIndex > limit;
    const result = slice.reverse();
    const previousCursor = hasMore ? this.getCursor(result[result.length - 1]) : null;
    return { data: result, previousCursor, hasMore };
  }

  private findCursorIndex(cursor: unknown): number {
    if (cursor === null || cursor === undefined) return 0;
    return this.data.findIndex((item) => this.getCursor(item) === cursor);
  }

  private getCursor(item: T | undefined): unknown {
    if (!item) return null;
    return (item as Record<string, unknown>)['id'] ?? this.data.indexOf(item);
  }
}

export class OffsetPaginator<T> {
  private data: T[] = [];
  private pageSize: number;

  constructor(pageSize: number = 10) {
    this.pageSize = pageSize;
  }

  setData(data: T[]): this {
    this.data = data;
    return this;
  }

  setPageSize(size: number): this {
    this.pageSize = size;
    return this;
  }

  getPage(page: number): T[] {
    const start = (page - 1) * this.pageSize;
    return this.data.slice(start, start + this.pageSize);
  }

  getPageCount(): number {
    return Math.ceil(this.data.length / this.pageSize);
  }

  hasPage(page: number): boolean {
    return page >= 1 && page <= this.getPageCount();
  }

  getRange(start: number, end: number): T[] {
    return this.data.slice(start, end);
  }
}
