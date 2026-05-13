export interface CompressionOptions {
  level?: number;
}

export function compressString(str: string, options: CompressionOptions = {}): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const compressed = compress(data, options.level);
  return btoa(String.fromCharCode(...compressed));
}

export function decompressString(compressed: string): string {
  const binary = atob(compressed);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decompressed = decompress(bytes);
  const decoder = new TextDecoder();
  return decoder.decode(decompressed);
}

export function compress(data: Uint8Array, level = 6): Uint8Array {
  if (typeof CompressionStream === 'undefined') {
    return deflateSync(data, level);
  }
  
  return data;
}

export function decompress(data: Uint8Array): Uint8Array {
  if (typeof DecompressionStream === 'undefined') {
    return inflateSync(data);
  }
  
  return data;
}

function deflateSync(data: Uint8Array, level: number): Uint8Array {
  const result: number[] = [];
  const maxBlockSize = 65535;
  
  result.push(0x78, 0x9C);
  
  let remaining = data.length;
  let offset = 0;
  
  while (remaining > 0) {
    const blockSize = Math.min(remaining, maxBlockSize);
    const isLast = remaining <= maxBlockSize;
    
    const block = data.slice(offset, offset + blockSize);
    
    result.push(isLast ? 0x01 : 0x00);
    result.push(blockSize & 0xFF);
    result.push((blockSize >> 8) & 0xFF);
    result.push(~blockSize & 0xFF);
    result.push((~blockSize >> 8) & 0xFF);
    
    for (let i = 0; i < block.length; i++) {
      result.push(block[i]);
    }
    
    offset += blockSize;
    remaining -= blockSize;
  }
  
  const adler = adler32(data);
  result.push((adler >> 24) & 0xFF);
  result.push((adler >> 16) & 0xFF);
  result.push((adler >> 8) & 0xFF);
  result.push(adler & 0xFF);
  
  return new Uint8Array(result);
}

function inflateSync(data: Uint8Array): Uint8Array {
  if (data.length < 2) return new Uint8Array(0);
  
  let offset = 2;
  const result: number[] = [];
  
  while (offset < data.length - 4) {
    const isLast = (data[offset] & 0x01) === 0x01;
    const compressed = (data[offset] & 0x06) === 0x00;
    const blockSize = data[offset + 1] | (data[offset + 2] << 8);
    
    offset += 3;
    
    if (compressed) {
      for (let i = 0; i < blockSize && offset < data.length; i++) {
        result.push(data[offset++]);
      }
    } else {
      for (let i = 0; i < blockSize && offset < data.length; i++) {
        result.push(data[offset++]);
      }
    }
    
    if (isLast) break;
  }
  
  return new Uint8Array(result);
}

function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  
  return (b << 16) | a;
}

export function gzip(data: Uint8Array, level = 6): Uint8Array {
  return deflateSync(data, level);
}

export function gunzip(data: Uint8Array): Uint8Array {
  return inflateSync(data);
}

export class LZString {
  private static readonly keyStrBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  private static readonly keyStrUriSafe = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';

  static compressToBase64(input: string): string {
    if (input == null) return '';
    const res = this._compress(input, 6, (a) => this.keyStrBase64.charAt(a));
    return res;
  }

  static decompressFromBase64(input: string): string {
    if (input == null) return '';
    if (input == '') return null as unknown as string;
    return this._decompress(input.length, 32, (index) => this.keyStrBase64.indexOf(input.charAt(index)));
  }

  static compressToUTF16(input: string): string {
    if (input == null) return '';
    const res = this._compress(input, 15, (a) => String.fromCharCode(a + 32));
    return res + ' ';
  }

  static decompressFromUTF16(compressed: string): string {
    if (compressed == null) return '';
    if (compressed == '') return null as unknown as string;
    return this._decompress(compressed.length, 16384, (index) => compressed.charCodeAt(index) - 32);
  }

  static compressToUint8Array(input: string): Uint8Array {
    const compressed = this.compress(input);
    const arr = new Uint8Array(compressed.length + 2);
    arr[0] = (compressed.length >> 8) & 0xFF;
    arr[1] = compressed.length & 0xFF;
    for (let i = 0; i < compressed.length; i++) {
      arr[i + 2] = compressed.charCodeAt(i);
    }
    return arr;
  }

