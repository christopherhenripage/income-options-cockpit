// In-memory cache with TTL support
// For production, consider using Redis (Upstash) for distributed caching

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  private defaultTtlMs: number;

  constructor(defaultTtlMs: number = 5 * 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs;

    // Periodic cleanup of expired entries
    setInterval(() => this.cleanup(), 60000);
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { value, expiresAt });
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, entry] of entries) {
      if (entry.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  // Get cache stats
  stats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

// Memoization helper with cache
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: {
    ttlMs?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T {
  const cache = new Cache<ReturnType<T>>(options.ttlMs);
  const keyGen = options.keyGenerator || ((...args) => JSON.stringify(args));

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGen(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

// Async memoization helper
export function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: {
    ttlMs?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T {
  const cache = new Cache<Awaited<ReturnType<T>>>(options.ttlMs);
  const pendingCache = new Map<string, Promise<Awaited<ReturnType<T>>>>();
  const keyGen = options.keyGenerator || ((...args) => JSON.stringify(args));

  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = keyGen(...args);

    // Check cache first
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Check if there's a pending request for the same key
    const pending = pendingCache.get(key);
    if (pending) {
      return pending;
    }

    // Execute and cache
    const promise = fn(...args).then((result) => {
      cache.set(key, result as Awaited<ReturnType<T>>);
      pendingCache.delete(key);
      return result as Awaited<ReturnType<T>>;
    });

    pendingCache.set(key, promise as Promise<Awaited<ReturnType<T>>>);
    return promise as Promise<Awaited<ReturnType<T>>>;
  }) as T;
}

// Pre-configured caches for different data types
export const symbolSignalsCache = new Cache(5 * 60 * 1000); // 5 min TTL
export const marketRegimeCache = new Cache(5 * 60 * 1000); // 5 min TTL
export const optionChainCache = new Cache(60 * 1000); // 1 min TTL for real-time data
export const quoteCache = new Cache(30 * 1000); // 30 sec TTL for quotes
