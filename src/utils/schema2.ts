export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
  required?: boolean;
  default?: unknown;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enumValues?: unknown[];
  properties?: Record<string, SchemaField>;
  items?: SchemaField;
  custom?: (value: unknown) => string | null;
}

export interface SchemaDefinition {
  [key: string]: SchemaField;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class Schema2 {
  private definition: SchemaDefinition;

  constructor(definition: SchemaDefinition) {
    this.definition = definition;
  }

  validate(data: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];
    for (const [field, schema] of Object.entries(this.definition)) {
      const value = data[field];
      const error = this.validateField(field, value, schema, data);
      if (error) errors.push(error);
    }
    return { valid: errors.length === 0, errors };
  }

  private validateField(
    field: string,
    value: unknown,
    schema: SchemaField,
    data: Record<string, unknown>
  ): ValidationError | null {
    if (value === undefined || value === null) {
      if (schema.required) {
        return { field, message: `${field} is required`, value };
      }
      return null;
    }

    if (schema.type === 'string' && typeof value !== 'string') {
      return { field, message: `${field} must be a string`, value };
    }

    if (schema.type === 'number' && typeof value !== 'number') {
      return { field, message: `${field} must be a number`, value };
    }

    if (schema.type === 'boolean' && typeof value !== 'boolean') {
      return { field, message: `${field} must be a boolean`, value };
    }

    if (schema.type === 'array' && !Array.isArray(value)) {
      return { field, message: `${field} must be an array`, value };
    }

    if (schema.type === 'object' && (typeof value !== 'object' || Array.isArray(value) || value === null)) {
      return { field, message: `${field} must be an object`, value };
    }

    if (schema.type === 'enum' && schema.enumValues && !schema.enumValues.includes(value)) {
      return { field, message: `${field} must be one of: ${schema.enumValues.join(', ')}`, value };
    }

    if (typeof value === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        return { field, message: `${field} must be at least ${schema.minLength} characters`, value };
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        return { field, message: `${field} must be at most ${schema.maxLength} characters`, value };
      }
      if (schema.pattern && !schema.pattern.test(value)) {
        return { field, message: `${field} does not match the required pattern`, value };
      }
    }

    if (typeof value === 'number') {
      if (schema.min !== undefined && value < schema.min) {
        return { field, message: `${field} must be at least ${schema.min}`, value };
      }
      if (schema.max !== undefined && value > schema.max) {
        return { field, message: `${field} must be at most ${schema.max}`, value };
      }
    }

    if (Array.isArray(value) && schema.items) {
      for (let i = 0; i < value.length; i++) {
        const itemError = this.validateField(`${field}[${i}]`, value[i], schema.items, data);
        if (itemError) return itemError;
      }
    }

    if (typeof value === 'object' && !Array.isArray(value) && value !== null && schema.properties) {
      const nestedSchema = new Schema2(schema.properties);
      const nestedResult = nestedSchema.validate(value as Record<string, unknown>);
      if (!nestedResult.valid) {
        return {
          field,
          message: nestedResult.errors.map((e) => `${field}.${e.field}: ${e.message}`).join(', '),
          value,
        };
      }
    }

    if (schema.custom) {
      const customError = schema.custom(value);
      if (customError) {
        return { field, message: customError, value };
      }
    }

    return null;
  }

  getDefaultValues(): Record<string, unknown> {
    const defaults: Record<string, unknown> = {};
    for (const [field, schema] of Object.entries(this.definition)) {
      if (schema.default !== undefined) {
        defaults[field] = schema.default;
      }
    }
    return defaults;
  }

  getRequiredFields(): string[] {
    return Object.entries(this.definition)
      .filter(([, schema]) => schema.required)
      .map(([field]) => field);
  }
}

export function createSchema(definition: SchemaDefinition): Schema2 {
  return new Schema2(definition);
}

export function validate<T extends Record<string, unknown>>(
  data: T,
  schema: Schema2
): ValidationResult {
  return schema.validate(data);
}
