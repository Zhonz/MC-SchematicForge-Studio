export interface Matrix {
  rows: number
  cols: number
  data: number[][]
}

export class MatrixCalculator {
  static create(rows: number, cols: number, fill = 0): Matrix {
    return {
      rows,
      cols,
      data: Array.from({ length: rows }, () => Array(cols).fill(fill))
    }
  }

  static identity(size: number): Matrix {
    const matrix = this.create(size, size)
    for (let i = 0; i < size; i++) {
      matrix.data[i][i] = 1
    }
    return matrix
  }

  static add(a: Matrix, b: Matrix): Matrix {
    if (a.rows !== b.rows || a.cols !== b.cols) {
      throw new Error('Matrix dimensions must match')
    }
    const result = this.create(a.rows, a.cols)
    for (let i = 0; i < a.rows; i++) {
      for (let j = 0; j < a.cols; j++) {
        result.data[i][j] = a.data[i][j] + b.data[i][j]
      }
    }
    return result
  }

  static subtract(a: Matrix, b: Matrix): Matrix {
    if (a.rows !== b.rows || a.cols !== b.cols) {
      throw new Error('Matrix dimensions must match')
    }
    const result = this.create(a.rows, a.cols)
    for (let i = 0; i < a.rows; i++) {
      for (let j = 0; j < a.cols; j++) {
        result.data[i][j] = a.data[i][j] - b.data[i][j]
      }
    }
    return result
  }

  static multiply(a: Matrix, b: Matrix): Matrix {
    if (a.cols !== b.rows) {
      throw new Error('Matrix dimensions incompatible for multiplication')
    }
    const result = this.create(a.rows, b.cols)
    for (let i = 0; i < a.rows; i++) {
      for (let j = 0; j < b.cols; j++) {
        let sum = 0
        for (let k = 0; k < a.cols; k++) {
          sum += a.data[i][k] * b.data[k][j]
        }
        result.data[i][j] = sum
      }
    }
    return result
  }

  static scalarMultiply(matrix: Matrix, scalar: number): Matrix {
    const result = this.create(matrix.rows, matrix.cols)
    for (let i = 0; i < matrix.rows; i++) {
      for (let j = 0; j < matrix.cols; j++) {
        result.data[i][j] = matrix.data[i][j] * scalar
      }
    }
    return result
  }

  static transpose(matrix: Matrix): Matrix {
    const result = this.create(matrix.cols, matrix.rows)
    for (let i = 0; i < matrix.rows; i++) {
      for (let j = 0; j < matrix.cols; j++) {
        result.data[j][i] = matrix.data[i][j]
      }
    }
    return result
  }

  static determinant(matrix: Matrix): number {
    if (matrix.rows !== matrix.cols) {
      throw new Error('Matrix must be square')
    }
    if (matrix.rows === 1) return matrix.data[0][0]
    if (matrix.rows === 2) {
      return matrix.data[0][0] * matrix.data[1][1] - matrix.data[0][1] * matrix.data[1][0]
    }

    let det = 0
    for (let j = 0; j < matrix.cols; j++) {
      const minor = this.getMinor(matrix, 0, j)
      det += (j % 2 === 0 ? 1 : -1) * matrix.data[0][j] * this.determinant(minor)
    }
    return det
  }

  static getMinor(matrix: Matrix, row: number, col: number): Matrix {
    const result = this.create(matrix.rows - 1, matrix.cols - 1)
    let ri = 0
    for (let i = 0; i < matrix.rows; i++) {
      if (i === row) continue
      let ci = 0
      for (let j = 0; j < matrix.cols; j++) {
        if (j === col) continue
        result.data[ri][ci] = matrix.data[i][j]
        ci++
      }
      ri++
    }
    return result
  }

  static inverse(matrix: Matrix): Matrix | null {
    const det = this.determinant(matrix)
    if (det === 0) return null

    if (matrix.rows === 2) {
      return this.scalarMultiply(
        { rows: 2, cols: 2, data: [[matrix.data[1][1], -matrix.data[0][1]], [-matrix.data[1][0], matrix.data[0][0]]] },
        1 / det
      )
    }

    const cofactors: number[][] = []
    for (let i = 0; i < matrix.rows; i++) {
      const row: number[] = []
      for (let j = 0; j < matrix.cols; j++) {
        const minor = this.getMinor(matrix, i, j)
        row.push((i + j) % 2 === 0 ? this.determinant(minor) : -this.determinant(minor))
      }
      cofactors.push(row)
    }

    const adjugate = this.transpose({ rows: matrix.rows, cols: matrix.cols, data: cofactors })
    return this.scalarMultiply(adjugate, 1 / det)
  }

  static clone(matrix: Matrix): Matrix {
    return {
      rows: matrix.rows,
      cols: matrix.cols,
      data: matrix.data.map(row => [...row])
    }
  }

  static toString(matrix: Matrix): string {
    return matrix.data.map(row => row.join('\t')).join('\n')
  }
}
