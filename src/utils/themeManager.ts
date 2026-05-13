export type ThemeName = 'dark' | 'light' | 'auto'
export type ThemeColors = 'blue' | 'green' | 'purple' | 'orange' | 'red'

export interface Theme {
  name: ThemeName
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    error: string
    warning: string
    success: string
    text: {
      primary: string
      secondary: string
      disabled: string
    }
  }
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
  borderRadius: {
    sm: number
    md: number
    lg: number
    full: number
  }
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

const DARK_THEME_BASE: Omit<Theme, 'name'> = {
  colors: {
    primary: '#4a8fd4',
    secondary: '#6b9fd4',
    accent: '#7eb3f0',
    background: '#0f0f0f',
    surface: '#1a1a1a',
    error: '#f44336',
    warning: '#ff9800',
    success: '#4caf50',
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#666666'
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 2px 4px rgba(0, 0, 0, 0.4)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.5)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.6)'
  }
}

const LIGHT_THEME_BASE: Omit<Theme, 'name'> = {
  colors: {
    primary: '#2196f3',
    secondary: '#64b5f6',
    accent: '#90caf9',
    background: '#fafafa',
    surface: '#ffffff',
    error: '#f44336',
    warning: '#ff9800',
    success: '#4caf50',
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#bdbdbd'
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.15)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.2)'
  }
}

export const THEME_PRESETS: Record<ThemeColors, Partial<Theme['colors']>> = {
  blue: {
    primary: '#2196f3',
    accent: '#64b5f6'
  },
  green: {
    primary: '#4caf50',
    accent: '#81c784'
  },
  purple: {
    primary: '#9c27b0',
    accent: '#ba68c8'
  },
  orange: {
    primary: '#ff9800',
    accent: '#ffb74d'
  },
  red: {
    primary: '#f44336',
    accent: '#e57373'
  }
}

export class ThemeManager {
  private currentTheme: ThemeName = 'auto'
  private currentColors: ThemeColors = 'blue'
  private listeners: Set<(theme: Theme) => void> = new Set()
  private mediaQuery: MediaQueryList | null = null

  constructor() {
    this.setupMediaQuery()
  }

  private setupMediaQuery(): void {
    if (typeof window === 'undefined') return

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'auto') {
        this.applyTheme()
      }
    })
  }

  setTheme(theme: ThemeName): void {
    this.currentTheme = theme
    this.applyTheme()
  }

  getTheme(): ThemeName {
    return this.currentTheme
  }

  setColor(color: ThemeColors): void {
    this.currentColors = color
    this.applyTheme()
  }

  getColor(): ThemeColors {
    return this.currentColors
  }

  private getBaseTheme(): Omit<Theme, 'name'> {
    const isDark = this.currentTheme === 'auto'
      ? (this.mediaQuery?.matches ?? false)
      : this.currentTheme === 'dark'

    return isDark ? DARK_THEME_BASE : LIGHT_THEME_BASE
  }

  getCurrentTheme(): Theme {
    const base = this.getBaseTheme()
    const colorPreset = THEME_PRESETS[this.currentColors]

    return {
      name: this.currentTheme,
      colors: {
        ...base.colors,
        ...colorPreset
      },
      spacing: base.spacing,
      borderRadius: base.borderRadius,
      shadows: base.shadows
    }
  }

  private applyTheme(): void {
    const theme = this.getCurrentTheme()
    const root = document.documentElement

    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--color-${key}`, value)
      }
    })

    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, `${value}px`)
    })

    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, `${value}px`)
    })

    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value)
    })

    root.setAttribute('data-theme', this.currentTheme)

    this.notifyListeners()
  }

  subscribe(callback: (theme: Theme) => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(): void {
    const theme = this.getCurrentTheme()
    this.listeners.forEach(callback => {
      try {
        callback(theme)
      } catch (error) {
        console.error('Theme listener error:', error)
      }
    })
  }

  generateCSS(): string {
    const theme = this.getCurrentTheme()
    return `
      :root {
        --color-primary: ${theme.colors.primary};
        --color-secondary: ${theme.colors.secondary};
        --color-accent: ${theme.colors.accent};
        --color-background: ${theme.colors.background};
        --color-surface: ${theme.colors.surface};
        --color-error: ${theme.colors.error};
        --color-warning: ${theme.colors.warning};
        --color-success: ${theme.colors.success};
        --color-text-primary: ${theme.colors.text.primary};
        --color-text-secondary: ${theme.colors.text.secondary};
        --color-text-disabled: ${theme.colors.text.disabled};
      }
    `
  }
}

export const themeManager = new ThemeManager()

export function createThemeVariables(theme: Theme): Record<string, string> {
  return {
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--color-accent': theme.colors.accent,
    '--color-background': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-error': theme.colors.error,
    '--color-warning': theme.colors.warning,
    '--color-success': theme.colors.success,
    '--color-text-primary': theme.colors.text.primary,
    '--color-text-secondary': theme.colors.text.secondary,
    '--color-text-disabled': theme.colors.text.disabled,
    '--spacing-xs': `${theme.spacing.xs}px`,
    '--spacing-sm': `${theme.spacing.sm}px`,
    '--spacing-md': `${theme.spacing.md}px`,
    '--spacing-lg': `${theme.spacing.lg}px`,
    '--spacing-xl': `${theme.spacing.xl}px`,
    '--radius-sm': `${theme.borderRadius.sm}px`,
    '--radius-md': `${theme.borderRadius.md}px`,
    '--radius-lg': `${theme.borderRadius.lg}px`,
    '--radius-full': `${theme.borderRadius.full}px`,
    '--shadow-sm': theme.shadows.sm,
    '--shadow-md': theme.shadows.md,
    '--shadow-lg': theme.shadows.lg,
    '--shadow-xl': theme.shadows.xl
  }
}

export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}
