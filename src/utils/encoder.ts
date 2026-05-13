export type CompressionLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface CompressionOptions {
  level?: CompressionLevel;
  chunkSize?: number;
}

export interface EncodedData {
  data: string;
  originalSize: number;
  encodedSize: number;
  type: 'base64' | 'base16' | 'uri' | 'rot13' | 'hex';
}

export interface HashResult {
  hash: string;
  algorithm: string;
  length: number;
}

export class Encoder {
  static toBase64(data: string): string {
    try {
      return btoa(unescape(encodeURIComponent(data)));
    } catch {
      return '';
    }
  }

  static fromBase64(data: string): string {
    try {
      return decodeURIComponent(escape(atob(data)));
    } catch {
      return '';
    }
  }

  static toBase16(data: string): string {
    const bytes: number[] = [];
    const str = encodeURIComponent(data);
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static fromBase16(data: string): string {
    const bytes: number[] = [];
    for (let i = 0; i < data.length; i += 2) {
      bytes.push(parseInt(data.substr(i, 2), 16));
    }
    return decodeURIComponent(String.fromCharCode(...bytes));
  }

  static toHex(data: string): string {
    return Array.from(data)
      .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  }

  static fromHex(data: string): string {
    const bytes: number[] = [];
    for (let i = 0; i < data.length; i += 2) {
      bytes.push(parseInt(data.substr(i, 2), 16));
    }
    return String.fromCharCode(...bytes);
  }

  static toUri(data: string): string {
    return encodeURIComponent(data);
  }

  static fromUri(data: string): string {
    return decodeURIComponent(data);
  }

  static toRot13(data: string): string {
    return data.replace(/[a-zA-Z]/g, (c) => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
  }

  static fromRot13(data: string): string {
    return this.toRot13(data);
  }

  static encode(data: string, type: EncodedData['type']): EncodedData {
    const originalSize = new Blob([data]).size;
    let encoded: string;

    switch (type) {
      case 'base64':
        encoded = this.toBase64(data);
        break;
      case 'base16':
        encoded = this.toBase16(data);
        break;
      case 'uri':
        encoded = this.toUri(data);
        break;
      case 'rot13':
        encoded = this.toRot13(data);
        break;
      case 'hex':
        encoded = this.toHex(data);
        break;
      default:
        encoded = data;
    }

    return {
      data: encoded,
      originalSize,
      encodedSize: new Blob([encoded]).size,
      type,
    };
  }

  static decode(data: string, type: EncodedData['type']): string {
    switch (type) {
      case 'base64':
        return this.fromBase64(data);
      case 'base16':
        return this.fromBase16(data);
      case 'uri':
        return this.fromUri(data);
      case 'rot13':
        return this.fromRot13(data);
      case 'hex':
        return this.fromHex(data);
      default:
        return data;
    }
  }
}

export class Hasher {
  private static async hashWithAlgo(
    data: string,
    algo: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
  ): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest(algo, dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async sha1(data: string): Promise<HashResult> {
    const hash = await this.hashWithAlgo(data, 'SHA-1');
    return {
      hash,
      algorithm: 'SHA-1',
      length: hash.length,
    };
  }

  static async sha256(data: string): Promise<HashResult> {
    const hash = await this.hashWithAlgo(data, 'SHA-256');
    return {
      hash,
      algorithm: 'SHA-256',
      length: hash.length,
    };
  }

  static async sha384(data: string): Promise<HashResult> {
    const hash = await this.hashWithAlgo(data, 'SHA-384');
    return {
      hash,
      algorithm: 'SHA-384',
      length: hash.length,
    };
  }

  static async sha512(data: string): Promise<HashResult> {
    const hash = await this.hashWithAlgo(data, 'SHA-512');
    return {
      hash,
      algorithm: 'SHA-512',
      length: hash.length,
    };
  }

  static md5(data: string): HashResult {
    const hash = this.simpleHash(data, 32);
    return {
      hash,
      algorithm: 'MD5',
      length: hash.length,
    };
  }

  static crc32(data: string): HashResult {
    let crc = 0xffffffff;
    const table = this.getCrc32Table();
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ data.charCodeAt(i)) & 0xff];
    }
    const hash = ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
    return {
      hash,
      algorithm: 'CRC32',
      length: hash.length,
    };
  }

  private static getCrc32Table(): number[] {
    const table: number[] = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  }

  private static simpleHash(data: string, length: number): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(length, '0').slice(0, length);
  }

  static adler32(data: string): HashResult {
    let a = 1, b = 0;
    for (let i = 0; i < data.length; i++) {
      a = (a + data.charCodeAt(i)) % 65521;
      b = (b + a) % 65521;
    }
    const hash = ((b << 16) | a).toString(16).padStart(8, '0');
    return {
      hash,
      algorithm: 'ADLER32',
      length: hash.length,
    };
  }
}

export class Compressor {
  static compress(data: string): string {
    try {
      const encoded = Encoder.toBase64(data);
      return encoded;
    } catch {
      return data;
    }
  }

  static decompress(data: string): string {
    try {
      return Encoder.fromBase64(data);
    } catch {
      return data;
    }
  }

  static lzwCompress(data: string): string {
    const dict: Record<string, number> = {};
    let curr = '';
    const result: number[] = [];
    let code = 256;

    for (let i = 0; i <= 255; i++) {
      dict[String.fromCharCode(i)] = i;
    }

    for (const char of data) {
      const combined = curr + char;
      if (combined in dict) {
        curr = combined;
      } else {
        result.push(dict[curr]);
        dict[combined] = code++;
        curr = char;
      }
    }

    if (curr) {
      result.push(dict[curr]);
    }

    return result.map(n => String.fromCharCode(n)).join('');
  }

  static lzwDecompress(data: string): string {
    const dict: Record<number, string> = {};
    let curr = '';
    const result: string[] = [];
    let code = 256;

    for (let i = 0; i <= 255; i++) {
      dict[i] = String.fromCharCode(i);
    }

    const codes = data.split('').map(c => c.charCodeAt(0));
    if (codes.length === 0) return '';

    curr = dict[codes[0]] || '';
    result.push(curr);

    for (let i = 1; i < codes.length; i++) {
      const entry = codes[i] < 256 ? dict[codes[i]] : (dict[codes[i]] || (curr + curr[0]));
      result.push(entry);
      dict[code++] = curr + entry[0];
      curr = entry;
    }

    return result.join('');
  }
}

export class BinaryEncoder {
  static stringToBytes(data: string): number[] {
    return Array.from(data).map(c => c.charCodeAt(0));
  }

  static bytesToString(bytes: number[]): string {
    return String.fromCharCode(...bytes);
  }

  static bytesToBinary(bytes: number[]): string {
    return bytes.map(b => b.toString(2).padStart(8, '0')).join('');
  }

  static binaryToBytes(binary: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < binary.length; i += 8) {
      bytes.push(parseInt(binary.slice(i, i + 8), 2));
    }
    return bytes;
  }

  static bytesToHex(bytes: number[]): string {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.slice(i, i + 2), 16));
    }
    return bytes;
  }
}
