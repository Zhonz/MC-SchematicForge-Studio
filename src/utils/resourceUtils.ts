export interface Resource<T = unknown> {
  url: string;
  data?: T;
  status: 'loading' | 'loaded' | 'error';
  error?: Error;
}

export class ResourceManager {
  private cache: Map<string, Resource> = new Map();
  private loaders: Map<string, Promise<unknown>> = new Map();

  async load<T>(url: string, loader?: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(url);
    if (cached?.status === 'loaded' && cached.data !== undefined) {
      return cached.data as T;
    }

    const existingLoader = this.loaders.get(url);
    if (existingLoader) {
      return existingLoader as Promise<T>;
    }

    const resource: Resource<T> = { url, status: 'loading' };
    this.cache.set(url, resource as Resource);

    const loaderPromise = (loader || (() => fetch(url).then(r => r.json())))() as Promise<T>;
    this.loaders.set(url, loaderPromise as unknown as Promise<unknown>);

    try {
      const data = await loaderPromise;
      resource.status = 'loaded';
      resource.data = data;
      return data;
    } catch (error) {
      resource.status = 'error';
      resource.error = error as Error;
      throw error;
    } finally {
      this.loaders.delete(url);
    }
  }

  get(url: string): Resource | undefined {
    return this.cache.get(url);
  }

  has(url: string): boolean {
    return this.cache.has(url);
  }

  invalidate(url: string): void {
    this.cache.delete(url);
  }

  clear(): void {
    this.cache.clear();
    this.loaders.clear();
  }
}

export class ImageLoader {
  private cache: Map<string, HTMLImageElement> = new Map();

  async load(src: string): Promise<HTMLImageElement> {
    const cached = this.cache.get(src);
    if (cached) {
      return cached;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
  }

  preload(sources: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(sources.map(src => this.load(src)));
  }

  get(src: string): HTMLImageElement | undefined {
    return this.cache.get(src);
  }

  clear(): void {
    this.cache.clear();
  }
}

export class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private volume = 1;

  load(name: string, src: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(src);
      audio.oncanplaythrough = () => {
        this.sounds.set(name, audio);
        resolve(audio);
      };
      audio.onerror = () => {
        reject(new Error(`Failed to load audio: ${src}`));
      };
    });
  }

  play(name: string, options?: {
    loop?: boolean;
    volume?: number;
  }): HTMLAudioElement | undefined {
    const audio = this.sounds.get(name);
    if (audio) {
      if (options?.loop !== undefined) {
        audio.loop = options.loop;
      }
      if (options?.volume !== undefined) {
        audio.volume = options.volume * this.volume;
      } else {
        audio.volume = this.volume;
      }
      audio.play().catch(() => {});
      return audio;
    }
    return undefined;
  }

  stop(name: string): void {
    const audio = this.sounds.get(name);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  stopAll(): void {
    this.sounds.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  getVolume(): number {
    return this.volume;
  }
}

export class Preloader {
  private queue: Array<() => Promise<void>> = [];
  private loaded = 0;
  private total = 0;
  private progressCallback?: (progress: number) => void;

  add(loader: () => Promise<void>): void {
    this.queue.push(loader);
    this.total++;
  }

  onProgress(callback: (progress: number) => void): void {
    this.progressCallback = callback;
  }

  async load(): Promise<void> {
    const promises = this.queue.map(loader => loader());
    await Promise.all(promises);
  }

  async loadWithProgress(): Promise<void> {
    for (const loader of this.queue) {
      await loader();
      this.loaded++;
      if (this.progressCallback) {
        this.progressCallback(this.loaded / this.total);
      }
    }
  }

  getProgress(): number {
    return this.total > 0 ? this.loaded / this.total : 0;
  }

  reset(): void {
    this.queue = [];
    this.loaded = 0;
    this.total = 0;
  }
}

export class TexturePool {
  private pool: Map<string, HTMLCanvasElement> = new Map();
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  get(key: string): HTMLCanvasElement | undefined {
    return this.pool.get(key);
  }

  set(key: string, canvas: HTMLCanvasElement): void {
    if (this.pool.size >= this.maxSize) {
      const firstKey = this.pool.keys().next().value;
      if (firstKey) {
        this.pool.delete(firstKey);
      }
    }
    this.pool.set(key, canvas);
  }

  has(key: string): boolean {
    return this.pool.has(key);
  }

  clear(): void {
    this.pool.clear();
  }
}

export class ObjectPool<T extends object> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private reset?: (obj: T) => void;

  constructor(factory: () => T, reset?: (obj: T) => void, initialSize = 0) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  acquire(): T {
    let obj: T;
    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else {
      obj = this.factory();
    }
    this.inUse.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      if (this.reset) {
        this.reset(obj);
      }
      this.available.push(obj);
    }
  }

  releaseAll(): void {
    for (const obj of this.inUse) {
      if (this.reset) {
        this.reset(obj);
      }
      this.available.push(obj);
    }
    this.inUse.clear();
  }

  getAvailableCount(): number {
    return this.available.length;
  }

  getInUseCount(): number {
    return this.inUse.size;
  }
}
