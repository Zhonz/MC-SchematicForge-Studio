export type EaseFunction = (t: number) => number

export const EasingFunctions: Record<string, EaseFunction> = {
  linear: (t) => t,

  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),

  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),

  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
  easeInOutQuint: (t) => (t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t),

  easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) => {
    if (t === 0) return 0
    if (t === 1) return 1
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2
    return (2 - Math.pow(2, -20 * t + 10)) / 2
  },

  easeInCirc: (t) => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t) => Math.sqrt(1 - (--t) * t),
  easeInOutCirc: (t) => {
    if (t < 0.5) return (1 - Math.sqrt(1 - 4 * t * t)) / 2
    return (Math.sqrt(1 - 4 * (t - 1) * (t - 1)) + 1) / 2
  },

  easeInBack: (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return c3 * t * t * t - c1 * t * t
  },
  easeOutBack: (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158
    const c2 = c1 * 1.525
    if (t < 0.5) return (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    return (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2
  },

  easeInElastic: (t) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)
  },
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
  easeInOutElastic: (t) => {
    const c5 = (2 * Math.PI) / 4.5
    if (t === 0) return 0
    if (t === 1) return 1
    if (t < 0.5) return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
    return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1
  },

  easeInBounce: (t) => 1 - EasingFunctions.easeOutBounce(1 - t),
  easeOutBounce: (t) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
  easeInOutBounce: (t) => (t < 0.5 ? (1 - EasingFunctions.easeOutBounce(1 - 2 * t)) / 2 : (1 + EasingFunctions.easeOutBounce(2 * t - 1)) / 2)
}

export class Animation {
  private startTime: number = 0
  private duration: number
  private easing: EaseFunction
  private onUpdate: (value: number) => void
  private onComplete?: () => void
  private isRunning: boolean = false
  private frameId: number | null = null

  constructor(
    duration: number,
    onUpdate: (value: number) => void,
    options?: {
      easing?: EaseFunction
      onComplete?: () => void
    }
  ) {
    this.duration = duration
    this.easing = options?.easing || EasingFunctions.linear
    this.onUpdate = onUpdate
    this.onComplete = options?.onComplete
  }

  start(): this {
    if (this.isRunning) return this
    this.isRunning = true
    this.startTime = performance.now()

    const animate = (currentTime: number) => {
      if (!this.isRunning) return

      const elapsed = currentTime - this.startTime
      const progress = Math.min(elapsed / this.duration, 1)
      const easedProgress = this.easing(progress)

      this.onUpdate(easedProgress)

      if (progress < 1) {
        this.frameId = requestAnimationFrame(animate)
      } else {
        this.isRunning = false
        this.onComplete?.()
      }
    }

    this.frameId = requestAnimationFrame(animate)
    return this
  }

  stop(): void {
    this.isRunning = false
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  reset(): void {
    this.stop()
    this.onUpdate(0)
  }

  pause(): this {
    this.isRunning = false
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
    return this
  }

  resume(): this {
    if (this.isRunning) return this
    const elapsed = performance.now() - this.startTime
    this.isRunning = true

    const animate = (currentTime: number) => {
      if (!this.isRunning) return

      const newElapsed = currentTime - this.startTime + elapsed
      const progress = Math.min(newElapsed / this.duration, 1)
      const easedProgress = this.easing(progress)

      this.onUpdate(easedProgress)

      if (progress < 1) {
        this.frameId = requestAnimationFrame(animate)
      } else {
        this.isRunning = false
        this.onComplete?.()
      }
    }

    this.frameId = requestAnimationFrame(animate)
    return this
  }
}

export class Tween {
  private animations: Animation[] = []

  add(duration: number, onUpdate: (value: number) => void, options?: { easing?: EaseFunction; onComplete?: () => void }): this {
    const animation = new Animation(duration, onUpdate, options)
    this.animations.push(animation)
    return this
  }

  start(): this {
    this.animations.forEach(anim => anim.start())
    return this
  }

  stop(): void {
    this.animations.forEach(anim => anim.stop())
  }

  clear(): void {
    this.stop()
    this.animations = []
  }
}
