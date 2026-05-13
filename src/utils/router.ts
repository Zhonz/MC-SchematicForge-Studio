export interface Route<T = unknown> {
  path: string;
  name?: string;
  component?: T;
  params?: Record<string, string>;
  query?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export class Router {
  private routes: Map<string, Route> = new Map();
  private currentRoute: Route | null = null;
  private listeners: Array<(route: Route | null) => void> = [];
  private notFoundHandler?: () => void;

  addRoute(path: string, route: Omit<Route, 'path'>): void {
    this.routes.set(path, { path, ...route });
  }

  navigate(path: string, options?: {
    params?: Record<string, string>;
    query?: Record<string, string>;
    replace?: boolean;
  }): boolean {
    const route = this.matchRoute(path, options?.params);
    if (route) {
      if (options?.replace) {
        history.replaceState(null, '', this.buildPath(path, options?.params, options?.query));
      } else {
        history.pushState(null, '', this.buildPath(path, options?.params, options?.query));
      }
      route.params = options?.params || {};
      route.query = options?.query || {};
      this.currentRoute = route;
      this.notifyListeners();
      return true;
    }
    this.handleNotFound();
    return false;
  }

  private matchRoute(path: string, params?: Record<string, string>): Route | null {
    const basePath = path.split('?')[0];
    const route = this.routes.get(basePath);
    if (route) return route;

    for (const [pattern, r] of this.routes) {
      const match = this.matchPattern(pattern, basePath);
      if (match) {
        return { ...r, params: match, path: basePath };
      }
    }
    return null;
  }

  private matchPattern(pattern: string, path: string): Record<string, string> | null {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }

  private buildPath(path: string, params?: Record<string, string>, query?: Record<string, string>): string {
    let fullPath = path;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        fullPath = fullPath.replace(`:${key}`, value);
      }
    }
    if (query) {
      const queryString = new URLSearchParams(query).toString();
      if (queryString) {
        fullPath += `?${queryString}`;
      }
    }
    return fullPath;
  }

  getCurrentRoute(): Route | null {
    return this.currentRoute;
  }

  back(): void {
    history.back();
  }

  forward(): void {
    history.forward();
  }

  onChange(listener: (route: Route | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  setNotFoundHandler(handler: () => void): void {
    this.notFoundHandler = handler;
  }

  private handleNotFound(): void {
    if (this.notFoundHandler) {
      this.notFoundHandler();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentRoute));
  }

  start(): void {
    window.addEventListener('popstate', () => {
      const path = window.location.pathname;
      const route = this.matchRoute(path);
      if (route) {
        route.query = Object.fromEntries(new URLSearchParams(window.location.search));
        this.currentRoute = route;
      }
      this.notifyListeners();
    });

    const initialPath = window.location.pathname;
    this.navigate(initialPath, { replace: true });
  }
}

export function parseQueryString(query: string): Record<string, string> {
  const params = new URLSearchParams(query);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function buildQueryString(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.append(key, String(value));
  }
  return searchParams.toString();
}

export function matchPath(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) return false;

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) continue;
    if (patternParts[i] !== pathParts[i]) return false;
  }
  return true;
}

export function extractParams(pattern: string, path: string): Record<string, string> {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    }
  }
  return params;
}

export function generatePath(path: string, params?: Record<string, string | number>): string {
  if (!params) return path;
  let result = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, String(value));
  }
  return result;
}
