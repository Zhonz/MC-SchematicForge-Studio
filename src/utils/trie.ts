export interface TrieNode<T = unknown> {
  value?: T;
  children: Map<string, TrieNode<T>>;
  isEndOfWord: boolean;
  frequency: number;
}

export interface TrieOptions {
  caseSensitive?: boolean;
  allowDuplicates?: boolean;
}

export class Trie<T = unknown> {
  private root: TrieNode<T>;
  private options: Required<TrieOptions>;
  private size = 0;

  constructor(options: TrieOptions = {}) {
    this.options = {
      caseSensitive: options.caseSensitive ?? true,
      allowDuplicates: options.allowDuplicates ?? false,
    };
    this.root = this.createNode();
  }

  private createNode(): TrieNode<T> {
    return {
      children: new Map(),
      isEndOfWord: false,
      frequency: 0,
    };
  }

  private normalize(key: string): string {
    return this.options.caseSensitive ? key : key.toLowerCase();
  }

  insert(key: string, value?: T): boolean {
    const normalized = this.normalize(key);
    if (!normalized) return false;

    let current = this.root;

    for (const char of normalized) {
      if (!current.children.has(char)) {
        current.children.set(char, this.createNode());
      }
      current = current.children.get(char)!;
    }

    if (current.isEndOfWord && !this.options.allowDuplicates) {
      current.value = value;
      return false;
    }

    current.isEndOfWord = true;
    current.value = value;
    current.frequency++;
    this.size++;

    return true;
  }

  has(key: string): boolean {
    const normalized = this.normalize(key);
    const node = this.findNode(normalized);
    return node !== null && node.isEndOfWord;
  }

  get(key: string): T | undefined {
    const normalized = this.normalize(key);
    const node = this.findNode(normalized);
    return node?.value;
  }

  remove(key: string): boolean {
    const normalized = this.normalize(key);
    if (!normalized) return false;

    const path: TrieNode<T>[] = [this.root];
    let current = this.root;

    for (const char of normalized) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char)!;
      path.push(current);
    }

    if (!current.isEndOfWord) {
      return false;
    }

    current.isEndOfWord = false;
    current.frequency--;
    this.size--;

    for (let i = path.length - 1; i >= 1; i--) {
      const node = path[i];
      const parent = path[i - 1];
      const char = normalized[i - 1];

      if (!node.isEndOfWord && node.children.size === 0) {
        parent.children.delete(char);
      } else {
        break;
      }
    }

    return true;
  }

  update(key: string, value: T): boolean {
    const normalized = this.normalize(key);
    const node = this.findNode(normalized);
    if (!node || !node.isEndOfWord) {
      return false;
    }
    node.value = value;
    return true;
  }

  search(prefix: string, limit = 10): Array<{ key: string; value?: T; score: number }> {
    const normalized = this.normalize(prefix);
    if (!normalized) return [];

    let current = this.root;

    for (const char of normalized) {
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char)!;
    }

    const results: Array<{ key: string; value?: T; score: number }> = [];
    this.collectWords(current, normalized, results, limit);

    return results.sort((a, b) => b.score - a.score);
  }

  private collectWords(
    node: TrieNode<T>,
    prefix: string,
    results: Array<{ key: string; value?: T; score: number }>,
    limit: number
  ): void {
    if (results.length >= limit) return;

    if (node.isEndOfWord) {
      results.push({
        key: prefix,
        value: node.value,
        score: node.frequency,
      });
    }

    for (const [char, child] of node.children) {
      this.collectWords(child, prefix + char, results, limit);
    }
  }

  private findNode(key: string): TrieNode<T> | null {
    let current = this.root;

    for (const char of key) {
      if (!current.children.has(char)) {
        return null;
      }
      current = current.children.get(char)!;
    }

    return current;
  }

  startsWith(prefix: string): boolean {
    const normalized = this.normalize(prefix);
    return this.findNode(normalized) !== null;
  }

  keys(): string[] {
    const results: string[] = [];
    this.collectAllKeys(this.root, '', results);
    return results;
  }

  private collectAllKeys(node: TrieNode<T>, prefix: string, results: string[]): void {
    if (node.isEndOfWord) {
      results.push(prefix);
    }

    for (const [char, child] of node.children) {
      this.collectAllKeys(child, prefix + char, results);
    }
  }

  entries(): Array<{ key: string; value: T }> {
    const results: Array<{ key: string; value: T }> = [];
    this.collectAllEntries(this.root, '', results);
    return results;
  }

  private collectAllEntries(node: TrieNode<T>, prefix: string, results: Array<{ key: string; value: T }>): void {
    if (node.isEndOfWord && node.value !== undefined) {
      results.push({ key: prefix, value: node.value });
    }

    for (const [char, child] of node.children) {
      this.collectAllEntries(child, prefix + char, results);
    }
  }

  values(): T[] {
    return this.entries().map(e => e.value);
  }

  clear(): void {
    this.root = this.createNode();
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  commonPrefix(): string {
    let prefix = '';
    let current = this.root;

    while (current.children.size === 1 && !current.isEndOfWord) {
      const [char, child] = [...current.children][0];
      prefix += char;
      current = child;
    }

    return prefix;
  }

  autocomplete(word: string, maxSuggestions = 5): string[] {
    const results = this.search(word, maxSuggestions);
    return results.map(r => r.key);
  }

  levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  fuzzySearch(query: string, maxDistance = 2): string[] {
    const allKeys = this.keys();
    return allKeys.filter(key => 
      this.levenshteinDistance(query, key) <= maxDistance
    );
  }
}

export const trie = <T>(options?: TrieOptions) => new Trie<T>(options);
