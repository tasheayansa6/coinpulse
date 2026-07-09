/**
 * GET /api/pools
 *
 * Returns DEX pool data from GeckoTerminal.
 *
 * Query params:
 *   coin_id  - CoinGecko coin ID used as fallback search term (required)
 *   network  - GeckoTerminal network slug (e.g. "eth", "bsc") — optional
 *   address  - Pool or token contract address — optional
 */

import { type NextRequest } from 'next/server';
import { getPools } from '@/lib/coingecko.actions';
import { ok, badRequest, notFound, withErrorHandling, getStringParam } from '@/lib/api';

export const revalidate = 300;

export async function GET(request: NextRequest) {
    return withErrorHandling(async () => {
        const { searchParams } = request.nextUrl;

        const coinId = getStringParam(searchParams, 'coin_id', '');
        const network = getStringParam(searchParams, 'network', '') || null;
        const address = getStringParam(searchParams, 'address', '') || null;

        if (!coinId) {
            return badRequest('Missing required query param: coin_id');
        }

        const data = await getPools(coinId, network, address);
        if (!data) return notFound(`No pool found for coin "${coinId}"`);

        return ok(data, { revalidate });
    });
}
