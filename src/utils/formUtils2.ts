export interface FormField {
  name: string;
  value: unknown;
  touched?: boolean;
  dirty?: boolean;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
}

export interface FormConfig {
  initialValues?: Record<string, unknown>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;
  onError?: (errors: Record<string, string>) => void;
}

export type ValidationFn = (value: unknown, values?: Record<string, unknown>) => string | undefined;

export class FormUtils2 {
  static validateRequired(value: unknown): string | undefined {
    if (value === null || value === undefined) {
      return 'This field is required';
    }
    if (typeof value === 'string' && value.trim() === '') {
      return 'This field is required';
    }
    if (Array.isArray(value) && value.length === 0) {
      return 'This field is required';
    }
    return undefined;
  }

  static validateEmail(value: unknown): string | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(value))) {
      return 'Please enter a valid email address';
    }
    return undefined;
  }

  static validateMinLength(min: number): ValidationFn {
    return (value: unknown): string | undefined => {
      if (value === null || value === undefined || value === '') return undefined;
      const str = String(value);
      if (str.length < min) {
        return `Must be at least ${min} characters`;
      }
      return undefined;
    };
  }

  static validateMaxLength(max: number): ValidationFn {
    return (value: unknown): string | undefined => {
      if (value === null || value === undefined || value === '') return undefined;
      const str = String(value);
      if (str.length > max) {
        return `Must be no more than ${max} characters`;
      }
      return undefined;
    };
  }

  static validateMin(min: number): ValidationFn {
    return (value: unknown): string | undefined => {
      if (value === null || value === undefined || value === '') return undefined;
      const num = Number(value);
      if (isNaN(num) || num < min) {
        return `Must be at least ${min}`;
      }
      return undefined;
    };
  }

  static validateMax(max: number): ValidationFn {
    return (value: unknown): string | undefined => {
      if (value === null || value === undefined || value === '') return undefined;
      const num = Number(value);
      if (isNaN(num) || num > max) {
        return `Must be no more than ${max}`;
      }
      return undefined;
    };
  }

  static validatePattern(pattern: RegExp, message: string = 'Invalid format'): ValidationFn {
    return (value: unknown): string | undefined => {
      if (value === null || value === undefined || value === '') return undefined;
      if (!pattern.test(String(value))) {
        return message;
      }
      return undefined;
    };
  }

  static validateUrl(value: unknown): string | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    try {
      new URL(String(value));
      return undefined;
    } catch {
      return 'Please enter a valid URL';
    }
  }

  static validatePhone(value: unknown): string | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const cleaned = String(value).replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(String(value)) || cleaned.length < 10) {
      return 'Please enter a valid phone number';
    }
    return undefined;
  }

  static validateMatch(matchValue: unknown, message: string = 'Values do not match'): ValidationFn {
    return (value: unknown): string | undefined => {
      if (value !== matchValue) {
        return message;
      }
      return undefined;
    };
  }

  static validateCreditCard(value: unknown): string | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const cleaned = String(value).replace(/[\s\-]/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) {
      return 'Please enter a valid credit card number';
    }

    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      isEven = !isEven;
    }

    if (sum % 10 !== 0) {
      return 'Please enter a valid credit card number';
    }

    return undefined;
  }

  static validateZipCode(value: unknown): string | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(String(value))) {
      return 'Please enter a valid ZIP code';
    }
    return undefined;
  }

  static validatePassword(value: unknown, options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
  } = {}): string | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const str = String(value);
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumber = true,
      requireSpecial = true
    } = options;

    if (str.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }
    if (requireUppercase && !/[A-Z]/.test(str)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (requireLowercase && !/[a-z]/.test(str)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (requireNumber && !/\d/.test(str)) {
      return 'Password must contain at least one number';
    }
    if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(str)) {
      return 'Password must contain at least one special character';
    }

    return undefined;
  }

  static combineValidators(...validators: ValidationFn[]): ValidationFn {
    return (value: unknown, values?: Record<string, unknown>): string | undefined => {
      for (const validator of validators) {
        const error = validator(value, values);
        if (error) return error;
      }
      return undefined;
    };
  }

  static conditionalValidator(
    condition: (values: Record<string, unknown>) => boolean,
    validator: ValidationFn
  ): ValidationFn {
    return (value: unknown, values?: Record<string, unknown>): string | undefined => {
      if (values && condition(values)) {
        return validator(value, values);
      }
      return undefined;
    };
  }

  static validateDate(value: unknown): string | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const date = new Date(String(value));
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date';
    }
    return undefined;
  }

  static validateDateRange(min?: Date, max?: Date): ValidationFn {
    return (value: unknown): string | undefined => {
      if (value === null || value === undefined || value === '') return undefined;
      const date = new Date(String(value));

      if (min && date < min) {
        return `Date must be after ${min.toLocaleDateString()}`;
      }
      if (max && date > max) {
        return `Date must be before ${max.toLocaleDateString()}`;
      }

      return undefined;
    };
  }
}

