export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta'

export interface ShortcutKey {
  key: string
  modifiers?: ModifierKey[]
  description: string
  category: string
  action: () => void
  enabled?: () => boolean
}

export interface ShortcutGroup {
  name: string
  description: string
  shortcuts: ShortcutKey[]
}

export class KeyboardShortcuts {
  private shortcuts: Map<string, ShortcutKey> = new Map()
  private groups: Map<string, ShortcutGroup> = new Map()
  private enabled: boolean = true
  private listenerId: number = 0

  constructor() {
    this.setupGlobalListener()
  }

  private setupGlobalListener(): void {
    const handler = (e: KeyboardEvent) => {
      if (!this.enabled) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key !== 'Escape') return
      }

      const shortcut = this.findShortcut(e)
      if (shortcut && (!shortcut.enabled || shortcut.enabled())) {
        e.preventDefault()
        e.stopPropagation()
        try {
          shortcut.action()
        } catch (error) {
          console.error('Shortcut action error:', error)
        }
      }
    }

    document.addEventListener('keydown', handler)
    this.listenerId++
  }

  private findShortcut(e: KeyboardEvent): ShortcutKey | undefined {
    const key = e.key.toLowerCase()
    const modifiers = this.getActiveModifiers(e)

    for (const [, shortcut] of this.shortcuts) {
      if (shortcut.key.toLowerCase() !== key) continue
      if (!this.compareModifiers(shortcut.modifiers || [], modifiers)) continue
      return shortcut
    }

    return undefined
  }

  private getActiveModifiers(e: KeyboardEvent): ModifierKey[] {
    const modifiers: ModifierKey[] = []
    if (e.ctrlKey || e.metaKey) modifiers.push('ctrl')
    if (e.altKey) modifiers.push('alt')
    if (e.shiftKey) modifiers.push('shift')
    if (e.metaKey) modifiers.push('meta')
    return modifiers
  }

  private compareModifiers(a: ModifierKey[], b: ModifierKey[]): boolean {
    if (a.length !== b.length) return false
    const sortedA = [...a].sort()
    const sortedB = [...b].sort()
    return sortedA.every((val, idx) => val === sortedB[idx])
  }

  register(shortcut: ShortcutKey): void {
    const key = this.getShortcutKey(shortcut)
    this.shortcuts.set(key, shortcut)
    
    if (!this.groups.has(shortcut.category)) {
      this.groups.set(shortcut.category, {
        name: shortcut.category,
        description: '',
        shortcuts: []
      })
    }
    
    const group = this.groups.get(shortcut.category)!
    if (!group.shortcuts.includes(shortcut)) {
      group.shortcuts.push(shortcut)
    }
  }

  unregister(shortcut: ShortcutKey): void {
    const key = this.getShortcutKey(shortcut)
    this.shortcuts.delete(key)
    
    const group = this.groups.get(shortcut.category)
    if (group) {
      group.shortcuts = group.shortcuts.filter(s => s !== shortcut)
    }
  }

  private getShortcutKey(shortcut: ShortcutKey): string {
    const modifiers = (shortcut.modifiers || []).sort().join('+')
    return modifiers ? `${modifiers}+${shortcut.key}` : shortcut.key
  }

  getShortcut(key: string, modifiers?: ModifierKey[]): ShortcutKey | undefined {
    const shortcutKey = modifiers ? `${modifiers.join('+')}+${key}` : key
    return this.shortcuts.get(shortcutKey)
  }

  getAllShortcuts(): ShortcutKey[] {
    return Array.from(this.shortcuts.values())
  }

  getShortcutsByCategory(category: string): ShortcutKey[] {
    return this.groups.get(category)?.shortcuts || []
  }

  getAllGroups(): ShortcutGroup[] {
    return Array.from(this.groups.values())
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  formatShortcut(shortcut: ShortcutKey): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const parts: string[] = []
    
    const modifiers = shortcut.modifiers || []
    if (modifiers.includes('ctrl') || modifiers.includes('meta')) {
      parts.push(isMac ? '⌘' : 'Ctrl')
    }
    if (modifiers.includes('alt')) {
      parts.push(isMac ? '⌥' : 'Alt')
    }
    if (modifiers.includes('shift')) {
      parts.push(isMac ? '⇧' : 'Shift')
    }
    
    let key = shortcut.key.toUpperCase()
    const specialKeys: Record<string, string> = {
      'arrowup': '↑',
      'arrowdown': '↓',
      'arrowleft': '←',
      'arrowright': '→',
      ' ': 'Space',
      'escape': 'Esc',
      'enter': '↵',
      'backspace': '⌫',
      'delete': '⌦',
      'tab': '⇥',
      'home': '↖',
      'end': '↘',
      'pageup': '⇞',
      'pagedown': '⇟'
    }
    
    if (specialKeys[key.toLowerCase()]) {
      key = specialKeys[key.toLowerCase()]
    }
    
    parts.push(key)
    return parts.join(isMac ? '' : '+')
  }

  exportToJSON(): string {
    const data = {
      shortcuts: this.getAllShortcuts().map(s => ({
        key: s.key,
        modifiers: s.modifiers,
        description: s.description,
        category: s.category
      }))
    }
    return JSON.stringify(data, null, 2)
  }

  clear(): void {
    this.shortcuts.clear()
    this.groups.clear()
  }
}

