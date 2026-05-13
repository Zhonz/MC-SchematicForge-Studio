export function formatDate(date: Date | string | number, format = '%Y-%m-%d %H:%M:%S'): string {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return format
    .replace('%Y', String(d.getFullYear()))
    .replace('%m', pad(d.getMonth() + 1))
    .replace('%d', pad(d.getDate()))
    .replace('%H', pad(d.getHours()))
    .replace('%M', pad(d.getMinutes()))
    .replace('%S', pad(d.getSeconds()));
}

export function parseDate(str: string): Date | null {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function diffDays(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && 
         a.getMonth() === b.getMonth() && 
         a.getDate() === b.getDate();
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function formatRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date, '%Y-%m-%d');
}
