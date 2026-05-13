export function csvToArray(csv: string, options: { delimiter?: string; hasHeader?: boolean } = {}): { headers?: string[]; data: Record<string, string>[] | string[][] } {
  const { delimiter = ',', hasHeader = true } = options;
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell.trim());
        if (currentRow.length > 0 && currentRow.some(cell => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentCell += char;
      }
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell !== '')) {
      rows.push(currentRow);
    }
  }

  if (hasHeader && rows.length > 0) {
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });
    return { headers, data };
  }

  return { data: rows };
}

export function arrayToCSV(data: string[][] | Record<string, string>[], options: { delimiter?: string; includeHeaders?: boolean } = {}): string {
  const { delimiter = ',', includeHeaders = true } = options;
  
  if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
    const records = data as Record<string, string>[];
    if (records.length === 0) return '';
    
    const headers = Object.keys(records[0]);
    const rows: string[] = [];
    
    if (includeHeaders) {
      rows.push(headers.map(h => escapeCSVField(h, delimiter)).join(delimiter));
    }
    
    for (const record of records) {
      const row = headers.map(h => escapeCSVField(String(record[h] || ''), delimiter)).join(delimiter);
      rows.push(row);
    }
    
    return rows.join('\n');
  }

  const rows = data as string[][];
  return rows.map(row => row.map(cell => escapeCSVField(cell, delimiter)).join(delimiter)).join('\n');
}

function escapeCSVField(field: string, delimiter: string): string {
  if (field.includes(delimiter) || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function parseCSVLine(line: string, delimiter = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

export function transformCSV<T extends Record<string, string>>(
  csv: string,
  transformer: (row: T) => T,
  options?: { delimiter?: string; hasHeader?: boolean }
): string {
  const parsed = csvToArray(csv, options);
  
  if ('headers' in parsed && parsed.data) {
    const transformed = (parsed.data as T[]).map(transformer);
    return arrayToCSV(transformed as unknown as string[][], { includeHeaders: true });
  }
  
  return csv;
}

export function filterCSV<T extends Record<string, string>>(
  csv: string,
  predicate: (row: T) => boolean,
  options?: { delimiter?: string; hasHeader?: boolean }
): string {
  return transformCSV(csv, (row) => row, options);
}

export function sortCSV(
  csv: string,
  column: string,
  descending = false,
  options?: { delimiter?: string; hasHeader?: boolean }
): string {
  const parsed = csvToArray(csv, options);
  
  if (!('headers' in parsed) || !parsed.headers || !parsed.data) {
    return csv;
  }

  const headers = parsed.headers;
  const columnIndex = headers.indexOf(column);
  if (columnIndex === -1) return csv;

  const data = parsed.data as Record<string, string>[];
  const sorted = [...data].sort((a, b) => {
    const aVal = a[column] || '';
    const bVal = b[column] || '';
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
    return descending ? -cmp : cmp;
  });

  return arrayToCSV(sorted as unknown as string[][], { includeHeaders: true });
}

export function joinCSV(
  csv1: string,
  csv2: string,
  keyColumn: string,
  options?: { delimiter?: string; hasHeader?: boolean }
): string {
  const parsed1 = csvToArray(csv1, options);
  const parsed2 = csvToArray(csv2, options);

  if (!('headers' in parsed1) || !parsed1.headers || !parsed1.data ||
      !('headers' in parsed2) || !parsed2.headers || !parsed2.data) {
    return csv1;
  }

  const headers1 = parsed1.headers.filter(h => h !== keyColumn);
  const headers2 = parsed2.headers.filter(h => h !== keyColumn);
  const combinedHeaders = [keyColumn, ...headers1, ...headers2];

  const map2 = new Map<string, Record<string, string>>();
  for (const row of parsed2.data) {
    if (Array.isArray(row)) continue;
    const key = (row as Record<string, string>)[keyColumn];
    if (key) map2.set(key, row as Record<string, string>);
  }

  const combinedData: Record<string, string>[] = [];
  for (const row of parsed1.data) {
    if (Array.isArray(row)) continue;
    const key = (row as Record<string, string>)[keyColumn];
    const row2 = map2.get(key);
    const combined: Record<string, string> = { [keyColumn]: key };
    
    for (const h of headers1) {
      combined[h] = (row as Record<string, string>)[h] || '';
    }
    for (const h of headers2) {
      combined[h] = row2?.[h] || '';
    }
    
    combinedData.push(combined);
  }

  return arrayToCSV(combinedData as unknown as string[][], { includeHeaders: true });
}

export function aggregateCSV(
  csv: string,
  groupColumn: string,
  aggregations: Record<string, 'sum' | 'avg' | 'count' | 'min' | 'max'>,
  options?: { delimiter?: string; hasHeader?: boolean }
): string {
  const parsed = csvToArray(csv, options);

  if (!('headers' in parsed) || !parsed.data) {
    return csv;
  }

  const headers = parsed.headers || [];
  const data = parsed.data as Record<string, string>[];
  const groups = new Map<string, Record<string, number[]>>();

  for (const row of data) {
    const key = row[groupColumn];
    if (!groups.has(key)) {
      groups.set(key, {});
      for (const aggCol of Object.keys(aggregations)) {
        groups.get(key)![aggCol] = [];
      }
    }

    const group = groups.get(key)!;
    for (const [aggCol, aggType] of Object.entries(aggregations)) {
      if (aggType === 'count') continue;
      const value = parseFloat(row[aggCol]);
      if (!isNaN(value)) {
        group[aggCol].push(value);
      }
    }
  }

  const resultHeaders = [groupColumn, ...Object.keys(aggregations)];
  const resultData: Record<string, string>[] = [];

  for (const [key, group] of groups) {
    const row: Record<string, string> = { [groupColumn]: key };
    
    for (const [aggCol, aggType] of Object.entries(aggregations)) {
      const values = group[aggCol] || [];
      switch (aggType) {
        case 'sum':
          row[aggCol] = values.reduce((a, b) => a + b, 0).toString();
          break;
        case 'avg':
          row[aggCol] = (values.reduce((a, b) => a + b, 0) / values.length || 0).toString();
          break;
        case 'count':
          row[aggCol] = values.length.toString();
          break;
        case 'min':
          row[aggCol] = Math.min(...values).toString();
          break;
        case 'max':
          row[aggCol] = Math.max(...values).toString();
          break;
      }
    }
    
    resultData.push(row);
  }

  return arrayToCSV(resultData as unknown as string[][], { includeHeaders: true });
}

export class CSVReader {
  private delimiter: string;
  private hasHeader: boolean;

  constructor(delimiter = ',', hasHeader = true) {
    this.delimiter = delimiter;
    this.hasHeader = hasHeader;
  }

  read(csv: string): { headers?: string[]; data: Record<string, string>[] | string[][] } {
    return csvToArray(csv, { delimiter: this.delimiter, hasHeader: this.hasHeader });
  }

  readAsync(csv: string): Promise<{ headers?: string[]; data: Record<string, string>[] | string[][] }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.read(csv));
      }, 0);
    });
  }
}

export class CSVWriter {
  private delimiter: string;
  private includeHeaders: boolean;

  constructor(delimiter = ',', includeHeaders = true) {
    this.delimiter = delimiter;
    this.includeHeaders = includeHeaders;
  }

  write(data: string[][] | Record<string, string>[]): string {
    return arrayToCSV(data, { delimiter: this.delimiter, includeHeaders: this.includeHeaders });
  }

  writeAsync(data: string[][] | Record<string, string>[]): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.write(data));
      }, 0);
    });
  }
}
