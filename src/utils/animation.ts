export interface AnimationOptions {
  duration: number;
  easing?: (t: number) => number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

export class Animation {
  private id: number | null = null;
  private startTime: number = 0;
  private duration: number;
  private easing: (t: number) => number;
  private onUpdate: (value: number) => void;
  private onComplete?: () => void;

  constructor(options: AnimationOptions) {
    this.duration = options.duration;
    this.easing = options.easing ?? ((t) => t);
    this.onUpdate = options.onUpdate;
    this.onComplete = options.onComplete;
  }

  start(): this {
    if (this.id !== null) return this;
    this.startTime = performance.now();
    
    const tick = (currentTime: number) => {
      const elapsed = currentTime - this.startTime;
      const progress = Math.min(elapsed / this.duration, 1);
      const easedProgress = this.easing(progress);
      this.onUpdate(easedProgress);
      
      if (progress < 1) {
        this.id = requestAnimationFrame(tick);
      } else {
        this.id = null;
        this.onComplete?.();
      }
    };
    
    this.id = requestAnimationFrame(tick);
    return this;
  }

  stop(): void {
    if (this.id !== null) {
      cancelAnimationFrame(this.id);
      this.id = null;
    }
  }

  isRunning(): boolean {
    return this.id !== null;
  }
}

export function animate(options: AnimationOptions): Animation {
  return new Animation(options).start();
}

export function tween(
  from: number,
  to: number,
  duration: number,
  easing: (t: number) => number = (t) => t,
  onUpdate: (value: number) => void
): () => void {
  const animation = new Animation({
    duration,
    easing,
    onUpdate: (t) => onUpdate(from + (to - from) * t),
  });
  animation.start();
  return () => animation.stop();
}

export const Easing = {
  linear: (t: number) => t,
  quadIn: (t: number) => t * t,
  quadOut: (t: number) => t * (2 - t),
  quadInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  cubicIn: (t: number) => t * t * t,
  cubicOut: (t: number) => --t * t * t + 1,
  cubicInOut: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  elasticIn: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI / 3));
  },
  elasticOut: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
  },
  bounceOut: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};
