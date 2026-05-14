/**
 * 📝 增强字符串工具函数
 * 
 * 提供高级字符串处理功能
 */

/**
 * 字符串模板格式化
 * 
 * @param template - 模板字符串
 * @param values - 替换值
 * @returns 格式化后的字符串
 * 
 * @example
 * ```ts
 * format('Hello {name}!', { name: 'World' });
 * // 'Hello World!'
 * ```
 */
export function format(template: string, values: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return String(values[key] ?? '');
  });
}

/**
 * 字符串截断
 * 
 * @param str - 原字符串
 * @param length - 截断长度
 * @param ellipsis - 省略符，默认 '...'
 * @returns 截断后的字符串
 * 
 * @example
 * ```ts
 * truncate('Hello World', 8);
 * // 'Hello...'
 * ```
 */
export function truncate(str: string, length: number, ellipsis: string = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - ellipsis.length) + ellipsis;
}

/**
 * 首字母大写
 * 
 * @param str - 原字符串
 * @returns 首字母大写的字符串
 * 
 * @example
 * ```ts
 * capitalize('hello world');
 * // 'Hello world'
 * ```
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 单词首字母大写
 * 
 * @param str - 原字符串
 * @returns 每个单词首字母大写的字符串
 * 
 * @example
 * ```ts
 * titleCase('hello world');
 * // 'Hello World'
 * ```
 */
