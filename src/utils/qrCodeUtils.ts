export interface QRCodeOptions {
  width?: number;
  height?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface QRCodeData {
  data: string;
  options: QRCodeOptions;
}

export class QRCodeUtils {
  private static instance: QRCodeUtils;

  static getInstance(): QRCodeUtils {
    if (!QRCodeUtils.instance) {
      QRCodeUtils.instance = new QRCodeUtils();
    }
    return QRCodeUtils.instance;
  }

  static generate(
    data: string,
    options?: QRCodeOptions
  ): string {
    return QRCodeUtils.toDataURL(data, options);
  }

  static toDataURL(
    data: string,
    options?: QRCodeOptions
  ): string {
    const canvas = QRCodeUtils.toCanvas(data, options);
    return canvas.toDataURL('image/png');
  }

  static toCanvas(
    data: string,
    options?: QRCodeOptions
  ): HTMLCanvasElement {
    const width = options?.width || 200;
    const height = options?.height || 200;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    
    const qrData = QRCodeUtils.createQRCode(data, options);
    const cellSize = Math.min(width, height) / qrData.size;
    
    const margin = options?.margin || 4;
    const offsetX = margin * cellSize;
    const offsetY = margin * cellSize;
    
    const darkColor = options?.color?.dark || '#000000';
    const lightColor = options?.color?.light || '#ffffff';
    
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = darkColor;
    for (let y = 0; y < qrData.size; y++) {
      for (let x = 0; x < qrData.size; x++) {
        if (qrData.data[y * qrData.size + x]) {
          ctx.fillRect(
            offsetX + x * cellSize,
            offsetY + y * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
    
    return canvas;
  }

  static download(
    data: string,
    filename = 'qrcode.png',
    options?: QRCodeOptions
  ): void {
    const dataUrl = QRCodeUtils.toDataURL(data, options);
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }

  private static createQRCode(
    data: string,
    options?: QRCodeOptions
  ): { size: number; data: boolean[] } {
    const errorCorrectionLevel = options?.errorCorrectionLevel || 'M';
    const version = QRCodeUtils.getVersion(data, errorCorrectionLevel);
    const size = 21 + (version - 1) * 4;
    
    const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
    
    QRCodeUtils.addFinderPatterns(matrix, size);
    QRCodeUtils.addAlignmentPatterns(matrix, size, version);
    QRCodeUtils.addTimingPatterns(matrix, size);
    QRCodeUtils.addFormatInfo(matrix, size, errorCorrectionLevel);
    QRCodeUtils.addVersionInfo(matrix, size, version);
    
    QRCodeUtils.addData(matrix, data, version);
    
    QRCodeUtils.applyMask(matrix, size);
    
    const flatData: boolean[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        flatData.push(matrix[y][x]);
      }
    }
    
    return { size, data: flatData };
  }

  private static getVersion(data: string, level: string): number {
    const capacityByLevel: Record<string, number[]> = {
      L: [17, 32, 53, 78, 106, 134, 154, 192, 230, 271],
      M: [14, 26, 42, 62, 84, 106, 122, 152, 180, 213],
      Q: [11, 20, 32, 46, 60, 74, 86, 108, 130, 151],
      H: [7, 14, 24, 34, 44, 58, 64, 84, 98, 119],
    };
    
    const capacity = capacityByLevel[level] || capacityByLevel.M;
    
    for (let i = 0; i < capacity.length; i++) {
      if (data.length <= capacity[i]) {
        return i + 1;
      }
    }
    
    return capacity.length + 1;
  }

  private static addFinderPatterns(matrix: boolean[][], size: number): void {
    const pattern = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ];
    
    QRCodeUtils.placePattern(matrix, pattern, 0, 0);
    QRCodeUtils.placePattern(matrix, pattern, size - 7, 0);
    QRCodeUtils.placePattern(matrix, pattern, 0, size - 7);
  }

  private static placePattern(
    matrix: boolean[][],
    pattern: number[][],
    startX: number,
    startY: number
  ): void {
    for (let y = 0; y < pattern.length; y++) {
      for (let x = 0; x < pattern[y].length; x++) {
        matrix[startY + y][startX + x] = pattern[y][x] === 1;
      }
    }
  }

  private static addAlignmentPatterns(matrix: boolean[][], size: number, version: number): void {
    if (version < 2) return;
    
    const positions = QRCodeUtils.getAlignmentPositions(version);
    
    for (let i = 0; i < positions.length; i++) {
      for (let j = 0; j < positions.length; j++) {
        const x = positions[i];
        const y = positions[j];
        
        if (
          (i === 0 && j === 0) ||
          (i === 0 && j === positions.length - 1) ||
          (i === positions.length - 1 && j === 0)
        ) {
          continue;
        }
        
        QRCodeUtils.placePattern(matrix, QRCodeUtils.alignmentPattern, x - 2, y - 2);
      }
    }
  }

  private static alignmentPattern = [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ];

  private static getAlignmentPositions(version: number): number[] {
    const positions: number[] = [];
    
    if (version === 1) return [6];
    
    const last = 17 + (version - 1) * 4;
    const step = Math.floor((last - 6) / (Math.floor(version / 7) + 1));
    
    let pos = last;
    while (pos > 6 + step) {
      positions.unshift(pos);
      pos -= step;
    }
    positions.unshift(6);
    
    return positions;
  }

  private static addTimingPatterns(matrix: boolean[][], size: number): void {
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }
  }

  private static addFormatInfo(matrix: boolean[][], size: number, level: string): void {
    const formatBits = QRCodeUtils.getFormatBits(level);
    
    for (let i = 0; i < 15; i++) {
      const bit = (formatBits >> i) & 1;
      
      if (i < 6) {
        matrix[i][8] = bit === 1;
      } else if (i < 8) {
        matrix[i + 1][8] = bit === 1;
      } else {
        matrix[8][size - 15 + i] = bit === 1;
      }
    }
    
    matrix[8][size - 8] = true;
    
    for (let i = 0; i < 15; i++) {
      const bit = (formatBits >> i) & 1;
      
      if (i < 8) {
        matrix[8][size - 1 - i] = bit === 1;
      } else if (i < 9) {
        matrix[14 - i + 1][8] = bit === 1;
      } else {
        matrix[8][14 - i + 1] = bit === 1;
      }
    }
  }

  private static getFormatBits(level: string): number {
    const formats: Record<string, number> = {
      L: 1,
      M: 0,
      Q: 3,
      H: 2,
    };
    
    return formats[level] || 0;
  }

  private static addVersionInfo(matrix: boolean[][], size: number, version: number): void {
    if (version < 7) return;
    
    const versionBits = QRCodeUtils.getVersionBits(version);
    
    let bitIndex = 0;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        const bit = (versionBits >> bitIndex) & 1;
        matrix[j][size - 11 + i] = bit === 1;
        matrix[size - 11 + i][j] = bit === 1;
        bitIndex++;
      }
    }
  }

  private static getVersionBits(version: number): number {
    return version - 7;
  }

  private static addData(matrix: boolean[][], data: string, version: number): void {
    let bitStream = '';
    
    const modeIndicator = '0100';
    const charCountBits = version < 10 ? 8 : 16;
    const charCount = data.length.toString(2).padStart(charCountBits, '0');
    
    bitStream += modeIndicator;
    bitStream += charCount;
    
    for (let i = 0; i < data.length; i++) {
      bitStream += data.charCodeAt(i).toString(2).padStart(8, '0');
    }
    
    bitStream += '0000';
    
    while (bitStream.length % 8 !== 0) {
      bitStream += '0';
    }
    
    const padBytes = [236, 17];
    let padIndex = 0;
    
    while (bitStream.length < (21 + (version - 1) * 4) * (21 + (version - 1) * 4) - 200) {
      bitStream += padBytes[padIndex % 2].toString(2).padStart(8, '0');
      padIndex++;
    }
    
    const size = matrix.length;
    let upward = true;
    let col = size - 1;
    
    for (let i = 0; i < bitStream.length; i += 2) {
      const bits = bitStream.slice(i, i + 2);
      
      for (let j = 0; j < 2; j++) {
        const bit = bits[j] === '1';
        let row = upward ? size - 1 : 0;
        let placed = false;
        
        while (!placed) {
          if (!matrix[row][col] && row >= 0 && row < size) {
            if (j === 0) {
              matrix[row][col] = bit;
            } else {
              matrix[row][col] = bit;
            }
            placed = true;
          }
          
          row += upward ? -1 : 1;
          
          if (row < 0 || row >= size) {
            upward = !upward;
            col--;
            
            if (col === 6) col--;
            
            if (col < 0) break;
            
            row = upward ? size - 1 : 0;
          }
        }
      }
    }
  }

  private static applyMask(matrix: boolean[][], size: number): void {
    const maskPattern = 0;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (QRCodeUtils.isDataModule(x, y, size)) {
          const shouldMask = QRCodeUtils.getMask(x, y, maskPattern);
          matrix[y][x] = matrix[y][x] !== shouldMask;
        }
      }
    }
  }

  private static isDataModule(x: number, y: number, size: number): boolean {
    if (x < 9 && y < 9) return false;
    if (x < 9 && y >= size - 8) return false;
    if (x >= size - 8 && y < 9) return false;
    if (x === 6 || y === 6) return false;
    return true;
  }

  private static getMask(x: number, y: number, pattern: number): boolean {
    switch (pattern) {
      case 0:
        return (x + y) % 2 === 0;
      case 1:
        return y % 2 === 0;
      case 2:
        return x % 3 === 0;
      case 3:
        return (x + y) % 3 === 0;
      case 4:
        return (Math.floor(x / 2) + Math.floor(y / 3)) % 2 === 0;
      case 5:
        return ((x * y) % 2) + ((x * y) % 3) === 0;
      case 6:
        return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
      case 7:
        return (((x * y) % 3) + ((x + y) % 2)) % 2 === 0;
      default:
        return false;
    }
  }
}

