export interface ResourceLoaderOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onProgress?: (loaded: number, total: number) => void;
}

export class ResourceLoader {
  private cache: Map<string, unknown> = new Map();
  private loading: Map<string, Promise<unknown>> = new Map();
  private options: Required<ResourceLoaderOptions>;

  constructor(options: ResourceLoaderOptions = {}) {
    this.options = {
      timeout: options.timeout ?? 30000,
      retries: options.retries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      onProgress: options.onProgress ?? (() => {}),
    };
  }

  async loadImage(url: string): Promise<HTMLImageElement> {
    const cached = this.cache.get(url) as HTMLImageElement | undefined;
    if (cached) return cached;
    const existing = this.loading.get(url) as Promise<HTMLImageElement> | undefined;
    if (existing) return existing;
    const promise = this.loadImageWithRetry(url);
    this.loading.set(url, promise as unknown as Promise<unknown>);
    try {
      const result = await promise;
      this.cache.set(url, result);
      this.loading.delete(url);
      return result;
    } catch (error) {
      this.loading.delete(url);
      throw error;
    }
  }

  private async loadImageWithRetry(url: string, attempt: number = 0): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        if (attempt < this.options.retries) {
          setTimeout(() => {
            this.loadImageWithRetry(url, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, this.options.retryDelay);
        } else {
          reject(new Error(`Failed to load image: ${url}`));
        }
      }, this.options.timeout);
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        if (attempt < this.options.retries) {
          setTimeout(() => {
            this.loadImageWithRetry(url, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, this.options.retryDelay);
        } else {
          reject(new Error(`Failed to load image: ${url}`));
        }
      };
      img.src = url;
    });
  }

  async loadJSON<T>(url: string): Promise<T> {
    const cached = this.cache.get(url) as T | undefined;
    if (cached) return cached;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${url}`);
    }
    const data = await response.json();
    this.cache.set(url, data);
    return data;
  }

  async loadText(url: string): Promise<string> {
    const cached = this.cache.get(url) as string | undefined;
    if (cached) return cached;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load text: ${url}`);
    }
    const text = await response.text();
    this.cache.set(url, text);
    return text;
  }

  async loadArrayBuffer(url: string): Promise<ArrayBuffer> {
    const cached = this.cache.get(url) as ArrayBuffer | undefined;
    if (cached) return cached;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ArrayBuffer: ${url}`);
    }
    const buffer = await response.arrayBuffer();
    this.cache.set(url, buffer);
    return buffer;
  }

  async loadMultiple(urls: string[], type: 'image' | 'json' | 'text' | 'arraybuffer'): Promise<unknown[]> {
    const promises = urls.map((url) => {
      switch (type) {
        case 'image':
          return this.loadImage(url);
        case 'json':
          return this.loadJSON(url);
        case 'text':
          return this.loadText(url);
        case 'arraybuffer':
          return this.loadArrayBuffer(url);
      }
    });
    return Promise.all(promises);
  }

  preload(urls: string[], type: 'image' | 'json' | 'text' | 'arraybuffer'): void {
    this.loadMultiple(urls, type).catch(() => {});
  }

  getCached<T>(url: string): T | undefined {
    return this.cache.get(url) as T | undefined;
  }

  clearCache(): void {
    this.cache.clear();
  }

  remove(url: string): void {
    this.cache.delete(url);
  }
}

export const resourceLoader = new ResourceLoader();
