export type FormatType = 'json' | 'xml' | 'yaml' | 'csv' | 'tsv' | 'query' | 'table';

export interface ParserOptions {
  delimiter?: string;
  quote?: string;
  escape?: string;
  trim?: boolean;
  skipEmpty?: boolean;
  headers?: boolean | string[];
  columnParser?: Record<string, (value: string) => unknown>;
}

export class StringParser {
  static parseNumber(value: string): number | null {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value.trim());
    return isNaN(num) ? null : num;
  }

  static parseInt(value: string, radix = 10): number | null {
    if (value === '' || value === null || value === undefined) return null;
    const num = parseInt(value.trim(), radix);
    return isNaN(num) ? null : num;
  }

  static parseFloat(value: string): number | null {
    if (value === '' || value === null || value === undefined) return null;
    const num = parseFloat(value.trim());
    return isNaN(num) ? null : num;
  }

  static parseBoolean(value: string): boolean | null {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
      return false;
    }
    return null;
  }

  static parseDate(value: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  static parseJSON<T = unknown>(value: string): T | null {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  static parseQuery(value: string): Record<string, string> {
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(value.startsWith('?') ? value : `?${value}`);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  static parseCSV(value: string, options: ParserOptions = {}): string[][] {
    const {
      delimiter = ',',
      quote = '"',
      escape = '"',
      trim = false,
      skipEmpty = true,
    } = options;

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    let i = 0;

    while (i < value.length) {
      const char = value[i];
      const nextChar = value[i + 1];

      if (inQuotes) {
        if (char === escape && nextChar === quote) {
          currentCell += quote;
          i += 2;
          continue;
        }
        if (char === quote) {
          inQuotes = false;
          i++;
          continue;
        }
        currentCell += char;
        i++;
        continue;
      }

      if (char === quote) {
        inQuotes = true;
        i++;
        continue;
      }

      if (char === delimiter) {
        currentRow.push(trim ? currentCell.trim() : currentCell);
        currentCell = '';
        i++;
        continue;
      }

      if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(trim ? currentCell.trim() : currentCell);
        if (currentRow.length > 0 && (!skipEmpty || currentRow.some(cell => cell !== ''))) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      }

      currentCell += char;
      i++;
    }

    if (currentCell || currentRow.length > 0) {
      currentRow.push(trim ? currentCell.trim() : currentCell);
      if (!skipEmpty || currentRow.some(cell => cell !== '')) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  static parseTSV(value: string, options: Omit<ParserOptions, 'delimiter'> = {}): string[][] {
    return this.parseCSV(value, { ...options, delimiter: '\t' });
  }

  static parseXML(value: string): Record<string, unknown> | null {
    const result: Record<string, unknown> = {};
    const tagRegex = /<(\w+)(?:\s+([^>]*))?>([^<]*)<\/\1>/g;
    let match;

    while ((match = tagRegex.exec(value)) !== null) {
      const [, tagName, attributesStr, content] = match;
      const node: Record<string, unknown> = { _content: content.trim() };

      if (attributesStr) {
        const attrRegex = /(\w+)="([^"]*)"/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
          node[`@${attrMatch[1]}`] = attrMatch[2];
        }
      }

      if (result[tagName]) {
        if (Array.isArray(result[tagName])) {
          (result[tagName] as unknown[]).push(node);
        } else {
          result[tagName] = [result[tagName], node];
        }
      } else {
        result[tagName] = node;
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  static parseLines(value: string, options: { trim?: boolean; skipEmpty?: boolean } = {}): string[] {
    const { trim = false, skipEmpty = true } = options;
    const lines = value.split(/\r?\n/);
    return lines
      .map(line => trim ? line.trim() : line)
      .filter(line => !skipEmpty || line !== '');
  }

  static parseKeyValue(value: string, delimiter = '='): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = this.parseLines(value);
    for (const line of lines) {
      const idx = line.indexOf(delimiter);
      if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const val = line.substring(idx + 1).trim();
        result[key] = val;
      }
    }
    return result;
  }

  static parseNumbers(value: string): number[] {
    const matches = value.match(/-?\d+\.?\d*/g);
    if (!matches) return [];
    return matches.map(n => parseFloat(n)).filter(n => !isNaN(n));
  }

  static parseWords(value: string): string[] {
    return value.match(/\w+/g) || [];
  }

  static parseLinesToObjects(
    value: string,
    headers: string[],
    options: ParserOptions = {}
  ): Record<string, unknown>[] {
    const rows = this.parseCSV(value, options);
    return rows.map(row => {
      const obj: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        const rawValue = row[index] ?? '';
        const columnParser = options.columnParser?.[header];
        obj[header] = columnParser ? columnParser(rawValue) : rawValue;
      });
      return obj;
    });
  }
}

export class StringBuilder {
  private parts: string[] = [];

  append(value: string): this {
    this.parts.push(value);
    return this;
  }

  appendLine(value = ''): this {
    this.parts.push(value, '\n');
    return this;
  }

  appendIf(condition: boolean, value: string): this {
    if (condition) {
      this.parts.push(value);
    }
    return this;
  }

  clear(): this {
    this.parts = [];
    return this;
  }

  toString(): string {
    return this.parts.join('');
  }

  get length(): number {
    return this.toString().length;
  }

  get isEmpty(): boolean {
    return this.parts.length === 0 || this.parts.every(p => p === '');
  }
}

export class Template {
  private template: string;
  private pattern = /\{\{([^}]+)\}\}/g;

  constructor(template: string) {
    this.template = template;
  }

  render(data: Record<string, unknown>): string {
    return this.template.replace(this.pattern, (_, key) => {
      const trimmedKey = key.trim();
      const value = this.getNestedValue(data, trimmedKey);
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
  }

  static interpolate(template: string, data: Record<string, unknown>): string {
    return new Template(template).render(data);
  }

  static compile(template: string): (data: Record<string, unknown>) => string {
    return (data: Record<string, unknown>) => new Template(template).render(data);
  }
}
