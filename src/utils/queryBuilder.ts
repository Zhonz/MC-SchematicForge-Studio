export interface QueryOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class QueryBuilder<T> {
  private data: T[] = [];

  constructor(data: T[] = []) {
    this.data = [...data];
  }

  where(predicate: (item: T) => boolean): this {
    this.data = this.data.filter(predicate);
    return this;
  }

  filter(filters: Partial<Record<string, unknown>>): this {
    this.data = this.data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        const itemValue = (item as Record<string, unknown>)[key];
        if (value === null || value === undefined) {
          return itemValue === value;
        }
        if (typeof value === 'string' && value.startsWith('%') && value.endsWith('%')) {
          return String(itemValue).toLowerCase().includes(value.slice(1, -1).toLowerCase());
        }
        return itemValue === value;
      });
    });
    return this;
  }

  orderBy(key: string, order: 'asc' | 'desc' = 'asc'): this {
    this.data = [...this.data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[key];
      const bVal = (b as Record<string, unknown>)[key];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      return order === 'asc' ? 1 : -1;
    });
    return this;
  }

  select<K extends keyof T>(...keys: K[]): Pick<T, K>[] {
    return this.data.map((item) => {
      const result = {} as Pick<T, K>;
      keys.forEach((key) => {
        result[key] = item[key];
      });
      return result;
    });
  }

  limit(count: number): this {
    this.data = this.data.slice(0, count);
    return this;
  }

  offset(count: number): this {
    this.data = this.data.slice(count);
    return this;
  }

  paginate(page: number = 1, pageSize: number = 10): QueryResult<T> {
    const total = this.data.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    return {
      data: this.data.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  first(): T | undefined {
    return this.data[0];
  }

  last(): T | undefined {
    return this.data[this.data.length - 1];
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.data.find(predicate);
  }

  some(predicate: (item: T) => boolean): boolean {
    return this.data.some(predicate);
  }

  every(predicate: (item: T) => boolean): boolean {
    return this.data.every(predicate);
  }

  count(): number {
    return this.data.length;
  }

  distinct<K extends keyof T>(key: K): T[K][] {
    return [...new Set(this.data.map((item) => item[key]))];
  }

  groupBy<K extends keyof T>(key: K): Map<T[K], T[]> {
    const map = new Map<T[K], T[]>();
    this.data.forEach((item) => {
      const groupKey = item[key];
      const group = map.get(groupKey) ?? [];
      group.push(item);
      map.set(groupKey, group);
    });
    return map;
  }

  toArray(): T[] {
    return [...this.data];
  }
}

export function query<T>(data: T[]): QueryBuilder<T> {
  return new QueryBuilder(data);
}
