export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
  actions?: Array<{
    label: string
    onClick: () => void
  }>
  timestamp: number
}

export type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export interface NotificationOptions {
  position?: Position
  maxVisible?: number
  defaultDuration?: number
  stackBehavior?: 'replace' | 'stack'
}

export class NotificationManager {
  private static instance: NotificationManager
  private notifications: Map<string, Notification> = new Map()
  private listeners: Set<(notifications: Notification[]) => void> = new Set()
  private container: HTMLElement | null = null
  private options: Required<NotificationOptions>

  private constructor(options: NotificationOptions = {}) {
    this.options = {
      position: options.position || 'top-right',
      maxVisible: options.maxVisible || 5,
      defaultDuration: options.defaultDuration || 5000,
      stackBehavior: options.stackBehavior || 'stack'
    }
  }

  static getInstance(options?: NotificationOptions): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager(options)
    }
    return NotificationManager.instance
  }

  private createContainer(): HTMLElement {
    if (this.container) return this.container

    this.container = document.createElement('div')
    this.container.className = 'notification-container'
    this.container.style.cssText = `
      position: fixed;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `

    const positions: Record<Position, string> = {
      'top-left': 'top: 16px; left: 16px;',
      'top-center': 'top: 16px; left: 50%; transform: translateX(-50%);',
      'top-right': 'top: 16px; right: 16px;',
      'bottom-left': 'bottom: 16px; left: 16px;',
      'bottom-center': 'bottom: 16px; left: 50%; transform: translateX(-50%);',
      'bottom-right': 'bottom: 16px; right: 16px;'
    }

    this.container.style.cssText += positions[this.options.position]

    document.body.appendChild(this.container)
    return this.container
  }

  show(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const fullNotification: Notification = {
      id,
      timestamp: Date.now(),
      dismissible: true,
      duration: this.options.defaultDuration,
      ...notification
    }

    if (this.options.stackBehavior === 'replace' && this.notifications.size >= this.options.maxVisible) {
      const oldestId = this.notifications.keys().next().value
      if (oldestId) {
        this.dismiss(oldestId)
      }
    }

    this.notifications.set(id, fullNotification)
    this.render()
    this.notifyListeners()

    if (fullNotification.duration && fullNotification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id)
      }, fullNotification.duration)
    }

    return id
  }

  success(title: string, message?: string): string {
    return this.show({ type: 'success', title, message })
  }

  error(title: string, message?: string): string {
    return this.show({ type: 'error', title, message, duration: 0 })
  }

  warning(title: string, message?: string): string {
    return this.show({ type: 'warning', title, message })
  }

  info(title: string, message?: string): string {
    return this.show({ type: 'info', title, message })
  }

  dismiss(id: string): void {
    const notification = this.notifications.get(id)
    if (!notification) return

    const element = document.getElementById(id)
    if (element) {
      element.style.opacity = '0'
      element.style.transform = 'translateX(100%)'
      element.style.transition = 'all 0.3s ease'

      setTimeout(() => {
        element.remove()
      }, 300)
    }

    this.notifications.delete(id)
    this.notifyListeners()
  }

  dismissAll(): void {
    this.notifications.forEach((_, id) => {
      this.dismiss(id)
    })
  }

  private render(): void {
    const container = this.createContainer()

    const visibleNotifications = Array.from(this.notifications.values())
      .slice(-this.options.maxVisible)

    visibleNotifications.forEach((notification, index) => {
      let element = document.getElementById(notification.id)

      if (!element) {
        element = this.createNotificationElement(notification)
        container.appendChild(element)
      }

      element.style.animationDelay = `${index * 0.05}s`
    })
  }

  private createNotificationElement(notification: Notification): HTMLElement {
    const element = document.createElement('div')
    element.id = notification.id
    element.className = `notification notification-${notification.type}`
    element.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: ${this.getBackgroundColor(notification.type)};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 400px;
      pointer-events: auto;
      animation: slideIn 0.3s ease forwards;
    `

    const icon = this.getIcon(notification.type)
    const iconElement = document.createElement('span')
    iconElement.innerHTML = icon
    iconElement.style.cssText = `
      font-size: 20px;
      flex-shrink: 0;
    `
    element.appendChild(iconElement)

    const content = document.createElement('div')
    content.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `

    const title = document.createElement('strong')
    title.textContent = notification.title
    title.style.cssText = `
      color: #fff;
      font-size: 14px;
      font-weight: 600;
    `
    content.appendChild(title)

    if (notification.message) {
      const message = document.createElement('span')
      message.textContent = notification.message
      message.style.cssText = `
        color: rgba(255, 255, 255, 0.8);
        font-size: 13px;
      `
      content.appendChild(message)
    }

    if (notification.actions && notification.actions.length > 0) {
      const actions = document.createElement('div')
      actions.style.cssText = `
        display: flex;
        gap: 8px;
        margin-top: 8px;
      `

      notification.actions.forEach(action => {
        const button = document.createElement('button')
        button.textContent = action.label
        button.style.cssText = `
          padding: 4px 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          background: transparent;
          color: #fff;
          cursor: pointer;
          font-size: 12px;
        `
        button.onclick = () => {
          action.onClick()
          this.dismiss(notification.id)
        }
        actions.appendChild(button)
      })

      content.appendChild(actions)
    }

    element.appendChild(content)

    if (notification.dismissible) {
      const closeButton = document.createElement('button')
      closeButton.innerHTML = '&times;'
      closeButton.style.cssText = `
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      `
      closeButton.onclick = () => this.dismiss(notification.id)
      element.appendChild(closeButton)
    }

    return element
  }

  private getBackgroundColor(type: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      success: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
      error: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
      warning: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
      info: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)'
    }
    return colors[type]
  }

  private getIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      success: '&#10004;',
      error: '&#10006;',
      warning: '&#9888;',
      info: '&#8505;'
    }
    return icons[type]
  }

  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(): void {
    const notifications = Array.from(this.notifications.values())
    this.listeners.forEach(callback => {
      try {
        callback(notifications)
      } catch {
        // Silently ignore listener errors
      }
    })
  }

  getNotifications(): Notification[] {
    return Array.from(this.notifications.values())
  }

  destroy(): void {
    this.dismissAll()
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    this.container = null
    this.notifications.clear()
    this.listeners.clear()
  }
}

export const notifications = NotificationManager.getInstance()

export function toast(title: string, message?: string, type?: NotificationType): string {
  return notifications.show({ type: type || 'info', title, message })
}

export function toastSuccess(title: string, message?: string): string {
  return notifications.success(title, message)
}

export function toastError(title: string, message?: string): string {
  return notifications.error(title, message)
}

export function toastWarning(title: string, message?: string): string {
  return notifications.warning(title, message)
}

export function toastInfo(title: string, message?: string): string {
  return notifications.info(title, message)
}
