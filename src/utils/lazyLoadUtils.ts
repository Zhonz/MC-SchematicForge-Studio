export interface LazyLoadOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  loadOnce?: boolean;
}

export class LazyLoadUtils {
  static observe(
    elements: HTMLElement[],
    callback: (element: HTMLElement) => void,
    options: LazyLoadOptions = {}
  ): () => void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            callback(element);

            if (options.loadOnce !== false) {
              observer.unobserve(element);
            }
          }
        });
      },
      {
        root: options.root || null,
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0
      }
    );

    elements.forEach(element => observer.observe(element));

    return () => observer.disconnect();
  }

  static observeSingle(
    element: HTMLElement,
    callback: () => void,
    options: IntersectionObserverInit = {}
  ): () => void {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          callback();
          observer.disconnect();
        }
      },
      options
    );

    observer.observe(element);

    return () => observer.disconnect();
  }
}

export class ImageLazyLoader {
  private observer: IntersectionObserver;
  private loadedImages: Set<string> = new Set();
  private options: IntersectionObserverInit;

  constructor(options: IntersectionObserverInit = {}) {
    this.options = {
      rootMargin: '50px 0px',
      threshold: 0,
      ...options
    };

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    );
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadImage(img);
        this.observer.unobserve(img);
      }
    });
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src || img.dataset.original || img.getAttribute('data-lazy');

    if (!src || this.loadedImages.has(src)) return;

    const tempImg = new Image();

    tempImg.onload = () => {
      img.src = src;
      img.classList.add('lazy-loaded');
      img.classList.remove('lazy-loading');
      this.loadedImages.add(src);
      this.dispatchEvent(img, 'lazyloaded');
    };

    tempImg.onerror = () => {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
      this.dispatchEvent(img, 'lazyerror');
    };

    img.classList.add('lazy-loading');
    tempImg.src = src;
  }

  private dispatchEvent(element: HTMLElement, eventName: string): void {
    element.dispatchEvent(new CustomEvent(eventName, { bubbles: true }));
  }

  observe(element: HTMLElement): void {
    this.observer.observe(element);
  }

  observeAll(elements: HTMLElement[]): void {
    elements.forEach(el => this.observe(el));
  }

  unobserve(element: HTMLElement): void {
    this.observer.unobserve(element);
  }

  disconnect(): void {
    this.observer.disconnect();
  }
}

export class ComponentLazyLoader {
  private loadedComponents: Map<string, unknown> = new Map();
  private loadingPromises: Map<string, Promise<unknown>> = new Map();

  async load<T>(componentId: string, loader: () => Promise<T>): Promise<T> {
    if (this.loadedComponents.has(componentId)) {
      return this.loadedComponents.get(componentId) as T;
    }

    if (this.loadingPromises.has(componentId)) {
      return this.loadingPromises.get(componentId) as Promise<T>;
    }

    const promise = loader().then(component => {
      this.loadedComponents.set(componentId, component);
      this.loadingPromises.delete(componentId);
      return component;
    });

    this.loadingPromises.set(componentId, promise as Promise<unknown>);

    return promise;
  }

  isLoaded(componentId: string): boolean {
    return this.loadedComponents.has(componentId);
  }

  isLoading(componentId: string): boolean {
    return this.loadingPromises.has(componentId);
  }

  unload(componentId: string): void {
    this.loadedComponents.delete(componentId);
  }

  clear(): void {
    this.loadedComponents.clear();
    this.loadingPromises.clear();
  }
}

export class ScriptLoader {
  private loadedScripts: Set<string> = new Set();
  private loadingScripts: Map<string, Promise<HTMLScriptElement>> = new Map();

  async load(src: string, options: {
    async?: boolean;
    defer?: boolean;
    id?: string;
    type?: string;
  } = {}): Promise<HTMLScriptElement> {
    if (this.loadedScripts.has(src)) {
      const existing = document.querySelector(`script[src="${src}"]`);
      return existing as HTMLScriptElement;
    }

    if (this.loadingScripts.has(src)) {
      return this.loadingScripts.get(src) as Promise<HTMLScriptElement>;
    }

    const promise = new Promise<HTMLScriptElement>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = options.async ?? false;
      script.defer = options.defer ?? true;

      if (options.id) script.id = options.id;
      if (options.type) script.type = options.type;

      script.onload = () => {
        this.loadedScripts.add(src);
        this.loadingScripts.delete(src);
        resolve(script);
      };

      script.onerror = () => {
        this.loadingScripts.delete(src);
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });

    this.loadingScripts.set(src, promise as Promise<HTMLScriptElement>);

    return promise;
  }

  async loadMultiple(scripts: string[]): Promise<HTMLScriptElement[]> {
    return Promise.all(scripts.map(src => this.load(src)));
  }

  isLoaded(src: string): boolean {
    return this.loadedScripts.has(src);
  }

  isLoading(src: string): boolean {
    return this.loadingScripts.has(src);
  }
}

export class StyleLoader {
  private loadedStyles: Set<string> = new Set();
  private loadingStyles: Map<string, Promise<HTMLLinkElement>> = new Map();

  async load(href: string, options: {
    id?: string;
    media?: string;
    rel?: string;
  } = {}): Promise<HTMLLinkElement> {
    if (this.loadedStyles.has(href)) {
      const existing = document.querySelector(`link[href="${href}"]`);
      return existing as HTMLLinkElement;
    }

    if (this.loadingStyles.has(href)) {
      return this.loadingStyles.get(href) as Promise<HTMLLinkElement>;
    }

    const promise = new Promise<HTMLLinkElement>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = options.rel || 'stylesheet';
      link.href = href;

      if (options.id) link.id = options.id;
      if (options.media) link.media = options.media;

      link.onload = () => {
        this.loadedStyles.add(href);
        this.loadingStyles.delete(href);
        resolve(link);
      };

      link.onerror = () => {
        this.loadingStyles.delete(href);
        reject(new Error(`Failed to load stylesheet: ${href}`));
      };

      document.head.appendChild(link);
    });

    this.loadingStyles.set(href, promise as Promise<HTMLLinkElement>);

    return promise;
  }

  async loadMultiple(styles: string[]): Promise<HTMLLinkElement[]> {
    return Promise.all(styles.map(href => this.load(href)));
  }

  isLoaded(href: string): boolean {
    return this.loadedStyles.has(href);
  }

  inject(css: string, options: {
    id?: string;
    media?: string;
  } = {}): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = css;

    if (options.id) style.id = options.id;
    if (options.media) style.media = options.media;

    document.head.appendChild(style);
    return style;
  }
}

export class DataLazyLoader<T> {
  private cache: Map<string, T> = new Map();
  private pending: Map<string, Promise<T>> = new Map();
  private maxCacheSize: number;

  constructor(maxCacheSize: number = 100) {
    this.maxCacheSize = maxCacheSize;
  }

  async load(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    const promise = fetcher().then(data => {
      this.cache.set(key, data);
      this.pending.delete(key);

      if (this.cache.size > this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }

      return data;
    });

    this.pending.set(key, promise as Promise<T>);

    return promise;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: T): void {
    this.cache.set(key, value);
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.pending.clear();
  }
}

export default LazyLoadUtils;
