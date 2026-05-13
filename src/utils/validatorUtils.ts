export interface ValidationRule<T = unknown> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class Validator<T = unknown> {
  private rules: Array<ValidationRule<T>> = [];

  addRule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  addRules(rules: Array<ValidationRule<T>>): this {
    this.rules.push(...rules);
    return this;
  }

  validate(value: T): ValidationResult {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  isValid(value: T): boolean {
    return this.validate(value).valid;
  }

  clear(): void {
    this.rules = [];
  }

  getRules(): Array<ValidationRule<T>> {
    return [...this.rules];
  }
}

export const required = <T>(message = '此字段为必填项'): ValidationRule<T> => ({
  validate: (value: T) => value !== null && value !== undefined && value !== '',
  message,
});

export const minLength = (min: number, message?: string): ValidationRule<string> => ({
  validate: (value: string) => value.length >= min,
  message: message || `长度至少为 ${min} 个字符`,
});

export const maxLength = (max: number, message?: string): ValidationRule<string> => ({
  validate: (value: string) => value.length <= max,
  message: message || `长度不能超过 ${max} 个字符`,
});

export const minValue = (min: number, message?: string): ValidationRule<number> => ({
  validate: (value: number) => value >= min,
  message: message || `值不能小于 ${min}`,
});

export const maxValue = (max: number, message?: string): ValidationRule<number> => ({
  validate: (value: number) => value <= max,
  message: message || `值不能大于 ${max}`,
});

export const pattern = (regex: RegExp, message?: string): ValidationRule<string> => ({
  validate: (value: string) => regex.test(value),
  message: message || '格式不正确',
});

export const email = (message = '请输入有效的邮箱地址'): ValidationRule<string> => ({
  validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  message,
});

export const url = (message = '请输入有效的 URL'): ValidationRule<string> => ({
  validate: (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  message,
});

export const phone = (message = '请输入有效的电话号码'): ValidationRule<string> => ({
  validate: (value: string) => /^[\d\s\-+()]{7,}$/.test(value),
  message,
});

export const creditCard = (message = '请输入有效的信用卡号'): ValidationRule<string> => ({
  validate: (value: string) => {
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
  },
  message,
});

export const postalCode = (country: 'US' | 'UK' | 'CN' | 'JP' = 'US', message?: string): ValidationRule<string> => {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
    CN: /^\d{6}$/,
    JP: /^\d{3}-?\d{4}$/,
  };
  return {
    validate: (value: string) => patterns[country].test(value),
    message: message || `请输入有效的${country}邮政编码`,
  };
};

export const date = (message = '请输入有效的日期'): ValidationRule<string> => ({
  validate: (value: string) => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  },
  message,
});

export const range = (min: number, max: number, message?: string): ValidationRule<number> => ({
  validate: (value: number) => value >= min && value <= max,
  message: message || `值必须在 ${min} 到 ${max} 之间`,
});

export const oneOf = <T>(values: T[], message?: string): ValidationRule<T> => ({
  validate: (value: T) => values.includes(value),
  message: message || `值必须是 ${values.join(', ')} 之一`,
});

export const notOneOf = <T>(values: T[], message?: string): ValidationRule<T> => ({
  validate: (value: T) => !values.includes(value),
  message: message || `值不能是 ${values.join(', ')} 之一`,
});

export const equals = <T>(expected: T, message?: string): ValidationRule<T> => ({
  validate: (value: T) => value === expected,
  message: message || `值必须等于 ${expected}`,
});

export const notEquals = <T>(unexpected: T, message?: string): ValidationRule<T> => ({
  validate: (value: T) => value !== unexpected,
  message: message || `值不能等于 ${unexpected}`,
});

export const custom = <T>(fn: (value: T) => boolean, message: string): ValidationRule<T> => ({
  validate: fn,
  message,
});

export const alphanumeric = (message = '只能包含字母和数字'): ValidationRule<string> => ({
  validate: (value: string) => /^[a-zA-Z0-9]+$/.test(value),
  message,
});

export const numeric = (message = '只能包含数字'): ValidationRule<string> => ({
  validate: (value: string) => /^\d+$/.test(value),
  message,
});

export const alpha = (message = '只能包含字母'): ValidationRule<string> => ({
  validate: (value: string) => /^[a-zA-Z]+$/.test(value),
  message,
});

export const strongPassword = (
  minLength = 8,
  message = '密码必须至少包含8个字符，包括大写字母、小写字母、数字和特殊字符'
): ValidationRule<string> => ({
  validate: (value: string) => {
    if (value.length < minLength) return false;
    if (!/[a-z]/.test(value)) return false;
    if (!/[A-Z]/.test(value)) return false;
    if (!/\d/.test(value)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return false;
    return true;
  },
  message,
});

export const json = (message = '请输入有效的 JSON'): ValidationRule<string> => ({
  validate: (value: string) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  message,
});

export const ipAddress = (message = '请输入有效的 IP 地址'): ValidationRule<string> => ({
  validate: (value: string) => {
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (!ipv4.test(value) && !ipv6.test(value)) return false;
    if (ipv4.test(value)) {
      return value.split('.').every(part => parseInt(part, 10) <= 255);
    }
    return true;
  },
  message,
});

export function createValidator<T>(rules: Array<ValidationRule<T>> = []): Validator<T> {
  const validator = new Validator<T>();
  validator.addRules(rules);
  return validator;
}

export class FormValidator<T extends Record<string, unknown>> {
  private fieldValidators: Map<keyof T, Validator<unknown>> = new Map();

  addField<K extends keyof T>(field: K, validator: Validator<unknown>): this {
    this.fieldValidators.set(field, validator);
    return this;
  }

  validate(data: T): Record<keyof T, ValidationResult> {
    const results = {} as Record<keyof T, ValidationResult>;

    for (const [field, validator] of this.fieldValidators) {
      results[field] = validator.validate(data[field]) as ValidationResult;
    }

    return results;
  }

  isValid(data: T): boolean {
    const results = this.validate(data);
    return Object.values(results).every(r => r.valid);
  }

  getErrors(data: T): Record<keyof T, string[]> {
    const results = this.validate(data);
    const errors = {} as Record<keyof T, string[]>;

    for (const field in results) {
      errors[field] = results[field].errors;
    }

    return errors;
  }
}
