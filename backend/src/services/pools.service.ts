import { gtFetch } from '../lib/httpClient';
import { cache } from '../lib/cache';
import { NotFoundError } from '../lib/errors';
import type { PoolData } from '../types/coingecko';

// ─────────────────────────────────────────────────────
// Single pool by network + address
// ─────────────────────────────────────────────────────
export async function getPool(
    coinId: string,
    network?: string | null,
    contractAddress?: string | null,
) {
    const cacheKey = `pool:${network ?? 'search'}:${contractAddress ?? coinId}`;

    const result = await cache.getOrSet<PoolData | null>(
        cacheKey,
        async () => {
            // Direct lookup if we have network + address
            if (network && contractAddress) {
                const res = await gtFetch<{ data: PoolData }>(
                    `networks/${network}/pools/${contractAddress}`,
                );
                return res?.data ?? null;
            }

            // Fallback: search by coin ID on Ethereum
            const res = await gtFetch<{ data: PoolData[] }>('search/pools', {
                query: coinId,
                network: 'eth',
                page: 1,
            });
            return res?.data?.[0] ?? null;
        },
        300,
    );

    if (!result.data) throw new NotFoundError(`Pool for coin "${coinId}"`);
    return result;
}

// ─────────────────────────────────────────────────────
// Top pools for a token on a given network
// ─────────────────────────────────────────────────────
export async function getTopPools(network: string, tokenAddress: string, page = 1) {
    const cacheKey = `top-pools:${network}:${tokenAddress}:${page}`;

    return cache.getOrSet<PoolData[]>(
        cacheKey,
        async () => {
            const res = await gtFetch<{ data: PoolData[] }>(
                `networks/${network}/tokens/${tokenAddress}/pools`,
                { page },
            );
            return res?.data ?? [];
        },
        300,
    );
}
