export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY/MM/DD' | 'YYYY-MM-DD HH:mm:ss';

export interface RelativeTimeOptions {
  addSuffix?: boolean;
  locale?: string;
}

export class DateUtils2 {
  static format(date: Date | number | string, format: string = 'YYYY-MM-DD'): string {
    const d = this.toDate(date);

    const patterns: Record<string, string | number> = {
      'YYYY': d.getFullYear(),
      'YY': String(d.getFullYear()).slice(-2),
      'MM': String(d.getMonth() + 1).padStart(2, '0'),
      'M': d.getMonth() + 1,
      'DD': String(d.getDate()).padStart(2, '0'),
      'D': d.getDate(),
      'HH': String(d.getHours()).padStart(2, '0'),
      'H': d.getHours(),
      'hh': String(d.getHours() % 12 || 12).padStart(2, '0'),
      'h': d.getHours() % 12 || 12,
      'mm': String(d.getMinutes()).padStart(2, '0'),
      'm': d.getMinutes(),
      'ss': String(d.getSeconds()).padStart(2, '0'),
      's': d.getSeconds(),
      'SSS': String(d.getMilliseconds()).padStart(3, '0'),
      'A': d.getHours() < 12 ? 'AM' : 'PM',
      'a': d.getHours() < 12 ? 'am' : 'pm',
      'Do': this.ordinal(d.getDate()),
      'Q': Math.ceil((d.getMonth() + 1) / 3),
      'DOW': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
      'DOW_full': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()],
      'MOY': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()],
      'MOY_full': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()]
    };

    let result = format;
    for (const [pattern, value] of Object.entries(patterns)) {
      result = result.replace(pattern, String(value));
    }

    return result;
  }

  private static ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  static toDate(date: Date | number | string): Date {
    if (date instanceof Date) return date;
    if (typeof date === 'number') return new Date(date);
    if (typeof date === 'string') return new Date(date);
    return new Date();
  }

  static isValid(date: Date | number | string): boolean {
    const d = this.toDate(date);
    return !isNaN(d.getTime());
  }

  static isToday(date: Date | number | string): boolean {
    const d = this.toDate(date);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }

  static isTomorrow(date: Date | number | string): boolean {
    const d = this.toDate(date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return d.getDate() === tomorrow.getDate() &&
           d.getMonth() === tomorrow.getMonth() &&
           d.getFullYear() === tomorrow.getFullYear();
  }

  static isYesterday(date: Date | number | string): boolean {
    const d = this.toDate(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() &&
           d.getMonth() === yesterday.getMonth() &&
           d.getFullYear() === yesterday.getFullYear();
  }

  static isSameDay(date1: Date | number | string, date2: Date | number | string): boolean {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  }

  static isWeekend(date: Date | number | string): boolean {
    const d = this.toDate(date);
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  static isLeapYear(yearOrDate: number | Date | number | string): boolean {
    let year: number;
    if (typeof yearOrDate === 'number') {
      year = yearOrDate;
    } else {
      year = this.toDate(yearOrDate).getFullYear();
    }
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  static getDaysInMonth(date: Date | number | string): number {
    const d = this.toDate(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }

  static addDays(date: Date | number | string, days: number): Date {
    const d = this.toDate(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  static addMonths(date: Date | number | string, months: number): Date {
    const d = this.toDate(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  static addYears(date: Date | number | string, years: number): Date {
    const d = this.toDate(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  static addHours(date: Date | number | string, hours: number): Date {
    const d = this.toDate(date);
    d.setHours(d.getHours() + hours);
    return d;
  }

  static addMinutes(date: Date | number | string, minutes: number): Date {
    const d = this.toDate(date);
    d.setMinutes(d.getMinutes() + minutes);
    return d;
  }

  static addSeconds(date: Date | number | string, seconds: number): Date {
    const d = this.toDate(date);
    d.setSeconds(d.getSeconds() + seconds);
    return d;
  }

  static diffInDays(date1: Date | number | string, date2: Date | number | string): number {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static diffInHours(date1: Date | number | string, date2: Date | number | string): number {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60));
  }

  static diffInMinutes(date1: Date | number | string, date2: Date | number | string): number {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60));
  }

  static diffInSeconds(date1: Date | number | string, date2: Date | number | string): number {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);
    return Math.abs(Math.floor((d2.getTime() - d1.getTime()) / 1000));
  }

  static getStartOfDay(date: Date | number | string): Date {
    const d = this.toDate(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  static getEndOfDay(date: Date | number | string): Date {
    const d = this.toDate(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  static getStartOfWeek(date: Date | number | string, startOnMonday: boolean = false): Date {
    const d = this.toDate(date);
    const day = d.getDay();
    const diff = startOnMonday ? (day === 0 ? -6 : 1 - day) : -day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  static getEndOfWeek(date: Date | number | string, startOnMonday: boolean = false): Date {
    const d = this.getStartOfWeek(date, startOnMonday);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  static getStartOfMonth(date: Date | number | string): Date {
    const d = this.toDate(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  static getEndOfMonth(date: Date | number | string): Date {
    const d = this.toDate(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  static getStartOfYear(date: Date | number | string): Date {
    const d = this.toDate(date);
    return new Date(d.getFullYear(), 0, 1);
  }

  static getEndOfYear(date: Date | number | string): Date {
    const d = this.toDate(date);
    return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  static getWeekNumber(date: Date | number | string): number {
    const d = this.toDate(date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  static getQuarter(date: Date | number | string): number {
    const d = this.toDate(date);
    return Math.ceil((d.getMonth() + 1) / 3);
  }

  static getDayOfYear(date: Date | number | string): number {
    const d = this.toDate(date);
    const startOfYear = new Date(d.getFullYear(), 0, 0);
    const diff = d.getTime() - startOfYear.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  static getAge(birthDate: Date | number | string): number {
    const birth = this.toDate(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  static formatRelative(date: Date | number | string, options: RelativeTimeOptions = {}): string {
    const d = this.toDate(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const diffSeconds = Math.floor(diff / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const rtf = new Intl.RelativeTimeFormat(options.locale || 'en', { 
      numeric: 'auto'
    });

    if (diffSeconds < 60) {
      return rtf.format(-diffSeconds, 'second');
    } else if (diffMinutes < 60) {
      return rtf.format(-diffMinutes, 'minute');
    } else if (diffHours < 24) {
      return rtf.format(-diffHours, 'hour');
    } else if (diffDays < 30) {
      return rtf.format(-diffDays, 'day');
    } else if (diffDays < 365) {
      return rtf.format(-Math.floor(diffDays / 30), 'month');
    } else {
      return rtf.format(-Math.floor(diffDays / 365), 'year');
    }
  }

  static timestamp(): number {
    return Date.now();
  }

  static unix(): number {
    return Math.floor(Date.now() / 1000);
  }

  static timezoneOffset(): number {
    return new Date().getTimezoneOffset();
  }

  static parseDateString(dateString: string): Date | null {
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/,
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
      /^(\d{2})-(\d{2})-(\d{4})$/
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        if (format === formats[0]) {
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else {
          return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
        }
      }
    }

    const parsed = new Date(dateString);
    return this.isValid(parsed) ? parsed : null;
  }

  static isBetween(
    date: Date | number | string,
    start: Date | number | string,
    end: Date | number | string
  ): boolean {
    const d = this.toDate(date);
    const s = this.toDate(start);
    const e = this.toDate(end);
    return d >= s && d <= e;
  }

  static minDate(...dates: (Date | number | string)[]): Date | null {
    if (dates.length === 0) return null;
    return dates.reduce<Date>((min, date) => {
      const d = this.toDate(date);
      return d < min ? d : min;
    }, this.toDate(dates[0]));
  }

  static maxDate(...dates: (Date | number | string)[]): Date | null {
    if (dates.length === 0) return null;
    return dates.reduce<Date>((max, date) => {
      const d = this.toDate(date);
      return d > max ? d : max;
    }, this.toDate(dates[0]));
  }

  static eachDayOfInterval(start: Date | number | string, end: Date | number | string): Date[] {
    const startDate = this.getStartOfDay(start);
    const endDate = this.getStartOfDay(end);
    const days: Date[] = [];

    while (startDate <= endDate) {
      days.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }

    return days;
  }

  static eachMonthOfInterval(start: Date | number | string, end: Date | number | string): Date[] {
    const startDate = new Date(this.toDate(start).getFullYear(), this.toDate(start).getMonth(), 1);
    const endDate = new Date(this.toDate(end).getFullYear(), this.toDate(end).getMonth(), 1);
    const months: Date[] = [];

    while (startDate <= endDate) {
      months.push(new Date(startDate));
      startDate.setMonth(startDate.getMonth() + 1);
    }

    return months;
  }

  static toISOString(date: Date | number | string): string {
    return this.toDate(date).toISOString();
  }

  static toLocaleDateString(
    date: Date | number | string,
    locale: string = 'en-US',
    options?: Intl.DateTimeFormatOptions
  ): string {
    return this.toDate(date).toLocaleDateString(locale, options);
  }

  static toLocaleTimeString(
    date: Date | number | string,
    locale: string = 'en-US',
    options?: Intl.DateTimeFormatOptions
  ): string {
    return this.toDate(date).toLocaleTimeString(locale, options);
  }

  static toLocaleString(
    date: Date | number | string,
    locale: string = 'en-US',
    options?: Intl.DateTimeFormatOptions
  ): string {
    return this.toDate(date).toLocaleString(locale, options);
  }
}

export class TimezoneUtils {
  static getTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  static getTimezoneOffset(timezone: string): number {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
  }

  static convertToTimezone(date: Date | number | string, timezone: string): Date {
    const d = DateUtils2.toDate(date);
    const isoString = d.toISOString();
    return new Date(new Date(isoString).toLocaleString('en-US', { timeZone: timezone }));
  }

  static getTimezones(): string[] {
    const supported = Intl as unknown as { supportedValuesOf?: (type: string) => string[] };
    if (supported.supportedValuesOf) {
      return supported.supportedValuesOf('timeZone');
    }
    return ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo', 'Asia/Shanghai'];
  }

  static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  static formatInTimezone(
    date: Date | number | string,
    timezone: string,
    format: string = 'YYYY-MM-DD HH:mm:ss'
  ): string {
    const d = DateUtils2.toDate(date);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    return formatter.format(d);
  }
}

export class Duration {
  private milliseconds: number;

  constructor(duration: number | string) {
    if (typeof duration === 'number') {
      this.milliseconds = duration;
    } else {
      this.milliseconds = this.parse(duration);
    }
  }

  private parse(duration: string): number {
    const match = duration.match(/^(\d+)?\s*y(?:ear)?s?\s*(\d+)?\s*mo(?:nth)?s?\s*(\d+)?\s*d(?:ay)?s?\s*(\d+)?\s*h(?:our)?s?\s*(\d+)?\s*m(?:in)?s?\s*(\d+)?\s*s(?:ec)?s?$/i);
    if (!match) {
      return parseInt(duration) || 0;
    }

    let ms = 0;
    const [, years, months, days, hours, minutes, seconds] = match;
    
    if (years) ms += parseInt(years) * 365 * 24 * 60 * 60 * 1000;
    if (months) ms += parseInt(months) * 30 * 24 * 60 * 60 * 1000;
    if (days) ms += parseInt(days) * 24 * 60 * 60 * 1000;
    if (hours) ms += parseInt(hours) * 60 * 60 * 1000;
    if (minutes) ms += parseInt(minutes) * 60 * 1000;
    if (seconds) ms += parseInt(seconds) * 1000;

    return ms;
  }

  asMilliseconds(): number {
    return this.milliseconds;
  }

  asSeconds(): number {
    return Math.floor(this.milliseconds / 1000);
  }

  asMinutes(): number {
    return Math.floor(this.milliseconds / (1000 * 60));
  }

  asHours(): number {
    return Math.floor(this.milliseconds / (1000 * 60 * 60));
  }

  asDays(): number {
    return Math.floor(this.milliseconds / (1000 * 60 * 60 * 24));
  }

  format(): string {
    const seconds = Math.floor((this.milliseconds / 1000) % 60);
    const minutes = Math.floor((this.milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((this.milliseconds / (1000 * 60 * 60)) % 24);
    const days = Math.floor(this.milliseconds / (1000 * 60 * 60 * 24));

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
  }

  static fromDays(days: number): Duration {
    return new Duration(days * 24 * 60 * 60 * 1000);
  }

  static fromHours(hours: number): Duration {
    return new Duration(hours * 60 * 60 * 1000);
  }

  static fromMinutes(minutes: number): Duration {
    return new Duration(minutes * 60 * 1000);
  }

  static fromSeconds(seconds: number): Duration {
    return new Duration(seconds * 1000);
  }
}

export default DateUtils2;
