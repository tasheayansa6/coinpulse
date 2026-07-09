/**
 * GET /api/coins/[id]
 *
 * Returns full coin details including market data, links, tickers, and image.
 *
 * Path params:
 *   id - CoinGecko coin ID (e.g. "bitcoin", "ethereum")
 */

import { type NextRequest } from 'next/server';
import { getCoin } from '@/lib/coingecko.actions';
import { ok, notFound, withErrorHandling } from '@/lib/api';

export const revalidate = 300;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return withErrorHandling(async () => {
        const { id } = await params;

        if (!id || !/^[a-z0-9-]+$/.test(id)) {
            return notFound('Invalid coin ID');
        }

        const coin = await getCoin(id);
        if (!coin) return notFound(`Coin "${id}" not found`);

        return ok(coin, { revalidate });
    });
}
