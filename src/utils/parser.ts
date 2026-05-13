export interface Token {
  type: string;
  value: string;
  position: number;
}

export class Lexer {
  private input: string;
  private position = 0;
  private tokens: Token[] = [];

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    while (this.position < this.input.length) {
      this.skipWhitespace();
      if (this.position >= this.input.length) break;

      const char = this.input[this.position];

      if (this.isDigit(char)) {
        this.readNumber();
      } else if (this.isLetter(char) || char === '_') {
        this.readIdentifier();
      } else if (char === '"' || char === "'") {
        this.readString(char);
      } else if (this.isOperator(char)) {
        this.readOperator();
      } else {
        this.position++;
      }
    }

    return this.tokens;
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
      this.position++;
    }
  }

  private readNumber(): void {
    const start = this.position;
    while (this.position < this.input.length && (this.isDigit(this.input[this.position]) || this.input[this.position] === '.')) {
      this.position++;
    }
    this.addToken('NUMBER', this.input.substring(start, this.position));
  }

  private readIdentifier(): void {
    const start = this.position;
    while (this.position < this.input.length && (this.isLetter(this.input[this.position]) || this.isDigit(this.input[this.position]) || this.input[this.position] === '_')) {
      this.position++;
    }
    const value = this.input.substring(start, this.position);
    const type = this.isKeyword(value) ? 'KEYWORD' : 'IDENTIFIER';
    this.addToken(type, value);
  }

  private readString(quote: string): void {
    const start = this.position;
    this.position++;
    while (this.position < this.input.length && this.input[this.position] !== quote) {
      if (this.input[this.position] === '\\') this.position++;
      this.position++;
    }
    if (this.position < this.input.length) this.position++;
    this.addToken('STRING', this.input.substring(start + 1, this.position - 1));
  }

  private readOperator(): void {
    const start = this.position;
    const char = this.input[this.position];
    this.position++;
    const twoChar = this.input.substring(start, this.position + 1);
    if (this.isMultiCharOperator(twoChar)) {
      this.position++;
      this.addToken('OPERATOR', twoChar);
    } else {
      this.addToken('OPERATOR', char);
    }
  }

  private addToken(type: string, value: string): void {
    this.tokens.push({ type, value, position: this.position - value.length });
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isLetter(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }

  private isOperator(char: string): boolean {
    return /[+\-*/%=<>!&|^~?:]/.test(char);
  }

  private isMultiCharOperator(str: string): boolean {
    return ['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/='].includes(str);
  }

  private isKeyword(value: string): boolean {
    const keywords = ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'function', 'var', 'let', 'const', 'true', 'false', 'null', 'undefined'];
    return keywords.includes(value);
  }
}

export interface ParseNode {
  type: string;
  value?: string;
  children?: ParseNode[];
}

export class Parser {
  private tokens: Token[] = [];
  private position = 0;

  parse(tokens: Token[]): ParseNode {
    this.tokens = tokens;
    this.position = 0;
    return this.parseExpression();
  }

  private parseExpression(): ParseNode {
    return this.parseAdditive();
  }

  private parseAdditive(): ParseNode {
    let left = this.parseMultiplicative();

    while (this.current()?.type === 'OPERATOR' && ['+', '-'].includes(this.current()!.value)) {
      const operator = this.advance().value;
      const right = this.parseMultiplicative();
      left = { type: 'BinaryExpression', value: operator, children: [left, right] };
    }

    return left;
  }

  private parseMultiplicative(): ParseNode {
    let left = this.parsePrimary();

    while (this.current()?.type === 'OPERATOR' && ['*', '/', '%'].includes(this.current()!.value)) {
      const operator = this.advance().value;
      const right = this.parsePrimary();
      left = { type: 'BinaryExpression', value: operator, children: [left, right] };
    }

    return left;
  }

  private parsePrimary(): ParseNode {
    const token = this.current();
    if (!token) return { type: 'Empty' };

    if (token.type === 'NUMBER') {
      this.advance();
      return { type: 'NumberLiteral', value: token.value };
    }

    if (token.type === 'STRING') {
      this.advance();
      return { type: 'StringLiteral', value: token.value };
    }

    if (token.type === 'IDENTIFIER') {
      this.advance();
      return { type: 'Identifier', value: token.value };
    }

    if (token.value === '(') {
      this.advance();
      const expr = this.parseExpression();
      if (this.current()?.value === ')') this.advance();
      return expr;
    }

    return { type: 'Unknown', value: token.value };
  }

  private current(): Token | undefined {
    return this.tokens[this.position];
  }

  private advance(): Token {
    return this.tokens[this.position++];
  }
}

export function tokenize(input: string): Token[] {
  return new Lexer(input).tokenize();
}

export function parse(tokens: Token[]): ParseNode {
  return new Parser().parse(tokens);
}

export function evaluateAST(node: ParseNode, context?: Record<string, unknown>): unknown {
  switch (node.type) {
    case 'NumberLiteral':
      return parseFloat(node.value || '0');
    case 'StringLiteral':
      return node.value;
    case 'Identifier':
      return context?.[node.value || ''];
    case 'BinaryExpression': {
      const left = evaluateAST(node.children?.[0] as ParseNode, context);
      const right = evaluateAST(node.children?.[1] as ParseNode, context);
      const op = node.value;
      switch (op) {
        case '+': return (left as number) + (right as number);
        case '-': return (left as number) - (right as number);
        case '*': return (left as number) * (right as number);
        case '/': return (left as number) / (right as number);
        case '%': return (left as number) % (right as number);
        default: return 0;
      }
    }
    default:
      return undefined;
  }
}

export function evaluateExpression(expr: string, context?: Record<string, unknown>): unknown {
  const tokens = tokenize(expr);
  const ast = parse(tokens);
  return evaluateAST(ast, context);
}