  static decompressFromUint8Array(compressed: Uint8Array): string {
    if (compressed == null || compressed.length < 2) return '';
    const length = (compressed[0] << 8) | compressed[1];
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      arr[i] = compressed[i + 2];
    }
    const chars = String.fromCharCode(...arr);
    return this._decompress(chars.length, 32768, (index) => chars.charCodeAt(index));
  }

  private static _compress(uncompressed: string, bitsPerChar: number, getCharFromInt: (a: number) => string): string {
    if (uncompressed == null) return '';
    let i: number;
    let value: number;
    const contextDictionary: Record<string, number> = {};
    const contextDictionaryToCreate: Record<string, boolean> = {};
    let contextC = '';
    let contextWc = '';
    let contextW = '';
    let contextEnlargeIn = 2;
    let contextDictSize = 3;
    let contextNumBits = 2;
    let contextData: string[] = [];
    let contextDataVal = 0;
    let contextDataPosition = 0;

    for (ii = 0; ii < uncompressed.length; ii += 1) {
      contextC = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(contextDictionary, contextC)) {
        contextDictionary[contextC] = contextDictSize++;
        contextDictionaryToCreate[contextC] = true;
      }

      contextWc = contextW + contextC;
      if (Object.prototype.hasOwnProperty.call(contextDictionary, contextWc)) {
        contextW = contextWc;
      } else {
        if (Object.prototype.hasOwnProperty.call(contextDictionaryToCreate, contextW)) {
          if (contextW.charCodeAt(0) < 256) {
            for (i = 0; i < contextNumBits; i++) {
              contextDataVal = (contextDataVal << 1);
              if (contextDataPosition == bitsPerChar - 1) {
                contextDataPosition = 0;
                contextData.push(getCharFromInt(contextDataVal));
                contextDataVal = 0;
              } else {
                contextDataPosition++;
              }
            }
            value = contextW.charCodeAt(0);
            for (i = 0; i < 8; i++) {
              contextDataVal = (contextDataVal << 1) | (value & 1);
              if (contextDataPosition == bitsPerChar - 1) {
                contextDataPosition = 0;
                contextData.push(getCharFromInt(contextDataVal));
                contextDataVal = 0;
              } else {
                contextDataPosition++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i = 0; i < contextNumBits; i++) {
              contextDataVal = (contextDataVal << 1) | value;
              if (contextDataPosition == bitsPerChar - 1) {
                contextDataPosition = 0;
                contextData.push(getCharFromInt(contextDataVal));
                contextDataVal = 0;
              } else {
                contextDataPosition++;
              }
              value = 0;
            }
            value = contextW.charCodeAt(0);
            for (i = 0; i < 16; i++) {
              contextDataVal = (contextDataVal << 1) | (value & 1);
              if (contextDataPosition == bitsPerChar - 1) {
                contextDataPosition = 0;
                contextData.push(getCharFromInt(contextDataVal));
                contextDataVal = 0;
              } else {
                contextDataPosition++;
              }
              value = value >> 1;
            }
          }
          contextEnlargeIn--;
          if (contextEnlargeIn == 0) {
            contextEnlargeIn = Math.pow(2, contextNumBits);
            contextNumBits++;
          }
          delete contextDictionaryToCreate[contextW];
        } else {
          value = contextDictionary[contextW];
          for (i = contextNumBits - 1; i >= 0; i--) {
            contextDataVal = (contextDataVal << 1) | (value & 1);
            if (contextDataPosition == bitsPerChar - 1) {
              contextDataPosition = 0;
              contextData.push(getCharFromInt(contextDataVal));
              contextDataVal = 0;
            } else {
              contextDataPosition++;
            }
            value = value >> 1;
          }
        }
        contextEnlargeIn--;
        if (contextEnlargeIn == 0) {
          contextEnlargeIn = Math.pow(2, contextNumBits);
          contextNumBits++;
        }
        contextDictionary[contextWc] = contextDictSize++;
        contextW = String(contextC);
      }
    }

    if (contextW !== '') {
      if (Object.prototype.hasOwnProperty.call(contextDictionaryToCreate, contextW)) {
        if (contextW.charCodeAt(0) < 256) {
          for (i = 0; i < contextNumBits; i++) {
            contextDataVal = (contextDataVal << 1);
            if (contextDataPosition == bitsPerChar - 1) {
              contextDataPosition = 0;
              contextData.push(getCharFromInt(contextDataVal));
              contextDataVal = 0;
            } else {
              contextDataPosition++;
            }
          }
          value = contextW.charCodeAt(0);
          for (i = 0; i < 8; i++) {
            contextDataVal = (contextDataVal << 1) | (value & 1);
            if (contextDataPosition == bitsPerChar - 1) {
              contextDataPosition = 0;
              contextData.push(getCharFromInt(contextDataVal));
              contextDataVal = 0;
            } else {
              contextDataPosition++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i = 0; i < contextNumBits; i++) {
            contextDataVal = (contextDataVal << 1) | value;
            if (contextDataPosition == bitsPerChar - 1) {
              contextDataPosition = 0;
              contextData.push(getCharFromInt(contextDataVal));
              contextDataVal = 0;
            } else {
              contextDataPosition++;
            }
            value = 0;
          }
          value = contextW.charCodeAt(0);
          for (i = 0; i < 16; i++) {
            contextDataVal = (contextDataVal << 1) | (value & 1);
            if (contextDataPosition == bitsPerChar - 1) {
              contextDataPosition = 0;
              contextData.push(getCharFromInt(contextDataVal));
              contextDataVal = 0;
            } else {
              contextDataPosition++;
            }
            value = value >> 1;
          }
        }
        contextEnlargeIn--;
        if (contextEnlargeIn == 0) {
          contextEnlargeIn = Math.pow(2, contextNumBits);
          contextNumBits++;
        }
        delete contextDictionaryToCreate[contextW];
      } else {
        value = contextDictionary[contextW];
        for (i = contextNumBits - 1; i >= 0; i--) {
          contextDataVal = (contextDataVal << 1) | (value & 1);
          if (contextDataPosition == bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition++;
          }
          value = value >> 1;
        }
      }
      contextEnlargeIn--;
      if (contextEnlargeIn == 0) {
        contextEnlargeIn = Math.pow(2, contextNumBits);
        contextNumBits++;
      }
    }

    value = 2;
    for (i = 0; i < contextNumBits; i++) {
      contextDataVal = (contextDataVal << 1) | (value & 1);
      if (contextDataPosition == bitsPerChar - 1) {
        contextDataPosition = 0;
        contextData.push(getCharFromInt(contextDataVal));
        contextDataVal = 0;
      } else {
        contextDataPosition++;
      }
      value = value >> 1;
    }

    while (true) {
      contextDataVal = (contextDataVal << 1);
      if (contextDataPosition == bitsPerChar - 1) {
        contextData.push(getCharFromInt(contextDataVal));
        break;
      } else contextDataPosition++;
    }
    return contextData.join('');
  }

  private static _decompress(length: number, resetValue: number, getNextValue: (a: number) => number): string {
    let ii = 0;
    let value: number = 0;
    let freshVal: number = 0;
    let bits = 0;
    const res: number[] = [];
    const w: string[] = [];
    let enlargeIn = 4;
    let dictSize = 4;
    let numBits = 3;
    let entry = '';
    let result = '';

    const enlargeIn_arr = enlargeIn;
    const enlargeIn_count = 0;
    const dict: string[] = [];

    const getValue = (index: number): number => getNextValue(index);

    value = getValue(ii++);
    bits = 0;

    while (bits < numBits) {
      freshVal = value & 1;
      value = getValue(ii++);
      bits++;
    }

    if (value == 0) {
      freshVal = 1 - freshVal;
    }

    result += String.fromCharCode(resetValue >> 8);
    w.push(String.fromCharCode(resetValue & 0xFF));
    enlargeIn--;
    entry = String.fromCharCode(freshVal);

    while (true) {
      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

      freshVal = value & 1;
      value = getValue(ii++);
      bits++;

      while (bits < numBits) {
        freshVal = freshVal * 2 + (value & 1);
        value = getValue(ii++);
        bits++;
      }

      switch (freshVal) {
        case 0:
          freshVal = ii++;
          while (true) {
            const val = getValue(ii++);
            if (val == 0) break;
          }
          break;
        case 1:
          freshVal = 1;
          while (true) {
            const val = getValue(ii++);
            if (val == 0) break;
          }
          break;
        case 2:
          freshVal = 2;
          while (true) {
            const val = getValue(ii++);
            if (val == 0) break;
          }
          break;
      }

      if (freshVal < dictSize) {
        result += entry;
        res.push(freshVal);
        enlargeIn--;
      } else {
        result += entry + entry[0];
        res.push(dictSize);
        enlargeIn--;
      }

      dictSize++;
      if (dictSize > enlargeIn) {
        enlargeIn *= 2;
      }

      if (dictSize > enlargeIn) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

      if (freshVal < dictSize) {
        entry = '';
        if (freshVal < res.length) {
          entry = res.join('').substring(res.length - freshVal, res.length);
        }
      }

      if (result.length > length) {
        return '';
      }
    }

    return result;
  }

  private static compress(input: string): string {
    return this._compress(input, 16, (a) => String.fromCharCode(a));
  }

  private static decompress(input: string): string {
    if (input == null) return '';
    if (input == '') return null as unknown as string;
    return this._decompress(input.length, 32768, (index) => input.charCodeAt(index));
  }
}

let ii = 0;

export const lzString = LZString;
