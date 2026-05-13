export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Polygon {
  points: Point[];
}

export class GeometryUtils {
  static distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static midpoint(p1: Point, p2: Point): Point {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }

  static angle(p1: Point, p2: Point): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  static rotatePoint(point: Point, center: Point, angle: number): Point {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  }

  static scalePoint(point: Point, center: Point, scale: number): Point {
    return {
      x: center.x + (point.x - center.x) * scale,
      y: center.y + (point.y - center.y) * scale,
    };
  }

  static reflectPoint(point: Point, line: Line): Point {
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const len = dx * dx + dy * dy;
    const t = ((point.x - line.x1) * dx + (point.y - line.y1) * dy) / len;
    const projX = line.x1 + t * dx;
    const projY = line.y1 + t * dy;
    return {
      x: 2 * projX - point.x,
      y: 2 * projY - point.y,
    };
  }

  static isPointInRect(point: Point, rect: Rect): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  static isPointInCircle(point: Point, circle: Circle): boolean {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
  }

  static isPointInPolygon(point: Point, polygon: Polygon): boolean {
    let inside = false;
    const { points } = polygon;
    const n = points.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;

      if (
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }

    return inside;
  }

  static rectArea(rect: Rect): number {
    return rect.width * rect.height;
  }

  static rectPerimeter(rect: Rect): number {
    return 2 * (rect.width + rect.height);
  }

  static circleArea(circle: Circle): number {
    return Math.PI * circle.radius * circle.radius;
  }

  static circleCircumference(circle: Circle): number {
    return 2 * Math.PI * circle.radius;
  }

  static lineLength(line: Line): number {
    return this.distance({ x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 });
  }

  static lineMidpoint(line: Line): Point {
    return this.midpoint({ x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 });
  }

  static lineAngle(line: Line): number {
    return this.angle({ x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 });
  }

  static lineIntersection(l1: Line, l2: Line): Point | null {
    const x1 = l1.x1, y1 = l1.y1, x2 = l1.x2, y2 = l1.y2;
    const x3 = l2.x1, y3 = l2.y1, x4 = l2.x2, y4 = l2.y2;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }

  static polygonArea(polygon: Polygon): number {
    const { points } = polygon;
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area / 2);
  }

  static polygonCentroid(polygon: Polygon): Point {
    const { points } = polygon;
    let cx = 0, cy = 0;
    const n = points.length;

    for (const point of points) {
      cx += point.x;
      cy += point.y;
    }

    return {
      x: cx / n,
      y: cy / n,
    };
  }

  static polygonPerimeter(polygon: Polygon): number {
    const { points } = polygon;
    let perimeter = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      perimeter += this.distance(points[i], points[j]);
    }

    return perimeter;
  }

  static boundingBox(points: Point[]): Rect {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  static convexHull(points: Point[]): Point[] {
    if (points.length < 3) return points;

    const sorted = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    const cross = (o: Point, a: Point, b: Point): number =>
      (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

    const lower: Point[] = [];
    for (const point of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
        lower.pop();
      }
      lower.push(point);
    }

    const upper: Point[] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const point = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
        upper.pop();
      }
      upper.push(point);
    }

    lower.pop();
    upper.pop();

    return lower.concat(upper);
  }

  static clipLineByRect(line: Line, rect: Rect): Line | null {
    const x1 = line.x1, y1 = line.y1, x2 = line.x2, y2 = line.y2;
    const { x, y, width, height } = rect;
    const right = x + width;
    const bottom = y + height;

    let inside1 = this.isPointInRect({ x: x1, y: y1 }, rect);
    let inside2 = this.isPointInRect({ x: x2, y: y2 }, rect);

    if (inside1 && inside2) return line;

    const edges: Line[] = [
      { x1: x, y1: y, x2: right, y2: y },
      { x1: right, y1: y, x2: right, y2: bottom },
      { x1: right, y1: bottom, x2: x, y2: bottom },
      { x1: x, y1: bottom, x2: x, y2: y },
    ];

    const clipLine = (l: Line): Line | null => {
      let x = l.x1, y = l.y1;
      let nx = l.x2, ny = l.y2;

      for (const edge of edges) {
        const intersection = this.lineIntersection({ x1: x, y1: y, x2: nx, y2: ny }, edge);
        if (intersection) {
          nx = intersection.x;
          ny = intersection.y;
        }
      }

      if (this.isPointInRect({ x: x, y }, rect) || this.isPointInRect({ x: nx, y: ny }, rect)) {
        return { x1: x, y1: y, x2: nx, y2: ny };
      }

      return null;
    };

    return clipLine(line);
  }
}

export class TransformUtils {
  static translate(point: Point, dx: number, dy: number): Point {
    return { x: point.x + dx, y: point.y + dy };
  }

