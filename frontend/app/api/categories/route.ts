/**
 * GET /api/categories
 *
 * Returns the top coin categories with market cap and volume data.
 *
 * Query params:
 *   limit - max number of categories to return (default: 10, max: 50)
 */

import { type NextRequest } from 'next/server';
import { getCategories } from '@/lib/coingecko.actions';
import { ok, withErrorHandling, getIntParam } from '@/lib/api';

export const revalidate = 600;

export async function GET(request: NextRequest) {
    return withErrorHandling(async () => {
        const { searchParams } = request.nextUrl;
        const limit = getIntParam(searchParams, 'limit', 10, 1, 50);

        const data = await getCategories();
        return ok(data.slice(0, limit), { revalidate });
    });
}
