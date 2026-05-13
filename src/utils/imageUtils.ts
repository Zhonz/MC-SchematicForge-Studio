export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageCropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  quality?: number;
}

export interface ImageFormat {
  type: 'jpeg' | 'png' | 'webp' | 'gif';
  quality?: number;
}

export class ImageUtils {
  static async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  static async getImageDimensions(src: string): Promise<ImageDimensions> {
    const img = await this.loadImage(src);
    return { width: img.naturalWidth, height: img.naturalHeight };
  }

  static async loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image from file'));
      img.src = URL.createObjectURL(file);
    });
  }

  static async resize(
    imageSrc: string,
    options: ImageResizeOptions
  ): Promise<string> {
    const img = await this.loadImage(imageSrc);
    return this.resizeImageElement(img, options);
  }

  static async resizeFile(
    file: File,
    options: ImageResizeOptions
  ): Promise<string> {
    const img = await this.loadImageFromFile(file);
    return this.resizeImageElement(img, options);
  }

  private static resizeImageElement(
    img: HTMLImageElement,
    options: ImageResizeOptions
  ): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    let { width, height } = img;
    const aspectRatio = width / height;

    if (options.maintainAspectRatio !== false) {
      if (options.width && !options.height) {
        height = width / aspectRatio;
      } else if (options.height && !options.width) {
        width = height * aspectRatio;
      }
    } else {
      width = options.width || width;
      height = options.height || height;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    const quality = options.quality ?? 0.92;
    return canvas.toDataURL('image/jpeg', quality);
  }

  static async crop(
    imageSrc: string,
    cropOptions: ImageCropOptions
  ): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = cropOptions.width;
    canvas.height = cropOptions.height;

    ctx.drawImage(
      img,
      cropOptions.x,
      cropOptions.y,
      cropOptions.width,
      cropOptions.height,
      0,
      0,
      cropOptions.width,
      cropOptions.height
    );

    return canvas.toDataURL('image/png');
  }

  static async rotate(
    imageSrc: string,
    degrees: number
  ): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const radians = (degrees * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));

    let width: number, height: number;
    if (degrees === 90 || degrees === 270) {
      width = img.height;
      height = img.width;
    } else {
      width = img.width;
      height = img.height;
    }

    canvas.width = width;
    canvas.height = height;

    ctx.translate(width / 2, height / 2);
    ctx.rotate(radians);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    return canvas.toDataURL('image/png');
  }

  static async flip(
    imageSrc: string,
    horizontal: boolean = true
  ): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = img.width;
    canvas.height = img.height;

    if (horizontal) {
      ctx.translate(img.width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, img.height);
      ctx.scale(1, -1);
    }

    ctx.drawImage(img, 0, 0);

    return canvas.toDataURL('image/png');
  }

  static async adjustBrightness(
    imageSrc: string,
    brightness: number
  ): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] + brightness));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness));
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
  }

  static async adjustContrast(
    imageSrc: string,
    contrast: number
  ): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
  }

  static async grayscale(imageSrc: string): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
  }

  static async invert(imageSrc: string): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
  }

  static async blur(
    imageSrc: string,
    radius: number = 5
  ): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(img, 0, 0);

    return canvas.toDataURL('image/png');
  }

  static async toSepia(imageSrc: string): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
  }

  static async createThumbnail(
    imageSrc: string,
    maxSize: number = 150
  ): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const maxDim = Math.max(img.width, img.height);
    const scale = maxSize / maxDim;
    const width = img.width * scale;
    const height = img.height * scale;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', 0.7);
  }

  static async convertFormat(
    imageSrc: string,
    format: ImageFormat
  ): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const mimeType = `image/${format.type}`;
    const quality = format.quality ?? 0.92;

    return canvas.toDataURL(mimeType, quality);
  }

  static async compress(
    imageSrc: string,
    quality: number = 0.8
  ): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    return canvas.toDataURL('image/jpeg', quality);
  }

  static async addWatermark(
    imageSrc: string,
    watermarkText: string,
    options?: {
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
      fontSize?: number;
      fontColor?: string;
      opacity?: number;
    }
  ): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const fontSize = options?.fontSize ?? Math.floor(img.width / 20);
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = options?.fontColor ?? 'rgba(255, 255, 255, 0.5)';
    ctx.globalAlpha = options?.opacity ?? 0.5;

    const textWidth = ctx.measureText(watermarkText).width;
    const padding = 20;

    let x: number, y: number;
    const position = options?.position ?? 'bottom-right';

    switch (position) {
      case 'top-left':
        x = padding;
        y = padding + fontSize;
        break;
      case 'top-right':
        x = canvas.width - textWidth - padding;
        y = padding + fontSize;
        break;
      case 'bottom-left':
        x = padding;
        y = canvas.height - padding;
        break;
      case 'bottom-right':
        x = canvas.width - textWidth - padding;
        y = canvas.height - padding;
        break;
      case 'center':
      default:
        x = (canvas.width - textWidth) / 2;
        y = canvas.height / 2;
        break;
    }

    ctx.fillText(watermarkText, x, y);

    return canvas.toDataURL('image/png');
  }

  static async getDominantColors(
    imageSrc: string,
    colorCount: number = 5
  ): Promise<string[]> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const sampleSize = 100;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const pixels: [number, number, number][] = [];

    for (let i = 0; i < imageData.data.length; i += 4) {
      pixels.push([
        imageData.data[i],
        imageData.data[i + 1],
        imageData.data[i + 2]
      ]);
    }

    const colorMap = new Map<string, number>();
    pixels.forEach(([r, g, b]) => {
      const quantR = Math.floor(r / 32) * 32;
      const quantG = Math.floor(g / 32) * 32;
      const quantB = Math.floor(b / 32) * 32;
      const key = `${quantR},${quantG},${quantB}`;
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    });

    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, colorCount)
      .map(([color]) => {
        const [r, g, b] = color.split(',').map(Number);
        return `rgb(${r}, ${g}, ${b})`;
      });

    return sortedColors;
  }

  static async detectFaces(imageSrc: string): Promise<DOMRect[]> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve([]);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const faces: DOMRect[] = [];

        if ('faceDetector' in window) {
          try {
            // @ts-ignore
            const detector = new window.faceDetector({ fastMode: true });
            const faceList = await detector.detect(img);
            faceList.forEach((face: { boundingBox: DOMRectReadOnly }) => {
              faces.push(face.boundingBox as DOMRect);
            });
          } catch {
            resolve(faces);
          }
        } else {
          resolve(faces);
        }
      };

      img.onerror = () => resolve([]);
      img.src = imageSrc;
    });
  }

  static dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  static blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export class SpriteSheetGenerator {
  private images: HTMLImageElement[] = [];
  private frames: { x: number; y: number; width: number; height: number }[] = [];
  private columns: number;

  constructor(columns: number = 4) {
    this.columns = columns;
  }

  addFrame(image: HTMLImageElement): void {
    this.images.push(image);
    this.frames.push({
      x: 0,
      y: 0,
      width: image.width,
      height: image.height
    });
  }

  async generate(frameWidth: number, frameHeight: number): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const rows = Math.ceil(this.images.length / this.columns);
    canvas.width = frameWidth * this.columns;
    canvas.height = frameHeight * rows;

    this.images.forEach((img, index) => {
      const col = index % this.columns;
      const row = Math.floor(index / this.columns);
      const x = col * frameWidth;
      const y = row * frameHeight;

      ctx.drawImage(img, x, y, frameWidth, frameHeight);

      this.frames[index] = { x, y, width: frameWidth, height: frameHeight };
    });

    return canvas.toDataURL('image/png');
  }

  getFrameCoordinates(index: number): { x: number; y: number; width: number; height: number } | null {
    return this.frames[index] || null;
  }

  get totalFrames(): number {
    return this.images.length;
  }
}

export async function extractImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  type: string;
  size: number;
  name: string;
}> {
  const img = await ImageUtils.loadImageFromFile(file);
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    type: file.type,
    size: file.size,
    name: file.name
  };
}

export default ImageUtils;
