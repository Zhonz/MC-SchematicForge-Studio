export interface UUIDOptions {
  random?: boolean;
  namespace?: string;
}

export class UUIDGenerator {
  private static readonly HEX = '0123456789abcdef';
  private static readonly NIL = '00000000-0000-0000-0000-000000000000';

  static generate(options?: UUIDOptions): string {
    if (options?.random) {
      return this.generateRandom();
    }
    return this.generateTimeBased(options?.namespace);
  }

  private static generateRandom(): string {
    const getNibble = (): string => {
      const hexChars = UUIDGenerator.HEX;
      const index = Math.floor(Math.random() * 16);
      return hexChars[index] ?? '0';
    };
    const getByte = (): string => {
      return getNibble() + getNibble() + getNibble() + getNibble();
    };
    return [
      getByte(),
      getByte(),
      getByte(),
      getByte(),
      '-',
      getByte(),
      '-',
      '4' + getNibble(),
      '-',
      (Math.floor(Math.random() * 4) + 8).toString(16) + getNibble() + getNibble(),
      '-',
      getByte() + getByte() + getByte(),
    ].join('');
  }

  private static generateTimeBased(namespace?: string): string {
    const timestamp = Date.now().toString(16).padStart(12, '0');
    const random = this.generateRandom().replace(/-/g, '').slice(10);
    const ns = namespace
      ? Math.abs(this.hashCode(namespace)).toString(16).padStart(8, '0')
      : random.slice(0, 8);
    return [
      timestamp.slice(0, 8),
      timestamp.slice(8, 12),
      '1' + timestamp.slice(0, 3),
      ((parseInt(random[0] ?? '0', 16) & 0x3) | 0x8).toString(16) + random.slice(1, 4),
      ns + random.slice(4),
    ].join('-');
  }

  static v1(): string {
    return this.generateTimeBased();
  }

  static v4(): string {
    return this.generateRandom();
  }

  static v5(namespace: string, name: string): string {
    const ns = namespace.replace(/-/g, '');
    const fullName = ns + name;
    const hash = this.sha1(fullName);
    return [
      hash.slice(0, 8),
      hash.slice(8, 12),
      '5' + hash.slice(13, 16),
      ((parseInt(hash.slice(16, 18), 16) & 0x3) | 0x8).toString(16) + hash.slice(18, 20),
      hash.slice(20, 32),
    ].join('-');
  }

  private static sha1(str: string): string {
    const rotateLeft = (n: number, s: number): number => (n << s) | (n >>> (32 - s));
    const h: number[] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
    const bitLenHi = (bytes.length / 0x20000000) | 0;
    const bitLenLo = bytes.length << 3;
    const padLen = bitLenHi > 0x200000 ? 0x40 : 0x80;
    bytes.push(padLen);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    bytes.push((bitLenHi >>> 24) & 0xff, (bitLenHi >>> 16) & 0xff, (bitLenHi >>> 8) & 0xff, bitLenHi & 0xff);
    bytes.push((bitLenLo >>> 24) & 0xff, (bitLenLo >>> 16) & 0xff, (bitLenLo >>> 8) & 0xff, bitLenLo & 0xff);
    for (let i = 0; i < bytes.length; i += 64) {
      const w: number[] = [];
      for (let j = 0; j < 16; j++) {
        w.push((bytes[i + j * 4]! << 24) | (bytes[i + j * 4 + 1]! << 16) | (bytes[i + j * 4 + 2]! << 8) | bytes[i + j * 4 + 3]!);
      }
      for (let j = 16; j < 80; j++) {
        w.push(rotateLeft(w[j - 3]! ^ w[j - 8]! ^ w[j - 14]! ^ w[j - 16]!, 1));
      }
      let a = h[0]!, b = h[1]!, c = h[2]!, d = h[3]!, e = h[4]!;
      for (let j = 0; j < 80; j++) {
        let f: number, k: number;
        if (j < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
        else if (j < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
        else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
        else { f = b ^ c ^ d; k = 0xca62c1d6; }
        const temp = (rotateLeft(a, 5) + f + e + k + w[j]!) | 0;
        e = d; d = c; c = rotateLeft(b, 30); b = a; a = temp;
      }
      h[0] = (h[0]! + a) | 0; h[1] = (h[1]! + b) | 0; h[2] = (h[2]! + c) | 0; h[3] = (h[3]! + d) | 0; h[4] = (h[4]! + e) | 0;
    }
    let result = '';
    for (const v of h) {
      const hex = ((v >>> 24) & 0xff).toString(16).padStart(2, '0') + 
                  ((v >>> 16) & 0xff).toString(16).padStart(2, '0') + 
                  ((v >>> 8) & 0xff).toString(16).padStart(2, '0') + 
                  (v & 0xff).toString(16).padStart(2, '0');
      result += hex;
    }
    return result;
  }

  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash;
  }

  static isValid(uuid: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  }

  static nil(): string {
    return this.NIL;
  }
}

export const generateUUID = (): string => UUIDGenerator.v4();
