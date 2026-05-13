export interface FilterOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  grayscale?: number;
  sepia?: number;
  invert?: number;
  opacity?: number;
}

export interface BlurOptions {
  radius?: number;
  sigma?: number;
}

export interface ShadowOptions {
  color?: string;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  spread?: number;
  inset?: boolean;
}

export interface GradientOptions {
  colors: Array<{ color: string; position: number }>;
  direction?: 'to top' | 'to bottom' | 'to left' | 'to right' | string;
  type?: 'linear' | 'radial';
}

export class FilterUtils {
  private static instance: FilterUtils;

  static getInstance(): FilterUtils {
    if (!FilterUtils.instance) {
      FilterUtils.instance = new FilterUtils();
    }
    return FilterUtils.instance;
  }

  static brightness(value: number): string {
    return `brightness(${value}%)`;
  }

  static contrast(value: number): string {
    return `contrast(${value}%)`;
  }

  static saturate(value: number): string {
    return `saturate(${value}%)`;
  }

  static hueRotate(value: number): string {
    return `hue-rotate(${value}deg)`;
  }

  static blur(radius: number): string {
    return `blur(${radius}px)`;
  }

  static grayscale(value: number): string {
    return `grayscale(${value}%)`;
  }

  static sepia(value: number): string {
    return `sepia(${value}%)`;
  }

  static invert(value: number): string {
    return `invert(${value}%)`;
  }

  static opacity(value: number): string {
    return `opacity(${value}%)`;
  }

  static dropShadow(
    offsetX: number,
    offsetY: number,
    blurRadius: number,
    color: string
  ): string {
    return `drop-shadow(${offsetX}px ${offsetY}px ${blurRadius}px ${color})`;
  }

  static combine(...filters: string[]): string {
    return filters.join(' ');
  }

  static apply(element: HTMLElement, filters: FilterOptions): void {
    const filterList: string[] = [];
    
    if (filters.brightness !== undefined) {
      filterList.push(FilterUtils.brightness(filters.brightness));
    }
    if (filters.contrast !== undefined) {
      filterList.push(FilterUtils.contrast(filters.contrast));
    }
    if (filters.saturation !== undefined) {
      filterList.push(FilterUtils.saturate(filters.saturation));
    }
    if (filters.hue !== undefined) {
      filterList.push(FilterUtils.hueRotate(filters.hue));
    }
    if (filters.blur !== undefined) {
      filterList.push(FilterUtils.blur(filters.blur));
    }
    if (filters.grayscale !== undefined) {
      filterList.push(FilterUtils.grayscale(filters.grayscale));
    }
    if (filters.sepia !== undefined) {
      filterList.push(FilterUtils.sepia(filters.sepia));
    }
    if (filters.invert !== undefined) {
      filterList.push(FilterUtils.invert(filters.invert));
    }
    if (filters.opacity !== undefined) {
      filterList.push(FilterUtils.opacity(filters.opacity));
    }
    
    element.style.filter = FilterUtils.combine(...filterList);
  }

  static remove(element: HTMLElement): void {
    element.style.filter = '';
  }

  static grayscaleFilter(value = 100): string {
    return FilterUtils.grayscale(value);
  }

  static sepiaFilter(value = 100): string {
    return FilterUtils.sepia(value);
  }

  static blurFilter(radius = 5): string {
    return FilterUtils.blur(radius);
  }

  static invertFilter(value = 100): string {
    return FilterUtils.invert(value);
  }

  static brightnessFilter(value = 100): string {
    return FilterUtils.brightness(value);
  }

  static contrastFilter(value = 100): string {
    return FilterUtils.contrast(value);
  }

  static saturateFilter(value = 100): string {
    return FilterUtils.saturate(value);
  }

  static hueRotateFilter(value = 0): string {
    return FilterUtils.hueRotate(value);
  }

