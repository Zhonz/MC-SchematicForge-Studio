export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  extension: string;
}

export interface FileReaderOptions {
  encoding?: string;
  mimeType?: string;
}

export interface FileFilter {
  extensions?: string[];
  maxSize?: number;
  minSize?: number;
  types?: string[];
}

export class FileUtils2 {
  static getFileInfo(file: File): FileInfo {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
      extension: this.getExtension(file.name)
    };
  }

  static getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.slice(lastDot + 1).toLowerCase() : '';
  }

  static getNameWithoutExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.slice(0, lastDot) : filename;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  static async readAsText(file: File, encoding: string = 'UTF-8'): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, encoding);
    });
  }

  static async readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  static async readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  static async readAsBinaryString(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsBinaryString(file);
    });
  }

  static filterFiles(files: File[], filter: FileFilter): File[] {
    return files.filter(file => {
      if (filter.extensions?.length) {
        const ext = this.getExtension(file.name);
        if (!filter.extensions.includes(ext)) return false;
      }
      if (filter.maxSize && file.size > filter.maxSize) return false;
      if (filter.minSize && file.size < filter.minSize) return false;
      if (filter.types?.length) {
        const mainType = file.type.split('/')[0];
        const subType = file.type.split('/')[1];
        if (!filter.types.includes(file.type) &&
            !filter.types.includes(mainType) &&
            !filter.types.includes(subType)) {
          return false;
        }
      }
      return true;
    });
  }

  static async createImageThumbnail(
    file: File,
    maxWidth: number = 200,
    maxHeight: number = 200
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
        
        URL.revokeObjectURL(url);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  static downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
    const blob = content instanceof Blob ? content : new Blob([content], { 
      type: mimeType || 'application/octet-stream' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static downloadDataURL(dataURL: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static async uploadFiles(
    inputElement: HTMLInputElement,
    options?: {
      multiple?: boolean;
      accept?: string | string[];
      filter?: FileFilter;
    }
  ): Promise<File[]> {
    return new Promise((resolve) => {
      const handler = () => {
        let files = Array.from(inputElement.files || []);
        
        if (options?.filter) {
          files = this.filterFiles(files, options.filter);
        }
        
        resolve(files);
        inputElement.removeEventListener('change', handler);
      };
      
      inputElement.addEventListener('change', handler);
      inputElement.click();
    });
  }

  static async dragAndDrop(
    element: HTMLElement,
    onFiles: (files: File[]) => void,
    options?: {
      filter?: FileFilter;
      onDragOver?: (e: DragEvent) => void;
      onDragLeave?: (e: DragEvent) => void;
    }
  ): Promise<() => void> {
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove('drag-over');
      
      let files = Array.from(e.dataTransfer?.files || []);
      
      if (options?.filter) {
        files = this.filterFiles(files, options.filter);
      }
      
      onFiles(files);
    };
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.add('drag-over');
      options?.onDragOver?.(e);
    };
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove('drag-over');
      options?.onDragLeave?.(e);
    };
    
    element.addEventListener('drop', handleDrop);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragleave', handleDragLeave);
    
    return () => {
      element.removeEventListener('drop', handleDrop);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('dragleave', handleDragLeave);
    };
  }

  static validateFileType(file: File, allowedTypes: string[]): boolean {
    const fileType = file.type;
    const fileExt = this.getExtension(file.name);
    
    return allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return `.${fileExt}` === type.toLowerCase();
      }
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.slice(0, -1));
      }
      return fileType === type;
    });
  }

  static getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'text/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'avi': 'video/x-msvideo',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  static async compareFiles(file1: File, file2: File): Promise<boolean> {
    if (file1.size !== file2.size) return false;
    
    const buffer1 = await this.readAsArrayBuffer(file1);
    const buffer2 = await this.readAsArrayBuffer(file2);
    
    const view1 = new Uint8Array(buffer1);
    const view2 = new Uint8Array(buffer2);
    
    if (view1.length !== view2.length) return false;
    
    for (let i = 0; i < view1.length; i++) {
      if (view1[i] !== view2[i]) return false;
    }
    
    return true;
  }

  static splitFilename(filename: string): { name: string; extension: string } {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) {
      return { name: filename, extension: '' };
    }
    return {
      name: filename.slice(0, lastDot),
      extension: filename.slice(lastDot + 1)
    };
  }

  static sanitizeFilename(filename: string): string {
    return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
  }

  static generateUniqueFilename(
    filename: string,
    existingFiles: string[]
  ): string {
    const { name, extension } = this.splitFilename(filename);
    let counter = 1;
    let newFilename = filename;
    
    while (existingFiles.includes(newFilename)) {
      newFilename = extension 
        ? `${name}_${counter}.${extension}` 
        : `${name}_${counter}`;
      counter++;
    }
    
    return newFilename;
  }
}

export class DirectoryReader {
  private entries: FileSystemEntry[] = [];
  private currentIndex = 0;

  constructor(entries: FileSystemEntry[]) {
    this.entries = entries;
  }

  async readAll(): Promise<File[]> {
    const files: File[] = [];
    
    for (const entry of this.entries) {
      if (entry.isFile) {
        const file = await this.readFile(entry as FileSystemFileEntry);
        files.push(file);
      } else if (entry.isDirectory) {
        const dirFiles = await this.readDirectory(entry as FileSystemDirectoryEntry);
        files.push(...dirFiles);
      }
    }
    
    return files;
  }

  private readFile(entry: FileSystemFileEntry): Promise<File> {
    return new Promise((resolve, reject) => {
      entry.file(resolve, reject);
    });
  }

  private async readDirectory(entry: FileSystemDirectoryEntry): Promise<File[]> {
    const reader = entry.createReader();
    const files: File[] = [];
    
    const readEntries = (): Promise<FileSystemEntry[]> => {
      return new Promise((resolve) => {
        reader.readEntries(resolve);
      });
    };
    
    let entries = await readEntries();
    while (entries.length > 0) {
      for (const e of entries) {
        if (e.isFile) {
          const file = await this.readFile(e as FileSystemFileEntry);
          files.push(file);
        }
      }
      entries = await readEntries();
    }
    
    return files;
  }
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

export function isAudioFile(file: File): boolean {
  return file.type.startsWith('audio/');
}

export function isTextFile(file: File): boolean {
  return file.type.startsWith('text/') || 
         file.type === 'application/json' ||
         file.type === 'application/javascript' ||
         file.type === 'application/xml';
}

export default FileUtils2;
