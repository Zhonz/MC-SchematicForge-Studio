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
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '');
}

export function snakeCase(str: string): string {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_');
}

export function kebabCase(str: string): string {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('-');
}

export function pascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
    .replace(/\s+/g, '');
}

export function titleCase(str: string): string {
  return str.replace(/\w\S*/g, txt => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function upperFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function lowerFirst(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function trim(str: string, chars?: string): string {
  if (!chars) return str.trim();
  const pattern = new RegExp(`^[${chars}]+|[${chars}]+$`, 'g');
  return str.replace(pattern, '');
}

export function truncate(str: string, length: number, ending = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - ending.length) + ending;
}

export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, m => map[m]);
}

export function unescapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'"
  };
  return str.replace(/&(amp|lt|gt|quot|#039);/g, m => map[m] || m);
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

export function repeat(str: string, times: number): string {
  return str.repeat(times);
}

export function padStart(str: string, length: number, char = ' '): string {
  return str.padStart(length, char);
}

export function padEnd(str: string, length: number, char = ' '): string {
  return str.padEnd(length, char);
}

export function words(str: string): string[] {
  return str.match(/\w+/g) || [];
}

export function swapCase(str: string): string {
  return str.replace(/[a-z]/gi, letter => 
    letter === letter.toUpperCase() ? letter.toLowerCase() : letter.toUpperCase()
  );
}
