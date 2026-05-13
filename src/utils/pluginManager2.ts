export interface PluginAPI {
  register: (name: string, plugin: Plugin) => void;
  unregister: (name: string) => void;
  execute: (name: string, ...args: unknown[]) => unknown;
  hasPlugin: (name: string) => boolean;
  getPlugins: () => Plugin[];
}

export interface Plugin {
  name: string;
  version: string;
  dependencies?: string[];
  install: (api: PluginAPI) => void;
  uninstall?: () => void;
}

export class PluginManager implements PluginAPI {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, Set<(data: unknown) => unknown>> = new Map();

  register(name: string, plugin: Plugin): void {
    if (this.plugins.has(name)) {
      console.warn(`Plugin '${name}' is already registered`);
      return;
    }
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          console.error(`Plugin '${name}' depends on '${dep}' which is not installed`);
          return;
        }
      }
    }
    plugin.install(this);
    this.plugins.set(name, plugin);
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) return;
    plugin.uninstall?.();
    this.plugins.delete(name);
  }

  execute(hookName: string, data?: unknown): unknown {
    const hooks = this.hooks.get(hookName);
    if (!hooks) return data;
    let result = data;
    for (const hook of hooks) {
      result = hook(result);
    }
    return result;
  }

  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  registerHook(name: string, fn: (data: unknown) => unknown): this {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, new Set());
    }
    this.hooks.get(name)!.add(fn);
    return this;
  }

  unregisterHook(name: string, fn?: (data: unknown) => unknown): this {
    if (fn) {
      this.hooks.get(name)?.delete(fn);
    } else {
      this.hooks.delete(name);
    }
    return this;
  }
}

export const pluginManager = new PluginManager();

export function createPlugin(name: string, version: string, install: (api: PluginAPI) => void): Plugin {
  return {
    name,
    version,
    install,
  };
}
