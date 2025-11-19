interface CacheEntry<V> {
  value: V;
  timestamp: number;
  accessOrder: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  currentSize: number;
  maxSize: number;
  evictions: number;
  averageResponseTime: number;
  totalRequests: number;
}

export class LRUCache<K, V> {
  private capacity: number;
  private ttl: number;
  private cache: Map<K, CacheEntry<V>>;
  private accessCounter: number = 0;

  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    currentSize: 0,
    maxSize: 0,
    evictions: 0,
    averageResponseTime: 0,
    totalRequests: 0,
  };

  private responseTimes: number[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(capacity: number, ttlSeconds: number = 60) {
    this.capacity = capacity;
    this.ttl = ttlSeconds * 1000;
    this.cache = new Map();
    this.stats.maxSize = capacity;

    this.startCleanupTask();
  }

  get(key: K): V | undefined {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.recordResponseTime(Date.now() - startTime);
      return undefined;
    }

    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      this.stats.currentSize = this.cache.size;
      this.stats.misses++;
      this.recordResponseTime(Date.now() - startTime);
      return undefined;
    }

    this.cache.delete(key);
    entry.accessOrder = ++this.accessCounter;
    this.cache.set(key, entry);

    this.stats.hits++;
    this.recordResponseTime(Date.now() - startTime);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    const entry: CacheEntry<V> = {
      value,
      timestamp: Date.now(),
      accessOrder: ++this.accessCounter,
    };

    this.cache.set(key, entry);
    this.stats.currentSize = this.cache.size;

    if (this.cache.size > this.capacity) {
      this.evictOldest();
    }
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      this.stats.currentSize = this.cache.size;
      return false;
    }

    return true;
  }

  remove(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.currentSize = this.cache.size;
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats.currentSize = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
    this.stats.totalRequests = 0;
    this.stats.averageResponseTime = 0;
    this.responseTimes = [];
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private evictOldest(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
      this.stats.evictions++;
      this.stats.currentSize = this.cache.size;
    }
  }

  private recordResponseTime(time: number): void {
    this.responseTimes.push(time);

    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.stats.averageResponseTime = sum / this.responseTimes.length;
  }

  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToRemove: K[] = [];

      for (const [key, entry] of this.cache.entries()) {
        const isExpired = now - entry.timestamp > this.ttl;
        if (isExpired) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        this.cache.delete(key);
      }

      this.stats.currentSize = this.cache.size;
    }, 10000);
  }
}
