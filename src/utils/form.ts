export interface FormField<T = unknown> {
  value: T
  error?: string
  touched?: boolean
  dirty?: boolean
  validating?: boolean
}

export type FormRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[]
}

export interface ValidationRule<T = unknown> {
  validate: (value: unknown) => boolean
  message: string
}

export interface FormOptions<T> {
  initialValues?: Partial<T>
  rules?: FormRules<T>
  validateOnChange?: boolean
  validateOnBlur?: boolean
  onSubmit?: (values: T) => void | Promise<void>
  onError?: (errors: Partial<Record<keyof T, string>>) => void
}

export class Form<T extends Record<string, unknown> = Record<string, unknown>> {
  private fields: Map<keyof T, FormField> = new Map()
  private rules: FormRules<T> = {}
  private options: Required<FormOptions<T>>
  private listeners: Set<(fields: Map<keyof T, FormField>) => void> = new Set()
  private submitting: boolean = false

  constructor(options: FormOptions<T> = {}) {
    this.options = {
      initialValues: options.initialValues || {} as Partial<T>,
      rules: options.rules || {} as FormRules<T>,
      validateOnChange: options.validateOnChange ?? true,
      validateOnBlur: options.validateOnBlur ?? true,
      onSubmit: options.onSubmit || (() => {}),
      onError: options.onError || (() => {})
    }

    this.initializeFields()
  }

  private initializeFields(): void {
    for (const [key, value] of Object.entries(this.options.initialValues)) {
      this.fields.set(key as keyof T, {
        value: value as T[keyof T],
        touched: false,
        dirty: false,
        validating: false
      })
    }
  }

  getField<K extends keyof T>(name: K): FormField<unknown> | undefined {
    return this.fields.get(name)
  }

  getValue<K extends keyof T>(name: K): unknown {
    return this.fields.get(name)?.value
  }

  getValues(): Partial<T> {
    const values: Partial<T> = {} as Partial<T>
    this.fields.forEach((field, key) => {
      (values as Record<keyof T, unknown>)[key] = field.value
    })
    return values
  }

  setValue<K extends keyof T>(name: K, value: T[K]): void {
    const field = this.fields.get(name) || { value, touched: false, dirty: false, validating: false }
    const previousValue = field.value
    field.value = value
    field.dirty = previousValue !== value
    this.fields.set(name, field)
    this.notifyListeners()

    if (this.options.validateOnChange && field.touched) {
      this.validateField(name)
    }
  }

  setError<K extends keyof T>(name: K, error: string | undefined): void {
    const field = this.fields.get(name)
    if (field) {
      field.error = error
      this.fields.set(name, field)
      this.notifyListeners()
    }
  }

  touch<K extends keyof T>(name: K): void {
    const field = this.fields.get(name)
    if (field) {
      field.touched = true
      this.fields.set(name, field)
      this.notifyListeners()

      if (this.options.validateOnBlur) {
        this.validateField(name)
      }
    }
  }

  reset(): void {
    this.fields.clear()
    this.initializeFields()
    this.notifyListeners()
  }

  resetField<K extends keyof T>(name: K): void {
    const initialValue = this.options.initialValues[name as keyof Partial<T>]
    this.fields.set(name, {
      value: initialValue as T[K],
      touched: false,
      dirty: false,
      validating: false
    })
    this.notifyListeners()
  }

  validateField<K extends keyof T>(name: K): Promise<boolean> {
    return new Promise((resolve) => {
      const field = this.fields.get(name)
      if (!field) {
        resolve(true)
        return
      }

      const fieldRules = this.rules[name]
      if (!fieldRules || fieldRules.length === 0) {
        this.setError(name, undefined)
        resolve(true)
        return
      }

      field.validating = true
      this.fields.set(name, field)
      this.notifyListeners()

      const errors: string[] = []

      for (const rule of fieldRules) {
        if (!rule.validate(field.value)) {
          errors.push(rule.message)
        }
      }

      field.validating = false
      field.error = errors.length > 0 ? errors[0] : undefined
      this.fields.set(name, field)
      this.notifyListeners()

      resolve(errors.length === 0)
    })
  }

