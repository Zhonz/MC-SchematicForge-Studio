export type CompressionType = 'gzip' | 'deflate' | 'brotli'

export interface CompressOptions {
  type?: CompressionType
  level?: number
  chunkSize?: number
}

export interface CompressionResult {
  data: Uint8Array
  originalSize: number
  compressedSize: number
  ratio: number
}

export class Compression {
  private static instance: Compression

  static getInstance(): Compression {
    if (!Compression.instance) {
      Compression.instance = new Compression()
    }
    return Compression.instance
  }

  async compress(data: string, options: CompressOptions = {}): Promise<CompressionResult> {
    const encoder = new TextEncoder()
    const input = encoder.encode(data)
    return this.compressBytes(input, options)
  }

  async compressBytes(input: Uint8Array, options: CompressOptions = {}): Promise<CompressionResult> {
    const compressType = options.type || 'gzip'
    const level = options.level || 6

    let compressed: Uint8Array

    try {
      const stream = new CompressionStream(compressType as 'gzip' | 'deflate')
      const writer = stream.writable.getWriter()
      writer.write(input)
      writer.close()
      const output = await new Response(stream.readable).arrayBuffer()
      compressed = new Uint8Array(output)
    } catch {
      compressed = this.fallbackCompress(input, level)
    }

    return {
      data: compressed,
      originalSize: input.length,
      compressedSize: compressed.length,
      ratio: (1 - compressed.length / input.length) * 100
    }
  }

  async decompress(data: Uint8Array, type: CompressionType = 'gzip'): Promise<Uint8Array> {
    const compType = type as 'gzip' | 'deflate'
    try {
      const stream = new DecompressionStream(compType)
      const writer = stream.writable.getWriter()
      writer.write(data)
      writer.close()
      const output = await new Response(stream.readable).arrayBuffer()
      return new Uint8Array(output)
    } catch {
      return this.fallbackDecompress(data)
    }
  }

  async decompressToString(data: Uint8Array, type: CompressionType = 'gzip'): Promise<string> {
    const decompressed = await this.decompress(data, type)
    const decoder = new TextDecoder()
    return decoder.decode(decompressed)
  }

  private fallbackCompress(input: Uint8Array, level: number): Uint8Array {
    const output: number[] = []
    const windowSize = 4096
    const buffer: number[] = []

    for (let i = 0; i < input.length; i++) {
      const byte = input[i]
      buffer.push(byte)

      if (buffer.length > windowSize) {
        buffer.shift()
      }

      let matchLength = 0
      let matchOffset = 0

      for (let j = 0; j < buffer.length - 1; j++) {
        let length = 0
        while (length < buffer.length - j && length < 258 && i + length < input.length) {
          if (buffer[j + length] === input[i + length]) {
            length++
          } else {
            break
          }
        }

        if (length > matchLength) {
          matchLength = length
          matchOffset = buffer.length - j
        }
      }

      if (matchLength > 3) {
        output.push(0)
        output.push(matchOffset & 0xff)
        output.push((matchOffset >> 8) & 0xff)
        output.push(matchLength)
      } else {
        output.push(byte)
      }
    }

    return new Uint8Array(output)
  }

  private fallbackDecompress(data: Uint8Array): Uint8Array {
    const output: number[] = []
    let i = 0

    while (i < data.length) {
      if (data[i] === 0) {
        i++
        if (i + 2 < data.length) {
          const offset = data[i] | (data[i + 1] << 8)
          const length = data[i + 2]
          i += 3

          for (let j = 0; j < length; j++) {
            output.push(output[output.length - offset])
          }
        }
      } else {
        output.push(data[i])
        i++
      }
    }

    return new Uint8Array(output)
  }

  compressString(str: string): string {
    const encoded = btoa(encodeURIComponent(str))
    return encoded
  }

  decompressString(compressed: string): string {
    try {
      return decodeURIComponent(atob(compressed))
    } catch {
      return ''
    }
  }
}

export const compression = Compression.getInstance()

export async function compress(data: string, options?: CompressOptions): Promise<CompressionResult> {
  return compression.compress(data, options)
}

export async function decompress(data: Uint8Array, type?: CompressionType): Promise<Uint8Array> {
  return compression.decompress(data, type)
}
