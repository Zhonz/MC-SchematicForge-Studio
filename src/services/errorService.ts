import { AppError, ErrorSeverity, OperationResult } from '@/types'

class ErrorService {
  private errors: AppError[] = []
  private maxErrors = 100
  private subscribers: ((error: AppError) => void)[] = []

  createError(
    code: string,
    message: string,
    severity: ErrorSeverity = 'medium',
    context?: Record<string, unknown>
  ): AppError {
    const error: AppError = {
      code,
      message,
      severity,
      timestamp: Date.now(),
      context,
      stack: new Error().stack
    }
    return error
  }

  handleError(error: AppError | Error, context?: Record<string, unknown>): AppError {
    let appError: AppError

    if ('code' in error && 'severity' in error) {
      appError = error as AppError
    } else {
      appError = this.createError(
        'UNKNOWN_ERROR',
        error.message || 'An unknown error occurred',
        'high',
        { ...context, originalError: error }
      )
    }

    this.errors.push(appError)
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    this.subscribers.forEach(callback => callback(appError))

    console.error(`[${appError.severity.toUpperCase()}] ${appError.code}: ${appError.message}`, appError.context)

    return appError
  }

  wrapOperation<T>(
    operation: () => T,
    errorCode: string = 'OPERATION_FAILED',
    context?: Record<string, unknown>
  ): OperationResult<T> {
    try {
      const data = operation()
      return { success: true, data }
    } catch (error) {
      const appError = this.handleError(
        this.createError(errorCode, (error as Error).message, 'high', context)
      )
      return { success: false, error: appError }
    }
  }

  async wrapAsyncOperation<T>(
    operation: () => Promise<T>,
    errorCode: string = 'ASYNC_OPERATION_FAILED',
    context?: Record<string, unknown>
  ): Promise<OperationResult<T>> {
    try {
      const data = await operation()
      return { success: true, data }
    } catch (error) {
      const appError = this.handleError(
        this.createError(errorCode, (error as Error).message, 'high', context)
      )
      return { success: false, error: appError }
    }
  }

  subscribe(callback: (error: AppError) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback)
    }
  }

  getErrors(): AppError[] {
    return [...this.errors]
  }

  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errors.filter(e => e.severity === severity)
  }

  clearErrors(): void {
    this.errors = []
  }
}

export const errorService = new ErrorService()
