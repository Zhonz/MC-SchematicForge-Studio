type TranslationValue = string | Record<string, unknown>;
type TranslationData = Record<string, TranslationValue>;

class I18n {
  private locale = 'en';
  private translations: Map<string, TranslationData> = new Map();
  private listeners: Array<() => void> = [];

  setLocale(locale: string): void {
    this.locale = locale;
    this.notifyListeners();
  }

  getLocale(): string {
    return this.locale;
  }

  addTranslations(locale: string, data: TranslationData): void {
    this.translations.set(locale, data);
  }

  t(key: string, params?: Record<string, string | number>): string {
    const translation = this.getTranslation(key);
    if (typeof translation !== 'string') {
      return key;
    }
    if (!params) {
      return translation;
    }
    return translation.replace(/\{(\w+)\}/g, (_, name) => {
      return params[name] !== undefined ? String(params[name]) : `{${name}}`;
    });
  }

  private getTranslation(key: string): TranslationValue | undefined {
    const translations = this.translations.get(this.locale);
    if (!translations) return undefined;
    const keys = key.split('.');
    let value: TranslationValue | undefined = translations;
    for (const k of keys) {
      if (typeof value === 'object' && value !== null) {
        value = (value as Record<string, TranslationValue>)[k];
      } else {
        return undefined;
      }
    }
    return value;
  }

  has(key: string): boolean {
    return this.getTranslation(key) !== undefined;
  }

  getAvailableLocales(): string[] {
    return Array.from(this.translations.keys());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const i18n = new I18n();

export function createI18n(initialLocale?: string): I18n {
  const instance = new I18n();
  if (initialLocale) {
    instance.setLocale(initialLocale);
  }
  return instance;
}

export function formatNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale || i18n.getLocale()).format(value);
}

export function formatCurrency(value: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale || i18n.getLocale(), {
    style: 'currency',
    currency
  }).format(value);
}

export function formatDate(date: Date | string, locale?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale || i18n.getLocale()).format(d);
}

export function formatRelativeTime(date: Date | string, locale?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale || i18n.getLocale(), { numeric: 'auto' });

  if (days !== 0) return rtf.format(-days, 'day');
  if (hours !== 0) return rtf.format(-hours, 'hour');
  if (minutes !== 0) return rtf.format(-minutes, 'minute');
  return rtf.format(-seconds, 'second');
}

export function formatPlural(count: number, options: {
  zero?: string;
  one: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}): string {
  const rules = new Intl.PluralRules(i18n.getLocale());
  const rule = rules.select(count);
  return options[rule] || options.other;
}

export function formatList(items: string[], locale?: string): string {
  const currentLocale = locale || i18n.getLocale();
  if (typeof Intl !== 'undefined' && 'ListFormat' in Intl) {
    const ListFormatCtor = (Intl as unknown as { ListFormat: { new(locale: string, options: { type: string }): { format: (items: string[]) => string } } }).ListFormat;
    return new ListFormatCtor(currentLocale, { type: 'conjunction' }).format(items);
  }
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

export function detectBrowserLocale(): string {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage;
    if (lang) {
      const shortLang = lang.split('-')[0];
      return shortLang;
    }
  }
  return 'en';
}

export function loadTranslations(locale: string, data: TranslationData): void {
  i18n.addTranslations(locale, data);
}

export function createTranslationNamespace(ns: string, translations: TranslationData) {
  return {
    t: (key: string, params?: Record<string, string | number>) =>
      i18n.t(`${ns}.${key}`, params),
    has: (key: string) => i18n.has(`${ns}.${key}`)
  };
}
