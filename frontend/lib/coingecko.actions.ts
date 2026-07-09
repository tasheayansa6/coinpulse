'use server';

import qs from 'query-string';
import { serverCache } from '@/lib/cache';
import { CoinGeckoError } from '@/lib/errors';
import type {
    CoinMarketData,
    CoinDetailsData,
    OHLCData,
    TrendingResponse,
    Category,
    SimplePriceResponse,
    SearchResult,
    PoolData,
} from '@/lib/types';

// ─────────────────────────────────────────────────────
// Environment
// ─────────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL?.replace(/\/$/, '');
const CG_BASE_URL = process.env.COINGECKO_BASE_URL ?? 'https://api.coingecko.com/api/v3';
const CG_API_KEY  = process.env.COINGECKO_API_KEY;

// ─────────────────────────────────────────────────────
// Core fetcher
// ─────────────────────────────────────────────────────
export async function fetcher<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    revalidate = 300,
): Promise<T> {
    const isAbsolute = endpoint.startsWith('http');
    const baseUrl    = BACKEND_URL
        ? `${BACKEND_URL}/api`
        : isAbsolute ? '' : CG_BASE_URL;

    const url = qs.stringifyUrl(
        {
            url: isAbsolute && !BACKEND_URL
                ? endpoint
                : `${baseUrl}/${endpoint.replace(/^\//, '')}`,
            query: params as Record<string, string | number | boolean | null | undefined>,
        },
        { skipNull: true, skipEmptyString: true },
    );

    const headers: Record<string, string> = { Accept: 'application/json' };

    if (!BACKEND_URL && CG_API_KEY) {
        const headerName = CG_API_KEY.startsWith('CG-')
            ? 'x-cg-demo-api-key'
            : 'x-cg-pro-api-key';
        headers[headerName] = CG_API_KEY;
    }

    const response = await fetch(url, { headers, next: { revalidate } });

    if (response.status === 429) {
        console.warn('[CoinPulse] Rate limited — retrying after 2s');
        await new Promise((r) => setTimeout(r, 2000));
        const retry = await fetch(url, { headers, next: { revalidate } });
        if (!retry.ok) {
            const body = await retry.json().catch(() => ({})) as Record<string, unknown>;
            throw new CoinGeckoError(retry.status, (body?.error as string) ?? retry.statusText, url);
        }
        return unwrap<T>(await retry.json());
    }

    if (!response.ok) {
        const body = await response.json().catch(() => ({})) as Record<string, unknown>;
        throw new CoinGeckoError(response.status, (body?.error as string) ?? response.statusText, url);
    }

    return unwrap<T>(await response.json());
}

/** Unwrap backend envelope { success, data, cached, timestamp } → T */
function unwrap<T>(json: unknown): T {
    if (
        BACKEND_URL &&
        typeof json === 'object' &&
        json !== null &&
        'data' in json
    ) {
        return (json as { data: T }).data;
    }
    return json as T;
}

// ─────────────────────────────────────────────────────
// Markets
// ─────────────────────────────────────────────────────
export async function getMarkets(
    page = 1,
    perPage = 10,
    currency = 'usd',
): Promise<CoinMarketData[]> {
    const cacheKey = `markets:${currency}:${page}:${perPage}`;
    return serverCache.getOrSet(
        cacheKey,
        () => fetcher<CoinMarketData[]>(BACKEND_URL ? 'coins' : 'coins/markets', {
            page,
            per_page: perPage,
            currency,
            vs_currency: currency,
            order: 'market_cap_desc',
            sparkline: false,
        }),
        300,
    );
}

// ─────────────────────────────────────────────────────
// Coin Details
// ─────────────────────────────────────────────────────
export async function getCoin(id: string): Promise<CoinDetailsData | null> {
    const cacheKey = `coin:${id}`;
    return serverCache.getOrSet(
        cacheKey,
        async () => {
            try {
                return await fetcher<CoinDetailsData>(
                    `coins/${id}`,
                    BACKEND_URL ? undefined : {
                        localization: false,
                        tickers: true,
                        market_data: true,
                        community_data: false,
                        developer_data: false,
                        sparkline: false,
                    },
                );
            } catch {
                return null;
            }
        },
        300,
    );
}

