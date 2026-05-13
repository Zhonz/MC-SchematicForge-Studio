export interface TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
  parent?: TreeNode<T>;
}

export class Tree<T> {
  private root: TreeNode<T> | null = null;
  private nodeMap: Map<string, TreeNode<T>> = new Map();

  constructor(
    private getId: (value: T) => string,
    private childrenKey: keyof T = 'children' as keyof T
  ) {}

  setRoot(value: T): TreeNode<T> {
    const node: TreeNode<T> = { value, children: [] };
    this.root = node;
    this.nodeMap.set(this.getId(value), node);
    return node;
  }

  addChild(parentId: string, value: T): TreeNode<T> | null {
    const parentNode = this.nodeMap.get(parentId);
    if (!parentNode) return null;

    const childNode: TreeNode<T> = { value, children: [], parent: parentNode };
    parentNode.children.push(childNode);
    this.nodeMap.set(this.getId(value), childNode);
    return childNode;
  }

  removeNode(id: string): boolean {
    const node = this.nodeMap.get(id);
    if (!node || !node.parent) return false;

    const index = node.parent.children.indexOf(node);
    if (index !== -1) {
      node.parent.children.splice(index, 1);
    }

    this.removeDescendants(id);
    this.nodeMap.delete(id);
    return true;
  }

  private removeDescendants(id: string): void {
    const node = this.nodeMap.get(id);
    if (!node) return;

    for (const child of node.children) {
      this.removeDescendants(this.getId(child.value));
      this.nodeMap.delete(this.getId(child.value));
    }
  }

  getNode(id: string): TreeNode<T> | undefined {
    return this.nodeMap.get(id);
  }

  getChildren(id: string): TreeNode<T>[] {
    return this.nodeMap.get(id)?.children ?? [];
  }

  getParent(id: string): TreeNode<T> | undefined {
    return this.nodeMap.get(id)?.parent;
  }

  getRoot(): TreeNode<T> | null {
    return this.root;
  }

  traverse(callback: (node: TreeNode<T>, depth: number) => void): void {
    if (!this.root) return;
    this.traverseNode(this.root, 0, callback);
  }

  private traverseNode(node: TreeNode<T>, depth: number, callback: (node: TreeNode<T>, depth: number) => void): void {
    callback(node, depth);
    for (const child of node.children) {
      this.traverseNode(child, depth + 1, callback);
    }
  }

  find(predicate: (node: TreeNode<T>) => boolean): TreeNode<T> | undefined {
    if (!this.root) return undefined;
    return this.findNode(this.root, predicate);
  }

  private findNode(node: TreeNode<T>, predicate: (node: TreeNode<T>) => boolean): TreeNode<T> | undefined {
    if (predicate(node)) return node;
    for (const child of node.children) {
      const found = this.findNode(child, predicate);
      if (found) return found;
    }
    return undefined;
  }

  filter(predicate: (node: TreeNode<T>) => boolean): TreeNode<T>[] {
    const results: TreeNode<T>[] = [];
    if (!this.root) return results;
    this.collectNodes(this.root, predicate, results);
    return results;
  }

  private collectNodes(node: TreeNode<T>, predicate: (node: TreeNode<T>) => boolean, results: TreeNode<T>[]): void {
    if (predicate(node)) results.push(node);
    for (const child of node.children) {
      this.collectNodes(child, predicate, results);
    }
  }

  toArray(): TreeNode<T>[] {
    const results: TreeNode<T>[] = [];
    this.traverse((node) => results.push(node));
    return results;
  }

  getDepth(id: string): number {
    const node = this.nodeMap.get(id);
    if (!node) return -1;

    let depth = 0;
    let current: TreeNode<T> | undefined = node;
    while (current?.parent) {
      depth++;
      current = current.parent;
    }
    return depth;
  }

  getHeight(): number {
    if (!this.root) return 0;
    return this.getNodeHeight(this.root);
  }

  private getNodeHeight(node: TreeNode<T>): number {
    if (node.children.length === 0) return 1;
    return 1 + Math.max(...node.children.map((child) => this.getNodeHeight(child)));
  }

  getSize(): number {
    return this.nodeMap.size;
  }

  clear(): void {
    this.root = null;
    this.nodeMap.clear();
  }
}

export class BinaryTreeNode<T> {
  value: T;
  left: BinaryTreeNode<T> | null = null;
  right: BinaryTreeNode<T> | null = null;
  parent: BinaryTreeNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

export class BinaryTree<T> {
  private root: BinaryTreeNode<T> | null = null;
  private compareFn: (a: T, b: T) => number;

