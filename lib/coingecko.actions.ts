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
    const url = qs.stringifyUrl(
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
        // ⚠️ Do NOT pass interval for free API
        return await fetcher<OHLCData[]>(`coins/${coinId}/ohlc`, {
            vs_currency: 'usd',
            days: safeDays,
        });
    } catch (error) {
        console.error('OHLC error:', error);
        return [];
    }
}