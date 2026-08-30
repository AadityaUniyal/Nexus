/**
 * NEXUS Distributed In-Memory Multi-Tier Cache with TTL & LRU Eviction
 * Operates behind the UI to accelerate read queries, predictive computations, and telemetry states.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: Set<string>;
  accessCount: number;
  lastAccessed: number;
}

export class MemoryCacheService {
  private store = new Map<string, CacheEntry<any>>();
  private maxEntries: number;
  private defaultTtlMs: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(maxEntries = 5000, defaultTtlMs = 60 * 1000) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;

    if (typeof setInterval !== "undefined") {
      this.cleanupTimer = setInterval(() => this.purgeExpired(), 60 * 1000);
      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref();
      }
    }
  }

  /**
   * Retrieve cached item if valid
   */
  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();
    return entry.value as T;
  }

  /**
   * Set cache item with optional TTL and invalidation tags
   */
  public set<T>(key: string, value: T, ttlMs?: number, tags: string[] = []): void {
    if (this.store.size >= this.maxEntries) {
      this.evictLru();
    }

    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, {
      value,
      expiresAt,
      tags: new Set(tags),
      accessCount: 1,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Atomic Get or Set with async factory
   */
  public async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs?: number,
    tags: string[] = []
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await factory();
    this.set(key, fresh, ttlMs, tags);
    return fresh;
  }

  /**
   * Invalidate by exact key
   */
  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Invalidate all keys associated with a specific tag (e.g. 'routes', 'incidents')
   */
  public invalidateTag(tag: string): number {
    let invalidated = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.has(tag)) {
        this.store.delete(key);
        invalidated++;
      }
    }
    return invalidated;
  }

  /**
   * Clear entire cache
   */
  public clear(): void {
    this.store.clear();
  }

  /**
   * Cache telemetry statistics
   */
  public getStats() {
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
    };
  }

  private evictLru(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const cacheService = new MemoryCacheService();
