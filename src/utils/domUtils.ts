export function $(selector: string, root: Element | Document = document): Element | null {
  return root.querySelector(selector);
}

export function $$(selector: string, root: Element | Document = document): Element[] {
  return Array.from(root.querySelectorAll(selector));
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: (string | Node)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (children) children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else el.appendChild(child);
  });
  return el;
}

export function remove(el: Element): void {
  el.parentNode?.removeChild(el);
}

export function empty(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function addClass(el: Element, ...classes: string[]): void {
  el.classList.add(...classes);
}

export function removeClass(el: Element, ...classes: string[]): void {
  el.classList.remove(...classes);
}

export function toggleClass(el: Element, className: string, force?: boolean): boolean {
  return el.classList.toggle(className, force);
}

export function hasClass(el: Element, className: string): boolean {
  return el.classList.contains(className);
}

export function setStyle(el: HTMLElement, styles: Record<string, string>): void {
  Object.assign(el.style, styles);
}

export function getStyle(el: HTMLElement, prop: string): string {
  return getComputedStyle(el).getPropertyValue(prop);
}

export function on(el: Element | Window | Document, event: string, handler: EventListenerOrEventListenerObject): void {
  el.addEventListener(event, handler);
}

export function off(el: Element | Window | Document, event: string, handler: EventListenerOrEventListenerObject): void {
  el.removeEventListener(event, handler);
}

export function once(el: Element, event: string, handler: EventListener): void {
  el.addEventListener(event, handler, { once: true });
}

export function show(el: HTMLElement): void {
  el.removeAttribute('hidden');
  el.style.display = '';
}

export function hide(el: HTMLElement): void {
  el.setAttribute('hidden', '');
}

export function visible(el: HTMLElement): boolean {
  return !el.hasAttribute('hidden') && el.style.display !== 'none';
}

export function html(el: Element, content?: string): string {
  if (content === undefined) return el.innerHTML;
  el.innerHTML = content;
  return content;
}

export function text(el: Element, content?: string): string {
  if (content === undefined) return el.textContent || '';
  el.textContent = content;
  return content;
}

export function attr(el: Element, name: string, value?: string): string | null {
  if (value === undefined) return el.getAttribute(name);
  if (value === null) el.removeAttribute(name);
  else el.setAttribute(name, value);
  return value ?? null;
}

export function data(el: Element, key: string, value?: unknown): unknown {
  const attrName = `data-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
  if (value === undefined) return el.getAttribute(attrName);
  if (value === null) el.removeAttribute(attrName);
  else el.setAttribute(attrName, String(value));
  return value;
}
