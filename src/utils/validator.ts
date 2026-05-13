export interface ValidationRule {
  validate(value: unknown): boolean;
  message?: string;
}

export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'url';
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: unknown[];
  custom?: ValidationRule;
}

export interface SchemaDefinition {
  [field: string]: SchemaField;
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

export class Validator {
  private schema: SchemaDefinition;
  private errors: ValidationError[] = [];

  constructor(schema: SchemaDefinition) {
    this.schema = schema;
  }

  validate(data: Record<string, unknown>): ValidationResult {
    this.errors = [];

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field];

      if (rules.required && (value === undefined || value === null)) {
        this.errors.push({
          field,
          message: `Field "${field}" is required`,
          value,
        });
        continue;
      }

      if (value === undefined || value === null) continue;

      this.validateField(field, value, rules);
    }

    const requiredFields = Object.entries(this.schema)
      .filter(([, rules]) => rules.required)
      .map(([field]) => field);

    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        if (!this.errors.some(e => e.field === field)) {
          this.errors.push({
            field,
            message: `Field "${field}" is required`,
            value: data[field],
          });
        }
      }
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  private validateField(field: string, value: unknown, rules: SchemaField): void {
    switch (rules.type) {
      case 'string':
        this.validateString(field, value as string, rules);
        break;
      case 'number':
        this.validateNumber(field, value as number, rules);
        break;
      case 'boolean':
        this.validateBoolean(field, value as boolean);
        break;
      case 'array':
        this.validateArray(field, value as unknown[], rules);
        break;
      case 'object':
        this.validateObject(field, value as Record<string, unknown>);
        break;
      case 'date':
        this.validateDate(field, value as string);
        break;
      case 'email':
        this.validateEmail(field, value as string);
        break;
      case 'url':
        this.validateUrl(field, value as string);
        break;
    }

    if (rules.custom) {
      if (!rules.custom.validate(value)) {
        this.errors.push({
          field,
          message: rules.custom.message || `Field "${field}" failed custom validation`,
          value,
        });
      }
    }
  }

  private validateString(field: string, value: string, rules: SchemaField): void {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      this.errors.push({
        field,
        message: `Field "${field}" must be at least ${rules.minLength} characters`,
        value,
      });
    }

    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      this.errors.push({
        field,
        message: `Field "${field}" must be at most ${rules.maxLength} characters`,
        value,
      });
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      this.errors.push({
        field,
        message: `Field "${field}" does not match the required pattern`,
        value,
      });
    }

    if (rules.enum && !rules.enum.includes(value)) {
      this.errors.push({
        field,
        message: `Field "${field}" must be one of: ${rules.enum.join(', ')}`,
        value,
      });
    }
  }

  private validateNumber(field: string, value: number, rules: SchemaField): void {
    if (rules.min !== undefined && value < rules.min) {
      this.errors.push({
        field,
        message: `Field "${field}" must be at least ${rules.min}`,
        value,
      });
    }

    if (rules.max !== undefined && value > rules.max) {
      this.errors.push({
        field,
        message: `Field "${field}" must be at most ${rules.max}`,
        value,
      });
    }
  }

  private validateBoolean(field: string, value: boolean): void {
    if (typeof value !== 'boolean') {
      this.errors.push({
        field,
        message: `Field "${field}" must be a boolean`,
        value,
      });
    }
  }

  private validateArray(field: string, value: unknown[], rules: SchemaField): void {
    if (!Array.isArray(value)) {
      this.errors.push({
        field,
        message: `Field "${field}" must be an array`,
        value,
      });
      return;
    }

    if (rules.minLength !== undefined && value.length < rules.minLength) {
      this.errors.push({
        field,
        message: `Field "${field}" must have at least ${rules.minLength} items`,
        value,
      });
    }

    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      this.errors.push({
        field,
        message: `Field "${field}" must have at most ${rules.maxLength} items`,
        value,
      });
    }
  }

  private validateObject(field: string, value: Record<string, unknown>): void {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      this.errors.push({
        field,
        message: `Field "${field}" must be an object`,
        value,
      });
    }
  }

  private validateDate(field: string, value: string): void {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      this.errors.push({
        field,
        message: `Field "${field}" must be a valid date`,
        value,
      });
    }
  }

  private validateEmail(field: string, value: string): void {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      this.errors.push({
        field,
        message: `Field "${field}" must be a valid email address`,
        value,
      });
    }
  }

  private validateUrl(field: string, value: string): void {
    try {
      new URL(value);
    } catch {
      this.errors.push({
        field,
        message: `Field "${field}" must be a valid URL`,
        value,
      });
    }
  }

  static isEmail(value: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value);
  }

  static isUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  static isDate(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  static isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
  }

  static isInteger(value: unknown): boolean {
    return Number.isInteger(value);
  }

  static isString(value: unknown): value is string {
    return typeof value === 'string';
  }

  static isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }

  static isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }

  static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  static isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  static isPhone(value: string): boolean {
    const phonePattern = /^[\d\s\-+()]{10,}$/;
    return phonePattern.test(value);
  }

  static isPostalCode(value: string, country = 'US'): boolean {
    const patterns: Record<string, RegExp> = {
      US: /^\d{5}(-\d{4})?$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
      CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
      CN: /^\d{6}$/,
    };
    return (patterns[country] || /^[A-Z\d]{3,10}$/i).test(value);
  }

  static isIPAddress(value: string, version: 4 | 6 | 'both' = 'both'): boolean {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i;

    if (version === 4) return ipv4Pattern.test(value);
    if (version === 6) return ipv6Pattern.test(value);
    return ipv4Pattern.test(value) || ipv6Pattern.test(value);
  }
}

export const validate = {
  email: Validator.isEmail,
  url: Validator.isUrl,
  date: Validator.isDate,
  number: Validator.isNumber,
  integer: Validator.isInteger,
  string: Validator.isString,
  boolean: Validator.isBoolean,
  array: Validator.isArray,
  object: Validator.isObject,
  empty: Validator.isEmpty,
  phone: Validator.isPhone,
  postalCode: Validator.isPostalCode,
  ipAddress: Validator.isIPAddress,
};