  static createShadow(options: ShadowOptions): string {
    const {
      color = 'rgba(0, 0, 0, 0.5)',
      offsetX = 2,
      offsetY = 2,
      blur = 4,
      spread = 0,
      inset = false,
    } = options;
    
    const insetStr = inset ? 'inset ' : '';
    return `${insetStr}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;
  }

  static createBoxShadow(options: ShadowOptions): string {
    return FilterUtils.createShadow(options);
  }

  static createTextShadow(options: ShadowOptions): string {
    const {
      color = 'rgba(0, 0, 0, 0.5)',
      offsetX = 1,
      offsetY = 1,
      blur = 1,
    } = options;
    
    return `${offsetX}px ${offsetY}px ${blur}px ${color}`;
  }

  static createGradient(options: GradientOptions): string {
    const {
      colors,
      direction = 'to bottom',
      type = 'linear',
    } = options;
    
    const colorStops = colors
      .map((c) => `${c.color} ${c.position}%`)
      .join(', ');
    
    if (type === 'radial') {
      return `radial-gradient(${colorStops})`;
    }
    
    return `linear-gradient(${direction}, ${colorStops})`;
  }

  static createLinearGradient(
    colors: Array<{ color: string; position: number }>,
    direction = 'to bottom'
  ): string {
    return FilterUtils.createGradient({ colors, direction, type: 'linear' });
  }

  static createRadialGradient(
    colors: Array<{ color: string; position: number }>
  ): string {
    return FilterUtils.createGradient({ colors, type: 'radial' });
  }

  static createRepeatingGradient(
    colors: Array<{ color: string; position: number }>,
    direction = 'to bottom',
    size = '20px'
  ): string {
    const colorStops = colors
      .map((c) => `${c.color} ${c.position}%`)
      .join(', ');
    
    return `repeating-linear-gradient(${direction}, ${colorStops})`;
  }

  static createConicGradient(
    colors: Array<{ color: string; position: number }>,
    from = '0deg'
  ): string {
    const colorStops = colors
      .map((c) => `${c.color} ${c.position}%`)
      .join(', ');
    
    return `conic-gradient(from ${from}, ${colorStops})`;
  }
}

export class ImageFilters {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  loadImage(image: HTMLImageElement): void {
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.ctx.drawImage(image, 0, 0);
    this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  loadFromDataURL(dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.loadImage(img);
        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  getImageData(): ImageData | null {
    return this.imageData;
  }

  setImageData(data: ImageData): void {
    this.imageData = data;
  }

  apply(): void {
    if (!this.imageData) return;
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  grayscale(): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    
    return this.imageData;
  }

  invert(): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    
    return this.imageData;
  }

  brightness(value: number): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    const factor = value / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * factor);
      data[i + 1] = Math.min(255, data[i + 1] * factor);
      data[i + 2] = Math.min(255, data[i + 2] * factor);
    }
    
    return this.imageData;
  }

  contrast(value: number): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    const factor = (259 * (value + 255)) / (255 * (259 - value));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
    }
    
    return this.imageData;
  }

  saturate(value: number): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    const factor = value / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = Math.max(0, Math.min(255, gray + factor * (data[i] - gray)));
      data[i + 1] = Math.max(0, Math.min(255, gray + factor * (data[i + 1] - gray)));
      data[i + 2] = Math.max(0, Math.min(255, gray + factor * (data[i + 2] - gray)));
    }
    
    return this.imageData;
  }

  hueRotate(angle: number): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    const cos = Math.cos((angle * Math.PI) / 180);
    const sin = Math.sin((angle * Math.PI) / 180);
    
    const lum = (r: number, g: number, b: number): [number, number, number] => {
      const lr = 0.213;
      const lg = 0.715;
      const lb = 0.072;
      return [
        lr * r + lg * g + lb * b,
        lr * r + lg * g + lb * b,
        lr * r + lg * g + lb * b,
      ];
    };
    
    const sepia = (r: number, g: number, b: number): [number, number, number] => {
      return [
        Math.min(255, r * 0.393 + g * 0.769 + b * 0.189),
        Math.min(255, r * 0.349 + g * 0.686 + b * 0.168),
        Math.min(255, r * 0.272 + g * 0.534 + b * 0.131),
      ];
    };
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.max(0, Math.min(255, r * cos + g * (0.5 - 0.5 * cos) + b * (0.5 - 0.5 * cos)));
      data[i + 1] = Math.max(0, Math.min(255, r * (0.5 - 0.5 * cos) + g * (0.5 + 0.5 * cos) + b * (0.5 - 0.5 * cos)));
      data[i + 2] = Math.max(0, Math.min(255, r * (0.5 - 0.5 * cos) + g * (0.5 - 0.5 * cos) + b * (0.5 + 0.5 * cos)));
    }
    
    return this.imageData;
  }

  sepia(): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
    
    return this.imageData;
  }

  blur(radius: number): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    const width = this.imageData.width;
    const height = this.imageData.height;
    const output = new Uint8ClampedArray(data);
    
    const kernel: number[] = [];
    const size = radius * 2 + 1;
    
    for (let i = 0; i < size * size; i++) {
      kernel.push(1 / (size * size));
    }
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const kidx = ((ky + radius) * size + (kx + radius));
            const k = kernel[kidx];
            
            r += data[idx] * k;
            g += data[idx + 1] * k;
            b += data[idx + 2] * k;
          }
        }
        
        const idx = (y * width + x) * 4;
        output[idx] = r;
        output[idx + 1] = g;
        output[idx + 2] = b;
      }
    }
    
    this.imageData = new ImageData(output, width, height);
    return this.imageData;
  }

  threshold(value: number): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const color = gray >= value ? 255 : 0;
      data[i] = color;
      data[i + 1] = color;
      data[i + 2] = color;
    }
    
    return this.imageData;
  }

  posterize(levels: number): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    const step = 255 / levels;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(Math.round(data[i] / step) * step);
      data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
      data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
    }
    
    return this.imageData;
  }

  solarize(threshold = 128): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > threshold) data[i] = 255 - data[i];
      if (data[i + 1] > threshold) data[i + 1] = 255 - data[i + 1];
      if (data[i + 2] > threshold) data[i + 2] = 255 - data[i + 2];
    }
    
    return this.imageData;
  }

  gamma(correction: number): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    const pow = 1 / correction;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.pow(data[i] / 255, pow) * 255;
      data[i + 1] = Math.pow(data[i + 1] / 255, pow) * 255;
      data[i + 2] = Math.pow(data[i + 2] / 255, pow) * 255;
    }
    
    return this.imageData;
  }

  sharpen(factor: number = 1): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    const width = this.imageData.width;
    const height = this.imageData.height;
    const output = new Uint8ClampedArray(data);
    
    const kernel = [
      0, -factor, 0,
      -factor, 1 + 4 * factor, -factor,
      0, -factor, 0,
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let val = 0;
          
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kidx = (ky + 1) * 3 + (kx + 1);
              val += data[idx] * kernel[kidx];
            }
          }
          
          const idx = (y * width + x) * 4 + c;
          output[idx] = Math.max(0, Math.min(255, val));
        }
      }
    }
    
    this.imageData = new ImageData(output, width, height);
    return this.imageData;
  }

  emboss(strength: number = 1): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    const width = this.imageData.width;
    const height = this.imageData.height;
    const output = new Uint8ClampedArray(data);
    
    const kernel = [
      -strength, -strength, 0,
      -strength, 0, strength,
      0, strength, strength,
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let val = 128;
          
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kidx = (ky + 1) * 3 + (kx + 1);
              val += data[idx] * kernel[kidx];
            }
          }
          
          const idx = (y * width + x) * 4 + c;
          output[idx] = Math.max(0, Math.min(255, val));
        }
      }
    }
    
    this.imageData = new ImageData(output, width, height);
    return this.imageData;
  }

  edgeDetection(strength: number = 1): ImageData | null {
    if (!this.imageData) return null;
    
    const data = this.imageData.data;
    const width = this.imageData.width;
    const height = this.imageData.height;
    const output = new Uint8ClampedArray(data);
    
    const kernel = [
      -strength, -strength, -strength,
      -strength, 8 * strength, -strength,
      -strength, -strength, -strength,
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let val = 0;
          
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kidx = (ky + 1) * 3 + (kx + 1);
              val += data[idx] * kernel[kidx];
            }
          }
          
          const idx = (y * width + x) * 4 + c;
          output[idx] = Math.max(0, Math.min(255, val));
        }
      }
    }
    
    this.imageData = new ImageData(output, width, height);
    return this.imageData;
  }

  toDataURL(type = 'image/png', quality = 0.92): string {
    return this.canvas.toDataURL(type, quality);
  }

  toBlob(type = 'image/png', quality = 0.92): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, type, quality);
    });
  }
}

export class ColorMatrix {
  static identity(): number[] {
    return [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }

  static grayscale(): number[] {
    return [
      0.33, 0.33, 0.33, 0, 0,
      0.33, 0.33, 0.33, 0, 0,
      0.33, 0.33, 0.33, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }

  static sepia(): number[] {
    return [
      0.393, 0.769, 0.189, 0, 0,
      0.349, 0.686, 0.168, 0, 0,
      0.272, 0.534, 0.131, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }

  static saturate(value: number): number[] {
    const s = value / 100;
    const s1 = 1 - s;
    const s2 = 0.213 * s1;
    const s3 = 0.715 * s1;
    const s4 = 0.072 * s1;
    
    return [
      s2 + s, s3, s4, 0, 0,
      s2, s3 + s, s4, 0, 0,
      s2, s3, s4 + s, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }

  static hueRotate(angle: number): number[] {
    const cos = Math.cos((angle * Math.PI) / 180);
    const sin = Math.sin((angle * Math.PI) / 180);
    
    const s1 = 0.213;
    const s2 = 0.715;
    const s3 = 0.072;
    
    return [
      s1 + cos * (1 - s1) + sin * (-s1),
      s2 + cos * (-s2) + sin * (-s2),
      s3 + cos * (-s3) + sin * (1 - s3),
      0, 0,
      s1 + cos * (-s1) + sin * (0.143),
      s2 + cos * (1 - s2) + sin * (0.140),
      s3 + cos * (-s3) + sin * (-0.283),
      0, 0,
      s1 + cos * (-s1) + sin * (-(1 - s1)),
      s2 + cos * (-s2) + sin * (s2),
      s3 + cos * (1 - s3) + sin * (s3),
      0, 0,
      0, 0, 0, 1, 0,
    ];
  }

  static brightness(value: number): number[] {
    const v = value / 100;
    return [
      v, 0, 0, 0, 0,
      0, v, 0, 0, 0,
      0, 0, v, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }

  static contrast(value: number): number[] {
    const v = value / 100;
    const t = (1 - v) / 2;
    return [
      v, 0, 0, 0, t * 255,
      0, v, 0, 0, t * 255,
      0, 0, v, 0, t * 255,
      0, 0, 0, 1, 0,
    ];
  }

  static multiply(mat1: number[], mat2: number[]): number[] {
    const result = new Array(20).fill(0);
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) {
        let val = 0;
        for (let k = 0; k < 4; k++) {
          val += mat1[i * 5 + k] * mat2[k * 5 + j];
        }
        val += mat1[i * 5 + 4];
        result[i * 5 + j] = val;
      }
    }
    
    return result;
  }

  static invert(): number[] {
    return [
      -1, 0, 0, 0, 255,
      0, -1, 0, 0, 255,
      0, 0, -1, 0, 255,
      0, 0, 0, 1, 0,
    ];
  }

  static applyToImageData(imageData: ImageData, matrix: number[]): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      data[i] = Math.max(0, Math.min(255, matrix[0] * r + matrix[1] * g + matrix[2] * b + matrix[3] * a + matrix[4]));
      data[i + 1] = Math.max(0, Math.min(255, matrix[5] * r + matrix[6] * g + matrix[7] * b + matrix[8] * a + matrix[9]));
      data[i + 2] = Math.max(0, Math.min(255, matrix[10] * r + matrix[11] * g + matrix[12] * b + matrix[13] * a + matrix[14]));
      data[i + 3] = Math.max(0, Math.min(255, matrix[15] * r + matrix[16] * g + matrix[17] * b + matrix[18] * a + matrix[19]));
    }
    
    return imageData;
  }
}

export default FilterUtils;
