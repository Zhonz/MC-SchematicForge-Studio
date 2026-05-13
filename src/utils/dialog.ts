export type DialogType = 'modal' | 'drawer' | 'tooltip' | 'popover' | 'confirm' | 'alert'

export interface DialogOptions {
  type?: DialogType
  title?: string
  content?: string
  closable?: boolean
  maskClosable?: boolean
  width?: number | string
  height?: number | string
  zIndex?: number
  animation?: boolean
  placement?: 'top' | 'center' | 'bottom'
  offset?: { x: number; y: number }
  render?: () => unknown
  onClose?: () => void
  onConfirm?: () => void
  onCancel?: () => void
  footer?: unknown
  header?: unknown
}

export interface DialogInstance {
  id: string
  options: DialogOptions
  state: 'opening' | 'open' | 'closing' | 'closed'
  element?: HTMLElement
}

export class DialogManager {
  private static instance: DialogManager
  private dialogs: Map<string, DialogInstance> = new Map()
  private container: HTMLElement | null = null
  private zIndexBase: number = 1000
  private listeners: Map<string, Set<(dialog: DialogInstance) => void>> = new Map()

  private constructor() {
    this.initContainer()
  }

  static getInstance(): DialogManager {
    if (!DialogManager.instance) {
      DialogManager.instance = new DialogManager()
    }
    return DialogManager.instance
  }

  private initContainer(): void {
    if (typeof document === 'undefined') return

    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'dialog-container'
      this.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: ${this.zIndexBase};
      `
      document.body.appendChild(this.container)
    }
  }

  open(options: DialogOptions): string {
    const id = `dialog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const dialog: DialogInstance = {
      id,
      options: {
        type: options.type || 'modal',
        title: options.title || '',
        content: options.content || '',
        closable: options.closable ?? true,
        maskClosable: options.maskClosable ?? true,
        width: options.width || 400,
        height: options.height || 'auto',
        zIndex: options.zIndex || this.getNextZIndex(),
        animation: options.animation ?? true,
        placement: options.placement || 'center',
        offset: options.offset || { x: 0, y: 0 },
        render: options.render,
        onClose: options.onClose,
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
        footer: options.footer,
        header: options.header
      },
      state: 'opening'
    }

    this.dialogs.set(id, dialog)
    this.renderDialog(dialog)
    this.notifyListeners(id, dialog)

    setTimeout(() => {
      dialog.state = 'open'
      this.notifyListeners(id, dialog)
    }, 50)

    return id
  }

  close(id: string): void {
    const dialog = this.dialogs.get(id)
    if (!dialog) return

    dialog.state = 'closing'
    this.notifyListeners(id, dialog)

    if (dialog.element) {
      dialog.element.style.opacity = '0'
      dialog.element.style.transform = 'scale(0.9)'
      
      setTimeout(() => {
        dialog.element?.remove()
        dialog.state = 'closed'
        this.dialogs.delete(id)
        this.notifyListeners(id, dialog)
      }, 200)
    } else {
      dialog.state = 'closed'
      this.dialogs.delete(id)
      this.notifyListeners(id, dialog)
    }

    dialog.options.onClose?.()
  }

  confirm(options: DialogOptions): string {
    return this.open({
      ...options,
      type: 'confirm',
      footer: true,
      header: options.header !== undefined ? options.header : true
    })
  }

  alert(options: DialogOptions): string {
    return this.open({
      ...options,
      type: 'alert',
      closable: false,
      maskClosable: false,
      footer: false,
      header: options.header !== undefined ? options.header : false
    })
  }

  success(content: string, title?: string): string {
    return this.alert({ content, title: title || 'Success' })
  }

  error(content: string, title?: string): string {
    return this.alert({ content, title: title || 'Error' })
  }

  warning(content: string, title?: string): string {
    return this.alert({ content, title: title || 'Warning' })
  }

  info(content: string, title?: string): string {
    return this.alert({ content, title: title || 'Info' })
  }

