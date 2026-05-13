export type NodeType = 'element' | 'text' | 'comment' | 'fragment';

export interface ASTNode {
  type: NodeType;
  tagName?: string;
  attributes?: Record<string, string>;
  children?: ASTNode[];
  content?: string;
}

export class HTMLParser {
  private input: string;
  private position = 0;

  constructor(input: string) {
    this.input = input;
  }

  parse(): ASTNode {
    return this.parseFragment();
  }

  private parseFragment(): ASTNode {
    const children: ASTNode[] = [];
    this.skipWhitespace();
    while (this.position < this.input.length) {
      if (this.input.startsWith('</', this.position)) {
        break;
      }
      const node = this.parseNode();
      if (node) children.push(node);
      this.skipWhitespace();
    }
    return { type: 'fragment', children };
  }

  private parseNode(): ASTNode | null {
    if (this.peek() === '<') {
      if (this.input.startsWith('<!--', this.position)) {
        return this.parseComment();
      }
      return this.parseElement();
    }
    return this.parseText();
  }

  private parseElement(): ASTNode {
    this.consume('<');
    const tagName = this.parseTagName();
    const attributes = this.parseAttributes();
    const selfClosing = this.peek() === '/' || this.input[this.position - 1] === '/';
    if (this.peek() === '>') {
      this.consume('>');
    } else if (this.peek() === '/') {
      this.consume('/');
      this.consume('>');
      return { type: 'element', tagName, attributes };
    }
    if (selfClosing) {
      return { type: 'element', tagName, attributes };
    }
    const children = this.parseChildren(tagName);
    return { type: 'element', tagName, attributes, children };
  }

  private parseTagName(): string {
    let name = '';
    while (this.peek() && /[a-zA-Z0-9-]/.test(this.peek())) {
      name += this.consume();
    }
    return name.toLowerCase();
  }

  private parseAttributes(): Record<string, string> {
    const attributes: Record<string, string> = {};
    this.skipWhitespace();
    while (this.peek() && this.peek() !== '>' && this.peek() !== '/') {
      const name = this.parseAttributeName();
      this.skipWhitespace();
      let value = '';
      if (this.peek() === '=') {
        this.consume('=');
        this.skipWhitespace();
        value = this.parseAttributeValue();
      }
      attributes[name] = value;
      this.skipWhitespace();
    }
    return attributes;
  }

  private parseAttributeName(): string {
    let name = '';
    while (this.peek() && /[a-zA-Z0-9-_]/.test(this.peek())) {
      name += this.consume();
    }
    return name;
  }

  private parseAttributeValue(): string {
    const quote = this.peek();
    if (quote === '"' || quote === "'") {
      this.consume(quote);
      let value = '';
      while (this.peek() && this.peek() !== quote) {
        value += this.consume();
      }
      this.consume(quote);
      return value;
    }
    let value = '';
    while (this.peek() && !/[\s/>]/.test(this.peek())) {
      value += this.consume();
    }
    return value;
  }

  private parseChildren(parentTag: string): ASTNode[] {
    const children: ASTNode[] = [];
    this.skipWhitespace();
    while (this.position < this.input.length) {
      if (this.input.startsWith('</', this.position)) {
        this.consume('</');
        this.parseTagName();
        this.consume('>');
        break;
      }
      const node = this.parseNode();
      if (node) children.push(node);
      this.skipWhitespace();
    }
    return children;
  }

  private parseText(): ASTNode {
    let content = '';
    while (this.peek() && this.peek() !== '<') {
      content += this.consume();
    }
    return { type: 'text', content: content.trim() };
  }

  private parseComment(): ASTNode {
    this.consume('<!--');
    let content = '';
    while (this.position < this.input.length && !this.input.startsWith('-->', this.position)) {
      content += this.consume();
    }
    this.consume('-->');
    return { type: 'comment', content };
  }

  private skipWhitespace(): void {
    while (this.peek() && /\s/.test(this.peek())) {
      this.consume();
    }
  }

  private peek(offset: number = 0): string {
    return this.input[this.position + offset] ?? '';
  }

  private consume(char?: string): string {
    if (char && this.input[this.position] !== char) {
      throw new Error(`Expected '${char}' but found '${this.input[this.position]}'`);
    }
    return this.input[this.position++] ?? '';
  }
}

export function parseHTML(input: string): ASTNode {
  return new HTMLParser(input).parse();
}

export function querySelector(root: ASTNode, selector: string): ASTNode | null {
  const { tagName, id, className } = parseSelector(selector);
  return findNode(root, { tagName, id, className });
}

function parseSelector(selector: string): { tagName?: string; id?: string; className?: string } {
  const result: { tagName?: string; id?: string; className?: string } = {};
  const tagMatch = selector.match(/^([a-zA-Z0-9]+)/);
  if (tagMatch) result.tagName = tagMatch[1]!.toLowerCase();
  const idMatch = selector.match(/#([a-zA-Z0-9-_]+)/);
  if (idMatch) result.id = idMatch[1];
  const classMatch = selector.match(/\.([a-zA-Z0-9-_]+)/g);
  if (classMatch) result.className = classMatch[0]!.slice(1);
  return result;
}

function findNode(node: ASTNode, criteria: { tagName?: string; id?: string; className?: string }): ASTNode | null {
  if (node.type === 'element') {
    if (criteria.tagName && node.tagName !== criteria.tagName) {
      // continue search in children
    } else if (criteria.id && node.attributes?.['id'] !== criteria.id) {
      // continue
    } else if (criteria.className && node.attributes?.['class']?.includes(criteria.className)) {
      return node;
    } else if (!criteria.tagName && !criteria.id && !criteria.className) {
      return node;
    }
  }
  if (node.children) {
    for (const child of node.children) {
      const found = querySelector(child, criteria.tagName ? criteria.tagName : '');
      if (found) return found;
    }
  }
  return null;
}
