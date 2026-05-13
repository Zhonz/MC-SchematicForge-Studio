export interface ExpressionContext {
  [key: string]: unknown;
}

export type ExpressionValue = string | number | boolean | null | undefined;

export interface ParsedExpression {
  type: 'literal' | 'variable' | 'binary' | 'unary' | 'call' | 'member' | 'index' | 'ternary';
  value?: ExpressionValue;
  operator?: string;
  left?: ParsedExpression;
  right?: ParsedExpression;
  operand?: ParsedExpression;
  callee?: string;
  args?: ParsedExpression[];
  object?: ParsedExpression;
  property?: string;
  index?: ParsedExpression;
  test?: ParsedExpression;
  consequent?: ParsedExpression;
  alternate?: ParsedExpression;
}

export class ExpressionParser {
  private pos = 0;
  private input = '';
  private tokens: Array<{ type: string; value: string }> = [];

  parse(expression: string): ParsedExpression {
    this.input = expression.trim();
    this.pos = 0;
    this.tokens = this.tokenize();
    return this.parseExpression();
  }

  private tokenize(): Array<{ type: string; value: string }> {
    const tokens: Array<{ type: string; value: string }> = [];
    let i = 0;

    while (i < this.input.length) {
      const char = this.input[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(this.input[i + 1] || ''))) {
        let num = '';
        while (i < this.input.length && /[0-9.]/.test(this.input[i])) {
          num += this.input[i++];
        }
        tokens.push({ type: 'NUMBER', value: num });
        continue;
      }

      if (char === '"' || char === "'") {
        const quote = char;
        let str = '';
        i++;
        while (i < this.input.length && this.input[i] !== quote) {
          if (this.input[i] === '\\' && i + 1 < this.input.length) {
            str += this.input[++i];
          } else {
            str += this.input[i];
          }
          i++;
        }
        i++;
        tokens.push({ type: 'STRING', value: str });
        continue;
      }

      if (/[a-zA-Z_$]/.test(char)) {
        let id = '';
        while (i < this.input.length && /[a-zA-Z0-9_$]/.test(this.input[i])) {
          id += this.input[i++];
        }
        tokens.push({ type: 'IDENTIFIER', value: id });
        continue;
      }

      const twoChar = this.input.slice(i, i + 2);
      if (['==', '!=', '>=', '<=', '&&', '||', '??'].includes(twoChar)) {
        tokens.push({ type: twoChar, value: twoChar });
        i += 2;
        continue;
      }

      const singleOps: Record<string, string> = {
        '+': 'PLUS', '-': 'MINUS', '*': 'STAR', '/': 'SLASH',
        '%': 'PERCENT', '=': 'EQUAL', '<': 'LT', '>': 'GT',
        '!': 'BANG', '&': 'AMPERSAND', '|': 'PIPE',
        '?': 'QUESTION', ':': 'COLON', '.': 'DOT',
        '(': 'LPAREN', ')': 'RPAREN', '[': 'LBRACKET', ']': 'RBRACKET',
        ',': 'COMMA',
      };

      if (singleOps[char]) {
        tokens.push({ type: singleOps[char], value: char });
        i++;
        continue;
      }

      i++;
    }

