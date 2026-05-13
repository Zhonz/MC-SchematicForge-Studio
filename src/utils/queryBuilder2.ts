export interface QueryCondition {
  field: string
  operator: string
  value?: unknown
  secondValue?: unknown
}

export interface QuerySort {
  field: string
  direction: 'asc' | 'desc'
}

export interface QueryOptions {
  conditions?: QueryCondition[]
  sort?: QuerySort[]
  limit?: number
  offset?: number
  distinct?: boolean
  groupBy?: string[]
  having?: QueryCondition[]
}

export class QueryBuilder<T extends Record<string, unknown> = Record<string, unknown>> {
  private conditions: QueryCondition[] = []
  private sortConfig: QuerySort[] = []
  private limitValue?: number
  private offsetValue?: number
  private distinctValue: boolean = false
  private groupByFields: string[] = []
  private havingConditions: QueryCondition[] = []
  private data: T[] = []

  from(data: T[]): this {
    this.data = [...data]
    return this
  }

  where(field: string, operator: string, value?: unknown, secondValue?: unknown): this {
    this.conditions.push({ field, operator, value, secondValue })
    return this
  }

  and(field: string, operator: string, value?: unknown, secondValue?: unknown): this {
    return this.where(field, operator, value, secondValue)
  }

  or(field: string, operator: string, value?: unknown, secondValue?: unknown): this {
    this.conditions.push({ field, operator, value, secondValue })
    return this
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.sortConfig.push({ field, direction })
    return this
  }

  groupBy(...fields: string[]): this {
    this.groupByFields.push(...fields)
    return this
  }

  having(field: string, operator: string, value?: unknown): this {
    this.havingConditions.push({ field, operator, value })
    return this
  }

  limit(limit: number): this {
    this.limitValue = limit
    return this
  }

  offset(offset: number): this {
    this.offsetValue = offset
    return this
  }

  distinct(): this {
    this.distinctValue = true
    return this
  }

  select(...fields: string[]): T[] {
    let result = [...this.data]

    if (this.conditions.length > 0) {
      result = result.filter(item => this.evaluateConditions(item))
    }

    if (this.groupByFields.length > 0) {
      result = this.groupByResults(result)
    }

    if (this.havingConditions.length > 0) {
      result = result.filter(item => this.evaluateHaving(item))
    }

    if (this.sortConfig.length > 0) {
      result = this.sortResults(result)
    }

    if (fields.length > 0) {
      result = result.map(item => {
        const newItem: Record<string, unknown> = {}
        fields.forEach(f => {
          newItem[f] = item[f as keyof T]
        })
        return newItem as T
      })
    }

    if (this.limitValue !== undefined) {
      const start = this.offsetValue || 0
      result = result.slice(start, start + this.limitValue)
    }

    if (this.distinctValue) {
      result = this.distinctResults(result)
    }

    return result
  }

  count(): number {
    return this.select().length
  }

  first(): T | undefined {
    const result = this.limit(1).select()
    return result[0]
  }

  last(): T | undefined {
    const originalSort = [...this.sortConfig]
    this.sortConfig = [{ field: '__index', direction: 'desc' }]
    const result = this.select()
    this.sortConfig = originalSort
    return result[0]
  }

  exists(): boolean {
    return this.count() > 0
  }

  sum(field: string): number {
    const items = this.select()
    return items.reduce((acc, item) => acc + ((item as Record<string, unknown>)[field] as number || 0), 0)
  }

  avg(field: string): number {
    const items = this.select()
    if (items.length === 0) return 0
    return this.sum(field) / items.length
  }

  min(field: string): number | undefined {
    const items = this.select()
    if (items.length === 0) return undefined
    return Math.min(...items.map(item => (item as Record<string, unknown>)[field] as number || 0))
  }

  max(field: string): number | undefined {
    const items = this.select()
    if (items.length === 0) return undefined
    return Math.max(...items.map(item => (item as Record<string, unknown>)[field] as number || 0))
  }

