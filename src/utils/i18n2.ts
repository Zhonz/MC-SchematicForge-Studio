export interface Locale {
  code: string;
  name: string;
  messages: Record<string, string>;
}

export interface TranslationOptions {
  locale?: string;
  defaultValue?: string;
  replacements?: Record<string, string | number>;
}

export class I18n {
  private locales: Map<string, Locale> = new Map();
  private currentLocale: string = 'en';
  private fallbackLocale: string = 'en';

  addLocale(locale: Locale): this {
    this.locales.set(locale.code, locale);
    return this;
  }

  setLocale(code: string): this {
    if (!this.locales.has(code)) {
      console.warn(`Locale '${code}' not found`);
      return this;
    }
    this.currentLocale = code;
    return this;
  }

  getLocale(): string {
    return this.currentLocale;
  }

  setFallbackLocale(code: string): this {
    this.fallbackLocale = code;
    return this;
  }

  t(key: string, options?: TranslationOptions): string {
    const locale = this.locales.get(options?.locale ?? this.currentLocale);
    let message = locale?.messages[key] ?? this.locales.get(this.fallbackLocale)?.messages[key];
    if (!message) {
      return options?.defaultValue ?? key;
    }
    if (options?.replacements) {
      Object.entries(options.replacements).forEach(([k, v]) => {
        message = message!.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        message = message!.replace(new RegExp(`:${k}`, 'g'), String(v));
      });
    }
    return message;
  }

  has(key: string, locale?: string): boolean {
    const loc = this.locales.get(locale ?? this.currentLocale);
    return !!loc?.messages[key];
  }

  getAvailableLocales(): string[] {
    return Array.from(this.locales.keys());
  }

  getLocaleInfo(code?: string): Locale | undefined {
    return this.locales.get(code ?? this.currentLocale);
  }
}

export const i18n = new I18n();

export function createI18n(locales: Locale[]): I18n {
  const instance = new I18n();
  locales.forEach((locale) => instance.addLocale(locale));
  return instance;
}

export function plural(
  count: number,
  forms: { one: string; few: string; many: string; other: string }
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return forms.one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms.few;
  if (mod10 === 0 || mod10 >= 5 || mod100 >= 11) return forms.many;
  return forms.other;
}

export function relativeTime(
  value: number,
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year',
  locale: string = 'en'
): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return rtf.format(value, unit);
}

export function formatNumber(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatCurrency(
  value: number,
  currency: string,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatDate(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale: string = 'en-US'
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, options).format(date);
}
