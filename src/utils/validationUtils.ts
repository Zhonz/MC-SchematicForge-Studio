export interface ValidationRule<T = unknown> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class Validator<T = unknown> {
  private rules: ValidationRule<T>[] = [];

  addRule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  addRules(rules: ValidationRule<T>[]): this {
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

  clear(): this {
    this.rules = [];
    return this;
  }
}

export const ValidationRules = {
  required<T>(message: string = 'This field is required'): ValidationRule<T> {
    return {
      validate: (value: T) => value !== null && value !== undefined && value !== '',
      message,
    };
  },

  minLength(min: number, message?: string): ValidationRule<string> {
    return {
      validate: (value: string) => value.length >= min,
      message: message ?? `Minimum length is ${min} characters`,
    };
  },

  maxLength(max: number, message?: string): ValidationRule<string> {
    return {
      validate: (value: string) => value.length <= max,
      message: message ?? `Maximum length is ${max} characters`,
    };
  },

  minValue(min: number, message?: string): ValidationRule<number> {
    return {
      validate: (value: number) => value >= min,
      message: message ?? `Minimum value is ${min}`,
    };
  },

  maxValue(max: number, message?: string): ValidationRule<number> {
    return {
      validate: (value: number) => value <= max,
      message: message ?? `Maximum value is ${max}`,
    };
  },

  pattern(regex: RegExp, message: string): ValidationRule<string> {
    return {
      validate: (value: string) => regex.test(value),
      message,
    };
  },

  email(message: string = 'Invalid email address'): ValidationRule<string> {
    return {
      validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message,
    };
  },

  url(message: string = 'Invalid URL'): ValidationRule<string> {
    return {
      validate: (value: string) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message,
    };
  },

  numeric(message: string = 'Must be a number'): ValidationRule<string> {
    return {
      validate: (value: string) => /^\d+$/.test(value),
      message,
    };
  },

  alphabetic(message: string = 'Must contain only letters'): ValidationRule<string> {
    return {
      validate: (value: string) => /^[a-zA-Z]+$/.test(value),
      message,
    };
  },

  alphanumeric(message: string = 'Must contain only letters and numbers'): ValidationRule<string> {
    return {
      validate: (value: string) => /^[a-zA-Z0-9]+$/.test(value),
      message,
    };
  },

  phone(message: string = 'Invalid phone number'): ValidationRule<string> {
    return {
      validate: (value: string) => /^[\d\s\-+()]+$/.test(value) && value.replace(/\D/g, '').length >= 10,
      message,
    };
  },

  creditCard(message: string = 'Invalid credit card number'): ValidationRule<string> {
    return {
      validate: (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length < 13 || cleaned.length > 19) return false;
        
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
    };
  },

  json(message: string = 'Invalid JSON'): ValidationRule<string> {
    return {
      validate: (value: string) => {
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      },
      message,
    };
  },

  matches(other: string, message: string): ValidationRule<{ [key: string]: string }> {
    return {
      validate: (value: { [key: string]: string }) => value.password === value.confirmPassword,
      message,
    };
  },

  custom<T>(fn: (value: T) => boolean, message: string): ValidationRule<T> {
    return { validate: fn, message };
  },

  oneOf<T>(options: T[], message?: string): ValidationRule<T> {
    return {
      validate: (value: T) => options.includes(value),
      message: message ?? `Value must be one of: ${options.join(', ')}`,
    };
  },

  notOneOf<T>(options: T[], message?: string): ValidationRule<T> {
    return {
      validate: (value: T) => !options.includes(value),
      message: message ?? `Value must not be one of: ${options.join(', ')}`,
    };
  },

  inRange(min: number, max: number, message?: string): ValidationRule<number> {
    return {
      validate: (value: number) => value >= min && value <= max,
      message: message ?? `Value must be between ${min} and ${max}`,
    };
  },

  ipv4(message: string = 'Invalid IPv4 address'): ValidationRule<string> {
    return {
      validate: (value: string) => {
        const parts = value.split('.');
        if (parts.length !== 4) return false;
        return parts.every(part => {
          const num = parseInt(part, 10);
          return num >= 0 && num <= 255 && part === String(num);
        });
      },
      message,
    };
  },

  ipv6(message: string = 'Invalid IPv6 address'): ValidationRule<string> {
    return {
      validate: (value: string) => {
        const parts = value.split(':');
        if (parts.length > 8) return false;
        return parts.every(part => /^[0-9a-fA-F]{0,4}$/.test(part));
      },
      message,
    };
  },

  uuid(message: string = 'Invalid UUID'): ValidationRule<string> {
    return {
      validate: (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
      message,
    };
  },

  base64(message: string = 'Invalid base64'): ValidationRule<string> {
    return {
      validate: (value: string) => {
        try {
          return btoa(atob(value)) === value;
        } catch {
          return false;
        }
      },
      message,
    };
  },

  hexColor(message: string = 'Invalid hex color'): ValidationRule<string> {
    return {
      validate: (value: string) => /^#([0-9A-F]{3}){1,2}$/i.test(value),
      message,
    };
  },

  postalCode(country: 'US' | 'UK' | 'CA' | 'DE' = 'US', message?: string): ValidationRule<string> {
    const patterns: Record<string, RegExp> = {
      US: /^\d{5}(-\d{4})?$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
      CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
      DE: /^\d{5}$/,
    };
    return {
      validate: (value: string) => patterns[country].test(value),
      message: message ?? `Invalid postal code for ${country}`,
    };
  },

  password(options: {
    minLength?: number;
    maxLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
  } = {}, message?: string): ValidationRule<string> {
    const {
      minLength = 8,
      maxLength = 128,
      requireUppercase = true,
      requireLowercase = true,
      requireNumber = true,
      requireSpecial = true,
    } = options;

    return {
      validate: (value: string) => {
        if (value.length < minLength || value.length > maxLength) return false;
        if (requireUppercase && !/[A-Z]/.test(value)) return false;
        if (requireLowercase && !/[a-z]/.test(value)) return false;
        if (requireNumber && !/\d/.test(value)) return false;
        if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) return false;
        return true;
      },
      message: message ?? 'Password does not meet requirements',
    };
  },
};

export class FormValidator<T extends Record<string, unknown>> {
  private fieldValidators: Map<keyof T, Validator<unknown>> = new Map();
  private fieldDependencies: Map<keyof T, Set<keyof T>> = new Map();

  addFieldValidator(field: keyof T, validator: Validator<unknown>): this {
    this.fieldValidators.set(field, validator);
    return this;
  }

  addDependency(field: keyof T, dependsOn: keyof T): this {
    if (!this.fieldDependencies.has(field)) {
      this.fieldDependencies.set(field, new Set());
    }
    this.fieldDependencies.get(field)!.add(dependsOn);
    return this;
  }

  validateField(field: keyof T, value: unknown, formData?: T): ValidationResult {
    const validator = this.fieldValidators.get(field);
    if (!validator) {
      return { valid: true, errors: [] };
    }

    const dependencies = this.fieldDependencies.get(field);
    if (dependencies && formData) {
      for (const dep of dependencies) {
        if (!formData[dep]) {
          return { valid: true, errors: [] };
        }
      }
    }

    return validator.validate(value) as ValidationResult;
  }

  validate(formData: T): Map<keyof T, ValidationResult> {
    const results = new Map<keyof T, ValidationResult>();

    for (const [field, validator] of this.fieldValidators) {
      results.set(field, this.validateField(field, formData[field], formData));
    }

    return results;
  }

  isValid(formData: T): boolean {
    const results = this.validate(formData);
    for (const result of results.values()) {
      if (!result.valid) return false;
    }
    return true;
  }

  getAllErrors(formData: T): Record<keyof T, string[]> {
    const results = this.validate(formData);
    const errors = {} as Record<keyof T, string[]>;

    for (const [field, result] of results) {
      errors[field] = result.errors;
    }

    return errors;
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === String(num);
  });
}

export function isValidIPv6(ip: string): boolean {
  const parts = ip.split(':');
  if (parts.length > 8) return false;
  return parts.every(part => /^[0-9a-fA-F]{0,4}$/.test(part));
}

export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  return true;
}

export function isValidCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
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

export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, char => map[char]);
}
