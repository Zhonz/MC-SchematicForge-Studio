export type KeyCombo = string | string[];

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export interface KeyEvent {
  key: string;
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
}

export class KeyParser {
  static parse(combo: KeyCombo): KeyboardShortcut[] {
    const combos = Array.isArray(combo) ? combo : [combo];
    return combos.map(c => this.parseSingle(c));
  }

  static parseSingle(combo: string): KeyboardShortcut {
    const parts = combo
      .toLowerCase()
      .split('+')
      .map(p => p.trim())
      .filter(Boolean);

    const shortcut: KeyboardShortcut = {
      key: '',
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
    };

    parts.forEach(part => {
      switch (part) {
        case 'ctrl':
        case 'control':
          shortcut.ctrl = true;
          break;
        case 'alt':
        case 'option':
          shortcut.alt = true;
          break;
        case 'shift':
          shortcut.shift = true;
          break;
        case 'meta':
        case 'cmd':
        case 'command':
        case 'super':
          shortcut.meta = true;
          break;
        default:
          shortcut.key = part;
      }
    });

    return shortcut;
  }

  static stringify(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.meta) parts.push('Meta');

    if (shortcut.key) {
      parts.push(shortcut.key.toUpperCase());
    }

    return parts.join('+');
  }

  static matches(event: KeyEvent, shortcut: KeyboardShortcut): boolean {
    const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                       event.code.toLowerCase() === `${shortcut.key.toLowerCase()}key`;

    const ctrlMatches = !!shortcut.ctrl === !!event.ctrlKey;
    const altMatches = !!shortcut.alt === !!event.altKey;
    const shiftMatches = !!shortcut.shift === !!event.shiftKey;
    const metaMatches = !!shortcut.meta === !!event.metaKey;

    return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
  }
}

export class KeyboardHandler {
  private handlers: Map<string, Set<(event: KeyEvent) => void>> = new Map();
  private paused = false;
  private ignoreRepeat = true;

  constructor(options: { ignoreRepeat?: boolean } = {}) {
    this.ignoreRepeat = options.ignoreRepeat ?? true;
  }

  on(shortcut: KeyCombo, handler: (event: KeyEvent) => void): () => void {
    const shortcuts = KeyParser.parse(shortcut);
    
    shortcuts.forEach(s => {
      const key = KeyParser.stringify(s);
      
      if (!this.handlers.has(key)) {
        this.handlers.set(key, new Set());
      }
      
      this.handlers.get(key)!.add(handler);
    });

    return () => this.off(shortcut, handler);
  }

  off(shortcut: KeyCombo, handler: (event: KeyEvent) => void): void {
    const shortcuts = KeyParser.parse(shortcut);
    
    shortcuts.forEach(s => {
      const key = KeyParser.stringify(s);
      this.handlers.get(key)?.delete(handler);
    });
  }

