export type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined' | 'function' | 'symbol' | 'bigint' | 'date'

export interface TypeInfo {
  type: DataType
  isArray: boolean
  isObject: boolean
  isPrimitive: boolean
  isNil: boolean
}

export class TypeUtils {
  static getType(value: unknown): DataType {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'

    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'function') return 'function'
    if (typeof value === 'symbol') return 'symbol'
    if (typeof value === 'bigint') return 'bigint'

    if (value instanceof Date) return 'date'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'object') return 'object'

    return 'undefined'
  }

  static getTypeInfo(value: unknown): TypeInfo {
    const type = this.getType(value)
    return {
      type,
      isArray: type === 'array',
      isObject: type === 'object',
      isPrimitive: ['string', 'number', 'boolean', 'bigint', 'symbol'].includes(type),
      isNil: type === 'null' || type === 'undefined'
    }
  }

  static isString(value: unknown): value is string {
    return typeof value === 'string'
  }

  static isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value)
  }

  static isInteger(value: unknown): value is number {
    return Number.isInteger(value as number)
  }

  static isFloat(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value) && !Number.isInteger(value)
  }

  static isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean'
  }

  static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  static isArray(value: unknown): value is unknown[] {
    return Array.isArray(value)
  }

  static isFunction(value: unknown): value is (...args: unknown[]) => unknown {
    return typeof value === 'function'
  }

  static isNil(value: unknown): value is null | undefined {
    return value === null || value === undefined
  }

  static isEmpty(value: unknown): boolean {
    if (this.isNil(value)) return true
    if (this.isString(value)) return value.length === 0
    if (this.isArray(value)) return value.length === 0
    if (this.isObject(value)) return Object.keys(value).length === 0
    return false
  }

  static isPrimitive(value: unknown): boolean {
    return ['string', 'number', 'boolean', 'bigint', 'symbol'].includes(typeof value)
  }

  static isDate(value: unknown): value is Date {
    return value instanceof Date
  }

  static isPromise(value: unknown): value is Promise<unknown> {
    if (value instanceof Promise) return true
    if (this.isObject(value)) {
      const obj = value as Record<string, unknown>
      return typeof obj.then === 'function' && typeof obj.catch === 'function'
    }
    return false
  }

  static isRegExp(value: unknown): value is RegExp {
    return value instanceof RegExp
  }

  static isError(value: unknown): value is Error {
    return value instanceof Error
  }

  static isClass(value: unknown): boolean {
    if (typeof value !== 'function') return false
    const proto = value.prototype?.constructor === value
    const funcStr = value.toString()
    return proto && (funcStr.startsWith('class ') || funcStr.startsWith('function ') && funcStr.includes('this'))
  }

  static isEnumValue<T>(value: unknown, enumObj: T): value is T[keyof T] {
    const enumValues = Object.values(enumObj as object) as unknown[]
    return enumValues.includes(value)
  }

  static toString(value: unknown): string {
    if (this.isNil(value)) return ''
    if (this.isString(value)) return value
    if (this.isNumber(value)) return value.toString()
    if (this.isBoolean(value)) return value.toString()
    if (this.isDate(value)) return value.toISOString()
    if (this.isArray(value)) return JSON.stringify(value)
    if (this.isObject(value)) return JSON.stringify(value)
    return String(value)
  }

  static toNumber(value: unknown, defaultValue = 0): number {
    if (this.isNumber(value)) return value
    if (this.isString(value)) {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? defaultValue : parsed
    }
    if (this.isBoolean(value)) return value ? 1 : 0
    return defaultValue
  }

  static toBoolean(value: unknown): boolean {
    if (this.isBoolean(value)) return value
    if (this.isString(value)) return value.toLowerCase() === 'true' || value === '1'
    if (this.isNumber(value)) return value !== 0
    return false
  }

  static toArray<T>(value: unknown): T[] {
    if (this.isArray(value)) return value as T[]
    if (this.isNil(value)) return []
    return [value as T]
  }

  static toObject<T extends Record<string, unknown> = Record<string, unknown>>(value: unknown): T | null {
    if (this.isObject(value)) return value as T
    if (this.isString(value)) {
      try {
        return JSON.parse(value) as T
      } catch {
        return null
      }
    }
    return null
  }

  static clone<T>(value: T): T {
    if (this.isNil(value)) return value
    if (this.isPrimitive(value)) return value
    if (this.isDate(value)) return new Date((value as Date).getTime()) as unknown as T
    if (this.isArray(value)) return (value as unknown[]).map(item => this.clone(item)) as unknown as T
    if (this.isObject(value)) return JSON.parse(JSON.stringify(value))
    return value
  }

  static deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true
    if (this.isNil(a) || this.isNil(b)) return false
    if (this.getType(a) !== this.getType(b)) return false

    if (this.isArray(a) && this.isArray(b)) {
      if (a.length !== b.length) return false
      return a.every((item, index) => this.deepEqual(item, b[index]))
    }

    if (this.isObject(a) && this.isObject(b)) {
      const keysA = Object.keys(a as Record<string, unknown>)
      const keysB = Object.keys(b as Record<string, unknown>)
      if (keysA.length !== keysB.length) return false
      return keysA.every(key => this.deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
    }

    if (this.isNumber(a) && this.isNumber(b)) {
      return isNaN(a as number) && isNaN(b as number) ? true : a === b
    }

    return false
  }

  static coerce(value: unknown, type: DataType): unknown {
    switch (type) {
      case 'string': return this.toString(value)
      case 'number': return this.toNumber(value)
      case 'boolean': return this.toBoolean(value)
      case 'array': return this.toArray(value)
      case 'object': return this.toObject(value)
      default: return value
    }
  }

  static getSize(value: unknown): number {
    if (this.isNil(value)) return 0
    if (this.isString(value)) return value.length
    if (this.isArray(value)) return value.length
    if (this.isObject(value)) return Object.keys(value).length
    return 0
  }

  static isTruthy(value: unknown): boolean {
    return !!value
  }

  static isFalsy(value: unknown): boolean {
    return !value
  }
}

export function isDef<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}

export function isStr(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNum(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

export function isBool(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isArr<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value)
}

export function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isFunc(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function'
}

export function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
