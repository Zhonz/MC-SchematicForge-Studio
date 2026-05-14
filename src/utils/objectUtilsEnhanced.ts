/**
 * 📦 增强对象工具函数
 * 
 * 提供高级对象操作功能
 */

/**
 * 深拷贝对象
 * 
 * @param obj - 原对象
 * @returns 深拷贝后的对象
 * 
 * @example
 * ```ts
 * const a = { x: 1, y: { z: 2 } };
 * const b = deepClone(a);
 * b.y.z = 3;
 * console.log(a.y.z); // 2
 * ```
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (obj instanceof Set) return new Set([...obj].map(item => deepClone(item))) as unknown as T;
  if (obj instanceof Map) return new Map([...obj].map(([k, v]) => [k, deepClone(v)])) as unknown as T;
  
  const copy = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      (copy as any)[key] = deepClone(obj[key]);
    }
  }
  return copy;
}

/**
 * 深比较两个对象是否相等
 * 
 * @param obj1 - 对象1
 * @param obj2 - 对象2
 * @returns 是否相等
 * 
 * @example
 * ```ts
 * deepEqual({ x: 1, y: { z: 2 } }, { x: 1, y: { z: 2 } });
 * // true
 * ```
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) return false;
  
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }
  
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

/**
 * 合并对象（深合并）
 * 
 * @param target - 目标对象
 * @param sources - 源对象
 * @returns 合并后的对象
 * 
 * @example
 * ```ts
 * deepMerge({ a: { b: 1 } }, { a: { c: 2 } });
 * // { a: { b: 1, c: 2 } }
 * ```
 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  const result = deepClone(target);
  
  for (const source of sources) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const targetValue = result[key];
        const sourceValue = source[key];
        
        if (targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue) &&
            sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
          (result as any)[key] = deepMerge(targetValue, sourceValue);
        } else {
          (result as any)[key] = deepClone(sourceValue);
        }
      }
    }
  }
  
  return result;
}

/**
 * 获取对象深层属性值
 * 
 * @param obj - 原对象
 * @param path - 属性路径
 * @param defaultValue - 默认值
 * @returns 属性值
 * 
 * @example
 * ```ts
 * get({ a: { b: { c: 1 } } }, 'a.b.c');
 * // 1
 * ```
 */
export function get(obj: any, path: string, defaultValue?: any): any {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

/**
 * 设置对象深层属性值
 * 
 * @param obj - 目标对象
 * @param path - 属性路径
 * @param value - 属性值
 * @returns 修改后的对象
 * 
 * @example
 * ```ts
 * set({}, 'a.b.c', 1);
 * // { a: { b: { c: 1 } } }
 * ```
 */
export function set(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return obj;
}

/**
 * 删除对象深层属性
 * 
 * @param obj - 目标对象
 * @param path - 属性路径
 * @returns 是否删除成功
 * 
 * @example
 * ```ts
 * unset({ a: { b: 1 } }, 'a.b');
 * // true
 * ```
 */
export function unset(obj: any, path: string): boolean {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
    if (current === undefined || current === null) return false;
  }
  
  const lastKey = keys[keys.length - 1];
  if (Object.prototype.hasOwnProperty.call(current, lastKey)) {
    delete current[lastKey];
    return true;
  }
  
  return false;
}

/**
 * 检查对象是否包含路径
 * 
 * @param obj - 目标对象
 * @param path - 属性路径
 * @returns 是否包含路径
 * 
 * @example
 * ```ts
 * has({ a: { b: 1 } }, 'a.b');
 * // true
 * ```
 */
export function has(obj: any, path: string): boolean {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return false;
    }
    current = current[key];
  }
  
  return current !== undefined;
}

/**
 * 对象拣选（获取指定属性）
 * 
 * @param obj - 原对象
 * @param keys - 属性键数组
 * @returns 拣选后的对象
 * 
 * @example
 * ```ts
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']);
 * // { a: 1, c: 3 }
 * ```
 */
