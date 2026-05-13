export interface URLComponents {
  protocol?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
  username?: string;
  password?: string;
  origin?: string;
}

export interface QueryParams {
  [key: string]: string | string[] | undefined;
}

export class URLUtils2 {
  static parse(urlString: string): URLComponents {
    try {
      const url = new URL(urlString);
      return {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        username: url.username,
        password: url.password,
        origin: url.origin
      };
    } catch {
      return {};
    }
  }

  static build(components: URLComponents): string {
    const url = new URL('http://example.com');
    
    if (components.protocol) url.protocol = components.protocol;
    if (components.hostname) url.hostname = components.hostname;
    if (components.port) url.port = components.port;
    if (components.pathname) url.pathname = components.pathname;
    if (components.search) url.search = components.search;
    if (components.hash) url.hash = components.hash;
    if (components.username) url.username = components.username;
    if (components.password) url.password = components.password;

    return url.toString();
  }

  static getQueryParams(urlString: string): QueryParams {
    try {
      const url = new URL(urlString);
      const params: QueryParams = {};
      
      url.searchParams.forEach((value, key) => {
        const existing = params[key];
        if (existing) {
          if (Array.isArray(existing)) {
            existing.push(value);
          } else {
            params[key] = [existing, value];
          }
        } else {
          params[key] = value;
        }
      });

      return params;
    } catch {
      return {};
    }
  }

  static setQueryParam(urlString: string, key: string, value: string): string {
    try {
      const url = new URL(urlString);
      url.searchParams.set(key, value);
      return url.toString();
    } catch {
      return urlString;
    }
  }

  static appendQueryParam(urlString: string, key: string, value: string): string {
    try {
      const url = new URL(urlString);
      url.searchParams.append(key, value);
      return url.toString();
    } catch {
      return urlString;
    }
  }

  static removeQueryParam(urlString: string, key: string): string {
    try {
      const url = new URL(urlString);
      url.searchParams.delete(key);
      return url.toString();
    } catch {
      return urlString;
    }
  }

  static hasQueryParam(urlString: string, key: string): boolean {
    try {
      const url = new URL(urlString);
      return url.searchParams.has(key);
    } catch {
      return false;
    }
  }

  static getQueryParam(urlString: string, key: string): string | null {
    try {
      const url = new URL(urlString);
      return url.searchParams.get(key);
    } catch {
      return null;
    }
  }

  static buildQueryString(params: QueryParams): string {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    }

    const result = searchParams.toString();
    return result ? `?${result}` : '';
  }

  static encode(str: string): string {
    return encodeURIComponent(str);
  }

  static decode(str: string): string {
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  }

  static encodeRFC3986(str: string): string {
    return encodeURIComponent(str)
      .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  }

  static decodeRFC3986(str: string): string {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  }

  static isAbsolute(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }

  static isRelative(urlString: string): boolean {
    return !this.isAbsolute(urlString);
  }

  static resolve(base: string, relative: string): string {
    try {
      return new URL(relative, base).toString();
    } catch {
      return relative;
    }
  }

  static normalize(urlString: string): string {
    try {
      const url = new URL(urlString);
      url.pathname = url.pathname.replace(/\/+/g, '/');
      return url.toString();
    } catch {
      return urlString;
    }
  }

  static getDomain(urlString: string): string | null {
    try {
      const url = new URL(urlString);
      return url.hostname;
    } catch {
      return null;
    }
  }

  static getSubdomain(urlString: string): string | null {
    try {
      const url = new URL(urlString);
      const parts = url.hostname.split('.');
      if (parts.length > 2) {
        return parts.slice(0, -2).join('.');
      }
      return null;
    } catch {
      return null;
    }
  }

  static getTLD(urlString: string): string | null {
    try {
      const url = new URL(urlString);
      const parts = url.hostname.split('.');
      if (parts.length >= 2) {
        return parts.slice(-2).join('.');
      }
      return null;
    } catch {
      return null;
    }
  }

  static isSameOrigin(url1: string, url2: string): boolean {
    try {
      const a = new URL(url1);
      const b = new URL(url2);
      return a.origin === b.origin;
    } catch {
      return false;
    }
  }

  static getHash(urlString: string): string | null {
    try {
      const url = new URL(urlString);
      return url.hash.slice(1) || null;
    } catch {
      return null;
    }
  }

  static removeHash(urlString: string): string {
    try {
      const url = new URL(urlString);
      url.hash = '';
      return url.toString();
    } catch {
      return urlString;
    }
  }

  static addPathSegment(urlString: string, segment: string): string {
    try {
      const url = new URL(urlString);
      const pathname = url.pathname.replace(/\/+$/, '');
      url.pathname = `${pathname}/${segment}`.replace(/\/+/g, '/');
      return url.toString();
    } catch {
      return urlString;
    }
  }

  static getPathSegments(urlString: string): string[] {
    try {
      const url = new URL(urlString);
      return url.pathname.split('/').filter(Boolean);
    } catch {
      return [];
    }
  }

  static joinPaths(...paths: string[]): string {
    return paths
      .map(p => p.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/');
  }
}

