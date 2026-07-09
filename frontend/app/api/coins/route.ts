/**
 * GET /api/coins
 *
 * Returns a paginated list of coins sorted by market cap.
 *
 * Query params:
 *   page     - page number (default: 1, min: 1, max: 250)
 *   per_page - items per page (default: 10, min: 1, max: 250)
 *   currency - vs_currency (default: usd)
 */

import { type NextRequest } from 'next/server';
import { getMarkets } from '@/lib/coingecko.actions';
import { ok, badRequest, withErrorHandling, getIntParam, getStringParam } from '@/lib/api';

export const dynamic = 'force-dynamic'; // always re-evaluate search params
export const revalidate = 300;

export async function GET(request: NextRequest) {
    return withErrorHandling(async () => {
        const { searchParams } = request.nextUrl;

        const page = getIntParam(searchParams, 'page', 1, 1, 250);
        const perPage = getIntParam(searchParams, 'per_page', 10, 1, 250);
        const currency = getStringParam(searchParams, 'currency', 'usd');

        if (!/^[a-z]{2,10}$/.test(currency)) {
            return badRequest('Invalid currency code');
        }

        const data = await getMarkets(page, perPage, currency);
        return ok(data, { revalidate });
    });
}
