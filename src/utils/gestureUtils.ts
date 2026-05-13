export type GestureType = 
  | 'tap'
  | 'doubleTap'
  | 'longPress'
  | 'swipe'
  | 'swipeLeft'
  | 'swipeRight'
  | 'swipeUp'
  | 'swipeDown'
  | 'pan'
  | 'pinch'
  | 'rotate'
  | 'drag';

export interface GestureEvent {
  type: GestureType;
  center: { x: number; y: number };
  delta: { x: number; y: number };
  velocity: { x: number; y: number };
  distance: number;
  direction: 'left' | 'right' | 'up' | 'down';
  angle: number;
  duration: number;
  scale?: number;
  rotation?: number;
  touches: number;
  target: HTMLElement;
}

export interface GestureConfig {
  enabled?: boolean;
  touchAction?: 'auto' | 'none';
  preventDefault?: boolean;
  stopPropagation?: boolean;
  threshold?: {
    tap?: number;
    swipe?: number;
    longPress?: number;
    pinch?: number;
    rotate?: number;
  };
  timing?: {
    doubleTap?: number;
    longPress?: number;
    swipeVelocity?: number;
  };
}

export interface GestureHandler {
  onStart?: (e: GestureEvent) => void;
  onMove?: (e: GestureEvent) => void;
  onEnd?: (e: GestureEvent) => void;
  onTap?: (e: GestureEvent) => void;
  onDoubleTap?: (e: GestureEvent) => void;
  onLongPress?: (e: GestureEvent) => void;
  onSwipe?: (e: GestureEvent) => void;
  onSwipeLeft?: (e: GestureEvent) => void;
  onSwipeRight?: (e: GestureEvent) => void;
  onSwipeUp?: (e: GestureEvent) => void;
  onSwipeDown?: (e: GestureEvent) => void;
  onPan?: (e: GestureEvent) => void;
  onPinch?: (e: GestureEvent) => void;
  onRotate?: (e: GestureEvent) => void;
  onDrag?: (e: GestureEvent) => void;
}

export class GestureUtils {
  private static instance: GestureUtils;
  private handlers: Map<HTMLElement, GestureHandler> = new Map();
  private configs: Map<HTMLElement, GestureConfig> = new Map();

  static getInstance(): GestureUtils {
    if (!GestureUtils.instance) {
      GestureUtils.instance = new GestureUtils();
    }
    return GestureUtils.instance;
  }

  static create(
    element: HTMLElement,
    handler: GestureHandler,
    config?: GestureConfig
  ): () => void {
    const instance = GestureUtils.getInstance();
    
    const defaultConfig: GestureConfig = {
      enabled: true,
      touchAction: 'none',
      preventDefault: true,
      stopPropagation: true,
      threshold: {
        tap: 10,
        swipe: 50,
        longPress: 500,
        pinch: 0.01,
        rotate: 0.01,
      },
      timing: {
        doubleTap: 300,
        longPress: 500,
        swipeVelocity: 0.5,
      },
    };
    
    const states = new Map<HTMLElement, GestureState>();
    
    instance.configs.set(element, { ...defaultConfig, ...config });
    instance.handlers.set(element, handler);
    
    const state: GestureState = {
      startTime: 0,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      lastTapTime: 0,
      isTap: false,
      isPan: false,
      isSwipe: false,
      isDrag: false,
      isLongPress: false,
      touchCount: 0,
      pinchDistance: 0,
      pinchScale: 1,
      rotation: 0,
      initialDistance: 0,
      initialRotation: 0,
      velocityX: 0,
      velocityY: 0,
    };
    
    states.set(element, state);
    
    element.style.touchAction = instance.configs.get(element)?.touchAction || 'none';
    
    const onTouchStart = (e: TouchEvent) => {
      const cfg = instance.configs.get(element);
      if (!cfg?.enabled) return;
      
      if (cfg.preventDefault) {
        e.preventDefault();
      }
      if (cfg.stopPropagation) {
        e.stopPropagation();
      }
      
      const touch = e.touches[0];
      const now = Date.now();
      
      state.startTime = now;
      state.startX = touch.clientX;
      state.startY = touch.clientY;
      state.lastX = touch.clientX;
      state.lastY = touch.clientY;
      state.touchCount = e.touches.length;
      state.isTap = true;
      state.isPan = false;
      state.isSwipe = false;
      state.isLongPress = false;
      state.velocityX = 0;
      state.velocityY = 0;
      
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        state.initialDistance = Math.sqrt(dx * dx + dy * dy);
        state.pinchDistance = state.initialDistance;
        
        state.initialRotation = Math.atan2(dy, dx) * (180 / Math.PI);
        state.rotation = 0;
      }
      
      if (cfg.timing?.longPress) {
        state.longPressTimeout = window.setTimeout(() => {
          if (state.isTap && !state.isSwipe) {
            state.isLongPress = true;
            const gestureEvent = GestureUtils.createGestureEvent('longPress', state, e, element);
            instance.handlers.get(element)?.onLongPress?.(gestureEvent);
          }
        }, cfg.timing.longPress);
      }
      
      const gestureEvent = GestureUtils.createGestureEvent('tap', state, e, element);
      instance.handlers.get(element)?.onStart?.(gestureEvent);
    };
    
