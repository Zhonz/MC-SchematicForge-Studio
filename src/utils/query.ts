export type FilterOperator = 
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'in' | 'nin' | 'between' | 'like' | 'regex'
  | 'isNull' | 'isNotNull' | 'isEmpty' | 'isNotEmpty';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: unknown;
  value2?: unknown;
  caseSensitive?: boolean;
}

export interface SortCondition {
  field: string;
  direction?: 'asc' | 'desc';
  comparator?: (a: unknown, b: unknown) => number;
}

export interface QueryOptions {
  filters?: FilterCondition[];
  sort?: SortCondition[];
  limit?: number;
  offset?: number;
  select?: string[];
  distinct?: boolean;
}

export class Query<T = Record<string, unknown>> {
  private data: T[];
  private filters: FilterCondition[] = [];
  private sortConditions: SortCondition[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private selectFields?: string[];
  private distinctEnabled = false;

  constructor(data: T[]) {
    this.data = [...data];
  }

  static from<T>(data: T[]): Query<T> {
    return new Query(data);
  }

  where(field: string, operator: FilterOperator, value?: unknown, value2?: unknown): this {
    this.filters.push({ field, operator, value, value2 });
    return this;
  }

  and(field: string, operator: FilterOperator, value?: unknown, value2?: unknown): this {
    return this.where(field, operator, value, value2);
  }

  or(conditions: FilterCondition[]): this {
    const existingFilters = [...this.filters];
    this.filters = [];
    
    for (const condition of conditions) {
      const combined = [...existingFilters, condition];
      this.filters.push(...combined);
    }
    
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.sortConditions.push({ field, direction });
    return this;
  }

  orderByDesc(field: string): this {
    return this.orderBy(field, 'desc');
  }

  limit(n: number): this {
    this.limitValue = n;
    return this;
  }

  offset(n: number): this {
    this.offsetValue = n;
    return this;
  }

  select(...fields: string[]): this {
    this.selectFields = fields;
    return this;
  }

  distinct(): this {
    this.distinctEnabled = true;
    return this;
  }

  groupBy(field: string): Map<unknown, T[]> {
    const map = new Map<unknown, T[]>();
    for (const item of this.data) {
      const obj = item as Record<string, unknown>;
      const key = obj[field];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }

  aggregate(field: string, fn: (values: unknown[]) => unknown): unknown {
    const values = this.data.map(item => (item as Record<string, unknown>)[field]);
    return fn(values);
  }

  count(field?: string): number {
    if (!field) return this.execute().length;
    return this.execute().filter(item => (item as Record<string, unknown>)[field] !== undefined).length;
  }

  sum(field: string): number {
    return this.execute().reduce((sum, item) => {
      const val = (item as Record<string, unknown>)[field];
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);
  }

  avg(field: string): number {
    const items = this.execute();
    if (items.length === 0) return 0;
    return this.sum(field) / items.length;
  }

  min(field: string): unknown {
    const items = this.execute();
    if (items.length === 0) return undefined;
    return items.reduce((min, item) => {
      const val = (item as Record<string, unknown>)[field];
      if (min === undefined) return val;
      return (val as number) < (min as number) ? val : min;
    }, undefined as unknown);
  }

  max(field: string): unknown {
    const items = this.execute();
    if (items.length === 0) return undefined;
    return items.reduce((max, item) => {
      const val = (item as Record<string, unknown>)[field];
      if (max === undefined) return val;
      return (val as number) > (max as number) ? val : max;
    }, undefined as unknown);
  }

  first(): T | undefined {
    return this.execute()[0];
  }

  last(): T | undefined {
    const result = this.execute();
    return result[result.length - 1];
  }

  execute(): T[] {
    let result = [...this.data];

    for (const filter of this.filters) {
      result = result.filter(item => this.evaluateFilter(item, filter));
    }

    if (this.sortConditions.length > 0) {
      result = this.applySort(result);
    }

    if (this.offsetValue !== undefined) {
      result = result.slice(this.offsetValue);
    }

    if (this.limitValue !== undefined) {
      result = result.slice(0, this.limitValue);
    }

    if (this.distinctEnabled) {
      result = this.applyDistinct(result);
    }

    if (this.selectFields) {
      result = this.applySelect(result);
    }

    return result;
  }

  private evaluateFilter(item: T, filter: FilterCondition): boolean {
    const obj = item as Record<string, unknown>;
    const fieldValue = obj[filter.field];
    const { operator, value, value2, caseSensitive } = filter;

    switch (operator) {
      case 'eq':
        return this.compare(fieldValue, value, caseSensitive) === 0;
      case 'neq':
        return this.compare(fieldValue, value, caseSensitive) !== 0;
      case 'gt':
        return (fieldValue as number) > (value as number);
      case 'gte':
        return (fieldValue as number) >= (value as number);
      case 'lt':
        return (fieldValue as number) < (value as number);
      case 'lte':
        return (fieldValue as number) <= (value as number);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'startsWith':
        return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
      case 'endsWith':
        return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'nin':
        return Array.isArray(value) && !value.includes(fieldValue);
      case 'between':
        return (fieldValue as number) >= (value as number) && (fieldValue as number) <= (value2 as number);
      case 'like':
        return this.matchLike(String(fieldValue), String(value), caseSensitive);
      case 'regex':
        try {
          const regex = new RegExp(String(value), caseSensitive ? '' : 'i');
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
      case 'isNull':
        return fieldValue === null || fieldValue === undefined;
      case 'isNotNull':
        return fieldValue !== null && fieldValue !== undefined;
      case 'isEmpty':
        return fieldValue === '' || fieldValue === null || fieldValue === undefined ||
          (Array.isArray(fieldValue) && fieldValue.length === 0);
      case 'isNotEmpty':
        return fieldValue !== '' && fieldValue !== null && fieldValue !== undefined &&
          !(Array.isArray(fieldValue) && fieldValue.length === 0);
      default:
        return true;
    }
  }

  private compare(a: unknown, b: unknown, caseSensitive?: boolean): number {
    if (a === b) return 0;
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;
    
    if (typeof a === 'string' && typeof b === 'string') {
      const cmp = caseSensitive ? a.localeCompare(b) : a.toLowerCase().localeCompare(b.toLowerCase());
      return cmp;
    }
    
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  private matchLike(value: string, pattern: string, caseSensitive?: boolean): boolean {
    const regexPattern = pattern
      .replace(/[%]/g, '.*')
      .replace(/[_]/g, '.');
    try {
      const regex = new RegExp(`^${regexPattern}$`, caseSensitive ? '' : 'i');
      return regex.test(value);
    } catch {
      return false;
    }
  }

  private applySort(data: T[]): T[] {
    return [...data].sort((a, b) => {
      const objA = a as Record<string, unknown>;
      const objB = b as Record<string, unknown>;
      
      for (const sort of this.sortConditions) {
        const valA = objA[sort.field];
        const valB = objB[sort.field];
        const cmp = this.compare(valA, valB);
        if (cmp !== 0) {
          return sort.direction === 'desc' ? -cmp : cmp;
        }
      }
      return 0;
    });
  }

  private applyDistinct(data: T[]): T[] {
    const seen = new Set<string>();
    return data.filter(item => {
      const key = JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private applySelect(data: T[]): T[] {
    return data.map(item => {
      const obj = item as Record<string, unknown>;
      const selected: Record<string, unknown> = {};
      for (const field of this.selectFields!) {
        selected[field] = obj[field];
      }
      return selected as unknown as T;
    });
  }

  toSQL(): string {
    const parts: string[] = ['SELECT'];
    
    if (this.distinctEnabled) {
      parts.push('DISTINCT');
    }
    
    if (this.selectFields && this.selectFields.length > 0) {
      parts.push(this.selectFields.join(', '));
    } else {
      parts.push('*');
    }
    
    parts.push('FROM data');
    
    if (this.filters.length > 0) {
      const conditions = this.filters.map(f => this.filterToSQL(f)).join(' AND ');
      parts.push(`WHERE ${conditions}`);
    }
    
    if (this.sortConditions.length > 0) {
      const sorts = this.sortConditions.map(s => 
        `${s.field} ${s.direction === 'desc' ? 'DESC' : 'ASC'}`
      ).join(', ');
      parts.push(`ORDER BY ${sorts}`);
    }
    
    if (this.limitValue !== undefined) {
      parts.push(`LIMIT ${this.limitValue}`);
    }
    
    if (this.offsetValue !== undefined) {
      parts.push(`OFFSET ${this.offsetValue}`);
    }
    
    return parts.join(' ');
  }

  private filterToSQL(filter: FilterCondition): string {
    const { field, operator, value, value2 } = filter;
    
    switch (operator) {
      case 'eq': return `${field} = ${this.escapeSQL(value)}`;
      case 'neq': return `${field} != ${this.escapeSQL(value)}`;
      case 'gt': return `${field} > ${this.escapeSQL(value)}`;
      case 'gte': return `${field} >= ${this.escapeSQL(value)}`;
      case 'lt': return `${field} < ${this.escapeSQL(value)}`;
      case 'lte': return `${field} <= ${this.escapeSQL(value)}`;
      case 'contains': return `${field} LIKE '%${value}%'`;
      case 'startsWith': return `${field} LIKE '${value}%'`;
      case 'endsWith': return `${field} LIKE '%${value}'`;
      case 'in': return `${field} IN (${(value as unknown[]).map(v => this.escapeSQL(v)).join(', ')})`;
      case 'nin': return `${field} NOT IN (${(value as unknown[]).map(v => this.escapeSQL(v)).join(', ')})`;
      case 'between': return `${field} BETWEEN ${this.escapeSQL(value)} AND ${this.escapeSQL(value2)}`;
      case 'isNull': return `${field} IS NULL`;
      case 'isNotNull': return `${field} IS NOT NULL`;
      case 'isEmpty': return `(${field} = '' OR ${field} IS NULL)`;
      case 'isNotEmpty': return `(${field} != '' AND ${field} IS NOT NULL)`;
      default: return '1=1';
    }
  }

  private escapeSQL(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? '1' : '0';
    return `'${String(value).replace(/'/g, "''")}'`;
  }
}

export const query = <T>(data: T[]) => Query.from(data);
