/**
 * GET /api/price
 *
 * Returns simple price data for one or more coins — lightweight
 * alternative to loading full coin details just for a price check.
 *
 * Query params:
 *   ids        - comma-separated CoinGecko coin IDs (required, max 50)
 *   currencies - comma-separated vs_currencies (default: usd)
 */

import { type NextRequest } from 'next/server';
import { getSimplePrice } from '@/lib/coingecko.actions';
import { ok, badRequest, withErrorHandling, getStringParam } from '@/lib/api';

export const revalidate = 60;

export async function GET(request: NextRequest) {
    return withErrorHandling(async () => {
        const { searchParams } = request.nextUrl;

        const idsParam = getStringParam(searchParams, 'ids', '');
        const currencies = getStringParam(searchParams, 'currencies', 'usd');

        if (!idsParam) {
            return badRequest('Missing required query param: ids');
        }

        const ids = idsParam
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);

        if (ids.length === 0) {
            return badRequest('No valid coin IDs provided');
        }

        if (ids.length > 50) {
            return badRequest('Too many coin IDs — max 50 per request');
        }

        // Validate each id: only lowercase letters, digits, hyphens
        const invalid = ids.find((id) => !/^[a-z0-9-]+$/.test(id));
        if (invalid) {
            return badRequest(`Invalid coin ID format: "${invalid}"`);
        }

        const data = await getSimplePrice(ids, currencies);
        return ok(data, { revalidate: 60 });
    });
}
