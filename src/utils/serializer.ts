export interface SerializerOptions {
  dateFormat?: 'iso' | 'unix' | 'string';
  undefinedHandling?: 'string' | 'null' | 'skip';
  circularReferenceHandling?: 'string' | 'error' | 'skip';
  maxDepth?: number;
}

export class Serializer {
  private options: Required<SerializerOptions>;

  constructor(options: SerializerOptions = {}) {
    this.options = {
      dateFormat: options.dateFormat || 'iso',
      undefinedHandling: options.undefinedHandling || 'skip',
      circularReferenceHandling: options.circularReferenceHandling || 'skip',
      maxDepth: options.maxDepth || 100
    };
  }

  serialize(obj: unknown): string {
    const seen = new WeakSet<object>();
    return JSON.stringify(this.processValue(obj, seen, 0));
  }

  deserialize<T>(json: string): T {
    return JSON.parse(json) as T;
  }

  private processValue(value: unknown, seen: WeakSet<object>, depth: number): unknown {
    if (depth > this.options.maxDepth) {
      return this.handleMaxDepth();
    }

    if (value === null || value === undefined) {
      return this.handleUndefined(value);
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (typeof value === 'symbol') {
      return value.toString();
    }

    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }

    if (value instanceof Date) {
      return this.formatDate(value);
    }

    if (value instanceof RegExp) {
      return value.toString();
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack
      };
    }

    if (seen.has(value)) {
      return this.handleCircularReference();
    }

    if (Array.isArray(value)) {
      seen.add(value);
      return value.map(item => this.processValue(item, seen, depth + 1));
    }

    if (typeof value === 'object') {
      seen.add(value);
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(value)) {
        const processed = this.processValue((value as Record<string, unknown>)[key], seen, depth + 1);
        if (processed !== undefined || this.options.undefinedHandling !== 'skip') {
          result[key] = processed;
        }
      }
      return result;
    }

    return String(value);
  }

  private formatDate(date: Date): unknown {
    switch (this.options.dateFormat) {
      case 'iso':
        return date.toISOString();
      case 'unix':
        return date.getTime();
      case 'string':
        return date.toString();
      default:
        return date.toISOString();
    }
  }

  private handleUndefined(value: unknown): unknown {
    switch (this.options.undefinedHandling) {
      case 'string':
        return 'undefined';
      case 'null':
        return null;
      case 'skip':
        return undefined;
      default:
        return null;
    }
  }

  private handleCircularReference(): unknown {
    switch (this.options.circularReferenceHandling) {
      case 'string':
        return '[Circular]';
      case 'error':
        throw new Error('Circular reference detected');
      case 'skip':
        return undefined;
      default:
        return '[Circular]';
    }
  }

  private handleMaxDepth(): unknown {
    return '[Max Depth Exceeded]';
  }
}

export class QuerySerializer {
  static encode(data: Record<string, unknown>): string {
    const params = new URLSearchParams();
    this.flattenObject('', data, params);
    return params.toString();
  }

  static decode(query: string): Record<string, unknown> {
    const params = new URLSearchParams(query);
    const result: Record<string, unknown> = {};

    params.forEach((value, key) => {
      this.setNestedValue(result, key, this.parseValue(value));
    });

    return result;
  }