export class URLBuilder {
  private protocol: string = 'https:';
  private hostname: string = '';
  private port: string = '';
  private pathname: string = '';
  private searchParams: Map<string, string | string[]> = new Map();
  private hash: string = '';
  private username: string = '';
  private password: string = '';

  setProtocol(protocol: string): this {
    this.protocol = protocol.endsWith(':') ? protocol : `${protocol}:`;
    return this;
  }

  setHostname(hostname: string): this {
    this.hostname = hostname;
    return this;
  }

  setPort(port: string | number): this {
    this.port = String(port);
    return this;
  }

  setPathname(pathname: string): this {
    this.pathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return this;
  }

  appendPath(...segments: string[]): this {
    const current = this.pathname.replace(/\/+$/, '');
    const newPath = segments.map(s => s.replace(/^\/+|\/+$/g, '')).join('/');
    this.pathname = `${current}/${newPath}`;
    return this;
  }

  setSearchParam(key: string, value: string | string[]): this {
    this.searchParams.set(key, value);
    return this;
  }

  appendSearchParam(key: string, value: string): this {
    const existing = this.searchParams.get(key);
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        this.searchParams.set(key, [existing, value]);
      }
    } else {
      this.searchParams.set(key, value);
    }
    return this;
  }

  removeSearchParam(key: string): this {
    this.searchParams.delete(key);
    return this;
  }

  setHash(hash: string): this {
    this.hash = hash.startsWith('#') ? hash.slice(1) : hash;
    return this;
  }

  setUsername(username: string): this {
    this.username = username;
    return this;
  }

  setPassword(password: string): this {
    this.password = password;
    return this;
  }

  toString(): string {
    const url = new URL(`${this.protocol}//${this.hostname}`);
    url.port = this.port;
    url.pathname = this.pathname;
    url.username = this.username;
    url.password = this.password;

    this.searchParams.forEach((value, key) => {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, value);
      }
    });

    url.hash = this.hash;

    return url.toString();
  }

  build(): string {
    return this.toString();
  }
}

export function slugify(text: string, options: {
  lowercase?: boolean;
  strict?: boolean;
  trim?: boolean;
} = {}): string {
  const { lowercase = true, strict = false, trim = true } = options;
  
  let slug = text;
  
  if (trim) {
    slug = slug.trim();
  }
  
  if (lowercase) {
    slug = slug.toLowerCase();
  }
  
  if (strict) {
    slug = slug.replace(/[^a-z0-9-]/g, '-');
  } else {
    slug = slug
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  return slug;
}

export function unslugify(slug: string, separator: string = ' '): string {
  return slug
    .replace(/-/g, separator)
    .replace(/_/g, separator)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function isValidURL(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

export function extractDomain(urlString: string): string | null {
  return URLUtils2.getDomain(urlString);
}

export function extractPaths(urlString: string): string[] {
  return URLUtils2.getPathSegments(urlString);
}

export default URLUtils2;
