export interface PDFOptions {
  format?: 'letter' | 'legal' | 'a4' | 'a3'
  orientation?: 'portrait' | 'landscape'
  margins?: { top?: number; right?: number; bottom?: number; left?: number }
  header?: { text?: string; fontSize?: number; alignment?: 'left' | 'center' | 'right' }
  footer?: { text?: string; fontSize?: number; alignment?: 'left' | 'center' | 'right' }
  pageNumbers?: boolean
}

export interface PDFTableColumn {
  header: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

export interface PDFTableData {
  columns: PDFTableColumn[]
  rows: (string | number)[][]
}

export interface PDFTextOptions {
  fontSize?: number
  fontFamily?: string
  color?: string
  align?: 'left' | 'center' | 'right' | 'justify'
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

export class PDFDocument {
  private content: string[] = []
  private currentY: number = 0
  private pageWidth: number = 612
  private pageHeight: number = 792
  private margins = { top: 50, right: 50, bottom: 50, left: 50 }
  private options: {
    format: 'letter' | 'legal' | 'a4' | 'a3'
    orientation: 'portrait' | 'landscape'
    margins: { top: number; right: number; bottom: number; left: number }
    header: { text: string; fontSize: number; alignment: 'left' | 'center' | 'right' }
    footer: { text: string; fontSize: number; alignment: 'left' | 'center' | 'right' }
    pageNumbers: boolean
  }
  private fontSize: number = 12
  private fontFamily: string = 'Helvetica'
  private lineHeight: number = 14

  constructor(options: PDFOptions = {}) {
    this.options = {
      format: options.format || 'letter',
      orientation: options.orientation || 'portrait',
      margins: {
        top: options.margins?.top ?? 50,
        right: options.margins?.right ?? 50,
        bottom: options.margins?.bottom ?? 50,
        left: options.margins?.left ?? 50
      },
      header: {
        text: options.header?.text || '',
        fontSize: options.header?.fontSize || 10,
        alignment: options.header?.alignment || 'center'
      },
      footer: {
        text: options.footer?.text || '',
        fontSize: options.footer?.fontSize || 10,
        alignment: options.footer?.alignment || 'center'
      },
      pageNumbers: options.pageNumbers ?? false
    }

    this.setPageSize()
    this.margins = this.options.margins
    this.resetPosition()
  }

  private setPageSize(): void {
    const sizes: Record<string, { width: number; height: number }> = {
      letter: { width: 612, height: 792 },
      legal: { width: 612, height: 1008 },
      a4: { width: 595, height: 842 },
      a3: { width: 842, height: 1191 }
    }

    const size = sizes[this.options.format]
    if (this.options.orientation === 'landscape') {
      this.pageWidth = size.height
      this.pageHeight = size.width
    } else {
      this.pageWidth = size.width
      this.pageHeight = size.height
    }
  }

  private resetPosition(): void {
    this.currentY = this.pageHeight - this.margins.top
  }

  private getTextWidth(text: string, fontSize: number): number {
    return text.length * fontSize * 0.5
  }

  addText(text: string, opts?: PDFTextOptions): this {
    const fontSz = opts?.fontSize || this.fontSize
    const align = opts?.align || 'left'
    const lines = this.wrapText(text, fontSz)

    for (const line of lines) {
      let x = this.margins.left

      if (align === 'center') {
        x = (this.pageWidth - this.getTextWidth(line, fontSz)) / 2
      } else if (align === 'right') {
        x = this.pageWidth - this.margins.right - this.getTextWidth(line, fontSz)
      }

      this.content.push(`BT /F1 ${fontSz} Tf ${x} ${this.currentY} Td (${this.escapeText(line)}) Tj ET`)
      this.currentY -= this.lineHeight * (fontSz / 12)
    }

    return this
  }

  addHeading(text: string, level: 1 | 2 | 3 = 1): this {
    const fontSizes: Record<number, number> = { 1: 24, 2: 18, 3: 14 }
    return this.addText(text, { fontSize: fontSizes[level], bold: true, align: 'left' })
  }

  addParagraph(text: string): this {
    return this.addText(text, { fontSize: this.fontSize, align: 'justify' })
  }

