type EasingFn = (t: number) => number;

const easings: Record<string, EasingFn> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

interface TweenState {
  from: number;
  to: number;
  duration: number;
  elapsed: number;
  easing: EasingFn;
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
}

export class Animator {
  private tweens: Map<string, TweenState> = new Map();
  private rafId: number | null = null;
  private lastTime = 0;

  private tick = (time: number): void => {
    const deltaTime = this.lastTime ? time - this.lastTime : 0;
    this.lastTime = time;

    const completed: string[] = [];

    for (const [id, tween] of this.tweens) {
      tween.elapsed += deltaTime;
      const progress = Math.min(tween.elapsed / tween.duration, 1);
      const easedProgress = tween.easing(progress);
      const value = tween.from + (tween.to - tween.from) * easedProgress;
      
      tween.onUpdate?.(value);

      if (progress >= 1) {
        completed.push(id);
      }
    }

    for (const id of completed) {
      const tween = this.tweens.get(id);
      if (tween) {
        tween.onComplete?.();
        this.tweens.delete(id);
      }
    }

    if (this.tweens.size > 0) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.rafId = null;
    }
  };

  tween(
    id: string,
    from: number,
    to: number,
    duration: number,
    options?: {
      easing?: string;
      onUpdate?: (value: number) => void;
      onComplete?: () => void;
    }
  ): void {
    this.stop(id);
    
    const easingKey = options?.easing ?? 'easeInOut';
    const easingFn = easings[easingKey] ?? easings.easeInOut;
    
    this.tweens.set(id, {
      from,
      to,
      duration,
      elapsed: 0,
      easing: easingFn,
      onUpdate: options?.onUpdate,
      onComplete: options?.onComplete,
    });

    if (this.rafId === null) {
      this.lastTime = 0;
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  stop(id: string): void {
    this.tweens.delete(id);
  }

  stopAll(): void {
    this.tweens.clear();
  }

  isActive(id: string): boolean {
    return this.tweens.has(id);
  }

  getActiveCount(): number {
    return this.tweens.size;
  }
}

export const animator = new Animator();
