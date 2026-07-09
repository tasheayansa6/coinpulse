/**
 * GET /api/search
 *
 * Search for coins, exchanges, NFTs and categories by name or symbol.
 *
 * Query params:
 *   q - search query (required, min 1 char)
 */

import { type NextRequest } from 'next/server';
import { searchCoins } from '@/lib/coingecko.actions';
import { ok, badRequest, notFound, withErrorHandling, getStringParam } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withErrorHandling(async () => {
        const { searchParams } = request.nextUrl;
        const query = getStringParam(searchParams, 'q', '');

        if (!query) {
            return badRequest('Missing required query param: q');
        }

        if (query.length > 100) {
            return badRequest('Query too long — max 100 characters');
        }

        const data = await searchCoins(query);
        if (!data) return notFound('No results found');

        return ok(data, { revalidate: 120 });
    });
}
