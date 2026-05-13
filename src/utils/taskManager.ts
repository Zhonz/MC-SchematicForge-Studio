export type Priority = 'low' | 'normal' | 'high' | 'critical'

export interface Task<T = unknown> {
  id: string
  name: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled'
  priority: Priority
  data?: T
  createdAt: number
  startedAt?: number
  completedAt?: number
  error?: Error
  retryCount?: number
  maxRetries?: number
}

export interface TaskOptions {
  maxRetries?: number
  retryDelay?: number
  onStart?: (task: Task) => void
  onComplete?: (task: Task) => void
  onError?: (task: Task, error: Error) => void
  onProgress?: (task: Task, progress: number) => void
}

export class TaskManager<T = unknown> {
  private tasks: Map<string, Task<T>> = new Map()
  private queues: Map<Priority, Task<T>[]> = new Map([
    ['low', []],
    ['normal', []],
    ['high', []],
    ['critical', []]
  ])
  private options: Required<TaskOptions>
  private processor: ((task: Task<T>) => Promise<void>) | null = null
  private processing: boolean = false
  private listeners: Map<string, Set<(task: Task<T>) => void>> = new Map()

  constructor(options: TaskOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      onStart: options.onStart || (() => {}),
      onComplete: options.onComplete || (() => {}),
      onError: options.onError || (() => {}),
      onProgress: options.onProgress || (() => {})
    }
  }

  create(name: string, data?: T, priority: Priority = 'normal', options?: { id?: string; description?: string; maxRetries?: number }): Task<T> {
    const id = options?.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const task: Task<T> = {
      id,
      name,
      description: options?.description,
      status: 'pending',
      priority,
      data,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: options?.maxRetries || this.options.maxRetries
    }

    this.tasks.set(id, task)
    this.queues.get(priority)!.push(task)
    this.notifyListeners('created', task)

    return task
  }

  async execute(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)

    task.status = 'in-progress'
    task.startedAt = Date.now()
    this.options.onStart(task)
    this.notifyListeners('started', task)

    try {
      if (this.processor) {
        await this.processor(task)
      }

      task.status = 'completed'
      task.completedAt = Date.now()
      this.options.onComplete(task)
      this.notifyListeners('completed', task)
    } catch (error) {
      task.error = error instanceof Error ? error : new Error(String(error))
      task.retryCount = (task.retryCount || 0) + 1

      if (task.retryCount < (task.maxRetries || this.options.maxRetries)) {
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay))
        task.status = 'pending'
        return this.execute(taskId)
      }

      task.status = 'failed'
      this.options.onError(task, task.error)
      this.notifyListeners('failed', task)
      throw task.error
    }
  }

  setProcessor(processor: (task: Task<T>) => Promise<void>): void {
    this.processor = processor
  }

  getTask(taskId: string): Task<T> | undefined {
    return this.tasks.get(taskId)
  }

  getTasks(filter?: { status?: Task['status']; priority?: Priority }): Task<T>[] {
    let tasks = Array.from(this.tasks.values())

    if (filter?.status) {
      tasks = tasks.filter(t => t.status === filter.status)
    }
    if (filter?.priority) {
      tasks = tasks.filter(t => t.priority === filter.priority)
    }

    return tasks.sort((a, b) => b.createdAt - a.createdAt)
  }

  getPendingTasks(): Task<T>[] {
    return this.getTasks({ status: 'pending' })
  }

  getCompletedTasks(): Task<T>[] {
    return this.getTasks({ status: 'completed' })
  }

  getFailedTasks(): Task<T>[] {
    return this.getTasks({ status: 'failed' })
  }

  cancel(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false

    task.status = 'cancelled'
    this.notifyListeners('cancelled', task)

    const queue = this.queues.get(task.priority)
    if (queue) {
      const index = queue.findIndex(t => t.id === taskId)
      if (index !== -1) {
        queue.splice(index, 1)
      }
    }

    return true
  }

  remove(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false

    this.cancel(taskId)
    return this.tasks.delete(taskId)
  }

  retry(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'failed') return false

    task.status = 'pending'
    task.error = undefined
    task.retryCount = 0
    this.queues.get(task.priority)!.push(task)
    this.notifyListeners('retry', task)

    return true
  }

  clear(filter?: { status?: Task['status']; olderThan?: number }): number {
    let tasks = Array.from(this.tasks.values())

    if (filter?.status) {
      tasks = tasks.filter(t => t.status === filter.status)
    }
    if (filter?.olderThan) {
      const cutoff = Date.now() - filter.olderThan
      tasks = tasks.filter(t => t.createdAt < cutoff)
    }

    tasks.forEach(task => this.remove(task.id))
    return tasks.length
  }

  subscribe(event: 'created' | 'started' | 'completed' | 'failed' | 'cancelled' | 'retry', listener: (task: Task<T>) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)

    return () => {
      this.listeners.get(event)?.delete(listener)
    }
  }

  private notifyListeners(event: string, task: Task<T>): void {
    this.listeners.get(event)?.forEach(listener => listener(task))
  }

  getStats(): {
    total: number
    pending: number
    inProgress: number
    completed: number
    failed: number
    byPriority: Record<Priority, number>
  } {
    const tasks = Array.from(this.tasks.values())
    const byPriority: Record<Priority, number> = { low: 0, normal: 0, high: 0, critical: 0 }

    tasks.forEach(task => {
      byPriority[task.priority]++
    })

    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      byPriority
    }
  }
}

export const taskManager = new TaskManager()

export function createTask<T>(name: string, data?: T, priority?: Priority): Task<T> {
  return taskManager.create(name, data, priority) as Task<T>
}

export function executeTask<T>(taskId: string): Promise<void> {
  return taskManager.execute(taskId)
}
