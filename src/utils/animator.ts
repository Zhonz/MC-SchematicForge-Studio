export type EasingFunction = (t: number) => number;

export const easings: Record<string, EasingFunction> = {
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
  easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  easeInCirc: (t) => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t) => Math.sqrt(1 - (--t) * t),
  easeInOutCirc: (t) => (t < 0.5 ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 : (Math.sqrt(1 - 4 * (t - 1) * (t - 1)) + 1) / 2),
  easeInBack: (t) => {
    const c1 = 1.70158;
    return t * t * ((c1 + 1) * t - c1);
  },
  easeOutBack: (t) => {
    const c1 = 1.70158;
    return 1 + (--t) * t * ((c1 + 1) * t + c1);
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5 ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  easeInElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((3 * Math.PI) / 3));
  },
  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((3 * Math.PI) / 3)) + 1;
  },
  easeInOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    const s = 0.075;
    const p = 0.3;
    if (t < 0.5) {
      return -Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * ((2 * Math.PI) / p)) / 2;
    }
    return Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * ((2 * Math.PI) / p)) / 2 + 1;
  },
  easeInBounce: (t) => 1 - easings.easeOutBounce(1 - t),
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  easeInOutBounce: (t) => (t < 0.5 ? (1 - easings.easeOutBounce(1 - 2 * t)) / 2 : (1 + easings.easeOutBounce(2 * t - 1)) / 2)
};

export class Tween<T extends object> {
  private startValues: Partial<T> = {};
  private endValues: Partial<T> = {};
  private currentValues: Partial<T> = {};
  private duration: number;
  private elapsed = 0;
  private easing: EasingFunction;
  private updateCallback?: (values: Partial<T>) => void;
  private completeCallback?: () => void;
  private running = false;
  private cancelled = false;

  constructor(duration: number, easing: EasingFunction = easings.linear) {
    this.duration = duration;
    this.easing = easing;
  }

  from(values: Partial<T>): this {
    this.startValues = { ...values };
    this.currentValues = { ...values };
    return this;
  }

  to(values: Partial<T>): this {
    this.endValues = { ...values };
    return this;
  }

  onUpdate(callback: (values: Partial<T>) => void): this {
    this.updateCallback = callback;
    return this;
  }

  onComplete(callback: () => void): this {
    this.completeCallback = callback;
    return this;
  }

  start(): this {
    this.running = true;
    this.cancelled = false;
    this.elapsed = 0;

    const target = this.endValues as T;
    for (const key in target) {
      if (this.startValues[key as keyof T] === undefined) {
        this.startValues[key as keyof T] = this.currentValues[key as keyof T] as T[keyof T];
      }
    }

    return this;
  }

  update(deltaTime: number): boolean {
    if (!this.running || this.cancelled) return false;

    this.elapsed += deltaTime;
    const progress = Math.min(this.elapsed / this.duration, 1);
    const easedProgress = this.easing(progress);

    for (const key in this.endValues) {
      const start = this.startValues[key as keyof T] as number;
      const end = this.endValues[key as keyof T] as number;
      (this.currentValues as Record<string, number>)[key] = start + (end - start) * easedProgress;
    }

    if (this.updateCallback) {
      this.updateCallback(this.currentValues);
    }

    if (progress >= 1) {
      this.running = false;
      if (this.completeCallback) {
        this.completeCallback();
      }
      return false;
    }

    return true;
  }

  cancel(): void {
    this.cancelled = true;
    this.running = false;
  }

  isRunning(): boolean {
    return this.running && !this.cancelled;
  }

  getCurrentValues(): Partial<T> {
    return { ...this.currentValues };
  }
}

export class AnimationManager {
  private tweens: Tween<object>[] = [];
  private rafId: number | null = null;
  private lastTime = 0;

  add<T extends object>(tween: Tween<T>): Tween<T> {
    this.tweens.push(tween as Tween<object>);
    return tween;
  }

  remove(tween: Tween<object>): void {
    const index = this.tweens.indexOf(tween);
    if (index > -1) {
      this.tweens.splice(index, 1);
    }
  }

  start(): void {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (): void => {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.tweens = this.tweens.filter(tween => tween.update(deltaTime));

    if (this.tweens.length > 0 || this.rafId !== null) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  clear(): void {
    this.tweens = [];
  }

  getActiveCount(): number {
    return this.tweens.length;
  }
}

export const defaultAnimationManager = new AnimationManager();

export function tween<T extends object>(
  duration: number,
  from: Partial<T>,
  to: Partial<T>,
  easing: EasingFunction = easings.linear
): Tween<T> {
  return new Tween<T>(duration, easing).from(from).to(to);
}

export function animate<T extends object>(
  values: Partial<T>,
  duration: number,
  easingName: string = 'easeOutQuad'
): Tween<T> {
  const easing = easings[easingName] || easings.linear;
  return new Tween<T>(duration, easing).to(values);
}