// ─────────────────────────────────────────────────────
// OHLC
// ─────────────────────────────────────────────────────
export async function getOHLC(
    coinId: string,
    days: number | 'max' = 1,
    currency = 'usd',
): Promise<OHLCData[]> {
    const cacheKey = `ohlc:${coinId}:${days}:${currency}`;
    const ttl = days === 1 || days === 7 ? 60 : 300;
    return serverCache.getOrSet(
        cacheKey,
        async () => {
            try {
                return await fetcher<OHLCData[]>(
                    `coins/${coinId}/ohlc`,
                    { days, currency, vs_currency: currency },
                );
            } catch {
                return [] as OHLCData[];
            }
        },
        ttl,
    );
}

// ─────────────────────────────────────────────────────
// Trending
// ─────────────────────────────────────────────────────
export async function getTrendingCoins(): Promise<TrendingResponse | null> {
    return serverCache.getOrSet(
        'trending',
        async () => {
            try {
                return await fetcher<TrendingResponse>(
                    BACKEND_URL ? 'coins/trending' : 'search/trending',
                );
            } catch {
                return null;
            }
        },
        300,
    );
}

// ─────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
    return serverCache.getOrSet(
        'categories',
        async () => {
            try {
                return await fetcher<Category[]>('coins/categories');
            } catch {
                return [] as Category[];
            }
        },
        600,
    );
}

// ─────────────────────────────────────────────────────
// Pools (GeckoTerminal)
// ─────────────────────────────────────────────────────
export async function getPools(
    coinId: string,
    network?: string | null,
    contractAddress?: string | null,
): Promise<PoolData | null> {
    const cacheKey = `pool:${network ?? 'eth'}:${contractAddress ?? coinId}`;
    return serverCache.getOrSet(
        cacheKey,
        async () => {
            try {
                if (BACKEND_URL) {
                    return await fetcher<PoolData>('pools', {
                        coin_id: coinId,
                        ...(network      && { network }),
                        ...(contractAddress && { address: contractAddress }),
                    });
                }
                // Direct GeckoTerminal fallback
                const gtBase = 'https://api.geckoterminal.com/api/v2';
                if (network && contractAddress) {
                    const res = await fetch(
                        `${gtBase}/networks/${network}/pools/${contractAddress}`,
                        { headers: { Accept: 'application/json' }, next: { revalidate: 300 } },
                    );
                    if (!res.ok) return null;
                    const json = await res.json() as { data?: PoolData };
                    return json?.data ?? null;
                }
                const url = qs.stringifyUrl(
                    { url: `${gtBase}/search/pools`, query: { query: coinId, network: 'eth', page: 1 } },
                    { skipNull: true },
                );
                const res = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    next: { revalidate: 300 },
                });
                if (!res.ok) return null;
                const json = await res.json() as { data?: PoolData[] };
                return json?.data?.[0] ?? null;
            } catch {
                return null;
            }
        },
        300,
    );
}

// ─────────────────────────────────────────────────────
// Simple Price
// ─────────────────────────────────────────────────────
export async function getSimplePrice(
    ids: string[],
    vsCurrencies = 'usd',
): Promise<SimplePriceResponse> {
    const cacheKey = `simple-price:${ids.join(',')}:${vsCurrencies}`;
    return serverCache.getOrSet(
        cacheKey,
        async () => {
            try {
                return await fetcher<SimplePriceResponse>(
                    BACKEND_URL ? 'coins/price' : 'simple/price',
                    BACKEND_URL
                        ? { ids: ids.join(','), currencies: vsCurrencies }
                        : { ids: ids.join(','), vs_currencies: vsCurrencies },
                );
            } catch {
                return {} as SimplePriceResponse;
            }
        },
        60,
    );
}

// ─────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────
export async function searchCoins(query: string): Promise<SearchResult | null> {
    if (!query.trim()) return null;
    const cacheKey = `search:${query.trim().toLowerCase()}`;
    return serverCache.getOrSet(
        cacheKey,
        async () => {
            try {
                return await fetcher<SearchResult>(
                    BACKEND_URL ? 'coins/search' : 'search',
                    { q: query.trim(), query: query.trim() },
                );
            } catch {
                return null;
            }
        },
        120,
    );
}
