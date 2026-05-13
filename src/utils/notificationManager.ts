export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface NotificationOptions {
  id?: string
  type?: NotificationType
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  icon?: string
  progress?: number
}

export interface Notification extends NotificationOptions {
  id: string
  createdAt: number
  timeoutId?: ReturnType<typeof setTimeout>
}

export interface NotificationConfig {
  maxNotifications?: number
  defaultDuration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  stacked?: boolean
  animations?: boolean
}

export class NotificationManager {
  private static instance: NotificationManager
  private notifications: Notification[] = []
  private listeners: Set<(notifications: Notification[]) => void> = new Set()
  private config: Required<NotificationConfig>

  private constructor(config: NotificationConfig = {}) {
    this.config = {
      maxNotifications: config.maxNotifications || 5,
      defaultDuration: config.defaultDuration || 4000,
      position: config.position || 'top-right',
      stacked: config.stacked ?? true,
      animations: config.animations ?? true
    }
  }

  static getInstance(config?: NotificationConfig): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager(config)
    }
    return NotificationManager.instance
  }

  show(options: NotificationOptions): string {
    const id = options.id || this.generateId()
    
    const notification: Notification = {
      ...options,
      id,
      type: options.type || 'info',
      duration: options.duration ?? this.config.defaultDuration,
      dismissible: options.dismissible ?? true,
      createdAt: Date.now()
    }

    this.notifications.push(notification)

    if (this.notifications.length > this.config.maxNotifications) {
      const oldest = this.notifications[0]
      if (oldest) {
        this.remove(oldest.id)
      }
    }

    if (notification.duration && notification.duration > 0) {
      notification.timeoutId = setTimeout(() => {
        this.remove(id)
      }, notification.duration)
    }

    this.notifyListeners()

    return id
  }

  success(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({ ...options, type: 'success', message })
  }

  error(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({ 
      ...options, 
      type: 'error', 
      message,
      duration: options?.duration ?? 6000
    })
  }

  warning(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({ ...options, type: 'warning', message })
  }

  info(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({ ...options, type: 'info', message })
  }

  loading(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({ 
      ...options, 
      type: 'loading', 
      message,
      duration: 0,
      dismissible: false
    })
  }

  update(id: string, updates: Partial<NotificationOptions>): boolean {
    const notification = this.notifications.find(n => n.id === id)
    if (!notification) return false

    Object.assign(notification, updates)
    this.notifyListeners()
    return true
  }

  dismiss(id: string): void {
    this.remove(id)
  }

  dismissAll(): void {
    this.notifications.forEach(n => {
      if (n.timeoutId) {
        clearTimeout(n.timeoutId)
      }
    })
    this.notifications = []
    this.notifyListeners()
  }

  private remove(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index !== -1) {
      const notification = this.notifications[index]
      if (notification.timeoutId) {
        clearTimeout(notification.timeoutId)
      }
      this.notifications.splice(index, 1)
      this.notifyListeners()
    }
  }

  getNotifications(): Notification[] {
    return [...this.notifications]
  }

  getNotification(id: string): Notification | undefined {
    return this.notifications.find(n => n.id === id)
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(): void {
    const notifications = this.getNotifications()
    this.listeners.forEach(listener => listener(notifications))
  }

  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  setConfig(config: Partial<NotificationConfig>): void {
    Object.assign(this.config, config)
  }

  getConfig(): NotificationConfig {
    return { ...this.config }
  }
}

export const notifications = NotificationManager.getInstance()

export const notify = {
  success: (message: string, options?: Partial<NotificationOptions>) => 
    notifications.success(message, options),
  error: (message: string, options?: Partial<NotificationOptions>) => 
    notifications.error(message, options),
  warning: (message: string, options?: Partial<NotificationOptions>) => 
    notifications.warning(message, options),
  info: (message: string, options?: Partial<NotificationOptions>) => 
    notifications.info(message, options),
  loading: (message: string, options?: Partial<NotificationOptions>) => 
    notifications.loading(message, options),
  show: (options: NotificationOptions) => notifications.show(options),
  dismiss: (id: string) => notifications.dismiss(id),
  dismissAll: () => notifications.dismissAll()
}
