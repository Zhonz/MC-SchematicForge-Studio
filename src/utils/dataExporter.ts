export type ExportFormat = 'json' | 'csv' | 'xml' | 'yaml' | 'txt'

export interface ExportOptions {
  format?: ExportFormat
  filename?: string
  includeMetadata?: boolean
  prettyPrint?: boolean
  delimiter?: string
  encoding?: string
}

export interface ImportOptions {
  format?: ExportFormat
  delimiter?: string
  encoding?: string
  onProgress?: (progress: number) => void
}

export interface ExportMetadata {
  exportedAt: number
  format: ExportFormat
  version: string
  recordCount?: number
}

export class DataExporter {
  private static instance: DataExporter

  private constructor() {}

  static getInstance(): DataExporter {
    if (!DataExporter.instance) {
      DataExporter.instance = new DataExporter()
    }
    return DataExporter.instance
  }

  export(data: unknown, options: ExportOptions = {}): string {
    const format = options.format || 'json'
    
    switch (format) {
      case 'json':
        return this.toJSON(data, options)
      case 'csv':
        return this.toCSV(data as Record<string, unknown>[], options)
      case 'xml':
        return this.toXML(data, options)
      case 'yaml':
        return this.toYAML(data)
      case 'txt':
        return this.toText(data)
      default:
        return this.toJSON(data, options)
    }
  }

  private toJSON(data: unknown, options: ExportOptions): string {
    const output = options.includeMetadata 
      ? { metadata: this.getMetadata('json'), data }
      : data
    
    return options.prettyPrint 
      ? JSON.stringify(output, null, 2)
      : JSON.stringify(output)
  }

  private toCSV(data: Record<string, unknown>[], options: ExportOptions): string {
    if (!data || data.length === 0) return ''

    const delimiter = options.delimiter || ','
    const headers = Object.keys(data[0])
    
    const rows: string[] = [headers.join(delimiter)]
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        const stringValue = String(value ?? '')
        if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      rows.push(values.join(delimiter))
    }