    const onTouchMove = (e: TouchEvent) => {
      const cfg = instance.configs.get(element);
      if (!cfg?.enabled) return;
      
      if (cfg.preventDefault) {
        e.preventDefault();
      }
      
      const touch = e.touches[0];
      const dx = touch.clientX - state.startX;
      const dy = touch.clientY - state.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      state.lastX = touch.clientX;
      state.lastY = touch.clientY;
      
      if (state.isLongPress) {
        state.isTap = false;
      }
      
      if (e.touches.length === 2) {
        const currentDx = e.touches[1].clientX - e.touches[0].clientX;
        const currentDy = e.touches[1].clientY - e.touches[0].clientY;
        const currentDistance = Math.sqrt(currentDx * currentDx + currentDy * currentDy);
        
        if (state.initialDistance > 0) {
          state.pinchScale = currentDistance / state.initialDistance;
          state.pinchDistance = currentDistance;
          
          const currentRotation = Math.atan2(currentDy, currentDx) * (180 / Math.PI);
          state.rotation = currentRotation - state.initialRotation;
          
          if (cfg.threshold?.pinch && Math.abs(state.pinchScale - 1) > cfg.threshold.pinch) {
            state.isTap = false;
            const gestureEvent = GestureUtils.createGestureEvent('pinch', state, e, element);
            gestureEvent.scale = state.pinchScale;
            instance.handlers.get(element)?.onPinch?.(gestureEvent);
          }
          
          if (cfg.threshold?.rotate && Math.abs(state.rotation) > cfg.threshold.rotate) {
            state.isTap = false;
            const gestureEvent = GestureUtils.createGestureEvent('rotate', state, e, element);
            gestureEvent.rotation = state.rotation;
            instance.handlers.get(element)?.onRotate?.(gestureEvent);
          }
        }
      }
      
      const threshold = cfg.threshold?.tap || 10;
      if (distance > threshold && state.isTap) {
        state.isTap = false;
        if (state.longPressTimeout) {
          clearTimeout(state.longPressTimeout);
        }
        state.isPan = true;
      }
      
      if (state.isPan && !state.isSwipe) {
        const velocityX = touch.clientX - state.lastX;
        const velocityY = touch.clientY - state.lastY;
        
        state.velocityX = velocityX;
        state.velocityY = velocityY;
        
        const gestureEvent = GestureUtils.createGestureEvent('pan', state, e, element);
        instance.handlers.get(element)?.onMove?.(gestureEvent);
        instance.handlers.get(element)?.onPan?.(gestureEvent);
      }
    };
    
