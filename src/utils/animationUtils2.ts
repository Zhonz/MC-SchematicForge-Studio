export type EasingType = 
  | 'linear'
  | 'ease-in' | 'ease-out' | 'ease-in-out'
  | 'ease-in-quad' | 'ease-out-quad' | 'ease-in-out-quad'
  | 'ease-in-cubic' | 'ease-out-cubic' | 'ease-in-out-cubic'
  | 'ease-in-quart' | 'ease-out-quart' | 'ease-in-out-quart'
  | 'ease-in-quint' | 'ease-out-quint' | 'ease-in-out-quint'
  | 'ease-in-sine' | 'ease-out-sine' | 'ease-in-out-sine'
  | 'ease-in-expo' | 'ease-out-expo' | 'ease-in-out-expo'
  | 'ease-in-circ' | 'ease-out-circ' | 'ease-in-out-circ'
  | 'ease-in-back' | 'ease-out-back' | 'ease-in-out-back'
  | 'ease-in-elastic' | 'ease-out-elastic' | 'ease-in-out-elastic'
  | 'ease-in-bounce' | 'ease-out-bounce' | 'ease-in-out-bounce';

export interface AnimationOptions {
  duration: number;
  easing?: EasingType | ((t: number) => number);
  delay?: number;
  loop?: boolean | number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
  onStart?: () => void;
  onComplete?: () => void;
  onUpdate?: (progress: number, value: number) => void;
  onIteration?: (iteration: number) => void;
}

export interface SpringConfig {
  tension: number;
  friction: number;
  mass?: number;
  velocity?: number;
  precision?: number;
}

export interface TransitionConfig {
  property: string;
  duration: number;
  easing?: EasingType | ((t: number) => number);
  delay?: number;
}

export interface SequenceStep {
  animations: Animation[];
  offset?: number;
}

export class AnimationUtils2 {
  private static instance: AnimationUtils2;

  static getInstance(): AnimationUtils2 {
    if (!AnimationUtils2.instance) {
      AnimationUtils2.instance = new AnimationUtils2();
    }
    return AnimationUtils2.instance;
  }

  static easeInQuad(t: number): number {
    return t * t;
  }

  static easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeInCubic(t: number): number {
    return t * t * t;
  }

  static easeOutCubic(t: number): number {
    return (--t) * t * t + 1;
  }

  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  static easeInQuart(t: number): number {
    return t * t * t * t;
  }

  static easeOutQuart(t: number): number {
    return 1 - (--t) * t * t * t;
  }