    return rows.join('\n')
  }

  private toXML(data: unknown, options: ExportOptions, rootName: string = 'root'): string {
    const pretty = options.prettyPrint ?? true
    const indent = pretty ? '  ' : ''
    const newline = pretty ? '\n' : ''

    const buildXML = (value: unknown, key: string, level: number): string => {
      const currentIndent = indent.repeat(level)
      const nextIndent = indent.repeat(level + 1)

      if (value === null || value === undefined) {
        return `${currentIndent}<${key}/>${newline}`
      }

      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          const items = value.map((item, i) => 
            buildXML(item, 'item', level + 1)
          ).join(newline)
          return `${currentIndent}<${key}>${newline}${items}${newline}${currentIndent}</${key}>`
        }

        const children = Object.entries(value as Record<string, unknown>)
          .map(([k, v]) => buildXML(v, k, level + 1))
          .join(newline)
        return `${currentIndent}<${key}>${newline}${children}${newline}${currentIndent}</${key}>`
      }

      return `${currentIndent}<${key}>${this.escapeXML(String(value))}</${key}>`
    }

    return `<?xml version="1.0" encoding="${options.encoding || 'UTF-8'}"?>${newline}${buildXML(data, rootName, 0)}`
  }

  private toYAML(data: unknown, indent: number = 0): string {
    const indentStr = '  '.repeat(indent)

    if (data === null || data === undefined) {
      return 'null'
    }

    if (typeof data === 'boolean') {
      return data ? 'true' : 'false'
    }

    if (typeof data === 'number') {
      return String(data)
    }

    if (typeof data === 'string') {
      if (data.includes('\n') || data.includes(':') || data.includes('#')) {
        return `"${data.replace(/"/g, '\\"')}"`
      }
      return data
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return '[]'
      
      return data.map(item => {
        const yaml = this.toYAML(item, indent + 1)
        if (typeof item === 'object' && item !== null) {
          return `${indentStr}- ${yaml.split('\n').join('\n' + indentStr + '  ')}`
        }
        return `${indentStr}- ${yaml}`
      }).join('\n')
    }

    const entries = Object.entries(data as Record<string, unknown>)
    if (entries.length === 0) return '{}'

    return entries.map(([key, value]) => {
      const yaml = this.toYAML(value, indent + 1)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return `${indentStr}${key}:${yaml.startsWith('{') ? '' : '\n'}${yaml}`
      }
      return `${indentStr}${key}: ${yaml}`
    }).join('\n')
  }

  private toText(data: unknown): string {
    if (typeof data === 'string') return data
    if (Array.isArray(data)) {
      return data.map(item => this.toText(item)).join('\n')
    }
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data)
        .map(([key, value]) => `${key}: ${this.toText(value)}`)
        .join('\n')
    }
    return String(data)
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  private getMetadata(format: ExportFormat): ExportMetadata {
    return {
      exportedAt: Date.now(),
      format,
      version: '1.0'
    }
  }

  download(data: unknown, options: ExportOptions = {}): void {
    const content = this.export(data, options)
    const filename = options.filename || `export-${Date.now()}`
    const format = options.format || 'json'
    const mimeTypes: Record<ExportFormat, string> = {
      json: 'application/json',
      csv: 'text/csv',
      xml: 'application/xml',
      yaml: 'application/x-yaml',
      txt: 'text/plain'
    }

    const blob = new Blob([content], { type: mimeTypes[format] })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.${format}`
    link.click()
    
    URL.revokeObjectURL(url)
  }
}

export class DataImporter {
  private static instance: DataImporter

  private constructor() {}

  static getInstance(): DataImporter {
    if (!DataImporter.instance) {
      DataImporter.instance = new DataImporter()
    }
    return DataImporter.instance
  }

  parse(content: string, options: ImportOptions = {}): unknown {
    const format = options.format || this.detectFormat(content)
    
    switch (format) {
      case 'json':
        return this.parseJSON(content)
      case 'csv':
        return this.parseCSV(content, options)
      case 'xml':
        return this.parseXML(content)
      case 'yaml':
        return this.parseYAML(content)
      case 'txt':
        return content
      default:
        return this.parseJSON(content)
    }
  }

  private detectFormat(content: string): ExportFormat {
    const trimmed = content.trim()
    
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return 'json'
    }
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
      return 'xml'
    }
    if (trimmed.includes(': ') && !trimmed.includes(',')) {
      return 'yaml'
    }
    if (trimmed.includes(',') && trimmed.includes('\n')) {
      return 'csv'
    }
    return 'txt'
  }

  private parseJSON(content: string): unknown {
    return JSON.parse(content)
  }

  private parseCSV(content: string, options: ImportOptions): Record<string, unknown>[] {
    const delimiter = options.delimiter || ','
    const lines = content.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) return []

    const headers = this.parseCSVLine(lines[0], delimiter)
    const data: Record<string, unknown>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter)
      const row: Record<string, unknown> = {}
      
      headers.forEach((header, index) => {
        const value = values[index] || ''
        row[header] = this.parseValue(value)
      })
      
      data.push(row)
    }

    return data
  }

  private parseCSVLine(line: string, delimiter: string): string[] {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    values.push(current.trim())
    return values
  }

  private parseValue(value: string): unknown {
    const trimmed = value.trim()
    
    if (trimmed === 'null' || trimmed === '') return null
    if (trimmed === 'true') return true
    if (trimmed === 'false') return false
    
    const num = Number(trimmed)
    if (!isNaN(num) && trimmed !== '') return num
    
    return trimmed
  }

  private parseXML(content: string): unknown {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/xml')
    
    const errorNode = doc.querySelector('parsererror')
    if (errorNode) {
      throw new Error('Invalid XML')
    }

    return this.xmlToObject(doc.documentElement)
  }

  private xmlToObject(element: Element): unknown {
    const obj: Record<string, unknown> = {}
    const children = Array.from(element.children)

    for (const child of children) {
      const name = child.tagName
      const value = child.children.length > 0 
        ? this.xmlToObject(child)
        : child.textContent || null

      if (obj[name]) {
        if (!Array.isArray(obj[name])) {
          obj[name] = [obj[name]]
        }
        (obj[name] as unknown[]).push(value)
      } else {
        obj[name] = value
      }
    }

    const textContent = element.textContent?.trim()
    if (children.length === 0 && textContent) {
      return this.parseValue(textContent)
    }

    return Object.keys(obj).length === 0 ? textContent : obj
  }

  private parseYAML(content: string): unknown {
    const lines = content.split('\n')
    const result: Record<string, unknown> = {}
    const stack: { obj: Record<string, unknown>; indent: number }[] = [{ obj: result, indent: -1 }]

    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith('#')) continue

      const indent = line.search(/\S/)
      const content = line.trim()

      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop()
      }

      const current = stack[stack.length - 1].obj

      if (content.includes(':')) {
        const colonIndex = content.indexOf(':')
        const key = content.substring(0, colonIndex).trim()
        const value = content.substring(colonIndex + 1).trim()

        if (value === '' || value === '[]' || value === '{}') {
          current[key] = value === '[]' ? [] : value === '{}' ? {} : {}
          if (typeof current[key] === 'object') {
            stack.push({ obj: current[key] as Record<string, unknown>, indent })
          }
        } else {
          current[key] = this.parseValue(value)
        }
      } else if (content.startsWith('-')) {
        const value = content.substring(1).trim()
        const arrKey = Object.keys(current).pop()
        if (arrKey && Array.isArray(current[arrKey])) {
          (current[arrKey] as unknown[]).push(this.parseValue(value))
        }
      }
    }

    return result
  }
}

export const exporter = DataExporter.getInstance()
export const importer = DataImporter.getInstance()

export function downloadJSON(data: unknown, filename?: string): void {
  exporter.download(data, { format: 'json', filename })
}

export function downloadCSV(data: Record<string, unknown>[], filename?: string): void {
  exporter.download(data, { format: 'csv', filename })
}