export class BarcodeUtils {
  static generateCode128(data: string, options?: { width?: number; height?: number; showText?: boolean }): HTMLCanvasElement {
    const width = options?.width || 200;
    const height = options?.height || 80;
    const showText = options?.showText !== false;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    
    const patterns = BarcodeUtils.getCode128Patterns();
    const barcodeWidth = showText ? width : width - 20;
    const barHeight = showText ? height - 20 : height;
    const barWidth = barcodeWidth / (data.length + 2);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#000000';
    
    let x = (width - barcodeWidth) / 2;
    x += BarcodeUtils.drawPattern(ctx, patterns.startB, x, 10, barWidth, barHeight);
    
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      const pattern = patterns.codes[char] || patterns.codes[' '];
      x += BarcodeUtils.drawPattern(ctx, pattern, x, 10, barWidth, barHeight);
    }
    
    x += BarcodeUtils.drawPattern(ctx, patterns.stop, x, 10, barWidth, barHeight);
    
    if (showText) {
      ctx.fillStyle = '#000000';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(data, width / 2, height - 4);
    }
    
    return canvas;
  }

  private static drawPattern(
    ctx: CanvasRenderingContext2D,
    pattern: number[],
    x: number,
    y: number,
    barWidth: number,
    height: number
  ): number {
    let currentX = x;
    
    for (let i = 0; i < pattern.length; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(currentX, y, barWidth * pattern[i], height);
      }
      currentX += barWidth * pattern[i];
    }
    
    return currentX - x;
  }

  private static getCode128Patterns(): {
    startB: number[];
    stop: number[];
    codes: Record<string, number[]>;
  } {
    const codes: Record<string, number[]> = {
      ' ': [2, 1, 2, 1, 2, 2],
      '!': [2, 2, 2, 1, 1, 2],
      '"': [2, 1, 1, 2, 2, 2],
      '#': [1, 1, 1, 2, 2, 3],
      '$': [1, 1, 1, 1, 1, 1],
      '%': [1, 1, 2, 2, 1, 3],
      '&': [1, 2, 1, 1, 3, 2],
      "'": [2, 2, 1, 1, 3, 1],
      '(': [2, 1, 2, 2, 1, 2],
      ')': [1, 2, 2, 1, 2, 2],
      '*': [2, 2, 1, 3, 1, 1],
      '+': [1, 1, 3, 1, 1, 3],
      ',': [1, 3, 1, 1, 2, 2],
      '-': [1, 1, 2, 3, 1, 2],
      '.': [2, 3, 1, 1, 2, 1],
      '/': [1, 1, 3, 2, 1, 2],
      '0': [2, 2, 1, 1, 1, 2],
      '1': [1, 1, 2, 2, 1, 3],
      '2': [1, 1, 1, 3, 2, 2],
      '3': [2, 1, 1, 3, 1, 2],
      '4': [1, 2, 2, 1, 1, 3],
      '5': [2, 2, 1, 1, 1, 2],
      '6': [1, 3, 1, 1, 2, 2],
      '7': [1, 1, 2, 2, 2, 1],
      '8': [2, 1, 2, 1, 2, 1],
      '9': [2, 1, 1, 2, 2, 1],
      ':': [2, 2, 1, 2, 1, 1],
      ';': [1, 1, 1, 1, 3, 2],
      '<': [1, 1, 2, 1, 3, 1],
      '=': [1, 2, 1, 1, 3, 1],
      '>': [3, 1, 1, 1, 2, 2],
      '?': [2, 1, 1, 2, 1, 2],
      '@': [2, 1, 2, 2, 2, 1],
      'A': [1, 1, 2, 1, 2, 2],
      'B': [2, 1, 1, 2, 2, 1],
      'C': [2, 1, 2, 1, 1, 2],
      'D': [1, 1, 1, 3, 2, 2],
      'E': [1, 1, 2, 3, 1, 2],
      'F': [1, 2, 2, 1, 1, 2],
      'G': [1, 2, 1, 1, 2, 2],
      'H': [2, 2, 1, 1, 1, 1],
      'I': [2, 1, 1, 2, 1, 2],
      'J': [1, 1, 2, 2, 1, 2],
      'K': [1, 2, 1, 2, 1, 2],
      'L': [1, 2, 2, 1, 2, 1],
      'M': [2, 2, 1, 2, 1, 1],
      'N': [2, 1, 1, 1, 2, 2],
      'O': [1, 1, 2, 1, 2, 2],
      'P': [2, 2, 1, 1, 2, 1],
      'Q': [1, 2, 1, 1, 1, 2],
      'R': [1, 2, 2, 2, 1, 1],
      'S': [1, 1, 1, 1, 2, 3],
      'T': [1, 3, 1, 1, 1, 2],
      'U': [2, 1, 3, 1, 1, 1],
      'V': [1, 1, 3, 2, 1, 1],
      'W': [3, 1, 1, 1, 1, 2],
      'X': [2, 1, 1, 3, 1, 1],
      'Y': [1, 1, 2, 1, 3, 1],
      'Z': [2, 2, 1, 1, 3, 1],
      '[': [2, 1, 3, 1, 1, 1],
      '\\': [1, 1, 1, 2, 3, 1],
      ']': [3, 1, 1, 1, 2, 1],
      '^': [2, 1, 1, 3, 1, 1],
      '_': [3, 1, 2, 1, 1, 1],
      '`': [1, 1, 2, 1, 1, 3],
      'a': [1, 1, 2, 3, 1, 1],
      'b': [1, 2, 1, 3, 1, 1],
      'c': [1, 1, 3, 1, 2, 1],
      'd': [3, 1, 2, 1, 1, 1],
      'e': [2, 1, 1, 1, 1, 3],
      'f': [2, 1, 3, 1, 1, 1],
      'g': [1, 1, 1, 2, 1, 3],
      'h': [1, 1, 1, 3, 1, 2],
      'i': [3, 1, 1, 1, 1, 2],
      'j': [2, 3, 1, 1, 1, 1],
      'k': [1, 2, 1, 1, 3, 1],
      'l': [1, 1, 1, 2, 3, 1],
      'm': [1, 1, 1, 3, 3, 1],
      'n': [1, 1, 3, 3, 1, 1],
      'o': [3, 1, 1, 3, 1, 1],
      'p': [2, 1, 1, 3, 1, 1],
      'q': [2, 3, 1, 1, 1, 1],
      'r': [1, 1, 3, 1, 1, 2],
      's': [3, 1, 1, 1, 1, 2],
      't': [3, 1, 2, 1, 1, 1],
      'u': [1, 1, 2, 1, 3, 1],
      'v': [1, 1, 2, 3, 1, 1],
      'w': [1, 1, 3, 1, 2, 1],
      'x': [1, 2, 1, 1, 2, 2],
      'y': [1, 2, 1, 3, 2, 1],
      'z': [2, 2, 1, 1, 2, 1],
      '{': [2, 1, 2, 3, 1, 1],
      '|': [1, 1, 1, 3, 2, 2],
      '}': [2, 1, 3, 1, 2, 1],
      '~': [1, 2, 2, 1, 1, 2],
    };
    
    return {
      startB: [2, 1, 1, 2, 1, 2],
      stop: [2, 3, 3, 1, 1, 1, 2],
      codes,
    };
  }

  static toDataURL(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/png');
  }

  static download(canvas: HTMLCanvasElement, filename = 'barcode.png'): void {
    const dataUrl = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }
}

export default QRCodeUtils;
