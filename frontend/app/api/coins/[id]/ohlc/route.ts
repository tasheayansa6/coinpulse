/**
 * GET /api/coins/[id]/ohlc
 *
 * Returns OHLC candlestick data for a coin.
 *
 * Path params:
 *   id - CoinGecko coin ID
 *
 * Query params:
 *   days     - number of days or "max" (default: 1)
 *   currency - vs_currency (default: usd)
 */

import { type NextRequest } from 'next/server';
import { getOHLC } from '@/lib/coingecko.actions';
import { ok, notFound, badRequest, withErrorHandling, getStringParam } from '@/lib/api';

export const revalidate = 60;

const VALID_DAYS = ['1', '7', '14', '30', '90', '180', '365', 'max'] as const;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return withErrorHandling(async () => {
        const { id } = await params;

        if (!id || !/^[a-z0-9-]+$/.test(id)) {
            return notFound('Invalid coin ID');
        }

        const { searchParams } = request.nextUrl;
        const daysParam = getStringParam(searchParams, 'days', '1');
        const currency = getStringParam(searchParams, 'currency', 'usd');

        if (!VALID_DAYS.includes(daysParam as (typeof VALID_DAYS)[number])) {
            return badRequest(`Invalid days value. Must be one of: ${VALID_DAYS.join(', ')}`);
        }

        if (!/^[a-z]{2,10}$/.test(currency)) {
            return badRequest('Invalid currency code');
        }

        const days = daysParam === 'max' ? 'max' : parseInt(daysParam, 10);
        const data = await getOHLC(id, days, currency);

        // Short TTL for intraday data
        const ttl = days === 1 || days === 7 ? 60 : 300;
        return ok(data, { revalidate: ttl });
    });
}
