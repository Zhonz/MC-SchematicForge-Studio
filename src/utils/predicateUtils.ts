export type Predicate<T> = (value: T) => boolean;
export type AsyncPredicate<T> = (value: T) => Promise<boolean>;

export interface PredicateGroup<T> {
  and: (predicate: Predicate<T>) => PredicateGroup<T>;
  or: (predicate: Predicate<T>) => PredicateGroup<T>;
  not: () => PredicateGroup<T>;
  evaluate: (value: T) => boolean;
  negate: () => Predicate<T>;
}

export function createPredicate<T>(fn: Predicate<T>): PredicateGroup<T> {
  let predicates: Array<{ fn: Predicate<T>; type: 'and' | 'or' | 'not' }> = [{ fn, type: 'and' }];

  const evaluate = (value: T): boolean => {
    let result = predicates[0].fn(value);

    for (let i = 1; i < predicates.length; i++) {
      const { fn: pred, type } = predicates[i];

      switch (type) {
        case 'and':
          result = result && pred(value);
          break;
        case 'or':
          result = result || pred(value);
          break;
        case 'not':
          result = !pred(value);
          break;
      }
    }

    return result;
  };

  return {
    and(predicate: Predicate<T>) {
      predicates.push({ fn: predicate, type: 'and' });
      return this;
    },
    or(predicate: Predicate<T>) {
      predicates.push({ fn: predicate, type: 'or' });
      return this;
    },
    not() {
      predicates.push({ fn: () => true, type: 'not' });
      return this;
    },
    evaluate,
    negate() {
      return (value: T) => !evaluate(value);
    },
  };
}

export function and<T>(...predicates: Array<Predicate<T>>): Predicate<T> {
  return (value: T) => predicates.every((p) => p(value));
}

export function or<T>(...predicates: Array<Predicate<T>>): Predicate<T> {
  return (value: T) => predicates.some((p) => p(value));
}

export function not<T>(predicate: Predicate<T>): Predicate<T> {
  return (value: T) => !predicate(value);
}

export function nor<T>(...predicates: Array<Predicate<T>>): Predicate<T> {
  return (value: T) => !predicates.some((p) => p(value));
}

export function nand<T>(...predicates: Array<Predicate<T>>): Predicate<T> {
  return (value: T) => !predicates.every((p) => p(value));
}

export function xor<T>(...predicates: Array<Predicate<T>>): Predicate<T> {
  return (value: T) => {
    let trueCount = 0;
    for (const p of predicates) {
      if (p(value)) trueCount++;
    }
    return trueCount === 1;
  };
}

export function isNull<T>(value: T | null): value is null {
  return value === null;
}

export function isUndefined<T>(value: T | undefined): value is undefined {
  return value === undefined;
}

export function isNil<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

export function isTruthy<T>(value: T): value is NonNullable<T> {
  return Boolean(value);
}

export function isFalsy<T>(value: T): boolean {
  return !value;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isInteger(value: unknown): value is number {
  return Number.isInteger(value as number);
}

export function isFloat(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value) && !Number.isInteger(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return value instanceof Promise || (typeof value === 'object' && value !== null && typeof (value as Record<string, unknown>).then === 'function');
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

export function isEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }

  if (isObject(a) && isObject(b)) {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }

  return false;
}

export function isGreaterThan(a: number, b: number): boolean {
  return a > b;
}

export function isLessThan(a: number, b: number): boolean {
  return a < b;
}

export function isBetween<T extends number | string>(value: T, min: T, max: T, inclusive = true): boolean {
  if (inclusive) {
    return value >= min && value <= max;
  }
  return value > min && value < max;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isPhone(value: string): boolean {
  return /^[\d\s\-+()]{7,}$/.test(value);
}

export function isCreditCard(value: string): boolean {
  const cleaned = value.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

export function matches<T extends string | RegExp>(pattern: T): (value: string) => boolean {
  if (pattern instanceof RegExp) {
    return (value: string) => pattern.test(value);
  }
  return (value: string) => new RegExp(pattern).test(value);
}

export function hasLength<T extends string | unknown[]>(min?: number, max?: number): (value: T) => boolean {
  return (value: T) => {
    const len = (value as string).length;
    if (min !== undefined && len < min) return false;
    if (max !== undefined && len > max) return false;
    return true;
  };
}

export function hasProperty(key: string): (value: Record<string, unknown>) => boolean {
  return (value) => key in value;
}

export function hasProperties(...keys: string[]): (value: Record<string, unknown>) => boolean {
  return (value) => keys.every((key) => key in value);
}

export function when<T>(condition: boolean, predicate: Predicate<T>): Predicate<T> {
  return condition ? predicate : () => true;
}

export function composePredicates<T>(...predicates: Array<Predicate<T>>): Predicate<T> {
  return and(...predicates);
}

export function anyPass<T>(predicates: Array<Predicate<T>>): Predicate<T> {
  return or(...predicates);
}

export function allPass<T>(predicates: Array<Predicate<T>>): Predicate<T> {
  return and(...predicates);
}

export function nonePass<T>(predicates: Array<Predicate<T>>): Predicate<T> {
  return nor(...predicates);
}

export async function asyncAnd<T>(...predicates: Array<AsyncPredicate<T>>): Promise<AsyncPredicate<T>> {
  return async (value: T) => {
    for (const p of predicates) {
      if (!(await p(value))) return false;
    }
    return true;
  };
}

export async function asyncOr<T>(...predicates: Array<AsyncPredicate<T>>): Promise<AsyncPredicate<T>> {
  return async (value: T) => {
    for (const p of predicates) {
      if (await p(value)) return true;
    }
    return false;
  };
}
