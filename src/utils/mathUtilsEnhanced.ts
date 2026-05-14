/**
 * 🔢 增强数学工具函数
 * 
 * 提供高级数学计算功能
 */

/**
 * 钳制数值在范围内
 * 
 * @param num - 原数值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 钳制后的数值
 * 
 * @example
 * ```ts
 * clamp(10, 0, 5);
 * // 5
 * ```
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * 数值四舍五入到指定精度
 * 
 * @param num - 原数值
 * @param precision - 精度
 * @returns 四舍五入后的数值
 * 
 * @example
 * ```ts
 * round(3.14159, 2);
 * // 3.14
 * ```
 */
export function round(num: number, precision: number = 0): number {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
}

/**
 * 数值向上取整到指定精度
 * 
 * @param num - 原数值
 * @param precision - 精度
 * @returns 向上取整后的数值
 * 
 * @example
 * ```ts
 * ceil(3.14159, 2);
 * // 3.15
 * ```
 */
export function ceil(num: number, precision: number = 0): number {
  const factor = Math.pow(10, precision);
  return Math.ceil(num * factor) / factor;
}

/**
 * 数值向下取整到指定精度
 * 
 * @param num - 原数值
 * @param precision - 精度
 * @returns 向下取整后的数值
 * 
 * @example
 * ```ts
 * floor(3.14159, 2);
 * // 3.14
 * ```
 */
export function floor(num: number, precision: number = 0): number {
  const factor = Math.pow(10, precision);
  return Math.floor(num * factor) / factor;
}

/**
 * 数值取绝对值
 * 
 * @param num - 原数值
 * @returns 绝对值
 * 
 * @example
 * ```ts
 * abs(-5);
 * // 5
 * ```
 */
export function abs(num: number): number {
  return Math.abs(num);
}

/**
 * 数值取模
 * 
 * @param num - 被除数
 * @param divisor - 除数
 * @returns 余数
 * 
 * @example
 * ```ts
 * mod(7, 3);
 * // 1
 * ```
 */
export function mod(num: number, divisor: number): number {
  return ((num % divisor) + divisor) % divisor;
}

/**
 * 计算平均值
 * 
 * @param nums - 数字数组
 * @returns 平均值
 * 
 * @example
 * ```ts
 * mean([1, 2, 3, 4, 5]);
 * // 3
 * ```
 */
export function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((sum, num) => sum + num, 0) / nums.length;
}

/**
 * 计算中位数
 * 
 * @param nums - 数字数组
 * @returns 中位数
 * 
 * @example
 * ```ts
 * median([1, 3, 5, 7, 9]);
 * // 5
 * ```
 */
export function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * 计算众数
 * 
 * @param nums - 数字数组
 * @returns 众数数组
 * 
 * @example
 * ```ts
 * mode([1, 2, 2, 3, 3, 3, 4]);
 * // [3]
 * ```
 */
export function mode(nums: number[]): number[] {
  if (nums.length === 0) return [];
  
  const frequency = new Map<number, number>();
  let maxFrequency = 0;
  
  for (const num of nums) {
    const count = (frequency.get(num) || 0) + 1;
    frequency.set(num, count);
    maxFrequency = Math.max(maxFrequency, count);
  }
  
  return Array.from(frequency.entries())
    .filter(([_, count]) => count === maxFrequency)
    .map(([num]) => num);
}

/**
 * 计算方差
 * 
 * @param nums - 数字数组
 * @returns 方差
 * 
 * @example
 * ```ts
 * variance([1, 2, 3, 4, 5]);
 * // 2
 * ```
 */
export function variance(nums: number[]): number {
  if (nums.length <= 1) return 0;
  const avg = mean(nums);
  return nums.reduce((sum, num) => sum + Math.pow(num - avg, 2), 0) / (nums.length - 1);
}

/**
 * 计算标准差
 * 
 * @param nums - 数字数组
 * @returns 标准差
 * 
 * @example
 * ```ts
 * stdDev([1, 2, 3, 4, 5]);
 * // ~1.414
 * ```
 */
export function stdDev(nums: number[]): number {
  return Math.sqrt(variance(nums));
}

/**
 * 计算总和
 * 
 * @param nums - 数字数组
 * @returns 总和
 * 
 * @example
 * ```ts
 * sum([1, 2, 3, 4, 5]);
 * // 15
 * ```
 */
