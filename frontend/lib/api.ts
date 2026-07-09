/**
 * Shared API Route utilities
 *
 * Helpers for building consistent JSON responses, parsing query params,
 * and handling errors inside Next.js Route Handlers.
 */

import { NextResponse } from 'next/server';
import { CoinGeckoError } from '@/lib/errors';

// ─────────────────────────────────────────────────────
// Typed response builders
// ─────────────────────────────────────────────────────

/** 200 OK with data envelope */
export function ok<T>(
    data: T,
    options: { cached?: boolean; revalidate?: number } = {},
): NextResponse {
    const { cached = false, revalidate = 300 } = options;

    const body: ApiSuccessResponse<T> = {
        success: true,
        data,
        cached,
        timestamp: Date.now(),
    };

    return NextResponse.json(body, {
        status: 200,
        headers: {
            'Cache-Control': `s-maxage=${revalidate}, stale-while-revalidate=60`,
        },
    });
}

/** 400 Bad Request */
export function badRequest(message: string): NextResponse {
    const body: ApiErrorResponse = {
        success: false,
        error: message,
        statusCode: 400,
        timestamp: Date.now(),
    };
    return NextResponse.json(body, { status: 400 });
}

/** 404 Not Found */
export function notFound(message = 'Not found'): NextResponse {
    const body: ApiErrorResponse = {
        success: false,
        error: message,
        statusCode: 404,
        timestamp: Date.now(),
    };
    return NextResponse.json(body, { status: 404 });
}

/** 429 Rate Limited */
export function rateLimited(retryAfterSeconds = 5): NextResponse {
    const body: ApiErrorResponse = {
        success: false,
        error: 'Rate limit exceeded — please retry shortly',
        statusCode: 429,
        timestamp: Date.now(),
    };
    return NextResponse.json(body, {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
    });
}

/** 500 Internal Server Error */
export function serverError(message = 'Internal server error'): NextResponse {
    const body: ApiErrorResponse = {
        success: false,
        error: message,
        statusCode: 500,
        timestamp: Date.now(),
    };
    return NextResponse.json(body, { status: 500 });
}

// ─────────────────────────────────────────────────────
// Error handler wrapper
// ─────────────────────────────────────────────────────

/**
 * Wraps a Route Handler in a try/catch that maps known errors
 * (CoinGeckoError, validation failures) to appropriate HTTP responses.
 */
export async function withErrorHandling(
    handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
    try {
        return await handler();
    } catch (error) {
        if (error instanceof CoinGeckoError) {
            if (error.statusCode === 404) return notFound('Coin not found');
            if (error.statusCode === 429) return rateLimited();
        }

        const message = error instanceof Error ? error.message : 'Unexpected error';
        console.error('[CoinPulse API]', message, error);
        return serverError(message);
    }
}

// ─────────────────────────────────────────────────────
// Query param helpers
// ─────────────────────────────────────────────────────

/** Safely read a string search param, returning a default if absent. */
export function getStringParam(
    searchParams: URLSearchParams,
    key: string,
    defaultValue = '',
): string {
    return searchParams.get(key)?.trim() || defaultValue;
}

/** Safely read an integer search param, returning a default if absent or invalid. */
export function getIntParam(
    searchParams: URLSearchParams,
    key: string,
    defaultValue: number,
    min?: number,
    max?: number,
): number {
    const raw = searchParams.get(key);
    if (!raw) return defaultValue;
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) return defaultValue;
    if (min !== undefined && parsed < min) return min;
    if (max !== undefined && parsed > max) return max;
    return parsed;
}