  addTable(table: PDFTableData): this {
    const colWidth = (this.pageWidth - this.margins.left - this.margins.right) / table.columns.length

    let x = this.margins.left
    for (const col of table.columns) {
      const width = col.width || colWidth
      const align = col.align || 'left'
      let textX = x

      if (align === 'center') textX = x + width / 2
      else if (align === 'right') textX = x + width - 5

      this.content.push(`BT /F1 10 Tf ${textX} ${this.currentY} Td (${this.escapeText(col.header)}) Tj ET`)
      x += width
    }

    this.currentY -= this.lineHeight
    this.addLine(this.margins.left, this.currentY, this.pageWidth - this.margins.left - this.margins.right, this.currentY)
    this.currentY -= 5

    for (const row of table.rows) {
      x = this.margins.left
      for (let i = 0; i < row.length; i++) {
        const col = table.columns[i]
        const width = col?.width || colWidth
        const align = col?.align || 'left'
        const cellText = String(row[i])
        let textX = x

        if (align === 'center') textX = x + width / 2
        else if (align === 'right') textX = x + width - 5

        this.content.push(`BT /F1 ${this.fontSize} Tf ${textX} ${this.currentY} Td (${this.escapeText(cellText)}) Tj ET`)
        x += width
      }
      this.currentY -= this.lineHeight
    }

    return this
  }

  addLine(x1: number, y1: number, x2: number, y2: number): this {
    this.content.push(`${x1} ${y1} m ${x2} ${y2} l S`)
    return this
  }

  addRect(x: number, y: number, width: number, height: number, filled = false): this {
    if (filled) {
      this.content.push(`${x} ${y} ${width} ${height} re f`)
    } else {
      this.content.push(`${x} ${y} ${width} ${height} re S`)
    }
    return this
  }

  addPageBreak(): this {
    this.content.push('BP')
    this.resetPosition()
    return this
  }

  setFont(fontFamily: string, fontSize: number): this {
    this.fontFamily = fontFamily
    this.fontSize = fontSize
    return this
  }

  private wrapText(text: string, fontSize: number): string[] {
    const maxWidth = this.pageWidth - this.margins.left - this.margins.right
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (this.getTextWidth(testLine, fontSize) <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }

    if (currentLine) lines.push(currentLine)
    return lines
  }

  private escapeText(text: string): string {
    return text.replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\n/g, '\\n')
  }

  private buildPDF(): string {
    const objects: string[] = []
    let objectCount = 0

    objectCount++
    const catalog = `${objectCount} 0 obj\n<< /Type /Catalog /Pages ${objectCount + 1} 0 R >>\nendobj\n`

    objectCount++
    const pages = `${objectCount} 0 obj\n<< /Type /Pages /Kids [${objectCount + 1} 0 R] /Count 1 >>\nendobj\n`

    objectCount++
    const page = `${objectCount} 0 obj\n<< /Type /Page /Parent ${objectCount - 1} 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Contents ${objectCount + 1} 0 R /Resources << /Font << /F1 ${objectCount + 2} 0 R >> >> >>\nendobj\n`

    objectCount++
    const content = this.content.join('\n')
    const contentObj = `${objectCount} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`

    objectCount++
    const font = `${objectCount} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`

    objects.push(catalog, pages, page, contentObj, font)

    let pdf = '%PDF-1.4\n'
    const offsets: number[] = []

    for (const obj of objects) {
      offsets.push(pdf.length)
      pdf += obj
    }

    const xref = offsets.length + 1
    pdf += `xref\n0 ${xref}\n`
    pdf += `0000000000 65535 f \n`
    for (const off of offsets) {
      pdf += `${off.toString().padStart(10, '0')} 00000 n \n`
    }

    pdf += `trailer\n<< /Size ${xref} /Root 1 0 R >>\nstartxref\n${pdf.split('\n').length * 50}\n%%EOF`

    return pdf
  }

  save(filename: string): void {
    const pdf = this.buildPDF()
    const blob = new Blob([pdf], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  toBlob(): Blob {
    const pdf = this.buildPDF()
    return new Blob([pdf], { type: 'application/pdf' })
  }

  toDataURL(): string {
    const pdf = this.buildPDF()
    return 'data:application/pdf;base64,' + btoa(pdf)
  }
}

export function createPDF(options?: PDFOptions): PDFDocument {
  return new PDFDocument(options)
}
