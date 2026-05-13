export interface BoundingBox {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface Line {
  start: Point2D;
  end: Point2D;
}

export interface Line3D {
  start: Point3D;
  end: Point3D;
}

export interface Circle {
  center: Point2D;
  radius: number;
}

export interface Sphere {
  center: Point3D;
  radius: number;
}

export interface Polygon {
  points: Point2D[];
  closed?: boolean;
}

export class Geometry2D {
  static distance(a: Point2D, b: Point2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static manhattanDistance(a: Point2D, b: Point2D): number {
    return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
  }

  static midpoint(a: Point2D, b: Point2D): Point2D {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    };
  }

  static angle(from: Point2D, to: Point2D): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }

  static rotate(point: Point2D, center: Point2D, angle: number): Point2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  }

  static scale(point: Point2D, center: Point2D, factor: number): Point2D {
    return {
      x: center.x + (point.x - center.x) * factor,
      y: center.y + (point.y - center.y) * factor,
    };
  }

  static reflect(point: Point2D, line: Line): Point2D {
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / len;
    const ny = dy / len;
    const d = ((point.x - line.start.x) * nx + (point.y - line.start.y) * ny);
    return {
      x: point.x - 2 * d * nx,
      y: point.y - 2 * d * ny,
    };
  }

  static lineIntersection(line1: Line, line2: Line): Point2D | null {
    const x1 = line1.start.x, y1 = line1.start.y;
    const x2 = line1.end.x, y2 = line1.end.y;
    const x3 = line2.start.x, y3 = line2.start.y;
    const x4 = line2.end.x, y4 = line2.end.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }

  static pointInCircle(point: Point2D, circle: Circle): boolean {
    return this.distance(point, circle.center) <= circle.radius;
  }

  static pointInPolygon(point: Point2D, polygon: Polygon): boolean {
    const points = polygon.points;
    let inside = false;
    const n = points.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;

      if (((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  static circleArea(circle: Circle): number {
    return Math.PI * circle.radius * circle.radius;
  }

  static circleCircumference(circle: Circle): number {
    return 2 * Math.PI * circle.radius;
  }

  static polygonArea(polygon: Polygon): number {
    const points = polygon.points;
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area) / 2;
  }

  static polygonPerimeter(polygon: Polygon): number {
    const points = polygon.points;
    let perimeter = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      perimeter += this.distance(points[i], points[j]);
    }

    return perimeter;
  }

  static convexHull(points: Point2D[]): Point2D[] {
    if (points.length < 3) return points.slice();

    points.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
    
    const cross = (o: Point2D, a: Point2D, b: Point2D) =>
      (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

    const lower: Point2D[] = [];
    for (const p of points) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }

    const upper: Point2D[] = [];
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }

    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  static boundingBox(points: Point2D[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
    if (points.length === 0) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    return { minX, minY, maxX, maxY };
  }
}

export class Geometry3D {
  static distance(a: Point3D, b: Point3D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  static manhattanDistance(a: Point3D, b: Point3D): number {
    return Math.abs(b.x - a.x) + Math.abs(b.y - a.y) + Math.abs(b.z - a.z);
  }

  static midpoint(a: Point3D, b: Point3D): Point3D {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      z: (a.z + b.z) / 2,
    };
  }

  static sphereVolume(sphere: Sphere): number {
    return (4 / 3) * Math.PI * Math.pow(sphere.radius, 3);
  }

  static sphereSurfaceArea(sphere: Sphere): number {
    return 4 * Math.PI * sphere.radius * sphere.radius;
  }

  static pointInSphere(point: Point3D, sphere: Sphere): boolean {
    return this.distance(point, sphere.center) <= sphere.radius;
  }

  static boundingBoxVolume(box: BoundingBox): number {
    return (box.maxX - box.minX) * (box.maxY - box.minY) * (box.maxZ - box.minZ);
  }

  static boundingBoxSurfaceArea(box: BoundingBox): number {
    const dx = box.maxX - box.minX;
    const dy = box.maxY - box.minY;
    const dz = box.maxZ - box.minZ;
    return 2 * (dx * dy + dy * dz + dz * dx);
  }

  static lineSegmentDistance(line: Line3D, point: Point3D): number {
    const { start, end } = line;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const len2 = dx * dx + dy * dy + dz * dz;

    if (len2 === 0) return this.distance(start, point);

    let t = ((point.x - start.x) * dx + (point.y - start.y) * dy + (point.z - start.z) * dz) / len2;
    t = Math.max(0, Math.min(1, t));

    return this.distance(point, {
      x: start.x + t * dx,
      y: start.y + t * dy,
      z: start.z + t * dz,
    });
  }

  static projectPointOnLine(line: Line3D, point: Point3D): Point3D {
    const { start, end } = line;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const len2 = dx * dx + dy * dy + dz * dz;

    if (len2 === 0) return start;

    let t = ((point.x - start.x) * dx + (point.y - start.y) * dy + (point.z - start.z) * dz) / len2;
    t = Math.max(0, Math.min(1, t));

    return {
      x: start.x + t * dx,
      y: start.y + t * dy,
      z: start.z + t * dz,
    };
  }

  static fromBoundingBox(box: BoundingBox): Point3D[] {
    return [
      { x: box.minX, y: box.minY, z: box.minZ },
      { x: box.maxX, y: box.minY, z: box.minZ },
      { x: box.maxX, y: box.maxY, z: box.minZ },
      { x: box.minX, y: box.maxY, z: box.minZ },
      { x: box.minX, y: box.minY, z: box.maxZ },
      { x: box.maxX, y: box.minY, z: box.maxZ },
      { x: box.maxX, y: box.maxY, z: box.maxZ },
      { x: box.minX, y: box.maxY, z: box.maxZ },
    ];
  }

  static toBoundingBox(points: Point3D[]): BoundingBox | null {
    if (points.length === 0) return null;

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      minZ = Math.min(minZ, p.z);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
      maxZ = Math.max(maxZ, p.z);
    }

    return { minX, minY, minZ, maxX, maxY, maxZ };
  }
}

export const geometry2D = Geometry2D;
export const geometry3D = Geometry3D;
