export interface UUIDOptions {
  version?: 1 | 4;
  namespace?: string;
}

export class UUIDUtils {
  static v4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static v1(): string {
    const timestamp = Date.now();
    const clockSeq = Math.floor(Math.random() * 16384);
    
    const timeLow = (timestamp & 0xffffffff) >>> 0;
    const timeMid = ((timestamp >> 32) & 0xffff) >>> 0;
    const timeHi = ((timestamp >> 48) & 0x0fff) >>> 0;
    const clockSeqHi = ((clockSeq >> 8) & 0x3f) >>> 0;
    const clockSeqLow = clockSeq & 0xff;

    const hex = [
      this.toHex(timeLow, 8),
      this.toHex(timeMid, 4),
      this.toHex(timeHi, 4),
      this.toHex(clockSeqHi, 2),
      this.toHex(clockSeqLow, 2),
      this.toHex(Math.floor(Math.random() * 0xffffffff), 8),
    ];

    return hex.join('-');
  }

  static create(options?: UUIDOptions): string {
    if (options?.version === 1) {
      return this.v1();
    }
    return this.v4();
  }

  static isValid(uuid: string): boolean {
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return pattern.test(uuid);
  }

  static getVersion(uuid: string): number | null {
    const match = uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])/i);
    if (!match) return null;
    return parseInt(match[1], 16);
  }

  static getVariant(uuid: string): number {
    const match = uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-([0-9a-f]{2})/i);
    if (!match) return 0;
    const nibble = parseInt(match[1], 16);
    if ((nibble & 0x80) === 0) return 0;
    if ((nibble & 0xc0) === 0x80) return 1;
    if ((nibble & 0xe0) === 0xc0) return 2;
    if ((nibble & 0xf0) === 0xe0) return 3;
    return 4;
  }

  static toBytes(uuid: string): Uint8Array {
    const hex = uuid.replace(/[^0-9a-f]/gi, '');
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  static fromBytes(bytes: Uint8Array): string {
    const hex: string[] = [];
    for (let i = 0; i < 16; i++) {
      hex.push(bytes[i].toString(16).padStart(2, '0'));
    }
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 8).join(''),
      hex.slice(8, 12).join(''),
      hex.slice(12, 16).join(''),
      hex.slice(16, 32).join(''),
    ].join('-');
  }

  static parse(uuid: string): ArrayBuffer {
    return this.toBytes(uuid).buffer;
  }

  static stringify(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return this.fromBytes(bytes);
  }

  private static toHex(value: number, length: number): string {
    return value.toString(16).padStart(length, '0');
  }

  static nil(): string {
    return '00000000-0000-0000-0000-000000000000';
  }

  static max(): string {
    return 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  }
}

export class NumberUtils {
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  static inverseLerp(a: number, b: number, value: number): number {
    if (a === b) return 0;
    return (value - a) / (b - a);
  }

  static map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    const t = this.inverseLerp(inMin, inMax, value);
    return this.lerp(outMin, outMax, t);
  }

  static round(value: number, decimals: number = 0): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  static floor(value: number, decimals: number = 0): number {
    const factor = Math.pow(10, decimals);
    return Math.floor(value * factor) / factor;
  }

  static ceil(value: number, decimals: number = 0): number {
    const factor = Math.pow(10, decimals);
    return Math.ceil(value * factor) / factor;
  }

  static isInteger(value: number): boolean {
    return Number.isInteger(value);
  }

  static isEven(value: number): boolean {
    return value % 2 === 0;
  }

  static isOdd(value: number): boolean {
    return value % 2 !== 0;
  }

  static isPrime(value: number): boolean {
    if (value < 2) return false;
    if (value === 2) return true;
    if (this.isEven(value)) return false;
    for (let i = 3; i <= Math.sqrt(value); i += 2) {
      if (value % i === 0) return false;
    }
    return true;
  }

  static gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  static lcm(a: number, b: number): number {
    return Math.abs(a * b) / this.gcd(a, b);
  }

  static random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static format(value: number, decimals: number = 2, separator: string = ','): string {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
  }

  static parseBytes(str: string): number {
    const match = str.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB|PB)?$/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();
    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 ** 2,
      'GB': 1024 ** 3,
      'TB': 1024 ** 4,
      'PB': 1024 ** 5,
    };
    return value * (multipliers[unit] || 1);
  }

  static percent(value: number, total: number, decimals: number = 0): number {
    if (total === 0) return 0;
    return this.round((value / total) * 100, decimals);
  }

  static clampPercent(value: number): number {
    return this.clamp(value, 0, 100);
  }

  static sum(...values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
  }

  static average(...values: number[]): number {
    if (values.length === 0) return 0;
    return this.sum(...values) / values.length;
  }

  static median(...values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  static min(...values: number[]): number {
    if (values.length === 0) return 0;
    return Math.min(...values);
  }

  static max(...values: number[]): number {
    if (values.length === 0) return 0;
    return Math.max(...values);
  }

  static range(start: number, end: number, step: number = 1): number[] {
    const result: number[] = [];
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
    return result;
  }
}