    return tokens;
  }

  private peek(): { type: string; value: string } | null {
    return this.tokens[this.pos] || null;
  }

  private consume(type?: string): { type: string; value: string } {
    const token = this.peek();
    if (!token) throw new Error('Unexpected end of expression');
    if (type && token.type !== type) throw new Error(`Expected ${type}, got ${token.type}`);
    this.pos++;
    return token;
  }

  private parseExpression(): ParsedExpression {
    return this.parseTernary();
  }

  private parseTernary(): ParsedExpression {
    let expr = this.parseOr();

    if (this.peek()?.type === 'QUESTION') {
      this.consume();
      const consequent = this.parseTernary();
      this.consume(':');
      const alternate = this.parseTernary();
      return {
        type: 'ternary',
        test: expr,
        consequent,
        alternate,
      };
    }

    return expr;
  }

  private parseOr(): ParsedExpression {
    let left = this.parseAnd();

    while (this.peek()?.type === '||') {
      this.consume();
      const right = this.parseAnd();
      left = { type: 'binary', operator: '||', left, right };
    }

    return left;
  }

  private parseAnd(): ParsedExpression {
    let left = this.parseEquality();

    while (this.peek()?.type === '&&') {
      this.consume();
      const right = this.parseEquality();
      left = { type: 'binary', operator: '&&', left, right };
    }

    return left;
  }

  private parseEquality(): ParsedExpression {
    let left = this.parseComparison();

    while (this.peek()?.type === '==' || this.peek()?.type === '!=') {
      const op = this.consume().value;
      const right = this.parseComparison();
      left = { type: 'binary', operator: op, left, right };
    }

    return left;
  }

  private parseComparison(): ParsedExpression {
    let left = this.parseAdditive();

    while (this.peek()?.type === 'GT' || this.peek()?.type === 'LT' || this.peek()?.type === '>=' || this.peek()?.type === '<=') {
      const op = this.consume().value;
      const right = this.parseAdditive();
      left = { type: 'binary', operator: op, left, right };
    }

    return left;
  }

  private parseAdditive(): ParsedExpression {
    let left = this.parseMultiplicative();

    while (this.peek()?.type === 'PLUS' || this.peek()?.type === 'MINUS') {
      const op = this.consume().value;
      const right = this.parseMultiplicative();
      left = { type: 'binary', operator: op, left, right };
    }

    return left;
  }

  private parseMultiplicative(): ParsedExpression {
    let left = this.parseUnary();

    while (this.peek()?.type === 'STAR' || this.peek()?.type === 'SLASH' || this.peek()?.type === 'PERCENT') {
      const op = this.consume().value;
      const right = this.parseUnary();
      left = { type: 'binary', operator: op, left, right };
    }

    return left;
  }

  private parseUnary(): ParsedExpression {
    if (this.peek()?.type === 'MINUS') {
      this.consume();
      const operand = this.parseUnary();
      return { type: 'unary', operator: '-', operand };
    }
    if (this.peek()?.type === 'BANG') {
      this.consume();
      const operand = this.parseUnary();
      return { type: 'unary', operator: '!', operand };
    }
    return this.parseCall();
  }

  private parseCall(): ParsedExpression {
    let expr = this.parseMember();

    while (this.peek()?.type === 'LPAREN') {
      this.consume();
      const args: ParsedExpression[] = [];
      if (this.peek()?.type !== 'RPAREN') {
        args.push(this.parseExpression());
        while (this.peek()?.type === 'COMMA') {
          this.consume();
          args.push(this.parseExpression());
        }
      }
      this.consume('RPAREN');
      expr = { type: 'call', callee: (expr as ParsedExpression & { property?: string }).property || 'anonymous', args, object: expr };
    }

    return expr;
  }

  private parseMember(): ParsedExpression {
    let expr = this.parsePrimary();

    while (this.peek()?.type === 'DOT' || this.peek()?.type === 'LBRACKET') {
      if (this.peek()?.type === 'DOT') {
        this.consume();
        const property = this.consume('IDENTIFIER').value;
        expr = { type: 'member', object: expr, property };
      } else {
        this.consume();
        const index = this.parseExpression();
        this.consume('RBRACKET');
        expr = { type: 'index', object: expr, index };
      }
    }

    return expr;
  }

  private parsePrimary(): ParsedExpression {
    const token = this.peek();

    if (!token) throw new Error('Unexpected end of expression');

    if (token.type === 'NUMBER') {
      this.consume();
      return { type: 'literal', value: parseFloat(token.value) };
    }

    if (token.type === 'STRING') {
      this.consume();
      return { type: 'literal', value: token.value };
    }

    if (token.type === 'IDENTIFIER') {
      if (token.value === 'true') {
        this.consume();
        return { type: 'literal', value: true };
      }
      if (token.value === 'false') {
        this.consume();
        return { type: 'literal', value: false };
      }
      if (token.value === 'null') {
        this.consume();
        return { type: 'literal', value: null };
      }
      if (token.value === 'undefined') {
        this.consume();
        return { type: 'literal', value: undefined };
      }
      this.consume();
      return { type: 'variable', value: token.value };
    }

    if (token.type === 'LPAREN') {
      this.consume();
      const expr = this.parseExpression();
      this.consume('RPAREN');
      return expr;
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }
}

export class ExpressionEvaluator {
  private parser = new ExpressionParser();
  private functions: Map<string, (...args: unknown[]) => unknown> = new Map();

  constructor() {
    this.registerDefaultFunctions();
  }

