export class MathUtils2 {
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  static inverseLerp(start: number, end: number, value: number): number {
    if (start === end) return 0;
    return (value - start) / (end - start);
  }

  static remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    const t = this.inverseLerp(inMin, inMax, value);
    return this.lerp(outMin, outMax, t);
  }

  static floor(value: number, precision: number = 0): number {
    const factor = Math.pow(10, precision);
    return Math.floor(value * factor) / factor;
  }

  static ceil(value: number, precision: number = 0): number {
    const factor = Math.pow(10, precision);
    return Math.ceil(value * factor) / factor;
  }

  static round(value: number, precision: number = 0): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  static truncate(value: number, precision: number = 0): number {
    const factor = Math.pow(10, precision);
    const truncated = value < 0 ? Math.ceil(value * factor) : Math.floor(value * factor);
    return truncated / factor;
  }

  static sign(value: number): number {
    if (value > 0) return 1;
    if (value < 0) return -1;
    return 0;
  }

  static absMax(values: number[]): number {
    return Math.max(...values.map(Math.abs));
  }

  static absMin(values: number[]): number {
    return Math.min(...values.map(Math.abs));
  }

  static sum(values: number[]): number {
    return values.reduce((acc, val) => acc + val, 0);
  }

  static average(values: number[]): number {
    if (values.length === 0) return 0;
    return this.sum(values) / values.length;
  }

  static median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  static mode(values: number[]): number | null {
    if (values.length === 0) return null;
    const counts = new Map<number, number>();
    values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
    let maxCount = 0;
    let modeValue: number | null = null;
    counts.forEach((count, value) => {
      if (count > maxCount) {
        maxCount = count;
        modeValue = value;
      }
    });
    return modeValue;
  }

  static variance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.average(values);
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    return this.average(squaredDiffs);
  }

  static standardDeviation(values: number[]): number {
    return Math.sqrt(this.variance(values));
  }

  static meanAbsoluteDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.average(values);
    return this.average(values.map(v => Math.abs(v - avg)));
  }

  static percentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return this.lerp(sorted[lower], sorted[upper], index - lower);
  }

  static normalize(value: number, min: number, max: number): number {
    if (min === max) return 0;
    return (value - min) / (max - min);
  }

  static degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  static radToDeg(radians: number): number {
    return radians * (180 / Math.PI);
  }

  static factorial(n: number): number {
    if (n < 0) return 1;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  static binomial(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    return this.factorial(n) / (this.factorial(k) * this.factorial(n - k));
  }

  static fibonacci(n: number): number {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  static isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  static gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      [a, b] = [b, a % b];
    }
    return a;
  }

  static lcm(a: number, b: number): number {
    return Math.abs(a * b) / this.gcd(a, b);
  }

  static random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  static randomInt(min: number, max: number): number {
    return Math.floor(this.random(min, max + 1));
  }

  static randomBoolean(probability: number = 0.5): boolean {
    return Math.random() < probability;
  }

  static randomFromArray<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  static isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }

  static nextPowerOfTwo(n: number): number {
    if (n < 1) return 1;
    let power = 1;
    while (power < n) power *= 2;
    return power;
  }

  static distance2D(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  static distance3D(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
    return Math.sqrt(
      Math.pow(x2 - x1, 2) + 
      Math.pow(y2 - y1, 2) + 
      Math.pow(z2 - z1, 2)
    );
  }

  static manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
  }

  static chebyshevDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  }
}

