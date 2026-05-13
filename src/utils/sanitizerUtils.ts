export interface SanitizeOptions {
  allowImages?: boolean;
  allowLinks?: boolean;
  allowStyles?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
  maxLength?: number;
}

export function sanitizeHTML(html: string, options: SanitizeOptions = {}): string {
  const {
    allowImages = false,
    allowLinks = false,
    allowStyles = false,
    maxLength,
  } = options;

  let result = html;

  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  result = result.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  result = result.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  result = result.replace(/<embed\b[^>]*>/gi, '');
  result = result.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
  result = result.replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '');
  result = result.replace(/<input\b[^>]*>/gi, '');
  result = result.replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '');
  result = result.replace(/on\w+="[^"]*"/gi, '');
  result = result.replace(/on\w+='[^']*'/gi, '');
  result = result.replace(/on\w+=\{[^}]*\}/gi, '');
  result = result.replace(/javascript:/gi, '');
  result = result.replace(/data:/gi, '');
  result = result.replace(/vbscript:/gi, '');

  if (!allowImages) {
    result = result.replace(/<img\b[^<]*(?:(?!<\/img>)<[^<]*)*<\/img>/gi, '');
    result = result.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  }

  if (!allowLinks) {
    result = result.replace(/<a\b[^<]*(?:(?!<\/a>)<[^<]*)*<\/a>/gi, '');
  } else {
    result = result.replace(/<a\b[^>]*href=["'](?!http|\/|#)[^"']*["'][^>]*>/gi, '<a href="#" onclick="return false">');
  }

  if (!allowStyles) {
    result = result.replace(/style=["'][^"']*["']/gi, '');
  } else {
    result = result.replace(/style=["'][^"']*(expression|javascript|behavior)[^"']*["']/gi, 'style=""');
  }

  if (maxLength && result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  return result;
}

export function escapeHTML(str: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return str.replace(/[&<>"'`=/]/g, (char) => escapeMap[char] || char);
}

export function unescapeHTML(str: string): string {
  const unescapeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&nbsp;': ' ',
  };

  return str.replace(/&(?:amp|lt|gt|quot|#x27|#x2F|#x60|#x3D|nbsp);/g, (entity) => unescapeMap[entity] || entity);
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function escapeCSS(str: string): string {
  return str.replace(/[^a-zA-Z0-9_-]/g, (char) => {
    const code = char.charCodeAt(0).toString(16);
    return `\\${code}`;
  });
}

export function escapeShell(str: string): string {
  return str.replace(/[`$!\\]/g, '\\$&');
}

export function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

export function escapeURL(str: string, full = false): string {
  if (full) {
    return encodeURIComponent(str);
  }
  return encodeURI(str);
}

export function unescapeURL(str: string, full = false): string {
  if (full) {
    return decodeURIComponent(str);
  }
  return decodeURI(str);
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function stripScripts(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

export function stripStyles(html: string): string {
  return html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
}

export function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function camelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (char, index) =>
      index === 0 ? char.toLowerCase() : char.toUpperCase()
    )
    .replace(/\s+/g, '');
}

export function snakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/\s+/g, '_');
}

export function kebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
    .replace(/\s+/g, '-');
}

export function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (char) =>
    char.charAt(0).toUpperCase() + char.slice(1).toLowerCase()
  );
}

export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

export function wordWrap(str: string, width: number, breakWord = '\n'): string {
  const words = str.split(' ');
  let result = '';
  let lineLength = 0;

  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    if (lineLength + word.length + 1 > width) {
      if (lineLength > 0) {
        result += breakWord;
        lineLength = 0;
      }
      if (word.length > width) {
        while (word.length > width) {
          result += word.slice(0, width) + breakWord;
          word = word.slice(width);
          lineLength = 0;
        }
        lineLength = word.length;
      } else {
        lineLength = word.length;
      }
    } else {
      if (lineLength > 0) {
        lineLength++;
        result += ' ';
      }
      lineLength += word.length;
    }
    result += word;
  }

  return result;
}

export function removeNonASCII(str: string): string {
  return str.replace(/[^\x00-\x7F]/g, '');
}

export function removeEmoji(str: string): string {
  return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
}

export function sanitizeFilename(filename: string, replacement = '_'): string {
  return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, replacement);
}

export function mask(str: string, start = 0, end?: number, maskChar = '*'): string {
  if (end === undefined) {
    end = str.length;
  }
  const maskLength = Math.min(end - start, str.length - start);
  const maskPart = maskChar.repeat(maskLength);
  return str.slice(0, start) + maskPart + str.slice(start + maskLength);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return mask(email);

  const visibleChars = Math.min(3, Math.floor(local.length / 2));
  const visibleLocal = local.slice(0, visibleChars);
  const maskedLocal = maskChar.repeat(Math.max(1, local.length - visibleChars));

  const domainParts = domain.split('.');
  const visibleDomain = domainParts[0].slice(0, 3);
  const maskedDomain = maskChar.repeat(Math.max(1, domainParts[0].length - 3));

  return `${visibleLocal}${maskedLocal}@${visibleDomain}${maskedDomain}.${domainParts.slice(1).join('.')}`;
}

export function maskPhone(phone: string, visible = 4): string {
  return mask(phone, 0, phone.length - visible);
}

export function maskCreditCard(card: string, visible = 4): string {
  const cleaned = card.replace(/\s/g, '');
  return mask(cleaned, 0, cleaned.length - visible) + cleaned.slice(-visible);
}

const maskChar = '*';

export class DOMPurify {
  private config: SanitizeOptions;

  constructor(config: SanitizeOptions = {}) {
    this.config = config;
  }

  sanitize(html: string): string {
    return sanitizeHTML(html, this.config);
  }

  setConfig(config: SanitizeOptions): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SanitizeOptions {
    return { ...this.config };
  }
}

export const domPurify = new DOMPurify();

export function purify(html: string, options?: SanitizeOptions): string {
  if (options) {
    const purifier = new DOMPurify(options);
    return purifier.sanitize(html);
  }
  return domPurify.sanitize(html);
}
