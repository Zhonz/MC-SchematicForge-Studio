export interface GraphNode<T> {
  id: string;
  value: T;
  neighbors: GraphNode<T>[];
  edges: Map<string, number>;
}

export interface Edge<T> {
  from: string;
  to: string;
  weight?: number;
}

export class Graph<T> {
  private nodes: Map<string, GraphNode<T>> = new Map();
  private directed: boolean;

  constructor(directed = false) {
    this.directed = directed;
  }

  addNode(id: string, value: T): GraphNode<T> {
    if (!this.nodes.has(id)) {
      const node: GraphNode<T> = { id, value, neighbors: [], edges: new Map() };
      this.nodes.set(id, node);
    }
    return this.nodes.get(id)!;
  }

  removeNode(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;
    
    node.neighbors.forEach(neighbor => {
      neighbor.neighbors = neighbor.neighbors.filter(n => n.id !== id);
      neighbor.edges.delete(id);
    });
    
    this.nodes.delete(id);
    return true;
  }

  addEdge(from: string, to: string, weight = 1): boolean {
    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);
    if (!fromNode || !toNode) return false;

    fromNode.neighbors.push(toNode);
    fromNode.edges.set(to, weight);

    if (!this.directed) {
      toNode.neighbors.push(fromNode);
      toNode.edges.set(from, weight);
    }

    return true;
  }

  removeEdge(from: string, to: string): boolean {
    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);
    if (!fromNode || !toNode) return false;

    fromNode.neighbors = fromNode.neighbors.filter(n => n.id !== to);
    fromNode.edges.delete(to);

    if (!this.directed) {
      toNode.neighbors = toNode.neighbors.filter(n => n.id !== from);
      toNode.edges.delete(from);
    }

    return true;
  }

  getNode(id: string): GraphNode<T> | undefined {
    return this.nodes.get(id);
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  hasEdge(from: string, to: string): boolean {
    const node = this.nodes.get(from);
    return node ? node.edges.has(to) : false;
  }

  getEdgeWeight(from: string, to: string): number | undefined {
    return this.nodes.get(from)?.edges.get(to);
  }

  getNeighbors(id: string): GraphNode<T>[] {
    return this.nodes.get(id)?.neighbors ?? [];
  }

  getNodeCount(): number {
    return this.nodes.size;
  }

  getEdgeCount(): number {
    let count = 0;
    this.nodes.forEach(node => {
      count += node.edges.size;
    });
    return this.directed ? count : count / 2;
  }

  bfs(startId: string, visit: (node: GraphNode<T>) => void): void {
    const start = this.nodes.get(startId);
    if (!start) return;

    const visited = new Set<string>();
    const queue: GraphNode<T>[] = [start];

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node.id)) continue;
      
      visited.add(node.id);
      visit(node);

      node.neighbors.forEach(neighbor => {
        if (!visited.has(neighbor.id)) {
          queue.push(neighbor);
        }
      });
    }
  }

  dfs(startId: string, visit: (node: GraphNode<T>) => void): void {
    const start = this.nodes.get(startId);
    if (!start) return;

    const visited = new Set<string>();
    const stack: GraphNode<T>[] = [start];

    while (stack.length > 0) {
      const node = stack.pop()!;
      if (visited.has(node.id)) continue;
      
      visited.add(node.id);
      visit(node);

      node.neighbors.forEach(neighbor => {
        if (!visited.has(neighbor.id)) {
          stack.push(neighbor);
        }
      });
    }
  }

  dijkstra(startId: string, endId: string): { path: string[]; distance: number } | null {
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    this.nodes.forEach((_, id) => {
      distances.set(id, Infinity);
      unvisited.add(id);
    });
    distances.set(startId, 0);
    previous.set(startId, null);

    while (unvisited.size > 0) {
      let current: string | null = null;
      let minDist = Infinity;
      
      unvisited.forEach(id => {
        const dist = distances.get(id)!;
        if (dist < minDist) {
          minDist = dist;
          current = id;
        }
      });

      if (current === null || minDist === Infinity) break;
      if (current === endId) break;

      unvisited.delete(current);

      const node = this.nodes.get(current)!;
      node.neighbors.forEach(neighbor => {
        if (!unvisited.has(neighbor.id)) return;
        const weight = node.edges.get(neighbor.id) ?? 1;
        const alt = distances.get(current!)! + weight;
        if (alt < distances.get(neighbor.id)!) {
          distances.set(neighbor.id, alt);
          previous.set(neighbor.id, current);
        }
      });
    }

    if (distances.get(endId) === Infinity) return null;

    const path: string[] = [];
    let current: string | null = endId;
    while (current !== null) {
      path.unshift(current);
      current = previous.get(current) ?? null;
    }

    return { path, distance: distances.get(endId)! };
  }

  hasCycle(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = this.nodes.get(nodeId)!;
      for (const neighbor of node.neighbors) {
        if (!visited.has(neighbor.id)) {
          if (dfs(neighbor.id)) return true;
        } else if (recursionStack.has(neighbor.id)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const [id] of this.nodes) {
      if (!visited.has(id)) {
        if (dfs(id)) return true;
      }
    }

    return false;
  }

  toAdjacencyList(): Map<string, string[]> {
    const list = new Map<string, string[]>();
    this.nodes.forEach((node, id) => {
      list.set(id, node.neighbors.map(n => n.id));
    });
    return list;
  }

  clear(): void {
    this.nodes.clear();
  }
}
