export interface DOMRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QuerySelectorOptions {
  root?: Element | Document;
  selector?: string;
}

export class DOMUtils2 {
  static $(selector: string, root?: Element | Document): HTMLElement | null {
    return (root || document).querySelector(selector);
  }

  static $$(selector: string, root?: Element | Document): HTMLElement[] {
    return Array.from((root || document).querySelectorAll(selector));
  }

  static createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attributes?: Record<string, string>,
    children?: (string | Node)[]
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (children) {
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      });
    }

    return element;
  }

  static remove(element: HTMLElement): void {
    element.remove();
  }

  static empty(element: HTMLElement): void {
    element.innerHTML = '';
  }

  static replace(oldElement: HTMLElement, newElement: HTMLElement): void {
    oldElement.parentNode?.replaceChild(newElement, oldElement);
  }

  static insertBefore(element: HTMLElement, newElement: HTMLElement): void {
    element.parentNode?.insertBefore(newElement, element);
  }

  static insertAfter(element: HTMLElement, newElement: HTMLElement): void {
    element.parentNode?.insertBefore(newElement, element.nextSibling);
  }

  static wrap(element: HTMLElement, wrapper: HTMLElement): HTMLElement {
    element.parentNode?.insertBefore(wrapper, element);
    wrapper.appendChild(element);
    return wrapper;
  }

  static unwrap(element: HTMLElement): void {
    const parent = element.parentNode;
    if (!parent) return;

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }

  static getRect(element: HTMLElement): DOMRect {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  static isInViewport(element: HTMLElement, fullyVisible: boolean = false): boolean {
    const rect = element.getBoundingClientRect();
    
    if (fullyVisible) {
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }

    return (
      rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
      rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
      rect.bottom > 0 &&
      rect.right > 0
    );
  }

  static scrollIntoViewIfNeeded(element: HTMLElement, center: boolean = true): void {
    element.scrollIntoView({
      behavior: 'smooth',
      block: center ? 'center' : 'nearest',
      inline: center ? 'center' : 'nearest'
    });
  }

  static getScrollPosition(element?: HTMLElement): { x: number; y: number } {
    if (element) {
      return {
        x: element.scrollLeft,
        y: element.scrollTop
      };
    }
    return {
      x: window.scrollX || window.pageXOffset || document.documentElement.scrollLeft,
      y: window.scrollY || window.pageYOffset || document.documentElement.scrollTop
    };
  }

  static setScrollPosition(element: HTMLElement | Window, x: number, y: number): void {
    if (element === window) {
      window.scrollTo(x, y);
    } else {
      (element as HTMLElement).scrollLeft = x;
      (element as HTMLElement).scrollTop = y;
    }
  }

  static addClass(element: HTMLElement, ...classes: string[]): void {
    element.classList.add(...classes);
  }

  static removeClass(element: HTMLElement, ...classes: string[]): void {
    element.classList.remove(...classes);
  }

  static toggleClass(element: HTMLElement, className: string, force?: boolean): boolean {
    return element.classList.toggle(className, force);
  }

  static hasClass(element: HTMLElement, className: string): boolean {
    return element.classList.contains(className);
  }

  static setStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
    Object.assign(element.style, styles);
  }

  static getStyle(element: HTMLElement, property: string): string {
    return window.getComputedStyle(element).getPropertyValue(property);
  }

  static setAttributes(element: HTMLElement, attributes: Record<string, string | null>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value === null) {
        element.removeAttribute(key);
      } else {
        element.setAttribute(key, value);
      }
    });
  }

  static getAttributes(element: HTMLElement): Record<string, string> {
    const attributes: Record<string, string> = {};
    Array.from(element.attributes).forEach((attr: Attr) => {
      attributes[attr.name] = attr.value;
    });
    return attributes;
  }

  static data(element: HTMLElement): Record<string, string> {
    const data: Record<string, string> = {};
    Array.from(element.attributes).forEach((attr: Attr) => {
      if (attr.name.startsWith('data-')) {
        const key = attr.name.slice(5).replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
        data[key] = attr.value;
      }
    });
    return data;
  }

  static setData(element: HTMLElement, key: string, value: string): void {
    (element as HTMLElement & { dataset: DOMStringMap }).dataset[key] = value;
  }

  static getData(element: HTMLElement, key: string): string {
    return (element as HTMLElement & { dataset: DOMStringMap }).dataset[key] || '';
  }

  static show(element: HTMLElement, display: string = 'block'): void {
    element.style.display = display;
  }

  static hide(element: HTMLElement): void {
    element.style.display = 'none';
  }

  static toggle(element: HTMLElement, visible: boolean, display: string = 'block'): void {
    element.style.display = visible ? display : 'none';
  }

  static isVisible(element: HTMLElement): boolean {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
  }

  static isHidden(element: HTMLElement): boolean {
    return !this.isVisible(element);
  }

  static on(element: HTMLElement | Document | Window, event: string, handler: EventListener, options?: AddEventListenerOptions): void {
    element.addEventListener(event, handler, options);
  }

  static off(element: HTMLElement | Document | Window, event: string, handler: EventListener, options?: EventListenerOptions): void {
    element.removeEventListener(event, handler, options);
  }

  static once(element: HTMLElement, event: string, handler: EventListener): void {
    element.addEventListener(event, handler, { once: true });
  }

  static trigger(element: HTMLElement, eventType: string, options?: EventInit): void {
    const event = new Event(eventType, { bubbles: true, cancelable: true, ...options });
    element.dispatchEvent(event);
  }

  static delegate(parent: HTMLElement, selector: string, event: string, handler: EventListener): () => void {
    const delegatedHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      const element = target.closest(selector);
      if (element && parent.contains(element)) {
        handler.call(element, event);
      }
    };

    parent.addEventListener(event, delegatedHandler);
    return () => parent.removeEventListener(event, delegatedHandler);
  }
}

