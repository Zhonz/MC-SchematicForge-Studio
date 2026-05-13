export type ComparisonOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'nin' | 'between' | 'isNull' | 'isNotNull' | 'isEmpty' | 'isNotEmpty'

export interface FilterDefinition {
  field: string
  operator: ComparisonOperator
  value?: unknown
  label?: string
}

export interface SortDefinition {
  field: string
  direction: 'asc' | 'desc'
  label?: string
}

export interface FilterGroup {
  id: string
  filters: FilterDefinition[]
  logic: 'and' | 'or'
}

export interface FilterPreset {
  id: string
  name: string
  groups: FilterGroup[]
  sort?: SortDefinition
}

export class FilterBuilder<T extends Record<string, unknown> = Record<string, unknown>> {
  private groups: FilterGroup[] = []
  private sort: SortDefinition[] = []
  private presets: Map<string, FilterPreset> = new Map()

  addGroup(logic: 'and' | 'or' = 'and'): this {
    this.groups.push({
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filters: [],
      logic
    })
    return this
  }

  addFilter(field: string, operator: ComparisonOperator, value?: unknown, label?: string): this {
    if (this.groups.length === 0) {
      this.addGroup()
    }

    const currentGroup = this.groups[this.groups.length - 1]
    currentGroup.filters.push({
      field,
      operator,
      value,
      label: label || `${field} ${operator}`
    })
    return this
  }

  eq(field: string, value: unknown, label?: string): this {
    return this.addFilter(field, 'eq', value, label)
  }

  neq(field: string, value: unknown, label?: string): this {
    return this.addFilter(field, 'neq', value, label)
  }

  gt(field: string, value: number, label?: string): this {
    return this.addFilter(field, 'gt', value, label)
  }

  gte(field: string, value: number, label?: string): this {
    return this.addFilter(field, 'gte', value, label)
  }

  lt(field: string, value: number, label?: string): this {
    return this.addFilter(field, 'lt', value, label)
  }

  lte(field: string, value: number, label?: string): this {
    return this.addFilter(field, 'lte', value, label)
  }

  contains(field: string, value: string, label?: string): this {
    return this.addFilter(field, 'contains', value, label)
  }

  startsWith(field: string, value: string, label?: string): this {
    return this.addFilter(field, 'startsWith', value, label)
  }

  endsWith(field: string, value: string, label?: string): this {
    return this.addFilter(field, 'endsWith', value, label)
  }

  in(field: string, values: unknown[], label?: string): this {
    return this.addFilter(field, 'in', values, label)
  }

  between(field: string, min: number, max: number, label?: string): this {
    return this.addFilter(field, 'between', [min, max], label)
  }

  isNull(field: string, label?: string): this {
    return this.addFilter(field, 'isNull', undefined, label)
  }

  isEmpty(field: string, label?: string): this {
    return this.addFilter(field, 'isEmpty', undefined, label)
  }

  and(): this {
    this.groups.push({
      id: `group-${Date.now()}`,
      filters: [],
      logic: 'and'
    })
    return this
  }

  or(): this {
    this.groups.push({
      id: `group-${Date.now()}`,
      filters: [],
      logic: 'or'
    })
    return this
  }

  sortBy(field: string, direction: 'asc' | 'desc' = 'asc', label?: string): this {
    this.sort.push({ field, direction, label })
    return this
  }

  apply(data: T[]): T[] {
    if (this.groups.length === 0) {
      return this.applySort([...data])
    }

    return data.filter(item => {
      return this.groups.every(group => {
        const groupResults = group.filters.map(filter => 
          this.evaluateFilter(item, filter)
        )

        if (group.logic === 'and') {
          return groupResults.every(Boolean)
        } else {
          return groupResults.some(Boolean)
        }
      })
    })
  }

  private evaluateFilter(item: T, filter: FilterDefinition): boolean {
    const value = this.getFieldValue(item, filter.field)

    switch (filter.operator) {
      case 'eq':
        return value === filter.value
      case 'neq':
        return value !== filter.value
      case 'gt':
        return typeof value === 'number' && typeof filter.value === 'number' && value > filter.value
      case 'gte':
        return typeof value === 'number' && typeof filter.value === 'number' && value >= filter.value
      case 'lt':
        return typeof value === 'number' && typeof filter.value === 'number' && value < filter.value
      case 'lte':
        return typeof value === 'number' && typeof filter.value === 'number' && value <= filter.value
      case 'contains':
        return typeof value === 'string' && typeof filter.value === 'string' && value.includes(filter.value)
      case 'startsWith':
        return typeof value === 'string' && typeof filter.value === 'string' && value.startsWith(filter.value)
      case 'endsWith':
        return typeof value === 'string' && typeof filter.value === 'string' && value.endsWith(filter.value)
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value)
      case 'nin':
        return Array.isArray(filter.value) && !filter.value.includes(value)
      case 'between':
        return Array.isArray(filter.value) && filter.value.length === 2 && 
               typeof value === 'number' && value >= filter.value[0] && value <= filter.value[1]
      case 'isNull':
        return value === null || value === undefined
      case 'isNotNull':
        return value !== null && value !== undefined
      case 'isEmpty':
        return value === '' || value === null || value === undefined || 
               (Array.isArray(value) && value.length === 0)
      case 'isNotEmpty':
        return value !== '' && value !== null && value !== undefined &&
               !(Array.isArray(value) && value.length === 0)
      default:
        return true
    }
  }

  private getFieldValue(obj: T, path: string): unknown {
    const parts = path.split('.')
    let value: unknown = obj

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined
      }
      value = (value as Record<string, unknown>)[part]
    }

    return value
  }

  private applySort(data: T[]): T[] {
    if (this.sort.length === 0) {
      return data
    }

    return [...data].sort((a, b) => {
      for (const sortDef of this.sort) {
        const aVal = this.getFieldValue(a, sortDef.field)
        const bVal = this.getFieldValue(b, sortDef.field)

        if (aVal === bVal) continue
        if (aVal === null || aVal === undefined) return sortDef.direction === 'asc' ? 1 : -1
        if (bVal === null || bVal === undefined) return sortDef.direction === 'asc' ? -1 : 1

        const cmp = aVal < bVal ? -1 : 1
        return sortDef.direction === 'asc' ? -cmp : cmp
      }
      return 0
    })
  }

  savePreset(id: string, name: string): FilterPreset {
    const preset: FilterPreset = {
      id,
      name,
      groups: [...this.groups],
      sort: this.sort[0]
    }
    this.presets.set(id, preset)
    return preset
  }

  loadPreset(id: string): boolean {
    const preset = this.presets.get(id)
    if (!preset) return false

    this.groups = [...preset.groups]
    this.sort = preset.sort ? [preset.sort] : []
    return true
  }

  getPresets(): FilterPreset[] {
    return Array.from(this.presets.values())
  }

  clear(): this {
    this.groups = []
    this.sort = []
    return this
  }

  toJSON(): { groups: FilterGroup[]; sort: SortDefinition[] } {
    return {
      groups: [...this.groups],
      sort: [...this.sort]
    }
  }

  fromJSON(json: { groups: FilterGroup[]; sort?: SortDefinition[] }): this {
    this.groups = [...json.groups]
    this.sort = json.sort ? [...json.sort] : []
    return this
  }
}

export function createFilter<T extends Record<string, unknown> = Record<string, unknown>>(): FilterBuilder<T> {
  return new FilterBuilder<T>()
}
