export interface CanvasOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  pixelRatio?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export class CanvasUtils2 {
  private static instance: CanvasUtils2;

  static getInstance(): CanvasUtils2 {
    if (!CanvasUtils2.instance) {
      CanvasUtils2.instance = new CanvasUtils2();
    }
    return CanvasUtils2.instance;
  }

  static create(container: HTMLElement, options?: CanvasOptions): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    
    const pixelRatio = options?.pixelRatio || window.devicePixelRatio || 1;
    
    canvas.width = (options?.width || container.clientWidth) * pixelRatio;
    canvas.height = (options?.height || container.clientHeight) * pixelRatio;
    
    canvas.style.width = `${options?.width || container.clientWidth}px`;
    canvas.style.height = `${options?.height || container.clientHeight}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx && options?.backgroundColor) {
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    container.appendChild(canvas);
    
    return canvas;
  }

  static getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    return canvas.getContext('2d');
  }

  static clear(canvas: HTMLCanvasElement, color?: string): void {
    const ctx = CanvasUtils2.getContext(canvas);
    if (!ctx) return;
    
    if (color) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  static resize(canvas: HTMLCanvasElement, width: number, height: number): void {
    const pixelRatio = window.devicePixelRatio || 1;
    
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  static toDataURL(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): string {
    return canvas.toDataURL(type, quality);
  }

  static toBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob | null> {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, type, quality);
    });
  }

  static download(canvas: HTMLCanvasElement, filename = 'canvas.png', type = 'image/png'): void {
    const dataUrl = CanvasUtils2.toDataURL(canvas, type);
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }

  static drawImage(
    ctx: CanvasRenderingContext2D,
    image: CanvasImageSource,
    x: number,
    y: number,
    width?: number,
    height?: number
  ): void {
    if (width !== undefined && height !== undefined) {
      ctx.drawImage(image, x, y, width, height);
    } else {
      ctx.drawImage(image, x, y);
    }
  }

  static drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    options?: {
      font?: string;
      color?: string;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
      maxWidth?: number;
    }
  ): void {
    if (options?.font) ctx.font = options.font;
    if (options?.color) ctx.fillStyle = options.color;
    if (options?.align) ctx.textAlign = options.align;
    if (options?.baseline) ctx.textBaseline = options.baseline;
    
    ctx.fillText(text, x, y, options?.maxWidth);
  }

  static measureTextWidth(ctx: CanvasRenderingContext2D, text: string): number {
    return ctx.measureText(text).width;
  }

  static drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      radius?: number;
    }
  ): void {
    if (options?.radius && options.radius > 0) {
      CanvasUtils2.drawRoundedRect(ctx, x, y, width, height, options.radius, options);
    } else {
      if (options?.fill) {
        ctx.fillStyle = options.fill;
        ctx.fillRect(x, y, width, height);
      }
      
      if (options?.stroke) {
        ctx.strokeStyle = options.stroke;
        ctx.lineWidth = options.strokeWidth || 1;
        ctx.strokeRect(x, y, width, height);
      }
    }
  }

  static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    }
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (options?.fill) {
      ctx.fillStyle = options.fill;
      ctx.fill();
    }
    
    if (options?.stroke) {
      ctx.strokeStyle = options.stroke;
      ctx.lineWidth = options.strokeWidth || 1;
      ctx.stroke();
    }
  }

  static drawCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    }
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (options?.fill) {
      ctx.fillStyle = options.fill;
      ctx.fill();
    }
    
    if (options?.stroke) {
      ctx.strokeStyle = options.stroke;
      ctx.lineWidth = options.strokeWidth || 1;
      ctx.stroke();
    }
  }

  static drawEllipse(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation = 0,
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    }
  ): void {
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
    
    if (options?.fill) {
      ctx.fillStyle = options.fill;
      ctx.fill();
    }
    
    if (options?.stroke) {
      ctx.strokeStyle = options.stroke;
      ctx.lineWidth = options.strokeWidth || 1;
      ctx.stroke();
    }
  }

  static drawLine(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options?: {
      color?: string;
      width?: number;
      dash?: number[];
      cap?: CanvasLineCap;
    }
  ): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    
    if (options?.color) ctx.strokeStyle = options.color;
    if (options?.width) ctx.lineWidth = options.width;
    if (options?.dash) ctx.setLineDash(options.dash);
    if (options?.cap) ctx.lineCap = options.cap;
    
    ctx.stroke();
  }

  static drawPolygon(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    }
  ): void {
    if (points.length < 3) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.closePath();
    
    if (options?.fill) {
      ctx.fillStyle = options.fill;
      ctx.fill();
    }
    
    if (options?.stroke) {
      ctx.strokeStyle = options.stroke;
      ctx.lineWidth = options.strokeWidth || 1;
      ctx.stroke();
    }
  }

  static drawGradient(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    colors: Array<{ offset: number; color: string }>,
    type: 'linear' | 'radial' = 'linear'
  ): CanvasGradient {
    let gradient: CanvasGradient;
    
    if (type === 'linear') {
      gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      gradient = ctx.createRadialGradient(x1, y1, 0, x1, y1, radius);
    }
    
    colors.forEach(({ offset, color }) => {
      gradient.addColorStop(offset, color);
    });
    
    return gradient;
  }

  static drawShadow(
    ctx: CanvasRenderingContext2D,
    callback: () => void,
    options: {
      color?: string;
      blur?: number;
      offsetX?: number;
      offsetY?: number;
    }
  ): void {
    ctx.save();
    
    ctx.shadowColor = options.color || 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = options.blur || 5;
    ctx.shadowOffsetX = options.offsetX || 0;
    ctx.shadowOffsetY = options.offsetY || 0;
    
    callback();
    
    ctx.restore();
  }

  static setAlpha(ctx: CanvasRenderingContext2D, alpha: number, callback: () => void): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    callback();
    ctx.restore();
  }

  static clip(
    ctx: CanvasRenderingContext2D,
    callback: () => void,
    shape: 'circle' | 'rect' | 'polygon',
    options?: CircleShape | RectShape | PolygonShape
  ): void {
    ctx.save();
    ctx.beginPath();
    
    if (shape === 'circle' && options) {
      const circle = options as CircleShape;
      ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    } else if (shape === 'rect' && options) {
      const rect = options as RectShape;
      ctx.rect(rect.x, rect.y, rect.width, rect.height);
    } else if (shape === 'polygon' && options) {
      const polygon = options as PolygonShape;
      if (polygon.points.length >= 3) {
        ctx.moveTo(polygon.points[0].x, polygon.points[0].y);
        for (let i = 1; i < polygon.points.length; i++) {
          ctx.lineTo(polygon.points[i].x, polygon.points[i].y);
        }
        ctx.closePath();
      }
    }
    
    ctx.clip();
    
    callback();
    
    ctx.restore();
  }

  static composite(
    ctx: CanvasRenderingContext2D,
    callback: () => void,
    operation: GlobalCompositeOperation
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = operation;
    callback();
    ctx.restore();
  }

  static save(ctx: CanvasRenderingContext2D): void {
    ctx.save();
  }

  static restore(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  static translate(ctx: CanvasRenderingContext2D, x: number, y: number, callback: () => void): void {
    ctx.save();
    ctx.translate(x, y);
    callback();
    ctx.restore();
  }

  static rotate(ctx: CanvasRenderingContext2D, angle: number, callback: () => void): void {
    ctx.save();
    ctx.rotate(angle);
    callback();
    ctx.restore();
  }

  static scale(ctx: CanvasRenderingContext2D, x: number, y: number, callback: () => void): void {
    ctx.save();
    ctx.scale(x, y);
    callback();
    ctx.restore();
  }

  static transform(
    ctx: CanvasRenderingContext2D,
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    callback: () => void
  ): void {
    ctx.save();
    ctx.transform(a, b, c, d, e, f);
    callback();
    ctx.restore();
  }

  static flipHorizontal(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, callback: () => void): void {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    callback();
    ctx.restore();
  }

  static flipVertical(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, callback: () => void): void {
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    callback();
    ctx.restore();
  }
}

interface CircleShape {
  x: number;
  y: number;
  radius: number;
}

interface RectShape {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PolygonShape {
  points: Point[];
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  clear(color?: string): void {
    CanvasUtils2.clear(this.canvas, color);
  }

  resize(width: number, height: number): void {
    CanvasUtils2.resize(this.canvas, width, height);
  }

  toDataURL(type?: string, quality?: number): string {
    return CanvasUtils2.toDataURL(this.canvas, type, quality);
  }

  toBlob(type?: string, quality?: number): Promise<Blob | null> {
    return CanvasUtils2.toBlob(this.canvas, type, quality);
  }

  download(filename?: string, type?: string): void {
    CanvasUtils2.download(this.canvas, filename, type);
  }
}

export class ImageProcessor {
  static grayscale(imageData: ImageData): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    
    return imageData;
  }

  static invert(imageData: ImageData): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    
    return imageData;
  }

  static brightness(imageData: ImageData, value: number): ImageData {
    const data = imageData.data;
    const factor = (259 * (value + 255)) / (255 * (259 - value));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
    }
    
    return imageData;
  }

  static contrast(imageData: ImageData, value: number): ImageData {
    const data = imageData.data;
    const factor = (259 * (value + 255)) / (255 * (259 - value));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
    }
    
    return imageData;
  }

  static saturation(imageData: ImageData, value: number): ImageData {
    const data = imageData.data;
    const factor = (value + 100) / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = Math.min(255, Math.max(0, gray + factor * (data[i] - gray)));
      data[i + 1] = Math.min(255, Math.max(0, gray + factor * (data[i + 1] - gray)));
      data[i + 2] = Math.min(255, Math.max(0, gray + factor * (data[i + 2] - gray)));
    }
    
    return imageData;
  }

  static blur(imageData: ImageData, radius: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
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
    
    return new ImageData(output, width, height);
  }

  static threshold(imageData: ImageData, value: number): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const color = gray >= value ? 255 : 0;
      data[i] = color;
      data[i + 1] = color;
      data[i + 2] = color;
    }
    
    return imageData;
  }

  static sepia(imageData: ImageData): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
      data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
      data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
    }
    
    return imageData;
  }

  static crop(
    imageData: ImageData,
    x: number,
    y: number,
    width: number,
    height: number
  ): ImageData {
    const srcData = imageData.data;
    const output = new Uint8ClampedArray(width * height * 4);
    
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const srcIdx = ((y + row) * imageData.width + (x + col)) * 4;
        const dstIdx = (row * width + col) * 4;
        
        output[dstIdx] = srcData[srcIdx];
        output[dstIdx + 1] = srcData[srcIdx + 1];
        output[dstIdx + 2] = srcData[srcIdx + 2];
        output[dstIdx + 3] = srcData[srcIdx + 3];
      }
    }
    
    return new ImageData(output, width, height);
  }

  static resize(
    imageData: ImageData,
    width: number,
    height: number
  ): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const srcCanvas = document.createElement('canvas');
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCanvas.width = imageData.width;
    srcCanvas.height = imageData.height;
    srcCtx.putImageData(imageData, 0, 0);
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(srcCanvas, 0, 0, width, height);
    
    return ctx.getImageData(0, 0, width, height);
  }

  static rotate(imageData: ImageData, angle: number): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const srcCanvas = document.createElement('canvas');
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCanvas.width = imageData.width;
    srcCanvas.height = imageData.height;
    srcCtx.putImageData(imageData, 0, 0);
    
    let newWidth = imageData.width;
    let newHeight = imageData.height;
    
    if (angle === 90 || angle === 270) {
      newWidth = imageData.height;
      newHeight = imageData.width;
    }
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(srcCanvas, -imageData.width / 2, -imageData.height / 2);
    
    return ctx.getImageData(0, 0, newWidth, newHeight);
  }

  static flipHorizontal(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width / 2; x++) {
        const leftIdx = (y * width + x) * 4;
        const rightIdx = (y * width + (width - 1 - x)) * 4;
        
        for (let i = 0; i < 4; i++) {
          const temp = output[leftIdx + i];
          output[leftIdx + i] = output[rightIdx + i];
          output[rightIdx + i] = temp;
        }
      }
    }
    
    return new ImageData(output, width, height);
  }

  static flipVertical(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data);
    
    for (let y = 0; y < height / 2; y++) {
      for (let x = 0; x < width; x++) {
        const topIdx = (y * width + x) * 4;
        const bottomIdx = ((height - 1 - y) * width + x) * 4;
        
        for (let i = 0; i < 4; i++) {
          const temp = output[topIdx + i];
          output[topIdx + i] = output[bottomIdx + i];
          output[bottomIdx + i] = temp;
        }
      }
    }
    
    return new ImageData(output, width, height);
  }
}

export class SpriteSheet {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frameWidth: number;
  private frameHeight: number;
  private frames: ImageData[] = [];
  private currentFrame: number = 0;

  constructor(frameWidth: number, frameHeight: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = frameWidth;
    this.canvas.height = frameHeight;
    this.ctx = this.canvas.getContext('2d')!;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
  }

  addFrame(image: CanvasImageSource, x: number, y: number): void {
    this.ctx.clearRect(0, 0, this.frameWidth, this.frameHeight);
    this.ctx.drawImage(image, -x, -y);
    this.frames.push(this.ctx.getImageData(0, 0, this.frameWidth, this.frameHeight));
  }

  getFrame(index: number): ImageData | null {
    if (index < 0 || index >= this.frames.length) return null;
    return this.frames[index];
  }

  getFrameCount(): number {
    return this.frames.length;
  }

  drawFrame(ctx: CanvasRenderingContext2D, x: number, y: number, frameIndex: number): void {
    const frame = this.getFrame(frameIndex);
    if (!frame) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.frameWidth;
    tempCanvas.height = this.frameHeight;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(frame, 0, 0);
    
    ctx.drawImage(tempCanvas, x, y);
  }

  nextFrame(): void {
    this.currentFrame = (this.currentFrame + 1) % this.frames.length;
  }

  reset(): void {
    this.currentFrame = 0;
  }

  setFrame(index: number): void {
    if (index >= 0 && index < this.frames.length) {
      this.currentFrame = index;
    }
  }

  getCurrentFrame(): number {
    return this.currentFrame;
  }

  toDataURL(type?: string): string {
    return this.canvas.toDataURL(type);
  }
}

export class Animation2D {
  private frames: ImageData[] = [];
  private currentFrame: number = 0;
  private isPlaying: boolean = false;
  private lastTime: number = 0;
  private frameDuration: number = 100;
  private loop: boolean = true;
  private onFrameChange?: (frame: number) => void;
  private onComplete?: () => void;
  private animationId: number | null = null;

  addFrame(imageData: ImageData): void {
    this.frames.push(imageData);
  }

  setFrameDuration(duration: number): void {
    this.frameDuration = duration;
  }

  setLoop(loop: boolean): void {
    this.loop = loop;
  }

  setOnFrameChange(callback: (frame: number) => void): void {
    this.onFrameChange = callback;
  }

  setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }

  play(): void {
    if (this.isPlaying || this.frames.length === 0) return;
    
    this.isPlaying = true;
    this.lastTime = performance.now();
    this.animate();
  }

  pause(): void {
    this.isPlaying = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  stop(): void {
    this.pause();
    this.currentFrame = 0;
  }

  private animate = (): void => {
    if (!this.isPlaying) return;
    
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;
    
    if (elapsed >= this.frameDuration) {
      this.lastTime = currentTime;
      this.currentFrame++;
      
      if (this.currentFrame >= this.frames.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.frames.length - 1;
          this.pause();
          this.onComplete?.();
          return;
        }
      }
      
      this.onFrameChange?.(this.currentFrame);
    }
    
    this.animationId = requestAnimationFrame(this.animate);
  };

  getCurrentFrame(): ImageData | null {
    if (this.frames.length === 0) return null;
    return this.frames[this.currentFrame];
  }

  setFrame(index: number): void {
    if (index >= 0 && index < this.frames.length) {
      this.currentFrame = index;
    }
  }

  getFrameCount(): number {
    return this.frames.length;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export default CanvasUtils2;
