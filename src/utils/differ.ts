export type DiffOperation = 'add' | 'remove' | 'equal'

export interface DiffResult<T> {
  operation: DiffOperation
  value: T
  oldIndex?: number
  newIndex?: number
}

export interface DiffStats {
  additions: number
  deletions: number
  modifications: number
}

export class Differ<T = string> {
  private equals: (a: T, b: T) => boolean

  constructor(equals?: (a: T, b: T) => boolean) {
    this.equals = equals || ((a, b) => a === b)
  }

  diff(oldItems: T[], newItems: T[]): DiffResult<T>[] {
    const result: DiffResult<T>[] = []
    const matrix: number[][] = []
    
    for (let i = 0; i <= oldItems.length; i++) {
      matrix[i] = []
      for (let j = 0; j <= newItems.length; j++) {
        if (i === 0) {
          matrix[i][j] = j
        } else if (j === 0) {
          matrix[i][j] = i
        } else if (this.equals(oldItems[i - 1], newItems[j - 1])) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1])
        }
      }
    }

    let i = oldItems.length
    let j = newItems.length

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && this.equals(oldItems[i - 1], newItems[j - 1])) {
        result.unshift({
          operation: 'equal',
          value: oldItems[i - 1],
          oldIndex: i - 1,
          newIndex: j - 1
        })
        i--
        j--
      } else if (j > 0 && (i === 0 || matrix[i][j - 1] <= matrix[i - 1][j])) {
        result.unshift({
          operation: 'add',
          value: newItems[j - 1],
          newIndex: j - 1
        })
        j--
      } else {
        result.unshift({
          operation: 'remove',
          value: oldItems[i - 1],
          oldIndex: i - 1
        })
        i--
      }
    }

    return result
  }

  patch(oldItems: T[], diff: DiffResult<T>[]): T[] {
    return diff
      .filter(d => d.operation !== 'remove')
      .map(d => d.value)
  }

  unpatch(newItems: T[], diff: DiffResult<T>[]): T[] {
    return diff
      .filter(d => d.operation !== 'add')
      .map(d => d.value)
  }

  getStats(diff: DiffResult<T>[]): DiffStats {
    return {
      additions: diff.filter(d => d.operation === 'add').length,
      deletions: diff.filter(d => d.operation === 'remove').length,
      modifications: diff.filter(d => d.operation === 'equal').length
    }
  }
}

export function diff<T = string>(oldItems: T[], newItems: T[], equals?: (a: T, b: T) => boolean): DiffResult<T>[] {
  const differ = new Differ(equals)
  return differ.diff(oldItems, newItems)
}

export function diffLines(oldText: string, newText: string): DiffResult<string>[] {
  const differ = new Differ<string>()
  return differ.diff(oldText.split('\n'), newText.split('\n'))
}

export function diffChars(oldText: string, newText: string): DiffResult<string>[] {
  const differ = new Differ<string>()
  return differ.diff(oldText.split(''), newText.split(''))
}

export function createPatch(oldText: string, newText: string): string {
  const diffResults = diffLines(oldText, newText)
  const lines: string[] = []

  for (const result of diffResults) {
    switch (result.operation) {
      case 'add':
        lines.push(`+ ${result.value}`)
        break
      case 'remove':
        lines.push(`- ${result.value}`)
        break
      case 'equal':
        lines.push(`  ${result.value}`)
        break
    }
  }

  return lines.join('\n')
}

export function applyPatch(text: string, patch: string): string {
  const patchLines = patch.split('\n')
  const lines = text.split('\n')
  const result: string[] = []

  let oldIndex = 0
  let newIndex = 0

  for (const line of patchLines) {
    const operation = line[0]
    const content = line.slice(2)

    if (operation === ' ') {
      result.push(content)
      oldIndex++
      newIndex++
    } else if (operation === '-') {
      oldIndex++
    } else if (operation === '+') {
      result.push(content)
      newIndex++
    }
  }

  return result.join('\n')
}

export class LineDiffer {
  diff(oldText: string, newText: string): DiffResult<string>[] {
    return diffLines(oldText, newText)
  }

  formatHtml(diff: DiffResult<string>[]): string {
    return diff.map(d => {
      const escaped = escapeHtml(d.value)
      switch (d.operation) {
        case 'add':
          return `<ins style="background-color: #e6ffec; text-decoration: none;">${escaped}</ins>`
        case 'remove':
          return `<del style="background-color: #ffebe9; text-decoration: line-through;">${escaped}</del>`
        default:
          return escaped
      }
    }).join('')
  }

  formatConsole(diff: DiffResult<string>[]): string {
    return diff.map(d => {
      switch (d.operation) {
        case 'add':
          return `\x1b[32m+ ${d.value}\x1b[0m`
        case 'remove':
          return `\x1b[31m- ${d.value}\x1b[0m`
        default:
          return `  ${d.value}`
      }
    }).join('\n')
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const lineDiffer = new LineDiffer()
