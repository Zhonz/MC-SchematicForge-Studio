export interface FormatOptions {
  precision?: number;
  separator?: string;
  prefix?: string;
  suffix?: string;
  trim?: boolean;
  pad?: boolean;
  padChar?: string;
  padLength?: number;
  align?: 'left' | 'right' | 'center';
  uppercase?: boolean;
  lowercase?: boolean;
  truncate?: boolean;
  truncateLength?: number;
  empty?: string;
}

export class FormatUtils {
  static number(value: number, options: FormatOptions = {}): string {
    const {
      precision = 2,
      separator = ',',
    } = options;

    if (isNaN(value)) return options.empty || '';

    const formatted = value.toFixed(precision);
    if (separator) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      return parts.join('.');
    }

    return formatted;
  }

  static integer(value: number, options: FormatOptions = {}): string {
    const { separator = ',' } = options;

    if (isNaN(value)) return options.empty || '';

    const formatted = Math.round(value).toString();
    if (separator) {
      return formatted.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }

    return formatted;
  }

  static percentage(value: number, options: FormatOptions = {}): string {
    const { precision = 1, suffix = '%' } = options;
    return `${this.number(value * 100, { ...options, precision })}${suffix}`;
  }

  static currency(
    value: number,
    currency: string = 'USD',
    options: FormatOptions = {}
  ): string {
    const { precision = 2, prefix = '$' } = options;
    return `${prefix}${this.number(value, { ...options, precision })}`;
  }

  static bytes(bytes: number, options: FormatOptions = {}): string {
    const { precision = 2, suffix = 'B' } = options;

    if (bytes === 0) return `0 ${suffix}`;

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);

    return `${this.number(value, { ...options, precision })} ${units[i]}`;
  }

  static time(seconds: number, options: FormatOptions = {}): string {
    const { precision = 0 } = options;

    if (seconds < 0) return options.empty || '';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];

    if (hours > 0) {
      parts.push(hours.toString());
    }

    if (minutes > 0 || hours > 0) {
      parts.push(minutes.toString().padStart(2, '0'));
    }

    parts.push(secs.toString().padStart(2, '0'));

    return parts.join(':');
  }

  static duration(milliseconds: number, options: FormatOptions = {}): string {
    const { precision = 0 } = options;

    if (milliseconds < 0) return options.empty || '';

    const seconds = Math.floor(milliseconds / 1000);
    return this.time(seconds, { precision });
  }

  static phone(value: string, format: string = '(###) ###-####'): string {
    const digits = value.replace(/\D/g, '');
    let result = '';
    let digitIndex = 0;

    for (const char of format) {
      if (char === '#') {
        if (digitIndex < digits.length) {
          result += digits[digitIndex];
          digitIndex++;
        }
      } else {
        result += char;
      }
    }

    return result;
  }

  static creditCard(value: string): string {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  static ssn(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 9) return value;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }

  static zipCode(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 9) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits.slice(0, 5);
  }

  static pad(value: string, options: FormatOptions = {}): string {
    const {
      padChar = ' ',
      padLength = 0,
      align = 'right',
    } = options;

    if (value.length >= padLength) return value;

    const padding = padChar.repeat(padLength - value.length);

    switch (align) {
      case 'left':
        return value + padding;
      case 'right':
        return padding + value;
      case 'center':
        const leftPad = padChar.repeat(Math.floor((padLength - value.length) / 2));
        const rightPad = padChar.repeat(padLength - value.length - leftPad.length);
        return leftPad + value + rightPad;
    }
  }

  static truncate(value: string, length: number, suffix: string = '...'): string {
    if (value.length <= length) return value;
    return value.slice(0, length - suffix.length) + suffix;
  }

  static capitalize(value: string): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  static titleCase(value: string): string {
    return value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static camelCase(value: string): string {
    return value
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }

  static snakeCase(value: string): string {
    return value
      .replace(/([A-Z])/g, '_$1')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  }

  static kebabCase(value: string): string {
    return value
      .replace(/([A-Z])/g, '-$1')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  static pluralize(count: number, singular: string, plural?: string): string {
    if (count === 1) return singular;
    return plural || singular + 's';
  }

  static ordinal(value: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = value % 100;
    return value + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  static relativeTime(date: Date, baseDate: Date = new Date()): string {
    const diffMs = date.getTime() - baseDate.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffWeek = Math.round(diffDay / 7);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffDay / 365);

    if (Math.abs(diffSec) < 60) return 'just now';
    if (Math.abs(diffMin) < 60) return `${diffMin} minute${Math.abs(diffMin) > 1 ? 's' : ''} ago`;
    if (Math.abs(diffHour) < 24) return `${diffHour} hour${Math.abs(diffHour) > 1 ? 's' : ''} ago`;
    if (Math.abs(diffDay) < 7) return `${diffDay} day${Math.abs(diffDay) > 1 ? 's' : ''} ago`;
    if (Math.abs(diffWeek) < 4) return `${diffWeek} week${Math.abs(diffWeek) > 1 ? 's' : ''} ago`;
    if (Math.abs(diffMonth) < 12) return `${diffMonth} month${Math.abs(diffMonth) > 1 ? 's' : ''} ago`;
    return `${diffYear} year${Math.abs(diffYear) > 1 ? 's' : ''} ago`;
  }

  static template(
    template: string,
    data: Record<string, unknown>,
    options: { regex?: RegExp } = {}
  ): string {
    const { regex = /\{\{(\w+)\}\}/g } = options;
    return template.replace(regex, (_, key) => {
      const value = data[key];
      return value !== undefined ? String(value) : '';
    });
  }
}

export class PluralRules {
  static pluralize(count: number, forms: string[]): string {
    const [one, few, many, other] = forms;
    const n = Math.abs(count);

    if (n === 1) return one;
    if (n >= 2 && n <= 4) return few;
    if (n === 0) return many;
    return other || many;
  }

  static select(count: number, forms: { zero?: string; one: string; few: string; many: string; other: string }): string {
    const n = Math.abs(count);

    if (n === 0 && forms.zero) return forms.zero;
    if (n === 1) return forms.one;
    if (n >= 2 && n <= 4) return forms.few;
    if (n === 0) return forms.many;
    return forms.other;
  }
}

export class NumberFormatter {
  private locale: string;
  private options: Intl.NumberFormatOptions;

  constructor(locale: string = 'en-US', options: Intl.NumberFormatOptions = {}) {
    this.locale = locale;
    this.options = options;
  }

  format(value: number): string {
    return new Intl.NumberFormat(this.locale, this.options).format(value);
  }

  formatPercent(value: number): string {
    return new Intl.NumberFormat(this.locale, {
      ...this.options,
      style: 'percent',
    }).format(value);
  }

  formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat(this.locale, {
      ...this.options,
      style: 'currency',
      currency,
    }).format(value);
  }

  static list(values: string[], style: 'long' | 'short' | 'narrow' = 'long'): string {
    if (values.length === 0) return '';
    if (values.length === 1) return values[0];
    
    const separators: Record<string, string> = {
      long: values.length === 2 ? ' and ' : ', ',
      short: values.length === 2 ? ', ' : ', ',
      narrow: values.length === 2 ? ', ' : ', ',
    };
    
    const sep = separators[style];
    if (values.length === 2) {
      return `${values[0]}${sep}${values[1]}`;
    }
    return values.slice(0, -1).join(', ') + sep + values[values.length - 1];
  }
}

