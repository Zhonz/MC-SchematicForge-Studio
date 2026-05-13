export type EasingFunction = (t: number) => number;
export type AnimationFrame = number;

export interface AnimationOptions {
  duration?: number;
  easing?: EasingFunction;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface AnimationState {
  progress: number;
  value: number;
  isPlaying: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  currentTime: number;
}

export interface Tween<T> {
  to: (target: T, duration: number, options?: AnimationOptions) => Tween<T>;
  chain: (tween: Tween<unknown>) => Tween<T>;
  start: () => Tween<T>;
  stop: () => Tween<T>;
  pause: () => Tween<T>;
  resume: () => Tween<T>;
  onUpdate: (callback: (value: T, progress: number) => void) => Tween<T>;
  onComplete: (callback: () => void) => Tween<T>;
  onStart: (callback: () => void) => Tween<T>;
}

export const easings = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),
  easeInQuint: (t: number) => t * t * t * t * t,
  easeOutQuint: (t: number) => 1 + (--t) * t * t * t * t,
  easeInOutQuint: (t: number) => (t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t),
  easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  easeInCirc: (t: number) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  easeOutCirc: (t: number) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  easeInOutCirc: (t: number) => (t < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2),
  easeInBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t: number) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  easeInElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t: number) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },
  easeInBounce: (t: number) => 1 - easings.easeOutBounce(1 - t),
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  easeInOutBounce: (t: number) => (t < 0.5 ? (1 - easings.easeOutBounce(1 - 2 * t)) / 2 : (1 + easings.easeOutBounce(2 * t - 1)) / 2),
};

