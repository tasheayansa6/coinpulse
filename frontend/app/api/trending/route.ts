/**
 * GET /api/trending
 *
 * Returns trending coins, NFTs, and categories from CoinGecko.
 */

import { getTrendingCoins } from '@/lib/coingecko.actions';
import { ok, notFound, withErrorHandling } from '@/lib/api';

export const revalidate = 300;

export async function GET() {
    return withErrorHandling(async () => {
        const data = await getTrendingCoins();
        if (!data) return notFound('Trending data unavailable');
        return ok(data, { revalidate });
    });
}
