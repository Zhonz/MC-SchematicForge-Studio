export type SerializerFormat = 'json' | 'msgpack' | 'protobuf';

export interface SerializationOptions {
  format?: SerializerFormat;
  dateHandling?: 'iso' | 'timestamp' | 'iso8601';
  undefinedHandling?: 'skip' | 'null' | 'string';
  circularHandling?: boolean;
}

export class Serializer2 {
  private options: Required<SerializationOptions>;

  constructor(options: SerializationOptions = {}) {
    this.options = {
      format: options.format ?? 'json',
      dateHandling: options.dateHandling ?? 'iso8601',
      undefinedHandling: options.undefinedHandling ?? 'skip',
      circularHandling: options.circularHandling ?? true,
    };
  }

  serialize(data: unknown): string {
    if (this.options.format !== 'json') {
      throw new Error(`Format '${this.options.format}' is not supported`);
    }
    return JSON.stringify(data, this.getReplacer());
  }

  deserialize<T = unknown>(json: string): T {
    if (this.options.format !== 'json') {
      throw new Error(`Format '${this.options.format}' is not supported`);
    }
    return JSON.parse(json, this.getReviver()) as T;
  }

  private getReplacer(): (key: string, value: unknown) => unknown {
    const seen = new WeakSet();
    return (key: string, value: unknown) => {
      if (typeof value === 'undefined') {
        switch (this.options.undefinedHandling) {
          case 'skip':
            return undefined;
          case 'null':
            return null;
          case 'string':
            return 'undefined';
        }
      }
      if (value instanceof Date) {
        switch (this.options.dateHandling) {
          case 'iso':
          case 'iso8601':
            return value.toISOString();
          case 'timestamp':
            return value.getTime();
        }
      }
      if (this.options.circularHandling) {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value as object)) {
            return '[Circular]';
          }
          seen.add(value as object);
        }
      }
      return value;
    };
  }

  private getReviver(): (key: string, value: unknown) => unknown {
    return (key: string, value: unknown) => {
      if (typeof value === 'string') {
        const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (dateMatch) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        if (value === '[Circular]') {
          return undefined;
        }
      }
      return value;
    };
  }

  clone<T>(data: T): T {
    return this.deserialize<T>(this.serialize(data));
  }

  equals(a: unknown, b: unknown): boolean {
    return this.serialize(a) === this.serialize(b);
  }

  toQueryString(data: Record<string, unknown>): string {
    const params = new URLSearchParams();
    const flatten = (obj: Record<string, unknown>, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}[${key}]` : key;
        if (value === null || value === undefined) {
          continue;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          flatten(value as Record<string, unknown>, fullKey);
        } else if (Array.isArray(value)) {
          value.forEach((v, i) => {
            if (typeof v === 'object') {
              flatten(v as Record<string, unknown>, `${fullKey}[${i}]`);
            } else {
              params.append(`${fullKey}[${i}]`, String(v));
            }
          });
        } else {
          params.set(fullKey, String(value));
        }
      }
    };
    flatten(data);
    return params.toString();
  }

  fromQueryString<T = Record<string, unknown>>(query: string): T {
    const params = new URLSearchParams(query);
    const result: Record<string, unknown> = {};
    params.forEach((value, key) => {
      const keys = key.replace(/\[(\d+)\]/g, '.$1').split('.');
      let current = result;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]!;
        const nextKey = keys[i + 1];
        if (!current[k]) {
          current[k] = /^\d+$/.test(nextKey ?? '') ? [] : {};
        }
        current = current[k] as Record<string, unknown>;
      }
      const lastKey = keys[keys.length - 1]!;
      current[lastKey] = value;
    });
    return result as T;
  }
}

export const serializer = new Serializer2();

export function clone<T>(data: T): T {
  return serializer.clone(data);
}

export function deepEqual(a: unknown, b: unknown): boolean {
  return serializer.equals(a, b);
}
