'use server';

import qs from 'query-string';

/*
.env.local
----------------------------
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
*/

const BASE_URL = process.env.COINGECKO_BASE_URL;

if (!BASE_URL) {
    throw new Error('Could not get base url');
}

/* =====================================================
   RATE LIMIT SAFE FETCHER (FREE API)
===================================================== */

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetcher<T>(
    endpoint: string,
    params?: Record<string, any>,
    revalidate = 300 // cache 5 minutes
): Promise<T> {
    // Check if it's a full URL or relative path
    const isFullUrl = endpoint.startsWith('http');
    const url = isFullUrl
        ? qs.stringifyUrl(
            { url: endpoint, query: params },
            { skipNull: true, skipEmptyString: true }
        )
        : qs.stringifyUrl(
            {
                url: `${BASE_URL}/${endpoint}`,
                query: params,
            },
            { skipNull: true, skipEmptyString: true }
        );

    // small delay to prevent free API burst limit
    await sleep(1200);

    const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate },
    });

    // handle rate limit automatically
    if (response.status === 429) {
        console.warn('Rate limited → retrying...');
        await sleep(3000);
        const retry = await fetch(url, { next: { revalidate } });
        if (!retry.ok) {
            throw new Error(`Retry failed: ${retry.status}`);
        }
        return retry.json();
    }

    if (!response.ok) {
        const errorBody: any = await response.json().catch(() => ({}));
        throw new Error(
            `API Error: ${response.status}: ${errorBody?.error || response.statusText}`
        );
    }

    return response.json();
}

/* =====================================================
   COIN DETAILS
===================================================== */
export async function getCoin(id: string) {
    try {
        return await fetcher<CoinDetailsData>('coins/' + id, {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false,
        });
    } catch (error) {
        console.error('Coin details error:', error);
        return null;
    }
}

/* =====================================================
   MARKETS
===================================================== */
export async function getMarkets() {
    try {
        return await fetcher<MarketCoinData[]>('coins/markets', {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 10,
            page: 1,
            sparkline: false,
        });
    } catch (error) {
        console.error('Markets error:', error);
        return [];
    }
}

/* =====================================================
   TRENDING
===================================================== */
export async function getTrendingCoins() {
    try {
        return await fetcher<TrendingResponse>('search/trending');
    } catch (error) {
        console.error('Trending error:', error);
        return null;
    }
}

/* =====================================================
   SAFE OHLC (FREE API LIMITS)
===================================================== */
const VALID_OHLC_DAYS = [1, 7, 14, 30, 90, 180, 365];

function getClosestValidDays(days: number) {
    return VALID_OHLC_DAYS.reduce((prev, curr) =>
        Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev
    );
}

export async function getOHLC(
    coinId: string,
    days: number = 1
) {
    const safeDays = getClosestValidDays(days);

    try {
        // IMPORTANT: For free API, ONLY pass vs_currency and days
        // Do NOT include interval parameter
        return await fetcher<OHLCData[]>(`coins/${coinId}/ohlc`, {
            vs_currency: 'usd',
            days: safeDays,
        });
    } catch (error) {
        console.error('OHLC error:', error);
        return [];
    }
}

/* =====================================================
   POOLS / GECKOTERMINAL (for DEX data)
===================================================== */
export async function getPools(coinId: string, network?: string | null, contractAddress?: string | null) {
    try {
        // If we have network and contract address, get specific pool
        if (network && contractAddress) {
            const poolData = await fetcher<any>(`https://api.geckoterminal.com/api/v2/networks/${network}/pools/${contractAddress}`);
            return poolData?.data || null;
        }

        // Otherwise search for pools on Ethereum (default)
        const searchData = await fetcher<any>(`https://api.geckoterminal.com/api/v2/search/pools`, {
            query: coinId,
            network: 'eth',
            page: 1,
        });

        // Return the first pool or null
        return searchData?.data?.[0] || null;
    } catch (error) {
        console.error('Pools error:', error);
        return null;
    }
}

/* =====================================================
   TYPE DEFINITIONS
===================================================== */
export interface CoinDetailsData {
    id: string;
    symbol: string;
    name: string;
    asset_platform_id?: string;
    market_cap_rank?: number;
    detail_platforms?: Record<string, {
        geckoterminal_url?: string;
        contract_address?: string;
    }>;
    market_data: {
        current_price: { usd: number };
        price_change_percentage_24h: number;
        market_cap: { usd: number };
        total_volume: { usd: number };
        [key: string]: any;
    };
    links: {
        homepage: string[];
        blockchain_site: string[];
        subreddit_url?: string;
        [key: string]: any;
    };
    image: {
        thumb: string;
        small: string;
        large: string;
    };
    [key: string]: any;
}

export interface MarketCoinData {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    total_volume: number;
    price_change_percentage_24h: number;
    [key: string]: any;
}

export interface TrendingResponse {
    coins: Array<{
        item: {
            id: string;
            coin_id: number;
            name: string;
            symbol: string;
            market_cap_rank: number;
            thumb: string;
            small: string;
            large: string;
            slug: string;
            price_btc: number;
            score: number;
            data: {
                price: number;
                price_btc: string;
                price_change_percentage_24h: { [key: string]: number };
                market_cap: string;
                market_cap_btc: string;
                total_volume: string;
                total_volume_btc: string;
                sparkline: string;
                content: any | null;
            };
        };
    }>;
    nfts: any[];
    categories: any[];
}

export type OHLCData = [number, number, number, number, number];