    const onTouchEnd = (e: TouchEvent) => {
      const cfg = instance.configs.get(element);
      if (!cfg?.enabled) return;
      
      if (cfg.preventDefault) {
        e.preventDefault();
      }
      
      if (state.longPressTimeout) {
        clearTimeout(state.longPressTimeout);
      }
      
      const dx = state.lastX - state.startX;
      const dy = state.lastY - state.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = Date.now() - state.startTime;
      const velocity = Math.sqrt(state.velocityX ** 2 + state.velocityY ** 2);
      
      const swipeThreshold = cfg.threshold?.swipe || 50;
      const swipeVelocityThreshold = cfg.timing?.swipeVelocity || 0.5;
      
      if (state.isPan && distance > swipeThreshold) {
        state.isSwipe = true;
        
        let direction: 'left' | 'right' | 'up' | 'down' = 'right';
        let gestureType: GestureType = 'swipe';
        
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            direction = 'right';
            gestureType = 'swipeRight';
          } else {
            direction = 'left';
            gestureType = 'swipeLeft';
          }
        } else {
          if (dy > 0) {
            direction = 'down';
            gestureType = 'swipeDown';
          } else {
            direction = 'up';
            gestureType = 'swipeUp';
          }
        }
        
        const gestureEvent = GestureUtils.createGestureEvent(gestureType, state, e, element);
        gestureEvent.direction = direction;
        gestureEvent.velocity = { x: state.velocityX, y: state.velocityY };
        
        instance.handlers.get(element)?.onSwipe?.(gestureEvent);
        
        switch (gestureType) {
          case 'swipeLeft':
            instance.handlers.get(element)?.onSwipeLeft?.(gestureEvent);
            break;
          case 'swipeRight':
            instance.handlers.get(element)?.onSwipeRight?.(gestureEvent);
            break;
          case 'swipeUp':
            instance.handlers.get(element)?.onSwipeUp?.(gestureEvent);
            break;
          case 'swipeDown':
            instance.handlers.get(element)?.onSwipeDown?.(gestureEvent);
            break;
        }
      }
      
      const doubleTapThreshold = cfg.timing?.doubleTap || 300;
      const isDoubleTap = state.isTap && 
                          !state.isSwipe && 
                          !state.isLongPress &&
                          (Date.now() - state.lastTapTime) < doubleTapThreshold &&
                          distance < (cfg.threshold?.tap || 10);
      
      if (state.isTap && !state.isSwipe && !state.isLongPress) {
        if (isDoubleTap) {
          const gestureEvent = GestureUtils.createGestureEvent('doubleTap', state, e, element);
          instance.handlers.get(element)?.onDoubleTap?.(gestureEvent);
          state.lastTapTime = 0;
        } else {
          const gestureEvent = GestureUtils.createGestureEvent('tap', state, e, element);
          instance.handlers.get(element)?.onTap?.(gestureEvent);
          state.lastTapTime = Date.now();
        }
      }
      
      const gestureEvent = GestureUtils.createGestureEvent('tap', state, e, element);
      instance.handlers.get(element)?.onEnd?.(gestureEvent);
      
      state.startTime = 0;
      state.isTap = false;
      state.isPan = false;
      state.isSwipe = false;
      state.isDrag = false;
      state.isLongPress = false;
      state.pinchScale = 1;
      state.rotation = 0;
      state.initialDistance = 0;
    };
    
    element.addEventListener('touchstart', onTouchStart, { passive: false });
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchend', onTouchEnd, { passive: false });
    element.addEventListener('touchcancel', onTouchEnd, { passive: false });
    
    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', onTouchEnd);
      
      instance.handlers.delete(element);
      instance.configs.delete(element);
      states.delete(element);
    };
  }

  private static createGestureEvent(
    type: GestureType,
    state: GestureState,
    e: TouchEvent,
    element: HTMLElement
  ): GestureEvent {
    const dx = state.lastX - state.startX;
    const dy = state.lastY - state.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    let direction: 'left' | 'right' | 'up' | 'down' = 'right';
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }
    
    return {
      type,
      center: { x: state.lastX, y: state.lastY },
      delta: { x: dx, y: dy },
      velocity: { x: state.velocityX, y: state.velocityY },
      distance,
      direction,
      angle,
      duration: Date.now() - state.startTime,
      scale: state.pinchScale,
      rotation: state.rotation,
      touches: e.touches.length,
      target: element,
    };
  }
}

interface GestureState {
  startTime: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  lastTapTime: number;
  isTap: boolean;
  isPan: boolean;
  isSwipe: boolean;
  isDrag: boolean;
  isLongPress: boolean;
  touchCount: number;
  pinchDistance: number;
  pinchScale: number;
  rotation: number;
  initialDistance: number;
  initialRotation: number;
  velocityX: number;
  velocityY: number;
  longPressTimeout?: ReturnType<typeof setTimeout>;
}

