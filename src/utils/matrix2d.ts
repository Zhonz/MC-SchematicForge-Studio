export interface Transform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  skewX: number;
  skewY: number;
}

export class Matrix2D {
  private data: number[];

  constructor(a: number = 1, b: number = 0, c: number = 0, d: number = 1, e: number = 0, f: number = 0) {
    this.data = [a, b, c, d, e, f];
  }

  static identity(): Matrix2D {
    return new Matrix2D(1, 0, 0, 1, 0, 0);
  }

  static translation(x: number, y: number): Matrix2D {
    return new Matrix2D(1, 0, 0, 1, x, y);
  }

  static scaling(sx: number, sy: number = sx): Matrix2D {
    return new Matrix2D(sx, 0, 0, sy, 0, 0);
  }

  static rotation(angle: number): Matrix2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Matrix2D(cos, sin, -sin, cos, 0, 0);
  }

  static skewing(sx: number, sy: number = 0): Matrix2D {
    return new Matrix2D(1, Math.tan(sy), Math.tan(sx), 1, 0, 0);
  }

  multiply(other: Matrix2D): Matrix2D {
    const a = this.data[0]! * other.data[0]! + this.data[2]! * other.data[1]!;
    const b = this.data[1]! * other.data[0]! + this.data[3]! * other.data[1]!;
    const c = this.data[0]! * other.data[2]! + this.data[2]! * other.data[3]!;
    const d = this.data[1]! * other.data[2]! + this.data[3]! * other.data[3]!;
    const e = this.data[0]! * other.data[4]! + this.data[2]! * other.data[5]! + this.data[4]!;
    const f = this.data[1]! * other.data[4]! + this.data[3]! * other.data[5]! + this.data[5]!;
    return new Matrix2D(a, b, c, d, e, f);
  }

  translate(x: number, y: number): Matrix2D {
    return this.multiply(Matrix2D.translation(x, y));
  }

  scale(sx: number, sy: number = sx): Matrix2D {
    return this.multiply(Matrix2D.scaling(sx, sy));
  }

  rotate(angle: number): Matrix2D {
    return this.multiply(Matrix2D.rotation(angle));
  }

  skew(sx: number, sy: number = 0): Matrix2D {
    return this.multiply(Matrix2D.skewing(sx, sy));
  }

  invert(): Matrix2D | null {
    const det = this.data[0]! * this.data[3]! - this.data[1]! * this.data[2]!;
    if (det === 0) return null;
    const invDet = 1 / det;
    return new Matrix2D(
      this.data[3]! * invDet,
      -this.data[1]! * invDet,
      -this.data[2]! * invDet,
      this.data[0]! * invDet,
      (this.data[2]! * this.data[5]! - this.data[3]! * this.data[4]!) * invDet,
      (this.data[1]! * this.data[4]! - this.data[0]! * this.data[5]!) * invDet
    );
  }

  transformPoint(x: number, y: number): { x: number; y: number } {
    return {
      x: this.data[0]! * x + this.data[2]! * y + this.data[4]!,
      y: this.data[1]! * x + this.data[3]! * y + this.data[5]!,
    };
  }

  toCSS(): string {
    return `matrix(${this.data.join(', ')})`;
  }

  toArray(): number[] {
    return [...this.data];
  }

  clone(): Matrix2D {
    return new Matrix2D(...this.data);
  }
}

export function decomposeMatrix(m: Matrix2D): Transform {
  const data = m.toArray();
  const a = data[0]!;
  const b = data[1]!;
  const c = data[2]!;
  const d = data[3]!;
  const e = data[4]!;
  const f = data[5]!;

  const scaleX = Math.sqrt(a * a + b * b);
  const scaleY = Math.sqrt(c * c + d * d);
  const rotation = Math.atan2(b, a);
  const skewX = Math.atan2(a * c + b * d, a * a + b * b);
  const skewY = 0;

  return {
    x: e,
    y: f,
    scaleX,
    scaleY,
    rotation,
    skewX,
    skewY,
  };
}

export function composeMatrix(transform: Partial<Transform>): Matrix2D {
  let matrix = Matrix2D.identity();
  if (transform.x !== undefined || transform.y !== undefined) {
    matrix = matrix.translate(transform.x ?? 0, transform.y ?? 0);
  }
  if (transform.rotation !== undefined) {
    matrix = matrix.rotate(transform.rotation);
  }
  if (transform.scaleX !== undefined || transform.scaleY !== undefined) {
    matrix = matrix.scale(transform.scaleX ?? 1, transform.scaleY ?? 1);
  }
  if (transform.skewX !== undefined || transform.skewY !== undefined) {
    matrix = matrix.skew(transform.skewX ?? 0, transform.skewY ?? 0);
  }
  return matrix;
}
