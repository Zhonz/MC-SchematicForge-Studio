export interface NotificationOptions {
  title: string
  body?: string
  icon?: string
  badge?: string
  tag?: string
  data?: unknown
  requireInteraction?: boolean
  silent?: boolean
  actions?: Array<{ action: string; title: string; icon?: string }>
}

export class NotificationManager {
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      return await Notification.requestPermission()
    }

    return Notification.permission
  }

  static isSupported(): boolean {
    return 'Notification' in window
  }

  static isPermissionGranted(): boolean {
    return Notification.permission === 'granted'
  }

  static getPermission(): NotificationPermission {
    return Notification.permission
  }

  static async show(options: NotificationOptions): Promise<Notification | null> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported')
      return null
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission not granted')
      return null
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon,
      badge: options.badge,
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      silent: options.silent,
      data: options.data
    })

    notification.addEventListener('click', () => {
      notification.close()
      window.focus()
    })

    return notification
  }

  static onAction(callback: (action: string, notification: Notification, data?: unknown) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ action: string; notification: Notification; data?: unknown }>
      callback(customEvent.detail.action, customEvent.detail.notification, customEvent.detail.data)
    }

    document.addEventListener('notificationaction', handler)
    return () => document.removeEventListener('notificationaction', handler)
  }

  static schedule(title: string, opts: Omit<NotificationOptions, 'title'>, delay: number): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      this.show({ title, ...opts })
    }, delay)
  }

  static closeAll(): void {
    const notifications = document.querySelectorAll('.notification')
    notifications.forEach(n => n instanceof Notification && n.close())
  }

  static showToast(title: string, message: string, duration = 3000): void {
    const toast = document.createElement('div')
    toast.className = 'toast-notification'
    toast.innerHTML = `<strong>${title}</strong><p>${message}</p>`

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '16px',
      backgroundColor: '#333',
      color: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: '9999',
      maxWidth: '300px',
      animation: 'slideIn 0.3s ease-out'
    })

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in'
      setTimeout(() => toast.remove(), 300)
    }, duration)
  }
}

export function notify(title: string, options?: Omit<NotificationOptions, 'title'>): Promise<Notification | null> {
  return NotificationManager.show({ title, ...options })
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return NotificationManager.requestPermission()
}
