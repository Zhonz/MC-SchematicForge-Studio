export interface MarkdownOptions {
  gfm?: boolean
  breaks?: boolean
  smartypants?: boolean
}

export interface RenderResult {
  html: string
  toc?: TableOfContentsItem[]
}

export interface TableOfContentsItem {
  level: number
  text: string
  id: string
}

export class Markdown {
  private options: Required<MarkdownOptions>
  private inlinePatterns: Array<{ pattern: RegExp; replacement: (match: string, ...args: string[]) => string }> = []
  private blockPatterns: Array<{ pattern: RegExp; handler: (match: RegExpMatchArray, lines: string[]) => string }> = []

  constructor(options: MarkdownOptions = {}) {
    this.options = {
      gfm: options.gfm ?? true,
      breaks: options.breaks ?? false,
      smartypants: options.smartypants ?? false
    }

    this.initInlinePatterns()
    this.initBlockPatterns()
  }

  private initInlinePatterns(): void {
    this.inlinePatterns = [
      { pattern: /\\\\/g, replacement: () => '\\\\' },
      { pattern: /\\`/g, replacement: () => '\\`' },
      { pattern: /\*\*([^*]+)\*\*/g, replacement: (_, text: string) => `<strong>${text}</strong>` },
      { pattern: /\*([^*]+)\*/g, replacement: (_, text: string) => `<em>${text}</em>` },
      { pattern: /__([^_]+)__/g, replacement: (_, text: string) => `<strong>${text}</strong>` },
      { pattern: /_([^_]+)_/g, replacement: (_, text: string) => `<em>${text}</em>` },
      { pattern: /~~([^~]+)~~/g, replacement: (_, text: string) => `<del>${text}</del>` },
      { pattern: /`([^`]+)`/g, replacement: (_, code: string) => `<code>${code}</code>` },
      { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: (_, text: string, url: string) => `<a href="${url}">${text}</a>` },
      { pattern: /!\[([^\]]*)\]\(([^)]+)\)/g, replacement: (_, alt: string, url: string) => `<img src="${url}" alt="${alt}">` },
      { pattern: /\b\*\*\*([^*]+)\*\*\*/g, replacement: (_, text: string) => `<strong><em>${text}</em></strong>` },
      { pattern: /\b___([^_]+)___/g, replacement: (_, text: string) => `<strong><em>${text}</em></strong>` },
    ]
  }

  private initBlockPatterns(): void {
    this.blockPatterns = [
      {
        pattern: /^### (.*$)/gm,
        handler: (match: RegExpMatchArray) => `<h3 id="${this.slugify(match[1])}">${match[1]}</h3>`
      },
      {
        pattern: /^## (.*$)/gm,
        handler: (match: RegExpMatchArray) => `<h2 id="${this.slugify(match[1])}">${match[1]}</h2>`
      },
      {
        pattern: /^# (.*$)/gm,
        handler: (match: RegExpMatchArray) => `<h1 id="${this.slugify(match[1])}">${match[1]}</h1>`
      },
      {
        pattern: /^\> (.*$)/gm,
        handler: (match: RegExpMatchArray) => `<blockquote>${match[1]}</blockquote>`
      },
      {
        pattern: /^\- \[x\] (.*$)/gm,
        handler: (match: RegExpMatchArray) => `<input type="checkbox" checked disabled> ${match[1]}`
      },
      {
        pattern: /^\- \[ \] (.*$)/gm,
        handler: (match: RegExpMatchArray) => `<input type="checkbox" disabled> ${match[1]}`
      },
      {
        pattern: /^\- (.*$)/gm,
        handler: (match: RegExpMatchArray) => `<li>${match[1]}</li>`
      },
      {
        pattern: /^\d+\. (.*$)/gm,
        handler: (match: RegExpMatchArray) => `<li>${match[1]}</li>`
      },
      {
        pattern: /^---$/gm,
        handler: () => '<hr>'
      },
      {
        pattern: /```(\w*)\n([\s\S]*?)```/g,
        handler: (match: RegExpMatchArray) => `<pre><code class="language-${match[1]}">${match[2]}</code></pre>`
      },
    ]
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private parseInline(text: string): string {
    for (const { pattern, replacement } of this.inlinePatterns) {
      text = text.replace(pattern, replacement as unknown as string)
    }
    return text
  }

  render(markdown: string, options?: MarkdownOptions): RenderResult {
    if (options) {
      this.options = {
        gfm: options.gfm ?? this.options.gfm,
        breaks: options.breaks ?? this.options.breaks,
        smartypants: options.smartypants ?? this.options.smartypants
      }
    }

    let html = markdown
    html = html.replace(/\r\n/g, '\n')
    html = this.renderBlock(html)
    html = this.renderInline(html)

    if (this.options.smartypants) {
      html = this.smartypants(html)
    }

    const toc = this.extractTOC(markdown)

    return { html, toc }
  }

  private renderBlock(markdown: string): string {
    for (const { pattern, handler } of this.blockPatterns) {
      markdown = markdown.replace(pattern, handler as unknown as string)
    }

    markdown = this.wrapLists(markdown)
    markdown = this.wrapBlockquotes(markdown)

    return markdown
  }

  private wrapLists(text: string): string {
    const lines = text.split('\n')
    const result: string[] = []
    let inList = false
    let listType = ''

    for (const line of lines) {
      const liMatch = line.match(/^<li>(.*)<\/li>$/)

      if (liMatch) {
        if (!inList) {
          inList = true
          if (line.match(/^\d+\./)) {
            listType = 'ol'
            result.push('<ol>')
          } else {
            listType = 'ul'
            result.push('<ul>')
          }
        }
        result.push(line)
      } else {
        if (inList) {
          inList = false
          result.push(`</${listType}>`)
        }
        result.push(line)
      }
    }

    if (inList) {
      result.push(`</${listType}>`)
    }

    return result.join('\n')
  }

  private wrapBlockquotes(text: string): string {
    const lines = text.split('\n')
    const result: string[] = []
    let inBlockquote = false
    let content: string[] = []

    for (const line of lines) {
      const bqMatch = line.match(/^<blockquote>(.*)<\/blockquote>$/)

      if (bqMatch) {
        if (!inBlockquote) {
          inBlockquote = true
        }
        content.push(bqMatch[1])
      } else {
        if (inBlockquote) {
          inBlockquote = false
          result.push(`<blockquote>${content.join(' ')}</blockquote>`)
          content = []
        }
        result.push(line)
      }
    }

    if (inBlockquote) {
      result.push(`<blockquote>${content.join(' ')}</blockquote>`)
    }

    return result.join('\n')
  }

  private renderInline(text: string): string {
    const lines = text.split('\n')
    return lines.map(line => {
      if (!line.startsWith('<')) {
        return this.parseInline(line)
      }
      return line
    }).join('\n')
  }

  private smartypants(text: string): string {
    return text
      .replace(/--/g, '\u2014')
      .replace(/(\s|^)"(\S)/g, '$1\u201C$2')
      .replace(/(\S)"(\s|$)/g, '$1\u201D$2')
      .replace(/(\s|^)'(\S)/g, '$1\u2018$2')
      .replace(/(\S)'(\s|$)/g, '$1\u2019$2')
      .replace(/\.\.\./g, '\u2026')
  }

  extractTOC(markdown: string): TableOfContentsItem[] {
    const toc: TableOfContentsItem[] = []
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    let match

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      const id = this.slugify(text)
      toc.push({ level, text, id })
    }

    return toc
  }
}

export function renderMarkdown(markdown: string, options?: MarkdownOptions): RenderResult {
  const md = new Markdown()
  return md.render(markdown, options)
}

export function renderToHTML(markdown: string, options?: MarkdownOptions): string {
  const md = new Markdown()
  return md.render(markdown, options).html
}

export function extractTOC(markdown: string): TableOfContentsItem[] {
  const md = new Markdown()
  return md.extractTOC(markdown)
}
