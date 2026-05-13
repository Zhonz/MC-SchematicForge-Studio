export interface Diff<T> {
  type: 'added' | 'removed' | 'unchanged'
  value: T
  index?: number
}

export interface DiffResult<T> {
  added: T[]
  removed: T[]
  unchanged: T[]
  changes: Array<{ type: 'add' | 'remove' | 'change'; oldValue?: T; newValue?: T; index: number }>
}

export interface ObjectDiff {
  path: string
  type: 'added' | 'removed' | 'changed'
  oldValue?: unknown
  newValue?: unknown
}

export class DiffEngine {
  static diffArrays<T>(oldArr: T[], newArr: T[]): DiffResult<T> {
    const result: DiffResult<T> = {
      added: [],
      removed: [],
      unchanged: [],
      changes: []
    }

    const oldMap = new Map<string, number>()
    const newMap = new Map<string, number>()
    const getKey = (item: T): string => JSON.stringify(item)

    oldArr.forEach((item, i) => {
      const key = getKey(item)
      oldMap.set(key, (oldMap.get(key) || 0) + 1)
    })

    newArr.forEach((item, i) => {
      const key = getKey(item)
      newMap.set(key, (newMap.get(key) || 0) + 1)
    })

    const processed = new Set<string>()

    oldArr.forEach((item, index) => {
      const key = getKey(item)
      if (processed.has(key)) return
      processed.add(key)

      const oldCount = oldMap.get(key) || 0
      const newCount = newMap.get(key) || 0

      if (newCount === 0) {
        result.removed.push(item)
        result.changes.push({ type: 'remove', oldValue: item, index })
      } else if (newCount > oldCount) {
        for (let i = 0; i < newCount - oldCount; i++) {
          result.added.push(item)
          result.changes.push({ type: 'add', newValue: item, index: index + i })
        }
      }
      result.unchanged.push(item)
    })

    return result
  }

  static diffObjects(oldObj: Record<string, unknown>, newObj: Record<string, unknown>): ObjectDiff[] {
    const diffs: ObjectDiff[] = []
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

    for (const key of allKeys) {
      const oldValue = oldObj[key]
      const newValue = newObj[key]

      if (!(key in oldObj)) {
        diffs.push({ path: key, type: 'added', newValue })
      } else if (!(key in newObj)) {
        diffs.push({ path: key, type: 'removed', oldValue })
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diffs.push({ path: key, type: 'changed', oldValue, newValue })
      }
    }

    return diffs
  }

  static diffStrings(oldStr: string, newStr: string): Array<{ type: 'added' | 'removed' | 'unchanged'; value: string }> {
    const result: Array<{ type: 'added' | 'removed' | 'unchanged'; value: string }> = []

    const lcs = this.longestCommonSubsequence(oldStr, newStr)
    let oldIdx = 0
    let newIdx = 0
    let lcsIdx = 0

    while (oldIdx < oldStr.length || newIdx < newStr.length) {
      if (lcsIdx < lcs.length && oldIdx < oldStr.length && newIdx < newStr.length && oldStr[oldIdx] === lcs[lcsIdx] && newStr[newIdx] === lcs[lcsIdx]) {
        result.push({ type: 'unchanged', value: lcs[lcsIdx] })
        oldIdx++
        newIdx++
        lcsIdx++
      } else if (newIdx < newStr.length && (lcsIdx >= lcs.length || newStr[newIdx] !== lcs[lcsIdx])) {
        result.push({ type: 'added', value: newStr[newIdx] })
        newIdx++
      } else if (oldIdx < oldStr.length) {
        result.push({ type: 'removed', value: oldStr[oldIdx] })
        oldIdx++
      }
    }

    return this.mergeConsecutiveChanges(result)
  }

  static longestCommonSubsequence(a: string, b: string): string {
    const m = a.length
    const n = b.length
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }

    let result = ''
    let i = m
    let j = n
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        result = a[i - 1] + result
        i--
        j--
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--
      } else {
        j--
      }
    }

    return result
  }

  private static mergeConsecutiveChanges(changes: Array<{ type: 'added' | 'removed' | 'unchanged'; value: string }>): Array<{ type: 'added' | 'removed' | 'unchanged'; value: string }> {
    if (changes.length === 0) return changes

    const result: Array<{ type: 'added' | 'removed' | 'unchanged'; value: string }> = []
    let current = { ...changes[0] }

    for (let i = 1; i < changes.length; i++) {
      if (changes[i].type === current.type) {
        current.value += changes[i].value
      } else {
        result.push(current)
        current = { ...changes[i] }
      }
    }
    result.push(current)

    return result
  }

  static createPatch<T>(oldArr: T[], newArr: T[]): Array<{ op: 'add' | 'remove'; value: T; index: number }> {
    const result: Array<{ op: 'add' | 'remove'; value: T; index: number }> = []
    const diff = this.diffArrays(oldArr, newArr)

    diff.removed.forEach((item, i) => {
      result.push({ op: 'remove', value: item, index: i })
    })

    diff.added.forEach((item, i) => {
      result.push({ op: 'add', value: item, index: i })
    })

    return result
  }

  static applyPatch<T>(arr: T[], patches: Array<{ op: 'add' | 'remove'; value: T; index: number }>): T[] {
    const result = [...arr]
    const sortedPatches = [...patches].sort((a, b) => b.index - a.index)

    for (const patch of sortedPatches) {
      if (patch.op === 'add') {
        result.splice(patch.index, 0, patch.value)
      } else {
        result.splice(patch.index, 1)
      }
    }

    return result
  }

  static formatDiff(diff: Array<{ type: 'added' | 'removed' | 'unchanged'; value: string }>): string {
    return diff.map(d => {
      switch (d.type) {
        case 'added': return `+ ${d.value}`
        case 'removed': return `- ${d.value}`
        case 'unchanged': return `  ${d.value}`
      }
    }).join('\n')
  }
}

export function diff<T>(oldArr: T[], newArr: T[]): DiffResult<T> {
  return DiffEngine.diffArrays(oldArr, newArr)
}

export function diffObjects(oldObj: Record<string, unknown>, newObj: Record<string, unknown>): ObjectDiff[] {
  return DiffEngine.diffObjects(oldObj, newObj)
}

export function diffStrings(oldStr: string, newStr: string): Array<{ type: 'added' | 'removed' | 'unchanged'; value: string }> {
  return DiffEngine.diffStrings(oldStr, newStr)
}
