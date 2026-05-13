export interface ClipboardItem {
  type: string;
  data: string | Blob;
}

export interface ClipboardOptions {
  allowRead?: boolean;
  allowWrite?: boolean;
  suppressErrors?: boolean;
}

export class ClipboardUtils2 {
  static async writeText(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return this.fallbackWriteText(text);
    }
  }

  static async readText(): Promise<string | null> {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return this.fallbackReadText();
    }
  }

  static async writeHTML(html: string, plainText?: string): Promise<boolean> {
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText || html], { type: 'text/plain' });
      
      const item: Record<string, string | Blob> = {
        'text/plain': textBlob,
        'text/html': blob
      };

      const clipboardItem = new ClipboardItem(item);
      await navigator.clipboard.write([clipboardItem]);
      return true;
    } catch {
      return this.writeText(plainText || html);
    }
  }

  static async readHTML(): Promise<string | null> {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type === 'text/html') {
            const blob = await item.getType(type);
            return await blob.text();
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  static async writeImage(file: File | Blob): Promise<boolean> {
    try {
      const blob = file instanceof File ? file : file;
      const item: Record<string, Blob> = {
        [blob.type]: blob
      };

      const clipboardItem = new ClipboardItem(item);
      await navigator.clipboard.write([clipboardItem]);
      return true;
    } catch {
      return false;
    }
  }

  static async readImage(): Promise<Blob | null> {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            return await item.getType(type);
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  static async writeFiles(files: File[]): Promise<boolean> {
    try {
      for (const file of files) {
        const item: Record<string, File> = {
          [file.type]: file
        };
        const clipboardItem = new ClipboardItem(item);
        await navigator.clipboard.write([clipboardItem]);
      }
      return true;
    } catch {
      return false;
    }
  }

  static async readFiles(): Promise<File[]> {
    try {
      const items = await navigator.clipboard.read();
      const files: File[] = [];

      for (const item of items) {
        for (const type of item.types) {
          if (!type.startsWith('text/') && !type.startsWith('image/')) {
            try {
              const blob = await item.getType(type);
              const file = new File([blob], 'clipboard-file', { type });
              files.push(file);
            } catch {
              // Skip if can't read
            }
          }
        }
      }

      return files;
    } catch {
      return [];
    }
  }

  static async hasText(): Promise<boolean> {
    try {
      const text = await this.readText();
      return text !== null && text.length > 0;
    } catch {
      return false;
    }
  }

  static async hasImage(): Promise<boolean> {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            return true;
          }
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  static async hasFiles(): Promise<boolean> {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (!type.startsWith('text/') && !type.startsWith('image/')) {
            return true;
          }
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  static isSupported(): boolean {
    return !!navigator.clipboard;
  }

  static isReadSupported(): boolean {
    return this.isSupported() && 'readText' in navigator.clipboard;
  }

  static isWriteSupported(): boolean {
    return this.isSupported() && 'writeText' in navigator.clipboard;
  }

  static async copyToClipboard(text: string): Promise<boolean> {
    return this.writeText(text);
  }

  static async pasteFromClipboard(): Promise<string | null> {
    return this.readText();
  }

  static async cut(element: HTMLInputElement | HTMLTextAreaElement): Promise<string | null> {
    if (!element || element.value.length === 0) return null;

    const selectedText = element.value.substring(
      element.selectionStart || 0,
      element.selectionEnd || 0
    );

    if (selectedText.length === 0) return null;

    await this.writeText(selectedText);
    
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    element.value = element.value.substring(0, start) + element.value.substring(end);
    element.selectionStart = start;
    element.selectionEnd = start;

    element.dispatchEvent(new Event('input', { bubbles: true }));

    return selectedText;
  }

  private static fallbackWriteText(text: string): boolean {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      return success;
    } catch {
      return false;
    }
  }

  private static fallbackReadText(): string | null {
    try {
      const textarea = document.createElement('textarea');
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();

      const success = document.execCommand('paste');
      const text = textarea.value;
      document.body.removeChild(textarea);

      return success ? text : null;
    } catch {
      return null;
    }
  }
}

export class ClipboardHistory {
  private history: string[] = [];
  private maxSize: number;
  private listeners: Set<() => void> = new Set();

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  add(text: string): void {
    if (!text || text.trim().length === 0) return;

    const existingIndex = this.history.indexOf(text);
    if (existingIndex !== -1) {
      this.history.splice(existingIndex, 1);
    }

    this.history.unshift(text);

    if (this.history.length > this.maxSize) {
      this.history.pop();
    }

    this.notifyListeners();
  }

  get(index: number): string | null {
    return this.history[index] || null;
  }

  getAll(): string[] {
    return [...this.history];
  }

  remove(index: number): string | null {
    const removed = this.history.splice(index, 1)[0];
    if (removed) {
      this.notifyListeners();
    }
    return removed || null;
  }

  clear(): void {
    this.history = [];
    this.notifyListeners();
  }

  size(): number {
    return this.history.length;
  }

  search(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    return this.history.filter(text => 
      text.toLowerCase().includes(lowerQuery)
    );
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export class ClipboardMonitor {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastContent: string = '';
  private listeners: Set<(content: string) => void> = new Set();

  start(interval: number = 1000): void {
    if (this.intervalId) return;

    this.checkClipboard();

    this.intervalId = setInterval(() => {
      this.checkClipboard();
    }, interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  subscribe(listener: (content: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async checkClipboard(): Promise<void> {
    try {
      const content = await ClipboardUtils2.readText();
      if (content && content !== this.lastContent) {
        this.lastContent = content;
        this.listeners.forEach(listener => listener(content));
      }
    } catch {
      // Ignore clipboard read errors
    }
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

export interface ClipboardEntry {
  type: 'text' | 'image' | 'html' | 'files';
  content: string | Blob | File[];
  timestamp: number;
}

export class ClipboardManager {
  private history: ClipboardHistory;
  private monitor: ClipboardMonitor;

  constructor(maxHistorySize: number = 100) {
    this.history = new ClipboardHistory(maxHistorySize);
    this.monitor = new ClipboardMonitor();
  }

  async copy(text: string): Promise<boolean> {
    const success = await ClipboardUtils2.writeText(text);
    if (success) {
      this.history.add(text);
    }
    return success;
  }

  async paste(): Promise<string | null> {
    return ClipboardUtils2.readText();
  }

  async copyHTML(html: string, plainText?: string): Promise<boolean> {
    return ClipboardUtils2.writeHTML(html, plainText);
  }

  async pasteHTML(): Promise<string | null> {
    return ClipboardUtils2.readHTML();
  }

  async copyImage(file: File | Blob): Promise<boolean> {
    return ClipboardUtils2.writeImage(file);
  }

  async pasteImage(): Promise<Blob | null> {
    return ClipboardUtils2.readImage();
  }

  startMonitoring(onChange: (content: string) => void): void {
    this.monitor.subscribe((content) => {
      this.history.add(content);
      onChange(content);
    });
    this.monitor.start();
  }

  stopMonitoring(): void {
    this.monitor.stop();
  }

  getHistory(): ClipboardHistory {
    return this.history;
  }

  clearHistory(): void {
    this.history.clear();
  }

  searchHistory(query: string): string[] {
    return this.history.search(query);
  }

  isSupported(): boolean {
    return ClipboardUtils2.isSupported();
  }
}

export default ClipboardUtils2;
