import { cgFetch } from '../lib/httpClient';
import { cache } from '../lib/cache';
import { NotFoundError } from '../lib/errors';
import type {
    CoinMarketData,
    CoinDetailsData,
    OHLCData,
    TrendingResponse,
    Category,
    SimplePriceResponse,
    SearchResult,
} from '../types/coingecko';

// ─────────────────────────────────────────────────────
// Valid free-tier OHLC day values
// ─────────────────────────────────────────────────────
const VALID_OHLC_DAYS = [1, 7, 14, 30, 90, 180, 365] as const;

function snapToValidDays(days: number): number {
    return VALID_OHLC_DAYS.reduce((prev, curr) =>
        Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev,
    );
}

// ─────────────────────────────────────────────────────
// Markets
// ─────────────────────────────────────────────────────
export interface GetMarketsParams {
    page?: number;
    perPage?: number;
    currency?: string;
    order?: string;
    sparkline?: boolean;
}

export async function getMarkets(params: GetMarketsParams = {}) {
    const {
        page = 1,
        perPage = 10,
        currency = 'usd',
        order = 'market_cap_desc',
        sparkline = false,
    } = params;

    const cacheKey = `markets:${currency}:${order}:${page}:${perPage}`;

    return cache.getOrSet<CoinMarketData[]>(
        cacheKey,
        () =>
            cgFetch<CoinMarketData[]>('coins/markets', {
                vs_currency: currency,
                order,
                per_page: perPage,
                page,
                sparkline,
                price_change_percentage: '1h,24h,7d',
            }),
        300,
    );
}

// ─────────────────────────────────────────────────────
// Coin Details
// ─────────────────────────────────────────────────────
export async function getCoin(id: string) {
    const cacheKey = `coin:${id}`;

    const result = await cache.getOrSet<CoinDetailsData | null>(
        cacheKey,
        async () => {
            const data = await cgFetch<CoinDetailsData>(`coins/${id}`, {
                localization: false,
                tickers: true,
                market_data: true,
                community_data: false,
                developer_data: false,
                sparkline: false,
            });
            return data;
        },
        300,
    );

    if (!result.data) throw new NotFoundError(`Coin "${id}"`);
    return result;
}

// ─────────────────────────────────────────────────────
// OHLC
// ─────────────────────────────────────────────────────
export interface GetOHLCParams {
    coinId: string;
    days?: number | 'max';
    currency?: string;
}

export async function getOHLC(params: GetOHLCParams) {
    const { coinId, days = 1, currency = 'usd' } = params;
    const safeDays = days === 'max' ? 'max' : snapToValidDays(Number(days));
    const ttl = safeDays === 1 || safeDays === 7 ? 60 : 300;
    const cacheKey = `ohlc:${coinId}:${safeDays}:${currency}`;

    return cache.getOrSet<OHLCData[]>(
        cacheKey,
        () =>
            cgFetch<OHLCData[]>(`coins/${coinId}/ohlc`, {
                vs_currency: currency,
                days: safeDays,
            }),
        ttl,
    );
}

// ─────────────────────────────────────────────────────
// Trending
// ─────────────────────────────────────────────────────
export async function getTrending() {
    return cache.getOrSet<TrendingResponse>(
        'trending',
        () => cgFetch<TrendingResponse>('search/trending'),
        300,
    );
}

// ─────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────
export async function getCategories(limit = 10) {
    const result = await cache.getOrSet<Category[]>(
        'categories',
        () => cgFetch<Category[]>('coins/categories'),
        600,
    );

    return {
        data: result.data.slice(0, limit),
        cached: result.cached,
    };
}

// ─────────────────────────────────────────────────────
// Simple Price
// ─────────────────────────────────────────────────────
export interface GetSimplePriceParams {
    ids: string[];
    currencies?: string;
}

export async function getSimplePrice(params: GetSimplePriceParams) {
    const { ids, currencies = 'usd' } = params;
    const cacheKey = `simple-price:${ids.sort().join(',')}:${currencies}`;

    return cache.getOrSet<SimplePriceResponse>(
        cacheKey,
        () =>
            cgFetch<SimplePriceResponse>('simple/price', {
                ids: ids.join(','),
                vs_currencies: currencies,
                include_24hr_change: true,
                include_market_cap: true,
                include_24hr_vol: true,
            }),
        60,
    );
}

// ─────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────
export async function searchCoins(query: string) {
    const cacheKey = `search:${query.trim().toLowerCase()}`;

    return cache.getOrSet<SearchResult>(
        cacheKey,
        () => cgFetch<SearchResult>('search', { query: query.trim() }),
        120,
    );
}
