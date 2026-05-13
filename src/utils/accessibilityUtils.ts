export interface AriaAttributes {
  role?: string;
  ariaLabel?: string;
  ariaDescribedby?: string;
  ariaHidden?: boolean;
  ariaDisabled?: boolean;
  ariaExpanded?: boolean;
  ariaChecked?: boolean;
  ariaSelected?: boolean;
  ariaPressed?: boolean;
  ariaCurrent?: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
  ariaAtomic?: boolean;
  ariaBusy?: boolean;
}

export class AccessibilityUtils {
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;

    document.body.appendChild(announcer);

    setTimeout(() => {
      announcer.textContent = message;
    }, 100);

    setTimeout(() => {
      announcer.remove();
    }, 1000);
  }

  static setFocus(element: HTMLElement): void {
    element.focus();
    if (document.activeElement !== element) {
      element.setAttribute('tabindex', '-1');
      element.focus();
    }
  }

  static trapFocus(container: HTMLElement): () => void {
    const focusableSelector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  static skipLink(targetId: string, label: string = 'Skip to main content'): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = `#${targetId}`;
    link.textContent = label;
    link.className = 'skip-link';
    link.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      z-index: 10000;
      transition: top 0.3s;
    `;

    link.addEventListener('focus', () => {
      link.style.top = '0';
    });

    link.addEventListener('blur', () => {
      link.style.top = '-40px';
    });

    return link;
  }

  static generateId(prefix: string = 'a11y'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static setAriaAttributes(
    element: HTMLElement,
    attributes: AriaAttributes
  ): void {
    if (attributes.role) element.setAttribute('role', attributes.role);
    if (attributes.ariaLabel) element.setAttribute('aria-label', attributes.ariaLabel);
    if (attributes.ariaDescribedby) element.setAttribute('aria-describedby', attributes.ariaDescribedby);
    if (attributes.ariaHidden !== undefined) element.setAttribute('aria-hidden', String(attributes.ariaHidden));
    if (attributes.ariaDisabled !== undefined) element.setAttribute('aria-disabled', String(attributes.ariaDisabled));
    if (attributes.ariaExpanded !== undefined) element.setAttribute('aria-expanded', String(attributes.ariaExpanded));
    if (attributes.ariaChecked !== undefined) element.setAttribute('aria-checked', String(attributes.ariaChecked));
    if (attributes.ariaSelected !== undefined) element.setAttribute('aria-selected', String(attributes.ariaSelected));
    if (attributes.ariaPressed !== undefined) element.setAttribute('aria-pressed', String(attributes.ariaPressed));
    if (attributes.ariaCurrent) element.setAttribute('aria-current', attributes.ariaCurrent);
    if (attributes.ariaLive) element.setAttribute('aria-live', attributes.ariaLive);
    if (attributes.ariaAtomic !== undefined) element.setAttribute('aria-atomic', String(attributes.ariaAtomic));
    if (attributes.ariaBusy !== undefined) element.setAttribute('aria-busy', String(attributes.ariaBusy));
  }

  static removeAriaAttributes(element: HTMLElement): void {
    const ariaAttributes = [
      'role', 'aria-label', 'aria-describedby', 'aria-hidden',
      'aria-disabled', 'aria-expanded', 'aria-checked', 'aria-selected',
      'aria-pressed', 'aria-current', 'aria-live', 'aria-atomic', 'aria-busy'
    ];

    ariaAttributes.forEach(attr => {
      element.removeAttribute(attr);
    });
  }

  static isKeyboardNavigable(element: HTMLElement): boolean {
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex !== null && tabIndex !== '-1') return true;

    const tagName = element.tagName.toLowerCase();
    const canBeFocused = [
      'a', 'button', 'input', 'select', 'textarea'
    ].includes(tagName);

    return canBeFocused && !element.hasAttribute('disabled') && !element.hasAttribute('readonly');
  }

  static getKeyboardNavigableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(selector));
  }

  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  static prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: more)').matches;
  }

  static prefersDarkColorScheme(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  static onPrefersReducedMotionChange(callback: (matches: boolean) => void): () => void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }

  static addScreenReaderOnly(element: HTMLElement): void {
    element.classList.add('sr-only');
  }

  static removeScreenReaderOnly(element: HTMLElement): void {
    element.classList.remove('sr-only');
  }

  static describeElement(
    element: HTMLElement,
    description: string,
    id?: string
  ): { describedId: string; cleanup: () => void } {
    const describedId = id || this.generateId('description');

    const descriptionElement = document.createElement('div');
    descriptionElement.id = describedId;
    descriptionElement.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    descriptionElement.textContent = description;

    document.body.appendChild(descriptionElement);
    element.setAttribute('aria-describedby', describedId);

    return {
      describedId,
      cleanup: () => {
        descriptionElement.remove();
        element.removeAttribute('aria-describedby');
      }
    };
  }
}

export class FocusManager {
  private static previousFocus: HTMLElement | null = null;
  private static focusStack: HTMLElement[] = [];

  static saveFocus(): void {
    this.previousFocus = document.activeElement as HTMLElement;
  }

  static restoreFocus(): void {
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
    }
    this.previousFocus = null;
  }

  static pushFocus(element: HTMLElement): void {
    this.focusStack.push(document.activeElement as HTMLElement);
    element.focus();
  }

  static popFocus(): void {
    const previous = this.focusStack.pop();
    if (previous && previous.focus) {
      previous.focus();
    }
  }

  static clearFocus(): void {
    this.focusStack = [];
    this.previousFocus = null;
  }
}

export class AriaLiveRegion {
  private static instance: AriaLiveRegion | null = null;
  private politeRegion: HTMLElement;
  private assertiveRegion: HTMLElement;

  static getInstance(): AriaLiveRegion {
    if (!AriaLiveRegion.instance) {
      AriaLiveRegion.instance = new AriaLiveRegion();
    }
    return AriaLiveRegion.instance;
  }

  private constructor() {
    this.politeRegion = this.createRegion('polite');
    this.assertiveRegion = this.createRegion('assertive');
  }

  private createRegion(live: 'polite' | 'assertive'): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', live);
    region.setAttribute('aria-atomic', 'true');
    region.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(region);
    return region;
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }
}

export class KeyboardNavigation {
  static arrowNavigation(
    container: HTMLElement,
    options: {
      selector?: string;
      orientation?: 'horizontal' | 'vertical' | 'both';
      wrap?: boolean;
      onActivate?: (element: HTMLElement) => void;
    } = {}
  ): () => void {
    const {
      selector = '[role="option"], [role="menuitem"], [role="tab"]',
      orientation = 'vertical',
      wrap = false,
      onActivate
    } = options;

    const handler = (e: KeyboardEvent) => {
      const items = Array.from(container.querySelectorAll<HTMLElement>(selector));
      if (items.length === 0) return;

      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      let nextIndex: number;

      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'horizontal') return;
          e.preventDefault();
          nextIndex = currentIndex + 1;
          if (nextIndex >= items.length) {
            nextIndex = wrap ? 0 : items.length - 1;
          }
          break;

        case 'ArrowUp':
          if (orientation === 'horizontal') return;
          e.preventDefault();
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) {
            nextIndex = wrap ? items.length - 1 : 0;
          }
          break;

        case 'ArrowRight':
          if (orientation === 'vertical') return;
          e.preventDefault();
          nextIndex = currentIndex + 1;
          if (nextIndex >= items.length) {
            nextIndex = wrap ? 0 : items.length - 1;
          }
          break;

        case 'ArrowLeft':
          if (orientation === 'vertical') return;
          e.preventDefault();
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) {
            nextIndex = wrap ? items.length - 1 : 0;
          }
          break;

        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;

        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;

        case 'Enter':
        case ' ':
          if (onActivate && document.activeElement instanceof HTMLElement) {
            e.preventDefault();
            onActivate(document.activeElement);
          }
          return;

        default:
          return;
      }

      items[nextIndex]?.focus();
    };

    container.addEventListener('keydown', handler);

    return () => {
      container.removeEventListener('keydown', handler);
    };
  }
}

export class ColorContrast {
  static getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  static getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  static meetsWCAGAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  static meetsWCAGAAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  static getReadableTextColor(background: string): string {
    const whiteContrast = this.getContrastRatio('#ffffff', background);
    const blackContrast = this.getContrastRatio('#000000', background);
    return whiteContrast > blackContrast ? '#ffffff' : '#000000';
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

export default AccessibilityUtils;
