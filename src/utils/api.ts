export interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
  timeout?: number;
  credentials?: RequestCredentials;
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
  headers: Record<string, string>;
}

export class ApiClient {
  private baseURL = '';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  private interceptors: {
    request: Array<(config: RequestConfig) => RequestConfig>;
    response: Array<(response: ApiResponse) => ApiResponse>;
  } = {
    request: [],
    response: []
  };

  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig): void {
    this.interceptors.request.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: ApiResponse) => ApiResponse): void {
    this.interceptors.response.push(interceptor);
  }

  async request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
    let finalConfig = { ...config };

    for (const interceptor of this.interceptors.request) {
      finalConfig = interceptor(finalConfig);
    }

    const url = this.buildURL(finalConfig.url, finalConfig.params);
    const headers = { ...this.defaultHeaders, ...finalConfig.headers };

    const options: RequestInit = {
      method: finalConfig.method || 'GET',
      headers,
      credentials: finalConfig.credentials || 'same-origin'
    };

    if (options.method !== 'GET' && finalConfig.body) {
      options.body = JSON.stringify(finalConfig.body);
    }

    try {
      const controller = new AbortController();
      const timeoutId = finalConfig.timeout
        ? setTimeout(() => controller.abort(), finalConfig.timeout)
        : null;

      options.signal = controller.signal;

      const response = await fetch(url, options);
      clearTimeout(timeoutId ?? undefined);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data: T | null = null;
      try {
        data = await response.json() as T;
      } catch {
        data = null;
      }

      const result: ApiResponse<T> = {
        data,
        error: response.ok ? null : await response.text(),
        status: response.status,
        headers: responseHeaders
      };

      for (const interceptor of this.interceptors.response) {
        return interceptor(result) as ApiResponse<T>;
      }

      return result;
    } catch (err) {
      const error = err as Error;
      return {
        data: null,
        error: error.message,
        status: 0,
        headers: {}
      };
    }
  }

  private buildURL(url: string, params?: Record<string, string>): string {
    if (!params) return url;
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  get<T = unknown>(url: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ url: this.baseURL + url, method: 'GET', params });
  }

  post<T = unknown>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({ url: this.baseURL + url, method: 'POST', body });
  }

  put<T = unknown>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({ url: this.baseURL + url, method: 'PUT', body });
  }

  delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>({ url: this.baseURL + url, method: 'DELETE' });
  }

  patch<T = unknown>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({ url: this.baseURL + url, method: 'PATCH', body });
  }
}

export class RESTClient extends ApiClient {
  constructor(baseURL?: string) {
    super();
    if (baseURL) {
      this.setBaseURL(baseURL);
    }
  }
}

export function createApiClient(baseURL?: string): ApiClient {
  return new ApiClient();
}

export function parseResponseHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

export function getErrorMessage(response: ApiResponse): string {
  if (response.error) return response.error;
  if (response.status >= 400 && response.status < 500) {
    return `Client error: ${response.status}`;
  }
  if (response.status >= 500) {
    return `Server error: ${response.status}`;
  }
  return 'Unknown error';
}
