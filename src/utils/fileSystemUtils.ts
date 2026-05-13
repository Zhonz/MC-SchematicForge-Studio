export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
}

export interface DownloadOptions {
  filename?: string;
  type?: string;
}

export class FileSystemUtils {
  static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  static async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  static async readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static download(data: string | Blob | ArrayBuffer, options?: DownloadOptions): void {
    let blob: Blob;
    if (typeof data === 'string') {
      blob = new Blob([data], { type: options?.type || 'text/plain' });
    } else if (data instanceof ArrayBuffer) {
      blob = new Blob([data], { type: options?.type || 'application/octet-stream' });
    } else {
      blob = data;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = options?.filename || 'download';
    link.click();
    URL.revokeObjectURL(url);
  }

  static async selectFile(accept?: string): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (accept) input.accept = accept;
      
      input.onchange = () => {
        resolve(input.files?.[0] || null);
      };
      
      input.click();
    });
  }

  static async selectMultipleFiles(accept?: string): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      if (accept) input.accept = accept;
      
      input.onchange = () => {
        resolve(Array.from(input.files || []));
      };
      
      input.click();
    });
  }

  static getFileInfo(file: File): FileInfo {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
    };
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.slice(lastDot + 1).toLowerCase();
  }

  static getFileNameWithoutExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? filename : filename.slice(0, lastDot);
  }

  static isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  static isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }

  static isAudioFile(file: File): boolean {
    return file.type.startsWith('audio/');
  }

  static isTextFile(file: File): boolean {
    const textTypes = [
      'text/',
      'application/json',
      'application/xml',
      'application/javascript',
      'text/javascript',
      'text/css',
      'text/html',
    ];
    return textTypes.some(type => file.type.startsWith(type));
  }

  static async zipFiles(files: File[]): Promise<Blob> {
    // 简单实现，返回第一个文件
    if (files.length > 0) {
      return files[0];
    }
    return new Blob();
  }

  static async unzipFile(file: File): Promise<Record<string, Blob>> {
    // 简单实现，返回单个文件
    return {
      [file.name]: file,
    };
  }

  static createFile(data: string | Blob | ArrayBuffer, filename: string, type?: string): File {
    let blob: Blob;
    if (typeof data === 'string') {
      blob = new Blob([data], { type: type || 'text/plain' });
    } else if (data instanceof ArrayBuffer) {
      blob = new Blob([data], { type: type || 'application/octet-stream' });
    } else {
      blob = data;
    }
    
    return new File([blob], filename, { type: blob.type });
  }

  static async fileToBase64(file: File): Promise<string> {
    const dataURL = await FileSystemUtils.readFileAsDataURL(file);
    return dataURL.split(',')[1];
  }

  static base64ToFile(base64: string, filename: string, type?: string): File {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new File([bytes], filename, { type: type || 'application/octet-stream' });
  }

  static async dragAndDrop(element: HTMLElement, options?: {
    onDrop?: (files: File[]) => void;
    onDragOver?: () => void;
    onDragLeave?: () => void;
  }): Promise<void> {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      options?.onDragOver?.();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      options?.onDragLeave?.();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const files = Array.from(e.dataTransfer?.files || []);
      options?.onDrop?.(files);
      options?.onDragLeave?.();
    };

    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);
  }
}

export default FileSystemUtils;