  private evaluateConditions(item: T): boolean {
    if (this.conditions.length === 0) return true

    for (const condition of this.conditions) {
      const itemValue = item[condition.field as keyof T]
      if (!this.evaluate(itemValue, condition.operator, condition.value, condition.secondValue)) {
        return false
      }
    }

    return true
  }

  private evaluate(itemValue: unknown, operator: string, value?: unknown, secondValue?: unknown): boolean {
    switch (operator) {
      case 'eq': return itemValue === value
      case 'neq': return itemValue !== value
      case 'gt': return (itemValue as number) > (value as number)
      case 'gte': return (itemValue as number) >= (value as number)
      case 'lt': return (itemValue as number) < (value as number)
      case 'lte': return (itemValue as number) <= (value as number)
      case 'contains': return String(itemValue).includes(String(value))
      case 'startsWith': return String(itemValue).startsWith(String(value))
      case 'endsWith': return String(itemValue).endsWith(String(value))
      case 'in': return Array.isArray(value) && value.includes(itemValue)
      case 'between': return (itemValue as number) >= (value as number) && (itemValue as number) <= (secondValue as number)
      case 'isNull': return itemValue === null || itemValue === undefined
      case 'isNotNull': return itemValue !== null && itemValue !== undefined
      case 'isEmpty': return itemValue === '' || itemValue === null || itemValue === undefined || (Array.isArray(itemValue) && itemValue.length === 0)
      case 'isNotEmpty': return itemValue !== '' && itemValue !== null && itemValue !== undefined && !(Array.isArray(itemValue) && itemValue.length === 0)
      case 'matches': return value instanceof RegExp ? value.test(String(itemValue)) : false
      default: return true
    }
  }

  private sortResults(items: T[]): T[] {
    return [...items].sort((a, b) => {
      for (const sortItem of this.sortConfig) {
        const aVal = a[sortItem.field as keyof T]
        const bVal = b[sortItem.field as keyof T]

        let cmp = 0
        if (aVal < bVal) cmp = -1
        else if (aVal > bVal) cmp = 1

        if (cmp !== 0) {
          return sortItem.direction === 'desc' ? -cmp : cmp
        }
      }
      return 0
    })
  }

  private groupByResults(items: T[]): T[] {
    if (this.groupByFields.length === 0) return items

    const groups = new Map<string, T[]>()
    for (const item of items) {
      const key = this.groupByFields.map(field => item[field as keyof T]).join('|')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }

    return Array.from(groups.values()).map(group => group[0])
  }

  private evaluateHaving(item: T): boolean {
    for (const condition of this.havingConditions) {
      const itemValue = item[condition.field as keyof T]
      if (!this.evaluate(itemValue, condition.operator, condition.value)) {
        return false
      }
    }
    return true
  }

  private distinctResults(items: T[]): T[] {
    const seen = new Set<string>()
    return items.filter(item => {
      const key = JSON.stringify(item)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  reset(): this {
    this.conditions = []
    this.sortConfig = []
    this.limitValue = undefined
    this.offsetValue = undefined
    this.distinctValue = false
    this.groupByFields = []
    this.havingConditions = []
    return this
  }

  clone(): QueryBuilder<T> {
    const builder = new QueryBuilder<T>()
    builder.data = [...this.data]
    builder.conditions = [...this.conditions]
    builder.sortConfig = [...this.sortConfig]
    builder.limitValue = this.limitValue
    builder.offsetValue = this.offsetValue
    builder.distinctValue = this.distinctValue
    builder.groupByFields = [...this.groupByFields]
    builder.havingConditions = [...this.havingConditions]
    return builder
  }
}

export function query<T extends Record<string, unknown> = Record<string, unknown>>(data: T[]): QueryBuilder<T> {
  return new QueryBuilder<T>().from(data)
}