  private static flattenObject(prefix: string, obj: Record<string, unknown>, params: URLSearchParams): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}[${key}]` : key;

      if (value === null || value === undefined) {
        params.append(fullKey, '');
      } else if (typeof value === 'object') {
        this.flattenObject(fullKey, value as Record<string, unknown>, params);
      } else {
        params.append(fullKey, String(value));
      }
    }
  }

  private static setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const match = path.match(/^([^\[]+)(?:\[(.+)\])?$/);
    if (!match) return;

    const [, key, rest] = match;
    if (!rest) {
      obj[key] = value;
      return;
    }

    if (!obj[key]) {
      obj[key] = {};
    }

    this.setNestedValue(obj[key] as Record<string, unknown>, rest, value);
  }

  private static parseValue(value: string): unknown {
    if (value === '') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
    return value;
  }
}

export class BufferSerializer {
  static fromBase64(str: string): Uint8Array {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  static toBase64(buffer: Uint8Array | ArrayBuffer): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  static toHex(buffer: Uint8Array | ArrayBuffer): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static fromHex(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }
}

export class SchemaValidator {
  private schema: Record<string, unknown>;

  constructor(schema: Record<string, unknown>) {
    this.schema = schema;
  }

  validate(data: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    this.validateValue('', data, this.schema, errors);
    return { valid: errors.length === 0, errors };
  }

  private validateValue(path: string, value: unknown, schema: Record<string, unknown>, errors: string[]): void {
    const { type } = schema as { type?: string };

    if (value === undefined || value === null) {
      if (schema.required && (schema as { required?: boolean }).required) {
        errors.push(`${path} is required`);
      }
      return;
    }

    if (type && !this.checkType(value, type)) {
      errors.push(`${path} expected ${type}, got ${typeof value}`);
    }

    if (type === 'object') {
      this.validateObject(path, value as Record<string, unknown>, schema, errors);
    } else if (type === 'array') {
      this.validateArray(path, value as unknown[], schema, errors);
    }

    if (typeof value === 'number' && type === 'number') {
      const minVal = (schema as { minimum?: number }).minimum;
      if (minVal !== undefined && value < minVal) {
        errors.push(`${path} must be >= ${minVal}`);
      }
      const maxVal = (schema as { maximum?: number }).maximum;
      if (maxVal !== undefined && value > maxVal) {
        errors.push(`${path} must be <= ${maxVal}`);
      }
    }

    if (typeof value === 'string' && type === 'string') {
      if ((schema as { minLength?: number }).minLength && value.length < (schema as { minLength: number }).minLength) {
        errors.push(`${path} must be at least ${(schema as { minLength: number }).minLength} characters`);
      }
      if ((schema as { maxLength?: number }).maxLength && value.length > (schema as { maxLength: number }).maxLength) {
        errors.push(`${path} must be at most ${(schema as { maxLength: number }).maxLength} characters`);
      }
      if ((schema as { pattern?: string }).pattern) {
        const regex = new RegExp((schema as { pattern: string }).pattern);
        if (!regex.test(value)) {
          errors.push(`${path} does not match pattern`);
        }
      }
    }
  }

  private checkType(value: unknown, type: string): boolean {
    if (type === 'number') return typeof value === 'number';
    if (type === 'string') return typeof value === 'string';
    if (type === 'boolean') return typeof value === 'boolean';
    if (type === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
    if (type === 'array') return Array.isArray(value);
    if (type === 'null') return value === null;
    return true;
  }

  private validateObject(path: string, obj: Record<string, unknown>, schema: Record<string, unknown>, errors: string[]): void {
    const properties = (schema.properties || {}) as Record<string, unknown>;
    const required = (schema.required || []) as string[];

    for (const key of required) {
      if (obj[key] === undefined) {
        errors.push(`${path}.${key} is required`);
      }
    }

    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      const propSchema = properties[key] as Record<string, unknown> | undefined;
      if (propSchema) {
        this.validateValue(fullPath, value, propSchema, errors);
      }
    }
  }

  private validateArray(path: string, arr: unknown[], schema: Record<string, unknown>, errors: string[]): void {
    const itemSchema = (schema.items || {}) as Record<string, unknown>;
    const minItems = (schema.minItems || 0) as number;
    const maxItems = (schema.maxItems || Infinity) as number;

    if (arr.length < minItems) {
      errors.push(`${path} must have at least ${minItems} items`);
    }
    if (arr.length > maxItems) {
      errors.push(`${path} must have at most ${maxItems} items`);
    }

    arr.forEach((item, index) => {
      this.validateValue(`${path}[${index}]`, item, itemSchema, errors);
    });
  }
}

export const serializer = new Serializer();
export const defaultSerializer = new Serializer();
