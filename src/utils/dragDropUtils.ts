export interface DragDropOptions {
  onDragStart?: (event: DragEvent, data: unknown) => void;
  onDragEnd?: (event: DragEvent, data: unknown) => void;
  onDragOver?: (event: DragEvent) => boolean | void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent, data: unknown) => void;
}

export interface DropZoneConfig {
  accepts?: string[];
  multiple?: boolean;
  onDragEnter?: (event: DragEvent) => void;
  onDragOver?: (event: DragEvent) => boolean;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent, files: File[]) => void;
}

export class DragDropUtils {
  static setDragData(event: DragEvent, data: unknown): void {
    if (!event.dataTransfer) return;
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    event.dataTransfer.setData('text/plain', json);
    event.dataTransfer.effectAllowed = 'copyMove';
  }

  static getDragData<T = unknown>(event: DragEvent): T | null {
    if (!event.dataTransfer) return null;
    const data = event.dataTransfer.getData('text/plain');
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as T;
    }
  }

  static setFileDragData(event: DragEvent, files: File[]): void {
    if (!event.dataTransfer) return;
    const dataTransfer = event.dataTransfer;
    
    if (files.length > 0) {
      dataTransfer.items.clear();
      files.forEach(file => {
        dataTransfer.items.add(file);
      });
    }
    
    dataTransfer.effectAllowed = 'copy';
  }

  static makeDraggable(
    element: HTMLElement,
    options: DragDropOptions & { data?: unknown } = {}
  ): () => void {
    element.draggable = true;

    const handleDragStart = (event: DragEvent) => {
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
      }
      options.onDragStart?.(event, options.data as never);
      DragDropUtils.setDragData(event, options.data);
    };

    const handleDragEnd = (event: DragEvent) => {
      options.onDragEnd?.(event, options.data as never);
    };

    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragend', handleDragEnd);

    return () => {
      element.removeEventListener('dragstart', handleDragStart);
      element.removeEventListener('dragend', handleDragEnd);
    };
  }

  static createDropZone(
    element: HTMLElement,
    config: DropZoneConfig
  ): () => void {
    let dragCounter = 0;

    const handleDragEnter = (event: DragEvent) => {
      event.preventDefault();
      dragCounter++;
      element.classList.add('drag-over');
      config.onDragEnter?.(event);
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        element.classList.remove('drag-over');
      }
      config.onDragLeave?.(event);
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
      const shouldAllow = config.onDragOver?.(event);
      if (shouldAllow === false) {
        event.dataTransfer!.dropEffect = 'none';
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      dragCounter = 0;
      element.classList.remove('drag-over');

      if (!event.dataTransfer) return;

      const files = Array.from(event.dataTransfer.files);
      const validFiles = files.filter(file => {
        if (!config.accepts?.length) return true;
        return config.accepts.some(accept => {
          if (accept.startsWith('.')) {
            return file.name.endsWith(accept);
          }
          if (accept.endsWith('/*')) {
            return file.type.startsWith(accept.slice(0, -1));
          }
          return file.type === accept;
        });
      });

      config.onDrop?.(event, config.multiple ? validFiles : validFiles.slice(0, 1));
    };

    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);

    return () => {
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('drop', handleDrop);
    };
  }
}

export class DragManager {
  private static activeDragElement: HTMLElement | null = null;
  private static dragData: unknown = null;
  private static listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  static startDrag(element: HTMLElement, data: unknown): void {
    this.activeDragElement = element;
    this.dragData = data;
    element.classList.add('dragging');
  }

  static endDrag(): void {
    if (this.activeDragElement) {
      this.activeDragElement.classList.remove('dragging');
    }
    this.activeDragElement = null;
    this.dragData = null;
  }

  static getDragData(): unknown {
    return this.dragData;
  }

  static getActiveElement(): HTMLElement | null {
    return this.activeDragElement;
  }

  static subscribe(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  static emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export interface SortableOptions {
  onSort?: (fromIndex: number, toIndex: number) => void;
  animation?: number;
}

export class SortableList {
  private container: HTMLElement;
  private items: HTMLElement[] = [];
  private options: SortableOptions;
  private draggedItem: HTMLElement | null = null;
  private draggedIndex: number = -1;

  constructor(container: HTMLElement, options: SortableOptions = {}) {
    this.container = container;
    this.options = options;
    this.init();
  }

  private init(): void {
    this.container.style.userSelect = 'none';
    this.rebuildItems();

    this.container.addEventListener('dragstart', this.handleDragStart.bind(this));
    this.container.addEventListener('dragend', this.handleDragEnd.bind(this));
    this.container.addEventListener('dragover', this.handleDragOver.bind(this));
    this.container.addEventListener('drop', this.handleDrop.bind(this));
    this.container.addEventListener('dragleave', this.handleDragLeave.bind(this));
  }

  private rebuildItems(): void {
    this.items = Array.from(this.container.children) as HTMLElement[];
    this.items.forEach((item, index) => {
      item.draggable = true;
      item.dataset.index = String(index);
    });
  }

  private handleDragStart(event: DragEvent): void {
    const target = event.target as HTMLElement;
    if (!this.items.includes(target)) return;

    this.draggedItem = target;
    this.draggedIndex = parseInt(target.dataset.index || '0', 10);
    target.classList.add('dragging');

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(this.draggedIndex));
    }
  }

