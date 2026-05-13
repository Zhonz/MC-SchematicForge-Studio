export type PluginHook = 'beforeMount' | 'afterMount' | 'beforeUnmount' | 'afterUnmount' | 'onError' | 'onConfigChange';

export interface Plugin {
  name: string;
  version: string;
  install: (api: PluginAPI) => void;
  uninstall?: () => void;
}

export interface PluginAPI {
  register: (name: string, plugin: Plugin) => boolean;
  unregister: (name: string) => boolean;
  hasPlugin: (name: string) => boolean;
  getPlugin: (name: string) => Plugin | undefined;
  getAllPlugins: () => Plugin[];
  executeHook: (hook: PluginHook, data?: unknown) => unknown;
  onHook: (hook: PluginHook, callback: (data?: unknown) => unknown) => () => void;
}

export class PluginManager implements PluginAPI {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<PluginHook, Array<(data?: unknown) => unknown>> = new Map();

  register(name: string, plugin: Plugin): boolean {
    if (this.plugins.has(name)) {
      console.warn(`Plugin '${name}' is already registered`);
      return false;
    }
    try {
      plugin.install(this);
      this.plugins.set(name, plugin);
      return true;
    } catch (error) {
      console.error(`Failed to install plugin '${name}':`, error);
      return false;
    }
  }

  unregister(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    try {
      plugin.uninstall?.();
      this.plugins.delete(name);
      return true;
    } catch (error) {
      console.error(`Failed to uninstall plugin '${name}':`, error);
      return false;
    }
  }

  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  executeHook(hook: PluginHook, data?: unknown): unknown {
    const callbacks = this.hooks.get(hook) ?? [];
    let result = data;
    for (const callback of callbacks) {
      result = callback(result);
    }
    return result;
  }

  onHook(hook: PluginHook, callback: (data?: unknown) => unknown): () => void {
    if (!this.hooks.has(hook)) {
      this.hooks.set(hook, []);
    }
    this.hooks.get(hook)!.push(callback);
    return () => {
      const callbacks = this.hooks.get(hook);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index >= 0) callbacks.splice(index, 1);
      }
    };
  }
}

export const pluginManager = new PluginManager();