  static easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
  }

  static easeInQuint(t: number): number {
    return t * t * t * t * t;
  }

  static easeOutQuint(t: number): number {
    return 1 + (--t) * t * t * t * t;
  }

  static easeInOutQuint(t: number): number {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
  }

  static easeInSine(t: number): number {
    return 1 - Math.cos((t * Math.PI) / 2);
  }

  static easeOutSine(t: number): number {
    return Math.sin((t * Math.PI) / 2);
  }

  static easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  static easeInExpo(t: number): number {
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
  }

  static easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  static easeInOutExpo(t: number): number {
    if (t === 0 || t === 1) return t;
    if (t < 0.5) {
      return Math.pow(2, 20 * t - 10) / 2;
    }
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  }

  static easeInCirc(t: number): number {
    return 1 - Math.sqrt(1 - Math.pow(t, 2));
  }

  static easeOutCirc(t: number): number {
    return Math.sqrt(1 - Math.pow(t - 1, 2));
  }

  static easeInOutCirc(t: number): number {
    if (t < 0.5) {
      return (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2;
    }
    return (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
  }

  static easeInBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  }

  static easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  static easeInOutBack(t: number): number {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    if (t < 0.5) {
      return (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2;
    }
    return (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  }

  static easeInElastic(t: number): number {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  }

  static easeOutElastic(t: number): number {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  static easeInOutElastic(t: number): number {
    if (t === 0 || t === 1) return t;
    const c5 = (2 * Math.PI) / 4.5;
    if (t < 0.5) {
      return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2;
    }
    return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  }

  static easeInBounce(t: number): number {
    return 1 - AnimationUtils2.easeOutBounce(1 - t);
  }

  static easeOutBounce(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  static easeInOutBounce(t: number): number {
    if (t < 0.5) {
      return (1 - AnimationUtils2.easeOutBounce(1 - 2 * t)) / 2;
    }
    return (1 + AnimationUtils2.easeOutBounce(2 * t - 1)) / 2;
  }

  static getEasingFunction(easing: EasingType): (t: number) => number {
    const easingMap: Record<EasingType, (t: number) => number> = {
      linear: (t) => t,
      'ease-in': AnimationUtils2.easeInQuad,
      'ease-out': AnimationUtils2.easeOutQuad,
      'ease-in-out': AnimationUtils2.easeInOutQuad,
      'ease-in-quad': AnimationUtils2.easeInQuad,
      'ease-out-quad': AnimationUtils2.easeOutQuad,
      'ease-in-out-quad': AnimationUtils2.easeInOutQuad,
      'ease-in-cubic': AnimationUtils2.easeInCubic,
      'ease-out-cubic': AnimationUtils2.easeOutCubic,
      'ease-in-out-cubic': AnimationUtils2.easeInOutCubic,
      'ease-in-quart': AnimationUtils2.easeInQuart,
      'ease-out-quart': AnimationUtils2.easeOutQuart,
      'ease-in-out-quart': AnimationUtils2.easeInOutQuart,
      'ease-in-quint': AnimationUtils2.easeInQuint,
      'ease-out-quint': AnimationUtils2.easeOutQuint,
      'ease-in-out-quint': AnimationUtils2.easeInOutQuint,
      'ease-in-sine': AnimationUtils2.easeInSine,
      'ease-out-sine': AnimationUtils2.easeOutSine,
      'ease-in-out-sine': AnimationUtils2.easeInOutSine,
      'ease-in-expo': AnimationUtils2.easeInExpo,
      'ease-out-expo': AnimationUtils2.easeOutExpo,
      'ease-in-out-expo': AnimationUtils2.easeInOutExpo,
      'ease-in-circ': AnimationUtils2.easeInCirc,
      'ease-out-circ': AnimationUtils2.easeOutCirc,
      'ease-in-out-circ': AnimationUtils2.easeInOutCirc,
      'ease-in-back': AnimationUtils2.easeInBack,
      'ease-out-back': AnimationUtils2.easeOutBack,
      'ease-in-out-back': AnimationUtils2.easeInOutBack,
      'ease-in-elastic': AnimationUtils2.easeInElastic,
      'ease-out-elastic': AnimationUtils2.easeOutElastic,
      'ease-in-out-elastic': AnimationUtils2.easeInOutElastic,
      'ease-in-bounce': AnimationUtils2.easeInBounce,
      'ease-out-bounce': AnimationUtils2.easeOutBounce,
      'ease-in-out-bounce': AnimationUtils2.easeInOutBounce,
    };
    return easingMap[easing] || ((t) => t);
  }

  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  static inverseLerp(start: number, end: number, value: number): number {
    return (value - start) / (end - start);
  }

  static remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    const t = AnimationUtils2.inverseLerp(inMin, inMax, value);
    return AnimationUtils2.lerp(outMin, outMax, t);
  }

  static smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static springInterpolate(
    current: number,
    target: number,
    velocity: number,
    config: SpringConfig
  ): { value: number; velocity: number } {
    const { tension, friction, mass = 1, precision = 0.01 } = config;
    
    const springForce = -tension * (current - target);
    const dampingForce = -friction * velocity;
    const acceleration = (springForce + dampingForce) / mass;
    
    const newVelocity = velocity + acceleration * (1 / 60);
    const newValue = current + newVelocity * (1 / 60);

    if (
      Math.abs(current - target) < precision &&
      Math.abs(velocity) < precision
    ) {
      return { value: target, velocity: 0 };
    }

    return { value: newValue, velocity: newVelocity };
  }

  static applySpring(
    current: number,
    target: number,
    velocity: number,
    config: SpringConfig
  ): { value: number; velocity: number } {
    return AnimationUtils2.springInterpolate(current, target, velocity, config);
  }

  static fadeIn(
    element: HTMLElement,
    options?: Partial<AnimationOptions>
  ): Promise<void> {
    return new Promise((resolve) => {
      element.style.opacity = '0';
      element.style.display = 'block';
      
      const animation = new Animation2(element, {
        duration: options?.duration || 300,
        easing: options?.easing || 'ease-out',
        onComplete: resolve,
      });
      
      animation.animate({ opacity: [0, 1] });
    });
  }

  static fadeOut(
    element: HTMLElement,
    options?: Partial<AnimationOptions>
  ): Promise<void> {
    return new Promise((resolve) => {
      const animation = new Animation2(element, {
        duration: options?.duration || 300,
        easing: options?.easing || 'ease-out',
        onComplete: () => {
          element.style.display = 'none';
          resolve();
        },
      });
      
      animation.animate({ opacity: [1, 0] });
    });
  }

  static slideIn(
    element: HTMLElement,
    direction: 'up' | 'down' | 'left' | 'right',
    options?: Partial<AnimationOptions>
  ): Promise<void> {
    return new Promise((resolve) => {
      const translateMap = {
        up: { from: 'translateY(100%)', to: 'translateY(0)' },
        down: { from: 'translateY(-100%)', to: 'translateY(0)' },
        left: { from: 'translateX(100%)', to: 'translateX(0)' },
        right: { from: 'translateX(-100%)', to: 'translateX(0)' },
      };
      
      const { from, to } = translateMap[direction];
      element.style.transform = from;
      element.style.display = 'block';
      
      const animation = new Animation2(element, {
        duration: options?.duration || 300,
        easing: options?.easing || 'ease-out',
        onComplete: resolve,
      });
      
      animation.animate({ transform: [from, to] });
    });
  }

  static scale(
    element: HTMLElement,
    from: number,
    to: number,
    options?: Partial<AnimationOptions>
  ): Promise<void> {
    return new Promise((resolve) => {
      const animation = new Animation2(element, {
        duration: options?.duration || 300,
        easing: options?.easing || 'ease-out',
        onComplete: resolve,
      });
      
      animation.animate({ transform: [`scale(${from})`, `scale(${to})`] });
    });
  }

  static shake(element: HTMLElement, intensity = 10, duration = 500): Promise<void> {
    return new Promise((resolve) => {
      const originalTransform = element.style.transform;
      const startTime = performance.now();
      
      const shake = () => {
        const elapsed = performance.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
          const offsetX = Math.sin(progress * Math.PI * 8) * intensity * (1 - progress);
          const offsetY = Math.cos(progress * Math.PI * 8) * intensity * (1 - progress) * 0.5;
          element.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${offsetX * 2}deg)`;
          requestAnimationFrame(shake);
        } else {
          element.style.transform = originalTransform;
          resolve();
        }
      };
      
      requestAnimationFrame(shake);
    });
  }

  static pulse(element: HTMLElement, scale = 1.1, duration = 300): Promise<void> {
    return new Promise((resolve) => {
      const originalTransform = element.style.transform;
      const startTime = performance.now();
      
      const pulse_anim = () => {
        const elapsed = performance.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
          const easeProgress = AnimationUtils2.easeInOutQuad(progress);
          const scaleValue = progress < 0.5 
            ? AnimationUtils2.lerp(1, scale, easeProgress * 2)
            : AnimationUtils2.lerp(scale, 1, (easeProgress - 0.5) * 2);
          element.style.transform = `scale(${scaleValue})`;
          requestAnimationFrame(pulse_anim);
        } else {
          element.style.transform = originalTransform;
          resolve();
        }
      };
      
      requestAnimationFrame(pulse_anim);
    });
  }

  static stagger(duration: number, staggerDelay: number): (index: number) => number {
    return (index: number) => index * staggerDelay;
  }

  static sequence(animations: SequenceStep[]): Promise<void> {
    return new Promise((resolve) => {
      let currentIndex = 0;
      
      const runNext = () => {
        if (currentIndex >= animations.length) {
          resolve();
          return;
        }
        
        const step = animations[currentIndex];
        Promise.all(step.animations.map((anim) => anim.start()))
          .then(() => {
            currentIndex++;
            runNext();
          })
          .catch(() => {
            resolve();
          });
      };
      
      runNext();
    });
  }

  static parallel(animations: Animation[]): Promise<void> {
    return Promise.all(animations.map((anim) => anim.start())).then(() => undefined);
  }

  static staggerAnimations(
    elements: HTMLElement[],
    keyframes: Record<string, (string | number)[]>,
    staggerDelay: number,
    options?: Partial<AnimationOptions>
  ): Promise<void> {
    return new Promise((resolve) => {
      let completed = 0;
      
      elements.forEach((element, index) => {
        setTimeout(() => {
          const animation = new Animation2(element, {
            duration: options?.duration || 300,
            easing: options?.easing || 'ease-out',
            onComplete: () => {
              completed++;
              if (completed === elements.length) {
                resolve();
              }
            },
          });
          
          animation.animate(keyframes);
        }, index * staggerDelay);
      });
    });
  }
}

export class Animation {
  private element: HTMLElement;
  private keyframes: Record<string, (string | number)[]>;
  private options: AnimationOptions;
  private startTime: number | null = null;
  private currentIteration = 0;
  private animationFrame: number | null = null;
  private isPlaying = false;
  private pausedProgress = 0;

  constructor(element: HTMLElement, options: Partial<AnimationOptions> = {}) {
    this.element = element;
    this.options = {
      duration: 300,
      easing: 'ease-out',
      delay: 0,
      loop: false,
      direction: 'normal',
      fill: 'none',
      ...options,
    } as AnimationOptions;
    this.keyframes = {};
  }

  animate(keyframes: Record<string, (string | number)[]>): this {
    this.keyframes = keyframes;
    return this;
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.isPlaying = true;
      this.startTime = null;
      
      const easingFn = typeof this.options.easing === 'function'
        ? this.options.easing
        : AnimationUtils2.getEasingFunction(this.options.easing as EasingType);
      
      this.options.onStart?.();
      
      const animate = (timestamp: number) => {
        if (!this.isPlaying) return;
        
        if (this.startTime === null) {
          this.startTime = timestamp;
        }
        
        let elapsed = timestamp - this.startTime - this.options.delay!;
        
        if (elapsed < 0) {
          this.animationFrame = requestAnimationFrame(animate);
          return;
        }
        
        let progress = Math.min(elapsed / this.options.duration!, 1);
        progress = easingFn(progress);
        
        this.applyKeyframes(progress);
        this.options.onUpdate?.(progress, progress);
        
        if (elapsed >= this.options.duration!) {
          this.currentIteration++;
          this.options.onIteration?.(this.currentIteration);
          
          const loopCount = typeof this.options.loop === 'number'
            ? this.options.loop
            : this.options.loop ? Infinity : 1;
          
          if (this.currentIteration < loopCount) {
            this.startTime = null;
            this.animationFrame = requestAnimationFrame(animate);
          } else {
            this.finish();
            resolve();
          }
        } else {
          this.animationFrame = requestAnimationFrame(animate);
        }
      };
      
      this.animationFrame = requestAnimationFrame(animate);
    });
  }

  pause(): void {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  resume(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.animationFrame = requestAnimationFrame(() => {});
    }
  }

  stop(): void {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.startTime = null;
    this.currentIteration = 0;
  }

  private applyKeyframes(progress: number): void {
    Object.entries(this.keyframes).forEach(([property, values]) => {
      const index = Math.floor(progress * (values.length - 1));
      const nextIndex = Math.min(index + 1, values.length - 1);
      const localProgress = (progress * (values.length - 1)) % 1;
      
      const fromValue = values[index];
      const toValue = values[nextIndex];
      
      if (typeof fromValue === 'number' && typeof toValue === 'number') {
        const value = AnimationUtils2.lerp(fromValue, toValue, localProgress);
        this.setStyle(property, value);
      } else {
        this.setStyle(property, localProgress < 0.5 ? fromValue : toValue);
      }
    });
  }

  private setStyle(property: string, value: string | number): void {
    const style = this.element.style;
    
    switch (property) {
      case 'opacity':
        style.opacity = String(value);
        break;
      case 'transform':
        style.transform = String(value);
        break;
      case 'translateX':
      case 'translateY':
      case 'translateZ':
        const currentTransform = style.transform || '';
        const axis = property.replace('translate', '').toLowerCase();
        if (axis === 'x') {
          style.transform = `translate3d(${value}px, 0, 0)`;
        } else if (axis === 'y') {
          style.transform = `translate3d(0, ${value}px, 0)`;
        } else {
          style.transform = `translate3d(0, 0, ${value}px)`;
        }
        break;
      case 'scaleX':
      case 'scaleY':
      case 'scaleZ':
        const scaleAxis = property.replace('scale', '').toLowerCase();
        if (scaleAxis === 'x') {
          style.transform = `scale3d(${value}, 1, 1)`;
        } else if (scaleAxis === 'y') {
          style.transform = `scale3d(1, ${value}, 1)`;
        } else {
          style.transform = `scale3d(1, 1, ${value})`;
        }
        break;
      case 'rotate':
        style.transform = `rotate(${value}deg)`;
        break;
      case 'width':
        style.width = `${value}px`;
        break;
      case 'height':
        style.height = `${value}px`;
        break;
      default:
        (style as unknown as Record<string, string | number>)[property] = String(value);
    }
  }

  private finish(): void {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.options.onComplete?.();
  }
}

export class Animation2 {
  private element: HTMLElement;
  private keyframes: Record<string, (string | number)[]>;
  private options: AnimationOptions;
  private startTime: number | null = null;
  private currentIteration = 0;
  private animationFrame: number | null = null;
  private isPlaying = false;
  private resolve: (() => void) | null = null;

  constructor(element: HTMLElement, options: Partial<AnimationOptions> = {}) {
    this.element = element;
    this.options = {
      duration: 300,
      easing: 'ease-out',
      delay: 0,
      loop: false,
      direction: 'normal',
      fill: 'none',
      ...options,
    } as AnimationOptions;
    this.keyframes = {};
  }

  animate(keyframes: Record<string, (string | number)[]>): Promise<void> {
    this.keyframes = keyframes;
    return this.start();
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.isPlaying = true;
      this.startTime = null;
      
      const easingFn = typeof this.options.easing === 'function'
        ? this.options.easing
        : AnimationUtils2.getEasingFunction(this.options.easing as EasingType);
      
      this.options.onStart?.();
      
      const animate = (timestamp: number) => {
        if (!this.isPlaying) return;
        
        if (this.startTime === null) {
          this.startTime = timestamp;
        }
        
        let elapsed = timestamp - this.startTime - this.options.delay!;
        
        if (elapsed < 0) {
          this.animationFrame = requestAnimationFrame(animate);
          return;
        }
        
        let progress = Math.min(elapsed / this.options.duration!, 1);
        progress = easingFn(progress);
        
        this.applyKeyframes(progress);
        this.options.onUpdate?.(progress, progress);
        
        if (elapsed >= this.options.duration!) {
          this.currentIteration++;
          this.options.onIteration?.(this.currentIteration);
          
          const loopCount = typeof this.options.loop === 'number'
            ? this.options.loop
            : this.options.loop ? Infinity : 1;
          
          if (this.currentIteration < loopCount) {
            this.startTime = null;
            this.animationFrame = requestAnimationFrame(animate);
          } else {
            this.finish();
            resolve();
          }
        } else {
          this.animationFrame = requestAnimationFrame(animate);
        }
      };
      
      this.animationFrame = requestAnimationFrame(animate);
    });
  }

  pause(): void {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  resume(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.animationFrame = requestAnimationFrame(() => {});
    }
  }

  stop(): void {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.startTime = null;
    this.currentIteration = 0;
  }

  private applyKeyframes(progress: number): void {
    Object.entries(this.keyframes).forEach(([property, values]) => {
      const index = Math.floor(progress * (values.length - 1));
      const nextIndex = Math.min(index + 1, values.length - 1);
      const localProgress = (progress * (values.length - 1)) % 1;
      
      const fromValue = values[index];
      const toValue = values[nextIndex];
      
      if (typeof fromValue === 'number' && typeof toValue === 'number') {
        const value = AnimationUtils2.lerp(fromValue, toValue, localProgress);
        this.setStyle(property, value);
      } else {
        this.setStyle(property, localProgress < 0.5 ? fromValue : toValue);
      }
    });
  }

  private setStyle(property: string, value: string | number): void {
    const style = this.element.style;
    
    switch (property) {
      case 'opacity':
        style.opacity = String(value);
        break;
      case 'transform':
        style.transform = String(value);
        break;
      default:
        (style as unknown as Record<string, string | number>)[property] = String(value);
    }
  }

  private finish(): void {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.options.onComplete?.();
  }
}

export class TransitionManager {
  private transitions: Map<string, TransitionConfig[]> = new Map();
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  add(property: string, duration: number, easing?: EasingType | ((t: number) => number), delay = 0): this {
    const config: TransitionConfig = { property, duration, easing, delay };
    
    const existing = this.transitions.get(property) || [];
    existing.push(config);
    this.transitions.set(property, existing);
    
    return this;
  }

  play(): void {
    const properties: string[] = [];
    let totalDuration = 0;
    
    this.transitions.forEach((configs, property) => {
      configs.forEach((config) => {
        const delay = config.delay || 0;
        const endTime = delay + config.duration;
        totalDuration = Math.max(totalDuration, endTime);
      });
      properties.push(property);
    });
    
    this.element.style.transitionProperty = properties.join(', ');
    this.element.style.transitionDuration = `${totalDuration}ms`;
  }

  clear(): void {
    this.transitions.clear();
    this.element.style.transition = '';
  }
}

export default AnimationUtils2;
