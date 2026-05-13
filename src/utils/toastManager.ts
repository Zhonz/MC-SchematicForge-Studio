export interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  position?: 'top' | 'bottom' | 'center'
  align?: 'left' | 'center' | 'right'
  icon?: boolean
  progress?: boolean
  closeButton?: boolean
}

export interface Toast {
  id: string
  message: string
  type: ToastOptions['type']
  duration: number
  position: ToastOptions['position']
  align: ToastOptions['align']
  icon: boolean
  progress: boolean
  closeButton: boolean
  createdAt: number
}

export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export interface ToastConfig {
  position?: ToastPosition
  maxToasts?: number
  defaultDuration?: number
  animationDuration?: number
  enableProgress?: boolean
  enableIcons?: boolean
}

export class ToastManager {
  private static instance: ToastManager
  private toasts: Toast[] = []
  private listeners: Set<(toasts: Toast[]) => void> = new Set()
  private config: Required<ToastConfig>

  private constructor(config: ToastConfig = {}) {
    this.config = {
      position: config.position || 'top-center',
      maxToasts: config.maxToasts || 5,
      defaultDuration: config.defaultDuration || 3000,
      animationDuration: config.animationDuration || 300,
      enableProgress: config.enableProgress ?? true,
      enableIcons: config.enableIcons ?? true
    }
  }

  static getInstance(config?: ToastConfig): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager(config)
    }
    return ToastManager.instance
  }

  show(options: ToastOptions): string {
    const id = this.generateId()
    
    const [position = 'top', align = 'center'] = this.config.position.split('-') as [ToastOptions['position'], ToastOptions['align']]

    const toast: Toast = {
      id,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration ?? this.config.defaultDuration,
      position: options.position || position,
      align: options.align || align,
      icon: options.icon ?? this.config.enableIcons,
      progress: options.progress ?? this.config.enableProgress,
      closeButton: options.closeButton ?? true,
      createdAt: Date.now()
    }

    this.toasts.push(toast)

    if (this.toasts.length > this.config.maxToasts) {
      this.toasts.shift()
    }

    this.notifyListeners()

    if (toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration)
    }

    return id
  }

  success(message: string, options?: Partial<ToastOptions>): string {
    return this.show({ ...options, type: 'success', message })
  }

  error(message: string, options?: Partial<ToastOptions>): string {
    return this.show({ 
      ...options, 
      type: 'error', 
      message,
      duration: options?.duration ?? 5000
    })
  }

  info(message: string, options?: Partial<ToastOptions>): string {
    return this.show({ ...options, type: 'info', message })
  }

  warning(message: string, options?: Partial<ToastOptions>): string {
    return this.show({ ...options, type: 'warning', message })
  }

  dismiss(id: string): void {
    const index = this.toasts.findIndex(t => t.id === id)
    if (index !== -1) {
      this.toasts.splice(index, 1)
      this.notifyListeners()
    }
  }

  dismissAll(): void {
    this.toasts = []
    this.notifyListeners()
  }

  getToasts(): Toast[] {
    return [...this.toasts]
  }

  subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(): void {
    const toasts = this.getToasts()
    this.listeners.forEach(listener => listener(toasts))
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  setConfig(config: Partial<ToastConfig>): void {
    Object.assign(this.config, config)
  }

  getConfig(): ToastConfig {
    return { ...this.config }
  }
}

export const toasts = ToastManager.getInstance()

export const toast = {
  show: (options: ToastOptions) => toasts.show(options),
  success: (message: string, options?: Partial<ToastOptions>) => toasts.success(message, options),
  error: (message: string, options?: Partial<ToastOptions>) => toasts.error(message, options),
  info: (message: string, options?: Partial<ToastOptions>) => toasts.info(message, options),
  warning: (message: string, options?: Partial<ToastOptions>) => toasts.warning(message, options),
  dismiss: (id: string) => toasts.dismiss(id),
  dismissAll: () => toasts.dismissAll()
}
