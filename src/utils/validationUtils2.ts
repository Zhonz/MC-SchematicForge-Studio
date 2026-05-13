export type ValidationRuleType = 
  | 'required' 
  | 'email' 
  | 'url' 
  | 'phone' 
  | 'minLength' 
  | 'maxLength' 
  | 'min' 
  | 'max' 
  | 'pattern' 
  | 'custom';

export interface ValidationRule {
  type: ValidationRuleType;
  message?: string;
  value?: unknown;
  validator?: (value: unknown, formValues?: Record<string, unknown>) => boolean | Promise<boolean>;
}

export interface ValidationError {
  field: string;
  message: string;
  type: ValidationRuleType;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidatorConfig {
  field: string;
  rules: ValidationRule[];
}

export class ValidationUtils2 {
  private static instance: ValidationUtils2;

  static getInstance(): ValidationUtils2 {
    if (!ValidationUtils2.instance) {
      ValidationUtils2.instance = new ValidationUtils2();
    }
    return ValidationUtils2.instance;
  }

  static isRequired(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  static isEmail(value: string): boolean {
    if (!value) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  static isUrl(value: string): boolean {
    if (!value) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  static isPhone(value: string): boolean {
    if (!value) return false;
    const phoneRegex = /^[\d\s\-+()]{7,20}$/;
    return phoneRegex.test(value);
  }

  static isPhoneInternational(value: string): boolean {
    if (!value) return false;
    const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
    return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 7;
  }

  static minLength(value: string, min: number): boolean {
    if (!value) return false;
    return value.length >= min;
  }

  static maxLength(value: string, max: number): boolean {
    if (!value) return true;
    return value.length <= max;
  }

  static min(value: number, minValue: number): boolean {
    return value >= minValue;
  }

  static max(value: number, maxValue: number): boolean {
    return value <= maxValue;
  }

  static minDate(value: Date, min: Date): boolean {
    return value >= min;
  }

  static maxDate(value: Date, max: Date): boolean {
    return value <= max;
  }

  static isPattern(value: string, pattern: RegExp | string): boolean {
    if (!value) return false;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return regex.test(value);
  }

  static isAlpha(value: string): boolean {
    if (!value) return false;
    return /^[a-zA-Z]+$/.test(value);
  }

  static isAlphanumeric(value: string): boolean {
    if (!value) return false;
    return /^[a-zA-Z0-9]+$/.test(value);
  }

  static isNumeric(value: string): boolean {
    if (!value) return false;
    return /^\d+$/.test(value);
  }

  static isInteger(value: string): boolean {
    if (!value) return false;
    return /^-?\d+$/.test(value);
  }

  static isFloat(value: string): boolean {
    if (!value) return false;
    return /^-?\d+(\.\d+)?$/.test(value);
  }

  static isHexColor(value: string): boolean {
    if (!value) return false;
    return /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(value);
  }

  static isCreditCard(value: string): boolean {
    if (!value) return false;
    const sanitized = value.replace(/\D/g, '');
    if (sanitized.length < 13 || sanitized.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  static isJSON(value: string): boolean {
    if (!value) return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static isIPAddress(value: string, version?: 4 | 6): boolean {
    if (!value) return false;
    
    if (version === 4) {
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipv4Regex.test(value)) return false;
      
      const parts = value.split('.');
      return parts.every((part) => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }
    
    if (version === 6) {
      const ipv6Regex = /^([a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/;
      return ipv6Regex.test(value);
    }
    
    return ValidationUtils2.isIPAddress(value, 4) || ValidationUtils2.isIPAddress(value, 6);
  }

  static isUUID(value: string, version?: 1 | 4): boolean {
    if (!value) return false;
    
    if (version === 4) {
      const uuid4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuid4Regex.test(value);
    }
    
    if (version === 1) {
      const uuid1Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuid1Regex.test(value);
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  static isPostalCode(value: string, country?: string): boolean {
    if (!value) return false;
    
    const patterns: Record<string, RegExp> = {
      US: /^\d{5}(-\d{4})?$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
      CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
      JP: /^\d{3}-?\d{4}$/,
      CN: /^\d{6}$/,
      DE: /^\d{5}$/,
      FR: /^\d{5}$/,
    };
    
    if (country && patterns[country]) {
      return patterns[country].test(value);
    }
    
    return Object.values(patterns).some((pattern) => pattern.test(value));
  }

  static isStrongPassword(value: string): { valid: boolean; score: number; messages: string[] } {
    const messages: string[] = [];
    let score = 0;
    
    if (value.length >= 8) {
      score += 1;
    } else {
      messages.push('至少8个字符');
    }
    
    if (/[a-z]/.test(value)) {
      score += 1;
    } else {
      messages.push('需要包含小写字母');
    }
    
    if (/[A-Z]/.test(value)) {
      score += 1;
    } else {
      messages.push('需要包含大写字母');
    }
    
    if (/\d/.test(value)) {
      score += 1;
    } else {
      messages.push('需要包含数字');
    }
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      score += 1;
    } else {
      messages.push('需要包含特殊字符');
    }
    
    return {
      valid: score >= 4,
      score,
      messages,
    };
  }

  static isUsername(value: string): boolean {
    if (!value) return false;
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(value);
  }

  static isPassword(value: string): boolean {
    if (!value) return false;
    return value.length >= 6;
  }

  static isMatch(value: string, pattern: string): boolean {
    return value === pattern;
  }

  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  static isDate(value: unknown): boolean {
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  }

  static isFutureDate(value: Date): boolean {
    return value.getTime() > new Date().getTime();
  }

  static isPastDate(value: Date): boolean {
    return value.getTime() < new Date().getTime();
  }

  static equals(value1: unknown, value2: unknown): boolean {
    return JSON.stringify(value1) === JSON.stringify(value2);
  }

  static notEquals(value1: unknown, value2: unknown): boolean {
    return !ValidationUtils2.equals(value1, value2);
  }

  static isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  static isFile(value: File): boolean {
    return value instanceof File;
  }

  static isImageFile(value: File): boolean {
    return value.type.startsWith('image/');
  }

  static maxFileSize(value: File, maxSizeMB: number): boolean {
    return value.size <= maxSizeMB * 1024 * 1024;
  }

  static allowedFileTypes(value: File, allowedTypes: string[]): boolean {
    return allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        return value.type.startsWith(type.replace('/*', '/'));
      }
      return value.type === type;
    });
  }

  static validate(
    value: unknown,
    rules: ValidationRule[],
    formValues?: Record<string, unknown>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    for (const rule of rules) {
      let isValid = true;
      
      switch (rule.type) {
        case 'required':
          isValid = ValidationUtils2.isRequired(value);
          break;
        case 'email':
          isValid = typeof value === 'string' && ValidationUtils2.isEmail(value);
          break;
        case 'url':
          isValid = typeof value === 'string' && ValidationUtils2.isUrl(value);
          break;
        case 'phone':
          isValid = typeof value === 'string' && ValidationUtils2.isPhone(value);
          break;
        case 'minLength':
          isValid = typeof value === 'string' && ValidationUtils2.minLength(value, rule.value as number);
          break;
        case 'maxLength':
          isValid = typeof value === 'string' && ValidationUtils2.maxLength(value, rule.value as number);
          break;
        case 'min':
          isValid = typeof value === 'number' && ValidationUtils2.min(value, rule.value as number);
          break;
        case 'max':
          isValid = typeof value === 'number' && ValidationUtils2.max(value, rule.value as number);
          break;
        case 'pattern':
          isValid = typeof value === 'string' && ValidationUtils2.isPattern(value, rule.value as RegExp | string);
          break;
        case 'custom':
          if (rule.validator) {
            const result = rule.validator(value, formValues);
            isValid = typeof result === 'boolean' ? result : false;
          }
          break;
      }
      
      if (!isValid) {
        errors.push({
          field: '',
          message: rule.message || `验证失败: ${rule.type}`,
          type: rule.type,
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static async validateAsync(
    value: unknown,
    rules: ValidationRule[],
    formValues?: Record<string, unknown>
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    for (const rule of rules) {
      let isValid = true;
      
      switch (rule.type) {
        case 'required':
          isValid = ValidationUtils2.isRequired(value);
          break;
        case 'email':
          isValid = typeof value === 'string' && ValidationUtils2.isEmail(value);
          break;
        case 'url':
          isValid = typeof value === 'string' && ValidationUtils2.isUrl(value);
          break;
        case 'phone':
          isValid = typeof value === 'string' && ValidationUtils2.isPhone(value);
          break;
        case 'minLength':
          isValid = typeof value === 'string' && ValidationUtils2.minLength(value, rule.value as number);
          break;
        case 'maxLength':
          isValid = typeof value === 'string' && ValidationUtils2.maxLength(value, rule.value as number);
          break;
        case 'min':
          isValid = typeof value === 'number' && ValidationUtils2.min(value, rule.value as number);
          break;
        case 'max':
          isValid = typeof value === 'number' && ValidationUtils2.max(value, rule.value as number);
          break;
        case 'pattern':
          isValid = typeof value === 'string' && ValidationUtils2.isPattern(value, rule.value as RegExp | string);
          break;
        case 'custom':
          if (rule.validator) {
            isValid = await rule.validator(value, formValues);
          }
          break;
      }
      
      if (!isValid) {
        errors.push({
          field: '',
          message: rule.message || `验证失败: ${rule.type}`,
          type: rule.type,
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export class FormValidator {
  private validators: Map<string, ValidationRule[]> = new Map();
  private errors: Map<string, ValidationError[]> = new Map();

  addRule(field: string, rule: ValidationRule): this {
    const rules = this.validators.get(field) || [];
    rules.push(rule);
    this.validators.set(field, rules);
    return this;
  }

  addRules(field: string, rules: ValidationRule[]): this {
    this.validators.set(field, rules);
    return this;
  }

  removeRules(field: string): this {
    this.validators.delete(field);
    return this;
  }

  validate(values: Record<string, unknown>): ValidationResult {
    this.errors.clear();
    const allErrors: ValidationError[] = [];
    
    this.validators.forEach((rules, field) => {
      const value = values[field];
      const result = ValidationUtils2.validate(value, rules, values);
      
      if (!result.valid) {
        this.errors.set(field, result.errors);
        allErrors.push(...result.errors.map((e) => ({ ...e, field })));
      }
    });
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  async validateAsync(values: Record<string, unknown>): Promise<ValidationResult> {
    this.errors.clear();
    const allErrors: ValidationError[] = [];
    
    for (const [field, rules] of this.validators.entries()) {
      const value = values[field];
      const result = await ValidationUtils2.validateAsync(value, rules, values);
      
      if (!result.valid) {
        this.errors.set(field, result.errors);
        allErrors.push(...result.errors.map((e) => ({ ...e, field })));
      }
    }
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  getErrors(field?: string): ValidationError[] {
    if (field) {
      return this.errors.get(field) || [];
    }
    
    const allErrors: ValidationError[] = [];
    this.errors.forEach((errors) => {
      allErrors.push(...errors);
    });
    return allErrors;
  }

  hasError(field?: string): boolean {
    if (field) {
      return (this.errors.get(field)?.length || 0) > 0;
    }
    return this.errors.size > 0;
  }

  clearErrors(field?: string): void {
    if (field) {
      this.errors.delete(field);
    } else {
      this.errors.clear();
    }
  }

  static create(): FormValidatorBuilder {
    return new FormValidatorBuilder();
  }
}

export class FormValidatorBuilder {
  private validator: FormValidator = new FormValidator();

  field(name: string): FormValidatorBuilder {
    this.currentField = name;
    return this;
  }

  private currentField: string = '';

  required(message?: string): FormValidatorBuilder {
    this.validator.addRule(this.currentField, {
      type: 'required',
      message: message || '此字段为必填项',
    });
    return this;
  }

  email(message?: string): FormValidatorBuilder {
    this.validator.addRule(this.currentField, {
      type: 'email',
      message: message || '请输入有效的邮箱地址',
    });
    return this;
  }

  minLength(min: number, message?: string): FormValidatorBuilder {
    this.validator.addRule(this.currentField, {
      type: 'minLength',
      value: min,
      message: message || `至少需要 ${min} 个字符`,
    });
    return this;
  }

  maxLength(max: number, message?: string): FormValidatorBuilder {
    this.validator.addRule(this.currentField, {
      type: 'maxLength',
      value: max,
      message: message || `最多只能输入 ${max} 个字符`,
    });
    return this;
  }

  pattern(pattern: RegExp | string, message?: string): FormValidatorBuilder {
    this.validator.addRule(this.currentField, {
      type: 'pattern',
      value: pattern,
      message: message || '格式不正确',
    });
    return this;
  }

  custom(validator: (value: unknown, formValues?: Record<string, unknown>) => boolean, message?: string): FormValidatorBuilder {
    this.validator.addRule(this.currentField, {
      type: 'custom',
      validator,
      message: message || '验证失败',
    });
    return this;
  }

  build(): FormValidator {
    return this.validator;
  }
}

export class AsyncFormValidator extends FormValidator {
  async validateAsync(values: Record<string, unknown>): Promise<ValidationResult> {
    const errors: Map<string, ValidationError[]> = new Map();
    const allErrors: ValidationError[] = [];
    
    for (const [field, rules] of (this as unknown as { validators: Map<string, ValidationRule[]> }).validators.entries()) {
      const value = values[field];
      const result = await ValidationUtils2.validateAsync(value, rules, values);
      
      if (!result.valid) {
        errors.set(field, result.errors);
        allErrors.push(...result.errors.map((e) => ({ ...e, field })));
      }
    }
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

export class FieldValidator {
  private rules: ValidationRule[] = [];
  private fieldName: string;

  constructor(fieldName: string) {
    this.fieldName = fieldName;
  }

  required(message?: string): this {
    this.rules.push({
      type: 'required',
      message: message || `${this.fieldName} 为必填项`,
    });
    return this;
  }

  email(message?: string): this {
    this.rules.push({
      type: 'email',
      message: message || `${this.fieldName} 必须是有效的邮箱`,
    });
    return this;
  }

  minLength(min: number, message?: string): this {
    this.rules.push({
      type: 'minLength',
      value: min,
      message: message || `${this.fieldName} 至少需要 ${min} 个字符`,
    });
    return this;
  }

  maxLength(max: number, message?: string): this {
    this.rules.push({
      type: 'maxLength',
      value: max,
      message: message || `${this.fieldName} 最多 ${max} 个字符`,
    });
    return this;
  }

  pattern(pattern: RegExp | string, message?: string): this {
    this.rules.push({
      type: 'pattern',
      value: pattern,
      message: message || `${this.fieldName} 格式不正确`,
    });
    return this;
  }

  custom(validator: (value: unknown) => boolean, message?: string): this {
    this.rules.push({
      type: 'custom',
      validator,
      message: message || `${this.fieldName} 验证失败`,
    });
    return this;
  }

  validate(value: unknown, formValues?: Record<string, unknown>): ValidationResult {
    const result = ValidationUtils2.validate(value, this.rules, formValues);
    return {
      valid: result.valid,
      errors: result.errors.map((e) => ({ ...e, field: this.fieldName })),
    };
  }

  async validateAsync(value: unknown, formValues?: Record<string, unknown>): Promise<ValidationResult> {
    const result = await ValidationUtils2.validateAsync(value, this.rules, formValues);
    return {
      valid: result.valid,
      errors: result.errors.map((e) => ({ ...e, field: this.fieldName })),
    };
  }

  getRules(): ValidationRule[] {
    return [...this.rules];
  }
}

export class ValidationSchemas {
  static get login(): ValidationRule[] {
    return [
      { type: 'required', message: '请输入用户名或邮箱' },
      { type: 'minLength', value: 3, message: '用户名至少3个字符' },
      { type: 'required', message: '请输入密码', value: undefined },
      { type: 'minLength', value: 6, message: '密码至少6个字符' },
    ];
  }

  static get register(): ValidationRule[] {
    return [
      { type: 'required', message: '请输入用户名' },
      { type: 'minLength', value: 3, message: '用户名至少3个字符' },
      { type: 'maxLength', value: 20, message: '用户名最多20个字符' },
      { type: 'required', message: '请输入邮箱' },
      { type: 'email', message: '请输入有效的邮箱地址' },
      { type: 'required', message: '请输入密码' },
      { type: 'minLength', value: 6, message: '密码至少6个字符' },
    ];
  }

  static get email(): ValidationRule[] {
    return [
      { type: 'required', message: '请输入邮箱地址' },
      { type: 'email', message: '请输入有效的邮箱地址' },
    ];
  }

  static get password(): ValidationRule[] {
    return [
      { type: 'required', message: '请输入密码' },
      { type: 'minLength', value: 6, message: '密码至少6个字符' },
    ];
  }

  static get phone(): ValidationRule[] {
    return [
      { type: 'required', message: '请输入手机号' },
      { type: 'phone', message: '请输入有效的手机号' },
    ];
  }

  static get url(): ValidationRule[] {
    return [
      { type: 'required', message: '请输入URL' },
      { type: 'url', message: '请输入有效的URL' },
    ];
  }
}

export default ValidationUtils2;
