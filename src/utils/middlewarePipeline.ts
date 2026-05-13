export type MiddlewareHandler<T = unknown> = (context: T, next: () => Promise<T>) => Promise<T>;

export interface MiddlewareConfig<T = unknown> {
  handler: MiddlewareHandler<T>;
  name?: string;
  before?: string[];
  after?: string[];
}

export class MiddlewarePipeline<T = unknown> {
  private middlewares: MiddlewareConfig<T>[] = [];
  private resolved: MiddlewareHandler<T>[] = [];

  use(config: MiddlewareConfig<T>): this {
    this.middlewares.push(config);
    this.resolved = [];
    return this;
  }

  useHandler(handler: MiddlewareHandler<T>, name?: string): this {
    return this.use({ handler, name });
  }

  async execute(context: T): Promise<T> {
    const stack = this.resolve();
    let index = 0;
    const next = async (): Promise<T> => {
      if (index >= stack.length) {
        return context;
      }
      const handler = stack[index++];
      return handler(context, next);
    };
    return next();
  }

  private resolve(): MiddlewareHandler<T>[] {
    if (this.resolved.length > 0) {
      return this.resolved;
    }
    const sorted = this.topologicalSort();
    this.resolved = sorted.map((m) => m.handler);
    return this.resolved;
  }

  private topologicalSort(): MiddlewareConfig<T>[] {
    const result: MiddlewareConfig<T>[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (middleware: MiddlewareConfig<T>): void => {
      if (visited.has(middleware.name ?? '')) return;
      if (visiting.has(middleware.name ?? '')) {
        console.warn(`Circular dependency detected for middleware: ${middleware.name}`);
        return;
      }
      visiting.add(middleware.name ?? '');
      if (middleware.before) {
        for (const beforeName of middleware.before) {
          const beforeMiddleware = this.middlewares.find((m) => m.name === beforeName);
          if (beforeMiddleware) visit(beforeMiddleware);
        }
      }
      visiting.delete(middleware.name ?? '');
      visited.add(middleware.name ?? '');
      result.push(middleware);
    };

    for (const middleware of this.middlewares) {
      visit(middleware);
    }

    return result;
  }

  clear(): void {
    this.middlewares = [];
    this.resolved = [];
  }

  getMiddlewares(): MiddlewareConfig<T>[] {
    return [...this.middlewares];
  }
}

export function compose<T = unknown>(middlewares: MiddlewareHandler<T>[]): MiddlewareHandler<T> {
  return async (context: T, next: () => Promise<T>) => {
    let index = 0;
    const dispatch = async (): Promise<T> => {
      if (index >= middlewares.length) {
        return next();
      }
      const handler = middlewares[index++];
      return handler(context, dispatch);
    };
    return dispatch();
  };
}

export function createLoggerMiddleware<T extends { logger?: { debug: (msg: string) => void } }>(): MiddlewareHandler<T> {
  return async (context, next) => {
    context.logger?.debug('Middleware: before');
    const result = await next();
    context.logger?.debug('Middleware: after');
    return result;
  };
}

export function createTimingMiddleware<T>(): MiddlewareHandler<T> {
  return async (context, next) => {
    const start = performance.now();
    const result = await next();
    const duration = performance.now() - start;
    console.log(`Middleware took ${duration.toFixed(2)}ms`);
    return result;
  };
}
