export type PluralRule = (n: number) => 'one' | 'other';

export interface LocaleData {
  code: string;
  name: string;
  pluralRules?: Record<string, PluralRule>;
  translations: Record<string, string>;
  numberFormats: Record<string, Intl.NumberFormatOptions>;
  dateFormats: Record<string, Intl.DateTimeFormatOptions>;
}

const DEFAULT_LOCALE = 'en';

const locales: Map<string, LocaleData> = new Map();

export function registerLocale(locale: LocaleData): void {
  locales.set(locale.code, locale);
}

export function getLocale(code: string): LocaleData | undefined {
  return locales.get(code);
}

export function getCurrentLocale(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.language.split('-')[0] || DEFAULT_LOCALE;
  }
  return DEFAULT_LOCALE;
}

export function setDefaultLocale(code: string): boolean {
  if (locales.has(code)) {
    return true;
  }
  return false;
}

export function t(key: string, params?: Record<string, string | number>, locale = getCurrentLocale()): string {
  const localeData = locales.get(locale) || locales.get(DEFAULT_LOCALE);
  if (!localeData) return key;

  let translation = localeData.translations[key] || key;

  if (params) {
    for (const [param, value] of Object.entries(params)) {
      translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
    }
  }

  return translation;
}

export function plural(key: string, n: number, pluralForms?: Record<string, string>, locale = getCurrentLocale()): string {
  const localeData = locales.get(locale) || locales.get(DEFAULT_LOCALE);
  
  let rule: 'one' | 'other' = 'other';
  
  if (localeData?.pluralRules && localeData.pluralRules[locale]) {
    rule = localeData.pluralRules[locale](n);
  } else if (n === 1) {
    rule = 'one';
  }

  const formKey = `${key}.${rule}`;
  const translation = localeData?.translations[formKey] || localeData?.translations[key] || key;

  return translation.replace('{n}', String(n));
}

export function formatNumber(n: number, options?: Intl.NumberFormatOptions, locale = getCurrentLocale()): string {
  return new Intl.NumberFormat(locale, options).format(n);
}

export function formatCurrency(n: number, currency: string, locale = getCurrentLocale()): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
}

export function formatPercent(n: number, locale = getCurrentLocale()): string {
  return new Intl.NumberFormat(locale, { style: 'percent' }).format(n);
}

export function formatDate(date: Date | number, options?: Intl.DateTimeFormatOptions, locale = getCurrentLocale()): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function formatRelativeTime(n: number, unit: Intl.RelativeTimeFormatUnit = 'second', locale = getCurrentLocale()): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(n, unit);
}

export function formatDuration(ms: number, locale = getCurrentLocale()): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return t('duration.days', { n: days }, locale);
  }
  if (hours > 0) {
    return t('duration.hours', { n: hours }, locale);
  }
  if (minutes > 0) {
    return t('duration.minutes', { n: minutes }, locale);
  }
  return t('duration.seconds', { n: seconds }, locale);
}

registerLocale({
  code: 'en',
  name: 'English',
  pluralRules: {
    en: (n) => n === 1 ? 'one' : 'other',
  },
  translations: {
    'hello': 'Hello',
    'world': 'World',
    'greeting': 'Hello, {name}!',
    'item.count': '{n} item',
    'item.count.one': '{n} item',
    'item.count.other': '{n} items',
    'duration.days': '{n} day(s)',
    'duration.hours': '{n} hour(s)',
    'duration.minutes': '{n} minute(s)',
    'duration.seconds': '{n} second(s)',
  },
  numberFormats: {},
  dateFormats: {},
});

registerLocale({
  code: 'zh',
  name: '中文',
  pluralRules: {
    zh: () => 'other',
  },
  translations: {
    'hello': '你好',
    'world': '世界',
    'greeting': '你好，{name}！',
    'item.count': '{n} 个项目',
    'item.count.one': '{n} 个项目',
    'item.count.other': '{n} 个项目',
    'duration.days': '{n} 天',
    'duration.hours': '{n} 小时',
    'duration.minutes': '{n} 分钟',
    'duration.seconds': '{n} 秒',
  },
  numberFormats: {},
  dateFormats: {},
});

registerLocale({
  code: 'ja',
  name: '日本語',
  pluralRules: {
    ja: () => 'other',
  },
  translations: {
    'hello': 'こんにちは',
    'world': '世界',
    'greeting': 'こんにちは、{name}！',
    'item.count': '{n} 個',
    'duration.days': '{n} 日',
    'duration.hours': '{n} 時間',
    'duration.minutes': '{n} 分',
    'duration.seconds': '{n} 秒',
  },
  numberFormats: {},
  dateFormats: {},
});

export class I18n {
  private currentLocale: string;
  private fallbackLocale = DEFAULT_LOCALE;
  private listeners: Set<() => void> = new Set();

  constructor(initialLocale?: string) {
    this.currentLocale = initialLocale || getCurrentLocale();
  }

  setLocale(locale: string): void {
    if (this.currentLocale !== locale) {
      this.currentLocale = locale;
      this.notifyListeners();
    }
  }

  getLocale(): string {
    return this.currentLocale;
  }

  setFallbackLocale(locale: string): void {
    this.fallbackLocale = locale;
  }

  t(key: string, params?: Record<string, string | number>): string {
    let result = t(key, params, this.currentLocale);
    
    if (result === key && this.currentLocale !== this.fallbackLocale) {
      result = t(key, params, this.fallbackLocale);
    }
    
    return result;
  }

  plural(key: string, n: number, pluralForms?: Record<string, string>): string {
    return plural(key, n, pluralForms, this.currentLocale);
  }

  formatNumber(n: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(n, options, this.currentLocale);
  }

  formatCurrency(n: number, currency: string): string {
    return formatCurrency(n, currency, this.currentLocale);
  }

  formatPercent(n: number): string {
    return formatPercent(n, this.currentLocale);
  }

  formatDate(date: Date | number, options?: Intl.DateTimeFormatOptions): string {
    return formatDate(date, options, this.currentLocale);
  }

  formatRelativeTime(n: number, unit: Intl.RelativeTimeFormatUnit = 'second'): string {
    return formatRelativeTime(n, unit, this.currentLocale);
  }

  formatDuration(ms: number): string {
    return formatDuration(ms, this.currentLocale);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export function createI18n(initialLocale?: string): I18n {
  return new I18n(initialLocale);
}

export const defaultI18n = createI18n();