  private registerDefaultFunctions(): void {
    this.functions.set('Math.abs', Math.abs as (...args: unknown[]) => unknown);
    this.functions.set('Math.floor', Math.floor as (...args: unknown[]) => unknown);
    this.functions.set('Math.ceil', Math.ceil as (...args: unknown[]) => unknown);
    this.functions.set('Math.round', Math.round as (...args: unknown[]) => unknown);
    this.functions.set('Math.sqrt', Math.sqrt as (...args: unknown[]) => unknown);
    this.functions.set('Math.pow', Math.pow as (...args: unknown[]) => unknown);
    this.functions.set('Math.min', Math.min as (...args: unknown[]) => unknown);
    this.functions.set('Math.max', Math.max as (...args: unknown[]) => unknown);
    this.functions.set('Math.sin', Math.sin as (...args: unknown[]) => unknown);
    this.functions.set('Math.cos', Math.cos as (...args: unknown[]) => unknown);
    this.functions.set('Math.tan', Math.tan as (...args: unknown[]) => unknown);
    this.functions.set('Math.log', Math.log as (...args: unknown[]) => unknown);
    this.functions.set('Math.exp', Math.exp as (...args: unknown[]) => unknown);
    this.functions.set('Math.random', Math.random as (...args: unknown[]) => unknown);
    this.functions.set('Math.PI', Math.PI as unknown as (...args: unknown[]) => unknown);
    this.functions.set('Math.E', Math.E as unknown as (...args: unknown[]) => unknown);
    this.functions.set('String.length', (...args: unknown[]) => (args[0] as string).length);
    this.functions.set('String.toUpperCase', (...args: unknown[]) => (args[0] as string).toUpperCase());
    this.functions.set('String.toLowerCase', (...args: unknown[]) => (args[0] as string).toLowerCase());
    this.functions.set('String.trim', (...args: unknown[]) => (args[0] as string).trim());
    this.functions.set('Array.length', (...args: unknown[]) => (args[0] as unknown[]).length);
    this.functions.set('Array.push', ((...args: unknown[]) => { const arr = args[0] as unknown[]; arr.push(args.slice(1)); return arr.length; }) as unknown as (...args: unknown[]) => unknown);
    this.functions.set('Array.pop', ((a: unknown[]) => (a as unknown[]).pop()) as unknown as (...args: unknown[]) => unknown);
    this.functions.set('Array.shift', ((a: unknown[]) => (a as unknown[]).shift()) as unknown as (...args: unknown[]) => unknown);
    this.functions.set('Array.includes', ((a: unknown[], v: unknown) => (a as unknown[]).includes(v)) as unknown as (...args: unknown[]) => unknown);
    this.functions.set('Array.indexOf', ((a: unknown[], v: unknown) => (a as unknown[]).indexOf(v)) as unknown as (...args: unknown[]) => unknown);
    this.functions.set('Array.join', ((a: unknown[], sep?: string) => (a as unknown[]).join(sep as string || ',')) as unknown as (...args: unknown[]) => unknown);
    this.functions.set('Array.map', ((a: unknown[], fn: (...args: unknown[]) => unknown) => (a as unknown[]).map((v, i) => fn(v, i, a))) as unknown as (...args: unknown[]) => unknown);
    this.functions.set('Array.filter', ((a: unknown[], fn: (...args: unknown[]) => unknown) => (a as unknown[]).filter((v, i) => Boolean(fn(v, i, a)))) as unknown as (...args: unknown[]) => unknown);
    this.functions.set('Array.reduce', ((a: unknown[], fn: (...args: unknown[]) => unknown, init?: unknown) => (a as unknown[]).reduce((acc, v, i) => fn(acc, v, i, a), init)) as unknown as (...args: unknown[]) => unknown);
    this.functions.set('Date.now', Date.now as (...args: unknown[]) => unknown);
    this.functions.set('Date.getFullYear', (...args: unknown[]) => new Date(args[0] as number || Date.now()).getFullYear());
    this.functions.set('Date.getMonth', (...args: unknown[]) => new Date(args[0] as number || Date.now()).getMonth());
    this.functions.set('Date.getDate', (...args: unknown[]) => new Date(args[0] as number || Date.now()).getDate());
    this.functions.set('Date.getHours', (...args: unknown[]) => new Date(args[0] as number || Date.now()).getHours());
    this.functions.set('Date.getMinutes', (...args: unknown[]) => new Date(args[0] as number || Date.now()).getMinutes());
    this.functions.set('Date.getSeconds', (...args: unknown[]) => new Date(args[0] as number || Date.now()).getSeconds());
  }

