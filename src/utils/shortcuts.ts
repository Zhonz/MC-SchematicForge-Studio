export type KeyboardShortcutType = 'key' | 'modifier' | 'sequence' | 'chord'

export interface ShortcutDefinition {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  code?: string
  description?: string
  action: () => void
  condition?: () => boolean
}

export interface ShortcutEvent {
  shortcut: ShortcutDefinition
  timestamp: number
  triggered: boolean
}

export interface ShortcutGroup {
  name: string
  shortcuts: ShortcutDefinition[]
}

export class ShortcutManager {
  private static instance: ShortcutManager
  private shortcuts: Map<string, ShortcutDefinition> = new Map()
  private groups: Map<string, ShortcutGroup> = new Map()
  private listeners: Map<string, Set<(event: ShortcutEvent) => void>> = new Map()
  private enabled: boolean = true
  private context: HTMLElement | null = null

  private constructor() {
    this.setupListeners()
  }

  static getInstance(): ShortcutManager {
    if (!ShortcutManager.instance) {
      ShortcutManager.instance = new ShortcutManager()
    }
    return ShortcutManager.instance
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return
      this.handleKeyDown(e)
    })
  }

  setContext(element: HTMLElement | null): void {
    this.context = element
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.context && !this.context.contains(e.target as Node)) {
      return
    }

    const key = this.getKeyCombo(e)
    const shortcut = this.shortcuts.get(key)

    if (shortcut) {
      if (shortcut.condition && !shortcut.condition()) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      const event: ShortcutEvent = {
        shortcut,
        timestamp: Date.now(),
        triggered: true
      }

      this.notifyListeners(key, event)
      shortcut.action()
    }
  }

  private getKeyCombo(e: KeyboardEvent): string {
    const parts: string[] = []

    if (e.ctrlKey || e.metaKey) parts.push('ctrl')
    if (e.shiftKey) parts.push('shift')
    if (e.altKey) parts.push('alt')
    if (e.metaKey) parts.push('meta')

    if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') {
      return parts.join('+')
    }

    parts.push(e.key.toLowerCase())

    return parts.join('+')
  }

  register(identifier: string, shortcut: ShortcutDefinition): void {
    const key = this.buildKey(shortcut)
    this.shortcuts.set(key, { ...shortcut })
    this.shortcuts.set(identifier, { ...shortcut, key })
  }

  registerGroup(group: ShortcutGroup): void {
    this.groups.set(group.name, group)
    group.shortcuts.forEach((shortcut, index) => {
      this.register(`${group.name}:${index}`, shortcut)
    })
  }

  unregister(identifier: string): void {
    this.shortcuts.delete(identifier)
  }

  unregisterGroup(name: string): void {
    const group = this.groups.get(name)
    if (group) {
      group.shortcuts.forEach((_, index) => {
        this.shortcuts.delete(`${name}:${index}`)
      })
      this.groups.delete(name)
    }
  }

  private buildKey(shortcut: ShortcutDefinition): string {
    const parts: string[] = []

    if (shortcut.ctrl) parts.push('ctrl')
    if (shortcut.shift) parts.push('shift')
    if (shortcut.alt) parts.push('alt')
    if (shortcut.meta) parts.push('meta')

    parts.push(shortcut.key.toLowerCase())

    return parts.join('+')
  }

  getShortcut(identifier: string): ShortcutDefinition | undefined {
    return this.shortcuts.get(identifier)
  }

  getShortcuts(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values())
  }

  getShortcutsByGroup(name: string): ShortcutDefinition[] {
    return this.groups.get(name)?.shortcuts || []
  }

  getAllGroups(): ShortcutGroup[] {
    return Array.from(this.groups.values())
  }

  getShortcutString(identifier: string): string {
    const shortcut = this.shortcuts.get(identifier)
    if (!shortcut) return ''

    const parts: string[] = []

    if (shortcut.ctrl) parts.push('⌘')
    if (shortcut.shift) parts.push('⇧')
    if (shortcut.alt) parts.push('⌥')

    let key = shortcut.key.toUpperCase()
    if (key === ' ') key = 'Space'
    if (key === 'ARROWUP') key = '↑'
    if (key === 'ARROWDOWN') key = '↓'
    if (key === 'ARROWLEFT') key = '←'
    if (key === 'ARROWRIGHT') key = '→'
    if (key === 'BACKSPACE') key = '⌫'
    if (key === 'DELETE') key = '⌦'
    if (key === 'ENTER') key = '↵'
    if (key === 'TAB') key = '⇥'
    if (key === 'ESCAPE') key = 'Esc'

    parts.push(key)

    return parts.join('')
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  isEnabled(): boolean {
    return this.enabled
  }

  subscribe(identifier: string, listener: (event: ShortcutEvent) => void): () => void {
    if (!this.listeners.has(identifier)) {
      this.listeners.set(identifier, new Set())
    }
    this.listeners.get(identifier)!.add(listener)

    return () => {
      this.listeners.get(identifier)?.delete(listener)
    }
  }

  private notifyListeners(identifier: string, event: ShortcutEvent): void {
    this.listeners.get(identifier)?.forEach(listener => listener(event))
  }

  reset(): void {
    this.shortcuts.clear()
    this.groups.clear()
  }
}

export const shortcuts = ShortcutManager.getInstance()

export function createShortcut(
  key: string,
  action: () => void,
  options?: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
    description?: string
    condition?: () => boolean
  }
): ShortcutDefinition {
  return {
    key,
    action,
    ctrl: options?.ctrl,
    shift: options?.shift,
    alt: options?.alt,
    meta: options?.meta,
    description: options?.description,
    condition: options?.condition
  }
}

export const commonShortcuts = {
  save: (action: () => void) => createShortcut('s', action, { ctrl: true, description: 'Save' }),
  undo: (action: () => void) => createShortcut('z', action, { ctrl: true, description: 'Undo' }),
  redo: (action: () => void) => createShortcut('z', action, { ctrl: true, shift: true, description: 'Redo' }),
  copy: (action: () => void) => createShortcut('c', action, { ctrl: true, description: 'Copy' }),
  paste: (action: () => void) => createShortcut('v', action, { ctrl: true, description: 'Paste' }),
  cut: (action: () => void) => createShortcut('x', action, { ctrl: true, description: 'Cut' }),
  selectAll: (action: () => void) => createShortcut('a', action, { ctrl: true, description: 'Select All' }),
  find: (action: () => void) => createShortcut('f', action, { ctrl: true, description: 'Find' }),
  escape: (action: () => void) => createShortcut('Escape', action, { description: 'Cancel' }),
  enter: (action: () => void) => createShortcut('Enter', action, { description: 'Confirm' }),
  delete: (action: () => void) => createShortcut('Delete', action, { description: 'Delete' }),
  tab: (action: () => void) => createShortcut('Tab', action, { description: 'Next' }),
  shiftTab: (action: () => void) => createShortcut('Tab', action, { shift: true, description: 'Previous' }),
}
