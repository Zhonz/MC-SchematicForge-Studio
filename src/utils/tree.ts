export class TreeNode<T> {
  value: T;
  children: TreeNode<T>[] = [];
  parent: TreeNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }

  addChild(value: T): TreeNode<T> {
    const child = new TreeNode(value);
    child.parent = this;
    this.children.push(child);
    return child;
  }

  removeChild(node: TreeNode<T>): boolean {
    const index = this.children.indexOf(node);
    if (index >= 0) {
      this.children.splice(index, 1);
      node.parent = null;
      return true;
    }
    return false;
  }

  isLeaf(): boolean {
    return this.children.length === 0;
  }

  isRoot(): boolean {
    return this.parent === null;
  }

  get depth(): number {
    let d = 0;
    let node: TreeNode<T> | null = this;
    while (node && node.parent) {
      d++;
      node = node.parent;
    }
    return d;
  }

  get siblings(): TreeNode<T>[] {
    if (!this.parent) return [];
    return this.parent.children.filter(c => c !== this);
  }

  traverse(fn: (node: TreeNode<T>) => void): void {
    fn(this);
    this.children.forEach(child => child.traverse(fn));
  }

  traverseDepthFirst(fn: (node: TreeNode<T>) => void): void {
    this.children.forEach(child => child.traverseDepthFirst(fn));
    fn(this);
  }

  find(predicate: (node: TreeNode<T>) => boolean): TreeNode<T> | null {
    if (predicate(this)) return this;
    for (const child of this.children) {
      const found = child.find(predicate);
      if (found) return found;
    }
    return null;
  }

  filter(predicate: (node: TreeNode<T>) => boolean): TreeNode<T>[] {
    const results: TreeNode<T>[] = [];
    this.traverse(node => {
      if (predicate(node)) results.push(node);
    });
    return results;
  }

  map<U>(fn: (value: T) => U): TreeNode<U> {
    const newNode = new TreeNode(fn(this.value));
    newNode.children = this.children.map(child => child.map(fn));
    newNode.children.forEach(c => c.parent = newNode);
    return newNode;
  }

  toArray(): T[] {
    const result: T[] = [];
    this.traverse(node => result.push(node.value));
    return result;
  }

  getPath(): T[] {
    const path: T[] = [];
    let node: TreeNode<T> | null = this;
    while (node) {
      path.unshift(node.value);
      node = node.parent;
    }
    return path;
  }
}

export class Tree<T> {
  root: TreeNode<T>;

  constructor(rootValue: T) {
    this.root = new TreeNode(rootValue);
  }

  addChild(parentValue: T, childValue: T): boolean {
    const parent = this.root.find(node => node.value === parentValue);
    if (parent) {
      parent.addChild(childValue);
      return true;
    }
    return false;
  }

  remove(value: T): boolean {
    const node = this.root.find(node => node.value === value);
    if (node && !node.isRoot()) {
      return node.parent!.removeChild(node);
    }
    return false;
  }

  find(predicate: (value: T) => boolean): TreeNode<T> | null {
    return this.root.find(node => predicate(node.value));
  }

  findByValue(value: T): TreeNode<T> | null {
    return this.find(v => v === value);
  }

  filter(predicate: (value: T) => boolean): TreeNode<T>[] {
    return this.root.filter(node => predicate(node.value));
  }

  traverse(fn: (node: TreeNode<T>) => void): void {
    this.root.traverse(fn);
  }

  map<U>(fn: (value: T) => U): Tree<U> {
    const newTree = new Tree<U>(fn(this.root.value));
    newTree.root.children = this.root.children.map(child => child.map(fn));
    newTree.root.children.forEach(c => c.parent = newTree.root);
    return newTree;
  }

  get size(): number {
    let count = 0;
    this.traverse(() => count++);
    return count;
  }

  get depth(): number {
    let maxDepth = 0;
    this.traverse(node => {
      if (node.depth > maxDepth) maxDepth = node.depth;
    });
    return maxDepth;
  }

  toArray(): T[] {
    return this.root.toArray();
  }
}
