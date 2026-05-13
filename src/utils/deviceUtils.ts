export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;
  isBot: boolean;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  language: string;
  timezone: string;
}

export class DeviceUtils {
  private static deviceInfo: DeviceInfo | null = null;

  static getDeviceInfo(): DeviceInfo {
    if (this.deviceInfo) return this.deviceInfo;

    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
    const isDesktop = !isMobile && !isTablet;

    this.deviceInfo = {
      isMobile,
      isTablet,
      isDesktop,
      isIOS: /iPhone|iPad|iPod/i.test(ua),
      isAndroid: /Android/i.test(ua),
      isWindows: /Win/i.test(ua),
      isMac: /Mac/i.test(ua),
      isLinux: /Linux/i.test(ua) && !/Android/i.test(ua),
      isBot: /bot|googlebot|crawl|slurp|spider/i.test(ua),
      browser: this.getBrowserName(ua),
      browserVersion: this.getBrowserVersion(ua),
      os: this.getOSName(ua),
      osVersion: this.getOSVersion(ua),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      language: navigator.language || 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    return this.deviceInfo;
  }

  private static getBrowserName(ua: string): string {
    if (/Opera|OPR/i.test(ua)) return 'Opera';
    if (/Edg/i.test(ua)) return 'Edge';
    if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome';
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/MSIE|Trident/i.test(ua)) return 'Internet Explorer';
    if (/Gecko/i.test(ua)) return 'Mozilla';
    return 'Unknown';
  }

  private static getBrowserVersion(ua: string): string {
    const browsers = [
      { name: 'Opera|OPR', version: /(?:Opera|OPR)[\/ ]?([0-9.]+)/ },
      { name: 'Edge', version: /Edg(?:e|\/)?([0-9.]+)/ },
      { name: 'Chrome', version: /(?:Chrome|Chromium)[/ ]?([0-9.]+)/ },
      { name: 'Safari', version: /Version\/([0-9.]+)/ },
      { name: 'Firefox', version: /Firefox\/([0-9.]+)/ },
      { name: 'IE', version: /(?:MSIE |rv:)([0-9.]+)/ },
      { name: 'Gecko', version: /rv:([0-9.]+)/ }
    ];

    for (const browser of browsers) {
      const match = ua.match(new RegExp(browser.name, 'i'));
      if (match) {
        return match[1] || 'Unknown';
      }
    }

    return 'Unknown';
  }

  private static getOSName(ua: string): string {
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/Win/i.test(ua)) return 'Windows';
    if (/Mac/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    if (/CrOS/i.test(ua)) return 'Chrome OS';
    return 'Unknown';
  }

  private static getOSVersion(ua: string): string {
    const osVersions: Record<string, RegExp> = {
      iOS: /OS ([0-9_]+)/,
      Android: /Android ([0-9.]+)/,
      Windows: /Windows NT ([0-9.]+)/,
      macOS: /Mac OS X ([0-9_]+)/
    };

    for (const [os, regex] of Object.entries(osVersions)) {
      const match = ua.match(regex);
      if (match) {
        if (os === 'Windows') {
          const ntVersion = match[1];
          const windowsVersions: Record<string, string> = {
            '10.0': '10',
            '6.3': '8.1',
            '6.2': '8',
            '6.1': '7',
            '6.0': 'Vista',
            '5.1': 'XP'
          };
          return windowsVersions[ntVersion] || ntVersion;
        }
        return match[1].replace(/_/g, '.');
      }
    }

    return 'Unknown';
  }

  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  static supportsWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  static supportsWebRTC(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  static supportsWebSocket(): boolean {
    return 'WebSocket' in window;
  }

  static supportsLocalStorage(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  static supportsSessionStorage(): boolean {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  static supportsGeolocation(): boolean {
    return 'geolocation' in navigator;
  }

  static supportsNotifications(): boolean {
    return 'Notification' in window;
  }

  static supportsIntersectionObserver(): boolean {
    return 'IntersectionObserver' in window;
  }

  static supportsResizeObserver(): boolean {
    return 'ResizeObserver' in window;
  }

  static supportsMutationObserver(): boolean {
    return 'MutationObserver' in window;
  }

  static supportsClipboard(): boolean {
    return !!navigator.clipboard;
  }

  static supportsShare(): boolean {
    return 'share' in navigator;
  }

  static isOnline(): boolean {
    return navigator.onLine;
  }

  static getConnectionType(): string {
    const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
    return connection?.effectiveType || 'unknown';
  }

  static isLowPowerMode(): boolean {
    if ('getBattery' in navigator) {
      return false;
    }
    return false;
  }

  static getBatteryLevel(): Promise<number> {
    return new Promise((resolve) => {
      if ('getBattery' in navigator) {
        (navigator as unknown as { getBattery: () => Promise<{ level: number }> })
          .getBattery()
          .then(battery => resolve(battery.level))
          .catch(() => resolve(-1));
      } else {
        resolve(-1);
      }
    });
  }

  static isFullscreen(): boolean {
    return !!(document.fullscreenElement || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement);
  }

  static async enterFullscreen(element?: HTMLElement): Promise<boolean> {
    try {
      const target = element || document.documentElement;
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if ((target as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (target as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      }
      return true;
    } catch {
      return false;
    }
  }

  static async exitFullscreen(): Promise<boolean> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
        await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
      }
      return true;
    } catch {
      return false;
    }
  }

  static getViewportSize(): { width: number; height: number } {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  }

  static getAspectRatio(): number {
    const { width, height } = this.getViewportSize();
    return width / height;
  }

  static isLandscape(): boolean {
    return this.getAspectRatio() > 1;
  }

  static isPortrait(): boolean {
    return this.getAspectRatio() < 1;
  }

  static getPixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  static getOrientation(): 'landscape' | 'portrait' | 'square' {
    const ratio = this.getAspectRatio();
    if (ratio > 1.2) return 'landscape';
    if (ratio < 0.8) return 'portrait';
    return 'square';
  }
}

export class NetworkUtils {
  static async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  static getEffectiveType(): '4g' | '3g' | '2g' | 'slow-2g' | 'unknown' {
    const connection = (navigator as unknown as { 
      connection?: { effectiveType?: string } 
    }).connection;
    return (connection?.effectiveType as '4g' | '3g' | '2g' | 'slow-2g') || 'unknown';
  }

  static getDownlink(): number {
    const connection = (navigator as unknown as { 
      connection?: { downlink?: number } 
    }).connection;
    return connection?.downlink || 0;
  }

  static getRTT(): number {
    const connection = (navigator as unknown as { 
      connection?: { rtt?: number } 
    }).connection;
    return connection?.rtt || 0;
  }

  static isSaveDataEnabled(): boolean {
    const connection = (navigator as unknown as { 
      connection?: { saveData?: boolean } 
    }).connection;
    return connection?.saveData || false;
  }
}

export default DeviceUtils;
