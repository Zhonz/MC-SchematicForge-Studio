export type MiddlewareType = 'request' | 'response' | 'error'

export interface MiddlewareContext {
  request?: Request
  response?: Response
  error?: Error
  data?: unknown
  metadata?: Record<string, unknown>
}

export type MiddlewareHandler = (
  context: MiddlewareContext,
  next: () => Promise<MiddlewareContext>
) => Promise<MiddlewareContext>

export interface MiddlewareConfig {
  name: string
  type?: MiddlewareType
  priority?: number
  handler: MiddlewareHandler
  enabled?: boolean
}

export class MiddlewarePipeline {
  private middlewares: MiddlewareConfig[] = []
  private disabledMiddlewares: Set<string> = new Set()

  use(config: MiddlewareConfig): this {
    if (config.priority !== undefined) {
      const index = this.middlewares.findIndex(m => (m.priority || 0) > (config.priority || 0))
      if (index === -1) {
        this.middlewares.push(config)
      } else {
        this.middlewares.splice(index, 0, config)
      }
    } else {
      this.middlewares.push(config)
    }
    return this
  }

  useRequest(handler: MiddlewareHandler, name?: string): this {
    return this.use({ name: name || `request_${Date.now()}`, type: 'request', handler })
  }

  useResponse(handler: MiddlewareHandler, name?: string): this {
    return this.use({ name: name || `response_${Date.now()}`, type: 'response', handler })
  }

  useError(handler: MiddlewareHandler, name?: string): this {
    return this.use({ name: name || `error_${Date.now()}`, type: 'error', handler })
  }

  async execute(context: MiddlewareContext): Promise<MiddlewareContext> {
    const enabledMiddlewares = this.middlewares.filter(
      m => m.enabled !== false && !this.disabledMiddlewares.has(m.name)
    )

    let index = 0

    const next = async (): Promise<MiddlewareContext> => {
      if (index >= enabledMiddlewares.length) {
        return context
      }

      const middleware = enabledMiddlewares[index++]
      return middleware.handler(context, next)
    }

    return next()
  }

  async handleRequest(request: Request): Promise<Response | MiddlewareContext> {
    const context: MiddlewareContext = { request }

    try {
      const result = await this.execute(context)
      if (result.response) {
        return result.response
      }
      return result as MiddlewareContext
    } catch (error) {
      const errorContext: MiddlewareContext = { request, error: error as Error }
      const errorMiddlewares = this.middlewares.filter(m => m.type === 'error')

      for (const middleware of errorMiddlewares) {
        await middleware.handler(errorContext, async () => errorContext)
      }

      throw error
    }
  }

  remove(name: string): boolean {
    const index = this.middlewares.findIndex(m => m.name === name)
    if (index !== -1) {
      this.middlewares.splice(index, 1)
      return true
    }
    return false
  }

  enable(name: string): void {
    this.disabledMiddlewares.delete(name)
    const middleware = this.middlewares.find(m => m.name === name)
    if (middleware) {
      middleware.enabled = true
    }
  }

  disable(name: string): void {
    this.disabledMiddlewares.add(name)
    const middleware = this.middlewares.find(m => m.name === name)
    if (middleware) {
      middleware.enabled = false
    }
  }

  isEnabled(name: string): boolean {
    return !this.disabledMiddlewares.has(name)
  }

  clear(): void {
    this.middlewares = []
    this.disabledMiddlewares.clear()
  }

  getMiddlewares(): MiddlewareConfig[] {
    return [...this.middlewares]
  }

  getMiddleware(name: string): MiddlewareConfig | undefined {
    return this.middlewares.find(m => m.name === name)
  }
}

export function createLoggerMiddleware(name: string): MiddlewareConfig {
  return {
    name,
    type: 'request',
    priority: 0,
    handler: async (context, next) => {
      console.log(`[${name}] Request:`, context.request)
      const result = await next()
      console.log(`[${name}] Response:`, result.response)
      return result
    }
  }
}

export function createErrorHandlerMiddleware(name: string, handler: (error: Error) => void): MiddlewareConfig {
  return {
    name,
    type: 'error',
    priority: 100,
    handler: async (context, next) => {
      try {
        return await next()
      } catch (error) {
        handler(error as Error)
        context.error = error as Error
        return context
      }
    }
  }
}

export function createCacheMiddleware(name: string, cache: Map<string, unknown>): MiddlewareConfig {
  return {
    name,
    type: 'request',
    priority: 50,
    handler: async (context, next) => {
      if (context.request) {
        const cacheKey = context.request.url
        if (cache.has(cacheKey)) {
          console.log(`[${name}] Cache hit for ${cacheKey}`)
          return { ...context, data: cache.get(cacheKey) }
        }

        const result = await next()
        cache.set(cacheKey, result.data)
        return result
      }
      return next()
    }
  }
}