export class ArrayUtils {
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static compact<T>(array: (T | null | undefined)[]): T[] {
    return array.filter(item => item != null) as T[];
  }

  static difference<T>(array: T[], ...values: T[][]): T[] {
    const flatValues = values.flat();
    return array.filter(item => !flatValues.includes(item));
  }

  static intersection<T>(...arrays: T[][]): T[] {
    if (arrays.length === 0) return [];
    return arrays[0].filter(item => arrays.every(arr => arr.includes(item)));
  }

  static union<T>(...arrays: T[][]): T[] {
    return [...new Set(arrays.flat())];
  }

  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  static uniqBy<T>(array: T[], keyFn: (item: T) => unknown): T[] {
    const seen = new Set();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  static groupBy<T>(array: T[], keyFn: (item: T) => string | number): Record<string, T[]> {
    return array.reduce((result, item) => {
      const key = String(keyFn(item));
      if (!result[key]) result[key] = [];
      result[key].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }

  static sortBy<T>(array: T[], keyFn: (item: T) => number | string): T[] {
    return [...array].sort((a, b) => {
      const aKey = keyFn(a);
      const bKey = keyFn(b);
      if (aKey < bKey) return -1;
      if (aKey > bKey) return 1;
      return 0;
    });
  }

  static flatten<T>(array: (T | T[])[]): T[] {
    return ([] as T[]).concat(...array);
  }

  static deepFlatten<T>(array: unknown[]): T[] {
    const result: T[] = [];
    for (const item of array) {
      if (Array.isArray(item)) {
        result.push(...this.deepFlatten<T>(item));
      } else {
        result.push(item as T);
      }
    }
    return result;
  }

  static zip<T>(...arrays: T[][]): T[][] {
    const length = Math.min(...arrays.map(a => a.length));
    return Array.from({ length }, (_, i) => arrays.map(a => a[i]));
  }

  static unzip<T>(zipped: T[][]): T[][] {
    const length = zipped[0]?.length || 0;
    return Array.from({ length }, (_, i) => zipped.map(a => a[i]));
  }

  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  static sample<T>(array: T[], count: number = 1): T | T[] {
    const shuffled = this.shuffle(array);
    return count === 1 ? shuffled[0] : shuffled.slice(0, count);
  }

  static pull<T>(array: T[], ...values: T[]): T[] {
    return array.filter(item => !values.includes(item));
  }

  static drop<T>(array: T[], count: number = 1): T[] {
    return array.slice(count);
  }

  static dropRight<T>(array: T[], count: number = 1): T[] {
    return array.slice(0, -count);
  }

  static take<T>(array: T[], count: number = 1): T[] {
    return array.slice(0, count);
  }

  static takeRight<T>(array: T[], count: number = 1): T[] {
    return array.slice(-count);
  }

  static partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
    const pass: T[] = [];
    const fail: T[] = [];
    array.forEach(item => (predicate(item) ? pass : fail).push(item));
    return [pass, fail];
  }

  static reduce<T, R>(array: T[], reducer: (acc: R, item: T) => R, initial: R): R {
    return array.reduce<R>(reducer, initial);
  }

  static map<T, R>(array: T[], mapper: (item: T, index: number) => R): R[] {
    return array.map(mapper);
  }

  static filter<T>(array: T[], predicate: (item: T, index: number) => boolean): T[] {
    return array.filter(predicate);
  }

  static find<T>(array: T[], predicate: (item: T, index: number) => boolean): T | undefined {
    return array.find(predicate);
  }

  static includes<T>(array: T[], value: T): boolean {
    return array.includes(value);
  }

  static indexOf<T>(array: T[], value: T): number {
    return array.indexOf(value);
  }

  static lastIndexOf<T>(array: T[], value: T): number {
    return array.lastIndexOf(value);
  }

  static countBy<T>(array: T[], keyFn: (item: T) => string | number): Record<string, number> {
    return array.reduce((result, item) => {
      const key = String(keyFn(item));
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {} as Record<string, number>);
  }
}

export class ObjectUtils {
  static pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  static omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  }

  static merge<T extends object>(...objects: Partial<T>[]): T {
    return Object.assign({}, ...objects);
  }

  static deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
    if (sources.length === 0) return target;
    const source = sources.shift();
    if (source === undefined) return target;

    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        const sourceValue = (source as Record<string, unknown>)[key];
        const targetValue = (target as Record<string, unknown>)[key];
        if (isObject(sourceValue)) {
          if (!targetValue) {
            Object.assign(target, { [key]: {} });
          }
          (target as Record<string, unknown>)[key] = this.deepMerge(
            (targetValue || {}) as object,
            sourceValue
          );
        } else {
          Object.assign(target, { [key]: sourceValue });
        }
      });
    }

    return this.deepMerge(target, ...sources);
  }

  static clone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as T;
    if (obj instanceof Array) return obj.map(item => this.clone(item)) as T;
    if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags) as T;
    if (obj instanceof Map) {
      const map = new Map();
      obj.forEach((value, key) => map.set(this.clone(key), this.clone(value)));
      return map as T;
    }
    if (obj instanceof Set) {
      const set = new Set();
      obj.forEach(value => set.add(this.clone(value)));
      return set as T;
    }
    return Object.assign({}, obj);
  }

  static deepClone<T>(obj: T): T {
    return this.clone(obj);
  }

  static isEmpty(obj: object): boolean {
    if (obj === null || obj === undefined) return true;
    if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
    if (obj instanceof Map || obj instanceof Set) return obj.size === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  }

  static keys(obj: object): string[] {
    return Object.keys(obj);
  }

  static values<T>(obj: object): T[] {
    return Object.values(obj) as T[];
  }

  static entries<T>(obj: object): [string, T][] {
    return Object.entries(obj) as [string, T][];
  }

  static mapValues<T extends object, R>(
    obj: T,
    mapper: (value: T[keyof T], key: keyof T) => R
  ): Record<keyof T, R> {
    const result = {} as Record<keyof T, R>;
    Object.keys(obj).forEach(key => {
      result[key as keyof T] = mapper(obj[key as keyof T], key as keyof T);
    });
    return result;
  }

  static mapKeys<T extends object>(
    obj: T,
    mapper: (key: string, value: T[keyof T]) => string
  ): Record<string, T[keyof T]> {
    const result: Record<string, T[keyof T]> = {};
    Object.keys(obj).forEach(key => {
      const newKey = mapper(key, obj[key as keyof T]);
      result[newKey] = obj[key as keyof T];
    });
    return result;
  }

  static invert(obj: object): Record<string, string> {
    return Object.entries(obj).reduce((result, [key, value]) => {
      result[String(value)] = key;
      return result;
    }, {} as Record<string, string>);
  }

  static pickBy<T extends object>(
    obj: T,
    predicate: (value: T[keyof T], key: keyof T) => boolean
  ): Partial<T> {
    const result: Partial<T> = {};
    Object.keys(obj).forEach(key => {
      const k = key as keyof T;
      if (predicate(obj[k], k)) {
        result[k] = obj[k];
      }
    });
    return result;
  }

  static omitBy<T extends object>(
    obj: T,
    predicate: (value: T[keyof T], key: keyof T) => boolean
  ): Partial<T> {
    return this.pickBy(obj, (value, key) => !predicate(value, key));
  }
}

function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

export class StringUtils {
  static capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static camelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^[A-Z]/, c => c.toLowerCase());
  }

  static snakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  }

  static kebabCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '-$1')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - suffix.length) + suffix;
  }

  static padStart(str: string, length: number, char: string = ' '): string {
    return str.padStart(length, char);
  }

  static padEnd(str: string, length: number, char: string = ' '): string {
    return str.padEnd(length, char);
  }

  static repeat(str: string, count: number): string {
    return str.repeat(count);
  }

  static escapeHtml(str: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return str.replace(/[&<>"']/g, c => map[c]);
  }

  static unescapeHtml(str: string): string {
    const map: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
    };
    return str.replace(/&(?:amp|lt|gt|quot|#39);/g, c => map[c] || c);
  }
}
