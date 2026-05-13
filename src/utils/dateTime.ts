export type TimeUnit = 'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'y';

export interface Duration {
  value: number;
  unit: TimeUnit;
}

export interface DateFormatOptions {
  format?: string;
  locale?: string;
  timezone?: string;
}

export class DateTime {
  private date: Date;

  constructor(date?: Date | string | number) {
    if (date instanceof Date) {
      this.date = new Date(date);
    } else if (typeof date === 'string' || typeof date === 'number') {
      this.date = new Date(date);
    } else {
      this.date = new Date();
    }
  }

  static now(): DateTime {
    return new DateTime(new Date());
  }

  static today(): DateTime {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new DateTime(today);
  }

  static tomorrow(): DateTime {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return new DateTime(tomorrow);
  }

  static yesterday(): DateTime {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return new DateTime(yesterday);
  }

  static fromUnix(timestamp: number): DateTime {
    return new DateTime(timestamp * 1000);
  }

  static parse(value: string, format?: string): DateTime | null {
    if (format) {
      const parsed = DateTime.parseWithFormat(value, format);
      return parsed ? new DateTime(parsed) : null;
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : new DateTime(date);
  }

  private static parseWithFormat(value: string, format: string): Date | null {
    const pattern = DateTime.getFormatPattern(format);
    const match = value.match(pattern.regex);
    if (!match) return null;

    const date = new Date();
    for (const [key, index] of Object.entries(pattern.groups)) {
      const num = parseInt(match[index], 10);
      if (isNaN(num)) return null;

      switch (key) {
        case 'Y': date.setFullYear(num); break;
        case 'M': date.setMonth(num - 1); break;
        case 'D': date.setDate(num); break;
        case 'h': date.setHours(num); break;
        case 'm': date.setMinutes(num); break;
        case 's': date.setSeconds(num); break;
      }
    }

    return date;
  }

  private static getFormatPattern(format: string): { regex: RegExp; groups: Record<string, number> } {
    const tokens: Record<string, string> = {
      YYYY: '(?<Y>\\d{4})',
      YY: '(?<Y>\\d{2})',
      MM: '(?<M>\\d{2})',
      DD: '(?<D>\\d{2})',
      hh: '(?<h>\\d{2})',
      mm: '(?<m>\\d{2})',
      ss: '(?<s>\\d{2})',
    };

    let regex = format;
    const groups: Record<string, number> = {};
    let groupIndex = 1;

    for (const [token, pattern] of Object.entries(tokens)) {
      const idx = regex.indexOf(token);
      if (idx !== -1) {
        groups[token[0]] = groupIndex;
        regex = regex.replace(token, pattern);
        groupIndex++;
      }
    }

    return { regex: new RegExp(`^${regex}$`), groups };
  }

  add(value: number, unit: TimeUnit): DateTime {
    const date = new Date(this.date);
    const multipliers: Record<TimeUnit, number> = {
      ms: 1,
      s: 1000,
      m: 1000 * 60,
      h: 1000 * 60 * 60,
      d: 1000 * 60 * 60 * 24,
      w: 1000 * 60 * 60 * 24 * 7,
      M: 1000 * 60 * 60 * 24 * 30,
      y: 1000 * 60 * 60 * 24 * 365,
    };
    date.setTime(date.getTime() + value * multipliers[unit]);
    return new DateTime(date);
  }

  subtract(value: number, unit: TimeUnit): DateTime {
    return this.add(-value, unit);
  }

  startOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): DateTime {
    const date = new Date(this.date);
    switch (unit) {
      case 'year': date.setMonth(0, 1); date.setHours(0, 0, 0, 0); break;
      case 'month': date.setDate(1); date.setHours(0, 0, 0, 0); break;
      case 'week': date.setDate(date.getDate() - date.getDay()); date.setHours(0, 0, 0, 0); break;
      case 'day': date.setHours(0, 0, 0, 0); break;
      case 'hour': date.setMinutes(0, 0, 0); break;
      case 'minute': date.setSeconds(0, 0); break;
      case 'second': date.setMilliseconds(0); break;
    }
    return new DateTime(date);
  }

  endOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): DateTime {
    const date = new Date(this.date);
    switch (unit) {
      case 'year': date.setMonth(11, 31); date.setHours(23, 59, 59, 999); break;
      case 'month': date.setMonth(date.getMonth() + 1, 0); date.setHours(23, 59, 59, 999); break;
      case 'week': date.setDate(date.getDate() + (6 - date.getDay())); date.setHours(23, 59, 59, 999); break;
      case 'day': date.setHours(23, 59, 59, 999); break;
      case 'hour': date.setMinutes(59, 59, 999); break;
      case 'minute': date.setSeconds(59, 999); break;
      case 'second': date.setMilliseconds(999); break;
    }
    return new DateTime(date);
  }

  diff(other: DateTime, unit: TimeUnit = 'ms'): number {
    const diff = this.date.getTime() - other.date.getTime();
    const multipliers: Record<TimeUnit, number> = {
      ms: 1,
      s: 1000,
      m: 1000 * 60,
      h: 1000 * 60 * 60,
      d: 1000 * 60 * 60 * 24,
      w: 1000 * 60 * 60 * 24 * 7,
      M: 1000 * 60 * 60 * 24 * 30,
      y: 1000 * 60 * 60 * 24 * 365,
    };
    return diff / multipliers[unit];
  }

  isBefore(other: DateTime): boolean {
    return this.date < other.date;
  }

  isAfter(other: DateTime): boolean {
    return this.date > other.date;
  }

  isSame(other: DateTime, unit?: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): boolean {
    if (!unit) return this.date.getTime() === other.date.getTime();
    const a = this.startOf(unit).date;
    const b = other.startOf(unit).date;
    return a.getTime() === b.getTime();
  }

  isBetween(start: DateTime, end: DateTime): boolean {
    return this.isAfter(start) && this.isBefore(end);
  }

  isToday(): boolean {
    return this.isSame(DateTime.today(), 'day');
  }

  isTomorrow(): boolean {
    return this.isSame(DateTime.tomorrow(), 'day');
  }

  isYesterday(): boolean {
    return this.isSame(DateTime.yesterday(), 'day');
  }

  isWeekend(): boolean {
    const day = this.date.getDay();
    return day === 0 || day === 6;
  }

  isLeapYear(): boolean {
    const year = this.date.getFullYear();
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  daysInMonth(): number {
    return new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0).getDate();
  }

  dayOfYear(): number {
    const start = new Date(this.date.getFullYear(), 0, 0);
    const diff = this.date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  weekOfYear(): number {
    const start = new Date(this.date.getFullYear(), 0, 1);
    const days = Math.floor((this.date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.ceil((days + start.getDay() + 1) / 7);
  }

  format(options: DateFormatOptions = {}): string {
    const { format = 'YYYY-MM-DD HH:mm:ss' } = options;
    const values: Record<string, string | number> = {
      YYYY: this.date.getFullYear(),
      YY: this.date.getFullYear() % 100,
      MM: this.date.getMonth() + 1,
      DD: this.date.getDate(),
      hh: this.date.getHours(),
      mm: this.date.getMinutes(),
      ss: this.date.getSeconds(),
      ms: this.date.getMilliseconds(),
    };

    let result = format;
    for (const [key, value] of Object.entries(values)) {
      if (key.length === 4) {
        result = result.replace(key, String(value).padStart(4, '0'));
      } else {
        result = result.replace(key, String(value).padStart(2, '0'));
      }
    }

    return result;
  }

  toISOString(): string {
    return this.date.toISOString();
  }

  toUnix(): number {
    return Math.floor(this.date.getTime() / 1000);
  }

  toDate(): Date {
    return new Date(this.date);
  }

  valueOf(): number {
    return this.date.getTime();
  }

  getYear(): number {
    return this.date.getFullYear();
  }

  getMonth(): number {
    return this.date.getMonth() + 1;
  }

  getDay(): number {
    return this.date.getDay();
  }

  getDate(): number {
    return this.date.getDate();
  }

  getHours(): number {
    return this.date.getHours();
  }

  getMinutes(): number {
    return this.date.getMinutes();
  }

  getSeconds(): number {
    return this.date.getSeconds();
  }

  getMilliseconds(): number {
    return this.date.getMilliseconds();
  }
}

export const duration = (value: number, unit: TimeUnit): Duration => ({ value, unit });

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

export const parseDuration = (value: string): number => {
  const patterns: [RegExp, number][] = [
    [/(\d+)d/, 86400000],
    [/(\d+)h/, 3600000],
    [/(\d+)m/, 60000],
    [/(\d+)s/, 1000],
    [/(\d+)ms/, 1],
  ];

  let total = 0;
  for (const [pattern, multiplier] of patterns) {
    const match = value.match(pattern);
    if (match) {
      total += parseInt(match[1], 10) * multiplier;
    }
  }

  return total;
};

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const waitUntil = (condition: () => boolean, timeout?: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (condition()) {
        resolve(true);
      } else if (timeout && Date.now() - start >= timeout) {
        resolve(false);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};