export class SwipeDetector {
  private element: HTMLElement;
  private onSwipe: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void;
  private threshold: number;
  private velocityThreshold: number;
  
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;

  constructor(
    element: HTMLElement,
    onSwipe: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void,
    threshold = 50,
    velocityThreshold = 0.3
  ) {
    this.element = element;
    this.onSwipe = onSwipe;
    this.threshold = threshold;
    this.velocityThreshold = velocityThreshold;
    
    this.bind();
  }

  private bind(): void {
    this.element.addEventListener('touchstart', this.handleStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleMove.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleEnd.bind(this), { passive: true });
  }

  private handleStart(e: TouchEvent): void {
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
  }

  private handleMove(e: TouchEvent): void {
  }

  private handleEnd(e: TouchEvent): void {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.startX;
    const dy = touch.clientY - this.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Date.now() - this.startTime;
    
    if (distance < this.threshold) return;
    
    const velocity = distance / duration;
    if (velocity < this.velocityThreshold) return;
    
    let direction: 'left' | 'right' | 'up' | 'down';
    
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }
    
    this.onSwipe(direction, velocity);
  }

  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleMove.bind(this));
    this.element.removeEventListener('touchend', this.handleEnd.bind(this));
  }
}

export class PinchZoom {
  private element: HTMLElement;
  private onPinch: (scale: number) => void;
  private scale: number = 1;
  private initialDistance: number = 0;
  
  constructor(element: HTMLElement, onPinch: (scale: number) => void) {
    this.element = element;
    this.onPinch = onPinch;
    
    this.bind();
  }

  private bind(): void {
    this.element.addEventListener('touchstart', this.handleStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleMove.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleEnd.bind(this), { passive: true });
  }

  private handleStart(e: TouchEvent): void {
    if (e.touches.length !== 2) return;
    
    const dx = e.touches[1].clientX - e.touches[0].clientX;
    const dy = e.touches[1].clientY - e.touches[0].clientY;
    this.initialDistance = Math.sqrt(dx * dx + dy * dy);
  }

  private handleMove(e: TouchEvent): void {
    if (e.touches.length !== 2) return;
    
    const dx = e.touches[1].clientX - e.touches[0].clientX;
    const dy = e.touches[1].clientY - e.touches[0].clientY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);
    
    this.scale = currentDistance / this.initialDistance;
    this.onPinch(this.scale);
  }

  private handleEnd(e: TouchEvent): void {
    if (e.touches.length < 2) {
      this.scale = 1;
      this.initialDistance = 0;
    }
  }

  getScale(): number {
    return this.scale;
  }

  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleMove.bind(this));
    this.element.removeEventListener('touchend', this.handleEnd.bind(this));
  }
}

export class RotationGesture {
  private element: HTMLElement;
  private onRotate: (rotation: number) => void;
  private rotation: number = 0;
  private initialAngle: number = 0;
  
  constructor(element: HTMLElement, onRotate: (rotation: number) => void) {
    this.element = element;
    this.onRotate = onRotate;
    
    this.bind();
  }

  private bind(): void {
    this.element.addEventListener('touchstart', this.handleStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleMove.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleEnd.bind(this), { passive: true });
  }

  private handleStart(e: TouchEvent): void {
    if (e.touches.length !== 2) return;
    
    const dx = e.touches[1].clientX - e.touches[0].clientX;
    const dy = e.touches[1].clientY - e.touches[0].clientY;
    this.initialAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  }

  private handleMove(e: TouchEvent): void {
    if (e.touches.length !== 2) return;
    
    const dx = e.touches[1].clientX - e.touches[0].clientX;
    const dy = e.touches[1].clientY - e.touches[0].clientY;
    const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    this.rotation = currentAngle - this.initialAngle;
    this.onRotate(this.rotation);
  }

  private handleEnd(e: TouchEvent): void {
    if (e.touches.length < 2) {
      this.rotation = 0;
      this.initialAngle = 0;
    }
  }

