export interface BatchOptions<T, R> {
  items: T[]
  batchSize?: number
  concurrency?: number
  processor: (item: T, index: number) => Promise<R>
  onProgress?: (completed: number, total: number) => void
}

export interface BatchResult<T, R> {
  results: R[]
  errors: Array<{ item: T; error: Error }>
  duration: number
}

export class BatchProcessor<T, R> {
  async process(options: BatchOptions<T, R>): Promise<BatchResult<T, R>> {
    const { items, batchSize = 10, concurrency = 1, processor, onProgress } = options
    const results: (R | null)[] = new Array(items.length)
    const errors: Array<{ item: T; error: Error }> = []
    const startTime = Date.now()

    if (concurrency === 1) {
      for (let i = 0; i < items.length; i++) {
        try {
          results[i] = await processor(items[i], i)
        } catch (error) {
          errors.push({ item: items[i], error: error as Error })
        }
        onProgress?.(i + 1, items.length)
      }
    } else {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        const batchResults = await Promise.all(
          batch.map(async (item, batchIndex) => {
            const globalIndex = i + batchIndex
            try {
              return await processor(item, globalIndex)
            } catch (error) {
              errors.push({ item, error: error as Error })
              return null
            }
          })
        )

        for (let j = 0; j < batchResults.length; j++) {
          results[i + j] = batchResults[j]
        }

        onProgress?.(Math.min(i + batchSize, items.length), items.length)
      }
    }

    return {
      results: results.filter((r): r is R => r !== null),
      errors,
      duration: Date.now() - startTime
    }
  }

  async processSequential(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = []
    for (let i = 0; i < items.length; i++) {
      const result = await processor(items[i], i)
      results.push(result)
      onProgress?.(i + 1, items.length)
    }
    return results
  }

  async processParallel(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    concurrency = 5
  ): Promise<R[]> {
    const queue = [...items]
    const running: Promise<R>[] = []
    const results: R[] = []

    for (let i = 0; i < Math.min(concurrency, items.length); i++) {
      running.push(this.processNext(queue, processor, results))
    }

    await Promise.all(running)
    return results
  }

  private async processNext(
    queue: T[],
    processor: (item: T, index: number) => Promise<R>,
    results: R[]
  ): Promise<R> {
    if (queue.length === 0) {
      return Promise.resolve(null as unknown as R)
    }

    const item = queue.shift()!
    const index = results.length

    try {
      const result = await processor(item, index)
      results.push(result)
    } catch (error) {
      console.error('Batch processing error:', error)
    }

    if (queue.length > 0) {
      await this.processNext(queue, processor, results)
    }

    return results[results.length - 1]
  }
}

export class DataPipeline<T, R> {
  private stages: Array<(data: T) => T | Promise<T>> = []
  private errorHandlers: Array<(error: Error) => void> = []

  pipe<U>(stage: (data: T) => U | Promise<U>): DataPipeline<T, U> {
    const pipeline = this as unknown as DataPipeline<T, U>
    pipeline.stages = [...this.stages, stage as unknown as (data: T) => T | Promise<T>]
    return pipeline
  }

  async execute(initialData: T): Promise<R> {
    let data: T = initialData

    for (const stage of this.stages) {
      try {
        data = await Promise.resolve(stage(data))
      } catch (error) {
        for (const handler of this.errorHandlers) {
          handler(error as Error)
        }
        throw error
      }
    }

    return data as unknown as R
  }

  onError(handler: (error: Error) => void): this {
    this.errorHandlers.push(handler)
    return this
  }
}

export function createPipeline<T>(): DataPipeline<T, T> {
  return new DataPipeline<T, T>()
}

export class ChunkProcessor<T> {
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  static unchunk<T>(chunks: T[][]): T[] {
    return chunks.flat()
  }

  static mapChunk<T, U>(
    array: T[],
    size: number,
    mapper: (chunk: T[], index: number) => U
  ): U[] {
    const chunks = this.chunk(array, size)
    return chunks.map(mapper)
  }

  static async mapChunkAsync<T, U>(
    array: T[],
    size: number,
    mapper: (chunk: T[], index: number) => Promise<U>
  ): Promise<U[]> {
    const chunks = this.chunk(array, size)
    return Promise.all(chunks.map(mapper))
  }
}

export class StreamProcessor<T> {
  private data: T[] = []
  private pipelines: Array<(data: T) => T | Promise<T>> = []

  push(...items: T[]): this {
    this.data.push(...items)
    return this
  }

  pipe(transformer: (data: T) => T | Promise<T>): this {
    this.pipelines.push(transformer)
    return this
  }

  async process(): Promise<T[]> {
    const results: T[] = []

    for (const item of this.data) {
      let result = item
      for (const pipeline of this.pipelines) {
        result = await Promise.resolve(pipeline(result))
      }
      results.push(result)
    }

    return results
  }

  clear(): this {
    this.data = []
    return this
  }

  reset(): this {
    this.pipelines = []
    return this
  }
}
