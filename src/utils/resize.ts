export interface ResizeOptions {
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  handles?: Array<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'>
  onResizeStart?: (event: MouseEvent, size: { width: number; height: number }) => void
  onResize?: (event: MouseEvent, size: { width: number; height: number; deltaWidth: number; deltaHeight: number }) => void
  onResizeEnd?: (event: MouseEvent, size: { width: number; height: number }) => void
  ratio?: boolean
}

const DEFAULT_HANDLES: Array<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'> = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

const HANDLE_CURSORS: Record<string, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize'
}

export class ResizeObserver {
  private element: HTMLElement
  private options: {
    minWidth: number
    maxWidth: number
    minHeight: number
    maxHeight: number
    handles: Array<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'>
    ratio: boolean
    onResizeStart?: (event: MouseEvent, size: { width: number; height: number }) => void
    onResize?: (event: MouseEvent, size: { width: number; height: number; deltaWidth: number; deltaHeight: number }) => void
    onResizeEnd?: (event: MouseEvent, size: { width: number; height: number }) => void
  }
  private handles: Map<string, HTMLElement> = new Map()
  private isResizing: boolean = false
  private currentHandle: string | null = null
  private startSize: { width: number; height: number } = { width: 0, height: 0 }
  private startPosition: { x: number; y: number } = { x: 0, y: 0 }
  private originalRect: DOMRect | null = null
  private removeGlobalListeners: (() => void) | null = null

  constructor(element: HTMLElement, options: ResizeOptions = {}) {
    this.element = element
    this.options = {
      handles: options.handles || DEFAULT_HANDLES,
      minWidth: options.minWidth || 0,
      maxWidth: options.maxWidth || Infinity,
      minHeight: options.minHeight || 0,
      maxHeight: options.maxHeight || Infinity,
      ratio: options.ratio || false,
      onResizeStart: options.onResizeStart,
      onResize: options.onResize,
      onResizeEnd: options.onResizeEnd
    }

    this.createHandles()
    this.attachListeners()
  }

  private createHandles(): void {
    const handleSize = 10

    for (const handle of this.options.handles) {
      const handleEl = document.createElement('div')
      handleEl.className = `resize-handle resize-handle-${handle}`
      handleEl.style.cssText = `
        position: absolute;
        width: ${handle.length === 1 ? handleSize : handleSize * 2}px;
        height: ${handle.length === 1 ? handleSize : handleSize * 2}px;
        cursor: ${HANDLE_CURSORS[handle]};
        z-index: 10;
      `

      this.positionHandle(handleEl, handle)
      this.element.appendChild(handleEl)
      this.handles.set(handle, handleEl)
    }
  }

  private positionHandle(handle: HTMLElement, position: string): void {
    const elRect = this.element.getBoundingClientRect()

    switch (position) {
      case 'n':
        handle.style.top = '-5px'
        handle.style.left = `${(elRect.width - 20) / 2}px`
        break
      case 's':
        handle.style.bottom = '-5px'
        handle.style.left = `${(elRect.width - 20) / 2}px`
        break
      case 'e':
        handle.style.right = '-5px'
        handle.style.top = `${(elRect.height - 20) / 2}px`
        break
      case 'w':
        handle.style.left = '-5px'
        handle.style.top = `${(elRect.height - 20) / 2}px`
        break
      case 'ne':
        handle.style.top = '-5px'
        handle.style.right = '-5px'
        break
      case 'nw':
        handle.style.top = '-5px'
        handle.style.left = '-5px'
        break
      case 'se':
        handle.style.bottom = '-5px'
        handle.style.right = '-5px'
        break
      case 'sw':
        handle.style.bottom = '-5px'
        handle.style.left = '-5px'
        break
    }
  }

  private attachListeners(): void {
    for (const [handle, handleEl] of this.handles) {
      handleEl.addEventListener('mousedown', (e: MouseEvent) => this.startResize(e, handle))
    }
  }

  private startResize(event: MouseEvent, handle: string): void {
    event.preventDefault()
    event.stopPropagation()

    this.isResizing = true
    this.currentHandle = handle
    this.startSize = {
      width: this.element.offsetWidth,
      height: this.element.offsetHeight
    }
    this.startPosition = { x: event.clientX, y: event.clientY }
    this.originalRect = this.element.getBoundingClientRect()

    this.options.onResizeStart?.(event, { ...this.startSize })

    this.removeGlobalListeners = () => {
      document.removeEventListener('mousemove', this.handleMouseMove)
      document.removeEventListener('mouseup', this.handleMouseUp)
    }

    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.handleMouseUp)
  }

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.isResizing || !this.currentHandle || !this.originalRect) return

    const deltaX = event.clientX - this.startPosition.x
    const deltaY = event.clientY - this.startPosition.y

    let newWidth = this.startSize.width
    let newHeight = this.startSize.height

    const handle = this.currentHandle

    if (handle.includes('e')) newWidth += deltaX
    if (handle.includes('w')) newWidth -= deltaX
    if (handle.includes('s')) newHeight += deltaY
    if (handle.includes('n')) newHeight -= deltaY

    newWidth = Math.max(this.options.minWidth, Math.min(this.options.maxWidth, newWidth))
    newHeight = Math.max(this.options.minHeight, Math.min(this.options.maxHeight, newHeight))

    if (this.options.ratio) {
      const ratio = this.startSize.width / this.startSize.height
      if (handle.includes('e') || handle.includes('w')) {
        newHeight = newWidth / ratio
      } else {
        newWidth = newHeight * ratio
      }
    }

    this.element.style.width = `${newWidth}px`
    this.element.style.height = `${newHeight}px`

    this.options.onResize?.(event, {
      width: newWidth,
      height: newHeight,
      deltaWidth: newWidth - this.startSize.width,
      deltaHeight: newHeight - this.startSize.height
    })
  }

  private handleMouseUp = (event: MouseEvent): void => {
    if (!this.isResizing) return

    this.isResizing = false
    this.removeGlobalListeners?.()
    this.removeGlobalListeners = null

    this.options.onResizeEnd?.(event, {
      width: this.element.offsetWidth,
      height: this.element.offsetHeight
    })

    this.currentHandle = null
    this.originalRect = null
  }

  destroy(): void {
    this.removeGlobalListeners?.()
    for (const [, handleEl] of this.handles) {
      handleEl.remove()
    }
    this.handles.clear()
  }
}

export function makeResizable(element: HTMLElement, options: ResizeOptions = {}): ResizeObserver {
  return new ResizeObserver(element, options)
}
