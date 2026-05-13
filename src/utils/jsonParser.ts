export interface Token {
  type: string;
  value: string;
}

export type ParseResult = 
  | { success: true; value: unknown }
  | { success: false; error: string };

export class JSONParser {
  private tokens: Token[] = [];
  private position = 0;

  parse(input: string): ParseResult {
    try {
      this.tokens = this.tokenize(input);
      this.position = 0;
      const value = this.parseValue();
      return { success: true, value };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Parse error' };
    }
  }

  private tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < input.length) {
      const char = input[i]!;
      if (/\s/.test(char)) {
        i++;
      } else if (char === '"') {
        const start = i;
        i++;
        let value = '';
        while (i < input.length && input[i] !== '"') {
          if (input[i] === '\\') {
            i++;
            value += input[i] ?? '';
            i++;
          } else {
            value += input[i] ?? '';
            i++;
          }
        }
        i++;
        tokens.push({ type: 'STRING', value });
      } else if (/[0-9-]/.test(char)) {
        let value = '';
        while (i < input.length && /[0-9.eE+-]/.test(input[i]!)) {
          value += input[i] ?? '';
          i++;
        }
        tokens.push({ type: 'NUMBER', value });
      } else if (input.startsWith('true', i)) {
        tokens.push({ type: 'TRUE', value: 'true' });
        i += 4;
      } else if (input.startsWith('false', i)) {
        tokens.push({ type: 'FALSE', value: 'false' });
        i += 5;
      } else if (input.startsWith('null', i)) {
        tokens.push({ type: 'NULL', value: 'null' });
        i += 4;
      } else if (char === '[') {
        tokens.push({ type: 'LBRACKET', value: '[' });
        i++;
      } else if (char === ']') {
        tokens.push({ type: 'RBRACKET', value: ']' });
        i++;
      } else if (char === '{') {
        tokens.push({ type: 'LBRACE', value: '{' });
        i++;
      } else if (char === '}') {
        tokens.push({ type: 'RBRACE', value: '}' });
        i++;
      } else if (char === ':') {
        tokens.push({ type: 'COLON', value: ':' });
        i++;
      } else if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        i++;
      } else {
        i++;
      }
    }
    return tokens;
  }

  private current(): Token {
    return this.tokens[this.position] ?? { type: 'EOF', value: '' };
  }

  private consume(): Token {
    return this.tokens[this.position++] ?? { type: 'EOF', value: '' };
  }

  private parseValue(): unknown {
    const token = this.current();
    switch (token.type) {
      case 'STRING':
        this.consume();
        return token.value;
      case 'NUMBER':
        this.consume();
        return parseFloat(token.value);
      case 'TRUE':
        this.consume();
        return true;
      case 'FALSE':
        this.consume();
        return false;
      case 'NULL':
        this.consume();
        return null;
      case 'LBRACKET':
        return this.parseArray();
      case 'LBRACE':
        return this.parseObject();
      default:
        throw new Error(`Unexpected token: ${token.type}`);
    }
  }

  private parseArray(): unknown[] {
    this.consume();
    const array: unknown[] = [];
    if (this.current().type !== 'RBRACKET') {
      array.push(this.parseValue());
      while (this.current().type === 'COMMA') {
        this.consume();
        array.push(this.parseValue());
      }
    }
    if (this.current().type !== 'RBRACKET') {
      throw new Error('Expected ]');
    }
    this.consume();
    return array;
  }

  private parseObject(): Record<string, unknown> {
    this.consume();
    const obj: Record<string, unknown> = {};
    if (this.current().type !== 'RBRACE') {
      if (this.current().type !== 'STRING') {
        throw new Error('Expected property name');
      }
      const key = this.consume().value;
      if (this.current().type !== 'COLON') {
        throw new Error('Expected :');
      }
      this.consume();
      obj[key] = this.parseValue();
      while (this.current().type === 'COMMA') {
        this.consume();
        if (this.current().type !== 'STRING') {
          throw new Error('Expected property name');
        }
        const k = this.consume().value;
        if (this.current().type !== 'COLON') {
          throw new Error('Expected :');
        }
        this.consume();
        obj[k] = this.parseValue();
      }
    }
    if (this.current().type !== 'RBRACE') {
      throw new Error('Expected }');
    }
    this.consume();
    return obj;
  }
}

export const jsonParser = new JSONParser();

export function safeParseJSON(input: string, fallback?: unknown): unknown {
  const result = jsonParser.parse(input);
  if (result.success) return result.value;
  return fallback ?? null;
}