export function titleCase(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * 驼峰命名转换
 * 
 * @param str - 原字符串
 * @returns 驼峰命名的字符串
 * 
 * @example
 * ```ts
 * camelCase('hello_world');
 * // 'helloWorld'
 * ```
 */
export function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

/**
 * 连字符命名转换
 * 
 * @param str - 原字符串
 * @returns 连字符命名的字符串
 * 
 * @example
 * ```ts
 * kebabCase('helloWorld');
 * // 'hello-world'
 * ```
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

/**
 * 下划线命名转换
 * 
 * @param str - 原字符串
 * @returns 下划线命名的字符串
 * 
 * @example
 * ```ts
 * snakeCase('helloWorld');
 * // 'hello_world'
 * ```
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

/**
 * 字符串反转
 * 
 * @param str - 原字符串
 * @returns 反转后的字符串
 * 
 * @example
 * ```ts
 * reverse('hello');
 * // 'olleh'
 * ```
 */
export function reverse(str: string): string {
  return str.split('').reverse().join('');
}

/**
 * 字符串是否回文
 * 
 * @param str - 原字符串
 * @returns 是否回文
 * 
 * @example
 * ```ts
 * isPalindrome('racecar');
 * // true
 * ```
 */
export function isPalindrome(str: string): boolean {
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === reverse(clean);
}

/**
 * 单词计数
 * 
 * @param str - 原字符串
 * @returns 单词数量
 * 
 * @example
 * ```ts
 * wordCount('Hello world, how are you?');
 * // 5
 * ```
 */
export function wordCount(str: string): number {
  return str.trim().split(/\s+/).length;
}

/**
 * 字符计数
 * 
 * @param str - 原字符串
 * @param char - 要计数的字符
 * @returns 字符出现次数
 * 
 * @example
 * ```ts
 * charCount('Hello world', 'l');
 * // 3
 * ```
 */
export function charCount(str: string, char: string): number {
  return str.split('').filter(c => c === char).length;
}

/**
 * 字符串是否包含所有子字符串
 * 
 * @param str - 原字符串
 * @param substrings - 子字符串数组
 * @returns 是否包含所有
 * 
 * @example
 * ```ts
 * includesAll('Hello world', ['Hello', 'world']);
 * // true
 * ```
 */
export function includesAll(str: string, substrings: string[]): boolean {
  return substrings.every(sub => str.includes(sub));
}

/**
 * 字符串是否包含任意子字符串
 * 
 * @param str - 原字符串
 * @param substrings - 子字符串数组
 * @returns 是否包含任意
 * 
 * @example
 * ```ts
 * includesAny('Hello world', ['hi', 'Hello']);
 * // true
 * ```
 */
export function includesAny(str: string, substrings: string[]): boolean {
  return substrings.some(sub => str.includes(sub));
}

/**
 * 字符串重复
 * 
 * @param str - 原字符串
 * @param count - 重复次数
 * @returns 重复后的字符串
 * 
 * @example
 * ```ts
 * repeat('Ha', 3);
 * // 'HaHaHa'
 * ```
 */
export function repeat(str: string, count: number): string {
  return str.repeat(count);
}

/**
 * 字符串填充
 * 
 * @param str - 原字符串
 * @param length - 目标长度
 * @param padChar - 填充字符，默认空格
 * @returns 填充后的字符串
 * 
 * @example
 * ```ts
 * pad('Hello', 10);
 * // '   Hello   '
 * ```
 */
export function pad(str: string, length: number, padChar: string = ' '): string {
  const padLength = length - str.length;
  if (padLength <= 0) return str;
  const leftPad = Math.floor(padLength / 2);
  const rightPad = Math.ceil(padLength / 2);
  return padChar.repeat(leftPad) + str + padChar.repeat(rightPad);
}

/**
 * 左填充
 * 
 * @param str - 原字符串
 * @param length - 目标长度
 * @param padChar - 填充字符
 * @returns 左填充后的字符串
 * 
 * @example
 * ```ts
 * padStart('Hello', 10, '0');
 * // '00000Hello'
 * ```
 */
export function padStart(str: string, length: number, padChar: string = ' '): string {
  return str.padStart(length, padChar);
}

/**
 * 右填充
 * 
 * @param str - 原字符串
 * @param length - 目标长度
 * @param padChar - 填充字符
 * @returns 右填充后的字符串
 * 
 * @example
 * ```ts
 * padEnd('Hello', 10, '0');
 * // 'Hello00000'
 * ```
 */
export function padEnd(str: string, length: number, padChar: string = ' '): string {
  return str.padEnd(length, padChar);
}

/**
 * 移除字符串两端空白
 * 
 * @param str - 原字符串
 * @returns 去除首尾空白的字符串
 * 
 * @example
 * ```ts
 * trim('  Hello world  ');
 * // 'Hello world'
 * ```
 */
export function trim(str: string): string {
  return str.trim();
}

/**
 * 移除字符串左侧空白
 * 
 * @param str - 原字符串
 * @returns 去除左侧空白的字符串
 * 
 * @example
 * ```ts
 * trimLeft('  Hello world  ');
 * // 'Hello world  '
 * ```
 */
export function trimLeft(str: string): string {
  return str.trimStart();
}

/**
 * 移除字符串右侧空白
 * 
 * @param str - 原字符串
 * @returns 去除右侧空白的字符串
 * 
 * @example
 * ```ts
 * trimRight('  Hello world  ');
 * // '  Hello world'
 * ```
 */
export function trimRight(str: string): string {
  return str.trimEnd();
}

/**
 * 字符串是否以指定内容开头
 * 
 * @param str - 原字符串
 * @param prefix - 前缀
 * @returns 是否以指定内容开头
 * 
 * @example
 * ```ts
 * startsWith('Hello world', 'Hello');
 * // true
 * ```
 */
export function startsWith(str: string, prefix: string): boolean {
  return str.startsWith(prefix);
}

/**
 * 字符串是否以指定内容结尾
 * 
 * @param str - 原字符串
 * @param suffix - 后缀
 * @returns 是否以指定内容结尾
 * 
 * @example
 * ```ts
 * endsWith('Hello world', 'world');
 * // true
 * ```
 */
export function endsWith(str: string, suffix: string): boolean {
  return str.endsWith(suffix);
}

console.log('📝 增强字符串工具已加载');