export function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * 对象剔除（删除指定属性）
 * 
 * @param obj - 原对象
 * @param keys - 要删除的属性键数组
 * @returns 剔除后的对象
 * 
 * @example
 * ```ts
 * omit({ a: 1, b: 2, c: 3 }, ['a', 'c']);
 * // { b: 2 }
 * ```
 */
export function omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * 对象过滤
 * 
 * @param obj - 原对象
 * @param predicate - 过滤函数
 * @returns 过滤后的对象
 * 
 * @example
 * ```ts
 * filter({ a: 1, b: 2, c: 3 }, (value, key) => value > 1);
 * // { b: 2, c: 3 }
 * ```
 */
export function filter<T extends Record<string, any>>(obj: T, predicate: (value: T[keyof T], key: keyof T, obj: T) => boolean): Partial<T> {
  const result = {} as Partial<T>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && predicate(obj[key], key as keyof T, obj)) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * 对象映射
 * 
 * @param obj - 原对象
 * @param mapper - 映射函数
 * @returns 映射后的对象
 * 
 * @example
 * ```ts
 * mapValues({ a: 1, b: 2, c: 3 }, value => value * 2);
 * // { a: 2, b: 4, c: 6 }
 * ```
 */
export function mapValues<T extends Record<string, any>, U>(obj: T, mapper: (value: T[keyof T], key: keyof T, obj: T) => U): Record<keyof T, U> {
  const result = {} as Record<keyof T, U>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key as keyof T] = mapper(obj[key], key as keyof T, obj);
    }
  }
  return result;
}

/**
 * 对象属性名映射
 * 
 * @param obj - 原对象
 * @param keyMap - 属性名映射对象
 * @returns 映射后的对象
 * 
 * @example
 * ```ts
 * mapKeys({ a: 1, b: 2 }, { a: 'x', b: 'y' });
 * // { x: 1, y: 2 }
 * ```
 */
export function mapKeys<T extends Record<string, any>>(obj: T, keyMap: Record<string, string>): Record<string, T[keyof T]> {
  const result = {} as Record<string, T[keyof T]>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = keyMap[key] || key;
      result[newKey] = obj[key];
    }
  }
  return result;
}

/**
 * 对象逆映射（键值互换）
 * 
 * @param obj - 原对象
 * @returns 逆映射后的对象
 * 
 * @example
 * ```ts
 * invert({ a: 'x', b: 'y' });
 * // { x: 'a', y: 'b' }
 * ```
 */
export function invert<T extends Record<string, string | number>>(obj: T): Record<string, keyof T> {
  const result = {} as Record<string, keyof T>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = String(obj[key]);
      result[value] = key;
    }
  }
  return result;
}

/**
 * 对象是否为空
 * 
 * @param obj - 检查的对象
 * @returns 是否为空
 * 
 * @example
 * ```ts
 * isEmpty({});
 * // true
 * ```
 */
export function isEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  return Object.keys(obj).length === 0;
}

/**
 * 获取对象所有键
 * 
 * @param obj - 原对象
 * @returns 键数组
 * 
 * @example
 * ```ts
 * keys({ a: 1, b: 2, c: 3 });
 * // ['a', 'b', 'c']
 * ```
 */
export function keys<T extends Record<string, any>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * 获取对象所有值
 * 
 * @param obj - 原对象
 * @returns 值数组
 * 
 * @example
 * ```ts
 * values({ a: 1, b: 2, c: 3 });
 * // [1, 2, 3]
 * ```
 */
export function values<T extends Record<string, any>>(obj: T): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}

/**
 * 获取对象所有键值对
 * 
 * @param obj - 原对象
 * @returns 键值对数组
 * 
 * @example
 * ```ts
 * entries({ a: 1, b: 2 });
 * // [['a', 1], ['b', 2]]
 * ```
 */
export function entries<T extends Record<string, any>>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

console.log('📦 增强对象工具已加载');
