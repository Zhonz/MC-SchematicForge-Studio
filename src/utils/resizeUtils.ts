export interface Size {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Dimension {
  width: number;
  height: number;
  innerWidth?: number;
  innerHeight?: number;
  outerWidth?: number;
  outerHeight?: number;
}

export interface ResizeCallback {
  (size: Size, previousSize: Size, event: UIEvent): void;
}

export interface Breakpoint {
  name: string;
  minWidth?: number;
  maxWidth?: number;
  callback?: () => void;
}

export class ResizeUtils {
  private static instance: ResizeUtils;
  private resizeObservers: Map<HTMLElement, ResizeObserver> = new Map();
  private breakpointObservers: Map<string, MediaQueryList> = new Map();
  private lastWindowSize: Size = { width: 0, height: 0 };

  static getInstance(): ResizeUtils {
    if (!ResizeUtils.instance) {
      ResizeUtils.instance = new ResizeUtils();
    }
    return ResizeUtils.instance;
  }

  static getWindowSize(): Size {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  static getDocumentSize(): Size {
    const body = document.body;
    const html = document.documentElement;
    
    return {
      width: Math.max(
        body.scrollWidth,
        body.offsetWidth,
        html.clientWidth,
        html.scrollWidth,
        html.offsetWidth
      ),
      height: Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      ),
    };
  }

  static getElementSize(element: HTMLElement): Size {
    return {
      width: element.offsetWidth,
      height: element.offsetHeight,
    };
  }

  static getElementInnerSize(element: HTMLElement): Size {
    return {
      width: element.clientWidth,
      height: element.clientHeight,
    };
  }

  static getElementOuterSize(element: HTMLElement, includeMargin = false): Size {
    const rect = element.getBoundingClientRect();
    
    if (includeMargin) {
      return {
        width: rect.width + 
               parseFloat(getComputedStyle(element).marginLeft || '0') +
               parseFloat(getComputedStyle(element).marginRight || '0'),
        height: rect.height +
                parseFloat(getComputedStyle(element).marginTop || '0') +
                parseFloat(getComputedStyle(element).marginBottom || '0'),
      };
    }
    
    return {
      width: rect.width,
      height: rect.height,
    };
  }

  static getAspectRatio(element: HTMLElement): number {
    const size = ResizeUtils.getElementSize(element);
    return size.width / size.height;
  }

  static isLandscape(element?: HTMLElement): boolean {
    const size = element 
      ? ResizeUtils.getElementSize(element) 
      : ResizeUtils.getWindowSize();
    return size.width > size.height;
  }

  static isPortrait(element?: HTMLElement): boolean {
    return !ResizeUtils.isLandscape(element);
  }

  static isSquare(element: HTMLElement, tolerance = 0.01): boolean {
    const size = ResizeUtils.getElementSize(element);
    const ratio = size.width / size.height;
    return Math.abs(ratio - 1) <= tolerance;
  }

  static getBreakpoint(): string {
    const width = window.innerWidth;
    
    if (width < 576) return 'xs';
    if (width < 768) return 'sm';
    if (width < 992) return 'md';
    if (width < 1200) return 'lg';
    if (width < 1400) return 'xl';
    return 'xxl';
  }

  static getBreakpointValue(): number {
    return window.innerWidth;
  }

  static isBreakpoint(breakpoint: string): boolean {
    const current = ResizeUtils.getBreakpoint();
    return current === breakpoint;
  }

  static isAboveBreakpoint(breakpoint: string): boolean {
    const breakpoints: Record<string, number> = {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400,
    };
    
    return window.innerWidth >= breakpoints[breakpoint];
  }

  static isBelowBreakpoint(breakpoint: string): boolean {
    return !ResizeUtils.isAboveBreakpoint(breakpoint);
  }

  static observeElement(
    element: HTMLElement,
    callback: ResizeCallback
  ): () => void {
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const newSize: Size = {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        };
        
        const oldSize: Size = {
          width: entry.borderBoxSize?.[0]?.inlineSize || element.offsetWidth,
          height: entry.borderBoxSize?.[0]?.blockSize || element.offsetHeight,
        };
        
        callback(newSize, oldSize, entry.target as unknown as UIEvent);
      });
    });
    
    observer.observe(element);
    ResizeUtils.instance.resizeObservers.set(element, observer);
    
    return () => {
      observer.disconnect();
      ResizeUtils.instance.resizeObservers.delete(element);
    };
  }

  static observeWindow(callback: ResizeCallback): () => void {
    const handler = () => {
      const newSize = ResizeUtils.getWindowSize();
      const oldSize = ResizeUtils.instance.lastWindowSize;
      
      if (newSize.width !== oldSize.width || newSize.height !== oldSize.height) {
        ResizeUtils.instance.lastWindowSize = newSize;
        callback(newSize, oldSize, window as unknown as UIEvent);
      }
    };
    
    window.addEventListener('resize', handler, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handler);
    };
  }

  static observeBreakpoint(
    breakpoint: string,
    callback: (matches: boolean) => void
  ): () => void {
    const breakpoints: Record<string, string> = {
      xs: '(max-width: 575.98px)',
      sm: '(min-width: 576px) and (max-width: 767.98px)',
      md: '(min-width: 768px) and (max-width: 991.98px)',
      lg: '(min-width: 992px) and (max-width: 1199.98px)',
      xl: '(min-width: 1200px) and (max-width: 1399.98px)',
      xxl: '(min-width: 1400px)',
      'xs-up': '(min-width: 0px)',
      'sm-up': '(min-width: 576px)',
      'md-up': '(min-width: 768px)',
      'lg-up': '(min-width: 992px)',
      'xl-up': '(min-width: 1200px)',
      'xxl-up': '(min-width: 1400px)',
      'sm-down': '(max-width: 767.98px)',
      'md-down': '(max-width: 991.98px)',
      'lg-down': '(max-width: 1199.98px)',
      'xl-down': '(max-width: 1399.98px)',
    };
    
    const mediaQuery = breakpoints[breakpoint] || `(min-width: ${breakpoint}px)`;
    const mediaQueryList = window.matchMedia(mediaQuery);
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches);
    };
    
    mediaQueryList.addEventListener('change', handler);
    ResizeUtils.instance.breakpointObservers.set(breakpoint, mediaQueryList);
    
    callback(mediaQueryList.matches);
    
    return () => {
      mediaQueryList.removeEventListener('change', handler);
      ResizeUtils.instance.breakpointObservers.delete(breakpoint);
    };
  }

  static observeAllBreakpoints(callbacks: Record<string, () => void>): () => void {
    const unsubscribers: Array<() => void> = [];
    
    Object.entries(callbacks).forEach(([breakpoint, callback]) => {
      const unsub = ResizeUtils.observeBreakpoint(breakpoint, (matches) => {
        if (matches) {
          callback();
        }
      });
      unsubscribers.push(unsub);
    });
    
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }

  static aspectRatioFit(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): Size {
    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  }

  static aspectRatioFill(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): Size {
    const ratio = Math.max(maxWidth / originalWidth, maxHeight / originalHeight);
    
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  }

  static calculateFocalPoint(
    element: HTMLElement,
    focalX: number,
    focalY: number
  ): Position {
    const size = ResizeUtils.getElementSize(element);
    
    return {
      x: size.width * focalX,
      y: size.height * focalY,
    };
  }

  static scaleToFit(
    originalWidth: number,
    originalHeight: number,
    containerWidth: number,
    containerHeight: number
  ): number {
    const widthRatio = containerWidth / originalWidth;
    const heightRatio = containerHeight / originalHeight;
    
    return Math.min(widthRatio, heightRatio);
  }

  static scaleToFill(
    originalWidth: number,
    originalHeight: number,
    containerWidth: number,
    containerHeight: number
  ): number {
    const widthRatio = containerWidth / originalWidth;
    const heightRatio = containerHeight / originalHeight;
    
    return Math.max(widthRatio, heightRatio);
  }

  static debouncedResize(
    callback: ResizeCallback,
    delay = 250
  ): () => void {
    let timeout: ReturnType<typeof setTimeout>;
    
    const handler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const newSize = ResizeUtils.getWindowSize();
        const oldSize = ResizeUtils.instance.lastWindowSize;
        callback(newSize, oldSize, window as unknown as UIEvent);
      }, delay);
    };
    
    window.addEventListener('resize', handler, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handler);
      clearTimeout(timeout);
    };
  }

  static throttledResize(
    callback: ResizeCallback,
    limit = 100
  ): () => void {
    let lastCall = 0;
    let frameId: number | null = null;
    
    const handler = () => {
      const now = performance.now();
      
      if (now - lastCall >= limit) {
        lastCall = now;
        const newSize = ResizeUtils.getWindowSize();
        const oldSize = ResizeUtils.instance.lastWindowSize;
        callback(newSize, oldSize, window as unknown as UIEvent);
      } else if (frameId === null) {
        frameId = requestAnimationFrame(() => {
          const newSize = ResizeUtils.getWindowSize();
          const oldSize = ResizeUtils.instance.lastWindowSize;
          callback(newSize, oldSize, window as unknown as UIEvent);
          frameId = null;
        });
      }
    };
    
    window.addEventListener('resize', handler, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handler);
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }

  static disconnectAll(): void {
    ResizeUtils.instance.resizeObservers.forEach((observer) => {
      observer.disconnect();
    });
    ResizeUtils.instance.resizeObservers.clear();
    
    ResizeUtils.instance.breakpointObservers.forEach((mql) => {
      mql.removeEventListener('change', () => {});
    });
    ResizeUtils.instance.breakpointObservers.clear();
  }
}

