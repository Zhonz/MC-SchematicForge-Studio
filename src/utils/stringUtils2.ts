export class StringUtils2 {
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }

  static camelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }

  static snakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .replace(/[\s\-]+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }

  static kebabCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '-$1')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  static pascalCase(str: string): string {
    return this.camelCase(str).replace(/^[a-z]/, char => char.toUpperCase());
  }

  static titleCase(str: string): string {
    return str.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  static truncate(str: string, length: number, suffix: string = '...'): string {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
  }

  static truncateMiddle(str: string, length: number, separator: string = '...'): string {
    if (str.length <= length) return str;
    const charsToShow = length - separator.length;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);
    return str.slice(0, frontChars) + separator + str.slice(str.length - backChars);
  }

  static padStart(str: string, length: number, char: string = ' '): string {
    return str.padStart(length, char);
  }

  static padEnd(str: string, length: number, char: string = ' '): string {
    return str.padEnd(length, char);
  }

  static repeat(str: string, times: number): string {
    return str.repeat(times);
  }

  static reverse(str: string): string {
    return str.split('').reverse().join('');
  }

  static trim(str: string): string {
    return str.trim();
  }

  static trimStart(str: string): string {
    return str.trimStart();
  }

  static trimEnd(str: string): string {
    return str.trimEnd();
  }

  static contains(str: string, search: string, caseSensitive: boolean = true): boolean {
    return caseSensitive 
      ? str.includes(search) 
      : str.toLowerCase().includes(search.toLowerCase());
  }

  static startsWith(str: string, search: string, caseSensitive: boolean = true): boolean {
    return caseSensitive 
      ? str.startsWith(search) 
      : str.toLowerCase().startsWith(search.toLowerCase());
  }

  static endsWith(str: string, search: string, caseSensitive: boolean = true): boolean {
    return caseSensitive 
      ? str.endsWith(search) 
      : str.toLowerCase().endsWith(search.toLowerCase());
  }

  static escapeHtml(str: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
  }

  static unescapeHtml(str: string): string {
    const htmlUnescapes: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'"
    };
    return str.replace(/&(amp|lt|gt|quot|#39);/g, (_, entity) => htmlUnescapes[`&${entity};`]);
  }

  static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static escapeCss(str: string): string {
    return str.replace(/[^a-z0-9\-_]/gi, '-').toLowerCase();
  }

  static stripTags(str: string): string {
    return str.replace(/<[^>]*>/g, '');
  }

  static stripScripts(str: string): string {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  static stripStyles(str: string): string {
    return str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  }

  static wordCount(str: string): number {
    return str.trim().split(/\s+/).filter(Boolean).length;
  }

  static charCount(str: string, includeSpaces: boolean = true): number {
    return includeSpaces ? str.length : str.replace(/\s/g, '').length;
  }

  static lineCount(str: string): number {
    return str.split(/\r\n|\r|\n/).length;
  }

  static toChunks(str: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += chunkSize) {
      chunks.push(str.slice(i, i + chunkSize));
    }
    return chunks;
  }

  static fromChunks(chunks: string[]): string {
    return chunks.join('');
  }

  static random(length: number, charset: string = 'a-zA-Z0-9'): string {
    const chars: string[] = [];
    if (charset.includes('a-z')) chars.push(...'abcdefghijklmnopqrstuvwxyz');
    if (charset.includes('A-Z')) chars.push(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (charset.includes('0-9')) chars.push(...'0123456789');
    if (charset.includes('!')) chars.push(...'!@#$%^&*');
    
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  static hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  static levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  static similarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const longerLength = longer.length;
    
    if (longerLength === 0) return 1.0;
    
    return (longerLength - this.levenshteinDistance(longer, shorter)) / longerLength;
  }

  static isPalindrome(str: string): boolean {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === this.reverse(cleaned);
  }

  static isAnagram(str1: string, str2: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '').split('').sort().join('');
    return normalize(str1) === normalize(str2);
  }

  static countOccurrences(str: string, search: string, caseSensitive: boolean = true): number {
    if (!search) return 0;
    const target = caseSensitive ? str : str.toLowerCase();
    const pattern = caseSensitive ? search : search.toLowerCase();
    return (target.match(new RegExp(this.escapeRegex(pattern), 'g')) || []).length;
  }

  static insert(str: string, index: number, insert: string): string {
    return str.slice(0, index) + insert + str.slice(index);
  }

  static removeAt(str: string, index: number, length: number = 1): string {
    return str.slice(0, index) + str.slice(index + length);
  }

  static replaceAt(str: string, index: number, length: number, replacement: string): string {
    return str.slice(0, index) + replacement + str.slice(index + length);
  }

  static template(str: string, data: Record<string, string | number>): string {
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? `{{${key}}}`));
  }

  static highlight(str: string, search: string, className: string = 'highlight'): string {
    if (!search) return str;
    const regex = new RegExp(`(${this.escapeRegex(search)})`, 'gi');
    return str.replace(regex, `<span class="${className}">$1</span>`);
  }

  static extractEmails(str: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return str.match(emailRegex) || [];
  }

  static extractUrls(str: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return str.match(urlRegex) || [];
  }

  static extractNumbers(str: string): number[] {
    return str.match(/-?\d+\.?\d*/g)?.map(Number) || [];
  }

  static toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
  }

  static toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .replace(/[\s\-]+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }

  static toKebabCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '-$1')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }
}

