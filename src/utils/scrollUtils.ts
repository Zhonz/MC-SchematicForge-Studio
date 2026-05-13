export interface ScrollPosition {
  x: number;
  y: number;
}

export interface ScrollDirection {
  horizontal: 'left' | 'right' | 'none';
  vertical: 'up' | 'down' | 'none';
}

export interface ScrollConfig {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
  smooth?: boolean;
}

export interface ScrollProgressData {
  element: HTMLElement;
  progress: number;
  visible: boolean;
  viewportHeight: number;
  elementTop: number;
  elementBottom: number;
}

export interface InViewOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  once?: boolean;
}

export interface ScrollLockOptions {
  bodyScrollY?: number;
  touchScrollY?: number;
  allowTouch?: boolean;
}

export class ScrollUtils {
  private static instance: ScrollUtils;
  private scrollHandlers: Map<string, (position: ScrollPosition, event: Event) => void> = new Map();
  private directionHandlers: Map<string, (direction: ScrollDirection, event: Event) => void> = new Map();
  private lastScrollPosition: ScrollPosition = { x: 0, y: 0 };
  private locked = false;

  static getInstance(): ScrollUtils {
    if (!ScrollUtils.instance) {
      ScrollUtils.instance = new ScrollUtils();
    }
    return ScrollUtils.instance;
  }

  static getScrollPosition(element?: HTMLElement | Window): ScrollPosition {
    if (element === window || element === undefined) {
      return {
        x: window.scrollX || window.pageXOffset || document.documentElement.scrollLeft,
        y: window.scrollY || window.pageYOffset || document.documentElement.scrollTop,
      };
    }
    return {
      x: (element as HTMLElement).scrollLeft,
      y: (element as HTMLElement).scrollTop,
    };
  }

  static scrollTo(
    x: number,
    y: number,
    config?: ScrollConfig
  ): Promise<void> {
    return new Promise((resolve) => {
      const options: ScrollToOptions = {
        top: y,
        left: x,
        behavior: config?.behavior || (config?.smooth ? 'smooth' : 'auto'),
      };
      
      window.scrollTo(options);
      
      if (options.behavior === 'auto') {
        resolve();
      } else {
        setTimeout(resolve, 500);
      }
    });
  }

  static scrollToElement(
    element: HTMLElement,
    config?: ScrollConfig & { offset?: number }
  ): Promise<void> {
    return new Promise((resolve) => {
      const elementRect = element.getBoundingClientRect();
      const offsetTop = elementRect.top + (config?.offset || 0);
      
      const scrollToOptions: ScrollToOptions = {
        top: offsetTop,
        behavior: config?.behavior || (config?.smooth ? 'smooth' : 'auto'),
      };
      
      window.scrollTo(scrollToOptions);
      
      setTimeout(resolve, config?.behavior === 'smooth' ? 500 : 50);
    });
  }

  static scrollBy(x: number, y: number, config?: ScrollConfig): Promise<void> {
    return new Promise((resolve) => {
      const options: ScrollToOptions = {
        top: y,
        left: x,
        behavior: config?.behavior || (config?.smooth ? 'smooth' : 'auto'),
      };
      
      window.scrollBy(options);
      
      setTimeout(resolve, options.behavior === 'smooth' ? 500 : 50);
    });
  }

  static getScrollDirection(element?: HTMLElement | Window): ScrollDirection {
    const current = ScrollUtils.getScrollPosition(element);
    const deltaX = current.x - ScrollUtils.instance.lastScrollPosition.x;
    const deltaY = current.y - ScrollUtils.instance.lastScrollPosition.y;
    
    ScrollUtils.instance.lastScrollPosition = current;
    
    return {
      horizontal: deltaX > 0 ? 'right' : deltaX < 0 ? 'left' : 'none',
      vertical: deltaY > 0 ? 'down' : deltaY < 0 ? 'up' : 'none',
    };
  }

  static getScrollPercentage(element?: HTMLElement | Window): number {
    if (element === window || element === undefined) {
      const docHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollableHeight = docHeight - viewportHeight;
      
      if (scrollableHeight <= 0) return 100;
      
      const scrolled = window.scrollY || window.pageYOffset;
      return Math.round((scrolled / scrollableHeight) * 100);
    }
    
    const scrollableHeight = (element as HTMLElement).scrollHeight - (element as HTMLElement).clientHeight;
    if (scrollableHeight <= 0) return 100;
    
    return Math.round(((element as HTMLElement).scrollTop / scrollableHeight) * 100);
  }