  private handleDragEnd(event: DragEvent): void {
    if (this.draggedItem) {
      this.draggedItem.classList.remove('dragging');
    }
    this.draggedItem = null;
    this.draggedIndex = -1;

    this.container.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer) return;

    event.dataTransfer.dropEffect = 'move';

    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    this.container.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });

    if (target !== this.draggedItem && this.items.includes(target)) {
      target.classList.add('drag-over');
      if (event.clientY > midY) {
        target.classList.add('drag-over-bottom');
      } else {
        target.classList.add('drag-over-top');
      }
    }
  }

  private handleDragLeave(event: DragEvent): void {
    const target = event.target as HTMLElement;
    if (!this.container.contains(event.relatedTarget as Node)) {
      target.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    }
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();

    const target = event.target as HTMLElement;
    if (!this.items.includes(target) || target === this.draggedItem) return;

    const targetIndex = parseInt(target.dataset.index || '0', 10);
    const fromIndex = this.draggedIndex;
    const toIndex = targetIndex;

    if (fromIndex === toIndex) return;

    if (this.options.animation) {
      this.animateMove(fromIndex, toIndex);
    } else {
      this.moveItem(fromIndex, toIndex);
    }

    this.options.onSort?.(fromIndex, toIndex);
    this.rebuildItems();
  }

  private moveItem(fromIndex: number, toIndex: number): void {
    const fromEl = this.items[fromIndex];
    const toEl = this.items[toIndex];

    if (!fromEl || !toEl) return;

    if (fromIndex < toIndex) {
      this.container.insertBefore(fromEl, toEl.nextSibling);
    } else {
      this.container.insertBefore(fromEl, toEl);
    }
  }

  private animateMove(fromIndex: number, toIndex: number): void {
    this.moveItem(fromIndex, toIndex);
  }

  getItems(): HTMLElement[] {
    return Array.from(this.container.children) as HTMLElement[];
  }

  addItem(item: HTMLElement, index?: number): void {
    if (index !== undefined && index >= 0 && index <= this.items.length) {
      const refNode = this.items[index];
      this.container.insertBefore(item, refNode);
    } else {
      this.container.appendChild(item);
    }
    this.rebuildItems();
  }

  removeItem(index: number): HTMLElement | null {
    const item = this.items[index];
    if (item) {
      item.remove();
      this.rebuildItems();
    }
    return item;
  }

  destroy(): void {
    this.container.removeEventListener('dragstart', this.handleDragStart.bind(this));
    this.container.removeEventListener('dragend', this.handleDragEnd.bind(this));
    this.container.removeEventListener('dragover', this.handleDragOver.bind(this));
    this.container.removeEventListener('drop', this.handleDrop.bind(this));
    this.container.removeEventListener('dragleave', this.handleDragLeave.bind(this));
  }
}

export class TouchDrag {
  private element: HTMLElement;
  private startX: number = 0;
  private startY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private isDragging: boolean = false;
  private options: {
    onDragStart?: (event: TouchEvent) => void;
    onDragMove?: (deltaX: number, deltaY: number) => void;
    onDragEnd?: (deltaX: number, deltaY: number) => void;
    threshold?: number;
  };

  constructor(element: HTMLElement, options: typeof DragDropUtils.prototype = {}) {
    this.element = element;
    this.options = options as typeof this.options;
    this.init();
  }

  private init(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.currentX = this.startX;
    this.currentY = this.startY;
    this.isDragging = false;

    this.options.onDragStart?.(event);
  }

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.currentX = touch.clientX;
    this.currentY = touch.clientY;

    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;

    const threshold = this.options.threshold || 10;

    if (!this.isDragging) {
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        this.isDragging = true;
        this.element.classList.add('touch-dragging');
      }
    }

    if (this.isDragging) {
      event.preventDefault();
      this.options.onDragMove?.(deltaX, deltaY);
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (this.isDragging) {
      const deltaX = this.currentX - this.startX;
      const deltaY = this.currentY - this.startY;
      this.options.onDragEnd?.(deltaX, deltaY);
    }

    this.element.classList.remove('touch-dragging');
    this.isDragging = false;
  }

  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }
}

export default DragDropUtils;