export class BreakpointObserver {
  private breakpoints: Breakpoint[];
  private currentBreakpoint: string | null = null;
  private callbacks: Map<string, Array<() => void>> = new Map();
  private mediaQueryLists: MediaQueryList[] = [];

  constructor(breakpoints: Breakpoint[]) {
    this.breakpoints = breakpoints;
    this.init();
  }

  private init(): void {
    this.breakpoints.forEach((bp) => {
      const conditions: string[] = [];
      
      if (bp.minWidth !== undefined) {
        conditions.push(`(min-width: ${bp.minWidth}px)`);
      }
      
      if (bp.maxWidth !== undefined) {
        conditions.push(`(max-width: ${bp.maxWidth}px)`);
      }
      
      const mediaQuery = conditions.length > 0 
        ? conditions.join(' and ')
        : '(min-width: 0px)';
      
      const mql = window.matchMedia(mediaQuery);
      
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) {
          this.currentBreakpoint = bp.name;
          bp.callback?.();
          this.callbacks.get(bp.name)?.forEach((cb) => cb());
        }
      };
      
      mql.addEventListener('change', handler);
      this.mediaQueryLists.push(mql);
      
      if (mql.matches) {
        this.currentBreakpoint = bp.name;
      }
    });
  }

  getCurrentBreakpoint(): string | null {
    return this.currentBreakpoint;
  }

  onChange(name: string, callback: () => void): () => void {
    if (!this.callbacks.has(name)) {
      this.callbacks.set(name, []);
    }
    
    this.callbacks.get(name)?.push(callback);
    
    return () => {
      const cbs = this.callbacks.get(name);
      if (cbs) {
        const index = cbs.indexOf(callback);
        if (index > -1) {
          cbs.splice(index, 1);
        }
      }
    };
  }

  destroy(): void {
    this.mediaQueryLists.forEach((mql) => {
      mql.removeEventListener('change', () => {});
    });
    this.mediaQueryLists = [];
    this.callbacks.clear();
  }
}