  static scale(point: Point, scaleX: number, scaleY: number, center: Point = { x: 0, y: 0 }): Point {
    return {
      x: center.x + (point.x - center.x) * scaleX,
      y: center.y + (point.y - center.y) * scaleY,
    };
  }

  static rotate(point: Point, angle: number, center: Point = { x: 0, y: 0 }): Point {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  }

  static skew(point: Point, skewX: number, skewY: number, center: Point = { x: 0, y: 0 }): Point {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx + dy * Math.tan(skewX),
      y: center.y + dy + dx * Math.tan(skewY),
    };
  }

  static reflectX(point: Point, axis: number): Point {
    return { x: 2 * axis - point.x, y: point.y };
  }

  static reflectY(point: Point, axis: number): Point {
    return { x: point.x, y: 2 * axis - point.y };
  }

  static reflect(point: Point, line: Line): Point {
    return GeometryUtils.reflectPoint(point, line);
  }

  static transform(point: Point, matrix: DOMMatrix): Point {
    const p = new DOMPoint(point.x, point.y);
    const transformed = p.matrixTransform(matrix);
    return { x: transformed.x, y: transformed.y };
  }
}

export class BezierUtils {
  static quadraticPoint(t: number, p0: Point, p1: Point, p2: Point): Point {
    const mt = 1 - t;
    return {
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    };
  }

  static cubicPoint(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    };
  }

  static quadraticDerivative(t: number, p0: Point, p1: Point, p2: Point): Point {
    const mt = 1 - t;
    return {
      x: 2 * (mt * (p1.x - p0.x) + t * (p2.x - p1.x)),
      y: 2 * (mt * (p1.y - p0.y) + t * (p2.y - p1.y)),
    };
  }

  static cubicDerivative(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    return {
      x: 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x),
      y: 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y),
    };
  }

  static splitQuadratic(p0: Point, p1: Point, p2: Point, t: number): [Point, Point, Point, Point, Point] {
    const p01 = this.lerp(p0, p1, t);
    const p12 = this.lerp(p1, p2, t);
    const p012 = this.lerp(p01, p12, t);
    return [p0, p01, p012, p12, p2];
  }

  static splitCubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): [Point, Point, Point, Point, Point, Point, Point] {
    const p01 = this.lerp(p0, p1, t);
    const p12 = this.lerp(p1, p2, t);
    const p23 = this.lerp(p2, p3, t);
    const p012 = this.lerp(p01, p12, t);
    const p123 = this.lerp(p12, p23, t);
    const p0123 = this.lerp(p012, p123, t);
    return [p0, p01, p012, p0123, p123, p23, p3];
  }

  static quadraticLength(p0: Point, p1: Point, p2: Point, steps: number = 100): number {
    let length = 0;
    let prev = this.quadraticPoint(0, p0, p1, p2);

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const curr = this.quadraticPoint(t, p0, p1, p2);
      length += GeometryUtils.distance(prev, curr);
      prev = curr;
    }

    return length;
  }

  static cubicLength(p0: Point, p1: Point, p2: Point, p3: Point, steps: number = 100): number {
    let length = 0;
    let prev = this.cubicPoint(0, p0, p1, p2, p3);

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const curr = this.cubicPoint(t, p0, p1, p2, p3);
      length += GeometryUtils.distance(prev, curr);
      prev = curr;
    }

    return length;
  }

  static nearestPointOnQuadratic(point: Point, p0: Point, p1: Point, p2: Point, iterations: number = 10): { t: number; point: Point } {
    let minT = 0;
    let minDist = Infinity;

    for (let i = 0; i <= iterations; i++) {
      const t = i / iterations;
      const p = this.quadraticPoint(t, p0, p1, p2);
      const dist = GeometryUtils.distance(point, p);
      if (dist < minDist) {
        minDist = dist;
        minT = t;
      }
    }

    return {
      t: minT,
      point: this.quadraticPoint(minT, p0, p1, p2),
    };
  }

  static nearestPointOnCubic(point: Point, p0: Point, p1: Point, p2: Point, p3: Point, iterations: number = 10): { t: number; point: Point } {
    let minT = 0;
    let minDist = Infinity;

    for (let i = 0; i <= iterations; i++) {
      const t = i / iterations;
      const p = this.cubicPoint(t, p0, p1, p2, p3);
      const dist = GeometryUtils.distance(point, p);
      if (dist < minDist) {
        minDist = dist;
        minT = t;
      }
    }

    return {
      t: minT,
      point: this.cubicPoint(minT, p0, p1, p2, p3),
    };
  }

  private static lerp(a: Point, b: Point, t: number): Point {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }
}