  constructor(compareFn?: (a: T, b: T) => number) {
    this.compareFn = compareFn ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  insert(value: T): void {
    const newNode = new BinaryTreeNode(value);
    if (!this.root) {
      this.root = newNode;
      return;
    }
    this.insertNode(this.root, newNode);
  }

  private insertNode(node: BinaryTreeNode<T>, newNode: BinaryTreeNode<T>): void {
    const cmp = this.compareFn(newNode.value, node.value);
    if (cmp < 0) {
      if (!node.left) {
        node.left = newNode;
        newNode.parent = node;
      } else {
        this.insertNode(node.left, newNode);
      }
    } else {
      if (!node.right) {
        node.right = newNode;
        newNode.parent = node;
      } else {
        this.insertNode(node.right, newNode);
      }
    }
  }

  search(value: T): BinaryTreeNode<T> | null {
    return this.searchNode(this.root, value);
  }

  private searchNode(node: BinaryTreeNode<T> | null, value: T): BinaryTreeNode<T> | null {
    if (!node) return null;
    const cmp = this.compareFn(value, node.value);
    if (cmp === 0) return node;
    if (cmp < 0) return this.searchNode(node.left, value);
    return this.searchNode(node.right, value);
  }

  delete(value: T): boolean {
    const node = this.search(value);
    if (!node) return false;
    this.deleteNode(node);
    return true;
  }

  private deleteNode(node: BinaryTreeNode<T>): void {
    if (!node.left && !node.right) {
      if (!node.parent) {
        this.root = null;
      } else if (node === node.parent.left) {
        node.parent.left = null;
      } else {
        node.parent.right = null;
      }
    } else if (!node.left) {
      if (!node.parent) {
        this.root = node.right!;
        node.right!.parent = null;
      } else if (node === node.parent.left) {
        node.parent.left = node.right;
        node.right!.parent = node.parent;
      } else {
        node.parent.right = node.right;
        node.right!.parent = node.parent;
      }
    } else if (!node.right) {
      if (!node.parent) {
        this.root = node.left;
        node.left!.parent = null;
      } else if (node === node.parent.left) {
        node.parent.left = node.left;
        node.left!.parent = node.parent;
      } else {
        node.parent.right = node.left;
        node.left!.parent = node.parent;
      }
    } else {
      const successor = this.findMin(node.right);
      node.value = successor.value;
      this.deleteNode(successor);
    }
  }

  private findMin(node: BinaryTreeNode<T>): BinaryTreeNode<T> {
    while (node.left) {
      node = node.left;
    }
    return node;
  }

  inorder(callback: (value: T) => void): void {
    this.inorderTraversal(this.root, callback);
  }

  private inorderTraversal(node: BinaryTreeNode<T> | null, callback: (value: T) => void): void {
    if (!node) return;
    this.inorderTraversal(node.left, callback);
    callback(node.value);
    this.inorderTraversal(node.right, callback);
  }

  preorder(callback: (value: T) => void): void {
    this.preorderTraversal(this.root, callback);
  }

  private preorderTraversal(node: BinaryTreeNode<T> | null, callback: (value: T) => void): void {
    if (!node) return;
    callback(node.value);
    this.preorderTraversal(node.left, callback);
    this.preorderTraversal(node.right, callback);
  }

  postorder(callback: (value: T) => void): void {
    this.postorderTraversal(this.root, callback);
  }

  private postorderTraversal(node: BinaryTreeNode<T> | null, callback: (value: T) => void): void {
    if (!node) return;
    this.postorderTraversal(node.left, callback);
    this.postorderTraversal(node.right, callback);
    callback(node.value);
  }

  getHeight(): number {
    return this.getNodeHeight(this.root);
  }

  private getNodeHeight(node: BinaryTreeNode<T> | null): number {
    if (!node) return 0;
    return 1 + Math.max(this.getNodeHeight(node.left), this.getNodeHeight(node.right));
  }

  getSize(): number {
    return this.countNodes(this.root);
  }

  private countNodes(node: BinaryTreeNode<T> | null): number {
    if (!node) return 0;
    return 1 + this.countNodes(node.left) + this.countNodes(node.right);
  }

  clear(): void {
    this.root = null;
  }
}

export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord = false;
  frequency = 0;
}

export class Trie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string): void {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
    node.frequency++;
  }

  search(word: string): boolean {
    const node = this.searchPrefix(word.toLowerCase());
    return node !== null && node.isEndOfWord;
  }

  startsWith(prefix: string): boolean {
    return this.searchPrefix(prefix.toLowerCase()) !== null;
  }

  private searchPrefix(prefix: string): TrieNode | null {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) {
        return null;
      }
      node = node.children.get(char)!;
    }
    return node;
  }

  getWordsWithPrefix(prefix: string): string[] {
    const node = this.searchPrefix(prefix.toLowerCase());
    if (!node) return [];
    return this.collectWords(node, prefix.toLowerCase());
  }

  private collectWords(node: TrieNode, currentWord: string): string[] {
    const words: string[] = [];
    if (node.isEndOfWord) {
      words.push(currentWord);
    }
    for (const [char, childNode] of node.children) {
      words.push(...this.collectWords(childNode, currentWord + char));
    }
    return words;
  }

  getAllWords(): string[] {
    return this.collectWords(this.root, '');
  }

  delete(word: string): boolean {
    return this.deleteNode(this.root, word.toLowerCase(), 0);
  }

  private deleteNode(node: TrieNode, word: string, index: number): boolean {
    if (index === word.length) {
      if (!node.isEndOfWord) return false;
      node.isEndOfWord = false;
      return node.children.size === 0;
    }

    const char = word[index];
    const childNode = node.children.get(char);
    if (!childNode) return false;

    const shouldDeleteChild = this.deleteNode(childNode, word, index + 1);

    if (shouldDeleteChild) {
      node.children.delete(char);
      return !node.isEndOfWord && node.children.size === 0;
    }

    return false;
  }

  getFrequency(word: string): number {
    const node = this.searchPrefix(word.toLowerCase());
    return node?.frequency ?? 0;
  }

  clear(): void {
    this.root = new TrieNode();
  }
}
