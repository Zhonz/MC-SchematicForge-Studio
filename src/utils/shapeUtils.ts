export type ShapeType = 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'polygon' | 'star' | 'line' | 'path'

export interface Point {
  x: number
  y: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Polygon {
  points: Point[]
  closed?: boolean
}

export interface Star {
  outerRadius: number
  innerRadius: number
  points: number
  rotation?: number
}

export interface PathCommand {
  type: 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z'
  values: number[]
}

export class ShapeUtils {
  static createRectangle(width: number, height: number, fill = '#000'): { type: ShapeType; width: number; height: number; fill: string } {
    return { type: 'rectangle', width, height, fill }
  }

  static createCircle(radius: number, fill = '#000'): { type: ShapeType; radius: number; fill: string } {
    return { type: 'circle', radius, fill }
  }

  static createEllipse(radiusX: number, radiusY: number, fill = '#000'): { type: ShapeType; radiusX: number; radiusY: number; fill: string } {
    return { type: 'ellipse', radiusX, radiusY, fill }
  }

  static createTriangle(size: number, fill = '#000'): { type: ShapeType; size: number; fill: string } {
    return { type: 'triangle', size, fill }
  }

  static createPolygon(points: Point[], closed = true): Polygon {
    return { points, closed }
  }

  static createStar(outerRadius: number, innerRadius: number, points: number, rotation = 0): Star {
    return { outerRadius, innerRadius, points, rotation }
  }

  static createLine(start: Point, end: Point): { type: ShapeType; start: Point; end: Point } {
    return { type: 'line', start, end }
  }

  static createPath(commands: PathCommand[]): { type: ShapeType; commands: PathCommand[] } {
    return { type: 'path', commands: [...commands] }
  }

  static generatePolygonPoints(sides: number, radius: number, center: Point = { x: 0, y: 0 }, rotation = 0): Point[] {
    const points: Point[] = []
    const angleStep = (2 * Math.PI) / sides
    const rotationRad = (rotation * Math.PI) / 180

    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep + rotationRad - Math.PI / 2
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      })
    }

    return points
  }

  static generateStarPoints(star: Star, center: Point = { x: 0, y: 0 }): Point[] {
    const points: Point[] = []
    const angleStep = Math.PI / star.points
    const rotationRad = (star.rotation || 0) * Math.PI / 180

    for (let i = 0; i < star.points * 2; i++) {
      const radius = i % 2 === 0 ? star.outerRadius : star.innerRadius
      const angle = i * angleStep + rotationRad - Math.PI / 2
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      })
    }

    return points
  }

  static getBoundingBox(points: Point[]): BoundingBox {
    if (points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    let minX = points[0].x
    let maxX = points[0].x
    let minY = points[0].y
    let maxY = points[0].y

    for (const point of points) {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  static containsPoint(points: Point[], point: Point): boolean {
    if (points.length < 3) return false

    let inside = false
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x
      const yi = points[i].y
      const xj = points[j].x
      const yj = points[j].y

      if (yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi) {
        inside = !inside
      }
    }

    return inside
  }

  static distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  static midpoint(p1: Point, p2: Point): Point {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    }
  }

  static rotatePoint(point: Point, center: Point, angleDeg: number): Point {
    const angleRad = (angleDeg * Math.PI) / 180
    const cos = Math.cos(angleRad)
    const sin = Math.sin(angleRad)

    const dx = point.x - center.x
    const dy = point.y - center.y

    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    }
  }

  static scalePoint(point: Point, center: Point, scaleX: number, scaleY: number): Point {
    return {
      x: center.x + (point.x - center.x) * scaleX,
      y: center.y + (point.y - center.y) * scaleY
    }
  }

  static translatePoints(points: Point[], dx: number, dy: number): Point[] {
    return points.map(p => ({
      x: p.x + dx,
      y: p.y + dy
    }))
  }

  static scalePoints(points: Point[], center: Point, scaleX: number, scaleY: number): Point[] {
    return points.map(p => this.scalePoint(p, center, scaleX, scaleY))
  }

  static rotatePoints(points: Point[], center: Point, angleDeg: number): Point[] {
    return points.map(p => this.rotatePoint(p, center, angleDeg))
  }

  static calculatePerimeter(points: Point[]): number {
    let perimeter = 0
    for (let i = 0; i < points.length; i++) {
      const next = (i + 1) % points.length
      perimeter += this.distance(points[i], points[next])
    }
    return perimeter
  }

  static calculateArea(points: Point[]): number {
    if (points.length < 3) return 0

    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].x * points[j].y
      area -= points[j].x * points[i].y
    }

    return Math.abs(area / 2)
  }

  static calculateCentroid(points: Point[]): Point {
    if (points.length === 0) return { x: 0, y: 0 }

    let cx = 0
    let cy = 0

    for (const point of points) {
      cx += point.x
      cy += point.y
    }

    return {
      x: cx / points.length,
      y: cy / points.length
    }
  }

  static convexHull(points: Point[]): Point[] {
    if (points.length < 3) return [...points]

    const sorted = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x)

    const cross = (o: Point, a: Point, b: Point): number => {
      return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
    }

    const lower: Point[] = []
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop()
      }
      lower.push(p)
    }

    const upper: Point[] = []
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i]
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop()
      }
      upper.push(p)
    }

    lower.pop()
    upper.pop()

    return [...lower, ...upper]
  }

  static simplifyPoints(points: Point[], tolerance = 1): Point[] {
    if (points.length <= 2) return [...points]

    const sqTolerance = tolerance * tolerance

    const getSqDist = (p1: Point, p2: Point): number => {
      const dx = p1.x - p2.x
      const dy = p1.y - p2.y
      return dx * dx + dy * dy
    }

    const getSqSegDist = (p: Point, p1: Point, p2: Point): number => {
      let x = p1.x
      let y = p1.y
      let dx = p2.x - x
      let dy = p2.y - y

      if (dx !== 0 || dy !== 0) {
        const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy)
        if (t > 1) {
          x = p2.x
          y = p2.y
        } else if (t > 0) {
          x += dx * t
          y += dy * t
        }
      }

      dx = p.x - x
      dy = p.y - y

      return dx * dx + dy * dy
    }

    const simplifyDPStep = (points: Point[], first: number, last: number, sqTolerance: number, simplified: Point[]): void => {
      let maxSqDist = sqTolerance
      let index = 0

      for (let i = first + 1; i < last; i++) {
        const sqDist = getSqSegDist(points[i], points[first], points[last])
        if (sqDist > maxSqDist) {
          index = i
          maxSqDist = sqDist
        }
      }

      if (maxSqDist > sqTolerance) {
        if (index - first > 1) {
          simplifyDPStep(points, first, index, sqTolerance, simplified)
        }
        simplified.push(points[index])
        if (last - index > 1) {
          simplifyDPStep(points, index, last, sqTolerance, simplified)
        }
      }
    }

    const last = points.length - 1
    const simplified: Point[] = [points[0]]
    simplifyDPStep(points, 0, last, sqTolerance, simplified)
    simplified.push(points[last])

    return simplified
  }
}
