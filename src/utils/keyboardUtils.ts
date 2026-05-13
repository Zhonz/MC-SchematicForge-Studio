export type KeyModifier = 'ctrl' | 'alt' | 'shift' | 'meta';
export type KeyCode = string;

export interface KeyCombo {
  key: KeyCode;
  modifiers?: KeyModifier[];
}

export interface KeyboardShortcut {
  combo: KeyCombo;
  action: (event: KeyboardEvent) => void;
  description?: string;
  category?: string;
  preventDefault?: boolean;
}

export interface ShortcutOptions {
  capture?: boolean;
  once?: boolean;
  enabled?: boolean;
}

export class KeyboardUtils {
  static readonly MODIFIER_KEYS: KeyModifier[] = ['ctrl', 'alt', 'shift', 'meta'];

  static readonly KEY_CODES: Record<string, string> = {
    backspace: 'Backspace',
    tab: 'Tab',
    enter: 'Enter',
    escape: 'Escape',
    space: 'Space',
    pageUp: 'PageUp',
    pageDown: 'PageDown',
    end: 'End',
    home: 'Home',
    left: 'ArrowLeft',
    up: 'ArrowUp',
    right: 'ArrowRight',
    down: 'ArrowDown',
    insert: 'Insert',
    delete: 'Delete',
    num0: '0',
    num1: '1',
    num2: '2',
    num3: '3',
    num4: '4',
    num5: '5',
    num6: '6',
    num7: '7',
    num8: '8',
    num9: '9',
    a: 'a',
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
    f: 'f',
    g: 'g',
    h: 'h',
    i: 'i',
    j: 'j',
    k: 'k',
    l: 'l',
    m: 'm',
    n: 'n',
    o: 'o',
    p: 'p',
    q: 'q',
    r: 'r',
    s: 's',
    t: 't',
    u: 'u',
    v: 'v',
    w: 'w',
    x: 'x',
    y: 'y',
    z: 'z',
    f1: 'F1',
    f2: 'F2',
    f3: 'F3',
    f4: 'F4',
    f5: 'F5',
    f6: 'F6',
    f7: 'F7',
    f8: 'F8',
    f9: 'F9',
    f10: 'F10',
    f11: 'F11',
    f12: 'F12',
    numpad0: 'Numpad0',
    numpad1: 'Numpad1',
    numpad2: 'Numpad2',
    numpad3: 'Numpad3',
    numpad4: 'Numpad4',
    numpad5: 'Numpad5',
    numpad6: 'Numpad6',
    numpad7: 'Numpad7',
    numpad8: 'Numpad8',
    numpad9: 'Numpad9',
    multiply: 'NumpadMultiply',
    add: 'NumpadAdd',
    subtract: 'NumpadSubtract',
    decimal: 'NumpadDecimal',
    divide: 'NumpadDivide',
    equal: 'Equal',
    minus: 'Minus',
    plus: 'Plus',
    numpadEnter: 'NumpadEnter',
    semicolon: 'Semicolon',
    quote: 'Quote',
    backquote: 'Backquote',
    comma: 'Comma',
    period: 'Period',
    slash: 'Slash',
    backslash: 'Backslash',
    openbracket: 'BracketLeft',
    closebracket: 'BracketRight',
    pipe: 'Backslash'
  };

  static isModifierKey(key: string): boolean {
    return this.MODIFIER_KEYS.includes(key.toLowerCase() as KeyModifier);
  }

  static getModifierState(event: KeyboardEvent): Record<KeyModifier, boolean> {
    return {
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey
    };
  }

  static matchesCombo(event: KeyboardEvent, combo: KeyCombo): boolean {
    const keyMatches = event.key.toLowerCase() === combo.key.toLowerCase() ||
                       event.code.toLowerCase() === combo.key.toLowerCase();

    if (!keyMatches) return false;

    const modifiers = combo.modifiers || [];

    const ctrlMatch = modifiers.includes('ctrl') ? event.ctrlKey : !event.ctrlKey;
    const altMatch = modifiers.includes('alt') ? event.altKey : !event.altKey;
    const shiftMatch = modifiers.includes('shift') ? event.shiftKey : !event.shiftKey;
    const metaMatch = modifiers.includes('meta') ? event.metaKey : !event.metaKey;

    return ctrlMatch && altMatch && shiftMatch && metaMatch;
  }

