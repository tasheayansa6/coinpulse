'use server';

import qs from 'query-string';

const BASE_URL = process.env.COINGECKO_BASE_URL;

if (!BASE_URL) throw new Error('Could not get base url');

/* =====================================================
   GENERIC FETCHER (FREE API)
===================================================== */
export async function fetcher<T>(
    endpoint: string,
    params?: QueryParams,
    revalidate = 60,
): Promise<T> {
    const url = qs.stringifyUrl(
        {
            url: `${BASE_URL}/${endpoint}`,
            query: params,
        },
        { skipEmptyString: true, skipNull: true }
    );

    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate },
    });

    if (!response.ok) {
        const errorBody: any = await response.json().catch(() => ({}));
        throw new Error(
            `API Error: ${response.status}: ${JSON.stringify(errorBody) || response.statusText}`
        );
    }

    return response.json();
}

/* =====================================================
   COIN DETAILS
===================================================== */
export async function getCoin(id: string) {
    try {
        return await fetcher<CoinDetailsData>(`coins/${id}`, {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false,
        });
    } catch (error) {
        console.error('Error fetching coin details:', error);
        return null;
    }
}

/* =====================================================
   MARKET LIST (TOP COINS)
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
        console.error('Error fetching market coins:', error);
        return [];
    }
}

/* =====================================================
   TRENDING COINS
===================================================== */
export async function getTrendingCoins() {
    try {
        return await fetcher<TrendingResponse>('search/trending');
    } catch (error) {
        console.error('Error fetching trending coins:', error);
        return null;
    }
}

/* =====================================================
   OHLC DATA (FOR CHART)
   FREE API LIMIT: max 365 days historical
===================================================== */
export async function getOHLC(
    coinId: string,
    days: number = 1
): Promise<OHLCData[]> {
    const safeDays = Math.min(days, 365); // Free API max 365 days
    if (days > 365) {
        console.warn(`Free API cannot fetch more than 365 days. Limiting to ${safeDays} days.`);
    }

    try {
        return await fetcher<OHLCData[]>(`coins/${coinId}/ohlc`, {
            vs_currency: 'usd',
            days: safeDays,
        });
    } catch (error) {
        console.error('Error fetching OHLC data:', error);
        return []; // Return empty array instead of throwing
    }
}