  handle(event: KeyboardEvent): void {
    if (this.paused) return;
    if (this.ignoreRepeat && event.repeat) return;

    const keyEvent: KeyEvent = {
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
    };

    for (const [key, handlers] of this.handlers) {
      const shortcut = KeyParser.parseSingle(key);
      
      if (KeyParser.matches(keyEvent, shortcut)) {
        handlers.forEach(handler => handler(keyEvent));
      }
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  clear(): void {
    this.handlers.clear();
  }

  get size(): number {
    return this.handlers.size;
  }
}

export class GlobalKeyboard {
  private static instance: GlobalKeyboard | null = null;
  private handler: KeyboardHandler;
  private boundHandler: (e: KeyboardEvent) => void;
  private active = false;

  private constructor() {
    this.handler = new KeyboardHandler();
    this.boundHandler = this.handler.handle.bind(this.handler);
  }

  static getInstance(): GlobalKeyboard {
    if (!GlobalKeyboard.instance) {
      GlobalKeyboard.instance = new GlobalKeyboard();
    }
    return GlobalKeyboard.instance;
  }

  on(shortcut: KeyCombo, handler: (event: KeyEvent) => void): () => void {
    if (!this.active) {
      this.attach();
    }
    return this.handler.on(shortcut, handler);
  }

  off(shortcut: KeyCombo, handler: (event: KeyEvent) => void): void {
    this.handler.off(shortcut, handler);
    if (this.handler.size === 0) {
      this.detach();
    }
  }

  pause(): void {
    this.handler.pause();
  }

  resume(): void {
    this.handler.resume();
  }

  private attach(): void {
    if (!this.active) {
      window.addEventListener('keydown', this.boundHandler);
      this.active = true;
    }
  }

  private detach(): void {
    if (this.active) {
      window.removeEventListener('keydown', this.boundHandler);
      this.active = false;
    }
  }
}

export const KeyCodes = {
  BACKSPACE: 'Backspace',
  TAB: 'Tab',
  ENTER: 'Enter',
  SHIFT: 'Shift',
  CTRL: 'Control',
  ALT: 'Alt',
  PAUSE: 'Pause',
  CAPS_LOCK: 'CapsLock',
  ESCAPE: 'Escape',
  SPACE: ' ',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  END: 'End',
  HOME: 'Home',
  LEFT: 'ArrowLeft',
  UP: 'ArrowUp',
  RIGHT: 'ArrowRight',
  DOWN: 'ArrowDown',
  INSERT: 'Insert',
  DELETE: 'Delete',
  0: '0',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  A: 'a',
  B: 'b',
  C: 'c',
  D: 'd',
  E: 'e',
  F: 'f',
  G: 'g',
  H: 'h',
  I: 'i',
  J: 'j',
  K: 'k',
  L: 'l',
  M: 'm',
  N: 'n',
  O: 'o',
  P: 'p',
  Q: 'q',
  R: 'r',
  S: 's',
  T: 't',
  U: 'u',
  V: 'v',
  W: 'w',
  X: 'x',
  Y: 'y',
  Z: 'z',
  LEFT_CMD: 'Meta',
  RIGHT_CMD: 'Meta',
  SELECT: 'Meta',
  NUMPAD_0: '0',
  NUMPAD_1: '1',
  NUMPAD_2: '2',
  NUMPAD_3: '3',
  NUMPAD_4: '4',
  NUMPAD_5: '5',
  NUMPAD_6: '6',
  NUMPAD_7: '7',
  NUMPAD_8: '8',
  NUMPAD_9: '9',
  MULTIPLY: '*',
  ADD: '+',
  SUBTRACT: '-',
  DECIMAL: '.',
  DIVIDE: '/',
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',
  NUM_LOCK: 'NumLock',
  SCROLL_LOCK: 'ScrollLock',
  SEMICOLON: ';',
  EQUAL: '=',
  COMMA: ',',
  DASH: '-',
  PERIOD: '.',
  FORWARD_SLASH: '/',
  GRAVE_ACCENT: '`',
  OPEN_BRACKET: '[',
  BACK_SLASH: '\\',
  CLOSE_BRACKET: ']',
  QUOTE: "'",
} as const;

export type KeyCode = keyof typeof KeyCodes;

export class ShortcutManager {
  private shortcuts: Map<string, { handler: (event: KeyEvent) => void; description?: string }> = new Map();
  private enabled = true;

  register(
    id: string,
    shortcut: KeyCombo,
    handler: (event: KeyEvent) => void,
    options: { description?: string; preventDefault?: boolean } = {}
  ): () => void {
    const parsed = KeyParser.parse(shortcut);
    const key = KeyParser.stringify(parsed[0]);

    this.shortcuts.set(id, {
      handler: (event: KeyEvent) => {
        if (!this.enabled) return;
        if (options.preventDefault !== false) {
          event.preventDefault();
        }
        handler(event);
      },
      description: options.description,
    });

    const globalKeyboard = GlobalKeyboard.getInstance();
    return globalKeyboard.on(shortcut, this.shortcuts.get(id)!.handler);
  }

  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  get(id: string): { handler: (event: KeyEvent) => void; description?: string } | undefined {
    return this.shortcuts.get(id);
  }

  getAll(): Array<{ id: string; shortcut: string; description?: string }> {
    return Array.from(this.shortcuts.entries()).map(([id, value]) => ({
      id,
      shortcut: id,
      description: value.description,
    }));
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
}

export class KeySequence {
  private sequence: string[] = [];
  private timeout: number;
  private maxLength: number;
  private onMatch: (keys: string[]) => void;
  private resetTimer?: ReturnType<typeof setTimeout>;

  constructor(
    options: {
      timeout?: number;
      maxLength?: number;
      onMatch: (keys: string[]) => void;
    }
  ) {
    this.timeout = options.timeout ?? 1000;
    this.maxLength = options.maxLength ?? 10;
    this.onMatch = options.onMatch;
  }

  push(key: string): void {
    this.sequence.push(key);

    if (this.sequence.length > this.maxLength) {
      this.sequence.shift();
    }

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      this.reset();
    }, this.timeout);
  }

  reset(): void {
    this.sequence = [];
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }

  getSequence(): string[] {
    return [...this.sequence];
  }

  matches(pattern: string[]): boolean {
    if (pattern.length !== this.sequence.length) {
      return false;
    }
    return pattern.every((key, index) => key.toLowerCase() === this.sequence[index].toLowerCase());
  }
}