export class UUIDGenerator {
  static generate(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static generatev4(): string {
    return this.generate();
  }

  static isValid(uuid: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  }

  static extractVersion(uuid: string): number | null {
    const match = uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])/i);
    return match ? parseInt(match[1], 16) : null;
  }
}

export class SlugGenerator {
  static generate(str: string, options: {
    lowercase?: boolean;
    separator?: string;
    maxLength?: number;
  } = {}): string {
    const {
      lowercase = true,
      separator = '-',
      maxLength = 100
    } = options;

    let slug = str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, separator)
      .replace(new RegExp(`\\${separator}+`, 'g'), separator);

    if (lowercase) {
      slug = slug.toLowerCase();
    }

    if (maxLength) {
      slug = slug.slice(0, maxLength);
      if (slug.endsWith(separator)) {
        slug = slug.slice(0, -1);
      }
    }

    return slug;
  }

  static fromUrl(url: string): string {
    return this.generate(url);
  }

  static fromEmail(email: string): string {
    return this.generate(email.split('@')[0] || email);
  }
}

export class HashGenerator {
  static md5(str: string): string {
    const rotateLeft = (lValue: number, iShiftAmount: number) => 
      (lValue << iShiftAmount) | (lValue >>> (32 - iShiftAmount));
    
    const addUnsigned = (lX: number, lY: number) => {
      const lX8 = lX & 0x80000000;
      const lY8 = lY & 0x80000000;
      const lX4 = lX & 0x40000000;
      const lY4 = lY & 0x40000000;
      const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
      if (lX4 | lY4) {
        if (lResult & 0x40000000) return lResult ^ 0xC0000000 ^ lX8 ^ lY8;
        return lResult ^ 0x40000000 ^ lX8 ^ lY8;
      }
      return lResult ^ lX8 ^ lY8;
    };

    const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
    const G = (x: number, y: number, z: number) => (x & z) | (y & ~z);
    const H = (x: number, y: number, z: number) => x ^ y ^ z;
    const I = (x: number, y: number, z: number) => y ^ (x | ~z);

    const FF = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => 
      addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, F(b, c, d)), addUnsigned(x, ac)), s), b);
    
    const GG = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => 
      addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, G(b, c, d)), addUnsigned(x, ac)), s), b);
    
    const HH = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => 
      addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, H(b, c, d)), addUnsigned(x, ac)), s), b);
    
    const II = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => 
      addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, I(b, c, d)), addUnsigned(x, ac)), s), b);

    const convertToWordArray = (str: string) => {
      let lWordCount;
      const lMessageLength = str.length;
      const lNumberOfWordsTemp1 = lMessageLength + 8;
      const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
      const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
      const lWordArray = Array(lNumberOfWords).fill(0);
      let lBytePosition = 0;
      const lByteCount = 0;
      lWordCount = (lMessageLength - (lMessageLength % 4)) / 4;
      for (let i = 0; i < lWordCount; i++) {
        lBytePosition = i * 4;
        lWordArray[i] = str.charCodeAt(i * 4) | (str.charCodeAt(i * 4 + 1) << 8) | 
                        (str.charCodeAt(i * 4 + 2) << 16) | (str.charCodeAt(i * 4 + 3) << 24);
      }
      lBytePosition = lWordCount * 4;
      lWordArray[lWordCount] = 0x80 << ((lBytePosition - lMessageLength % 4) * 8);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
    };

    const wordToHex = (lValue: number) => {
      let wordToHexValue = '', wordToHexValueTemp = '', lByte, lCount;
      for (lCount = 0; lCount <= 3; lCount++) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        wordToHexValueTemp = '0' + lByte.toString(16);
        wordToHexValue = wordToHexValue + wordToHexValueTemp.slice(-2);
      }
      return wordToHexValue;
    };

    const x = convertToWordArray(str);
    let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
    const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

    for (let k = 0; k < x.length; k += 16) {
      const AA = a, BB = b, CC = c, DD = d;
      a = FF(a, b, c, d, x[k], S11, 0xD76AA478); d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB); b = FF(b, c, d, a, x[k + 3], S14, 0xCFBDEB1A);
      a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF); d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613); b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8); d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1); b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122); d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E); b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
      a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562); d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51); b = GG(b, c, d, a, x[k], S24, 0xE9B6C7AA);
      a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D); d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
      c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681); b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6); d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
      c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87); b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
      a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905); d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
      c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9); b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
      a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942); d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122); b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44); d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60); b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6); d = HH(d, a, b, c, x[k], S32, 0xEAA127FA);
      c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085); b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
      a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039); d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8); b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
      a = II(a, b, c, d, x[k], S41, 0xF4292244); d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7); b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3); d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D); b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F); d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = II(c, d, a, b, x[k + 6], S43, 0xA3014314); b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82); d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB); b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
      a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
    }

    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
  }
}

export default StringUtils2;
