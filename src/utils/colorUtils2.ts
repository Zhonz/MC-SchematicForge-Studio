export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSLA extends HSL {
  a: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export class ColorUtils2 {
  static rgbToHex(rgb: RGB): string {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  static hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }

  static rgbToHsl(rgb: RGB): HSL {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  static hslToRgb(hsl: HSL): RGB {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  static rgbToHsv(rgb: RGB): HSV {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: h * 360, s: s * 100, v: v * 100 };
  }

  static hsvToRgb(hsv: HSV): RGB {
    const h = hsv.h / 360;
    const s = hsv.s / 100;
    const v = hsv.v / 100;

    let r: number, g: number, b: number;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v; g = t; b = p;
        break;
      case 1:
        r = q; g = v; b = p;
        break;
      case 2:
        r = p; g = v; b = t;
        break;
      case 3:
        r = p; g = q; b = v;
        break;
      case 4:
        r = t; g = p; b = v;
        break;
      case 5:
      default:
        r = v; g = p; b = q;
        break;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  static rgbToCmyk(rgb: RGB): CMYK {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const k = 1 - Math.max(r, g, b);

    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  }

  static cmykToRgb(cmyk: CMYK): RGB {
    const c = cmyk.c / 100;
    const m = cmyk.m / 100;
    const y = cmyk.y / 100;
    const k = cmyk.k / 100;

    return {
      r: Math.round(255 * (1 - c) * (1 - k)),
      g: Math.round(255 * (1 - m) * (1 - k)),
      b: Math.round(255 * (1 - y) * (1 - k))
    };
  }

  static hexToHsl(hex: string): HSL | null {
    const rgb = this.hexToRgb(hex);
    return rgb ? this.rgbToHsl(rgb) : null;
  }

  static hslToHex(hsl: HSL): string {
    const rgb = this.hslToRgb(hsl);
    return this.rgbToHex(rgb);
  }

  static parseColor(color: string): RGB | null {
    if (color.startsWith('#')) {
      return this.hexToRgb(color);
    }

    const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }

    const namedColors: Record<string, string> = {
      red: '#ff0000',
      green: '#00ff00',
      blue: '#0000ff',
      white: '#ffffff',
      black: '#000000',
      yellow: '#ffff00',
      cyan: '#00ffff',
      magenta: '#ff00ff',
      orange: '#ffa500',
      purple: '#800080',
      pink: '#ffc0cb',
      brown: '#a52a2a',
      gray: '#808080',
      grey: '#808080'
    };

    const lowerColor = color.toLowerCase();
    if (namedColors[lowerColor]) {
      return this.hexToRgb(namedColors[lowerColor]);
    }

    return null;
  }

  static blendColors(color1: string, color2: string, ratio: number = 0.5): string {
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);

    if (!rgb1 || !rgb2) return color1;

    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

    return this.rgbToHex({ r, g, b });
  }

  static lighten(color: string, amount: number = 0.2): string {
    const rgb = this.parseColor(color);
    if (!rgb) return color;

    const hsl = this.rgbToHsl(rgb);
    hsl.l = Math.min(100, hsl.l + amount * 100);

    const newRgb = this.hslToRgb(hsl);
    return this.rgbToHex(newRgb);
  }

  static darken(color: string, amount: number = 0.2): string {
    const rgb = this.parseColor(color);
    if (!rgb) return color;

    const hsl = this.rgbToHsl(rgb);
    hsl.l = Math.max(0, hsl.l - amount * 100);

    const newRgb = this.hslToRgb(hsl);
    return this.rgbToHex(newRgb);
  }

  static saturate(color: string, amount: number = 0.2): string {
    const rgb = this.parseColor(color);
    if (!rgb) return color;

    const hsl = this.rgbToHsl(rgb);
    hsl.s = Math.min(100, hsl.s + amount * 100);

    const newRgb = this.hslToRgb(hsl);
    return this.rgbToHex(newRgb);
  }

  static desaturate(color: string, amount: number = 0.2): string {
    const rgb = this.parseColor(color);
    if (!rgb) return color;

    const hsl = this.rgbToHsl(rgb);
    hsl.s = Math.max(0, hsl.s - amount * 100);

    const newRgb = this.hslToRgb(hsl);
    return this.rgbToHex(newRgb);
  }

  static getContrastColor(backgroundColor: string): string {
    const rgb = this.parseColor(backgroundColor);
    if (!rgb) return '#000000';

    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  static getLuminance(color: string): number {
    const rgb = this.parseColor(color);
    if (!rgb) return 0;

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  static getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  static generateComplementary(color: string): string {
    const rgb = this.parseColor(color);
    if (!rgb) return color;

    const hsl = this.rgbToHsl(rgb);
    hsl.h = (hsl.h + 180) % 360;

    const newRgb = this.hslToRgb(hsl);
    return this.rgbToHex(newRgb);
  }

  static generateAnalogous(color: string): string[] {
    const rgb = this.parseColor(color);
    if (!rgb) return [color];

    const hsl = this.rgbToHsl(rgb);
    const colors: string[] = [];

    [-30, 0, 30].forEach(offset => {
      const newHsl = { ...hsl, h: (hsl.h + offset + 360) % 360 };
      const newRgb = this.hslToRgb(newHsl);
      colors.push(this.rgbToHex(newRgb));
    });

    return colors;
  }

  static generateTriadic(color: string): string[] {
    const rgb = this.parseColor(color);
    if (!rgb) return [color];

    const hsl = this.rgbToHsl(rgb);
    const colors: string[] = [];

    [0, 120, 240].forEach(offset => {
      const newHsl = { ...hsl, h: (hsl.h + offset) % 360 };
      const newRgb = this.hslToRgb(newHsl);
      colors.push(this.rgbToHex(newRgb));
    });

    return colors;
  }

  static generateSplitComplementary(color: string): string[] {
    const rgb = this.parseColor(color);
    if (!rgb) return [color];

    const hsl = this.rgbToHsl(rgb);
    const colors: string[] = [];

    [0, 150, 210].forEach(offset => {
      const newHsl = { ...hsl, h: (hsl.h + offset) % 360 };
      const newRgb = this.hslToRgb(newHsl);
      colors.push(this.rgbToHex(newRgb));
    });

    return colors;
  }

  static generateShades(color: string, count: number = 5): string[] {
    const rgb = this.parseColor(color);
    if (!rgb) return [color];

    const hsl = this.rgbToHsl(rgb);
    const shades: string[] = [];

    for (let i = 0; i < count; i++) {
      const newHsl = { ...hsl, l: (hsl.l * (count - i)) / count };
      const newRgb = this.hslToRgb(newHsl);
      shades.push(this.rgbToHex(newRgb));
    }

    return shades;
  }

  static generateTints(color: string, count: number = 5): string[] {
    const rgb = this.parseColor(color);
    if (!rgb) return [color];

    const hsl = this.rgbToHsl(rgb);
    const tints: string[] = [];

    for (let i = 0; i < count; i++) {
      const newHsl = {
        ...hsl,
        l: hsl.l + ((100 - hsl.l) * i) / (count - 1)
      };
      const newRgb = this.hslToRgb(newHsl);
      tints.push(this.rgbToHex(newRgb));
    }

    return tints;
  }

  static generateTones(color: string, count: number = 5): string[] {
    const rgb = this.parseColor(color);
    if (!rgb) return [color];

    const hsl = this.rgbToHsl(rgb);
    const tones: string[] = [];

    for (let i = 0; i < count; i++) {
      const newHsl = {
        ...hsl,
        s: hsl.s * (count - i) / count
      };
      const newRgb = this.hslToRgb(newHsl);
      tones.push(this.rgbToHex(newRgb));
    }

    return tones;
  }

  static randomColor(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return this.rgbToHex({ r, g, b });
  }

  static randomColorWithSaturation(minSaturation: number = 50): string {
    const h = Math.random() * 360;
    const s = Math.max(minSaturation, Math.random() * 100);
    const l = 40 + Math.random() * 40;
    return this.hslToHex({ h, s, l });
  }

  static isValidHex(hex: string): boolean {
    return /^#?([a-f\d]{6}|[a-f\d]{3})$/i.test(hex);
  }

  static isValidRgb(rgb: string): boolean {
    return /rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/.test(rgb);
  }

  static normalizeHex(hex: string): string {
    let normalized = hex.replace('#', '');
    if (normalized.length === 3) {
      normalized = normalized
        .split('')
        .map(c => c + c)
        .join('');
    }
    return `#${normalized.toLowerCase()}`;
  }
}

export class ColorPalette {
  private colors: string[] = [];

  constructor(baseColor?: string) {
    if (baseColor) {
      this.colors = ColorUtils2.generateShades(baseColor, 5);
    }
  }

  add(color: string): this {
    this.colors.push(color);
    return this;
  }

  remove(index: number): this {
    this.colors.splice(index, 1);
    return this;
  }

  getColors(): string[] {
    return [...this.colors];
  }

  getPrimary(): string | undefined {
    return this.colors[Math.floor(this.colors.length / 2)];
  }

  getLightest(): string | undefined {
    return this.colors.reduce((lightest, color) => {
      if (!lightest) return color;
      return ColorUtils2.getLuminance(color) > ColorUtils2.getLuminance(lightest)
        ? color
        : lightest;
    }, this.colors[0]);
  }

  getDarkest(): string | undefined {
    return this.colors.reduce((darkest, color) => {
      if (!darkest) return color;
      return ColorUtils2.getLuminance(color) < ColorUtils2.getLuminance(darkest)
        ? color
        : darkest;
    }, this.colors[0]);
  }
}

export class GradientGenerator {
  static createLinearGradient(
    colors: string[],
    angle: number = 90
  ): string {
    const stops = colors
      .map((color, index) => {
        const position = (index / (colors.length - 1)) * 100;
        return `${color} ${position}%`;
      })
      .join(', ');

    return `linear-gradient(${angle}deg, ${stops})`;
  }

  static createRadialGradient(
    colors: string[],
    shape: 'circle' | 'ellipse' = 'circle'
  ): string {
    const stops = colors
      .map((color, index) => {
        const position = (index / (colors.length - 1)) * 100;
        return `${color} ${position}%`;
      })
      .join(', ');

    return `radial-gradient(${shape}, ${stops})`;
  }

  static createConicGradient(
    colors: string[],
    startAngle: number = 0
  ): string {
    const stops = colors
      .map((color, index) => {
        const position = (index / (colors.length - 1)) * 360;
        return `${color} ${position}deg`;
      })
      .join(', ');

    return `conic-gradient(from ${startAngle}deg, ${stops})`;
  }

  static createRainbowGradient(angle: number = 90): string {
    const colors = [
      '#ff0000',
      '#ff7f00',
      '#ffff00',
      '#00ff00',
      '#0000ff',
      '#4b0082',
      '#9400d3'
    ];
    return this.createLinearGradient(colors, angle);
  }

  static createSunsetGradient(angle: number = 180): string {
    return this.createLinearGradient(['#f093fb', '#f5576c'], angle);
  }

  static createOceanGradient(angle: number = 180): string {
    return this.createLinearGradient(['#4facfe', '#00f2fe'], angle);
  }

  static createForestGradient(angle: number = 180): string {
    return this.createLinearGradient(['#134e5e', '#71b280'], angle);
  }
}

export default ColorUtils2;
