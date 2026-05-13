export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  animation?: 'fade' | 'slide' | 'scale'
}

export interface ModalState {
  isAnimating: boolean
  isVisible: boolean
}

export class ModalManager {
  private static instance: ModalManager
  private modals: Map<string, ModalState> = new Map()
  private listeners: Set<(modals: Map<string, ModalState>) => void> = new Set()
  private zIndex: number = 1000

  private constructor() {}

  static getInstance(): ModalManager {
    if (!ModalManager.instance) {
      ModalManager.instance = new ModalManager()
    }
    return ModalManager.instance
  }

  open(id: string): void {
    this.modals.set(id, {
      isAnimating: true,
      isVisible: true
    })
    this.notifyListeners()

    setTimeout(() => {
      const state = this.modals.get(id)
      if (state) {
        state.isAnimating = false
        this.modals.set(id, state)
        this.notifyListeners()
      }
    }, 300)
  }

  close(id: string): void {
    const state = this.modals.get(id)
    if (state) {
      state.isAnimating = true
      this.modals.set(id, state)
      this.notifyListeners()

      setTimeout(() => {
        this.modals.delete(id)
        this.notifyListeners()
      }, 300)
    }
  }

  toggle(id: string): void {
    if (this.modals.has(id)) {
      this.close(id)
    } else {
      this.open(id)
    }
  }

  isOpen(id: string): boolean {
    return this.modals.has(id)
  }

  isAnimating(id: string): boolean {
    return this.modals.get(id)?.isAnimating || false
  }

  closeAll(): void {
    const ids = Array.from(this.modals.keys())
    ids.forEach(id => this.close(id))
  }

  getOpenModals(): string[] {
    return Array.from(this.modals.keys())
  }

  getNextZIndex(): number {
    return ++this.zIndex
  }

  subscribe(callback: (modals: Map<string, ModalState>) => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.modals)
      } catch {
        // Silently ignore listener errors
      }
    })
  }
}

export const modalManager = ModalManager.getInstance()

export function createModal(id: string): {
  open: () => void
  close: () => void
  toggle: () => void
  isOpen: () => boolean
} {
  return {
    open: () => modalManager.open(id),
    close: () => modalManager.close(id),
    toggle: () => modalManager.toggle(id),
    isOpen: () => modalManager.isOpen(id)
  }
}