export class FormFieldHelper {
  static getInputValue(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string | string[] | boolean {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        return element.checked;
      }
      if (element.type === 'radio') {
        return element.value;
      }
      return element.value;
    }
    return element.value;
  }

  static setInputValue(
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    value: unknown
  ): void {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        element.checked = Boolean(value);
      } else if (element.type === 'radio') {
        if (element.value === String(value)) {
          element.checked = true;
        }
      } else {
        element.value = String(value ?? '');
      }
    } else {
      element.value = String(value ?? '');
    }
  }

  static resetForm(form: HTMLFormElement): void {
    form.reset();
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input instanceof HTMLInputElement) {
        if (input.type === 'checkbox' || input.type === 'radio') {
          input.checked = input.defaultChecked ?? false;
        } else {
          input.value = input.defaultValue ?? '';
        }
      } else {
        (input as HTMLInputElement).value = (input as HTMLInputElement).defaultValue ?? '';
      }
    });
  }

  static serializeForm(form: HTMLFormElement): Record<string, string | string[]> {
    const formData = new FormData(form);
    const result: Record<string, string | string[]> = {};

    formData.forEach((value, key) => {
      if (result[key]) {
        if (Array.isArray(result[key])) {
          (result[key] as string[]).push(String(value));
        } else {
          result[key] = [result[key] as string, String(value)];
        }
      } else {
        result[key] = String(value);
      }
    });

    return result;
  }

  static getFormValues(form: HTMLFormElement): Record<string, unknown> {
    return this.serializeForm(form) as Record<string, unknown>;
  }

  static focusFirstInvalid(form: HTMLFormElement): HTMLElement | null {
    const invalidInputs = form.querySelectorAll(':invalid');
    if (invalidInputs.length > 0) {
      const firstInvalid = invalidInputs[0] as HTMLElement;
      firstInvalid.focus();
      return firstInvalid;
    }
    return null;
  }

  static clearValidation(form: HTMLFormElement): void {
    const inputs = form.querySelectorAll('.is-invalid, .is-valid');
    inputs.forEach(input => {
      input.classList.remove('is-invalid', 'is-valid');
    });
  }

  static markFieldValid(field: HTMLElement): void {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
  }

  static markFieldInvalid(field: HTMLElement, message: string): void {
    field.classList.remove('is-valid');
    field.classList.add('is-invalid');
    const errorEl = field.parentElement?.querySelector('.invalid-feedback');
    if (errorEl) {
      errorEl.textContent = message;
    }
  }
}

export class FormValidator {
  private rules: Map<string, ValidationFn[]> = new Map();
  private errors: Map<string, string> = new Map();

  addRule(field: string, validator: ValidationFn): this {
    const existing = this.rules.get(field) || [];
    existing.push(validator);
    this.rules.set(field, existing);
    return this;
  }

  removeRule(field: string): this {
    this.rules.delete(field);
    return this;
  }

  validate(values: Record<string, unknown>): Record<string, string> {
    this.errors.clear();

    this.rules.forEach((validators, field) => {
      const value = values[field];
      for (const validator of validators) {
        const error = validator(value, values);
        if (error) {
          this.errors.set(field, error);
          break;
        }
      }
    });

    return this.getErrors();
  }

  validateField(field: string, value: unknown, allValues?: Record<string, unknown>): string | undefined {
    const validators = this.rules.get(field);
    if (!validators) return undefined;

    for (const validator of validators) {
      const error = validator(value, allValues);
      if (error) {
        this.errors.set(field, error);
        return error;
      }
    }

    this.errors.delete(field);
    return undefined;
  }

  getErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    this.errors.forEach((error, field) => {
      result[field] = error;
    });
    return result;
  }

  hasErrors(): boolean {
    return this.errors.size > 0;
  }

  getError(field: string): string | undefined {
    return this.errors.get(field);
  }

  clearErrors(): void {
    this.errors.clear();
  }
}

export function debounceFormValidation<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttleFormValidation<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

export default FormUtils2;
