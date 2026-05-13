export type Operator = '+' | '-' | '*' | '/' | '%' | '**' | '==' | '===' | '!=' | '!==' | '<' | '>' | '<=' | '>=';

export interface ExpressionToken {
  type: 'number' | 'operator' | 'function' | 'variable' | 'paren';
  value: string;
}

export interface Token {
  type: 'number' | 'string' | 'boolean' | 'operator' | 'function' | 'paren' | 'variable' | 'comma' | 'unary';
  value: string;
  precedence?: number;
  associativity?: 'left' | 'right';
}

export class ExpressionEvaluator {
  private variables: Record<string, unknown> = {};
  private functions: Record<string, (...args: unknown[]) => unknown> = {};

  constructor() {
    this.registerDefaultFunctions();
  }

  private registerDefaultFunctions(): void {
    const mathFn = (fn: (...args: number[]) => number) => 
      (...args: unknown[]) => fn(...(args as number[]));
    
    this.functions = {
      abs: mathFn(Math.abs),
      round: mathFn(Math.round),
      floor: mathFn(Math.floor),
      ceil: mathFn(Math.ceil),
      sqrt: mathFn(Math.sqrt),
      pow: mathFn(Math.pow),
      min: (...args: unknown[]) => Math.min(...(args as number[])),
      max: (...args: unknown[]) => Math.max(...(args as number[])),
      sin: mathFn(Math.sin),
      cos: mathFn(Math.cos),
      tan: mathFn(Math.tan),
      log: mathFn(Math.log),
      log10: mathFn(Math.log10),
      log2: mathFn(Math.log2),
      exp: mathFn(Math.exp),
      PI: () => Math.PI,
      E: () => Math.E,
      random: Math.random,
      sum: (...args: unknown[]) => (args as number[]).reduce((a, b) => a + b, 0),
      avg: (...args: unknown[]) => {
        const nums = args as number[];
        return nums.reduce((a, b) => a + b, 0) / nums.length;
      },
      if: (condition: unknown, thenVal: unknown, elseVal: unknown) => condition ? thenVal : elseVal,
      clamp: (...args: unknown[]) => {
        const [value, min, max] = args as [number, number, number];
        return Math.min(Math.max(value, min), max);
      },
      lerp: (...args: unknown[]) => {
        const [a, b, t] = args as [number, number, number];
        return a + (b - a) * t;
      },
      map: (...args: unknown[]) => {
        const [value, inMin, inMax, outMin, outMax] = args as [number, number, number, number, number];
        return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
      },
    };
  }

  setVariable(name: string, value: unknown): void {
    this.variables[name] = value;
  }

  getVariable(name: string): unknown {
    return this.variables[name];
  }

  setVariables(variables: Record<string, unknown>): void {
    Object.assign(this.variables, variables);
  }

  registerFunction(name: string, fn: (...args: unknown[]) => unknown): void {
    this.functions[name] = fn;
  }

  evaluate(expression: string): unknown {
    const tokens = this.tokenize(expression);
    const postfix = this.toPostfix(tokens);
    return this.evaluatePostfix(postfix);
  }

  private tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const expr = expression.replace(/\s+/g, '');

    while (i < expr.length) {
      const char = expr[i];

      if (/[0-9.]/.test(char)) {
        let num = '';
        while (i < expr.length && /[0-9.]/.test(expr[i])) {
          num += expr[i++];
        }
        tokens.push({ type: 'number', value: num });
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let ident = '';
        while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
          ident += expr[i++];
        }
        if (i < expr.length && expr[i] === '(') {
          tokens.push({ type: 'function', value: ident });
        } else if (this.functions[ident]) {
          tokens.push({ type: 'function', value: ident });
        } else {
          tokens.push({ type: 'variable', value: ident });
        }
        continue;
      }

      if ('+-'.includes(char) && (tokens.length === 0 || tokens[tokens.length - 1].type === 'operator' || (tokens[tokens.length - 1].type === 'paren' && tokens[tokens.length - 1].value === '('))) {
        let num = char;
        i++;
        while (i < expr.length && /[0-9.]/.test(expr[i])) {
          num += expr[i++];
        }
        if (num.length === 1) {
          tokens.push({ type: 'operator', value: char === '+' ? 'unary+' : 'unary-', precedence: 4, associativity: 'right' });
          if (num.length > 1) {
            tokens.push({ type: 'number', value: num.slice(1) });
          }
        } else {
          tokens.push({ type: 'number', value: num });
        }
        continue;
      }

      const operators: Record<string, { precedence: number; associativity: 'left' | 'right' }> = {
        '**': { precedence: 4, associativity: 'right' },
        '*': { precedence: 3, associativity: 'left' },
        '/': { precedence: 3, associativity: 'left' },
        '%': { precedence: 3, associativity: 'left' },
        '+': { precedence: 2, associativity: 'left' },
        '-': { precedence: 2, associativity: 'left' },
        '==': { precedence: 1, associativity: 'left' },
        '!=': { precedence: 1, associativity: 'left' },
        '===': { precedence: 1, associativity: 'left' },
        '!==': { precedence: 1, associativity: 'left' },
        '<': { precedence: 1, associativity: 'left' },
        '>': { precedence: 1, associativity: 'left' },
        '<=': { precedence: 1, associativity: 'left' },
        '>=': { precedence: 1, associativity: 'left' },
      };