export class ElementSizeObserver {
  private element: HTMLElement;
  private observer: ResizeObserver | null = null;
  private callbacks: Array<(size: Size) => void> = [];
  private lastSize: Size | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  start(): void {
    this.observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const size: Size = {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        };
        
        if (!this.lastSize || 
            this.lastSize.width !== size.width || 
            this.lastSize.height !== size.height) {
          this.lastSize = size;
          this.callbacks.forEach((cb) => cb(size));
        }
      });
    });
    
    this.observer.observe(this.element);
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  onResize(callback: (size: Size) => void): () => void {
    this.callbacks.push(callback);
    
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }
}

export class ResponsiveImage {
  private element: HTMLImageElement;
  private sources: Array<{ srcset: string; media?: string }> = [];
  private currentSrc: string | null = null;

  constructor(element: HTMLImageElement) {
    this.element = element;
  }

  addSource(srcset: string, media?: string): this {
    this.sources.push({ srcset, media });
    return this;
  }

  update(): void {
    let selectedSource = this.sources[0];
    
    for (let i = 0; i < this.sources.length; i++) {
      const source = this.sources[i];
      if (source.media) {
        const mql = window.matchMedia(source.media);
        if (mql.matches) {
          selectedSource = source;
          break;
        }
      }
    }
    
    if (selectedSource && selectedSource.srcset !== this.currentSrc) {
      this.currentSrc = selectedSource.srcset;
      this.element.srcset = selectedSource.srcset;
    }
  }

  static createFromPicture(pictureElement: HTMLElement): ResponsiveImage[] {
    const images: HTMLImageElement[] = [];
    
    const img = pictureElement.querySelector('img');
    if (img) {
      images.push(img);
    }
    
    const sources = pictureElement.querySelectorAll('source');
    sources.forEach((source) => {
      const imgSrc = source.getAttribute('srcset');
      if (imgSrc) {
        const tempImg = new Image();
        tempImg.srcset = imgSrc;
        images.push(tempImg);
      }
    });
    
    return images.map((img) => new ResponsiveImage(img));
  }
}

export class SizeAnimation {
  private element: HTMLElement;
  private startWidth: number = 0;
  private startHeight: number = 0;
  private endWidth: number = 0;
  private endHeight: number = 0;
  private duration: number = 0;
  private startTime: number = 0;
  private animationFrame: number | null = null;
  private easing: (t: number) => number;
  private resolve: (() => void) | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
    this.easing = (t: number) => t * (2 - t);
  }

  to(
    width: number,
    height: number,
    duration: number = 300,
    easing?: (t: number) => number
  ): Promise<void> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.startWidth = this.element.offsetWidth;
      this.startHeight = this.element.offsetHeight;
      this.endWidth = width;
      this.endHeight = height;
      this.duration = duration;
      this.startTime = performance.now();
      
      if (easing) {
        this.easing = easing;
      }
      
      this.animate();
    });
  }

  private animate(): void {
    const elapsed = performance.now() - this.startTime;
    let progress = Math.min(elapsed / this.duration, 1);
    progress = this.easing(progress);
    
    const width = this.startWidth + (this.endWidth - this.startWidth) * progress;
    const height = this.startHeight + (this.endHeight - this.startHeight) * progress;
    
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    
    if (progress < 1) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    } else {
      this.finish();
    }
  }

  private finish(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.resolve?.();
  }

  cancel(): void {
    this.finish();
  }
}

export default ResizeUtils;