export class DateFormatter {
  private locale: string;

  constructor(locale: string = 'en-US') {
    this.locale = locale;
  }

  format(date: Date, format: string): string {
    const options = this.parseFormat(format);
    return new Intl.DateTimeFormat(this.locale, options).format(date);
  }

  private parseFormat(format: string): Intl.DateTimeFormatOptions {
    const options: Intl.DateTimeFormatOptions = {};

    if (format.includes('YYYY')) options.year = 'numeric';
    if (format.includes('YY')) options.year = '2-digit';
    if (format.includes('MMMM')) options.month = 'long';
    if (format.includes('MMM')) options.month = 'short';
    if (format.includes('MM')) options.month = '2-digit';
    if (format.includes('M')) options.month = 'numeric';
    if (format.includes('DD')) options.day = '2-digit';
    if (format.includes('D')) options.day = 'numeric';
    if (format.includes('HH')) options.hour = '2-digit';
    if (format.includes('hh')) options.hour = '2-digit';
    if (format.includes('mm')) options.minute = '2-digit';
    if (format.includes('ss')) options.second = '2-digit';
    if (format.includes('A')) options.hour12 = true;

    return options;
  }

  relative(date: Date): string {
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' });
    const diff = date.getTime() - Date.now();
    const diffSec = Math.round(diff / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
    if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
    return this.format(date, 'MMM D, YYYY');
  }
}
