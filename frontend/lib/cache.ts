/**
 * In-memory server-side cache
 *
 * Acts as a second layer on top of Next.js fetch revalidation.
 * Prevents duplicate in-flight requests for the same cache key
 * within a single server process (useful during SSR of concurrent pages).
 *
 * TTL defaults match Next.js revalidate values so they stay in sync.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class ServerCache {
    private store = new Map<string, CacheEntry<unknown>>();

    /**
     * Get a cached value, or null if missing / expired.
     */
    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.data as T;
    }

    /**
     * Store a value with a TTL in seconds (default 5 minutes).
     */
    set<T>(key: string, data: T, ttlSeconds = 300): void {
        this.store.set(key, {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    /**
     * Evict a specific key immediately.
     */
    delete(key: string): void {
        this.store.delete(key);
    }

    /**
     * Evict all expired entries (call periodically in long-running servers).
     */
    prune(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Returns how many live entries are currently held.
     */
    size(): number {
        return this.store.size;
    }

    /**
     * Wrap an async factory: returns cached data if fresh, otherwise
     * calls the factory, stores the result, and returns it.
     *
     * @param key       - Cache key
     * @param factory   - Async function that produces the value
     * @param ttl       - TTL in seconds (default 300)
     */
    async getOrSet<T>(key: string, factory: () => Promise<T>, ttl = 300): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) return cached;

        const data = await factory();
        this.set(key, data, ttl);
        return data;
    }
}

// Module-level singleton — shared across all server-side calls
// in the same Node.js process (including RSC and Route Handlers).
export const serverCache = new ServerCache();