export const keyboardShortcuts = new KeyboardShortcuts()

export const SHORTCUT_GROUPS = {
  NAVIGATION: '导航',
  EDITING: '编辑',
  VIEW: '视图',
  SELECTION: '选择',
  BLOCKS: '方块',
  TOOLS: '工具',
  FILE: '文件',
  DEBUG: '调试'
} as const

export function createNavigationShortcuts(actions: {
  moveUp?: () => void
  moveDown?: () => void
  moveLeft?: () => void
  moveRight?: () => void
  zoomIn?: () => void
  zoomOut?: () => void
  resetView?: () => void
  toggleSidebar?: () => void
}) {
  if (actions.moveUp) {
    keyboardShortcuts.register({
      key: 'ArrowUp',
      description: '向上移动',
      category: SHORTCUT_GROUPS.NAVIGATION,
      action: actions.moveUp
    })
  }

  if (actions.moveDown) {
    keyboardShortcuts.register({
      key: 'ArrowDown',
      description: '向下移动',
      category: SHORTCUT_GROUPS.NAVIGATION,
      action: actions.moveDown
    })
  }

  if (actions.moveLeft) {
    keyboardShortcuts.register({
      key: 'ArrowLeft',
      description: '向左移动',
      category: SHORTCUT_GROUPS.NAVIGATION,
      action: actions.moveLeft
    })
  }

  if (actions.moveRight) {
    keyboardShortcuts.register({
      key: 'ArrowRight',
      description: '向右移动',
      category: SHORTCUT_GROUPS.NAVIGATION,
      action: actions.moveRight
    })
  }

  if (actions.zoomIn) {
    keyboardShortcuts.register({
      key: '=',
      modifiers: ['ctrl'],
      description: '放大',
      category: SHORTCUT_GROUPS.NAVIGATION,
      action: actions.zoomIn
    })
  }

  if (actions.zoomOut) {
    keyboardShortcuts.register({
      key: '-',
      modifiers: ['ctrl'],
      description: '缩小',
      category: SHORTCUT_GROUPS.NAVIGATION,
      action: actions.zoomOut
    })
  }

  if (actions.resetView) {
    keyboardShortcuts.register({
      key: 'Home',
      description: '重置视图',
      category: SHORTCUT_GROUPS.NAVIGATION,
      action: actions.resetView
    })
  }

  if (actions.toggleSidebar) {
    keyboardShortcuts.register({
      key: 'b',
      description: '切换侧边栏',
      category: SHORTCUT_GROUPS.NAVIGATION,
      action: actions.toggleSidebar
    })
  }
}

export function createEditingShortcuts(actions: {
  undo?: () => void
  redo?: () => void
  copy?: () => void
  paste?: () => void
  delete?: () => void
  selectAll?: () => void
}) {
  if (actions.undo) {
    keyboardShortcuts.register({
      key: 'z',
      modifiers: ['ctrl'],
      description: '撤销',
      category: SHORTCUT_GROUPS.EDITING,
      action: actions.undo
    })
  }

  if (actions.redo) {
    keyboardShortcuts.register({
      key: 'z',
      modifiers: ['ctrl', 'shift'],
      description: '重做',
      category: SHORTCUT_GROUPS.EDITING,
      action: actions.redo
    })
  }

  if (actions.copy) {
    keyboardShortcuts.register({
      key: 'c',
      modifiers: ['ctrl'],
      description: '复制',
      category: SHORTCUT_GROUPS.EDITING,
      action: actions.copy
    })
  }

  if (actions.paste) {
    keyboardShortcuts.register({
      key: 'v',
      modifiers: ['ctrl'],
      description: '粘贴',
      category: SHORTCUT_GROUPS.EDITING,
      action: actions.paste
    })
  }

  if (actions.delete) {
    keyboardShortcuts.register({
      key: 'Delete',
      description: '删除',
      category: SHORTCUT_GROUPS.EDITING,
      action: actions.delete
    })
  }

  if (actions.selectAll) {
    keyboardShortcuts.register({
      key: 'a',
      modifiers: ['ctrl'],
      description: '全选',
      category: SHORTCUT_GROUPS.EDITING,
      action: actions.selectAll
    })
  }
}