export function sum(nums: number[]): number {
  return nums.reduce((total, num) => total + num, 0);
}

/**
 * 计算乘积
 * 
 * @param nums - 数字数组
 * @returns 乘积
 * 
 * @example
 * ```ts
 * product([1, 2, 3, 4, 5]);
 * // 120
 * ```
 */
export function product(nums: number[]): number {
  return nums.reduce((total, num) => total * num, 1);
}

/**
 * 线性插值
 * 
 * @param a - 起始值
 * @param b - 结束值
 * @param t - 插值因子 (0-1)
 * @returns 插值结果
 * 
 * @example
 * ```ts
 * lerp(0, 100, 0.5);
 * // 50
 * ```
 */
export function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

/**
 * 求逆插值
 * 
 * @param a - 起始值
 * @param b - 结束值
 * @param v - 插值结果
 * @returns 插值因子
 * 
 * @example
 * ```ts
 * inverseLerp(0, 100, 50);
 * // 0.5
 * ```
 */
export function inverseLerp(a: number, b: number, v: number): number {
  return (v - a) / (b - a);
}

/**
 * 数值范围映射
 * 
 * @param value - 原数值
 * @param fromMin - 原范围最小值
 * @param fromMax - 原范围最大值
 * @param toMin - 目标范围最小值
 * @param toMax - 目标范围最大值
 * @returns 映射后的数值
 * 
 * @example
 * ```ts
 * remap(5, 0, 10, 0, 100);
 * // 50
 * ```
 */
export function remap(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
  const t = inverseLerp(fromMin, fromMax, value);
  return lerp(toMin, toMax, t);
}

/**
 * 生成随机数
 * 
 * @param min - 最小值
 * @param max - 最大值
 * @returns 随机数
 * 
 * @example
 * ```ts
 * random(0, 100);
 * // 例如: 42
 * ```
 */
export function random(min: number = 0, max: number = 1): number {
  return Math.random() * (max - min) + min;
}

/**
 * 生成随机整数
 * 
 * @param min - 最小值
 * @param max - 最大值
 * @returns 随机整数
 * 
 * @example
 * ```ts
 * randomInt(0, 10);
 * // 例如: 5
 * ```
 */
export function randomInt(min: number = 0, max: number = 1): number {
  return Math.floor(random(min, max + 1));
}

/**
 * 阶乘
 * 
 * @param n - 整数
 * @returns 阶乘结果
 * 
 * @example
 * ```ts
 * factorial(5);
 * // 120
 * ```
 */
export function factorial(n: number): number {
  if (n < 0) throw new Error('阶乘不支持负数');
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * 组合数 C(n, k)
 * 
 * @param n - 总数
 * @param k - 选择数
 * @returns 组合数
 * 
 * @example
 * ```ts
 * combination(5, 2);
 * // 10
 * ```
 */
export function combination(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n - k) k = n - k;
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result *= (n - i + 1) / i;
  }
  return result;
}

/**
 * 排列数 P(n, k)
 * 
 * @param n - 总数
 * @param k - 选择数
 * @returns 排列数
 * 
 * @example
 * ```ts
 * permutation(5, 2);
 * // 20
 * ```
 */
export function permutation(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= n - i;
  }
  return result;
}

/**
 * 数值是否在范围内
 * 
 * @param num - 检查的数值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 是否在范围内
 * 
 * @example
 * ```ts
 * inRange(5, 0, 10);
 * // true
 * ```
 */
export function inRange(num: number, min: number, max: number): boolean {
  return num >= Math.min(min, max) && num <= Math.max(min, max);
}

/**
 * 最大公约数
 * 
 * @param a - 数字1
 * @param b - 数字2
 * @returns 最大公约数
 * 
 * @example
 * ```ts
 * gcd(12, 18);
 * // 6
 * ```
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

/**
 * 最小公倍数
 * 
 * @param a - 数字1
 * @param b - 数字2
 * @returns 最小公倍数
 * 
 * @example
 * ```ts
 * lcm(12, 18);
 * // 36
 * ```
 */
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return (Math.abs(a) / gcd(a, b)) * Math.abs(b);
}

console.log('🔢 增强数学工具已加载');
