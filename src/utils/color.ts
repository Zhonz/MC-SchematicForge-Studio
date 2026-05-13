export interface ColorRGB {
  r: number
  g: number
  b: number
}

export interface ColorRGBA extends ColorRGB {
  a: number
}

export interface ColorHSL {
  h: number
  s: number
  l: number
}

export interface ColorHSV {
  h: number
  s: number
  v: number
}

export interface ColorHex {
  hex: string
  alpha?: number
}

export class Color {
  private r: number
  private g: number
  private b: number
  private a: number

  constructor(r: number, g: number, b: number, a = 1) {
    this.r = Math.max(0, Math.min(255, r))
    this.g = Math.max(0, Math.min(255, g))
    this.b = Math.max(0, Math.min(255, b))
    this.a = Math.max(0, Math.min(1, a))
  }

  static fromRGB(r: number, g: number, b: number, a = 1): Color {
    return new Color(r, g, b, a)
  }

  static fromHex(hex: string, alpha = 1): Color {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return new Color(0, 0, 0, alpha)
    return new Color(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), alpha)
  }

  static fromHSL(h: number, s: number, l: number, a = 1): Color {
    h = h / 360
    s = s / 100
    l = l / 100

    let r, g, b
    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    return new Color(r * 255, g * 255, b * 255, a)
  }

  static fromHSV(h: number, s: number, v: number, a = 1): Color {
    h = h / 360
    s = s / 100
    v = v / 100

    let r, g, b
    const i = Math.floor(h * 6)
    const f = h * 6 - i
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)

    switch (i % 6) {
      case 0: r = v; g = t; b = p; break
      case 1: r = q; g = v; b = p; break
      case 2: r = p; g = v; b = t; break
      case 3: r = p; g = q; b = v; break
      case 4: r = t; g = p; b = v; break
      case 5: r = v; g = p; b = q; break
      default: r = 0; g = 0; b = 0
    }

    return new Color(r * 255, g * 255, b * 255, a)
  }

  toRGB(): ColorRGB {
    return { r: Math.round(this.r), g: Math.round(this.g), b: Math.round(this.b) }
  }

  toRGBA(): ColorRGBA {
    return { r: Math.round(this.r), g: Math.round(this.g), b: Math.round(this.b), a: this.a }
  }

  toHex(): string {
    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
    return `#${toHex(this.r)}${toHex(this.g)}${toHex(this.b)}`
  }

  toHexAlpha(): string {
    return `${this.toHex()}${Math.round(this.a * 255).toString(16).padStart(2, '0')}`
  }

  toHSL(): ColorHSL {
    const r = this.r / 255
    const g = this.g / 255
    const b = this.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }

  toHSV(): ColorHSV {
    const r = this.r / 255
    const g = this.g / 255
    const b = this.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    const v = max
    const d = max - min
    const s = max === 0 ? 0 : d / max

    if (max !== min) {
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) }
  }

  toCSS(): string {
    if (this.a === 1) return this.toHex()
    return `rgba(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)}, ${this.a})`
  }

  toString(): string {
    return this.toCSS()
  }

  lighten(amount: number): Color {
    const hsl = this.toHSL()
    hsl.l = Math.min(100, hsl.l + amount)
    return Color.fromHSL(hsl.h, hsl.s, hsl.l, this.a)
  }

  darken(amount: number): Color {
    const hsl = this.toHSL()
    hsl.l = Math.max(0, hsl.l - amount)
    return Color.fromHSL(hsl.h, hsl.s, hsl.l, this.a)
  }

  saturate(amount: number): Color {
    const hsl = this.toHSL()
    hsl.s = Math.min(100, hsl.s + amount)
    return Color.fromHSL(hsl.h, hsl.s, hsl.l, this.a)
  }

  desaturate(amount: number): Color {
    const hsl = this.toHSL()
    hsl.s = Math.max(0, hsl.s - amount)
    return Color.fromHSL(hsl.h, hsl.s, hsl.l, this.a)
  }

  mix(other: Color, amount: number = 0.5): Color {
    return new Color(
      this.r + (other.r - this.r) * amount,
      this.g + (other.g - this.g) * amount,
      this.b + (other.b - this.b) * amount,
      this.a + (other.a - this.a) * amount
    )
  }

  clone(): Color {
    return new Color(this.r, this.g, this.b, this.a)
  }

  equals(other: Color): boolean {
    return Math.abs(this.r - other.r) < 1 && Math.abs(this.g - other.g) < 1 && Math.abs(this.b - other.b) < 1 && Math.abs(this.a - other.a) < 0.01
  }
}

export function generatePalette(baseColor: Color, count: number): Color[] {
  const palette: Color[] = []
  const hsl = baseColor.toHSL()

  for (let i = 0; i < count; i++) {
    const hue = (hsl.h + (360 / count) * i) % 360
    palette.push(Color.fromHSL(hue, hsl.s, hsl.l))
  }

  return palette
}

export function generateComplementary(color: Color): Color[] {
  const hsl = color.toHSL()
  return [color, Color.fromHSL((hsl.h + 180) % 360, hsl.s, hsl.l)]
}

export function generateTriadic(color: Color): Color[] {
  const hsl = color.toHSL()
  return [color, Color.fromHSL((hsl.h + 120) % 360, hsl.s, hsl.l), Color.fromHSL((hsl.h + 240) % 360, hsl.s, hsl.l)]
}

export function generateAnalogous(color: Color, count = 5): Color[] {
  const palette: Color[] = []
  const hsl = color.toHSL()
  const step = 30

  for (let i = -Math.floor(count / 2); i <= Math.floor(count / 2); i++) {
    palette.push(Color.fromHSL((hsl.h + step * i + 360) % 360, hsl.s, hsl.l))
  }

  return palette
}
