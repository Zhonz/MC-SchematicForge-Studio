export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onProgress?: (progress: number) => void;
}

export interface Response<T> {
  data: T | null;
  error: Error | null;
  status: number;
  statusText: string;
  headers: Headers;
}

export class RequestUtils {
  static async get<T>(
    url: string,
    options?: RequestOptions
  ): Promise<Response<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  static async post<T>(
    url: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<Response<T>> {
    const body = data ? JSON.stringify(data) : undefined;
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body
    });
  }

  static async put<T>(
    url: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<Response<T>> {
    const body = data ? JSON.stringify(data) : undefined;
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body
    });
  }

  static async patch<T>(
    url: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<Response<T>> {
    const body = data ? JSON.stringify(data) : undefined;
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body
    });
  }

  static async delete<T>(
    url: string,
    options?: RequestOptions
  ): Promise<Response<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  static async request<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<Response<T>> {
    const {
      timeout = 30000,
      retries = 0,
      retryDelay = 1000,
      onProgress,
      ...fetchOptions
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return {
            data: null,
            error: new Error(`HTTP ${response.status}: ${response.statusText}`),
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          };
        }

        const contentType = response.headers.get('content-type');
        let data: T | null = null;

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else if (contentType?.includes('text/')) {
          data = await response.text() as unknown as T;
        } else {
          data = await response.blob() as unknown as T;
        }

        return {
          data,
          error: null,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    clearTimeout(timeoutId);

    return {
      data: null,
      error: lastError || new Error('Request failed'),
      status: 0,
      statusText: '',
      headers: new Headers()
    };
  }

  static async upload(
    url: string,
    file: File | Blob,
    options?: {
      method?: 'POST' | 'PUT';
      headers?: HeadersInit;
      onProgress?: (progress: number) => void;
    }
  ): Promise<Response<unknown>> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && options?.onProgress) {
          const progress = (event.loaded / event.total) * 100;
          options.onProgress(progress);
        }
      };

      xhr.onload = () => {
        let data: unknown = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = xhr.responseText;
        }

        resolve({
          data,
          error: xhr.status >= 200 && xhr.status < 300 ? null : new Error(xhr.statusText),
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers()
        });
      };

      xhr.onerror = () => {
        resolve({
          data: null,
          error: new Error('Network error'),
          status: 0,
          statusText: '',
          headers: new Headers()
        });
      };

      xhr.open(options?.method || 'POST', url);

      if (options?.headers) {
        Object.entries(options.headers as Record<string, string>).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      xhr.send(file);
    });
  }

  static async download(
    url: string,
    filename?: string,
    options?: {
      onProgress?: (progress: number) => void;
    }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        if (event.lengthComputable && options?.onProgress) {
          const progress = (event.loaded / event.total) * 100;
          options.onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const blob = xhr.response;
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          resolve(true);
        } else {
          resolve(false);
        }
      };

      xhr.onerror = () => resolve(false);

      xhr.open('GET', url);
      xhr.send();
    });
  }
}

export class APIUtils {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string, defaultHeaders: HeadersInit = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<Response<T>> {
    return RequestUtils.get<T>(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: { ...this.defaultHeaders, ...options?.headers }
    });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<Response<T>> {
    return RequestUtils.post<T>(`${this.baseURL}${endpoint}`, data, {
      ...options,
      headers: { ...this.defaultHeaders, ...options?.headers }
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<Response<T>> {
    return RequestUtils.put<T>(`${this.baseURL}${endpoint}`, data, {
      ...options,
      headers: { ...this.defaultHeaders, ...options?.headers }
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<Response<T>> {
    return RequestUtils.patch<T>(`${this.baseURL}${endpoint}`, data, {
      ...options,
      headers: { ...this.defaultHeaders, ...options?.headers }
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<Response<T>> {
    return RequestUtils.delete<T>(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: { ...this.defaultHeaders, ...options?.headers }
    });
  }
}

export class RateLimiter {
  private queue: Array<() => void> = [];
  private isProcessing: boolean = false;
  private requestCount: number = 0;
  private windowStart: number = Date.now();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.processNext();
        }
      });

      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    const now = Date.now();
    if (now - this.windowStart >= this.windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    if (this.requestCount >= this.maxRequests) {
      const waitTime = this.windowMs - (now - this.windowStart);
      setTimeout(() => {
        this.isProcessing = false;
        this.processNext();
      }, waitTime);
      return;
    }

    this.requestCount++;
    const fn = this.queue.shift();
    if (fn) fn();
    this.isProcessing = false;
  }
}

export default RequestUtils;
