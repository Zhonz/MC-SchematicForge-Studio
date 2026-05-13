export interface WorkerTask<T = unknown, R = unknown> {
  id: string
  task: () => Promise<R>
  resolve: (value: R) => void
  reject: (error: Error) => void
}

export interface PoolOptions {
  maxQueueSize?: number
  taskTimeout?: number
  onWorkerError?: (workerId: string, error: Error) => void
  onWorkerCreated?: (workerId: string) => void
  onWorkerDestroyed?: (workerId: string) => void
}

interface PoolWorker {
  id: string
  status: 'idle' | 'busy' | 'error'
  currentTask: string | null
  errorCount: number
}

export class WorkerPool {
  private workers: Map<string, PoolWorker> = new Map()
  private idleWorkers: Set<string> = new Set()
  private busyWorkers: Set<string> = new Set()
  private taskQueue: WorkerTask[] = []
  private options: Required<PoolOptions>
  private workerCounter: number = 0
  private destroyed: boolean = false

  constructor(options: PoolOptions = {}) {
    this.options = {
      maxQueueSize: options.maxQueueSize ?? 100,
      taskTimeout: options.taskTimeout ?? 30000,
      onWorkerError: options.onWorkerError ?? (() => {}),
      onWorkerCreated: options.onWorkerCreated ?? (() => {}),
      onWorkerDestroyed: options.onWorkerDestroyed ?? (() => {})
    }
  }

  private createWorker(): string {
    const workerId = `worker_${++this.workerCounter}`
    const worker: PoolWorker = {
      id: workerId,
      status: 'idle',
      currentTask: null,
      errorCount: 0
    }

    this.workers.set(workerId, worker)
    this.idleWorkers.add(workerId)
    this.options.onWorkerCreated(workerId)

    return workerId
  }

  private removeWorker(workerId: string): void {
    if (this.workers.has(workerId)) {
      this.workers.delete(workerId)
      this.idleWorkers.delete(workerId)
      this.busyWorkers.delete(workerId)
      this.options.onWorkerDestroyed(workerId)
    }
  }

  async execute<T, R = unknown>(task: () => Promise<R>, taskId?: string): Promise<R> {
    if (this.destroyed) {
      throw new Error('Worker pool has been destroyed')
    }

    const id = taskId || `task_${Date.now()}_${Math.random().toString(36).slice(2)}`

    return new Promise<R>((resolve, reject) => {
      if (this.taskQueue.length >= this.options.maxQueueSize) {
        reject(new Error('Task queue is full'))
        return
      }

      this.taskQueue.push({
        id,
        task,
        resolve: resolve as (value: unknown) => void,
        reject
      })

      this.processNext()
    })
  }

  private async processNext(): Promise<void> {
    if (this.taskQueue.length === 0) return

    if (this.idleWorkers.size === 0) {
      this.createWorker()
    }

    const workerId = Array.from(this.idleWorkers)[0]
    if (!workerId) return

    const workerTask = this.taskQueue.shift()
    if (!workerTask) return

    this.assignTask(workerId, workerTask)
  }

  private async assignTask(workerId: string, workerTask: WorkerTask): Promise<void> {
    const worker = this.workers.get(workerId)
    if (!worker) return

    this.idleWorkers.delete(workerId)
    this.busyWorkers.add(workerId)
    worker.status = 'busy'
    worker.currentTask = workerTask.id

    const timeoutId = setTimeout(() => {
      workerTask.reject(new Error(`Task ${workerTask.id} timed out`))
      this.markWorkerIdle(workerId)
    }, this.options.taskTimeout)

    try {
      const result = await workerTask.task()
      clearTimeout(timeoutId)
      workerTask.resolve(result)
    } catch (error) {
      clearTimeout(timeoutId)
      workerTask.reject(error as Error)
      worker.errorCount++
    }

    this.markWorkerIdle(workerId)
  }

  private markWorkerIdle(workerId: string): void {
    const worker = this.workers.get(workerId)
    if (!worker) return

    this.busyWorkers.delete(workerId)
    this.idleWorkers.add(workerId)
    worker.status = 'idle'
    worker.currentTask = null

    if (worker.errorCount >= 3) {
      this.removeWorker(workerId)
    }

    this.processNext()
  }

  getStats(): {
    totalWorkers: number
    idleWorkers: number
    busyWorkers: number
    queueLength: number
  } {
    return {
      totalWorkers: this.workers.size,
      idleWorkers: this.idleWorkers.size,
      busyWorkers: this.busyWorkers.size,
      queueLength: this.taskQueue.length
    }
  }

  getWorkerStatus(workerId: string): 'idle' | 'busy' | 'error' | null {
    return this.workers.get(workerId)?.status ?? null
  }

  async destroy(): Promise<void> {
    this.destroyed = true
    this.taskQueue = []

    for (const [workerId] of this.workers) {
      this.removeWorker(workerId)
    }

    this.workers.clear()
    this.idleWorkers.clear()
    this.busyWorkers.clear()
  }
}

export class TaskScheduler {
  private tasks: Map<string, { fn: () => void; interval: number; timeoutId: ReturnType<typeof setTimeout> }> = new Map()
  private isRunning: boolean = false

  schedule(id: string, fn: () => void, intervalMs: number): void {
    if (this.tasks.has(id)) {
      this.cancel(id)
    }

    const scheduleNext = (): void => {
      const timeoutId = setTimeout(() => {
        fn()
        scheduleNext()
      }, intervalMs)

      this.tasks.get(id)!.timeoutId = timeoutId
    }

    this.tasks.set(id, { fn, interval: intervalMs, timeoutId: null as unknown as ReturnType<typeof setTimeout> })
    scheduleNext()
  }

  cancel(id: string): void {
    const task = this.tasks.get(id)
    if (task) {
      clearTimeout(task.timeoutId)
      this.tasks.delete(id)
    }
  }

  cancelAll(): void {
    for (const task of this.tasks.values()) {
      clearTimeout(task.timeoutId)
    }
    this.tasks.clear()
  }

  getScheduledTasks(): string[] {
    return Array.from(this.tasks.keys())
  }

  isScheduled(id: string): boolean {
    return this.tasks.has(id)
  }
}
