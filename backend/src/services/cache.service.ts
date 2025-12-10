import { LRUCache } from 'lru-cache';
import { logger } from '../utils/logger.js';

/**
 * LRU Cache service for storing generated transition metadata
 * Prevents regenerating the same transitions
 */

export interface CacheEntry {
  transitionId: string;
  filePath: string;
  createdAt: number;
}

class CacheService {
  private cache: LRUCache<string, CacheEntry>;

  constructor(maxSize: number = 100) {
    this.cache = new LRUCache<string, CacheEntry>({
      max: maxSize,
      ttl: 1000 * 60 * 60 * 24, // 24 hours
      updateAgeOnGet: true,
    });

    logger.info({ maxSize }, 'Cache service initialized');
  }

  /**
   * Get cached entry by key
   */
  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      logger.debug({ key }, 'Cache hit');
    } else {
      logger.debug({ key }, 'Cache miss');
    }
    return entry;
  }

  /**
   * Set cache entry
   */
  set(key: string, value: CacheEntry): void {
    this.cache.set(key, value);
    logger.debug({ key, transitionId: value.transitionId }, 'Cache entry set');
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
    logger.debug({ key }, 'Cache entry deleted');
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
    };
  }
}

// Singleton instance
export const cacheService = new CacheService(100);