export class ElementFactory {
  static createDiv(className?: string, attributes?: Record<string, string>): HTMLElement {
    return DOMUtils2.createElement('div', { class: className || '', ...attributes });
  }

  static createSpan(className?: string, text?: string, attributes?: Record<string, string>): HTMLSpanElement {
    const span = DOMUtils2.createElement('span', { class: className || '', ...attributes });
    if (text) span.textContent = text;
    return span;
  }

  static createButton(text: string, className?: string, onClick?: () => void): HTMLButtonElement {
    const button = DOMUtils2.createElement('button', { class: className || '' });
    button.textContent = text;
    if (onClick) button.addEventListener('click', onClick);
    return button;
  }

  static createInput(type: string, className?: string, attributes?: Record<string, string>): HTMLInputElement {
    return DOMUtils2.createElement('input', { type, class: className || '', ...attributes });
  }

  static createImage(src: string, className?: string, alt?: string): HTMLImageElement {
    return DOMUtils2.createElement('img', { src, class: className || '', alt: alt || '' });
  }

  static createLink(href: string, text: string, className?: string): HTMLAnchorElement {
    const link = DOMUtils2.createElement('a', { href, class: className || '' });
    link.textContent = text;
    return link;
  }

  static createList(items: string[], ordered: boolean = false, className?: string): HTMLOListElement | HTMLUListElement {
    const tag = ordered ? 'ol' : 'ul';
    const list = DOMUtils2.createElement(tag, { class: className || '' });
    items.forEach(text => {
      const li = DOMUtils2.createElement('li');
      li.textContent = text;
      list.appendChild(li);
    });
    return list;
  }

  static createTable(headers: string[], rows: string[][], className?: string): HTMLTableElement {
    const table = DOMUtils2.createElement('table', { class: className || '' });
    
    const thead = DOMUtils2.createElement('thead');
    const headerRow = DOMUtils2.createElement('tr');
    headers.forEach(text => {
      const th = DOMUtils2.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = DOMUtils2.createElement('tbody');
    rows.forEach(rowData => {
      const tr = DOMUtils2.createElement('tr');
      rowData.forEach(text => {
        const td = DOMUtils2.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table;
  }
}

export class DOMObserver {
  private observer: MutationObserver;
  private callbacks: {
    mutation?: (mutations: MutationRecord[]) => void;
    childList?: (mutations: MutationRecord[]) => void;
    subtree?: (mutations: MutationRecord[]) => void;
  } = {};

  constructor(element: HTMLElement, options: {
    childList?: boolean;
    subtree?: boolean;
    attributes?: boolean;
    characterData?: boolean;
  } = {}) {
    this.observer = new MutationObserver((mutations) => {
      if (this.callbacks.mutation) {
        this.callbacks.mutation(mutations);
      }
      if (this.callbacks.childList) {
        const childListMutations = mutations.filter(m => m.type === 'childList');
        if (childListMutations.length) {
          this.callbacks.childList(childListMutations);
        }
      }
      if (this.callbacks.subtree && options.subtree) {
        this.callbacks.subtree(mutations);
      }
    });

    this.observer.observe(element, {
      childList: options.childList ?? true,
      subtree: options.subtree ?? true,
      attributes: options.attributes ?? false,
      characterData: options.characterData ?? false
    });
  }

  onMutation(callback: (mutations: MutationRecord[]) => void): this {
    this.callbacks.mutation = callback;
    return this;
  }

  onChildList(callback: (mutations: MutationRecord[]) => void): this {
    this.callbacks.childList = callback;
    return this;
  }

  onSubtree(callback: (mutations: MutationRecord[]) => void): this {
    this.callbacks.subtree = callback;
    return this;
  }

  disconnect(): void {
    this.observer.disconnect();
  }
}

export class ResizeObserverHelper {
  private observer: ResizeObserver;
  private callback: (entries: ResizeObserverEntry[]) => void;

  constructor(callback: (entries: ResizeObserverEntry[]) => void) {
    this.callback = callback;
    this.observer = new ResizeObserver(callback);
  }

  observe(element: HTMLElement): void {
    this.observer.observe(element);
  }

  unobserve(element: HTMLElement): void {
    this.observer.unobserve(element);
  }

  disconnect(): void {
    this.observer.disconnect();
  }
}

export class IntersectionObserverHelper {
  private observer: IntersectionObserver;
  private callback: (entries: IntersectionObserverEntry[]) => void;

  constructor(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ) {
    this.callback = callback;
    this.observer = new IntersectionObserver(callback, options);
  }

  observe(element: HTMLElement): void {
    this.observer.observe(element);
  }

  unobserve(element: HTMLElement): void {
    this.observer.unobserve(element);
  }

  disconnect(): void {
    this.observer.disconnect();
  }

  static isIntersecting(entry: IntersectionObserverEntry): boolean {
    return entry.isIntersecting;
  }

  static getRatio(entry: IntersectionObserverEntry): number {
    return entry.intersectionRatio;
  }
}

export default DOMUtils2;
