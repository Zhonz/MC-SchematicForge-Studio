export interface CSVOptions {
  delimiter?: string;
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
  trim?: boolean;
}

export class CSVParser {
  private options: Required<CSVOptions>;

  constructor(options: CSVOptions = {}) {
    this.options = {
      delimiter: options.delimiter ?? ',',
      hasHeader: options.hasHeader ?? true,
      skipEmptyLines: options.skipEmptyLines ?? true,
      trim: options.trim ?? true,
    };
  }

  parse(input: string): { headers: string[]; rows: Record<string, string>[] } | string[][] {
    const lines = input.split(/\r?\n/).filter((line) => 
      !this.options.skipEmptyLines || line.trim() !== ''
    );
    if (lines.length === 0) {
      return this.options.hasHeader ? { headers: [], rows: [] } : [];
    }
    const rows = lines.map((line) => this.parseLine(line));
    if (this.options.hasHeader) {
      const headers = rows[0]!.map((cell) => 
        this.options.trim ? cell.trim() : cell
      );
      const dataRows = rows.slice(1).map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] ?? '';
        });
        return obj;
      });
      return { headers, rows: dataRows };
    }
    return rows;
  }

  private parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i]!;
      const nextChar = line[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === this.options.delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  toCSV(data: { headers: string[]; rows: Record<string, string>[] } | string[][], options?: CSVOptions): string {
    const opts = { ...this.options, ...options };
    const delimiter = opts.delimiter;
    if (Array.isArray(data)) {
      return data.map((row) => row.map((cell) => this.escapeCSV(String(cell), delimiter)).join(delimiter)).join('\n');
    }
    const headerLine = data.headers.map((h) => this.escapeCSV(h, delimiter)).join(delimiter);
    const dataLines = data.rows.map((row) => 
      data.headers.map((h) => this.escapeCSV(row[h] ?? '', delimiter)).join(delimiter)
    );
    return [headerLine, ...dataLines].join('\n');
  }

  private escapeCSV(value: string, delimiter: string): string {
    if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

export const csvParser = new CSVParser();

export function parseCSV(input: string, options?: CSVOptions): ReturnType<CSVParser['parse']> {
  return new CSVParser(options).parse(input);
}

export function toCSV(data: { headers: string[]; rows: Record<string, string>[] } | string[][], options?: CSVOptions): string {
  return csvParser.toCSV(data, options);
}
