export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function inverseLerp(start: number, end: number, value: number): number {
  return (value - start) / (end - start);
}

export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function degrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function radians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function floorTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor) / factor;
}

export function ceilTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.ceil(value * factor) / factor;
}

export function sign(x: number): number {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

export function isPowerOf2(value: number): boolean {
  return (value & (value - 1)) === 0 && value !== 0;
}

export function nextPowerOf2(value: number): number {
  if (isPowerOf2(value)) return value;
  let n = value - 1;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  return n + 1;
}

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}
