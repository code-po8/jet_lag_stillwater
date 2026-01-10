import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalStoragePersistenceService } from '../persistence'
import type { PersistenceService } from '../persistence'

describe('PersistenceService', () => {
  let service: PersistenceService
  let mockStorage: Record<string, string>

  beforeEach(() => {
    mockStorage = {}

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key]
      }),
      clear: vi.fn(() => {
        mockStorage = {}
      }),
    })

    service = new LocalStoragePersistenceService()
  })

  describe('save and load', () => {
    it('should save and load data', () => {
      const testData = { name: 'test', value: 42 }

      service.save('test-key', testData)
      const loaded = service.load<typeof testData>('test-key')

      expect(loaded).toEqual(testData)
    })

    it('should handle complex nested objects', () => {
      const complexData = {
        players: ['Alice', 'Bob'],
        scores: { Alice: 100, Bob: 200 },
        metadata: { created: new Date().toISOString() },
      }

      service.save('complex', complexData)
      const loaded = service.load<typeof complexData>('complex')

      expect(loaded).toEqual(complexData)
    })

    it('should handle arrays', () => {
      const arrayData = [1, 2, 3, { nested: true }]

      service.save('array', arrayData)
      const loaded = service.load<typeof arrayData>('array')

      expect(loaded).toEqual(arrayData)
    })
  })

  describe('load with missing keys', () => {
    it('should return null for missing keys', () => {
      const result = service.load('nonexistent-key')

      expect(result).toBeNull()
    })
  })

  describe('remove', () => {
    it('should remove data by key', () => {
      service.save('to-remove', { data: 'value' })
      expect(service.load('to-remove')).not.toBeNull()

      service.remove('to-remove')

      expect(service.load('to-remove')).toBeNull()
    })

    it('should not throw when removing non-existent key', () => {
      expect(() => service.remove('nonexistent')).not.toThrow()
    })
  })

  describe('clear', () => {
    it('should clear all data', () => {
      service.save('key1', { value: 1 })
      service.save('key2', { value: 2 })
      service.save('key3', { value: 3 })

      service.clear()

      expect(service.load('key1')).toBeNull()
      expect(service.load('key2')).toBeNull()
      expect(service.load('key3')).toBeNull()
    })
  })

  describe('JSON serialization', () => {
    it('should handle JSON serialization correctly', () => {
      const data = {
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: { deep: { value: 'found' } },
      }

      service.save('json-test', data)
      const loaded = service.load<typeof data>('json-test')

      expect(loaded).toEqual(data)
    })

    it('should handle empty objects', () => {
      service.save('empty', {})
      expect(service.load('empty')).toEqual({})
    })

    it('should handle empty arrays', () => {
      service.save('empty-array', [])
      expect(service.load('empty-array')).toEqual([])
    })

    it('should return null for corrupted JSON', () => {
      mockStorage['corrupted'] = 'not valid json {'

      const result = service.load('corrupted')

      expect(result).toBeNull()
    })
  })

  describe('key prefixing', () => {
    it('should prefix keys to avoid collisions', () => {
      service.save('mykey', { data: 'value' })

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'jet-lag-stillwater:mykey',
        expect.any(String)
      )
    })
  })
})