  getRotation(): number {
    return this.rotation;
  }

  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleMove.bind(this));
    this.element.removeEventListener('touchend', this.handleEnd.bind(this));
  }
}

export class DragHandler {
  private element: HTMLElement;
  private onDragStart: ((e: DragEvent) => void) | null = null;
  private onDragMove: ((e: DragEvent) => void) | null = null;
  private onDragEnd: ((e: DragEvent) => void) | null = null;
  
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor(element: HTMLElement) {
    this.element = element;
    this.bind();
  }

  private bind(): void {
    this.element.addEventListener('mousedown', this.handleStart.bind(this));
    document.addEventListener('mousemove', this.handleMove.bind(this));
    document.addEventListener('mouseup', this.handleEnd.bind(this));
    
    this.element.addEventListener('touchstart', this.handleStart.bind(this), { passive: true });
    document.addEventListener('touchmove', this.handleMove.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleEnd.bind(this), { passive: true });
  }

  private getPosition(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  }

  private handleStart(e: MouseEvent | TouchEvent): void {
    const pos = this.getPosition(e);
    this.isDragging = true;
    this.startX = pos.x;
    this.startY = pos.y;
    this.offsetX = pos.x - this.element.offsetLeft;
    this.offsetY = pos.y - this.element.offsetTop;
    
    this.onDragStart?.({
      startX: this.startX,
      startY: this.startY,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
    } as unknown as DragEvent);
  }

  private handleMove(e: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    
    const pos = this.getPosition(e);
    const dx = pos.x - this.startX;
    const dy = pos.y - this.startY;
    
    this.onDragMove?.({
      deltaX: dx,
      deltaY: dy,
      x: pos.x,
      y: pos.y,
    } as unknown as DragEvent);
  }

  private handleEnd(e: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    const pos = this.getPosition(e as TouchEvent);
    const dx = pos.x - this.startX;
    const dy = pos.y - this.startY;
    
    this.onDragEnd?.({
      deltaX: dx,
      deltaY: dy,
      x: pos.x,
      y: pos.y,
    } as unknown as DragEvent);
  }

  onStart(callback: (e: DragEvent) => void): this {
    this.onDragStart = callback;
    return this;
  }

  onMove(callback: (e: DragEvent) => void): this {
    this.onDragMove = callback;
    return this;
  }

  onEnd(callback: (e: DragEvent) => void): this {
    this.onDragEnd = callback;
    return this;
  }

  isActive(): boolean {
    return this.isDragging;
  }

  destroy(): void {
    this.element.removeEventListener('mousedown', this.handleStart.bind(this));
    document.removeEventListener('mousemove', this.handleMove.bind(this));
    document.removeEventListener('mouseup', this.handleEnd.bind(this));
    
    this.element.removeEventListener('touchstart', this.handleStart.bind(this));
    document.removeEventListener('touchmove', this.handleMove.bind(this));
    document.removeEventListener('touchend', this.handleEnd.bind(this));
  }
}

export class LongPressDetector {
  private element: HTMLElement;
  private onLongPress: (e: MouseEvent | TouchEvent) => void;
  private duration: number;
  private tolerance: number;
  
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private startX: number = 0;
  private startY: number = 0;

  constructor(
    element: HTMLElement,
    onLongPress: (e: MouseEvent | TouchEvent) => void,
    duration = 500,
    tolerance = 10
  ) {
    this.element = element;
    this.onLongPress = onLongPress;
    this.duration = duration;
    this.tolerance = tolerance;
    
    this.bind();
  }

  private bind(): void {
    this.element.addEventListener('mousedown', this.handleStart.bind(this));
    this.element.addEventListener('touchstart', this.handleStart.bind(this), { passive: true });
    this.element.addEventListener('mouseup', this.handleEnd.bind(this));
    this.element.addEventListener('mouseleave', this.handleEnd.bind(this));
    this.element.addEventListener('touchend', this.handleEnd.bind(this));
    this.element.addEventListener('touchcancel', this.handleEnd.bind(this));
  }

  private getPosition(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  }

  private handleStart(e: MouseEvent | TouchEvent): void {
    const pos = this.getPosition(e);
    this.startX = pos.x;
    this.startY = pos.y;
    
    this.timeoutId = setTimeout(() => {
      this.onLongPress(e);
    }, this.duration);
  }