  static isScrolledToTop(element?: HTMLElement | Window): boolean {
    const position = ScrollUtils.getScrollPosition(element);
    return position.y === 0;
  }

  static isScrolledToBottom(element?: HTMLElement | Window): boolean {
    if (element === window || element === undefined) {
      const docHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const position = ScrollUtils.getScrollPosition(element);
      return position.y >= docHeight - viewportHeight - 1;
    }
    
    const position = ScrollUtils.getScrollPosition(element);
    const scrollableHeight = (element as HTMLElement).scrollHeight - (element as HTMLElement).clientHeight;
    return position.y >= scrollableHeight - 1;
  }

  static getScrollProgress(element: HTMLElement): ScrollProgressData {
    const viewportHeight = window.innerHeight;
    const elementRect = element.getBoundingClientRect();
    const elementTop = elementRect.top + window.scrollY;
    const elementBottom = elementTop + element.offsetHeight;
    
    const docHeight = document.documentElement.scrollHeight;
    const scrollableHeight = docHeight - viewportHeight;
    const scrolled = window.scrollY;
    
    const progress = scrollableHeight > 0 
      ? Math.round((scrolled / scrollableHeight) * 100) 
      : 100;
    
    const visible = elementRect.top < viewportHeight && elementRect.bottom > 0;
    
    return {
      element,
      progress,
      visible,
      viewportHeight,
      elementTop,
      elementBottom,
    };
  }

  static isElementInViewport(element: HTMLElement, options?: { threshold?: number }): boolean {
    const rect = element.getBoundingClientRect();
    const threshold = options?.threshold || 0;
    
    return (
      rect.top >= -threshold &&
      rect.left >= -threshold &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
    );
  }

  static isElementFullyInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewportHeight &&
      rect.right <= viewportWidth
    );
  }

  static scrollIntoViewIfNeeded(element: HTMLElement, config?: ScrollConfig): Promise<void> {
    if (ScrollUtils.isElementFullyInViewport(element)) {
      return Promise.resolve();
    }
    return ScrollUtils.scrollToElement(element, config);
  }

  static getVisibleHeight(element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(viewportHeight, rect.bottom);
    
    return Math.max(0, visibleBottom - visibleTop);
  }

  static getVisiblePercentage(element: HTMLElement): number {
    const visibleHeight = ScrollUtils.getVisibleHeight(element);
    return Math.round((visibleHeight / element.offsetHeight) * 100);
  }

  static smoothScrollToTop(duration = 300): Promise<void> {
    const startY = window.scrollY || window.pageYOffset;
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const easeOutQuad = (t: number) => t * (2 - t);
      
      const scrollStep = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuad(progress);
        
        window.scrollTo(0, startY * (1 - easedProgress));
        
        if (progress < 1) {
          requestAnimationFrame(scrollStep);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(scrollStep);
    });
  }

  static smoothScrollToBottom(duration = 300): Promise<void> {
    const startY = window.scrollY || window.pageYOffset;
    const endY = document.documentElement.scrollHeight - window.innerHeight;
    const distance = endY - startY;
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const easeOutQuad = (t: number) => t * (2 - t);
      
      const scrollStep = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuad(progress);
        
        window.scrollTo(0, startY + distance * easedProgress);
        
        if (progress < 1) {
          requestAnimationFrame(scrollStep);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(scrollStep);
    });
  }

  static enableScroll(): void {
    if (ScrollUtils.instance.locked) {
      ScrollUtils.instance.locked = false;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      document.body.style.touchAction = '';
    }
  }

  static disableScroll(options?: ScrollLockOptions): void {
    if (!ScrollUtils.instance.locked) {
      ScrollUtils.instance.locked = true;
      const scrollY = options?.bodyScrollY ?? window.scrollY;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'hidden';
      
      if (options?.allowTouch) {
        document.body.style.touchAction = 'none';
      }
    }
  }

  static preserveScrollPosition(callback: () => void): void {
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    callback();
    
    window.scrollTo(scrollX, scrollY);
  }

  static scrollHorizontally(element: HTMLElement, direction: 'left' | 'right', distance = 200): Promise<void> {
    const currentScroll = element.scrollLeft;
    const targetScroll = direction === 'right' 
      ? currentScroll + distance 
      : currentScroll - distance;
    
    return ScrollUtils.scrollTo(targetScroll, 0);
  }

  static scrollVertically(element: HTMLElement, direction: 'up' | 'down', distance = 200): Promise<void> {
    const currentScroll = element.scrollTop;
    const targetScroll = direction === 'down' 
      ? currentScroll + distance 
      : currentScroll - distance;
    
    return new Promise((resolve) => {
      element.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
      
      setTimeout(resolve, 300);
    });
  }

  static onScroll(
    element: HTMLElement | Window,
    callback: (position: ScrollPosition, event: Event) => void,
    options?: AddEventListenerOptions
  ): () => void {
    const handler = (event: Event) => {
      const position = ScrollUtils.getScrollPosition(element);
      callback(position, event);
    };
    
    element.addEventListener('scroll', handler, options);
    
    return () => {
      element.removeEventListener('scroll', handler);
    };
  }

  static onScrollEnd(
    element: HTMLElement | Window,
    callback: (position: ScrollPosition) => void,
    threshold = 150
  ): () => void {
    let timeout: ReturnType<typeof setTimeout>;
    let lastPosition = ScrollUtils.getScrollPosition(element);
    
    const handler = () => {
      const currentPosition = ScrollUtils.getScrollPosition(element);
      
      if (currentPosition.x !== lastPosition.x || currentPosition.y !== lastPosition.y) {
        clearTimeout(timeout);
        lastPosition = currentPosition;
        
        timeout = setTimeout(() => {
          callback(currentPosition);
        }, threshold);
      }
    };
    
    element.addEventListener('scroll', handler);
    
    return () => {
      element.removeEventListener('scroll', handler);
      clearTimeout(timeout);
    };
  }

  static onScrollDirectionChange(
    element: HTMLElement | Window,
    callback: (direction: ScrollDirection) => void
  ): () => void {
    let lastDirection: ScrollDirection = { horizontal: 'none', vertical: 'none' };
    
    const handler = () => {
      const currentDirection = ScrollUtils.getScrollDirection(element);
      
      if (currentDirection.horizontal !== lastDirection.horizontal || 
          currentDirection.vertical !== lastDirection.vertical) {
        lastDirection = currentDirection;
        callback(currentDirection);
      }
    };
    
    element.addEventListener('scroll', handler);
    
    return () => {
      element.removeEventListener('scroll', handler);
    };
  }
}

