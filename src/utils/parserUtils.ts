export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  position?: number;
}

export function parseString(input: string, expected: string): ParseResult<string> {
  if (input.startsWith(expected)) {
    return { success: true, data: expected, position: expected.length };
  }
  return { success: false, error: `Expected "${expected}"`, position: 0 };
}

export function parseRegex(input: string, pattern: RegExp): ParseResult<string> {
  const match = input.match(new RegExp(`^${pattern.source}`));
  if (match) {
    return { success: true, data: match[0], position: match[0].length };
  }
  return { success: false, error: `Expected pattern ${pattern}`, position: 0 };
}

export function parseDigits(input: string): ParseResult<string> {
  return parseRegex(input, /[0-9]+/);
}

export function parseLetters(input: string): ParseResult<string> {
  return parseRegex(input, /[a-zA-Z]+/);
}

export function parseWhitespace(input: string): ParseResult<string> {
  return parseRegex(input, /\s+/);
}

export class JSONParser {
  private pos = 0;
  private input = '';

  parse(input: string): ParseResult<unknown> {
    this.pos = 0;
    this.input = input.trim();
    try {
      const result = this.parseValue();
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: String(e), position: this.pos };
    }
  }

  private parseValue(): unknown {
    this.skipWhitespace();
    
    if (this.pos >= this.input.length) {
      throw new Error('Unexpected end of input');
    }

    const char = this.input[this.pos];

    if (char === '{') return this.parseObject();
    if (char === '[') return this.parseArray();
    if (char === '"') return this.parseString();
    if (char === 't' || char === 'f') return this.parseBoolean();
    if (char === 'n') return this.parseNull();
    if (char === '-' || (char >= '0' && char <= '9')) return this.parseNumber();

    throw new Error(`Unexpected character: ${char}`);
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  private parseObject(): Record<string, unknown> {
    this.pos++;
    const obj: Record<string, unknown> = {};

    this.skipWhitespace();
    if (this.input[this.pos] === '}') {
      this.pos++;
      return obj;
    }

    while (true) {
      this.skipWhitespace();
      const key = this.parseString();
      this.skipWhitespace();
      
      if (this.input[this.pos] !== ':') {
        throw new Error('Expected colon');
      }
      this.pos++;

      const value = this.parseValue();
      obj[key as string] = value;

      this.skipWhitespace();
      if (this.input[this.pos] === '}') {
        this.pos++;
        return obj;
      }
      if (this.input[this.pos] !== ',') {
        throw new Error('Expected comma or closing brace');
      }
      this.pos++;
    }
  }

  private parseArray(): unknown[] {
    this.pos++;
    const arr: unknown[] = [];

    this.skipWhitespace();
    if (this.input[this.pos] === ']') {
      this.pos++;
      return arr;
    }

    while (true) {
      arr.push(this.parseValue());
      this.skipWhitespace();
      
      if (this.input[this.pos] === ']') {
        this.pos++;
        return arr;
      }
      if (this.input[this.pos] !== ',') {
        throw new Error('Expected comma or closing bracket');
      }
      this.pos++;
    }
  }

  private parseString(): string {
    this.pos++;
    let result = '';

    while (this.pos < this.input.length && this.input[this.pos] !== '"') {
      if (this.input[this.pos] === '\\') {
        this.pos++;
        const escaped = this.input[this.pos];
        switch (escaped) {
          case 'n': result += '\n'; break;
          case 't': result += '\t'; break;
          case 'r': result += '\r'; break;
          case '"': result += '"'; break;
          case '\\': result += '\\'; break;
          case 'u':
            const hex = this.input.slice(this.pos + 1, this.pos + 5);
            result += String.fromCharCode(parseInt(hex, 16));
            this.pos += 4;
            break;
          default:
            result += escaped;
        }
      } else {
        result += this.input[this.pos];
      }
      this.pos++;
    }

    this.pos++;
    return result;
  }

  private parseNumber(): number {
    const start = this.pos;
    
    if (this.input[this.pos] === '-') this.pos++;
    
    while (this.pos < this.input.length && this.input[this.pos] >= '0' && this.input[this.pos] <= '9') {
      this.pos++;
    }
    
    if (this.input[this.pos] === '.') {
      this.pos++;
      while (this.pos < this.input.length && this.input[this.pos] >= '0' && this.input[this.pos] <= '9') {
        this.pos++;
      }
    }
    
    if (this.input[this.pos] === 'e' || this.input[this.pos] === 'E') {
      this.pos++;
      if (this.input[this.pos] === '+' || this.input[this.pos] === '-') this.pos++;
      while (this.pos < this.input.length && this.input[this.pos] >= '0' && this.input[this.pos] <= '9') {
        this.pos++;
      }
    }

    return parseFloat(this.input.slice(start, this.pos));
  }

  private parseBoolean(): boolean {
    if (this.input.slice(this.pos, this.pos + 4) === 'true') {
      this.pos += 4;
      return true;
    }
    this.pos += 5;
    return false;
  }

  private parseNull(): null {
    this.pos += 4;
    return null;
  }
}

export const jsonParser = new JSONParser();

export function parseJSON(input: string): ParseResult<unknown> {
  return jsonParser.parse(input);
}

export function safeParseJSON<T = unknown>(input: string, fallback?: T): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback ?? null;
  }
}

export class QueryStringParser {
  parse(queryString: string): Record<string, string> {
    const result: Record<string, string> = {};
    const query = queryString.startsWith('?') ? queryString.slice(1) : queryString;

    if (!query) return result;

    const pairs = query.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        result[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    }

    return result;
  }

  stringify(params: Record<string, unknown>): string {
    const pairs: string[] = [];
    
    for (const key in params) {
      const value = params[key];
      if (value !== null && value !== undefined) {
        pairs.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        );
      }
    }

    return pairs.join('&');
  }
}

export const queryStringParser = new QueryStringParser();

export function parseQueryString(queryString: string): Record<string, string> {
  return queryStringParser.parse(queryString);
}

export function stringifyQueryString(params: Record<string, unknown>): string {
  return queryStringParser.stringify(params);
}
