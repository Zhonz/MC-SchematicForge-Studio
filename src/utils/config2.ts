export interface ConfigSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default?: unknown;
  required?: boolean;
  validate?: (value: unknown) => boolean;
  description?: string;
}

export interface ConfigSection {
  [key: string]: ConfigSchema;
}

export class Config {
  private sections: Map<string, Record<string, unknown>> = new Map();
  private schemas: Map<string, ConfigSection> = new Map();

  addSection(name: string, schema: ConfigSection): this {
    this.schemas.set(name, schema);
    this.sections.set(name, this.getDefaults(schema));
    return this;
  }

  private getDefaults(schema: ConfigSection): Record<string, unknown> {
    const defaults: Record<string, unknown> = {};
    for (const [key, config] of Object.entries(schema)) {
      if (config.default !== undefined) {
        defaults[key] = config.default;
      }
    }
    return defaults;
  }

  get<T = unknown>(section: string, key: string): T | undefined {
    return this.sections.get(section)?.[key] as T | undefined;
  }

  set(section: string, key: string, value: unknown): this {
    const schema = this.schemas.get(section)?.[key];
    if (schema?.validate && !schema.validate(value)) {
      console.warn(`Config validation failed for ${section}.${key}`);
      return this;
    }
    if (!this.sections.has(section)) {
      this.sections.set(section, {});
    }
    (this.sections.get(section)!)[key] = value;
    return this;
  }

  has(section: string, key?: string): boolean {
    if (key) {
      return (this.sections.get(section)?.[key]) !== undefined;
    }
    return this.sections.has(section);
  }

  delete(section: string, key?: string): this {
    if (key) {
      delete this.sections.get(section)?.[key];
    } else {
      this.sections.delete(section);
    }
    return this;
  }

  getSection(section: string): Record<string, unknown> {
    return { ...(this.sections.get(section) ?? {}) };
  }

  getAll(): Record<string, Record<string, unknown>> {
    const result: Record<string, Record<string, unknown>> = {};
    this.sections.forEach((section, name) => {
      result[name] = { ...section };
    });
    return result;
  }

  reset(section?: string): this {
    if (section) {
      const schema = this.schemas.get(section);
      if (schema) {
        this.sections.set(section, this.getDefaults(schema));
      }
    } else {
      this.schemas.forEach((schema, name) => {
        this.sections.set(name, this.getDefaults(schema));
      });
    }
    return this;
  }

  toJSON(): string {
    return JSON.stringify(this.getAll(), null, 2);
  }

  fromJSON(json: string): this {
    try {
      const data = JSON.parse(json) as Record<string, Record<string, unknown>>;
      for (const [section, values] of Object.entries(data)) {
        for (const [key, value] of Object.entries(values)) {
          this.set(section, key, value);
        }
      }
    } catch (error) {
      console.error('Failed to parse config JSON:', error);
    }
    return this;
  }
}

export const config = new Config();

export function createConfig(schema: Record<string, ConfigSection>): Config {
  const instance = new Config();
  for (const [name, section] of Object.entries(schema)) {
    instance.addSection(name, section);
  }
  return instance;
}
