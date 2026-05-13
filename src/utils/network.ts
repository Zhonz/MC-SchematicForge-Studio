export interface WebSocketOptions {
  url: string
  protocols?: string | string[]
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeat?: boolean
  heartbeatInterval?: number
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  onMessage?: (data: unknown) => void
  onReconnecting?: (attempt: number) => void
  onReconnected?: () => void
}

export class WebSocketClient {
  private socket: WebSocket | null = null
  private options: Omit<Required<WebSocketOptions>, 'protocols'> & { protocols?: string | string[] }
  private reconnectAttempts: number = 0
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private lastPongTime: number = 0
  private destroyed: boolean = false
  private messageQueue: unknown[] = []

  constructor(options: WebSocketOptions) {
    this.options = {
      url: options.url,
      protocols: options.protocols,
      reconnect: options.reconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      heartbeat: options.heartbeat ?? false,
      heartbeatInterval: options.heartbeatInterval ?? 30000,
      onOpen: options.onOpen ?? (() => {}),
      onClose: options.onClose ?? (() => {}),
      onError: options.onError ?? (() => {}),
      onMessage: options.onMessage ?? (() => {}),
      onReconnecting: options.onReconnecting ?? (() => {}),
      onReconnected: options.onReconnected ?? (() => {})
    }

    this.connect()
  }

  private connect(): void {
    if (this.destroyed) return

    try {
      this.socket = this.options.protocols
        ? new WebSocket(this.options.url, this.options.protocols)
        : new WebSocket(this.options.url)

      this.socket.onopen = this.handleOpen.bind(this)
      this.socket.onclose = this.handleClose.bind(this)
      this.socket.onerror = this.handleError.bind(this)
      this.socket.onmessage = this.handleMessage.bind(this)
    } catch (error) {
      console.error('WebSocket connection error:', error)
    }
  }

  private handleOpen(event: Event): void {
    this.reconnectAttempts = 0

    this.flushMessageQueue()

    if (this.options.heartbeat) {
      this.startHeartbeat()
    }

    this.options.onOpen(event)
  }

  private handleClose(event: CloseEvent): void {
    this.stopHeartbeat()
    this.options.onClose(event)

    if (!this.destroyed && this.options.reconnect) {
      this.attemptReconnect()
    }
  }

  private handleError(event: Event): void {
    this.options.onError(event)
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string)

      if (data.type === 'pong' && this.options.heartbeat) {
        this.lastPongTime = Date.now()
        return
      }

      this.options.onMessage(data)
    } catch {
      this.options.onMessage(event.data)
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    this.options.onReconnecting(this.reconnectAttempts)

    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, this.options.reconnectInterval)
  }

  private startHeartbeat(): void {
    this.lastPongTime = Date.now()

    this.heartbeatInterval = setInterval(() => {
      if (Date.now() - this.lastPongTime > this.options.heartbeatInterval * 2) {
        console.warn('WebSocket heartbeat timeout, reconnecting...')
        this.socket?.close()
        return
      }

      this.send({ type: 'ping' })
    }, this.options.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      this.send(message)
    }
  }

  send(data: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    } else {
      this.messageQueue.push(data)
    }
  }

  close(code = 1000, reason = ''): void {
    this.destroyed = true

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    this.stopHeartbeat()

    if (this.socket) {
      this.socket.close(code, reason)
      this.socket = null
    }
  }

  getReadyState(): number {
    return this.socket?.readyState ?? WebSocket.CLOSED
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts
  }
}

export interface FetchOptions extends RequestInit {
  baseURL?: string
  timeout?: number
  retries?: number
  retryDelay?: number
  headers?: Record<string, string>
}

export class HTTPClient {
  private baseURL: string
  private defaultOptions: Omit<FetchOptions, 'baseURL'>

  constructor(baseURL = '', defaultOptions: FetchOptions = {}) {
    this.baseURL = baseURL
    const { baseURL: _, ...rest } = defaultOptions
    this.defaultOptions = rest
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async retry<T>(fn: () => Promise<T>, retries: number, delay: number): Promise<T> {
    let lastError: Error | undefined

    for (let i = 0; i <= retries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
        }
      }
    }

    throw lastError
  }

  async request<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const url = this.baseURL + endpoint
    const { baseURL: _, timeout = 30000, retries = 0, retryDelay = 1000, ...fetchOptions } = { ...this.defaultOptions, ...options }

    const mergedOptions: RequestInit = {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultOptions.headers,
        ...fetchOptions.headers
      }
    }

    const makeRequest = async (): Promise<Response> => {
      if (timeout > 0) {
        return this.fetchWithTimeout(url, mergedOptions, timeout)
      }
      return fetch(url, mergedOptions)
    }

    const response = retries > 0
      ? await this.retry(makeRequest, retries, retryDelay)
      : await makeRequest()

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      ;(error as Error & { response: Response }).response = response
      throw error
    }

    const text = await response.text()
    return text ? JSON.parse(text) : null as T
  }

  async get<T = unknown>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = unknown>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T = unknown>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async patch<T = unknown>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T = unknown>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}
