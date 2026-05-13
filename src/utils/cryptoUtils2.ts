const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export class IdGenerator {
  private static counter = 0;
  private static lastTimestamp = 0;

  static uuid(): string {
    const pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return pattern.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static shortId(length: number = 8): string {
    let id = '';
    for (let i = 0; i < length; i++) {
      id += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return id;
  }

  static numericId(length: number = 10): string {
    let id = '';
    for (let i = 0; i < length; i++) {
      id += Math.floor(Math.random() * 10);
    }
    return id;
  }

  static timestampId(): string {
    const now = Date.now();
    if (now === this.lastTimestamp) {
      this.counter++;
    } else {
      this.counter = 0;
      this.lastTimestamp = now;
    }
    return `${now}-${this.counter.toString(36)}`;
  }

  static snowflakeId(): string {
    const timestamp = Date.now() - 1609459200000;
    const workerId = 1;
    const processId = 1;
    const sequence = Math.floor(Math.random() * 4096);
    
    const id = (BigInt(timestamp) << 22n) |
               (BigInt(workerId) << 12n) |
               (BigInt(processId) << 17n) |
               BigInt(sequence);
    
    return id.toString();
  }

  static ULID(): string {
    const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const ENCODING_LEN = ENCODING.length;
    const TIME_LEN = 10;
    const RANDOM_LEN = 16;

    let str = '';
    let time = Date.now();

    for (let i = TIME_LEN; i > 0; i--) {
      str = ENCODING[time % ENCODING_LEN] + str;
      time = Math.floor(time / ENCODING_LEN);
    }

    for (let i = 0; i < RANDOM_LEN; i++) {
      str += ENCODING[Math.floor(Math.random() * ENCODING_LEN)];
    }

    return str;
  }

  static nanoid(size: number = 21): string {
    const bytes = crypto.getRandomValues(new Uint8Array(size));
    const alphabet = ALPHANUMERIC;
    let id = '';
    const mask = (2 << (Math.log(alphabet.length - 1) / Math.LN2)) - 1;
    let step = Math.ceil(1.6 * mask * size / alphabet.length);
    
    while (id.length < size) {
      const bytes_slice = crypto.getRandomValues(new Uint8Array(step));
      for (let i = 0; i < step && id.length < size; i++) {
        const index = bytes_slice[i] & mask;
        if (index < alphabet.length) {
          id += alphabet[index];
        }
      }
    }
    
    return id;
  }
}

export class HashUtils {
  static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  static djb2Hash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash);
  }

  static sdbmHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
    }
    return Math.abs(hash);
  }

  static fnvHash(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash *= 16777619;
    }
    return Math.abs(hash);
  }

  static adler32(str: string): number {
    let a = 1, b = 0;
    for (let i = 0; i < str.length; i++) {
      a = (a + str.charCodeAt(i)) % 65521;
      b = (b + a) % 65521;
    }
    return (b << 16) | a;
  }

  static crc32(str: string): number {
    let crc = 0xffffffff;
    const table = this.getCrc32Table();
    
    for (let i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xff];
    }
    
    return (crc ^ 0xffffffff) >>> 0;
  }

  private static getCrc32Table(): number[] {
    const table: number[] = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    return table;
  }
}

export class EncodingUtils {
  static base64Encode(str: string): string {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    ));
  }

  static base64Decode(str: string): string {
    return decodeURIComponent(
      atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  }

  static base64UrlEncode(str: string): string {
    return this.base64Encode(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  static base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return this.base64Decode(base64);
  }

  static hexEncode(str: string): string {
    return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  }

  static hexDecode(hex: string): string {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return String.fromCharCode(...bytes);
  }

  static binaryEncode(str: string): string {
    return Array.from(str).map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  }

  static binaryDecode(binary: string): string {
    const bytes: number[] = [];
    for (let i = 0; i < binary.length; i += 8) {
      bytes.push(parseInt(binary.substr(i, 8), 2));
    }
    return String.fromCharCode(...bytes);
  }

  static htmlEncode(str: string): string {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    return str.replace(/[&<>"'`=/]/g, c => entities[c]);
  }

  static htmlDecode(str: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x2F;': '/',
      '&#x60;': '`',
      '&#x3D;': '='
    };
    return str.replace(/&(?:amp|lt|gt|quot|#39|#x2F|#x60|#x3D);/g, m => entities[m] || m);
  }

  static urlEncode(str: string): string {
    return encodeURIComponent(str);
  }

  static urlDecode(str: string): string {
    return decodeURIComponent(str);
  }
}

export class CryptoUtils {
  static async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async sha512(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async md5(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const md5chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < hashArray.length; i++) {
      result += md5chars[(hashArray[i] >> 4) & 0xf] + md5chars[hashArray[i] & 0xf];
    }
    return result.substring(0, 32);
  }

  static async hmac(key: string, message: string, algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'): Promise<string> {
    const keyData = new TextEncoder().encode(key);
    const messageData = new TextEncoder().encode(message);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async encrypt(plaintext: string, password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(plaintext)
    );
    
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    return this.base64Encode(String.fromCharCode(...combined));
  }

  static async decrypt(ciphertext: string, password: string): Promise<string> {
    const combined = Uint8Array.from(this.base64Decode(ciphertext), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  }

  private static base64Encode(str: string): string {
    return btoa(str);
  }

  private static base64Decode(str: string): string {
    return atob(str);
  }
}

export class RandomUtils {
  static boolean(probability: number = 0.5): boolean {
    return Math.random() < probability;
  }

  static integer(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static float(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  static character(charset: string = ALPHABET): string {
    return charset[Math.floor(Math.random() * charset.length)];
  }

  static string(length: number, charset: string = ALPHANUMERIC): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += this.character(charset);
    }
    return result;
  }

  static pick<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  static picks<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  static gaussian(mean: number = 0, stdDev: number = 1): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + stdDev * normal;
  }

  static weighted<T>(options: { item: T; weight: number }[]): T {
    const total = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * total;
    
    for (const option of options) {
      random -= option.weight;
      if (random <= 0) return option.item;
    }
    
    return options[options.length - 1].item;
  }

  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static hex(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 16).toString(16);
    }
    return result;
  }

  static color(): string {
    return '#' + this.hex(6);
  }

  static date(start: Date = new Date(1970, 0, 1), end: Date = new Date()): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }
}