  static formatCombo(combo: KeyCombo, separator: string = '+'): string {
    const parts: string[] = [];

    if (combo.modifiers) {
      const modifierLabels: Record<KeyModifier, string> = {
        ctrl: navigator.platform.includes('Mac') ? '⌃' : 'Ctrl',
        alt: navigator.platform.includes('Mac') ? '⌥' : 'Alt',
        shift: navigator.platform.includes('Mac') ? '⇧' : 'Shift',
        meta: navigator.platform.includes('Mac') ? '⌘' : 'Win'
      };

      combo.modifiers.forEach(mod => {
        parts.push(modifierLabels[mod]);
      });
    }

    parts.push(combo.key.toUpperCase());

    return parts.join(separator);
  }

  static parseComboString(comboString: string): KeyCombo | null {
    const parts = comboString.toLowerCase().split(/[\s+]/);
    if (parts.length === 0) return null;

    const modifiers: KeyModifier[] = [];
    let key = '';

    for (const part of parts) {
      if (this.isModifierKey(part)) {
        modifiers.push(part as KeyModifier);
      } else {
        key = part;
      }
    }

    if (!key) return null;

    return { key, modifiers: modifiers.length > 0 ? modifiers : undefined };
  }

  static isPrintableKey(key: string): boolean {
    return key.length === 1 && !this.isModifierKey(key);
  }

  static getKeyFromCode(code: string): string {
    return code.replace('Key', '').replace('Digit', '').replace('Numpad', 'Num');
  }

  static isNumberKey(key: string): boolean {
    return /^[0-9]$/.test(key) || /^Numpad[0-9]$/.test(key);
  }

  static isLetterKey(key: string): boolean {
    return /^[a-zA-Z]$/.test(key);
  }

  static isFunctionKey(key: string): boolean {
    return /^F[0-9]+$/.test(key);
  }

  static isArrowKey(key: string): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
  }

  static isNavigationKey(key: string): boolean {
    return ['Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete'].includes(key);
  }
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, {
    shortcut: KeyboardShortcut;
    options: ShortcutOptions;
  }> = new Map();
  private enabled: boolean = true;
  private target: HTMLElement | Document;

  constructor(target: HTMLElement | Document = document) {
    this.target = target;
    this.boundHandler = this.handleKeyDown.bind(this);
  }

  private boundHandler: (e: KeyboardEvent) => void;

  register(
    id: string,
    shortcut: KeyboardShortcut,
    options: ShortcutOptions = {}
  ): void {
    this.shortcuts.set(id, { shortcut, options });
  }

  unregister(id: string): boolean {
    return this.shortcuts.delete(id);
  }

  get(id: string): KeyboardShortcut | undefined {
    return this.shortcuts.get(id)?.shortcut;
  }

  has(id: string): boolean {
    return this.shortcuts.has(id);
  }

  clear(): void {
    this.shortcuts.clear();
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  startListening(): void {
    this.target.addEventListener('keydown', this.boundHandler as EventListener);
  }

  stopListening(): void {
    this.target.removeEventListener('keydown', this.boundHandler as EventListener);
  }

  getShortcuts(): Map<string, KeyboardShortcut> {
    const result = new Map<string, KeyboardShortcut>();
    this.shortcuts.forEach((value, key) => {
      result.set(key, value.shortcut);
    });
    return result;
  }

  getByCategory(category: string): KeyboardShortcut[] {
    const result: KeyboardShortcut[] = [];
    this.shortcuts.forEach((value) => {
      if (value.shortcut.category === category) {
        result.push(value.shortcut);
      }
    });
    return result;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      if (!event.ctrlKey && !event.metaKey) return;
    }

    this.shortcuts.forEach(({ shortcut, options }) => {
      if (options.enabled === false) return;

      if (this.matchesShortcut(event, shortcut)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }

        shortcut.action(event);

        if (options.once) {
          this.unregister(this.getShortcutId(shortcut) || '');
        }
      }
    });
  }

  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    return KeyboardUtils.matchesCombo(event, shortcut.combo);
  }

  private getShortcutId(shortcut: KeyboardShortcut): string | undefined {
    for (const [id, entry] of this.shortcuts) {
      if (entry.shortcut === shortcut) {
        return id;
      }
    }
    return undefined;
  }
}

export class KeySequence {
  private sequence: string[] = [];
  private currentIndex: number = 0;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private timeout: number;

  constructor(timeout: number = 1000) {
    this.timeout = timeout;
  }

  addKey(key: string): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.sequence.push(key.toLowerCase());
    this.currentIndex = this.sequence.length;

    this.timeoutId = setTimeout(() => {
      this.reset();
    }, this.timeout);
  }

  checkSequence(sequence: string[]): boolean {
    if (sequence.length !== this.sequence.length) return false;

    return sequence.every((key, index) => key.toLowerCase() === this.sequence[index]);
  }

  reset(): void {
    this.sequence = [];
    this.currentIndex = 0;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  getSequence(): string[] {
    return [...this.sequence];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }
}

