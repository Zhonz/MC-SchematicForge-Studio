export interface Schema {
  type?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: unknown[];
  const?: unknown;
  format?: string;
  $ref?: string;
  anyOf?: Schema[];
  oneOf?: Schema[];
  allOf?: Schema[];
  if?: Schema;
  then?: Schema;
  else?: Schema;
}

export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
  schema?: Schema;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class JSONSchemaValidator {
  private schemas: Map<string, Schema> = new Map();

  registerSchema(id: string, schema: Schema): void {
    this.schemas.set(id, schema);
  }

  getSchema(id: string): Schema | undefined {
    return this.schemas.get(id);
  }

  validate(data: unknown, schema: Schema): ValidationResult {
    const errors: ValidationError[] = [];
    this.validateValue(data, schema, '', errors);
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateValue(value: unknown, schema: Schema, path: string, errors: ValidationError[]): void {
    if (schema.$ref) {
      const refSchema = this.schemas.get(schema.$ref);
      if (refSchema) {
        this.validateValue(value, refSchema, path, errors);
      }
      return;
    }

    if (schema.anyOf) {
      const valid = schema.anyOf.some(s => this.validate(value, s).valid);
      if (!valid) {
        errors.push({ path, message: 'Value does not match any of the allowed schemas', value, schema });
      }
      return;
    }

    if (schema.oneOf) {
      const matches = schema.oneOf.filter(s => this.validate(value, s).valid);
      if (matches.length !== 1) {
        errors.push({ path, message: 'Value must match exactly one of the allowed schemas', value, schema });
      }
      return;
    }

    if (schema.allOf) {
      const invalid = schema.allOf.filter(s => !this.validate(value, s).valid);
      if (invalid.length > 0) {
        errors.push({ path, message: 'Value must match all of the allowed schemas', value, schema });
      }
      return;
    }

    if (schema.if) {
      if (this.validate(value, schema.if).valid) {
        if (schema.then) {
          this.validateValue(value, schema.then, path, errors);
        }
      } else if (schema.else) {
        this.validateValue(value, schema.else, path, errors);
      }
      return;
    }

    if (value === null || value === undefined) {
      if (schema.type && schema.type !== 'null') {
        errors.push({ path, message: `Expected ${schema.type}, got null`, value, schema });
      }
      return;
    }

    const type = schema.type || this.inferType(value);

    switch (type) {
      case 'string':
        this.validateString(value as string, schema, path, errors);
        break;
      case 'number':
      case 'integer':
        this.validateNumber(value as number, schema, path, errors);
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({ path, message: `Expected boolean, got ${typeof value}`, value, schema });
        }
        break;
      case 'array':
        this.validateArray(value as unknown[], schema, path, errors);
        break;
      case 'object':
        this.validateObject(value as Record<string, unknown>, schema, path, errors);
        break;
    }
  }

  private inferType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  private validateString(value: string, schema: Schema, path: string, errors: ValidationError[]): void {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({ path, message: `String length must be at least ${schema.minLength}`, value, schema });
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({ path, message: `String length must be at most ${schema.maxLength}`, value, schema });
    }

    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push({ path, message: `String does not match pattern ${schema.pattern}`, value, schema });
      }
    }

    if (schema.format) {
      this.validateFormat(value, schema.format, path, errors);
    }

    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({ path, message: `Value must be one of: ${schema.enum.join(', ')}`, value, schema });
    }

    if (schema.const !== undefined && value !== schema.const) {
      errors.push({ path, message: `Value must be ${schema.const}`, value, schema });
    }
  }

  private validateFormat(value: string, format: string, path: string, errors: ValidationError[]): void {
    const patterns: Record<string, RegExp> = {
      'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
      'date': /^\d{4}-\d{2}-\d{2}$/,
      'time': /^\d{2}:\d{2}:\d{2}(\.\d+)?$/,
      'email': /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'uri': /^[a-zA-Z][a-zA-Z0-9+.-]*:/,
      'uri-reference': /^([a-zA-Z][a-zA-Z0-9+.-]*:)?\/?\/?[^\s]*$/,
      'uuid': /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      'json-pointer': /^((\/[^/~]*(~[01][^/~]*)*)*)$/,
    };

    if (patterns[format] && !patterns[format].test(value)) {
      errors.push({ path, message: `String must be a valid ${format}`, value });
    }
  }

  private validateNumber(value: number, schema: Schema, path: string, errors: ValidationError[]): void {
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push({ path, message: `Expected number, got ${typeof value}`, value, schema });
      return;
    }

    if (schema.type === 'integer' && !Number.isInteger(value)) {
      errors.push({ path, message: 'Expected integer, got float', value, schema });
    }

    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({ path, message: `Number must be at least ${schema.minimum}`, value, schema });
    }

    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({ path, message: `Number must be at most ${schema.maximum}`, value, schema });
    }

    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({ path, message: `Value must be one of: ${schema.enum.join(', ')}`, value, schema });
    }

    if (schema.const !== undefined && value !== schema.const) {
      errors.push({ path, message: `Value must be ${schema.const}`, value, schema });
    }
  }

  private validateArray(value: unknown[], schema: Schema, path: string, errors: ValidationError[]): void {
    if (!Array.isArray(value)) {
      errors.push({ path, message: `Expected array, got ${typeof value}`, value, schema });
      return;
    }

    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({ path, message: `Array must have at least ${schema.minLength} items`, value, schema });
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({ path, message: `Array must have at most ${schema.maxLength} items`, value, schema });
    }

    if (schema.items) {
      value.forEach((item, index) => {
        this.validateValue(item, schema.items!, `${path}[${index}]`, errors);
      });
    }
  }

  private validateObject(value: Record<string, unknown>, schema: Schema, path: string, errors: ValidationError[]): void {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push({ path, message: `Expected object, got ${typeof value}`, value, schema });
      return;
    }

    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in value)) {
          errors.push({ path: `${path}.${key}`, message: `Missing required property "${key}"`, value: undefined, schema });
        }
      }
    }

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in value) {
          this.validateValue(value[key], propSchema, `${path}.${key}`, errors);
        }
      }
    }
  }
}

