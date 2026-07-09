/**
 * GET /api/health
 *
 * Basic health check endpoint.
 * Returns 200 with server status info — useful for uptime monitors.
 */

import { NextResponse } from 'next/server';
import { serverCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: Date.now(),
        cache: {
            entries: serverCache.size(),
        },
        env: {
            hasApiKey: !!process.env.COINGECKO_API_KEY,
            baseUrl: process.env.COINGECKO_BASE_URL ?? null,
        },
    });
}
