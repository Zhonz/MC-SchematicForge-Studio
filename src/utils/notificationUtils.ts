export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface NotificationOptions {
  id?: string;
  type?: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  persistent?: boolean;
  actions?: NotificationAction[];
  icon?: string;
  onClick?: () => void;
  onClose?: () => void;
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration: number;
  dismissible: boolean;
  persistent: boolean;
  actions: NotificationAction[];
  icon?: string;
  onClick?: () => void;
  onClose?: () => void;
  createdAt: number;
}

export class NotificationUtils {
  private static notifications: Map<string, Notification> = new Map();
  private static listeners: Set<() => void> = new Set();
  private static defaultDuration = 5000;

  static show(options: NotificationOptions): string {
    const id = options.id || this.generateId();
    const notification: Notification = {
      id,
      type: options.type || 'default',
      title: options.title,
      message: options.message,
      duration: options.duration ?? this.defaultDuration,
      dismissible: options.dismissible ?? true,
      persistent: options.persistent ?? false,
      actions: options.actions || [],
      icon: options.icon,
      onClick: options.onClick,
      onClose: options.onClose,
      createdAt: Date.now()
    };

    this.notifications.set(id, notification);
    this.notifyListeners();

    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);
    }

    return id;
  }

  static success(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({ ...options, type: 'success', message });
  }

  static error(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({ ...options, type: 'error', message });
  }

  static warning(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({ ...options, type: 'warning', message });
  }

  static info(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({ ...options, type: 'info', message });
  }

  static dismiss(id: string): boolean {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.onClose?.();
      this.notifications.delete(id);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  static dismissAll(): void {
    this.notifications.forEach(notification => {
      notification.onClose?.();
    });
    this.notifications.clear();
    this.notifyListeners();
  }

  static get(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  static getAll(): Notification[] {
    return Array.from(this.notifications.values());
  }

  static getByType(type: NotificationType): Notification[] {
    return this.getAll().filter(n => n.type === type);
  }

  static count(): number {
    return this.notifications.size;
  }

  static has(id: string): boolean {
    return this.notifications.has(id);
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  static setDefaultDuration(duration: number): void {
    this.defaultDuration = duration;
  }

  static update(id: string, updates: Partial<NotificationOptions>): boolean {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    Object.assign(notification, updates);
    this.notifyListeners();
    return true;
  }

  static moveToTop(id: string): boolean {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    this.notifications.delete(id);
    notification.createdAt = Date.now();
    this.notifications.set(id, notification);
    this.notifyListeners();
    return true;
  }

  private static generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export class ToastNotification {
  private container: HTMLElement;
  private position: ToastPosition;
  private maxToasts: number;

  constructor(options: {
    container?: HTMLElement;
    position?: ToastPosition;
    maxToasts?: number;
  } = {}) {
    this.container = options.container || this.createContainer();
    this.position = options.position || 'top-right';
    this.maxToasts = options.maxToasts || 5;

    this.applyStyles();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  private applyStyles(): void {
    const styles: Record<ToastPosition, React.CSSProperties> = {
      'top-left': { top: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
    };

    Object.assign(this.container.style, {
      position: 'fixed',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      ...styles[this.position]
    });
  }

  show(message: string, options?: {
    type?: NotificationType;
    title?: string;
    duration?: number;
    dismissible?: boolean;
  }): string {
    const toast = document.createElement('div');
    toast.className = `toast toast-${options?.type || 'default'}`;
    toast.style.cssText = `
      min-width: 250px;
      max-width: 400px;
      padding: 16px;
      background: ${this.getBackgroundColor(options?.type)};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    `;

    const icons: Record<NotificationType, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      default: ''
    };

    toast.innerHTML = `
      ${options?.type && icons[options.type] ? `<span style="font-size: 18px">${icons[options.type]}</span>` : ''}
      <div style="flex: 1">
        ${options?.title ? `<div style="font-weight: 600; margin-bottom: 4px">${options.title}</div>` : ''}
        <div>${message}</div>
      </div>
      ${options?.dismissible !== false ? `<button style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; opacity: 0.8">&times;</button>` : ''}
    `;

    const closeBtn = toast.querySelector('button');
    if (closeBtn) {
      closeBtn.onclick = () => this.remove(toast);
    }

    this.container.appendChild(toast);
    this.enforceMaxToasts();

    const duration = options?.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    return toast.id || '';
  }

  private remove(toast: Element): void {
    (toast as HTMLElement).style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }

  private enforceMaxToasts(): void {
    const toasts = this.container.children;
    while (toasts.length > this.maxToasts) {
      this.remove(toasts[0]);
    }
  }

  private getBackgroundColor(type?: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      default: '#343a40'
    };
    return colors[type || 'default'];
  }

  success(message: string, options?: { title?: string; duration?: number }): string {
    return this.show(message, { ...options, type: 'success' });
  }

  error(message: string, options?: { title?: string; duration?: number }): string {
    return this.show(message, { ...options, type: 'error' });
  }

  warning(message: string, options?: { title?: string; duration?: number }): string {
    return this.show(message, { ...options, type: 'warning' });
  }

  info(message: string, options?: { title?: string; duration?: number }): string {
    return this.show(message, { ...options, type: 'info' });
  }

  clear(): void {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  destroy(): void {
    this.clear();
    this.container.remove();
  }
}

export type ToastPosition = 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';

export class NotificationCenter {
  private notifications: Notification[] = [];
  private listeners: Set<() => void> = new Set();

  add(notification: Notification): void {
    this.notifications.unshift(notification);
    this.notifyListeners();
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  getAll(): Notification[] {
    return [...this.notifications];
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'alert' | 'prompt';
  onConfirm?: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
}

export class AlertUtils {
  static confirm(options: AlertOptions): Promise<boolean> {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease-out;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        animation: scaleIn 0.2s ease-out;
      `;

      modal.innerHTML = `
        ${options.title ? `<h3 style="margin: 0 0 16px; color: #333">${options.title}</h3>` : ''}
        <p style="margin: 0 0 24px; color: #666; line-height: 1.5">${options.message}</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end">
          <button class="cancel-btn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer">${options.cancelText || 'Cancel'}</button>
          <button class="confirm-btn" style="padding: 10px 20px; border: none; background: #007bff; color: white; border-radius: 6px; cursor: pointer">${options.confirmText || 'Confirm'}</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const close = () => {
        overlay.style.animation = 'fadeOut 0.2s ease-in';
        setTimeout(() => {
          overlay.remove();
          options.onDismiss?.();
        }, 200);
      };

      modal.querySelector('.cancel-btn')?.addEventListener('click', () => {
        close();
        resolve(false);
        options.onCancel?.();
      });

      modal.querySelector('.confirm-btn')?.addEventListener('click', () => {
        close();
        resolve(true);
        options.onConfirm?.();
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          close();
          resolve(false);
        }
      });
    });
  }

  static alert(options: Omit<AlertOptions, 'cancelText' | 'onCancel'>): Promise<void> {
    return new Promise(resolve => {
      this.confirm({
        ...options,
        cancelText: 'OK',
        onCancel: () => resolve()
      });
    });
  }

  static prompt(options: {
    title?: string;
    message: string;
    defaultValue?: string;
    onSubmit?: (value: string) => void;
    onCancel?: () => void;
  }): Promise<string | null> {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease-out;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        animation: scaleIn 0.2s ease-out;
      `;

      modal.innerHTML = `
        ${options.title ? `<h3 style="margin: 0 0 16px; color: #333">${options.title}</h3>` : ''}
        <p style="margin: 0 0 16px; color: #666; line-height: 1.5">${options.message}</p>
        <input type="text" value="${options.defaultValue || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 24px; box-sizing: border-box" />
        <div style="display: flex; gap: 12px; justify-content: flex-end">
          <button class="cancel-btn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer">Cancel</button>
          <button class="submit-btn" style="padding: 10px 20px; border: none; background: #007bff; color: white; border-radius: 6px; cursor: pointer">Submit</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const input = modal.querySelector('input') as HTMLInputElement;
      input?.focus();
      input?.select();

      const close = () => {
        overlay.style.animation = 'fadeOut 0.2s ease-in';
        setTimeout(() => overlay.remove(), 200);
      };

      modal.querySelector('.cancel-btn')?.addEventListener('click', () => {
        close();
        resolve(null);
        options.onCancel?.();
      });

      modal.querySelector('.submit-btn')?.addEventListener('click', () => {
        const value = input?.value || '';
        close();
        resolve(value);
        options.onSubmit?.(value);
      });

      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const value = input?.value || '';
          close();
          resolve(value);
          options.onSubmit?.(value);
        }
        if (e.key === 'Escape') {
          close();
          resolve(null);
        }
      });
    });
  }
}

export default NotificationUtils;
