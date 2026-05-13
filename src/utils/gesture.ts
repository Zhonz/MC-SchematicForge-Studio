export interface GestureEvent {
  state: 'start' | 'move' | 'end' | 'cancel'
  startX: number
  startY: number
  currentX: number
  currentY: number
  deltaX: number
  deltaY: number
  distance: number
  angle: number
  scale: number
  rotation: number
  velocityX: number
  velocityY: number
  direction: 'horizontal' | 'vertical' | 'none'
}

export interface SwipeOptions {
  threshold?: number
  onSwipe?: (event: GestureEvent) => void
  onSwipeLeft?: (event: GestureEvent) => void
  onSwipeRight?: (event: GestureEvent) => void
  onSwipeUp?: (event: GestureEvent) => void
  onSwipeDown?: (event: GestureEvent) => void
}

export interface PinchOptions {
  minScale?: number
  maxScale?: number
  onPinch?: (event: GestureEvent) => void
  onPinchIn?: (event: GestureEvent) => void
  onPinchOut?: (event: GestureEvent) => void
}

export interface PanOptions {
  threshold?: number
  onPan?: (event: GestureEvent) => void
  onPanStart?: (event: GestureEvent) => void
  onPanMove?: (event: GestureEvent) => void
  onPanEnd?: (event: GestureEvent) => void
}

export class GestureRecognizer {
  private element: HTMLElement
  private startX: number = 0
  private startY: number = 0
  private currentX: number = 0
  private currentY: number = 0
  private startTime: number = 0
  private isTracking: boolean = false
  private lastX: number = 0
  private lastY: number = 0
  private lastTime: number = 0
  private velocityX: number = 0
  private velocityY: number = 0
  private pinchStartDistance: number = 0
  private pinchStartScale: number = 1
  private touches: Touch[] = []
  private longPressTimeout: ReturnType<typeof setTimeout> | null = null
  private options: {
    swipe?: SwipeOptions
    pinch?: PinchOptions
    pan?: PanOptions
    longPress?: { duration?: number; onLongPress?: (event: GestureEvent) => void }
  } = {}

  constructor(element: HTMLElement, options: {
    swipe?: SwipeOptions
    pinch?: PinchOptions
    pan?: PanOptions
    longPress?: { duration?: number; onLongPress?: (event: GestureEvent) => void }
  } = {}) {
    this.element = element
    this.options = options
    this.attach()
  }

  private attach(): void {
    this.element.addEventListener('touchstart', this.onTouchStart, { passive: false })
    this.element.addEventListener('touchmove', this.onTouchMove, { passive: false })
    this.element.addEventListener('touchend', this.onTouchEnd)
    this.element.addEventListener('touchcancel', this.onTouchCancel)

    this.element.addEventListener('mousedown', this.onMouseDown)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mouseup', this.onMouseUp)
  }

  destroy(): void {
    this.element.removeEventListener('touchstart', this.onTouchStart)
    this.element.removeEventListener('touchmove', this.onTouchMove)
    this.element.removeEventListener('touchend', this.onTouchEnd)
    this.element.removeEventListener('touchcancel', this.onTouchCancel)
    this.element.removeEventListener('mousedown', this.onMouseDown)
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('mouseup', this.onMouseUp)
    this.clearLongPress()
  }

