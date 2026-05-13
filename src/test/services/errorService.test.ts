import { describe, it, expect, beforeEach, vi } from 'vitest'
import { errorService } from '@/services/errorService'

describe('ErrorService', () => {
  beforeEach(() => {
    errorService.clearErrors()
  })

  it('should create an error with correct properties', () => {
    const error = errorService.createError('TEST_ERROR', 'Test message', 'medium')
    expect(error.code).toBe('TEST_ERROR')
    expect(error.message).toBe('Test message')
    expect(error.severity).toBe('medium')
    expect(error.timestamp).toBeDefined()
  })

  it('should handle errors and store them', () => {
    const initialLength = errorService.getErrors().length
    errorService.handleError(
      errorService.createError('NEW_ERROR', 'Another test', 'high')
    )
    expect(errorService.getErrors()).toHaveLength(initialLength + 1)
  })

  it('should wrap operations and return success', () => {
    const result = errorService.wrapOperation(() => 42)
    expect(result.success).toBe(true)
    expect(result.data).toBe(42)
  })

  it('should wrap operations and handle errors', () => {
    const result = errorService.wrapOperation(() => {
      throw new Error('Oops')
    })
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should get errors by severity', () => {
    errorService.handleError(errorService.createError('ERROR_1', 'Low error', 'low'))
    errorService.handleError(errorService.createError('ERROR_2', 'High error', 'high'))
    
    const lowErrors = errorService.getErrorsBySeverity('low')
    const highErrors = errorService.getErrorsBySeverity('high')
    
    expect(lowErrors.length).toBeGreaterThan(0)
    expect(highErrors.length).toBeGreaterThan(0)
  })
})
