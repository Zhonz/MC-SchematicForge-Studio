export interface GraphNode<T> {
  value: T;
  neighbors: GraphNode<T>[];
  weight?: number;
}

export class Graph<T> {
  private adjacencyList: Map<string, GraphNode<T>> = new Map();
  protected getId: (value: T) => string;

  constructor(getId: (value: T) => string) {
    this.getId = getId;
  }

  addNode(value: T): GraphNode<T> {
    const id = this.getId(value);
    if (!this.adjacencyList.has(id)) {
      const node: GraphNode<T> = { value, neighbors: [] };
      this.adjacencyList.set(id, node);
      return node;
    }
    return this.adjacencyList.get(id)!;
  }

  addEdge(from: T, to: T, weight?: number): void {
    const fromId = this.getId(from);
    const toId = this.getId(to);

    if (!this.adjacencyList.has(fromId)) {
      this.addNode(from);
    }
    if (!this.adjacencyList.has(toId)) {
      this.addNode(to);
    }

    const fromNode = this.adjacencyList.get(fromId)!;
    const toNode = this.adjacencyList.get(toId)!;

    if (!fromNode.neighbors.some((n) => this.getId(n.value) === toId)) {
      toNode.weight = weight;
      fromNode.neighbors.push(toNode);
    }

    if (!toNode.neighbors.some((n) => this.getId(n.value) === fromId)) {
      fromNode.weight = weight;
      toNode.neighbors.push(fromNode);
    }
  }

  addDirectedEdge(from: T, to: T, weight?: number): void {
    const fromId = this.getId(from);
    const toId = this.getId(to);

    if (!this.adjacencyList.has(fromId)) {
      this.addNode(from);
    }
    if (!this.adjacencyList.has(toId)) {
      this.addNode(to);
    }

    const fromNode = this.adjacencyList.get(fromId)!;
    const toNode = this.adjacencyList.get(toId)!;

    toNode.weight = weight;
    if (!fromNode.neighbors.some((n) => this.getId(n.value) === toId)) {
      fromNode.neighbors.push(toNode);
    }
  }

  removeNode(value: T): boolean {
    const id = this.getId(value);
    const node = this.adjacencyList.get(id);
    if (!node) return false;

    for (const neighbor of node.neighbors) {
      const neighborIndex = neighbor.neighbors.findIndex((n) => this.getId(n.value) === id);
      if (neighborIndex !== -1) {
        neighbor.neighbors.splice(neighborIndex, 1);
      }
    }

    this.adjacencyList.delete(id);
    return true;
  }

  removeEdge(from: T, to: T): boolean {
    const fromId = this.getId(from);
    const toId = this.getId(to);

    const fromNode = this.adjacencyList.get(fromId);
    const toNode = this.adjacencyList.get(toId);

    if (!fromNode || !toNode) return false;

    const fromIndex = fromNode.neighbors.findIndex((n) => this.getId(n.value) === toId);
    const toIndex = toNode.neighbors.findIndex((n) => this.getId(n.value) === fromId);

    if (fromIndex !== -1) {
      fromNode.neighbors.splice(fromIndex, 1);
    }
    if (toIndex !== -1) {
      toNode.neighbors.splice(toIndex, 1);
    }

    return fromIndex !== -1 || toIndex !== -1;
  }

  getNode(value: T): GraphNode<T> | undefined {
    return this.adjacencyList.get(this.getId(value));
  }

  hasNode(value: T): boolean {
    return this.adjacencyList.has(this.getId(value));
  }

  hasEdge(from: T, to: T): boolean {
    const fromId = this.getId(from);
    const toId = this.getId(to);

    const fromNode = this.adjacencyList.get(fromId);
    if (!fromNode) return false;

    return fromNode.neighbors.some((n) => this.getId(n.value) === toId);
  }

  getNeighbors(value: T): GraphNode<T>[] {
    const node = this.adjacencyList.get(this.getId(value));
    return node ? [...node.neighbors] : [];
  }

  getAllNodes(): GraphNode<T>[] {
    return Array.from(this.adjacencyList.values());
  }

  getNodeCount(): number {
    return this.adjacencyList.size;
  }

  getEdgeCount(): number {
    let count = 0;
    for (const node of this.adjacencyList.values()) {
      count += node.neighbors.length;
    }
    return count / 2;
  }

  clear(): void {
    this.adjacencyList.clear();
  }

