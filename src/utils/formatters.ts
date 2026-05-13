export interface DateFormatOptions {
  year?: 'numeric' | '2-digit'
  month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long'
  day?: 'numeric' | '2-digit'
  hour?: 'numeric' | '2-digit'
  minute?: 'numeric' | '2-digit'
  second?: 'numeric' | '2-digit'
  weekday?: 'narrow' | 'short' | 'long'
  era?: 'narrow' | 'short' | 'long'
  timeZoneName?: 'short' | 'long'
  timeZone?: string
  localeMatcher?: 'best fit' | 'lookup'
  formatMatcher?: 'basic' | 'best fit'
  hour12?: boolean
  timeZoneOffset?: number
}

export class DateFormatter {
  private locale: string
  private options: DateFormatOptions

  constructor(locale: string = 'en', options: DateFormatOptions = {}) {
    this.locale = locale
    this.options = options
  }

  format(date: Date | number): string {
    const d = typeof date === 'number' ? new Date(date) : date

    return new Intl.DateTimeFormat(this.locale, this.options).format(d)
  }

  formatRelative(date: Date | number, baseDate?: Date | number): string {
    const d = typeof date === 'number' ? new Date(date) : date
    const base = baseDate ? (typeof baseDate === 'number' ? new Date(baseDate) : baseDate) : new Date()

    const diff = base.getTime() - d.getTime()
    const diffSeconds = Math.floor(diff / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' })

    if (Math.abs(diffSeconds) < 60) {
      return rtf.format(diffSeconds, 'second')
    } else if (Math.abs(diffMinutes) < 60) {
      return rtf.format(diffMinutes, 'minute')
    } else if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour')
    } else if (Math.abs(diffDays) < 30) {
      return rtf.format(diffDays, 'day')
    } else if (Math.abs(diffDays) < 365) {
      return rtf.format(Math.floor(diffDays / 30), 'month')
    } else {
      return rtf.format(Math.floor(diffDays / 365), 'year')
    }
  }

  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    const parts: string[] = []

    if (days > 0) parts.push(`${days}d`)
    if (hours % 24 > 0) parts.push(`${hours % 24}h`)
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`)
    if (seconds % 60 > 0) parts.push(`${seconds % 60}s`)

    return parts.join(' ') || '0s'
  }

  formatRange(start: Date | number, end: Date | number): string {
    const s = typeof start === 'number' ? new Date(start) : start
    const e = typeof end === 'number' ? new Date(end) : end
    const formatter = new Intl.DateTimeFormat(this.locale, { ...this.options })
    
    if (typeof (formatter as unknown as { formatRange: unknown }).formatRange === 'function') {
      return (formatter as unknown as { formatRange: (s: Date, e: Date) => string }).formatRange(s, e)
    }
    
    return `${this.format(s)} - ${this.format(e)}`
  }

  getLocale(): string {
    return this.locale
  }

  setLocale(locale: string): void {
    this.locale = locale
  }

  getOptions(): DateFormatOptions {
    return { ...this.options }
  }

  setOptions(options: DateFormatOptions): void {
    this.options = options
  }
}

export function formatDate(date: Date | number, options?: DateFormatOptions): string {
  return new DateFormatter('en', options).format(date)
}

export function formatRelativeTime(date: Date | number, baseDate?: Date | number): string {
  return new DateFormatter('en').formatRelative(date, baseDate)
}

export function formatDuration(milliseconds: number): string {
  return new DateFormatter('en').formatDuration(milliseconds)
}

export function formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en', options).format(num)
}

export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount)
}

export function formatPercent(value: number, decimals: number = 0, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function formatNumberCompact(num: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(num)
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular
  return plural || `${singular}s`
}

export function formatList(items: string[], style: 'long' | 'short' | 'narrow' = 'long', locale: string = 'en'): string {
  // List formatting can use Intl.ListFormat if available
  if (style === 'short') {
    return items.join(', ')
  }
  return items.join(', ')
}
