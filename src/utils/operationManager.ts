export type OperationType = 'save' | 'load' | 'create' | 'update' | 'delete' | 'export' | 'import' | 'sync'

export interface Operation {
  id: string
  type: OperationType
  timestamp: number
  duration?: number
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled'
  progress?: number
  data?: Record<string, unknown>
  error?: Error
}

export interface OperationQueue {
  id: string
  name: string
  operations: Operation[]
  maxConcurrent?: number
  onProgress?: (operation: Operation) => void
  onComplete?: (operation: Operation) => void
  onError?: (operation: Operation, error: Error) => void
}

export class OperationManager {
  private static instance: OperationManager
  private operations: Map<string, Operation> = new Map()
  private queues: Map<string, OperationQueue> = new Map()
  private listeners: Set<(operation: Operation) => void> = new Set()

  private constructor() {}

  static getInstance(): OperationManager {
    if (!OperationManager.instance) {
      OperationManager.instance = new OperationManager()
    }
    return OperationManager.instance
  }

  createOperation(type: OperationType, data?: Record<string, unknown>): Operation {
    const operation: Operation = {
      id: this.generateId(),
      type,
      timestamp: Date.now(),
      status: 'pending',
      data
    }

    this.operations.set(operation.id, operation)
    return operation
  }

  startOperation(id: string): void {
    const operation = this.operations.get(id)
    if (operation) {
      operation.status = 'in-progress'
      this.notifyListeners(operation)
    }
  }

  updateProgress(id: string, progress: number): void {
    const operation = this.operations.get(id)
    if (operation) {
      operation.progress = Math.min(100, Math.max(0, progress))
      this.notifyListeners(operation)
    }
  }

  completeOperation(id: string, duration?: number): void {
    const operation = this.operations.get(id)
    if (operation) {
      operation.status = 'completed'
      operation.progress = 100
      operation.duration = duration || (Date.now() - operation.timestamp)
      this.notifyListeners(operation)
    }
  }

  failOperation(id: string, error: Error): void {
    const operation = this.operations.get(id)
    if (operation) {
      operation.status = 'failed'
      operation.error = error
      this.notifyListeners(operation)
    }
  }

  cancelOperation(id: string): void {
    const operation = this.operations.get(id)
    if (operation) {
      operation.status = 'cancelled'
      this.notifyListeners(operation)
    }
  }

  getOperation(id: string): Operation | undefined {
    return this.operations.get(id)
  }

  getOperations(filter?: { type?: OperationType; status?: Operation['status'] }): Operation[] {
    let ops = Array.from(this.operations.values())

    if (filter) {
      if (filter.type) {
        ops = ops.filter(op => op.type === filter.type)
      }
      if (filter.status) {
        ops = ops.filter(op => op.status === filter.status)
      }
    }

    return ops.sort((a, b) => b.timestamp - a.timestamp)
  }

  getRecentOperations(limit: number = 10): Operation[] {
    return this.getOperations().slice(0, limit)
  }

  createQueue(
    id: string,
    name: string,
    options?: {
      maxConcurrent?: number
      onProgress?: (operation: Operation) => void
      onComplete?: (operation: Operation) => void
      onError?: (operation: Operation, error: Error) => void
    }
  ): OperationQueue {
    const queue: OperationQueue = {
      id,
      name,
      operations: [],
      maxConcurrent: options?.maxConcurrent || 1,
      onProgress: options?.onProgress,
      onComplete: options?.onComplete,
      onError: options?.onError
    }

    this.queues.set(id, queue)
    return queue
  }

  addToQueue(queueId: string, operation: Operation): void {
    const queue = this.queues.get(queueId)
    if (queue) {
      queue.operations.push(operation)
    }
  }

  async processQueue(queueId: string): Promise<void> {
    const queue = this.queues.get(queueId)
    if (!queue) return

    const pending = queue.operations.filter(op => op.status === 'pending')
    const executing: Operation[] = []

    for (const operation of pending) {
      if (executing.length >= (queue.maxConcurrent || 1)) {
        await Promise.race(executing.map(op => this.waitForOperation(op.id)))
      }

      executing.push(operation)
      this.startOperation(operation.id)

      try {
        await this.simulateOperation(operation)
        this.completeOperation(operation.id)
        queue.onComplete?.(operation)
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        this.failOperation(operation.id, err)
        queue.onError?.(operation, err)
      }

      const index = executing.indexOf(operation)
      if (index > -1) executing.splice(index, 1)
    }
  }

  private async simulateOperation(operation: Operation): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async waitForOperation(id: string): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        const op = this.operations.get(id)
        if (op && (op.status === 'completed' || op.status === 'failed' || op.status === 'cancelled')) {
          resolve()
        } else {
          setTimeout(check, 50)
        }
      }
      check()
    })
  }

  subscribe(listener: (operation: Operation) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(operation: Operation): void {
    this.listeners.forEach(listener => listener(operation))
  }

  private generateId(): string {
    return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  clearHistory(): void {
    const completed = this.getOperations({ status: 'completed' })
    completed.forEach(op => this.operations.delete(op.id))
  }

  getStats(): {
    total: number
    pending: number
    inProgress: number
    completed: number
    failed: number
    cancelled: number
  } {
    const ops = Array.from(this.operations.values())
    
    return {
      total: ops.length,
      pending: ops.filter(op => op.status === 'pending').length,
      inProgress: ops.filter(op => op.status === 'in-progress').length,
      completed: ops.filter(op => op.status === 'completed').length,
      failed: ops.filter(op => op.status === 'failed').length,
      cancelled: ops.filter(op => op.status === 'cancelled').length
    }
  }
}

export const operations = OperationManager.getInstance()

export async function trackOperation<T>(
  type: OperationType,
  fn: () => Promise<T>,
  data?: Record<string, unknown>
): Promise<T> {
  const op = operations.createOperation(type, data)
  
  try {
    operations.startOperation(op.id)
    const startTime = Date.now()
    const result = await fn()
    operations.completeOperation(op.id, Date.now() - startTime)
    return result
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    operations.failOperation(op.id, err)
    throw err
  }
}
