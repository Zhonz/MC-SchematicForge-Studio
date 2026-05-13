export interface ValidatorRule {
  validate: (value: unknown) => boolean
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export class Validator {
  private rules: Map<string, ValidatorRule[]>

  constructor() {
    this.rules = new Map()
  }

  addRule(field: string, rule: ValidatorRule): this {
    if (!this.rules.has(field)) {
      this.rules.set(field, [])
    }
    this.rules.get(field)!.push(rule)
    return this
  }

  required(field: string, message: string = 'This field is required'): this {
    return this.addRule(field, {
      validate: (value) => value !== null && value !== undefined && value !== '',
      message
    })
  }

  email(field: string, message: string = 'Invalid email address'): this {
    return this.addRule(field, {
      validate: (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message
    })
  }

  minLength(field: string, min: number, message?: string): this {
    return this.addRule(field, {
      validate: (value) => typeof value === 'string' && value.length >= min,
      message: message || `Minimum length is ${min}`
    })
  }

  maxLength(field: string, max: number, message?: string): this {
    return this.addRule(field, {
      validate: (value) => typeof value === 'string' && value.length <= max,
      message: message || `Maximum length is ${max}`
    })
  }

  min(field: string, min: number, message?: string): this {
    return this.addRule(field, {
      validate: (value) => typeof value === 'number' && value >= min,
      message: message || `Minimum value is ${min}`
    })
  }

  max(field: string, max: number, message?: string): this {
    return this.addRule(field, {
      validate: (value) => typeof value === 'number' && value <= max,
      message: message || `Maximum value is ${max}`
    })
  }

  pattern(field: string, regex: RegExp, message: string = 'Invalid format'): this {
    return this.addRule(field, {
      validate: (value) => typeof value === 'string' && regex.test(value),
      message
    })
  }

  custom(field: string, fn: (value: unknown) => boolean, message: string): this {
    return this.addRule(field, {
      validate: fn,
      message
    })
  }

  validate(data: Record<string, unknown>): ValidationResult {
    const errors: string[] = []

    this.rules.forEach((rules, field) => {
      const value = data[field]

      for (const rule of rules) {
        if (!rule.validate(value)) {
          errors.push(rule.message)
        }
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  validateField(field: string, value: unknown): ValidationResult {
    const rules = this.rules.get(field)
    if (!rules) {
      return { valid: true, errors: [] }
    }

    const errors: string[] = []
    for (const rule of rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  clear(field?: string): void {
    if (field) {
      this.rules.delete(field)
    } else {
      this.rules.clear()
    }
  }
}

export function createValidator(): Validator {
  return new Validator()
}

export const validators = {
  required: (message: string = 'This field is required'): ValidatorRule => ({
    validate: (value) => value !== null && value !== undefined && value !== '',
    message
  }),

  email: (message: string = 'Invalid email'): ValidatorRule => ({
    validate: (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),

  url: (message: string = 'Invalid URL'): ValidatorRule => ({
    validate: (value) => {
      try {
        new URL(value as string)
        return true
      } catch {
        return false
      }
    },
    message
  }),

  number: (message: string = 'Must be a number'): ValidatorRule => ({
    validate: (value) => !isNaN(Number(value)),
    message
  }),

  integer: (message: string = 'Must be an integer'): ValidatorRule => ({
    validate: (value) => Number.isInteger(Number(value)),
    message
  }),

  positive: (message: string = 'Must be positive'): ValidatorRule => ({
    validate: (value) => Number(value) > 0,
    message
  }),

  negative: (message: string = 'Must be negative'): ValidatorRule => ({
    validate: (value) => Number(value) < 0,
    message
  }),

  minLength: (min: number, message?: string): ValidatorRule => ({
    validate: (value) => typeof value === 'string' && value.length >= min,
    message: message || `Minimum length is ${min}`
  }),

  maxLength: (max: number, message?: string): ValidatorRule => ({
    validate: (value) => typeof value === 'string' && value.length <= max,
    message: message || `Maximum length is ${max}`
  }),

  min: (min: number, message?: string): ValidatorRule => ({
    validate: (value) => Number(value) >= min,
    message: message || `Minimum value is ${min}`
  }),

  max: (max: number, message?: string): ValidatorRule => ({
    validate: (value) => Number(value) <= max,
    message: message || `Maximum value is ${max}`
  }),

  pattern: (regex: RegExp, message: string): ValidatorRule => ({
    validate: (value) => typeof value === 'string' && regex.test(value),
    message
  }),

  creditCard: (message: string = 'Invalid credit card number'): ValidatorRule => ({
    validate: (value) => {
      const cleaned = String(value).replace(/\D/g, '')
      if (cleaned.length < 13 || cleaned.length > 19) return false
      let sum = 0
      let shouldDouble = false
      for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned.charAt(i), 10)
        if (shouldDouble) {
          digit *= 2
          if (digit > 9) digit -= 9
        }
        sum += digit
        shouldDouble = !shouldDouble
      }
      return sum % 10 === 0
    },
    message
  }),

  phone: (message: string = 'Invalid phone number'): ValidatorRule => ({
    validate: (value) => /^[\d\s\-+()]{7,}$/.test(value as string),
    message
  }),

  zipCode: (message: string = 'Invalid zip code'): ValidatorRule => ({
    validate: (value) => /^\d{5}(-\d{4})?$/.test(value as string),
    message
  }),

  password: (options: { minLength?: number; uppercase?: boolean; lowercase?: boolean; number?: boolean; special?: boolean } = {}, message: string = 'Invalid password'): ValidatorRule => ({
    validate: (value) => {
      const str = value as string
      if (options.minLength && str.length < options.minLength) return false
      if (options.uppercase && !/[A-Z]/.test(str)) return false
      if (options.lowercase && !/[a-z]/.test(str)) return false
      if (options.number && !/\d/.test(str)) return false
      if (options.special && !/[!@#$%^&*(),.?":{}|<>]/.test(str)) return false
      return true
    },
    message
  }),

  match: (field: string, data: Record<string, unknown>, message?: string): ValidatorRule => ({
    validate: (value: unknown) => value === data[field],
    message: message || 'Fields do not match'
  })
}