export class SchemaBuilder {
  private schema: Schema;

  constructor(type?: string) {
    this.schema = { type };
  }

  setType(type: string): this {
    this.schema.type = type;
    return this;
  }

  setFormat(format: string): this {
    this.schema.format = format;
    return this;
  }

  setEnum(values: unknown[]): this {
    this.schema.enum = values;
    return this;
  }

  setConst(value: unknown): this {
    this.schema.const = value;
    return this;
  }

  setMinimum(min: number): this {
    this.schema.minimum = min;
    return this;
  }

  setMaximum(max: number): this {
    this.schema.maximum = max;
    return this;
  }

  setMinLength(min: number): this {
    this.schema.minLength = min;
    return this;
  }

  setMaxLength(max: number): this {
    this.schema.maxLength = max;
    return this;
  }

  setPattern(pattern: string): this {
    this.schema.pattern = pattern;
    return this;
  }

  setRequired(properties: string[]): this {
    this.schema.required = properties;
    return this;
  }

  addProperty(name: string, propSchema: Schema): this {
    if (!this.schema.properties) {
      this.schema.properties = {};
    }
    this.schema.properties[name] = propSchema;
    return this;
  }

  setItems(itemsSchema: Schema): this {
    this.schema.items = itemsSchema;
    return this;
  }

  setRef(ref: string): this {
    this.schema.$ref = ref;
    return this;
  }

  addAnyOf(schemas: Schema[]): this {
    this.schema.anyOf = schemas;
    return this;
  }

  addOneOf(schemas: Schema[]): this {
    this.schema.oneOf = schemas;
    return this;
  }

  addAllOf(schemas: Schema[]): this {
    this.schema.allOf = schemas;
    return this;
  }

  setIf(schema: Schema): this {
    this.schema.if = schema;
    return this;
  }

  setThen(schema: Schema): this {
    this.schema.then = schema;
    return this;
  }

  setElse(schema: Schema): this {
    this.schema.else = schema;
    return this;
  }

