export interface Position {
  x: number
  y: number
}

export interface GestureConfig {
  onTap?: (position: Position) => void
  onDoubleTap?: (position: Position) => void
  onLongPress?: (position: Position) => void
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', distance: number) => void
  threshold?: number
  longPressDelay?: number
  doubleTapDelay?: number
}

export class GestureHandler {
  private element: HTMLElement
  private config: Required<GestureConfig>
  private isTracking: boolean = false
  private startPosition: Position | null = null
  private lastTapTime: number = 0
  private tapCount: number = 0
  private longPressTimer: ReturnType<typeof setTimeout> | null = null

  constructor(element: HTMLElement, config?: GestureConfig) {
    this.element = element
    this.config = {
      threshold: 10,
      longPressDelay: 500,
      doubleTapDelay: 300,
      ...config
    } as Required<GestureConfig>
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this))
  }

  private getPosition(e: MouseEvent): Position {
    const rect = this.element.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    this.isTracking = true
    this.startPosition = this.getPosition(e)

    this.clearLongPressTimer()
    this.longPressTimer = setTimeout(() => {
      if (this.isTracking && this.config.onLongPress) {
        this.config.onLongPress(this.startPosition!)
      }
    }, this.config.longPressDelay)
  }

  private handleMouseMove(_e: MouseEvent): void {
    // Motion handling can be expanded
  }

  private handleMouseUp(e: MouseEvent): void {
    if (!this.isTracking || !this.startPosition) return

    this.isTracking = false
    const endPosition = this.getPosition(e)
    const delta = {
      x: endPosition.x - this.startPosition.x,
      y: endPosition.y - this.startPosition.y
    }
    const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y)

    this.clearLongPressTimer()

    if (distance < this.config.threshold) {
      const timeSinceLastTap = Date.now() - this.lastTapTime

      if (timeSinceLastTap < this.config.doubleTapDelay && this.tapCount === 1) {
        if (this.config.onDoubleTap) {
          this.config.onDoubleTap(this.startPosition)
        }
        this.tapCount = 0
        this.lastTapTime = 0
      } else {
        this.tapCount = 1
        this.lastTapTime = Date.now()

        if (this.config.onTap) {
          setTimeout(() => {
            if (this.tapCount === 1) {
              this.config.onTap!(this.startPosition!)
              this.tapCount = 0
            }
          }, this.config.doubleTapDelay)
        }
      }
    } else if (this.config.onSwipe) {
      const angle = Math.atan2(delta.y, delta.x) * 180 / Math.PI
      let direction: 'left' | 'right' | 'up' | 'down'

      if (angle >= -45 && angle < 45) {
        direction = 'right'
      } else if (angle >= 45 && angle < 135) {
        direction = 'down'
      } else if (angle >= -135 && angle < -45) {
        direction = 'up'
      } else {
        direction = 'left'
      }

      this.config.onSwipe(direction, distance)
    }

    this.startPosition = null
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }

  updateConfig(config: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...config } as Required<GestureConfig>
  }

  destroy(): void {
    this.clearLongPressTimer()
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this))
  }
}

export function createGestureHandler(element: HTMLElement, config?: GestureConfig): GestureHandler {
  return new GestureHandler(element, config)
}
