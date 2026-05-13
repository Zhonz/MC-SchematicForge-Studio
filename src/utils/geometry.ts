export interface Point {
  x: number;
  y: number;
}

export interface Line {
  start: Point;
  end: Point;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  center: Point;
  radius: number;
}

export class GeometryUtils {
  static distance(a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static midpoint(a: Point, b: Point): Point {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    };
  }

  static manhattanDistance(a: Point, b: Point): number {
    return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
  }

  static chebyshevDistance(a: Point, b: Point): number {
    return Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  }

  static angle(from: Point, to: Point): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }

  static rotate(point: Point, center: Point, angle: number): Point {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  }

  static scale(point: Point, center: Point, factor: number): Point {
    return {
      x: center.x + (point.x - center.x) * factor,
      y: center.y + (point.y - center.y) * factor,
    };
  }

  static reflect(point: Point, line: Line): Point {
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / len;
    const ny = dy / len;
    const vx = point.x - line.start.x;
    const vy = point.y - line.start.y;
    const dot = vx * nx + vy * ny;
    return {
      x: point.x - 2 * (vx - dot * nx),
      y: point.y - 2 * (vy - dot * ny),
    };
  }

  static lineIntersection(l1: Line, l2: Line): Point | null {
    const x1 = l1.start.x, y1 = l1.start.y, x2 = l1.end.x, y2 = l1.end.y;
    const x3 = l2.start.x, y3 = l2.start.y, x4 = l2.end.x, y4 = l2.end.y;
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denom === 0) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }

  static pointInCircle(point: Point, circle: Circle): boolean {
    return this.distance(point, circle.center) <= circle.radius;
  }

  static pointInRectangle(point: Point, rect: Rectangle): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  static rectangleIntersection(a: Rectangle, b: Rectangle): Rectangle | null {
    const x = Math.max(a.x, b.x);
    const y = Math.max(a.y, b.y);
    const width = Math.min(a.x + a.width, b.x + b.width) - x;
    const height = Math.min(a.y + a.height, b.y + b.height) - y;
    if (width <= 0 || height <= 0) return null;
    return { x, y, width, height };
  }

  static convexHull(points: Point[]): Point[] {
    if (points.length < 3) return points;
    points.sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o: Point, a: Point, b: Point) =>
      (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower: Point[] = [];
    for (const p of points) {
      while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }
    const upper: Point[] = [];
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i]!;
      while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  static boundingBox(points: Point[]): Rectangle {
    if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  static centroid(points: Point[]): Point {
    if (points.length === 0) return { x: 0, y: 0 };
    let sumX = 0, sumY = 0;
    for (const p of points) {
      sumX += p.x;
      sumY += p.y;
    }
    return { x: sumX / points.length, y: sumY / points.length };
  }
}
