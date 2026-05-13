export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface Response<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export class NetworkUtils {
  static async request<T = unknown>(
    url: string,
    options: RequestOptions = {}
  ): Promise<Response<T>> {
    const {
      timeout = 30000,
      retries = 0,
      retryDelay = 1000,
      headers = {},
      ...fetchOptions
    } = options;

    let lastError: Error | null = null;
    let attempts = 0;

    while (attempts <= retries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        let data: T;
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else if (contentType.includes('text/')) {
          data = await response.text() as unknown as T;
        } else {
          data = await response.blob() as unknown as T;
        }

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        };
      } catch (error) {
        lastError = error as Error;
        attempts++;

        if (attempts <= retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  static async get<T = unknown>(
    url: string,
    options?: RequestOptions
  ): Promise<Response<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  static async post<T = unknown>(
    url: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<Response<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async put<T = unknown>(
    url: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<Response<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async patch<T = unknown>(
    url: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<Response<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async delete<T = unknown>(
    url: string,
    options?: RequestOptions
  ): Promise<Response<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  static async head(
    url: string,
    options?: RequestOptions
  ): Promise<Response<void>> {
    const response = await this.request<void>(url, { ...options, method: 'HEAD' });
    return response;
  }

  static async options(
    url: string,
    options?: RequestOptions
  ): Promise<Response<void>> {
    return this.request<void>(url, { ...options, method: 'OPTIONS' });
  }

  static async downloadFile(
    url: string,
    filename: string,
    options: RequestOptions = {}
  ): Promise<void> {
    const response = await fetch(url, {
      method: 'GET',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(blobUrl);
  }

  static async uploadFile(
    url: string,
    file: File,
    options: {
      onProgress?: (progress: number) => void;
      additionalFields?: Record<string, string>;
    } = {}
  ): Promise<Response> {
    const formData = new FormData();

    if (options.additionalFields) {
      Object.entries(options.additionalFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (options.onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            options.onProgress!((e.loaded / e.total) * 100);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText || '{}');
            resolve({
              data,
              status: xhr.status,
              statusText: xhr.statusText,
              headers: {},
            });
          } catch {
            resolve({
              data: xhr.responseText,
              status: xhr.status,
              statusText: xhr.statusText,
              headers: {},
            });
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));

      xhr.open('POST', url);
      xhr.timeout = 60000;
      xhr.send(formData);
    });
  }

  static parseQueryString(query: string): Record<string, string> {
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(query);

    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return params;
  }

  static buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });

    return searchParams.toString();
  }

  static buildUrl(baseUrl: string, params: Record<string, unknown>): string {
    const queryString = this.buildQueryString(params);
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  static isOnline(): boolean {
    return navigator.onLine;
  }

  static isOffline(): boolean {
    return !navigator.onLine;
  }

  static getConnectionType(): string {
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  static isSlowConnection(): boolean {
    const type = this.getConnectionType();
    return type === '2g' || type === 'slow-2g';
  }

  static onOnline(callback: () => void): () => void {
    window.addEventListener('online', callback);
    return () => window.removeEventListener('online', callback);
  }

  static onOffline(callback: () => void): () => void {
    window.addEventListener('offline', callback);
    return () => window.removeEventListener('offline', callback);
  }

  static async fetchJson<T = unknown>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  static async fetchText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text();
  }

  static async fetchBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.blob();
  }

  static ping(url: string, timeout: number = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = performance.now();

      fetch(url, { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
          const endTime = performance.now();
          resolve(endTime - startTime < timeout);
        })
        .catch(() => {
          resolve(false);
        });

      setTimeout(() => resolve(false), timeout);
    });
  }

  static getLatency(url: string): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now();

      fetch(url, { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
          const endTime = performance.now();
          resolve(endTime - startTime);
        })
        .catch(() => {
          resolve(-1);
        });

      setTimeout(() => resolve(-1), 10000);
    });
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isSameOrigin(url1: string, url2: string): boolean {
    try {
      const a = new URL(url1);
      const b = new URL(url2);
      return a.origin === b.origin;
    } catch {
      return false;
    }
  }

  static normalizeUrl(url: string, base?: string): string {
    try {
      return new URL(url, base).href;
    } catch {
      return url;
    }
  }

  static extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  static extractProtocol(url: string): string {
    try {
      return new URL(url).protocol.replace(':', '');
    } catch {
      return '';
    }
  }

  static extractPath(url: string): string {
    try {
      return new URL(url).pathname;
    } catch {
      return '';
    }
  }
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private url: string,
    private options: {
      protocols?: string | string[];
      autoReconnect?: boolean;
      maxReconnectAttempts?: number;
      reconnectInterval?: number;
      onOpen?: () => void;
      onMessage?: (data: unknown) => void;
      onError?: (error: Event) => void;
      onClose?: () => void;
    } = {}
  ) {
    this.options.autoReconnect = options.autoReconnect ?? true;
    this.options.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.options.reconnectInterval = options.reconnectInterval ?? 3000;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, this.options.protocols);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.options.onOpen?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.options.onMessage?.(data);
          } catch {
            this.options.onMessage?.(event.data);
          }
        };

        this.ws.onerror = (error) => {
          this.options.onError?.(error);
        };

        this.ws.onclose = () => {
          this.options.onClose?.();
          this.handleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect(): void {
    if (!this.options.autoReconnect) return;
    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts ?? 5)) return;

    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(() => {});
    }, this.options.reconnectInterval);
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
    }
  }

  close(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.options.autoReconnect = false;
    this.ws?.close();
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

export class SSEClient {
  private source: EventSource | null = null;
  private listeners: Map<string, Set<(event: MessageEvent) => void>> = new Map();

  constructor(
    private url: string,
    private options: {
      withCredentials?: boolean;
      onOpen?: () => void;
      onError?: (error: Event) => void;
    } = {}
  ) {}

  connect(): void {
    this.source = new EventSource(this.url, {
      withCredentials: this.options.withCredentials ?? false,
    });

    this.source.onopen = () => {
      this.options.onOpen?.();
    };

    this.source.onerror = (error) => {
      this.options.onError?.(error);
    };
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.source) {
      this.connect();
    }

    const handler = (e: MessageEvent) => {
      try {
        callback(JSON.parse(e.data));
      } catch {
        callback(e.data);
      }
    };

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    this.source?.addEventListener(event, handler);

    return () => {
      this.source?.removeEventListener(event, handler);
      this.listeners.get(event)?.delete(handler);
    };
  }

  close(): void {
    this.source?.close();
    this.source = null;
    this.listeners.clear();
  }
}
