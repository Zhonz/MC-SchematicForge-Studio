/**
 * 📊 增强数组工具函数
 * 
 * 提供高级数组操作功能
 */

/**
 * 数组分块
 * 
 * @param arr - 原数组
 * @param size - 每块大小
 * @returns 分块后的数组
 * 
 * @example
 * ```ts
 * chunk([1, 2, 3, 4, 5], 2);
 * // [[1, 2], [3, 4], [5]]
 * ```
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * 数组去重
 * 
 * @param arr - 原数组
 * @param key - 去重键，可选
 * @returns 去重后的数组
 * 
 * @example
 * ```ts
 * unique([1, 2, 2, 3, 3, 3]);
 * // [1, 2, 3]
 * 
 * unique([{id:1,name:'a'}, {id:1,name:'b'}], 'id');
 * // [{id:1,name:'a'}]
 * ```
 */
export function unique<T>(arr: T[], key?: keyof T): T[] {
  if (key) {
    const seen = new Map();
    return arr.filter(item => {
      const keyValue = item[key];
      if (seen.has(keyValue)) return false;
      seen.set(keyValue, true);
      return true;
    });
  }
  return [...new Set(arr)];
}

/**
 * 数组分组
 * 
 * @param arr - 原数组
 * @param key - 分组键或分组函数
 * @returns 分组对象
 * 
 * @example
 * ```ts
 * groupBy([
 *   {category:'fruit', name:'apple'},
 *   {category:'fruit', name:'banana'},
 *   {category:'vegetable', name:'carrot'}
 * ], 'category');
 * // {
 * //   fruit: [{category:'fruit', name:'apple'}, {category:'fruit', name:'banana'}],
 * //   vegetable: [{category:'vegetable', name:'carrot'}]
 * // }
 * ```
 */
export function groupBy<T, K extends string | number>(arr: T[], key: keyof T | ((item: T) => K)): Record<K, T[]> {
  return arr.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : (item[key] as unknown as K);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<K, T[]>);
}

/**
 * 数组扁平化
 * 
 * @param arr - 原数组
 * @param depth - 扁平化深度，默认 1
 * @returns 扁平化后的数组
 * 
 * @example
 * ```ts
 * flatten([1, [2, [3, 4]], 5]);
 * // [1, 2, [3, 4], 5]
 * 
 * flatten([1, [2, [3, 4]], 5], 2);
 * // [1, 2, 3, 4, 5]
 * ```
 */
export function flatten<T>(arr: any[], depth: number = 1): T[] {
  return arr.reduce((acc, val) => {
    if (Array.isArray(val) && depth > 0) {
      return [...acc, ...flatten(val, depth - 1)];
    }
    return [...acc, val];
  }, []);
}

/**
 * 数组交集
 * 
 * @param arr1 - 数组1
 * @param arr2 - 数组2
 * @returns 交集数组
 * 
 * @example
 * ```ts
 * intersection([1, 2, 3], [2, 3, 4]);
 * // [2, 3]
 * ```
 */
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set = new Set(arr2);
  return arr1.filter(item => set.has(item));
}

/**
 * 数组差集
 * 
 * @param arr1 - 数组1
 * @param arr2 - 数组2
 * @returns 差集数组
 * 
 * @example
 * ```ts
 * difference([1, 2, 3, 4], [2, 3]);
 * // [1, 4]
 * ```
 */
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  const set = new Set(arr2);
  return arr1.filter(item => !set.has(item));
}

/**
 * 数组随机打乱
 * 
 * @param arr - 原数组
 * @returns 打乱后的数组
 * 
 * @example
 * ```ts
 * shuffle([1, 2, 3, 4, 5]);
 * // [3, 1, 5, 2, 4] (随机顺序)
 * ```
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 获取数组最后N个元素
 * 
 * @param arr - 原数组
 * @param n - 元素数量
 * @returns 最后N个元素
 * 
 * @example
 * ```ts
 * takeRight([1, 2, 3, 4, 5], 3);
 * // [3, 4, 5]
 * ```
 */
export function takeRight<T>(arr: T[], n: number = 1): T[] {
  return arr.slice(Math.max(0, arr.length - n));
}

/**
 * 移除数组中的假值
 * 
 * @param arr - 原数组
 * @returns 过滤后的数组
 * 
 * @example
 * ```ts
 * compact([0, 1, false, 2, '', 3, null]);
 * // [1, 2, 3]
 * ```
 */
export function compact<T>(arr: (T | null | undefined | false | 0 | '')[]): T[] {
  return arr.filter(Boolean) as T[];
}

/**
 * 数组求和
 * 
 * @param arr - 数字数组
 * @returns 和
 * 
 * @example
 * ```ts
 * sum([1, 2, 3, 4, 5]);
 * // 15
 * ```
 */
export function sum(arr: number[]): number {
  return arr.reduce((acc, num) => acc + num, 0);
}

/**
 * 数组平均值
 * 
 * @param arr - 数字数组
 * @returns 平均值
 * 
 * @example
 * ```ts
 * average([1, 2, 3, 4, 5]);
 * // 3
 * ```
 */
export function average(arr: number[]): number {
  return arr.length === 0 ? 0 : sum(arr) / arr.length;
}

/**
 * 数组最大值
 * 
 * @param arr - 数字数组
 * @returns 最大值
 * 
 * @example
 * ```ts
 * max([1, 5, 3, 9, 2]);
 * // 9
 * ```
 */
export function max(arr: number[]): number {
  return Math.max(...arr);
}

/**
 * 数组最小值
 * 
 * @param arr - 数字数组
 * @returns 最小值
 * 
 * @example
 * ```ts
 * min([1, 5, 3, 9, 2]);
 * // 1
 * ```
 */
export function min(arr: number[]): number {
  return Math.min(...arr);
}

/**
 * 数组范围
 * 
 * @param start - 起始值
 * @param end - 结束值
 * @param step - 步长，默认1
 * @returns 范围数组
 * 
 * @example
 * ```ts
 * range(0, 5);
 * // [0, 1, 2, 3, 4]
 * 
 * range(1, 10, 2);
 * // [1, 3, 5, 7, 9]
 * ```
 */
export function range(start: number, end?: number, step: number = 1): number[] {
  const actualStart = end === undefined ? 0 : start;
  const actualEnd = end === undefined ? start : end;
  
  const result: number[] = [];
  if (step > 0) {
    for (let i = actualStart; i < actualEnd; i += step) {
      result.push(i);
    }
  } else if (step < 0) {
    for (let i = actualStart; i > actualEnd; i += step) {
      result.push(i);
    }
  }
  return result;
}

/**
 * 数组随机抽样
 * 
 * @param arr - 原数组
 * @param count - 抽样数量，默认1
 * @returns 抽样结果
 * 
 * @example
 * ```ts
 * sample([1, 2, 3, 4, 5]);
 * // [3] (随机一个元素)
 * 
 * sample([1, 2, 3, 4, 5], 3);
 * // [1, 4, 2] (随机3个元素)
 * ```
 */
export function sample<T>(arr: T[], count: number = 1): T[] {
  if (count <= 1) {
    return [arr[Math.floor(Math.random() * arr.length)]];
  }
  const shuffled = shuffle(arr);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

console.log('📊 增强数组工具已加载');
