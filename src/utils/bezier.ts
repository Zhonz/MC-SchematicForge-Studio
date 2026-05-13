export interface Point {
  x: number;
  y: number;
}

export interface BezierCurve {
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
}

export class Bezier {
  static cubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
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

  static quadratic(p0: Point, p1: Point, p2: Point, t: number): Point {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    return {
      x: mt2 * p0.x + 2 * mt * t * p1.x + t2 * p2.x,
      y: mt2 * p0.y + 2 * mt * t * p1.y + t2 * p2.y,
    };
  }

  static linear(p0: Point, p1: Point, t: number): Point {
    return {
      x: p0.x + (p1.x - p0.x) * t,
      y: p0.y + (p1.y - p0.y) * t,
    };
  }

  static split(curve: BezierCurve, t: number): [BezierCurve, BezierCurve] {
    const { start, control1, control2, end } = curve;
    const p01 = Bezier.linear(start, control1, t);
    const p12 = Bezier.linear(control1, control2, t);
    const p23 = Bezier.linear(control2, end, t);
    const p012 = Bezier.linear(p01, p12, t);
    const p123 = Bezier.linear(p12, p23, t);
    const p0123 = Bezier.linear(p012, p123, t);
    return [
      { start, control1: p01, control2: p012, end: p0123 },
      { start: p0123, control1: p123, control2: p23, end },
    ];
  }

  static length(curve: BezierCurve, steps: number = 100): number {
    let len = 0;
    let prev = Bezier.cubic(curve.start, curve.control1, curve.control2, curve.end, 0);
    for (let i = 1; i <= steps; i++) {
      const curr = Bezier.cubic(curve.start, curve.control1, curve.control2, curve.end, i / steps);
      len += Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
      prev = curr;
    }
    return len;
  }

  static toSVGPath(curve: BezierCurve): string {
    const { start, control1, control2, end } = curve;
    return `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;
  }
}
