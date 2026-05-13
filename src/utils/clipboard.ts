export interface ClipboardOptions {
  plainText?: string
  htmlText?: string
  image?: Blob
  files?: File[]
}

export class ClipboardManager {
  static async writeText(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      this.fallbackWriteText(text)
    }
  }

  private static fallbackWriteText(text: string): void {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  static async readText(): Promise<string> {
    if (navigator.clipboard && window.isSecureContext) {
      return await navigator.clipboard.readText()
    } else {
      return this.fallbackReadText()
    }
  }

  private static fallbackReadText(): string {
    const textarea = document.createElement('textarea')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('paste')
    document.body.removeChild(textarea)
    return textarea.value
  }

  static async write(options: ClipboardOptions): Promise<void> {
    if (!navigator.clipboard) return

    const items: Array<{ type: string; data: Blob }> = []

    if (options.plainText) {
      items.push({ type: 'text/plain', data: new Blob([options.plainText], { type: 'text/plain' }) })
    }

    if (options.htmlText) {
      items.push({ type: 'text/html', data: new Blob([options.htmlText], { type: 'text/html' }) })
    }

    if (options.image) {
      items.push({ type: 'image/png', data: options.image })
    }

    await navigator.clipboard.write([
      new ClipboardItem(
        items.reduce((acc, item) => {
          acc[item.type] = item.data
          return acc
        }, {} as Record<string, Blob>)
      )
    ])
  }

  static async read(): Promise<{ type: string; data: string }[]> {
    const items: { type: string; data: string }[] = []

    if (!navigator.clipboard) return items

    try {
      const clipboardItems = await navigator.clipboard.read()

      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('text/')) {
            const blob = await item.getType(type)
            const text = await blob.text()
            items.push({ type: type.includes('html') ? 'html' : 'text', data: text })
          }
        }
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error)
    }

    return items
  }

  static async writeImage(blob: Blob): Promise<void> {
    if (navigator.clipboard) {
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ])
    }
  }

  static async readImage(): Promise<Blob | null> {
    if (!navigator.clipboard) return null

    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            return await item.getType(type)
          }
        }
      }
    } catch (error) {
      console.error('Failed to read image from clipboard:', error)
    }

    return null
  }

  static isSupported(): boolean {
    return !!(navigator.clipboard && window.isSecureContext)
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return ClipboardManager.writeText(text)
}

export async function pasteFromClipboard(): Promise<string> {
  return ClipboardManager.readText()
}
