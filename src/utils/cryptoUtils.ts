export interface HashResult {
  value: string;
  length: number;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

export class CryptoUtils {
  private static instance: CryptoUtils;

  static getInstance(): CryptoUtils {
    if (!CryptoUtils.instance) {
      CryptoUtils.instance = new CryptoUtils();
    }
    return CryptoUtils.instance;
  }

  static async hashSHA256(data: string): Promise<HashResult> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    
    return {
      value: hashHex,
      length: hashHex.length,
    };
  }

  static async hashSHA512(data: string): Promise<HashResult> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    
    return {
      value: hashHex,
      length: hashHex.length,
    };
  }

  static async hashMD5(data: string): Promise<HashResult> {
    const md4 = CryptoUtils.md4(new TextEncoder().encode(data));
    const hashHex = Array.from(md4).map((b) => b.toString(16).padStart(2, '0')).join('');
    
    return {
      value: hashHex,
      length: hashHex.length,
    };
  }

  private static md4(data: Uint8Array): Uint8Array {
    const x = Array.from(data);
    const len = x.length;
    
    const rotate = (n: number, s: number): number => {
      return ((n << s) | (n >>> (32 - s))) >>> 0;
    };
    
    const F = (x_val: number, y_val: number, z_val: number): number => {
      return (x_val & y_val) | (~x_val & z_val);
    };
    
    const G = (x_val: number, y_val: number, z_val: number): number => {
      return (x_val & y_val) | (x_val & z_val) | (y_val & z_val);
    };
    
    const H = (x_val: number, y_val: number, z_val: number): number => {
      return x_val ^ y_val ^ z_val;
    };
    
    const FF = (a: number, b: number, c: number, d: number, x_val: number, s: number): number => {
      a = (a + F(b, c, d) + x_val) >>> 0;
      return rotate(a, s);
    };
    
    const GG = (a: number, b: number, c: number, d: number, x_val: number, s: number): number => {
      a = (a + G(b, c, d) + x_val + 0x5a827999) >>> 0;
      return rotate(a, s);
    };
    
    const HH = (a: number, b: number, c: number, d: number, x_val: number, s: number): number => {
      a = (a + H(b, c, d) + x_val + 0x6ed9eba1) >>> 0;
      return rotate(a, s);
    };
    
    let a = 0x67452301;
    let b = 0xefcdab89;
    let c = 0x98badcfe;
    let d = 0x10325476;
    
    const size = Math.ceil((len + 9) / 64) * 64;
    const padded: number[] = new Array(size).fill(0);
    for (let i = 0; i < len; i++) {
      padded[i] = x[i];
    }
    padded[len] = 0x80;
    const lenBytes = (len << 3);
    padded[size - 4] = lenBytes & 0xff;
    padded[size - 3] = (lenBytes >> 8) & 0xff;
    padded[size - 2] = (lenBytes >> 16) & 0xff;
    padded[size - 1] = (lenBytes >> 24) & 0xff;
    
    const readUInt32LE = (arr: number[], offset: number): number => {
      return (arr[offset] | (arr[offset + 1] << 8) | (arr[offset + 2] << 16) | (arr[offset + 3] << 24)) >>> 0;
    };
    
    const writeUInt32LE = (arr: Uint8Array, offset: number, value: number): void => {
      arr[offset] = value & 0xff;
      arr[offset + 1] = (value >> 8) & 0xff;
      arr[offset + 2] = (value >> 16) & 0xff;
      arr[offset + 3] = (value >> 24) & 0xff;
    };
    
    for (let i = 0; i < size; i += 64) {
      const X: number[] = [];
      for (let j = 0; j < 16; j++) {
        X.push(readUInt32LE(padded, i + j * 4));
      }
      
      let aa = a, bb = b, cc = c, dd = d;
      
      a = FF(a, b, c, d, X[0], 3);
      d = FF(d, a, b, c, X[1], 7);
      c = FF(c, d, a, b, X[2], 19);
      b = FF(b, c, d, a, X[3], 3);
      a = FF(a, b, c, d, X[4], 7);
      d = FF(d, a, b, c, X[5], 19);
      c = FF(c, d, a, b, X[6], 3);
      b = FF(b, c, d, a, X[7], 7);
      a = FF(a, b, c, d, X[8], 19);
      d = FF(d, a, b, c, X[9], 3);
      c = FF(c, d, a, b, X[10], 7);
      b = FF(b, c, d, a, X[11], 19);
      a = FF(a, b, c, d, X[12], 3);
      d = FF(d, a, b, c, X[13], 7);
      c = FF(c, d, a, b, X[14], 19);
      b = FF(b, c, d, a, X[15], 3);
      
      a = GG(a, b, c, d, X[0], 3);
      d = GG(d, a, b, c, X[4], 5);
      c = GG(c, d, a, b, X[8], 9);
      b = GG(b, c, d, a, X[12], 13);
      a = GG(a, b, c, d, X[1], 3);
      d = GG(d, a, b, c, X[5], 5);
      c = GG(c, d, a, b, X[9], 9);
      b = GG(b, c, d, a, X[13], 13);
      a = GG(a, b, c, d, X[2], 3);
      d = GG(d, a, b, c, X[6], 5);
      c = GG(c, d, a, b, X[10], 9);
      b = GG(b, c, d, a, X[14], 13);
      a = GG(a, b, c, d, X[3], 3);
      d = GG(d, a, b, c, X[7], 5);
      c = GG(c, d, a, b, X[11], 9);
      b = GG(b, c, d, a, X[15], 13);
      
      a = HH(a, b, c, d, X[0], 3);
      d = HH(d, a, b, c, X[8], 9);
      c = HH(c, d, a, b, X[4], 11);
      b = HH(b, c, d, a, X[12], 15);
      a = HH(a, b, c, d, X[2], 3);
      d = HH(d, a, b, c, X[10], 9);
      c = HH(c, d, a, b, X[6], 11);
      b = HH(b, c, d, a, X[14], 15);
      a = HH(a, b, c, d, X[1], 3);
      d = HH(d, a, b, c, X[9], 9);
      c = HH(c, d, a, b, X[5], 11);
      b = HH(b, c, d, a, X[13], 15);
      a = HH(a, b, c, d, X[3], 3);
      d = HH(d, a, b, c, X[11], 9);
      c = HH(c, d, a, b, X[7], 11);
      b = HH(b, c, d, a, X[15], 15);
      
      a = (a + aa) >>> 0;
      b = (b + bb) >>> 0;
      c = (c + cc) >>> 0;
      d = (d + dd) >>> 0;
    }
    
    const result = new Uint8Array(16);
    writeUInt32LE(result, 0, a);
    writeUInt32LE(result, 4, b);
    writeUInt32LE(result, 8, c);
    writeUInt32LE(result, 12, d);
    
    return result;
  }

  static generateRandomString(length: number, charset?: string): string {
    const defaultCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const chars = charset || defaultCharset;
    let result = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    
    return result;
  }

  static generateUUID(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    
    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;
    
    const hex = Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  static generateSalt(length = 16): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  static generateIV(length = 12): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  static async encryptAES(
    data: string,
    key: string,
    options?: { iv?: string; salt?: string }
  ): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const salt = options?.salt ? new TextEncoder().encode(options.salt) : crypto.getRandomValues(new Uint8Array(16));
    const iv = options?.iv ? new TextEncoder().encode(options.iv) : crypto.getRandomValues(new Uint8Array(12));
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      derivedBits,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );
    
    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv)),
      salt: btoa(String.fromCharCode(...salt)),
    };
  }

  static async decryptAES(
    encryptedData: EncryptedData,
    key: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const ciphertext = Uint8Array.from(atob(encryptedData.ciphertext), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), (c) => c.charCodeAt(0));
    const salt = Uint8Array.from(atob(encryptedData.salt), (c) => c.charCodeAt(0));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      derivedBits,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );
    
    return decoder.decode(decrypted);
  }

  static base64Encode(data: string): string {
    return btoa(encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ));
  }

  static base64Decode(encoded: string): string {
    return decodeURIComponent(
      Array.from(atob(encoded), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
  }

  static hexEncode(data: string): string {
    return Array.from(new TextEncoder().encode(data))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static hexDecode(hex: string): string {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return new TextDecoder().decode(bytes);
  }

  static async deriveKey(
    password: string,
    salt: string,
    iterations = 100000
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async generateKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptRSA(
    data: string,
    publicKey: CryptoKey
  ): Promise<string> {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      encoded
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  static async decryptRSA(
    encryptedData: string,
    privateKey: CryptoKey
  ): Promise<string> {
    const decoder = new TextDecoder();
    const encrypted = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encrypted
    );
    
    return decoder.decode(decrypted);
  }

  static async exportKey(key: CryptoKey, format: 'raw' | 'pkcs8' | 'spki' = 'raw'): Promise<string> {
    const exported = await crypto.subtle.exportKey(format, key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  static async importKey(
    keyData: string,
    algorithm: AlgorithmIdentifier | RsaHashedImportParams,
    extractable = false,
    keyUsages: KeyUsage[] = ['encrypt', 'decrypt']
  ): Promise<CryptoKey> {
    const keyBuffer = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
    
    return crypto.subtle.importKey(
      'raw',
      keyBuffer,
      algorithm,
      extractable,
      keyUsages
    );
  }
}

export class PasswordUtils {
  static calculateStrength(password: string): {
    score: number;
    level: 'weak' | 'fair' | 'good' | 'strong' | 'very strong';
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    
    if (password.length < 8) feedback.push('密码长度至少为8个字符');
    if (!hasUppercase) feedback.push('需要包含大写字母');
    if (!hasLowercase) feedback.push('需要包含小写字母');
    if (!hasNumber) feedback.push('需要包含数字');
    if (!hasSpecial) feedback.push('需要包含特殊字符');
    
    let level: 'weak' | 'fair' | 'good' | 'strong' | 'very strong';
    if (score <= 2) level = 'weak';
    else if (score <= 4) level = 'fair';
    else if (score <= 5) level = 'good';
    else if (score <= 6) level = 'strong';
    else level = 'very strong';
    
    return { score, level, feedback };
  }

  static generate(options?: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSpecial?: boolean;
    excludeSimilar?: boolean;
  }): string {
    const length = options?.length || 16;
    let charset = '';
    
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const similar = 'il1Lo0O';
    
    if (options?.includeLowercase !== false) charset += lowercase;
    if (options?.includeUppercase !== false) charset += uppercase;
    if (options?.includeNumbers !== false) charset += numbers;
    if (options?.includeSpecial !== false) charset += special;
    
    if (options?.excludeSimilar) {
      charset = charset.split('').filter((c) => !similar.includes(c)).join('');
    }
    
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    return Array.from(array)
      .map((n) => charset[n % charset.length])
      .join('');
  }

  static async hash(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const saltValue = salt || CryptoUtils.generateSalt(16);
    const hashResult = await CryptoUtils.hashSHA256(password + saltValue);
    
    return {
      hash: hashResult.value,
      salt: saltValue,
    };
  }

  static async verify(password: string, hash: string, salt: string): Promise<boolean> {
    const hashResult = await CryptoUtils.hashSHA256(password + salt);
    return hashResult.value === hash;
  }
}

export class TokenUtils {
  static generate(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    return Array.from(array)
      .map((n) => chars[n % chars.length])
      .join('');
  }

  static generateJWT(payload: Record<string, unknown>, secret: string, expiresIn = 3600): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    };
    
    const base64Header = btoa(JSON.stringify(header)).replace(/=/g, '');
    const base64Payload = btoa(JSON.stringify(tokenPayload)).replace(/=/g, '');
    
    const signatureInput = `${base64Header}.${base64Payload}`;
    
    return `${signatureInput}.signature`;
  }

  static parseJWT(token: string): { header: Record<string, unknown>; payload: Record<string, unknown> } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      return { header, payload };
    } catch {
      return null;
    }
  }

  static isExpired(token: string): boolean {
    const parsed = TokenUtils.parseJWT(token);
    if (!parsed) return true;
    
    const exp = parsed.payload.exp as number;
    return exp < Math.floor(Date.now() / 1000);
  }
}

export class EncodingUtils {
  static toBase64(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
  }

  static fromBase64(base64: string): string {
    return decodeURIComponent(escape(atob(base64)));
  }

  static toHex(str: string): string {
    return Array.from(new TextEncoder().encode(str))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static fromHex(hex: string): string {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return new TextDecoder().decode(bytes);
  }

  static toBinary(str: string): string {
    return Array.from(new TextEncoder().encode(str))
      .map((b) => b.toString(2).padStart(8, '0'))
      .join('');
  }

  static fromBinary(binary: string): string {
    const bytes = new Uint8Array(binary.length / 8);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(binary.substr(i * 8, 8), 2);
    }
    return new TextDecoder().decode(bytes);
  }
}

export default CryptoUtils;
