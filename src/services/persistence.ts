/**
 * Persistence Service Abstraction
 *
 * Provides a swappable storage layer. Currently uses localStorage,
 * but can be replaced with Supabase or other backends later.
 */

/**
 * Generic persistence interface for storing and retrieving data.
 * Implementations can use localStorage, IndexedDB, Supabase, etc.
 */
export interface PersistenceService {
  /**
   * Save data to storage
   * @param key - Unique key for the data
   * @param data - Data to store (will be JSON serialized)
   */
  save<T>(key: string, data: T): void

  /**
   * Load data from storage
   * @param key - Key to retrieve
   * @returns The stored data, or null if not found
   */
  load<T>(key: string): T | null

  /**
   * Remove data from storage
   * @param key - Key to remove
   */
  remove(key: string): void

  /**
   * Clear all data from storage (within this app's namespace)
   */
  clear(): void
}

const STORAGE_PREFIX = 'jet-lag-stillwater:'

/**
 * LocalStorage implementation of PersistenceService.
 * Prefixes all keys to avoid collisions with other apps.
 */
export class LocalStoragePersistenceService implements PersistenceService {
  private getFullKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`
  }

  save<T>(key: string, data: T): void {
    const serialized = JSON.stringify(data)
    localStorage.setItem(this.getFullKey(key), serialized)
  }

  load<T>(key: string): T | null {
    const fullKey = this.getFullKey(key)
    const data = localStorage.getItem(fullKey)

    if (data === null) {
      return null
    }

    try {
      return JSON.parse(data) as T
    } catch {
      // Return null for corrupted/invalid JSON
      return null
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getFullKey(key))
  }

  clear(): void {
    localStorage.clear()
  }
}

/**
 * Create a new persistence service instance.
 * Factory function to allow easy swapping of implementations.
 */
export function createPersistenceService(): PersistenceService {
  return new LocalStoragePersistenceService()
}