export function createTween<T extends Record<string, unknown>>(from: T, to: T): Tween<T> {
  let currentFrom = { ...from };
  let currentTo = { ...to };
  let duration = 1000;
  let easing: EasingFunction = easings.linear;
  let delay = 0;
  let startTime = 0;
  let isRunning = false;
  let isPaused = false;
  let pausedTime = 0;
  let onStartCallback: (() => void) | null = null;
  let onUpdateCallback: ((value: T, progress: number) => void) | null = null;
  let onCompleteCallback: (() => void) | null = null;
  let chainedTween: Tween<unknown> | null = null;
  let animationId: number | null = null;

  const interpolate = (from: T, to: T, progress: number): T => {
    const result: Record<string, unknown> = {};
    for (const key in to) {
      const fromVal = from[key];
      const toVal = to[key];
      if (typeof fromVal === 'number' && typeof toVal === 'number') {
        result[key] = fromVal + (toVal - fromVal) * progress;
      } else if (typeof fromVal === 'string' && typeof toVal === 'string') {
        result[key] = fromVal;
      } else {
        result[key] = progress < 0.5 ? fromVal : toVal;
      }
    }
    return result as T;
  };

  const update = () => {
    if (!isRunning || isPaused) return;

    const elapsed = performance.now() - startTime - delay;
    const progress = Math.min(Math.max(elapsed / duration, 0), 1);
    const easedProgress = easing(progress);
    const value = interpolate(currentFrom, currentTo, easedProgress);

    onUpdateCallback?.(value, easedProgress);

    if (progress >= 1) {
      isRunning = false;
      onCompleteCallback?.();
      if (chainedTween) {
        chainedTween.start();
      }
    } else {
      animationId = requestAnimationFrame(update);
    }
  };

  const tween: Tween<T> = {
    to(target: T, dur: number, options: AnimationOptions = {}) {
      currentTo = { ...target };
      duration = dur;
      if (options.easing) easing = options.easing;
      if (options.delay) delay = options.delay;
      return tween;
    },
    chain(t: Tween<unknown>) {
      chainedTween = t;
      return tween;
    },
    start() {
      if (isRunning) return tween;
      isRunning = true;
      isPaused = false;
      startTime = performance.now();
      onStartCallback?.();
      animationId = requestAnimationFrame(update);
      return tween;
    },
    stop() {
      isRunning = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      return tween;
    },
    pause() {
      if (isRunning && !isPaused) {
        isPaused = true;
        pausedTime = performance.now();
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
      return tween;
    },
    resume() {
      if (isPaused) {
        isPaused = false;
        const pauseDuration = performance.now() - pausedTime;
        startTime += pauseDuration;
        animationId = requestAnimationFrame(update);
      }
      return tween;
    },
    onUpdate(callback: (value: T, progress: number) => void) {
      onUpdateCallback = callback;
      return tween;
    },
    onComplete(callback: () => void) {
      onCompleteCallback = callback;
      return tween;
    },
    onStart(callback: () => void) {
      onStartCallback = callback;
      return tween;
    },
  };

  return tween;
}

export class AnimationManager {
  private animations: Map<string, AnimationFrame> = new Map();
  private tweens: Set<Tween<unknown>> = new Set();

  add(id: string, frame: AnimationFrame): void {
    this.animations.set(id, frame);
  }

  remove(id: string): void {
    const frame = this.animations.get(id);
    if (frame) {
      cancelAnimationFrame(frame);
      this.animations.delete(id);
    }
  }

  cancel(id: string): void {
    this.remove(id);
  }

  cancelAll(): void {
    for (const frame of this.animations.values()) {
      cancelAnimationFrame(frame);
    }
    this.animations.clear();
  }

  isActive(id: string): boolean {
    return this.animations.has(id);
  }
}

export const animationManager = new AnimationManager();

export function animate(
  from: number,
  to: number,
  duration: number,
  callback: (value: number) => void,
  options: AnimationOptions = {}
): () => void {
  const { easing = easings.linear, delay = 0 } = options;
  let startTime: number | null = null;
  let animationId: number;
  let isCancelled = false;

  const step = (timestamp: number) => {
    if (isCancelled) return;

    if (startTime === null) {
      startTime = timestamp + delay;
    }

    const elapsed = timestamp - startTime;
    if (elapsed < 0) {
      animationId = requestAnimationFrame(step);
      return;
    }

    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const value = from + (to - from) * easedProgress;

    callback(value);

    if (progress < 1) {
      animationId = requestAnimationFrame(step);
    }
  };

  animationId = requestAnimationFrame(step);

  return () => {
    isCancelled = true;
    cancelAnimationFrame(animationId);
  };
}

export function stagger<T>(
  items: T[],
  callback: (item: T, index: number, delay: number) => void,
  staggerDelay = 50,
  totalDuration = 300
): () => void {
  const cancels: Array<() => void> = [];
  const baseDelay = 0;
  const totalStagger = items.length * staggerDelay;

  for (let i = 0; i < items.length; i++) {
    const delay = baseDelay + i * staggerDelay;
    const itemDuration = Math.max(totalDuration, totalStagger - delay);
    cancels.push(animate(0, 1, itemDuration, () => {}, { delay }));
  }

  items.forEach((item, index) => {
    const delay = baseDelay + index * staggerDelay;
    setTimeout(() => {
      callback(item, index, delay);
    }, delay);
  });

  return () => {
    cancels.forEach((cancel) => cancel());
  };
}

export class Sequence {
  private steps: Array<{ duration: number; action: () => void | Promise<void> }> = [];
  private currentIndex = 0;
  private isPlaying = false;

  add(duration: number, action: () => void | Promise<void>): this {
    this.steps.push({ duration, action });
    return this;
  }

  async play(): Promise<void> {
    this.isPlaying = true;
    this.currentIndex = 0;

    for (const step of this.steps) {
      if (!this.isPlaying) break;
      const result = step.action();
      if (result instanceof Promise) {
        await result;
      }
      await new Promise((resolve) => setTimeout(resolve, step.duration));
      this.currentIndex++;
    }

    this.isPlaying = false;
  }

  stop(): void {
    this.isPlaying = false;
  }

  reset(): void {
    this.stop();
    this.currentIndex = 0;
  }
}

export class Parallel {
  private tasks: Array<{ action: () => void | Promise<void>; duration?: number }> = [];

  add(action: () => void | Promise<void>, duration?: number): this {
    this.tasks.push({ action, duration });
    return this;
  }

  async play(): Promise<void> {
    const promises = this.tasks.map(async (task) => {
      const result = task.action();
      if (result instanceof Promise) {
        await result;
      }
      if (task.duration) {
        await new Promise((resolve) => setTimeout(resolve, task.duration));
      }
    });

    await Promise.all(promises);
  }
}
