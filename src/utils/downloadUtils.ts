export interface DownloadOptions {
  filename?: string;
  mimeType?: string;
  bom?: boolean;
  compress?: boolean;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type DownloadProgressCallback = (progress: DownloadProgress) => void;

export class DownloadUtils {
  static downloadString(
    content: string,
    filename: string,
    options: DownloadOptions = {}
  ): void {
    const mimeType = options.mimeType || 'text/plain';
    let finalContent = content;

    if (options.bom && mimeType.startsWith('text/')) {
      finalContent = '\ufeff' + content;
    }

    const blob = new Blob([finalContent], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  static downloadJSON(
    data: unknown,
    filename: string,
    pretty: boolean = true
  ): void {
    const content = JSON.stringify(data, null, pretty ? 2 : 0);
    this.downloadString(content, filename.replace(/\.json$/, '') + '.json', {
      mimeType: 'application/json'
    });
  }

  static downloadCSV(
    data: Record<string, unknown>[] | string[][],
    filename: string,
    options: {
      headers?: string[];
      delimiter?: string;
      includeHeaders?: boolean;
    } = {}
  ): void {
    const delimiter = options.delimiter || ',';
    let content = '';

    if (Array.isArray(data) && data.length > 0) {
      if (Array.isArray(data[0])) {
        if (options.includeHeaders !== false) {
          const firstRow = data[0] as string[];
          if (options.headers) {
            content += options.headers.join(delimiter) + '\n';
          } else {
            content += firstRow.join(delimiter) + '\n';
          }
        }
        data.forEach(row => {
          content += (row as string[]).join(delimiter) + '\n';
        });
      } else {
        if (options.headers) {
          content += options.headers.join(delimiter) + '\n';
        }

        const keys = options.headers || Object.keys(data[0] as Record<string, unknown>);
        if (!options.headers && data.length > 0) {
          content += keys.join(delimiter) + '\n';
        }

        (data as Record<string, unknown>[]).forEach(row => {
          content += keys.map(key => {
            const value = row[key];
            const stringValue = String(value ?? '');
            if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(delimiter) + '\n';
        });
      }
    }

    this.downloadString(content, filename.replace(/\.csv$/, '') + '.csv', {
      mimeType: 'text/csv',
      bom: true
    });
  }

  static downloadHTML(
    html: string,
    filename: string
  ): void {
    this.downloadString(html, filename.replace(/\.html?$/, '') + '.html', {
      mimeType: 'text/html'
    });
  }

  static downloadXML(
    xml: string,
    filename: string
  ): void {
    this.downloadString(xml, filename.replace(/\.xml$/, '') + '.xml', {
      mimeType: 'application/xml'
    });
  }

  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static downloadDataURL(dataURL: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static downloadURL(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static downloadImage(
    imageElement: HTMLImageElement | HTMLCanvasElement,
    filename: string,
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality: number = 0.92
  ): void {
    let dataURL: string;

    if (imageElement instanceof HTMLCanvasElement) {
      dataURL = imageElement.toDataURL(`image/${format}`, quality);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageElement, 0, 0);
        dataURL = canvas.toDataURL(`image/${format}`, quality);
      } else {
        dataURL = imageElement.src;
      }
    }

    const extension = format === 'jpeg' ? 'jpg' : format;
    this.downloadDataURL(dataURL, filename.replace(/\.[^.]+$/, '') + '.' + extension);
  }

  static async downloadFromFetch(
    url: string,
    filename: string,
    onProgress?: DownloadProgressCallback
  ): Promise<boolean> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('ReadableStream not supported');
      }

      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (onProgress && total > 0) {
          onProgress({
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100)
          });
        }
      }

      const blob = new Blob(chunks);
      this.downloadBlob(blob, filename);
      return true;
    } catch {
      return false;
    }
  }

  static downloadSVG(
    svgContent: string | SVGElement,
    filename: string
  ): void {
    let svgString: string;

    if (typeof svgContent === 'string') {
      svgString = svgContent;
    } else {
      svgString = new XMLSerializer().serializeToString(svgContent);
    }

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    this.downloadBlob(blob, filename.replace(/\.svg$/, '') + '.svg');
  }

  static downloadPDF(
    pdfContent: ArrayBuffer | Uint8Array,
    filename: string
  ): void {
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    this.downloadBlob(blob, filename.replace(/\.pdf$/, '') + '.pdf');
  }

  static downloadZip(
    files: { name: string; content: Blob | string }[],
    filename: string
  ): void {
    const zipContent = this.createZipContent(files);
    const blob = new Blob([zipContent], { type: 'application/zip' });
    this.downloadBlob(blob, filename.replace(/\.zip$/, '') + '.zip');
  }

  private static createZipContent(
    files: { name: string; content: Blob | string }[]
  ): ArrayBuffer {
    const parts: ArrayBuffer[] = [];
    const encoder = new TextEncoder();

    files.forEach((file, index) => {
      const nameBytes = encoder.encode(file.name);
      const nameLength = new Uint8Array(4);
      new DataView(nameLength.buffer).setUint32(0, nameBytes.length, true);
      parts.push(nameLength.buffer);

      parts.push(nameBytes.buffer);

      const content = typeof file.content === 'string'
        ? encoder.encode(file.content).buffer
        : file.content;

      const sizeArray = new Uint8Array(4);
      new DataView(sizeArray.buffer).setUint32(0, (content as ArrayBuffer).byteLength, true);
      parts.push(sizeArray.buffer);

      parts.push(content as ArrayBuffer);
    });

    const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    parts.forEach(part => {
      result.set(new Uint8Array(part), offset);
      offset += part.byteLength;
    });

    return result.buffer;
  }

  static downloadMultiple(
    files: { name: string; content: string | Blob }[],
    archiveName: string = 'download.zip'
  ): void {
    this.downloadZip(
      files.map(f => ({
        name: f.name,
        content: f.content instanceof Blob ? f.content : new Blob([f.content])
      })),
      archiveName
    );
  }

  static async downloadCanvas(
    canvas: HTMLCanvasElement,
    filename: string,
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality: number = 0.92
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) {
            this.downloadBlob(blob, filename);
            resolve();
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        `image/${format}`,
        quality
      );
    });
  }

  static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.slice(lastDot + 1).toLowerCase() : '';
  }

  static getMimeType(filename: string): string {
    const ext = this.getFileExtension(filename);
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'text/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'csv': 'text/csv'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

export class BatchDownloader {
  private queue: { url: string; filename: string }[] = [];
  private concurrentLimit: number;
  private activeDownloads: number = 0;
  private results: { filename: string; success: boolean; error?: string }[] = [];

  constructor(concurrentLimit: number = 3) {
    this.concurrentLimit = concurrentLimit;
  }

  add(url: string, filename: string): this {
    this.queue.push({ url, filename });
    return this;
  }

  async downloadAll(
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ filename: string; success: boolean; error?: string }[]> {
    this.results = [];
    const total = this.queue.length;
    let completed = 0;

    const processQueue = async (): Promise<void> => {
      while (this.queue.length > 0 && this.activeDownloads < this.concurrentLimit) {
        const item = this.queue.shift();
        if (!item) break;

        this.activeDownloads++;

        try {
          const success = await DownloadUtils.downloadFromFetch(item.url, item.filename);
          this.results.push({ filename: item.filename, success });
        } catch (error) {
          this.results.push({
            filename: item.filename,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        completed++;
        onProgress?.(completed, total);

        this.activeDownloads--;
        processQueue();
      }
    };

    await processQueue();

    while (this.activeDownloads > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.results;
  }

  clear(): void {
    this.queue = [];
    this.results = [];
  }

  size(): number {
    return this.queue.length;
  }
}

export class DownloadManager {
  private downloads: Map<string, {
    status: 'pending' | 'downloading' | 'completed' | 'failed';
    progress: number;
    error?: string;
  }> = new Map();

  registerDownload(id: string): void {
    this.downloads.set(id, { status: 'pending', progress: 0 });
  }

  startDownload(id: string): void {
    const download = this.downloads.get(id);
    if (download) {
      download.status = 'downloading';
    }
  }

  updateProgress(id: string, progress: number): void {
    const download = this.downloads.get(id);
    if (download) {
      download.progress = progress;
    }
  }

  completeDownload(id: string): void {
    const download = this.downloads.get(id);
    if (download) {
      download.status = 'completed';
      download.progress = 100;
    }
  }

  failDownload(id: string, error: string): void {
    const download = this.downloads.get(id);
    if (download) {
      download.status = 'failed';
      download.error = error;
    }
  }

  getStatus(id: string): { status: string; progress: number; error?: string } | undefined {
    const download = this.downloads.get(id);
    if (!download) return undefined;
    return {
      status: download.status,
      progress: download.progress,
      error: download.error
    };
  }

  removeDownload(id: string): void {
    this.downloads.delete(id);
  }

  clear(): void {
    this.downloads.clear();
  }

  getAllDownloads(): Map<string, { status: string; progress: number; error?: string }> {
    const result = new Map();
    this.downloads.forEach((value, key) => {
      result.set(key, {
        status: value.status,
        progress: value.progress,
        error: value.error
      });
    });
    return result;
  }
}

export default DownloadUtils;
