export type CSSUnit = 'px' | 'em' | 'rem' | 'vw' | 'vh' | 'vmin' | 'vmax' | '%' | 'cm' | 'mm' | 'in' | 'pt' | 'pc' | 'ch' | 'ex';

export class CSSUtils2 {
  static parseValue(value: string): { number: number; unit: string } | null {
    const match = value.match(/^(-?\d+(?:\.\d+)?)(px|em|rem|vw|vh|vmin|vmax|%|cm|mm|in|pt|pc|ch|ex)?$/);
    if (!match) return null;
    return {
      number: parseFloat(match[1]),
      unit: match[2] || 'px'
    };
  }

  static convertUnit(value: number, fromUnit: CSSUnit, toUnit: CSSUnit, context?: HTMLElement): number {
    if (fromUnit === toUnit) return value;

    const pxValues: Record<CSSUnit, number | ((context?: HTMLElement) => number)> = {
      px: 1,
      em: () => {
        const fontSize = context ? parseFloat(getComputedStyle(context).fontSize) : 16;
        return fontSize;
      },
      rem: () => {
        return parseFloat(getComputedStyle(document.documentElement).fontSize);
      },
      vw: () => window.innerWidth / 100,
      vh: () => window.innerHeight / 100,
      vmin: () => Math.min(window.innerWidth, window.innerHeight) / 100,
      vmax: () => Math.max(window.innerWidth, window.innerHeight) / 100,
      '%': 0.01,
      cm: 37.795275591,
      mm: 3.7795275591,
      in: 96,
      pt: 1.3333333333,
      pc: 16,
      ch: () => {
        const fontSize = context ? parseFloat(getComputedStyle(context).fontSize) : 16;
        return fontSize * 0.5;
      },
      ex: () => {
        const fontSize = context ? parseFloat(getComputedStyle(context).fontSize) : 16;
        return fontSize * 0.5;
      }
    };

    const fromPx = typeof pxValues[fromUnit] === 'function' 
      ? (pxValues[fromUnit] as (context?: HTMLElement) => number)(context) 
      : (pxValues[fromUnit] as number);
    const toPx = typeof pxValues[toUnit] === 'function' 
      ? (pxValues[toUnit] as (context?: HTMLElement) => number)(context) 
      : (pxValues[toUnit] as number);

    if (toUnit === '%') {
      return (value * fromPx) / 100;
    }

    return (value * fromPx) / toPx;
  }

  static pxTo(value: number, toUnit: CSSUnit, context?: HTMLElement): string {
    const converted = this.convertUnit(value, 'px', toUnit, context);
    return `${converted}${toUnit}`;
  }