export class ChordDetector {
  private pressedKeys: Set<string> = new Set();

  constructor(private timeout: number = 500) {}

  pressKey(key: string): void {
    this.pressedKeys.add(key.toLowerCase());

    setTimeout(() => {
      this.pressedKeys.delete(key.toLowerCase());
    }, this.timeout);
  }

  releaseKey(key: string): void {
    this.pressedKeys.delete(key.toLowerCase());
  }

  isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase());
  }

  getPressedKeys(): string[] {
    return Array.from(this.pressedKeys);
  }

  matchesChord(chord: string[]): boolean {
    if (chord.length !== this.pressedKeys.size) return false;

    return chord.every(key => this.pressedKeys.has(key.toLowerCase()));
  }

  clear(): void {
    this.pressedKeys.clear();
  }
}

export function createModifierString(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  if (event.metaKey) parts.push('meta');

  return parts.join('+');
}

export function parseModifierString(modifiers: string): KeyModifier[] {
  return modifiers
    .toLowerCase()
    .split(/[\s+]/g)
    .filter(mod => KeyboardUtils.isModifierKey(mod)) as KeyModifier[];
}

export function isCommandKey(event: KeyboardEvent): boolean {
  return navigator.platform.includes('Mac') ? event.metaKey : event.ctrlKey;
}

export function formatShortcutDisplay(
  combo: KeyCombo,
  options: { osx?: 'symbol' | 'text'; separator?: string } = {}
): string {
  const separator = options.separator || '+';
  const isMac = navigator.platform.includes('Mac');

  const parts: string[] = [];

  if (combo.modifiers) {
    combo.modifiers.forEach(mod => {
      if (isMac && options.osx === 'symbol') {
        const symbols: Record<KeyModifier, string> = {
          ctrl: '⌃',
          alt: '⌥',
          shift: '⇧',
          meta: '⌘'
        };
        parts.push(symbols[mod]);
      } else {
        const labels: Record<KeyModifier, string> = {
          ctrl: 'Ctrl',
          alt: 'Alt',
          shift: 'Shift',
          meta: isMac ? 'Cmd' : 'Win'
        };
        parts.push(labels[mod]);
      }
    });
  }

  parts.push(combo.key.toUpperCase());

  return parts.join(separator);
}

export const COMMON_SHORTCUTS = {
  save: { key: 's', modifiers: ['ctrl'] as KeyModifier[] },
  copy: { key: 'c', modifiers: ['ctrl'] as KeyModifier[] },
  paste: { key: 'v', modifiers: ['ctrl'] as KeyModifier[] },
  cut: { key: 'x', modifiers: ['ctrl'] as KeyModifier[] },
  undo: { key: 'z', modifiers: ['ctrl'] as KeyModifier[] },
  redo: { key: 'y', modifiers: ['ctrl'] as KeyModifier[] },
  selectAll: { key: 'a', modifiers: ['ctrl'] as KeyModifier[] },
  find: { key: 'f', modifiers: ['ctrl'] as KeyModifier[] },
  replace: { key: 'h', modifiers: ['ctrl'] as KeyModifier[] },
  newTab: { key: 't', modifiers: ['ctrl'] as KeyModifier[] },
  closeTab: { key: 'w', modifiers: ['ctrl'] as KeyModifier[] },
  refresh: { key: 'r', modifiers: ['ctrl'] as KeyModifier[] },
  fullscreen: { key: 'f11', modifiers: [] as KeyModifier[] },
  zoomIn: { key: '=', modifiers: ['ctrl'] as KeyModifier[] },
  zoomOut: { key: '-', modifiers: ['ctrl'] as KeyModifier[] },
  resetZoom: { key: '0', modifiers: ['ctrl'] as KeyModifier[] },
  escape: { key: 'escape', modifiers: [] as KeyModifier[] },
  enter: { key: 'enter', modifiers: [] as KeyModifier[] },
  tab: { key: 'tab', modifiers: [] as KeyModifier[] },
  delete: { key: 'delete', modifiers: [] as KeyModifier[] },
  backspace: { key: 'backspace', modifiers: [] as KeyModifier[] },
  arrowUp: { key: 'up', modifiers: [] as KeyModifier[] },
  arrowDown: { key: 'down', modifiers: [] as KeyModifier[] },
  arrowLeft: { key: 'left', modifiers: [] as KeyModifier[] },
  arrowRight: { key: 'right', modifiers: [] as KeyModifier[] }
};

export default KeyboardUtils;
