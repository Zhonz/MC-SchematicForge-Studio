export interface LazyLoadOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  loadOnce?: boolean;
}

export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private loadedElements: Set<Element> = new Set();
  private options: LazyLoadOptions;

  constructor(options: LazyLoadOptions = {}) {
    this.options = {
      root: options.root ?? null,
      rootMargin: options.rootMargin ?? '50px',
      threshold: options.threshold ?? 0,
      loadOnce: options.loadOnce ?? true,
    };
  }

  observe(
    element: Element,
    callback: (element: Element) => void
  ): void {
    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target;
              if (this.options.loadOnce && this.loadedElements.has(el)) {
                return;
              }
              callback(el);
              if (this.options.loadOnce) {
                this.loadedElements.add(el);
                this.observer?.unobserve(el);
              }
            }
          });
        },
        {
          root: this.options.root,
          rootMargin: this.options.rootMargin,
          threshold: this.options.threshold,
        }
      );
    }
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    this.observer?.unobserve(element);
  }

  disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.loadedElements.clear();
  }

  static loadImage(element: HTMLImageElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        element.src = src;
        element.classList.remove('lazy-loading');
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  static loadBackground(element: HTMLElement, imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        element.style.backgroundImage = `url(${imageUrl})`;
        resolve();
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }
}

export function createLazyImage(
  src: string,
  placeholder?: string,
  options?: LazyLoadOptions
): HTMLImageElement {
  const img = document.createElement('img');
  if (placeholder) {
    img.src = placeholder;
    img.classList.add('lazy-loading');
  }
  const loader = new LazyLoader(options);
  loader.observe(img, () => {
    LazyLoader.loadImage(img, src).catch(() => {});
  });
  return img;
}

export function lazy(value: () => unknown): () => unknown {
  let result: unknown;
  let loaded = false;
  return () => {
    if (!loaded) {
      result = value();
      loaded = true;
    }
    return result;
  };
}

export function lazyAsync<T>(fn: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null;
  return () => {
    if (!promise) {
      promise = fn();
    }
    return promise;
  };
}
