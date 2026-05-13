export interface FocusTrapOptions {
  initialFocus?: string
  returnFocusOnDeactivate?: boolean
  escapeDeactivates?: boolean
  allowOutsideClick?: boolean | ((event: MouseEvent) => boolean)
}

export class FocusTrap {
  private container: HTMLElement
  private previousActiveElement: Element | null = null
  private options: {
    initialFocus: string
    returnFocusOnDeactivate: boolean
    escapeDeactivates: boolean
    allowOutsideClick: boolean | ((event: MouseEvent) => boolean)
  }
  private listeners: Array<() => void> = []

  constructor(container: HTMLElement, options: FocusTrapOptions = {}) {
    this.container = container
    this.options = {
      initialFocus: options.initialFocus || '',
      returnFocusOnDeactivate: options.returnFocusOnDeactivate ?? true,
      escapeDeactivates: options.escapeDeactivates ?? true,
      allowOutsideClick: options.allowOutsideClick ?? false
    }

    this.activate()
  }

  activate(): void {
    this.previousActiveElement = document.activeElement

    const focusable = this.getFocusableElements()
    if (focusable.length > 0) {
      const initial = this.options.initialFocus
        ? this.container.querySelector(this.options.initialFocus)
        : focusable[0]
      ;(initial as HTMLElement)?.focus()
    }

    this.listeners.push(
      this.addEventListener(document, 'keydown', this.handleKeyDown)
    )

    if (typeof this.options.allowOutsideClick === 'function') {
      this.listeners.push(
        this.addEventListener(document, 'click', this.handleOutsideClick)
      )
    }
  }

  deactivate(): void {
    this.listeners.forEach(stop => stop())
    this.listeners = []

    if (this.options.returnFocusOnDeactivate && this.previousActiveElement instanceof HTMLElement) {
      this.previousActiveElement.focus()
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',')

    return Array.from(this.container.querySelectorAll<HTMLElement>(selector))
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Tab') {
      this.handleTab(e)
    } else if (e.key === 'Escape' && this.options.escapeDeactivates) {
      this.deactivate()
    }
  }

  private handleTab = (e: KeyboardEvent): void => {
    const focusable = this.getFocusableElements()
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }

    const active = document.activeElement as HTMLElement
    const index = focusable.indexOf(active)

    if (e.shiftKey && index === 0) {
      e.preventDefault()
      focusable[focusable.length - 1].focus()
    } else if (!e.shiftKey && index === focusable.length - 1) {
      e.preventDefault()
      focusable[0].focus()
    }
  }

  private handleOutsideClick = (e: MouseEvent): void => {
    if (!this.container.contains(e.target as Node)) {
      if (typeof this.options.allowOutsideClick === 'function') {
        if (this.options.allowOutsideClick(e)) {
          this.deactivate()
        }
      } else if (this.options.allowOutsideClick) {
        this.deactivate()
      }
    }
  }

  private addEventListener<K extends keyof DocumentEventMap>(
    target: Document | HTMLElement,
    event: K,
    handler: (e: DocumentEventMap[K]) => void
  ): () => void {
    const wrapped = handler as EventListener
    target.addEventListener(event, wrapped)
    return () => target.removeEventListener(event, wrapped)
  }
}

export function trapFocus(container: HTMLElement, options?: FocusTrapOptions): FocusTrap {
  return new FocusTrap(container, options)
}
