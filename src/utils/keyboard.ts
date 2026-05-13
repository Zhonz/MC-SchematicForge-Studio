export type KeyboardKey = string

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
}

export interface KeyboardEventData {
  key: string
  code: string
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  metaKey: boolean
}

export type KeyboardHandler = (event: KeyboardEventData) => void

export class KeyboardManager {
  private shortcuts: Map<string, Map<string, KeyboardHandler>> = new Map()
  private globalHandlers: Map<string, KeyboardHandler> = new Map()
  private pressedKeys: Set<string> = new Set()
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      this.bindEvents()
    }
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
    window.addEventListener('blur', this.handleBlur.bind(this))
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return

    const key = event.key.toLowerCase()
    this.pressedKeys.add(key)

    const data: KeyboardEventData = {
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey
    }

    const shortcutKey = this.getShortcutKey(data)
    const handler = this.globalHandlers.get(shortcutKey)
    if (handler) {
      event.preventDefault()
      handler(data)
      return
    }

    const context = this.getCurrentContext()
    if (context) {
      const contextShortcuts = this.shortcuts.get(context)
      if (contextShortcuts) {
        const contextHandler = contextShortcuts.get(shortcutKey)
        if (contextHandler) {
          event.preventDefault()
          contextHandler(data)
        }
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase()
    this.pressedKeys.delete(key)
  }

  private handleBlur(): void {
    this.pressedKeys.clear()
  }

  private getShortcutKey(data: KeyboardEventData): string {
    const parts: string[] = []
    if (data.ctrlKey) parts.push('ctrl')
    if (data.altKey) parts.push('alt')
    if (data.shiftKey) parts.push('shift')
    if (data.metaKey) parts.push('meta')
    parts.push(data.key.toLowerCase())
    return parts.join('+')
  }

  private getCurrentContext(): string | null {
    const activeElement = document.activeElement
    if (!activeElement) return null

    const contextAttr = activeElement.getAttribute('data-keyboard-context')
    return contextAttr
  }

  register(shortcut: KeyboardShortcut, handler: KeyboardHandler, context?: string): () => void {
    const shortcutKey = this.buildShortcutKey(shortcut)

    if (context) {
      if (!this.shortcuts.has(context)) {
        this.shortcuts.set(context, new Map())
      }
      this.shortcuts.get(context)!.set(shortcutKey, handler)
    } else {
      this.globalHandlers.set(shortcutKey, handler)
    }

    return () => {
      if (context) {
        this.shortcuts.get(context)?.delete(shortcutKey)
      } else {
        this.globalHandlers.delete(shortcutKey)
      }
    }
  }

  private buildShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = []
    if (shortcut.ctrl) parts.push('ctrl')
    if (shortcut.alt) parts.push('alt')
    if (shortcut.shift) parts.push('shift')
    if (shortcut.meta) parts.push('meta')
    parts.push(shortcut.key.toLowerCase())
    return parts.join('+')
  }

  unregister(shortcut: KeyboardShortcut, context?: string): void {
    const shortcutKey = this.buildShortcutKey(shortcut)

    if (context) {
      this.shortcuts.get(context)?.delete(shortcutKey)
    } else {
      this.globalHandlers.delete(shortcutKey)
    }
  }

  unregisterContext(context: string): void {
    this.shortcuts.delete(context)
  }

  clear(): void {
    this.shortcuts.clear()
    this.globalHandlers.clear()
  }

  isPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase())
  }

  arePressed(...keys: string[]): boolean {
    return keys.every(key => this.pressedKeys.has(key.toLowerCase()))
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  getPressedKeys(): string[] {
    return Array.from(this.pressedKeys)
  }

  createSequenceHandler(keys: string[], handler: KeyboardHandler, timeout = 1000): () => void {
    let sequence: string[] = []
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const checkSequence = (key: string) => {
      if (timeoutId) clearTimeout(timeoutId)

      sequence.push(key)

      const expectedSequence = keys.slice(0, sequence.length).join('+').toLowerCase()
      const actualSequence = sequence.join('+').toLowerCase()

      if (expectedSequence === actualSequence) {
        if (sequence.length === keys.length) {
          handler({
            key: keys[keys.length - 1],
            code: '',
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false
          })
          sequence = []
        } else {
          timeoutId = setTimeout(() => {
            sequence = []
          }, timeout)
        }
      } else {
        sequence = [key]
      }
    }

    const unregister = this.register({ key: '' }, () => {})

    const originalUnregister = this.register({ key: '' }, () => {})
    this.unregister({ key: '' })

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      unregister()
    }
  }
}

export const keyboard = new KeyboardManager()