  private handleMove(e: MouseEvent | TouchEvent): void {
    if (!this.timeoutId) return;
    
    const pos = this.getPosition(e);
    const dx = Math.abs(pos.x - this.startX);
    const dy = Math.abs(pos.y - this.startY);
    
    if (dx > this.tolerance || dy > this.tolerance) {
      this.clear();
    }
  }

  private handleEnd(): void {
    this.clear();
  }

  private clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  destroy(): void {
    this.clear();
    this.element.removeEventListener('mousedown', this.handleStart.bind(this));
    this.element.removeEventListener('touchstart', this.handleStart.bind(this));
    this.element.removeEventListener('mouseup', this.handleEnd.bind(this));
    this.element.removeEventListener('mouseleave', this.handleEnd.bind(this));
    this.element.removeEventListener('touchend', this.handleEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleEnd.bind(this));
  }
}

export class DoubleTapDetector {
  private element: HTMLElement;
  private onDoubleTap: (e: MouseEvent | TouchEvent) => void;
  private delay: number;
  
  private lastTapTime: number = 0;
  private lastTapX: number = 0;
  private lastTapY: number = 0;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    element: HTMLElement,
    onDoubleTap: (e: MouseEvent | TouchEvent) => void,
    delay = 300
  ) {
    this.element = element;
    this.onDoubleTap = onDoubleTap;
    this.delay = delay;
    
    this.bind();
  }

  private bind(): void {
    this.element.addEventListener('click', this.handleTap.bind(this) as EventListener);
    this.element.addEventListener('touchend', this.handleTap.bind(this), { passive: true });
  }

  private getPosition(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('touches' in e) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  }

  private handleTap(e: MouseEvent | TouchEvent): void {
    const now = Date.now();
    const pos = this.getPosition(e);
    
    const isDoubleTap = 
      now - this.lastTapTime < this.delay &&
      Math.abs(pos.x - this.lastTapX) < 30 &&
      Math.abs(pos.y - this.lastTapY) < 30;
    
    if (isDoubleTap) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      this.onDoubleTap(e);
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = now;
      this.lastTapX = pos.x;
      this.lastTapY = pos.y;
      
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
      }, this.delay);
    }
  }

  destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.element.removeEventListener('click', this.handleTap.bind(this) as EventListener);
    this.element.removeEventListener('touchend', this.handleTap.bind(this));
  }
}

export class MultiTouchTracker {
  private touches: Map<number, { x: number; y: number }> = new Map();
  private onUpdate: (touches: Map<number, { x: number; y: number }>) => void;

  constructor(onUpdate: (touches: Map<number, { x: number; y: number }>) => void) {
    this.onUpdate = onUpdate;
    this.bind();
  }

  private bind(): void {
    document.addEventListener('touchstart', this.handleStart.bind(this), { passive: true });
    document.addEventListener('touchmove', this.handleMove.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleEnd.bind(this), { passive: true });
    document.addEventListener('touchcancel', this.handleEnd.bind(this), { passive: true });
  }

  private handleStart(e: TouchEvent): void {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this.touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }
    this.onUpdate(this.touches);
  }

  private handleMove(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this.touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }
    this.onUpdate(this.touches);
  }

  private handleEnd(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this.touches.delete(touch.identifier);
    }
    this.onUpdate(this.touches);
  }

  getTouches(): Map<number, { x: number; y: number }> {
    return new Map(this.touches);
  }

  getCenter(): { x: number; y: number } | null {
    if (this.touches.size === 0) return null;
    
    let sumX = 0;
    let sumY = 0;
    
    this.touches.forEach((touch) => {
      sumX += touch.x;
      sumY += touch.y;
    });
    
    return {
      x: sumX / this.touches.size,
      y: sumY / this.touches.size,
    };
  }

  destroy(): void {
    document.removeEventListener('touchstart', this.handleStart.bind(this));
    document.removeEventListener('touchmove', this.handleMove.bind(this));
    document.removeEventListener('touchend', this.handleEnd.bind(this));
    document.removeEventListener('touchcancel', this.handleEnd.bind(this));
    this.touches.clear();
  }
}

export default GestureUtils;