export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  subtract(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vector2 {
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: Vector2): number {
    return this.x * v.y - this.y * v.x;
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): Vector2 {
    const mag = this.magnitude();
    return mag > 0 ? this.divide(mag) : new Vector2();
  }

  distanceTo(v: Vector2): number {
    return this.subtract(v).magnitude();
  }

  lerp(v: Vector2, t: number): Vector2 {
    return new Vector2(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t
    );
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  rotate(angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  static fromAngle(angle: number, magnitude: number = 1): Vector2 {
    return new Vector2(Math.cos(angle), Math.sin(angle)).multiply(magnitude);
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
}

export class Vector3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}

  add(v: Vector3): Vector3 {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  subtract(v: Vector3): Vector3 {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  multiply(scalar: number): Vector3 {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  divide(scalar: number): Vector3 {
    return new Vector3(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector3): Vector3 {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalize(): Vector3 {
    const mag = this.magnitude();
    return mag > 0 ? this.divide(mag) : new Vector3();
  }

  distanceTo(v: Vector3): number {
    return this.subtract(v).magnitude();
  }

  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }
}

export class Matrix3 {
  constructor(public data: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1]) {}

  multiply(m: Matrix3): Matrix3 {
    const result = new Matrix3();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        result.data[i * 3 + j] = 0;
        for (let k = 0; k < 3; k++) {
          result.data[i * 3 + j] += this.data[i * 3 + k] * m.data[k * 3 + j];
        }
      }
    }
    return result;
  }

  static rotation(angle: number): Matrix3 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Matrix3([c, -s, 0, s, c, 0, 0, 0, 1]);
  }

  static translation(x: number, y: number): Matrix3 {
    return new Matrix3([1, 0, x, 0, 1, y, 0, 0, 1]);
  }

  static scaling(x: number, y: number): Matrix3 {
    return new Matrix3([x, 0, 0, 0, y, 0, 0, 0, 1]);
  }
}

export class BezierCurve {
  constructor(private points: Vector2[]) {}

  getPoint(t: number): Vector2 {
    if (this.points.length === 0) return new Vector2();
    if (this.points.length === 1) return this.points[0].clone();

    const result: Vector2[] = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      result.push(this.points[i].lerp(this.points[i + 1], t));
    }

    return new BezierCurve(result).getPoint(t);
  }

  getPoints(count: number): Vector2[] {
    const points: Vector2[] = [];
    for (let i = 0; i <= count; i++) {
      points.push(this.getPoint(i / count));
    }
    return points;
  }
}

export class EaseFunctions {
  static linear(t: number): number {
    return t;
  }

  static easeInQuad(t: number): number {
    return t * t;
  }

  static easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeInCubic(t: number): number {
    return t * t * t;
  }

  static easeOutCubic(t: number): number {
    return 1 + Math.pow(t - 1, 3);
  }

  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  static easeInQuart(t: number): number {
    return t * t * t * t;
  }

  static easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  static easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  static easeInQuint(t: number): number {
    return t * t * t * t * t;
  }

  static easeOutQuint(t: number): number {
    return 1 + Math.pow(t - 1, 5);
  }

  static easeInOutQuint(t: number): number {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
  }

  static easeInSine(t: number): number {
    return 1 - Math.cos(t * (Math.PI / 2));
  }

  static easeOutSine(t: number): number {
    return Math.sin(t * (Math.PI / 2));
  }

  static easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  static easeInExpo(t: number): number {
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
  }

  static easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  static easeInOutExpo(t: number): number {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  }

  static easeInCirc(t: number): number {
    return 1 - Math.sqrt(1 - Math.pow(t, 2));
  }

  static easeOutCirc(t: number): number {
    return Math.sqrt(1 - Math.pow(t - 1, 2));
  }

  static easeInOutCirc(t: number): number {
    return t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
  }

  static easeInBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  }

  static easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  static easeInOutBack(t: number): number {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  }

  static easeInElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  }

  static easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  static easeInOutElastic(t: number): number {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : t < 0.5
          ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
          : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  }

  static easeInBounce(t: number): number {
    return 1 - this.easeOutBounce(1 - t);
  }

  static easeOutBounce(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  static easeInOutBounce(t: number): number {
    return t < 0.5
      ? (1 - this.easeOutBounce(1 - 2 * t)) / 2
      : (1 + this.easeOutBounce(2 * t - 1)) / 2;
  }
}

export default MathUtils2;