  private clearLongPress(): void {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout)
      this.longPressTimeout = null
    }
  }

  private startGesture(x: number, y: number): void {
    this.isTracking = true
    this.startX = x
    this.startY = y
    this.currentX = x
    this.currentY = y
    this.lastX = x
    this.lastY = y
    this.startTime = Date.now()
    this.lastTime = Date.now()
    this.velocityX = 0
    this.velocityY = 0
    this.touches = []

    this.options.pan?.onPanStart?.(this.createGestureEvent('start'))
  }

  private moveGesture(x: number, y: number): void {
    if (!this.isTracking) return

    const now = Date.now()
    const dt = now - this.lastTime

    this.velocityX = dt > 0 ? (x - this.lastX) / dt : 0
    this.velocityY = dt > 0 ? (y - this.lastY) / dt : 0

    this.lastX = this.currentX
    this.lastY = this.currentY
    this.currentX = x
    this.currentY = y
    this.lastTime = now

    this.clearLongPress()

    this.options.pan?.onPanMove?.(this.createGestureEvent('move'))
  }

  private endGesture(): void {
    if (!this.isTracking) return

    this.isTracking = false

    const event = this.createGestureEvent('end')

    const threshold = this.options.swipe?.threshold || 50
    const distance = this.calculateDistance()

    if (distance > threshold) {
      this.options.swipe?.onSwipe?.(event)

      const direction = this.getSwipeDirection()
      switch (direction) {
        case 'left': this.options.swipe?.onSwipeLeft?.(event); break
        case 'right': this.options.swipe?.onSwipeRight?.(event); break
        case 'up': this.options.swipe?.onSwipeUp?.(event); break
        case 'down': this.options.swipe?.onSwipeDown?.(event); break
      }
    }

    this.options.pan?.onPanEnd?.(event)

    this.clearLongPress()
  }

  private createGestureEvent(state: 'start' | 'move' | 'end' | 'cancel'): GestureEvent {
    const deltaX = this.currentX - this.startX
    const deltaY = this.currentY - this.startY
    const distance = this.calculateDistance()
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)

    let direction: 'horizontal' | 'vertical' | 'none' = 'none'
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = 'horizontal'
    } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
      direction = 'vertical'
    }

    return {
      state,
      startX: this.startX,
      startY: this.startY,
      currentX: this.currentX,
      currentY: this.currentY,
      deltaX,
      deltaY,
      distance,
      angle,
      scale: 1,
      rotation: 0,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      direction
    }
  }

  private calculateDistance(): number {
    return Math.sqrt(Math.pow(this.currentX - this.startX, 2) + Math.pow(this.currentY - this.startY, 2))
  }

  private getSwipeDirection(): 'left' | 'right' | 'up' | 'down' {
    const deltaX = this.currentX - this.startX
    const deltaY = this.currentY - this.startY

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left'
    } else {
      return deltaY > 0 ? 'down' : 'up'
    }
  }

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault()
    this.touches = Array.from(e.touches)

    if (e.touches.length === 1) {
      const touch = e.touches[0]
      this.startGesture(touch.clientX, touch.clientY)

      if (this.options.longPress) {
        this.longPressTimeout = setTimeout(() => {
          if (this.isTracking) {
            this.options.longPress?.onLongPress?.(this.createGestureEvent('start'))
          }
        }, this.options.longPress.duration || 500)
      }
    } else if (e.touches.length === 2) {
      this.pinchStartDistance = this.getTouchDistance()
      this.pinchStartScale = 1
    }
  }

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault()
    this.touches = Array.from(e.touches)

    if (e.touches.length === 1) {
      const touch = e.touches[0]
      this.moveGesture(touch.clientX, touch.clientY)
    } else if (e.touches.length === 2 && this.options.pinch) {
      const distance = this.getTouchDistance()
      const scale = distance / this.pinchStartDistance

      const event = this.createGestureEvent('move')
      event.scale = Math.max(this.options.pinch.minScale || 0.5, Math.min(this.options.pinch.maxScale || 3, scale))

      this.options.pinch.onPinch?.(event)
      if (scale > 1) {
        this.options.pinch.onPinchOut?.(event)
      } else {
        this.options.pinch.onPinchIn?.(event)
      }
    }
  }

  private onTouchEnd = (e: TouchEvent): void => {
    this.touches = Array.from(e.touches)
    if (e.touches.length === 0) {
      this.endGesture()
    }
  }

  private onTouchCancel = (): void => {
    this.isTracking = false
    this.clearLongPress()
  }

  private getTouchDistance(): number {
    if (this.touches.length < 2) return 0
    const dx = this.touches[1].clientX - this.touches[0].clientX
    const dy = this.touches[1].clientY - this.touches[0].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return
    this.startGesture(e.clientX, e.clientY)
  }

  private onMouseMove = (e: MouseEvent): void => {
    this.moveGesture(e.clientX, e.clientY)
  }

  private onMouseUp = (): void => {
    this.endGesture()
  }
}

export function useSwipe(element: HTMLElement, options: SwipeOptions): () => void {
  const recognizer = new GestureRecognizer(element, { swipe: options })
  return () => recognizer.destroy()
}

export function usePinch(element: HTMLElement, options: PinchOptions): () => void {
  const recognizer = new GestureRecognizer(element, { pinch: options })
  return () => recognizer.destroy()
}

export function usePan(element: HTMLElement, options: PanOptions): () => void {
  const recognizer = new GestureRecognizer(element, { pan: options })
  return () => recognizer.destroy()
}
