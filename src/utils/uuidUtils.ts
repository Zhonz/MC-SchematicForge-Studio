export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateUUIDv4(): string {
  return generateUUID();
}

export function generateUUIDv7(): string {
  const now = Date.now();
  const timestampHex = now.toString(16).padStart(12, '0');
  
  const random1 = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  const random2 = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  const random3 = (0x8000 | (Math.floor(Math.random() * 0x3fff))).toString(16).padStart(4, '0');
  const random4 = Math.floor(Math.random() * 0xffffffffffffff).toString(16).padStart(12, '0');
  
  return `${timestampHex.slice(0, 8)}-${timestampHex.slice(8, 12)}-${random1.slice(0, 4)}-4${random1.slice(4, 6)}-${random2}${random3}${random4}`;
}

export function generateShortId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateNanoId(size = 21): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let id = '';
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i] & 63];
  }
  return id;
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isValidUUIDv4(uuid: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(uuid);
}

export function parseUUID(uuid: string): {
  timeLow: string;
  timeMid: string;
  timeHighAndVersion: string;
  clockSeqAndReserved: string;
  clockSeqLow: string;
  node: string;
} | null {
  if (!isValidUUID(uuid)) return null;

  return {
    timeLow: uuid.slice(0, 8),
    timeMid: uuid.slice(9, 13),
    timeHighAndVersion: uuid.slice(14, 18),
    clockSeqAndReserved: uuid.slice(19, 21),
    clockSeqLow: uuid.slice(21, 23),
    node: uuid.slice(24, 36),
  };
}

export function uuidToBytes(uuid: string): Uint8Array {
  const bytes = new Uint8Array(16);
  const hex = uuid.replace(/-/g, '');
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToUUID(bytes: Uint8Array): string {
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function uuidToNumber(uuid: string): bigint {
  const bytes = uuidToBytes(uuid);
  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
}

export function numberToUUID(num: bigint): string {
  const bytes = new Uint8Array(16);
  let value = num;
  for (let i = 15; i >= 0; i--) {
    bytes[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return bytesToUUID(bytes);
}

export class UUIDGenerator {
  private counter = 0;
  private lastTimestamp = 0;
  private nodeId: string;

  constructor(nodeId?: string) {
    this.nodeId = nodeId || generateShortId(6);
  }

  generate(): string {
    const now = Date.now();
    
    if (now === this.lastTimestamp) {
      this.counter++;
    } else {
      this.counter = 0;
      this.lastTimestamp = now;
    }

    const timestamp = now.toString(16).padStart(12, '0');
    const counter = this.counter.toString(16).padStart(4, '0');
    
    return `${timestamp.slice(0, 8)}-${timestamp.slice(8, 12)}-4xxx-${counter[0]}xxx-${this.nodeId}${counter.slice(1)}xxxxxxx`.replace(/x/g, () => 
      Math.floor(Math.random() * 16).toString(16)
    );
  }

  generateBatch(count: number): string[] {
    return Array.from({ length: count }, () => this.generate());
  }

  reset(): void {
    this.counter = 0;
    this.lastTimestamp = 0;
  }
}

export class ULIDGenerator {
  private encoder = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  private lastTime = 0;
  private counter = 0;

  private encodeTime(now: number): string {
    let str = '';
    for (let i = 9; i >= 0; i--) {
      const mod = now % 32;
      str = this.encoder[mod] + str;
      now = (now - mod) / 32;
    }
    return str;
  }

  private encodeCounter(counter: number): string {
    let str = '';
    for (let i = 0; i < 16; i++) {
      const mod = counter % 32;
      str = this.encoder[mod] + str;
      counter = (counter - mod) / 32;
    }
    return str;
  }

  generate(timestamp?: number): string {
    const now = timestamp || Date.now();
    
    if (now === this.lastTime) {
      this.counter++;
    } else {
      this.counter = 0;
      this.lastTime = now;
    }

    const timePart = this.encodeTime(now);
    const randomPart = Array.from({ length: 16 }, () => 
      this.encoder[Math.floor(Math.random() * 32)]
    ).join('');

    return `${timePart}${randomPart}`.toUpperCase();
  }

  generateBatch(count: number): string[] {
    return Array.from({ length: count }, () => this.generate());
  }
}

export const defaultUUIDGenerator = new UUIDGenerator();
export const defaultULIDGenerator = new ULIDGenerator();

export function isValidULID(ulid: string): boolean {
  if (ulid.length !== 26) return false;
  const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  return ulidRegex.test(ulid);
}

export function extractTimestampFromULID(ulid: string): number | null {
  if (!isValidULID(ulid)) return null;
  
  const decoder = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let time = 0;
  
  for (let i = 0; i < 10; i++) {
    const char = ulid[i].toUpperCase();
    const index = decoder.indexOf(char);
    if (index === -1) return null;
    time = time * 32 + index;
  }
  
  return time;
}
