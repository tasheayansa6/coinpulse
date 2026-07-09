/**
 * Two-tier cache:
 *   1. Redis  — shared across all instances (requires REDIS_URL)
 *   2. In-memory Map — single-process fallback, zero deps
 *
 * If REDIS_URL is set but Redis is unreachable, the driver automatically
 * falls back to in-memory so the app stays alive.
 */

import { config } from '../config';

// ─────────────────────────────────────────────────────
// Shared interface
// ─────────────────────────────────────────────────────
export interface CacheDriver {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
    del(key: string): Promise<void>;
    getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttl: number,
    ): Promise<{ data: T; cached: boolean }>;
}

// ─────────────────────────────────────────────────────
// In-memory driver
// ─────────────────────────────────────────────────────
class MemoryDriver implements CacheDriver {
    private store = new Map<string, { data: unknown; expiresAt: number }>();

    async get<T>(key: string): Promise<T | null> {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.data as T;
    }

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
        this.store.set(key, {
            data: value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    async del(key: string): Promise<void> {
        this.store.delete(key);
    }

    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttl: number,
    ): Promise<{ data: T; cached: boolean }> {
        const cached = await this.get<T>(key);
        if (cached !== null) return { data: cached, cached: true };
        const data = await factory();
        await this.set(key, data, ttl);
        return { data, cached: false };
    }

    size(): number {
        return this.store.size;
    }

    /** Evict all expired entries — call periodically in production */
    prune(): void {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (now > entry.expiresAt) this.store.delete(key);
        }
    }
}

// ─────────────────────────────────────────────────────
// Redis driver — with automatic fallback to memory
// ─────────────────────────────────────────────────────
class RedisDriver implements CacheDriver {
    /** Underlying memory driver used when Redis is unavailable */
    private fallback = new MemoryDriver();
    private healthy = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private client: any;

    constructor(redisUrl: string) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Redis = require('ioredis');
        this.client = new Redis(redisUrl, {
            maxRetriesPerRequest: 1,
            enableReadyCheck: true,
            lazyConnect: true,
            connectTimeout: 3000,
        });

        this.client.on('ready', () => {
            this.healthy = true;
            console.log('[Cache] Redis connected ✓');
        });

        this.client.on('error', (err: Error) => {
            if (this.healthy) {
                console.warn('[Cache] Redis error — falling back to memory:', err.message);
            }
            this.healthy = false;
        });

        this.client.on('close', () => {
            this.healthy = false;
        });

        // Attempt connection (non-blocking)
        this.client.connect().catch(() => {
            console.warn('[Cache] Redis unavailable — using in-memory cache');
        });
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.healthy) return this.fallback.get<T>(key);
        try {
            const raw: string | null = await this.client.get(key);
            if (!raw) return null;
            return JSON.parse(raw) as T;
        } catch {
            return this.fallback.get<T>(key);
        }
    }

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
        if (!this.healthy) return this.fallback.set(key, value, ttlSeconds);
        try {
            await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch {
            return this.fallback.set(key, value, ttlSeconds);
        }
    }

    async del(key: string): Promise<void> {
        if (!this.healthy) return this.fallback.del(key);
        try {
            await this.client.del(key);
        } catch {
            return this.fallback.del(key);
        }
    }

    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttl: number,
    ): Promise<{ data: T; cached: boolean }> {
        const cached = await this.get<T>(key);
        if (cached !== null) return { data: cached, cached: true };
        const data = await factory();
        await this.set(key, data, ttl);
        return { data, cached: false };
    }

    async quit(): Promise<void> {
        try {
            await this.client.quit();
        } catch {
            // ignore
        }
    }

    isHealthy(): boolean {
        return this.healthy;
    }
}

// ─────────────────────────────────────────────────────
// Export the right driver based on env
// ─────────────────────────────────────────────────────
function createDriver(): CacheDriver {
    if (config.REDIS_URL) {
        console.log('[Cache] Initialising Redis driver →', config.REDIS_URL);
        return new RedisDriver(config.REDIS_URL);
    }
    console.log('[Cache] Using in-memory driver (set REDIS_URL to use Redis)');
    return new MemoryDriver();
}

export const cache = createDriver();
