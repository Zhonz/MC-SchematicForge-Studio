import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cacheService } from '@/services/cacheService'

describe('CacheService', () => {
  beforeEach(() => {
    cacheService.clear()
  })

  it('should set and get cache values', () => {
    cacheService.set('test-key', 'test-value')
    expect(cacheService.get('test-key')).toBe('test-value')
  })

  it('should check if cache has key', () => {
    cacheService.set('exists', true)
    expect(cacheService.has('exists')).toBe(true)
    expect(cacheService.has('not-exists')).toBe(false)
  })

  it('should delete cache keys', () => {
    cacheService.set('to-delete', 'value')
    expect(cacheService.delete('to-delete')).toBe(true)
    expect(cacheService.get('to-delete')).toBeNull()
  })

  it('should clear all cache', () => {
    cacheService.set('key1', 'val1')
    cacheService.set('key2', 'val2')
    cacheService.clear()
    expect(cacheService.size()).toBe(0)
  })

  it('should get or set values', () => {
    let callCount = 0
    const factory = () => {
      callCount++
      return 'computed-value'
    }
    
    expect(cacheService.getOrSet('computed', factory)).toBe('computed-value')
    expect(cacheService.getOrSet('computed', () => 'different')).toBe('computed-value')
    expect(callCount).toBe(1)
  })

  it('should handle TTL expiration', async () => {
    cacheService.set('expiring', 'value', 100) // 100ms TTL
    expect(cacheService.get('expiring')).toBe('value')
    
    await new Promise(resolve => setTimeout(resolve, 150))
    
    expect(cacheService.get('expiring')).toBeNull()
  })
})