      const op = operators[char + expr[i + 1]] || operators[char];
      if (op) {
        tokens.push({
          type: 'operator',
          value: op ? char + (expr[i + 1] || '') : char,
          precedence: op?.precedence,
          associativity: op?.associativity,
        });
        if (op) i += char + expr[i + 1] in operators ? 2 : 1;
        else i++;
        continue;
      }

      if (char === '(') {
        tokens.push({ type: 'paren', value: '(' });
        i++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: 'paren', value: ')' });
        i++;
        continue;
      }

      if (char === ',') {
        tokens.push({ type: 'comma', value: ',' });
        i++;
        continue;
      }

      if (char === '"' || char === "'") {
        let str = '';
        const quote = char;
        i++;
        while (i < expr.length && expr[i] !== quote) {
          str += expr[i++];
        }
        i++;
        tokens.push({ type: 'string', value: str });
        continue;
      }

      i++;
    }

    return tokens;
  }

  private toPostfix(tokens: Token[]): Token[] {
    const output: Token[] = [];
    const opStack: Token[] = [];

    for (const token of tokens) {
      switch (token.type) {
        case 'number':
        case 'string':
          output.push(token);
          break;

        case 'variable':
          output.push({ ...token, type: 'number', value: String(this.variables[token.value]) });
          break;

        case 'function':
          opStack.push(token);
          break;

        case 'operator':
        case 'unary':
          const precedence = token.precedence ?? 0;
          while (
            opStack.length > 0 &&
            opStack[opStack.length - 1].type === 'operator' &&
            ((token.associativity === 'left' && precedence <= (opStack[opStack.length - 1].precedence ?? 0)) ||
             (token.associativity === 'right' && precedence < (opStack[opStack.length - 1].precedence ?? 0)))
          ) {
            output.push(opStack.pop()!);
          }
          opStack.push(token);
          break;

        case 'paren':
          if (token.value === '(') {
            opStack.push(token);
          } else {
            while (opStack.length > 0 && opStack[opStack.length - 1].value !== '(') {
              output.push(opStack.pop()!);
            }
            opStack.pop();
            if (opStack.length > 0 && opStack[opStack.length - 1].type === 'function') {
              output.push(opStack.pop()!);
            }
          }
          break;

        case 'comma':
          while (opStack.length > 0 && opStack[opStack.length - 1].value !== '(') {
            output.push(opStack.pop()!);
          }
          break;
      }
    }

    while (opStack.length > 0) {
      output.push(opStack.pop()!);
    }

    return output;
  }

  private evaluatePostfix(tokens: Token[]): unknown {
    const stack: unknown[] = [];

    for (const token of tokens) {
      switch (token.type) {
        case 'number':
          stack.push(parseFloat(token.value));
          break;

        case 'string':
          stack.push(token.value);
          break;

        case 'operator':
          this.evaluateOperator(stack, token.value);
          break;

        case 'function':
          const args: unknown[] = [];
          const fn = this.functions[token.value];
          if (fn) {
            const argCount = token.value === 'PI' || token.value === 'E' ? 0 : 2;
            for (let i = 0; i < argCount && stack.length > 0; i++) {
              args.unshift(stack.pop());
            }
            if (args.length === 0 && (token.value === 'PI' || token.value === 'E')) {
              stack.push(fn());
            } else {
              stack.push(fn(...args));
            }
          }
          break;
      }
    }

    return stack.length > 0 ? stack[0] : undefined;
  }

  private evaluateOperator(stack: unknown[], operator: string): void {
    if (stack.length < 2) return;

    const b = stack.pop();
    const a = stack.pop();

    switch (operator) {
      case '+':
        stack.push((a as number) + (b as number));
        break;
      case '-':
        stack.push((a as number) - (b as number));
        break;
      case '*':
        stack.push((a as number) * (b as number));
        break;
      case '/':
        stack.push((a as number) / (b as number));
        break;
      case '%':
        stack.push((a as number) % (b as number));
        break;
      case '**':
        stack.push(Math.pow(a as number, b as number));
        break;
      case '==':
        stack.push(a == b);
        break;
      case '===':
        stack.push(a === b);
        break;
      case '!=':
        stack.push(a != b);
        break;
      case '!==':
        stack.push(a !== b);
        break;
      case '<':
        stack.push((a as number) < (b as number));
        break;
      case '>':
        stack.push((a as number) > (b as number));
        break;
      case '<=':
        stack.push((a as number) <= (b as number));
        break;
      case '>=':
        stack.push((a as number) >= (b as number));
        break;
      case 'unary-':
        stack.push(-(a as number));
        break;
      case 'unary+':
        stack.push(+(a as number));
        break;
    }
  }
}

export const expressionEvaluator = new ExpressionEvaluator();
export const evaluate = (expr: string, vars?: Record<string, unknown>) => {
  if (vars) expressionEvaluator.setVariables(vars);
  return expressionEvaluator.evaluate(expr);
};
