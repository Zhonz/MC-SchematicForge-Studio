export interface DragItem {
  id: string
  type: string
  data: unknown
  preview?: HTMLElement
}

export interface DropZone {
  id: string
  element: HTMLElement
  accepts?: string[]
  onDrop?: (item: DragItem, zone: DropZone) => void
  onDragEnter?: (item: DragItem, zone: DropZone) => void
  onDragLeave?: (item: DragItem, zone: DropZone) => void
}

export interface DragState {
  isDragging: boolean
  item: DragItem | null
  sourceElement: HTMLElement | null
  currentDropZone: DropZone | null
  offsetX: number
  offsetY: number
}

export class DragDropManager {
  private static instance: DragDropManager
  private state: DragState = {
    isDragging: false,
    item: null,
    sourceElement: null,
    currentDropZone: null,
    offsetX: 0,
    offsetY: 0
  }
  private dropZones: Map<string, DropZone> = new Map()
  private listeners: Set<(state: DragState) => void> = new Set()
  private dragPreview: HTMLElement | null = null

  private constructor() {
    this.setupEventListeners()
  }

  static getInstance(): DragDropManager {
    if (!DragDropManager.instance) {
      DragDropManager.instance = new DragDropManager()
    }
    return DragDropManager.instance
  }

  private setupEventListeners(): void {
    if (typeof document === 'undefined') return

    document.addEventListener('dragover', (e) => {
      e.preventDefault()
      if (this.dragPreview) {
        this.dragPreview.style.left = `${e.clientX - this.state.offsetX}px`
        this.dragPreview.style.top = `${e.clientY - this.state.offsetY}px`
      }
    })

    document.addEventListener('drop', (e) => {
      e.preventDefault()
      if (this.state.isDragging && this.state.item) {
        const dropZone = this.findDropZone(e.clientX, e.clientY)
        if (dropZone && this.canDrop(this.state.item, dropZone)) {
          dropZone.onDrop?.(this.state.item, dropZone)
        }
      }
      this.endDrag()
    })

    document.addEventListener('dragend', () => {
      this.endDrag()
    })
  }

  registerDropZone(zone: DropZone): void {
    this.dropZones.set(zone.id, zone)
  }

  unregisterDropZone(id: string): void {
    this.dropZones.delete(id)
  }

  startDrag(item: DragItem, sourceElement: HTMLElement, e: DragEvent): void {
    this.state = {
      isDragging: true,
      item,
      sourceElement,
      currentDropZone: null,
      offsetX: e.offsetX || 0,
      offsetY: e.offsetY || 0
    }

    if (item.preview) {
      this.dragPreview = item.preview
      this.dragPreview.style.position = 'fixed'
      this.dragPreview.style.pointerEvents = 'none'
      this.dragPreview.style.zIndex = '10000'
      this.dragPreview.style.opacity = '0.8'
      this.dragPreview.style.transform = 'scale(1.1)'
      this.dragPreview.style.left = `${e.clientX - this.state.offsetX}px`
      this.dragPreview.style.top = `${e.clientY - this.state.offsetY}px`
      document.body.appendChild(this.dragPreview)
    }

    e.dataTransfer?.setData('text/plain', item.id)
    e.dataTransfer!.effectAllowed = 'move'

    this.notifyListeners()
  }

  private endDrag(): void {
    if (this.dragPreview && this.dragPreview.parentNode) {
      this.dragPreview.parentNode.removeChild(this.dragPreview)
    }
    this.dragPreview = null

    const previousZone = this.state.currentDropZone
    if (previousZone) {
      previousZone.onDragLeave?.(this.state.item!, previousZone)
    }

    this.state = {
      isDragging: false,
      item: null,
      sourceElement: null,
      currentDropZone: null,
      offsetX: 0,
      offsetY: 0
    }

    this.notifyListeners()
  }

  private findDropZone(x: number, y: number): DropZone | null {
    for (const [, zone] of this.dropZones) {
      const rect = zone.element.getBoundingClientRect()
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return zone
      }
    }
    return null
  }

  private canDrop(item: DragItem, zone: DropZone): boolean {
    if (!zone.accepts) return true
    return zone.accepts.includes(item.type)
  }

  subscribe(callback: (state: DragState) => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.state)
      } catch {
        // Silently ignore listener errors
      }
    })
  }

  getState(): DragState {
    return { ...this.state }
  }

  getDropZone(id: string): DropZone | undefined {
    return this.dropZones.get(id)
  }

  getAllDropZones(): DropZone[] {
    return Array.from(this.dropZones.values())
  }
}

export const dragDropManager = DragDropManager.getInstance()

export function useDragDrop() {
  return {
    startDrag: (item: DragItem, sourceElement: HTMLElement, e: DragEvent) => {
      dragDropManager.startDrag(item, sourceElement, e)
    },
    registerDropZone: (zone: DropZone) => {
      dragDropManager.registerDropZone(zone)
    },
    unregisterDropZone: (id: string) => {
      dragDropManager.unregisterDropZone(id)
    },
    subscribe: (callback: (state: DragState) => void) => {
      return dragDropManager.subscribe(callback)
    },
    getState: () => dragDropManager.getState()
  }
}