  registerFunction(name: string, fn: (...args: unknown[]) => unknown): void {
    this.functions.set(name, fn);
  }

  evaluate(expression: string, context: ExpressionContext = {}): unknown {
    const parsed = this.parser.parse(expression);
    return this.evaluateNode(parsed, context);
  }

  private evaluateNode(node: ParsedExpression, context: ExpressionContext): unknown {
    switch (node.type) {
      case 'literal':
        return node.value;

      case 'variable':
        return context[node.value as string];

      case 'binary':
        return this.evaluateBinary(node.operator!, node.left!, node.right!, context);

      case 'unary':
        return this.evaluateUnary(node.operator!, node.operand!, context);

      case 'call':
        return this.evaluateCall(node.callee!, node.args!, context);

      case 'member':
        return this.evaluateMember(node.object!, node.property!, context);

      case 'index':
        return this.evaluateIndex(node.object!, node.index!, context);

      case 'ternary':
        return this.evaluateTernary(node.test!, node.consequent!, node.alternate!, context);

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private evaluateBinary(op: string, left: ParsedExpression, right: ParsedExpression, context: ExpressionContext): unknown {
    const l = this.evaluateNode(left, context);
    const r = this.evaluateNode(right, context);

    switch (op) {
      case '+': return (l as number) + (r as number);
      case '-': return (l as number) - (r as number);
      case '*': return (l as number) * (r as number);
      case '/': return (l as number) / (r as number);
      case '%': return (l as number) % (r as number);
      case '==': return l === r;
      case '!=': return l !== r;
      case '>': return (l as number) > (r as number);
      case '<': return (l as number) < (r as number);
      case '>=': return (l as number) >= (r as number);
      case '<=': return (l as number) <= (r as number);
      case '&&': return l && r;
      case '||': return l || r;
      case '??': return l ?? r;
      default: throw new Error(`Unknown operator: ${op}`);
    }
  }

  private evaluateUnary(op: string, operand: ParsedExpression, context: ExpressionContext): unknown {
    const val = this.evaluateNode(operand, context);

    switch (op) {
      case '-': return -(val as number);
      case '!': return !val;
      default: throw new Error(`Unknown unary operator: ${op}`);
    }
  }

  private evaluateCall(callee: string, args: ParsedExpression[], context: ExpressionContext): unknown {
    const fn = this.functions.get(callee);
    if (!fn) throw new Error(`Unknown function: ${callee}`);

    const evaluatedArgs = args.map((arg) => this.evaluateNode(arg, context));
    return fn(...evaluatedArgs);
  }

  private evaluateMember(object: ParsedExpression, property: string, context: ExpressionContext): unknown {
    const obj = this.evaluateNode(object, context);
    if (obj && typeof obj === 'object') {
      return (obj as Record<string, unknown>)[property];
    }
    return undefined;
  }

  private evaluateIndex(object: ParsedExpression, index: ParsedExpression, context: ExpressionContext): unknown {
    const obj = this.evaluateNode(object, context);
    const idx = this.evaluateNode(index, context);

    if (Array.isArray(obj) && typeof idx === 'number') {
      return obj[idx];
    }
    if (typeof obj === 'string' && typeof idx === 'number') {
      return obj[idx];
    }
    if (obj && typeof obj === 'object') {
      return (obj as Record<string, unknown>)[String(idx)];
    }
    return undefined;
  }

  private evaluateTernary(test: ParsedExpression, consequent: ParsedExpression, alternate: ParsedExpression, context: ExpressionContext): unknown {
    const testVal = this.evaluateNode(test, context);
    return testVal ? this.evaluateNode(consequent, context) : this.evaluateNode(alternate, context);
  }
}

export const expressionEvaluator = new ExpressionEvaluator();

export function evaluate(expression: string, context?: ExpressionContext): unknown {
  return expressionEvaluator.evaluate(expression, context);
}

export function createExpressionEvaluator(): ExpressionEvaluator {
  return new ExpressionEvaluator();
}

export function safeEvaluate<T = unknown>(expression: string, context?: ExpressionContext, fallback?: T): T {
  try {
    return expressionEvaluator.evaluate(expression, context) as T;
  } catch {
    return fallback as T;
  }
}
