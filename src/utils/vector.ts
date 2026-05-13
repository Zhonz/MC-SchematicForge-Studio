export interface Vector2D {
  x: number
  y: number
}

export interface Vector3D extends Vector2D {
  z: number
}

export interface Vector4D extends Vector3D {
  w: number
}

export class Vector {
  static add(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x + b.x, y: a.y + b.y }
  }

  static subtract(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x - b.x, y: a.y - b.y }
  }

  static multiply(v: Vector2D, scalar: number): Vector2D {
    return { x: v.x * scalar, y: v.y * scalar }
  }

  static divide(v: Vector2D, scalar: number): Vector2D {
    return { x: v.x / scalar, y: v.y / scalar }
  }

  static magnitude(v: Vector2D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y)
  }

  static normalize(v: Vector2D): Vector2D {
    const mag = this.magnitude(v)
    return mag === 0 ? { x: 0, y: 0 } : this.divide(v, mag)
  }

  static dot(a: Vector2D, b: Vector2D): number {
    return a.x * b.x + a.y * b.y
  }

  static cross(a: Vector2D, b: Vector2D): number {
    return a.x * b.y - a.y * b.x
  }

  static distance(a: Vector2D, b: Vector2D): number {
    return this.magnitude(this.subtract(a, b))
  }

  static lerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    }
  }

  static reflect(v: Vector2D, normal: Vector2D): Vector2D {
    const d = 2 * this.dot(v, normal)
    return { x: v.x - d * normal.x, y: v.y - d * normal.y }
  }

  static angle(a: Vector2D, b: Vector2D): number {
    const dot = this.dot(a, b)
    const magA = this.magnitude(a)
    const magB = this.magnitude(b)
    return Math.acos(Math.max(-1, Math.min(1, dot / (magA * magB))))
  }

  static rotate(v: Vector2D, angle: number): Vector2D {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos
    }
  }

  static perpendicular(v: Vector2D): Vector2D {
    return { x: -v.y, y: v.x }
  }

  static project(a: Vector2D, b: Vector2D): Vector2D {
    const scalar = this.dot(a, b) / this.dot(b, b)
    return this.multiply(b, scalar)
  }

  static add3D(a: Vector3D, b: Vector3D): Vector3D {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
  }

  static subtract3D(a: Vector3D, b: Vector3D): Vector3D {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
  }

  static multiply3D(v: Vector3D, scalar: number): Vector3D {
    return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar }
  }

  static magnitude3D(v: Vector3D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
  }

  static normalize3D(v: Vector3D): Vector3D {
    const mag = this.magnitude3D(v)
    return mag === 0 ? { x: 0, y: 0, z: 0 } : this.divide3D(v, mag)
  }

  static divide3D(v: Vector3D, scalar: number): Vector3D {
    return { x: v.x / scalar, y: v.y / scalar, z: v.z / scalar }
  }

  static dot3D(a: Vector3D, b: Vector3D): number {
    return a.x * b.x + a.y * b.y + a.z * b.z
  }

  static cross3D(a: Vector3D, b: Vector3D): Vector3D {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    }
  }

  static distance3D(a: Vector3D, b: Vector3D): number {
    return this.magnitude3D(this.subtract3D(a, b))
  }

  static lerp3D(a: Vector3D, b: Vector3D, t: number): Vector3D {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t
    }
  }

  static length(v: Vector2D | Vector3D): number {
    return 'z' in v ? this.magnitude3D(v) : this.magnitude(v)
  }
}
