import { describe, it, expect, beforeEach } from 'vitest'
import { logger } from '@/services/loggerService'

describe('LoggerService', () => {
  beforeEach(() => {
    logger.clearLogs()
  })

  it('should log messages at different levels', () => {
    const initialLength = logger.getLogs().length
    
    logger.debug('Debug message')
    logger.info('Info message')
    logger.warn('Warning message')
    logger.error('Error message')
    
    expect(logger.getLogs()).toHaveLength(initialLength + 4)
  })

  it('should filter logs by level', () => {
    logger.info('Filter test 1')
    logger.error('Filter test 2')
    
    const infoLogs = logger.getLogsByLevel('info')
    const errorLogs = logger.getLogsByLevel('error')
    
    expect(infoLogs.length).toBeGreaterThan(0)
    expect(errorLogs.length).toBeGreaterThan(0)
  })

  it('should export logs as JSON', () => {
    logger.info('Export test')
    const exported = logger.exportLogs()
    expect(typeof exported).toBe('string')
    expect(() => JSON.parse(exported)).not.toThrow()
  })

  it('should set minimum log level', () => {
    logger.setMinLevel('warn')
    logger.debug('This should be filtered')
    logger.warn('This should be logged')
    
    const debugLogs = logger.getLogsByLevel('debug')
    const warnLogs = logger.getLogsByLevel('warn')
    
    expect(debugLogs.length).toBe(0)
    expect(warnLogs.length).toBeGreaterThan(0)
  })
})