  validate(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const keys = Array.from(this.fields.keys())
      const results = await Promise.all(keys.map(key => this.validateField(key)))
      const isValid = results.every(result => result)
      resolve(isValid)
    })
  }

  async submit(): Promise<void> {
    if (this.submitting) return

    this.submitting = true
    this.touchAll()

    try {
      const isValid = await this.validate()

      if (isValid) {
        const values = this.getValues() as T
        await this.options.onSubmit(values)
      } else {
        const errors = this.getErrors()
        this.options.onError(errors)
      }
    } finally {
      this.submitting = false
    }
  }

  touchAll(): void {
    this.fields.forEach((_, key) => {
      this.touch(key)
    })
  }

  getErrors(): Partial<Record<keyof T, string>> {
    const errors: Partial<Record<keyof T, string>> = {}
    this.fields.forEach((field, key) => {
      if (field.error) {
        errors[key] = field.error
      }
    })
    return errors
  }

  hasErrors(): boolean {
    let hasErrors = false
    this.fields.forEach(field => {
      if (field.error) {
        hasErrors = true
      }
    })
    return hasErrors
  }

  isDirty(): boolean {
    let isDirty = false
    this.fields.forEach(field => {
      if (field.dirty) {
        isDirty = true
      }
    })
    return isDirty
  }

  isValid(): boolean {
    return !this.hasErrors()
  }

  isSubmitting(): boolean {
    return this.submitting
  }

  isFieldTouched<K extends keyof T>(name: K): boolean {
    return this.fields.get(name)?.touched || false
  }

  isFieldDirty<K extends keyof T>(name: K): boolean {
    return this.fields.get(name)?.dirty || false
  }

  subscribe(callback: (fields: Map<keyof T, FormField>) => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.fields)
      } catch {
        // Silently ignore listener errors
      }
    })
  }

  setRules(rules: FormRules<T>): void {
    this.rules = rules
  }

  addRule<K extends keyof T>(name: K, rule: ValidationRule<T[K]>): void {
    if (!this.rules[name]) {
      this.rules[name] = []
    }
    this.rules[name]!.push(rule)
  }

  removeRule<K extends keyof T>(name: K): void {
    delete this.rules[name]
  }

  destroy(): void {
    this.fields.clear()
    this.listeners.clear()
  }
}

export function createForm<T extends Record<string, unknown>>(
  options?: FormOptions<T>
): Form<T> {
  return new Form<T>(options)
}

export const required = (message: string = 'This field is required'): ValidationRule => ({
  validate: (value: unknown) => value !== null && value !== undefined && value !== '',
  message
})

export const minLength = (min: number, message?: string): ValidationRule => ({
  validate: (value: unknown) => typeof value === 'string' && value.length >= min,
  message: message || `Minimum length is ${min}`
})

export const maxLength = (max: number, message?: string): ValidationRule => ({
  validate: (value: unknown) => typeof value === 'string' && value.length <= max,
  message: message || `Maximum length is ${max}`
})

export const pattern = (regex: RegExp, message: string): ValidationRule => ({
  validate: (value: unknown) => typeof value === 'string' && regex.test(value),
  message
})

export const email = (message?: string): ValidationRule => ({
  validate: (value: unknown) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  message: message || 'Invalid email address'
})

export const min = (minValue: number, message?: string): ValidationRule => ({
  validate: (value: unknown) => typeof value === 'number' && value >= minValue,
  message: message || `Minimum value is ${minValue}`
})

export const max = (maxValue: number, message?: string): ValidationRule => ({
  validate: (value: unknown) => typeof value === 'number' && value <= maxValue,
  message: message || `Maximum value is ${maxValue}`
})