  dfs(start: T, callback: (node: GraphNode<T>) => void): void {
    const startId = this.getId(start);
    if (!this.adjacencyList.has(startId)) return;

    const visited = new Set<string>();
    const stack: GraphNode<T>[] = [this.adjacencyList.get(startId)!];

    while (stack.length > 0) {
      const node = stack.pop()!;
      const nodeId = this.getId(node.value);

      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        callback(node);

        for (const neighbor of node.neighbors) {
          if (!visited.has(this.getId(neighbor.value))) {
            stack.push(neighbor);
          }
        }
      }
    }
  }

  bfs(start: T, callback: (node: GraphNode<T>) => void): void {
    const startId = this.getId(start);
    if (!this.adjacencyList.has(startId)) return;

    const visited = new Set<string>();
    const queue: GraphNode<T>[] = [this.adjacencyList.get(startId)!];
    visited.add(startId);

    while (queue.length > 0) {
      const node = queue.shift()!;
      callback(node);

      for (const neighbor of node.neighbors) {
        const neighborId = this.getId(neighbor.value);
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighbor);
        }
      }
    }
  }

  findPath(from: T, to: T): T[] | null {
    const fromId = this.getId(from);
    const toId = this.getId(to);

    if (!this.adjacencyList.has(fromId) || !this.adjacencyList.has(toId)) {
      return null;
    }

    const visited = new Set<string>();
    const queue: Array<{ node: GraphNode<T>; path: T[] }> = [
      { node: this.adjacencyList.get(fromId)!, path: [from] },
    ];
    visited.add(fromId);

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;
      const nodeId = this.getId(node.value);

      if (nodeId === toId) {
        return path;
      }

      for (const neighbor of node.neighbors) {
        const neighborId = this.getId(neighbor.value);
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ node: neighbor, path: [...path, neighbor.value] });
        }
      }
    }

    return null;
  }

  hasCycle(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of this.adjacencyList.values()) {
      if (this.hasCycleDFS(this.getId(node.value), visited, recursionStack)) {
        return true;
      }
    }

    return false;
  }

  private hasCycleDFS(nodeId: string, visited: Set<string>, recursionStack: Set<string>): boolean {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = this.adjacencyList.get(nodeId);
    if (node) {
      for (const neighbor of node.neighbors) {
        if (this.hasCycleDFS(this.getId(neighbor.value), visited, recursionStack)) {
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  topologicalSort(): T[] | null {
    if (this.hasCycle()) return null;

    const visited = new Set<string>();
    const stack: string[] = [];

    for (const node of this.adjacencyList.values()) {
      if (!visited.has(this.getId(node.value))) {
        this.topologicalSortDFS(this.getId(node.value), visited, stack);
      }
    }

    return stack.reverse().map((id) => this.adjacencyList.get(id)!.value);
  }

  private topologicalSortDFS(nodeId: string, visited: Set<string>, stack: string[]): void {
    visited.add(nodeId);

    const node = this.adjacencyList.get(nodeId);
    if (node) {
      for (const neighbor of node.neighbors) {
        if (!visited.has(this.getId(neighbor.value))) {
          this.topologicalSortDFS(this.getId(neighbor.value), visited, stack);
        }
      }
    }

    stack.push(nodeId);
  }

  dijkstra(start: T): Map<string, { distance: number; path: T[] }> {
    const startId = this.getId(start);
    const distances = new Map<string, { distance: number; path: T[] }>();
    const visited = new Set<string>();
    const pq: Array<{ id: string; distance: number; path: T[] }> = [];

    for (const id of this.adjacencyList.keys()) {
      distances.set(id, { distance: Infinity, path: [] });
    }
    distances.set(startId, { distance: 0, path: [start] });

    pq.push({ id: startId, distance: 0, path: [start] });

    while (pq.length > 0) {
      pq.sort((a, b) => a.distance - b.distance);
      const { id: currentId } = pq.shift()!;

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const current = this.adjacencyList.get(currentId);
      if (!current) continue;

      for (const neighbor of current.neighbors) {
        const neighborId = this.getId(neighbor.value);
        if (visited.has(neighborId)) continue;

        const weight = neighbor.weight ?? 1;
        const currentDist = distances.get(currentId)!.distance;
        const newDist = currentDist + weight;
        const neighborDist = distances.get(neighborId)!.distance;

        if (newDist < neighborDist) {
          const currentPath = distances.get(currentId)!.path;
          distances.set(neighborId, { distance: newDist, path: [...currentPath, neighbor.value] });
          pq.push({ id: neighborId, distance: newDist, path: [...currentPath, neighbor.value] });
        }
      }
    }

    return distances;
  }
}

export class UndirectedGraph<T> extends Graph<T> {
  constructor(getId: (value: T) => string) {
    super(getId);
  }

  addEdge(from: T, to: T, weight?: number): void {
    const fromId = this.getNode(from);
    const toId = this.getNode(to);

    if (!fromId) this.addNode(from);
    if (!toId) this.addNode(to);

    super.addEdge(from, to, weight);
  }
}

export class DirectedGraph<T> extends Graph<T> {
  constructor(getId: (value: T) => string) {
    super(getId);
  }

  addEdge(from: T, to: T, weight?: number): void {
    const fromId = this.getNode(from);
    const toId = this.getNode(to);

    if (!fromId) this.addNode(from);
    if (!toId) this.addNode(to);

    super.addDirectedEdge(from, to, weight);
  }
}

export class WeightedGraph<T> extends Graph<T> {
  constructor(getId: (value: T) => string) {
    super(getId);
  }

  getWeight(from: T, to: T): number | undefined {
    const neighbors = this.getNeighbors(from);
    const toNode = neighbors.find((n) => this.getId(n.value) === this.getId(to));
    return toNode?.weight;
  }

  setWeight(from: T, to: T, weight: number): void {
    const fromNode = this.getNode(from);
    const toNode = this.getNode(to);

    if (fromNode) {
      const neighbor = fromNode.neighbors.find((n) => this.getId(n.value) === this.getId(to));
      if (neighbor) {
        neighbor.weight = weight;
      }
    }

    if (toNode) {
      const neighbor = toNode.neighbors.find((n) => this.getId(n.value) === this.getId(from));
      if (neighbor) {
        neighbor.weight = weight;
      }
    }
  }
}