  static toPx(value: string, context?: HTMLElement): number {
    const parsed = this.parseValue(value);
    if (!parsed) return 0;
    return this.convertUnit(parsed.number, parsed.unit as CSSUnit, 'px', context);
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static randomColor(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  }

  static lighten(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  static darken(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  static createGradient(
    type: 'linear' | 'radial' | 'conic',
    colors: string[],
    options: {
      angle?: number;
      position?: string;
      shape?: 'circle' | 'ellipse';
    } = {}
  ): string {
    const colorStops = colors.map((color, index) => {
      const percent = (index / (colors.length - 1)) * 100;
      return `${color} ${percent}%`;
    }).join(', ');

    switch (type) {
      case 'linear':
        const angle = options.angle ?? 180;
        return `linear-gradient(${angle}deg, ${colorStops})`;
      case 'radial':
        const shape = options.shape ?? 'ellipse';
        const position = options.position ?? 'center';
        return `radial-gradient(${shape} at ${position}, ${colorStops})`;
      case 'conic':
        const conicAngle = options.angle ?? 0;
        return `conic-gradient(from ${conicAngle}deg, ${colorStops})`;
    }
  }

  static getCSSVariable(name: string, element?: HTMLElement): string {
    const el = element || document.documentElement;
    return getComputedStyle(el).getPropertyValue(name).trim();
  }

  static setCSSVariable(name: string, value: string, element?: HTMLElement): void {
    const el = element || document.documentElement;
    el.style.setProperty(name, value);
  }

  static removeCSSVariable(name: string, element?: HTMLElement): void {
    const el = element || document.documentElement;
    el.style.removeProperty(name);
  }

  static getComputedStyle(element: HTMLElement): CSSStyleDeclaration {
    return getComputedStyle(element);
  }

  static getInlineStyle(element: HTMLElement): Record<string, string> {
    const style: Record<string, string> = {};
    for (const prop of element.style) {
      const camelProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      style[camelProp] = element.style.getPropertyValue(prop);
    }
    return style;
  }

  static setInlineStyle(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
    Object.assign(element.style, styles);
  }

  static getAnimationDuration(element: HTMLElement): number {
    const duration = getComputedStyle(element).animationDuration;
    return this.toMs(duration);
  }

  static getTransitionDuration(element: HTMLElement): number {
    const duration = getComputedStyle(element).transitionDuration;
    return this.toMs(duration);
  }

  private static toMs(value: string): number {
    if (value.endsWith('ms')) {
      return parseFloat(value);
    }
    if (value.endsWith('s')) {
      return parseFloat(value) * 1000;
    }
    return parseFloat(value);
  }

  static generateShadow(
    options: {
      x?: number;
      y?: number;
      blur?: number;
      spread?: number;
      color?: string;
      inset?: boolean;
    } = {}
  ): string {
    const {
      x = 0,
      y = 4,
      blur = 6,
      spread = 0,
      color = 'rgba(0, 0, 0, 0.1)',
      inset = false
    } = options;

    const insetStr = inset ? 'inset ' : '';
    return `${insetStr}${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }

  static generateBoxShadow(options: {
    elevation?: number;
    color?: string;
  } = {}): string {
    const elevation = options.elevation ?? 1;
    const color = options.color ?? 'rgba(0, 0, 0, 0.1)';

    const shadows: Record<number, string> = {
      1: `0 1px 3px ${color}, 0 1px 2px ${color}`,
      2: `0 3px 6px ${color}, 0 2px 4px ${color}`,
      3: `0 10px 20px ${color}, 0 3px 6px ${color}`,
      4: `0 15px 25px ${color}, 0 5px 10px ${color}`,
      5: `0 20px 40px ${color}, 0 10px 15px ${color}`
    };

    return shadows[elevation] || shadows[1];
  }

  static generateTextShadow(options: {
    x?: number;
    y?: number;
    blur?: number;
    color?: string;
  } = {}): string {
    const {
      x = 1,
      y = 1,
      blur = 1,
      color = 'rgba(0, 0, 0, 0.5)'
    } = options;

    return `${x}px ${y}px ${blur}px ${color}`;
  }

  static isVisible(element: HTMLElement): boolean {
    const style = getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
  }

  static getFontFamily(element: HTMLElement): string {
    return getComputedStyle(element).fontFamily;
  }

  static getFontSize(element: HTMLElement): number {
    return parseFloat(getComputedStyle(element).fontSize);
  }

  static getLineHeight(element: HTMLElement): number {
    return parseFloat(getComputedStyle(element).lineHeight);
  }

  static getZIndex(element: HTMLElement): number {
    const zIndex = getComputedStyle(element).zIndex;
    return zIndex === 'auto' ? 0 : parseInt(zIndex, 10);
  }

  static getBorderRadius(element: HTMLElement): number {
    return parseFloat(getComputedStyle(element).borderRadius);
  }

  static getOpacity(element: HTMLElement): number {
    return parseFloat(getComputedStyle(element).opacity);
  }

  static serializeStyles(styles: Record<string, unknown>): string {
    return Object.entries(styles)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  }

  static parseStyles(cssText: string): Record<string, string> {
    const styles: Record<string, string> = {};
    const declarations = cssText.split(';');

    for (const declaration of declarations) {
      const [property, value] = declaration.split(':').map(s => s.trim());
      if (property && value) {
        styles[property] = value;
      }
    }

    return styles;
  }

  static generateKeyframes(frames: Record<string, Record<string, string>>): string {
    const frameStrings = Object.entries(frames)
      .map(([percent, properties]) => {
        const propString = Object.entries(properties)
          .map(([key, value]) => {
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${cssKey}: ${value}`;
          })
          .join('; ');
        return `${percent} { ${propString} }`;
      })
      .join(' ');

    return `@keyframes { ${frameStrings} }`;
  }
}

export class ResponsiveUtils {
  static getBreakpoints(): Record<string, number> {
    return {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400
    };
  }

  static getCurrentBreakpoint(): string {
    const width = window.innerWidth;
    const breakpoints = this.getBreakpoints();

    if (width >= breakpoints.xxl) return 'xxl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  }

  static isMobile(): boolean {
    return window.innerWidth < this.getBreakpoints().md;
  }

  static isTablet(): boolean {
    const width = window.innerWidth;
    const breakpoints = this.getBreakpoints();
    return width >= breakpoints.md && width < breakpoints.lg;
  }

  static isDesktop(): boolean {
    return window.innerWidth >= this.getBreakpoints().lg;
  }

  static matchWidth(breakpoint: string): boolean {
    const width = window.innerWidth;
    const breakpoints = this.getBreakpoints();
    return width >= breakpoints[breakpoint as keyof typeof breakpoints];
  }

  static onMediaQueryChange(
    query: string,
    callback: (matches: boolean) => void
  ): () => void {
    const mediaQuery = window.matchMedia(query);
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    callback(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }
}

export default CSSUtils2;
