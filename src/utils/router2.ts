export interface RouteDefinition {
  path: string
  component?: unknown
  children?: RouteDefinition[]
  guards?: Guard[]
  meta?: Record<string, unknown>
  name?: string
}

export interface Guard {
  canActivate?: () => boolean | Promise<boolean>
  canDeactivate?: () => boolean | Promise<boolean>
}

export interface NavigationOptions {
  replace?: boolean
  state?: Record<string, unknown>
}

export interface ParsedRoute {
  path: string
  params: Record<string, string>
  query: Record<string, string>
  hash: string
}

export type RouteChangeListener = (route: ParsedRoute, previousRoute?: ParsedRoute) => void

export class Router {
  private static instance: Router
  private routes: Map<string, RouteDefinition> = new Map()
  private currentRoute: ParsedRoute | null = null
  private listeners: Set<RouteChangeListener> = new Set()
  private basePath: string

  private constructor(basePath: string = '') {
    this.basePath = basePath
    this.init()
  }

  static getInstance(basePath?: string): Router {
    if (!Router.instance) {
      Router.instance = new Router(basePath)
    }
    return Router.instance
  }

  private init(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('popstate', () => {
      const newRoute = this.parse(window.location.pathname + window.location.search + window.location.hash)
      const prev = this.currentRoute || undefined
      this.currentRoute = newRoute
      this.notifyListeners(newRoute, prev)
    })
  }

  addRoute(path: string, definition: RouteDefinition): void {
    this.routes.set(path, { ...definition, path })
  }

  removeRoute(path: string): void {
    this.routes.delete(path)
  }

  getRoute(path: string): RouteDefinition | undefined {
    return this.routes.get(path)
  }

  getAllRoutes(): RouteDefinition[] {
    return Array.from(this.routes.values())
  }

  navigate(path: string, options: NavigationOptions = {}): void {
    if (typeof window === 'undefined') return

    const fullPath = this.basePath + path

    if (options.replace) {
      window.history.replaceState(options.state || {}, '', fullPath)
    } else {
      window.history.pushState(options.state || {}, '', fullPath)
    }

    const newRoute = this.parse(fullPath)
    const prev = this.currentRoute || undefined
    this.currentRoute = newRoute
    this.notifyListeners(newRoute, prev)
  }

  back(): void {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  forward(): void {
    if (typeof window !== 'undefined') {
      window.history.forward()
    }
  }

  go(delta: number): void {
    if (typeof window !== 'undefined') {
      window.history.go(delta)
    }
  }

  parse(path: string): ParsedRoute {
    const [pathOnly, queryAndHash] = path.split('?')
    const [pathPart, hashPart] = pathOnly.split('#')
    
    let query: Record<string, string> = {}
    if (queryAndHash) {
      const [queryStr, hash] = queryAndHash.split('#')
      query = this.parseQuery(queryStr)
      return {
        path: this.removeBase(pathPart || '/'),
        params: {},
        query,
        hash: hash || ''
      }
    }

    return {
      path: this.removeBase(pathPart || '/'),
      params: {},
      query,
      hash: hashPart || ''
    }
  }

  match(path: string): RouteDefinition | null {
    for (const [routePath, route] of this.routes) {
      const match = this.matchPath(routePath, path)
      if (match) {
        return route
      }
    }
    return null
  }

  private matchPath(routePath: string, path: string): boolean | Record<string, string> {
    const routeParts = routePath.split('/').filter(Boolean)
    const pathParts = path.split('/').filter(Boolean)

    if (routeParts.length !== pathParts.length) {
      return false
    }

    const params: Record<string, string> = {}

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i]
      const pathPart = pathParts[i]

      if (routePart.startsWith(':')) {
        params[routePart.slice(1)] = pathPart
      } else if (routePart !== pathPart) {
        return false
      }
    }

    return params
  }

  private parseQuery(query: string): Record<string, string> {
    const result: Record<string, string> = {}
    if (!query) return result

    const pairs = query.split('&')
    for (const pair of pairs) {
      const [key, value] = pair.split('=')
      result[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }

    return result
  }

  private removeBase(path: string): string {
    if (!this.basePath) return path
    return path.replace(new RegExp(`^${this.basePath}`), '') || '/'
  }

  getCurrentRoute(): ParsedRoute | null {
    if (this.currentRoute) return this.currentRoute

    if (typeof window !== 'undefined') {
      return this.parse(window.location.pathname + window.location.search + window.location.hash)
    }

    return null
  }

  subscribe(listener: RouteChangeListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(route: ParsedRoute, previousRoute?: ParsedRoute): void {
    this.listeners.forEach(listener => listener(route, previousRoute))
  }

  generatePath(name: string, params: Record<string, string> = {}): string {
    const route = Array.from(this.routes.values()).find(r => r.name === name)
    if (!route) return '/'

    let path = route.path
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, value)
    }

    return path
  }
}

export const router = Router.getInstance()

export function navigate(path: string, options?: NavigationOptions): void {
  router.navigate(path, options)
}

export function useRouter(): Router {
  return router
}