  private renderDialog(dialog: DialogInstance): void {
    if (!this.container) return

    const { options } = dialog
    const element = document.createElement('div')
    element.className = 'dialog-wrapper'
    element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: ${options.zIndex};
      opacity: 1;
      transform: scale(1);
      transition: opacity 0.2s ease, transform 0.2s ease;
    `

    if (options.type === 'modal' || options.type === 'confirm' || options.type === 'alert') {
      element.innerHTML = `
        <div class="dialog-mask" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
        " data-close="${options.maskClosable}"></div>
        <div class="dialog-content" style="
          position: relative;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          width: ${typeof options.width === 'number' ? options.width + 'px' : options.width};
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
        ">
          ${options.header !== false && (options.title || options.closable) ? `
            <div class="dialog-header" style="
              padding: 16px 20px;
              border-bottom: 1px solid #e8e8e8;
              display: flex;
              align-items: center;
              justify-content: space-between;
            ">
              ${options.title ? `<span style="font-weight: 500; font-size: 16px;">${options.title}</span>` : ''}
              ${options.closable ? `
                <button class="dialog-close" style="
                  border: none;
                  background: none;
                  font-size: 20px;
                  cursor: pointer;
                  padding: 4px;
                  line-height: 1;
                ">×</button>
              ` : ''}
            </div>
          ` : ''}
          <div class="dialog-body" style="padding: 20px;">
            ${options.content}
          </div>
          ${options.footer !== false ? `
            <div class="dialog-footer" style="
              padding: 16px 20px;
              border-top: 1px solid #e8e8e8;
              display: flex;
              justify-content: flex-end;
              gap: 8px;
            ">
              <button class="dialog-cancel" style="
                padding: 8px 16px;
                border: 1px solid #d9d9d9;
                border-radius: 4px;
                background: white;
                cursor: pointer;
              ">Cancel</button>
              <button class="dialog-ok" style="
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                background: #1890ff;
                color: white;
                cursor: pointer;
              ">OK</button>
            </div>
          ` : ''}
        </div>
      `

      const mask = element.querySelector('[data-close]')
      const closeBtn = element.querySelector('.dialog-close')
      const cancelBtn = element.querySelector('.dialog-cancel')
      const okBtn = element.querySelector('.dialog-ok')

      if (mask) {
        mask.addEventListener('click', () => {
          if (options.maskClosable) this.close(dialog.id)
        })
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close(dialog.id))
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          options.onCancel?.()
          this.close(dialog.id)
        })
      }

      if (okBtn) {
        okBtn.addEventListener('click', () => {
          options.onConfirm?.()
          this.close(dialog.id)
        })
      }
    }

    dialog.element = element
    this.container.appendChild(element)
  }

  private getNextZIndex(): number {
    let maxZ = this.zIndexBase
    this.dialogs.forEach(dialog => {
      if (dialog.options.zIndex && dialog.options.zIndex > maxZ) {
        maxZ = dialog.options.zIndex
      }
    })
    return maxZ + 1
  }

  getDialog(id: string): DialogInstance | undefined {
    return this.dialogs.get(id)
  }

  getAllDialogs(): DialogInstance[] {
    return Array.from(this.dialogs.values())
  }

  hasOpenDialogs(): boolean {
    return this.dialogs.size > 0
  }

  closeAll(): void {
    const ids = Array.from(this.dialogs.keys())
    ids.forEach(id => this.close(id))
  }

  subscribe(id: string, listener: (dialog: DialogInstance) => void): () => void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set())
    }
    this.listeners.get(id)!.add(listener)

    return () => {
      this.listeners.get(id)?.delete(listener)
    }
  }

  private notifyListeners(id: string, dialog: DialogInstance): void {
    this.listeners.get(id)?.forEach(listener => listener(dialog))
  }
}

export const dialogs = DialogManager.getInstance()

export const modal = {
  open: (options: DialogOptions) => dialogs.open({ ...options, type: 'modal' }),
  close: (id: string) => dialogs.close(id),
  confirm: (options: DialogOptions) => dialogs.confirm(options),
  alert: (options: DialogOptions) => dialogs.alert(options),
  success: (content: string, title?: string) => dialogs.success(content, title),
  error: (content: string, title?: string) => dialogs.error(content, title),
  warning: (content: string, title?: string) => dialogs.warning(content, title),
  info: (content: string, title?: string) => dialogs.info(content, title)
}