export class InViewObserver {
  private observer: IntersectionObserver | null = null;
  private callbacks: Map<HTMLElement, (entry: IntersectionObserverEntry) => void> = new Map();

  constructor(options?: InViewOptions) {
    const observerOptions: IntersectionObserverInit = {
      threshold: options?.threshold || 0,
      root: options?.root || null,
      rootMargin: options?.rootMargin || '0px',
    };
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const callback = this.callbacks.get(entry.target as HTMLElement);
        if (callback) {
          callback(entry);
        }
      });
    }, observerOptions);
  }

  observe(
    element: HTMLElement,
    callback: (entry: IntersectionObserverEntry) => void,
    once = true
  ): void {
    this.callbacks.set(element, (entry) => {
      callback(entry);
      
      if (once && entry.isIntersecting && this.observer) {
        this.observer.unobserve(element);
      }
    });
    
    if (this.observer) {
      this.observer.observe(element);
    }
  }

  unobserve(element: HTMLElement): void {
    this.callbacks.delete(element);
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }

  disconnect(): void {
    this.callbacks.clear();
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export class ScrollProgressTracker {
  private element: HTMLElement;
  private progress = 0;
  private callbacks: ((progress: number) => void)[] = [];
  private observer: IntersectionObserver | null = null;
  private scrollHandler: (() => void) | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  getProgress(): number {
    const rect = this.element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const scrollableHeight = document.documentElement.scrollHeight - viewportHeight;
    
    if (scrollableHeight <= 0) return 100;
    
    const elementStart = rect.top + window.scrollY;
    const progress = (window.scrollY - elementStart + viewportHeight) / 
                     (scrollableHeight + this.element.offsetHeight);
    
    return Math.max(0, Math.min(100, Math.round(progress * 100)));
  }

  onProgressChange(callback: (progress: number) => void): () => void {
    this.callbacks.push(callback);
    
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  start(): void {
    const updateProgress = () => {
      this.progress = this.getProgress();
      this.callbacks.forEach((cb) => cb(this.progress));
    };
    
    this.scrollHandler = updateProgress;
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  stop(): void {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
  }
}

export default ScrollUtils;
