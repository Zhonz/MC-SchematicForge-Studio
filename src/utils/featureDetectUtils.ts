export interface FeatureCheck {
  name: string;
  supported: boolean;
  details?: string;
}

export class FeatureDetectUtils {
  private static cache: Map<string, boolean> = new Map();

  static check(name: string): boolean {
    if (this.cache.has(name)) {
      return this.cache.get(name) as boolean;
    }

    const supported = this.runCheck(name);
    this.cache.set(name, supported);
    return supported;
  }

  private static runCheck(name: string): boolean {
    const checks: Record<string, () => boolean> = {
      webgl: () => {
        try {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch {
          return false;
        }
      },
      webgl2: () => {
        try {
          const canvas = document.createElement('canvas');
          return !!canvas.getContext('webgl2');
        } catch {
          return false;
        }
      },
      webaudio: () => 'AudioContext' in window || 'webkitAudioContext' in window,
      websocket: () => 'WebSocket' in window,
      localStorage: () => {
        try {
          const test = '__test__';
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return true;
        } catch {
          return false;
        }
      },
      sessionStorage: () => {
        try {
          const test = '__test__';
          sessionStorage.setItem(test, test);
          sessionStorage.removeItem(test);
          return true;
        } catch {
          return false;
        }
      },
      indexedDB: () => 'indexedDB' in window,
      webWorkers: () => 'Worker' in window,
      serviceWorkers: () => 'serviceWorker' in navigator,
      geolocation: () => 'geolocation' in navigator,
      notifications: () => 'Notification' in window,
      vibration: () => 'vibrate' in navigator,
      deviceMotion: () => 'DeviceMotionEvent' in window,
      deviceOrientation: () => 'DeviceOrientationEvent' in window,
      fullscreen: () => {
        return !!(
          document.fullscreenEnabled ||
          (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
          (document as unknown as { mozFullScreenEnabled?: boolean }).mozFullScreenEnabled ||
          (document as unknown as { msFullscreenEnabled?: boolean }).msFullscreenEnabled
        );
      },
      clipboard: () => 'clipboard' in navigator,
      clipboardRead: () => 'clipboard' in navigator && 'readText' in navigator.clipboard,
      clipboardWrite: () => 'clipboard' in navigator && 'writeText' in navigator.clipboard,
      touch: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      pointerEvents: () => 'PointerEvent' in window,
      intersectionObserver: () => 'IntersectionObserver' in window,
      mutationObserver: () => 'MutationObserver' in window,
      resizeObserver: () => 'ResizeObserver' in window,
      performanceObserver: () => 'PerformanceObserver' in window,
      crypto: () => 'crypto' in window,
      cryptoRandom: () => 'crypto' in window && 'getRandomValues' in window.crypto,
      fetch: () => 'fetch' in window,
      streams: () => 'ReadableStream' in window,
      formData: () => 'FormData' in window,
      history: () => 'history' in window,
      matchMedia: () => 'matchMedia' in window,
      requestAnimationFrame: () => 'requestAnimationFrame' in window,
      cancelAnimationFrame: () => 'cancelAnimationFrame' in window,
      passiveEvents: () => {
        let supported = false;
        try {
          const opts = Object.defineProperty({}, 'passive', {
            get() { supported = true; return false; }
          });
          document.addEventListener('test', () => {}, opts);
          document.removeEventListener('test', () => {}, opts);
        } catch {
          supported = false;
        }
        return supported;
      },
      asyncIterator: () => Symbol.asyncIterator !== undefined,
      weakMap: () => 'WeakMap' in window,
      weakSet: () => 'WeakSet' in window,
      proxy: () => typeof Proxy !== 'undefined',
      reflect: () => typeof Reflect !== 'undefined',
      map: () => 'Map' in window,
      set: () => 'Set' in window,
      arrayIncludes: () => [].includes !== undefined,
      arrayFind: () => [].find !== undefined,
      arrayFindIndex: () => [].findIndex !== undefined,
      arrayFlat: () => [].flat !== undefined,
      arrayFlatMap: () => typeof Array.prototype.flatMap === 'function',
      objectFromEntries: () => Object.fromEntries !== undefined,
      objectEntries: () => Object.entries !== undefined,
      objectValues: () => Object.values !== undefined,
      stringIncludes: () => ''.includes !== undefined,
      stringRepeat: () => ''.repeat !== undefined,
      stringStartsWith: () => ''.startsWith !== undefined,
      stringEndsWith: () => ''.endsWith !== undefined,
      promiseFinally: () => Promise.prototype.finally !== undefined,
      urlSearchParams: () => 'URLSearchParams' in window,
      customElements: () => 'customElements' in window,
      shadowDom: () => 'ShadowRoot' in window,
      template: () => 'content' in document.createElement('template')
    };

    return checks[name]?.() ?? false;
  }

  static checkAll(): FeatureCheck[] {
    const features: FeatureCheck[] = [
      { name: 'WebGL', supported: this.check('webgl') },
      { name: 'WebGL 2', supported: this.check('webgl2') },
      { name: 'Web Audio', supported: this.check('webaudio') },
      { name: 'WebSocket', supported: this.check('websocket') },
      { name: 'LocalStorage', supported: this.check('localStorage') },
      { name: 'SessionStorage', supported: this.check('sessionStorage') },
      { name: 'IndexedDB', supported: this.check('indexedDB') },
      { name: 'Web Workers', supported: this.check('webWorkers') },
      { name: 'Service Workers', supported: this.check('serviceWorkers') },
      { name: 'Geolocation', supported: this.check('geolocation') },
      { name: 'Notifications', supported: this.check('notifications') },
      { name: 'Fullscreen', supported: this.check('fullscreen') },
      { name: 'Clipboard', supported: this.check('clipboard') },
      { name: 'Touch Events', supported: this.check('touch') },
      { name: 'Pointer Events', supported: this.check('pointerEvents') },
      { name: 'IntersectionObserver', supported: this.check('intersectionObserver') },
      { name: 'MutationObserver', supported: this.check('mutationObserver') },
      { name: 'ResizeObserver', supported: this.check('resizeObserver') },
      { name: 'Fetch API', supported: this.check('fetch') },
      { name: 'Streams', supported: this.check('streams') },
      { name: 'Crypto', supported: this.check('crypto') },
      { name: 'Custom Elements', supported: this.check('customElements') },
      { name: 'Shadow DOM', supported: this.check('shadowDom') }
    ];

    return features;
  }

  static getUnsupportedFeatures(): string[] {
    return this.checkAll()
      .filter(f => !f.supported)
      .map(f => f.name);
  }

  static require(feature: string, message?: string): void {
    if (!this.check(feature)) {
      throw new Error(message || `Required feature "${feature}" is not supported`);
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

export class BrowserDetect {
  static isChrome(): boolean {
    return /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
  }

  static isFirefox(): boolean {
    return /Firefox/.test(navigator.userAgent);
  }

  static isSafari(): boolean {
    return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  }

  static isEdge(): boolean {
    return /Edg/.test(navigator.userAgent);
  }

  static isIE(): boolean {
    return /MSIE|Trident/.test(navigator.userAgent);
  }

  static isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static isIOS(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  static isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent);
  }
}

export default FeatureDetectUtils;