  build(): Schema {
    return { ...this.schema };
  }
}

export class DeepClone {
  static clone<T>(obj: T): T {
    return this._clone(obj, new Map());
  }

  private static _clone<T>(obj: T, seen: Map<unknown, unknown>): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (seen.has(obj as unknown)) {
      return seen.get(obj as unknown) as T;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as T;
    }

    if (obj instanceof RegExp) {
      return new RegExp(obj.source, obj.flags) as T;
    }

    if (obj instanceof Error) {
      const error = new Error(obj.message);
      error.name = obj.name;
      error.stack = obj.stack;
      return error as T;
    }

    if (obj instanceof ArrayBuffer) {
      return obj.slice(0) as T;
    }

    if (obj instanceof Uint8Array) {
      return new Uint8Array(obj) as T;
    }

    if (obj instanceof Map) {
      const map = new Map();
      seen.set(obj, map);
      obj.forEach((value, key) => {
        map.set(this._clone(key, seen), this._clone(value, seen));
      });
      return map as T;
    }

    if (obj instanceof Set) {
      const set = new Set();
      seen.set(obj, set);
      obj.forEach(value => {
        set.add(this._clone(value, seen));
      });
      return set as T;
    }

    if (Array.isArray(obj)) {
      const array: unknown[] = [];
      seen.set(obj, array);
      for (const item of obj) {
        array.push(this._clone(item, seen));
      }
      return array as T;
    }

    const proto = Object.getPrototypeOf(obj);
    const clone = Object.create(proto);
    seen.set(obj, clone);

    for (const key of Object.keys(obj)) {
      clone[key] = this._clone((obj as Record<string, unknown>)[key], seen);
    }

    return clone as T;
  }
}

export class JSONPath {
  static get(obj: unknown, path: string): unknown {
    if (!path || !obj) return undefined;

    const parts = this.parsePath(path);
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      if (part.type === 'root') {
        current = obj;
      } else if (part.type === 'property' && part.name) {
        current = (current as Record<string, unknown>)[part.name];
      } else if (part.type === 'index' && part.index !== undefined) {
        if (Array.isArray(current)) {
          current = current[part.index];
        } else {
          return undefined;
        }
      } else if (part.type === 'wildcard') {
        if (Array.isArray(current)) {
          return current.map(item => this.get(item, part.remaining || ''));
        } else if (typeof current === 'object' && current !== null) {
          return Object.values(current).map(v => this.get(v, part.remaining || ''));
        }
      }
    }

    return current;
  }

  static set(obj: unknown, path: string, value: unknown): boolean {
    if (!path || !obj) return false;

    const parts = this.parsePath(path);
    if (parts.length === 0) return false;

    let current: unknown = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (part.type === 'root') {
        continue;
      }

      if (part.type === 'property' && part.name) {
        if (typeof current !== 'object' || current === null) {
          return false;
        }
        if (!(part.name in (current as Record<string, unknown>))) {
          (current as Record<string, unknown>)[part.name] = {};
        }
        current = (current as Record<string, unknown>)[part.name];
      } else if (part.type === 'index' && part.index !== undefined) {
        if (!Array.isArray(current)) {
          return false;
        }
        while (current.length <= part.index) {
          current.push(undefined);
        }
        current = current[part.index];
      }
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart.type === 'property' && lastPart.name) {
      (current as Record<string, unknown>)[lastPart.name] = value;
      return true;
    }

    return false;
  }

  private static parsePath(path: string): Array<{ type: string; name?: string; index?: number; remaining?: string }> {
    const parts: Array<{ type: string; name?: string; index?: number; remaining?: string }> = [];
    const tokens = path.split(/\.|\[|\]/).filter(Boolean);

    for (const token of tokens) {
      if (token === '$' || token === 'root') {
        parts.push({ type: 'root' });
      } else if (/^\d+$/.test(token)) {
        parts.push({ type: 'index', index: parseInt(token, 10) });
      } else if (token === '*') {
        parts.push({ type: 'wildcard' });
      } else {
        parts.push({ type: 'property', name: token });
      }
    }

    return parts;
  }
}
