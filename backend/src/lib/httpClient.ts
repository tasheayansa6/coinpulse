/**
 * Thin HTTP client for CoinGecko & GeckoTerminal.
 *
 * Features:
 *  - Typed responses
 *  - API key header injection (demo vs pro auto-detected)
 *  - Automatic 429 retry with exponential backoff
 *  - Typed error classes
 */

import { config } from '../config';
import { RateLimitError, UpstreamError } from './errors';

// ─────────────────────────────────────────────────────
// URL builder
// ─────────────────────────────────────────────────────
export function buildUrl(
    base: string,
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>,
): string {
    const url = new URL(`${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`);

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== undefined && value !== '') {
                url.searchParams.set(key, String(value));
            }
        }
    }

    return url.toString();
}

// ─────────────────────────────────────────────────────
// Headers
// ─────────────────────────────────────────────────────
function coinGeckoHeaders(): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (config.COINGECKO_API_KEY) {
        const headerName = config.COINGECKO_API_KEY.startsWith('CG-')
            ? 'x-cg-demo-api-key'
            : 'x-cg-pro-api-key';
        headers[headerName] = config.COINGECKO_API_KEY;
    }

    return headers;
}

function geckoTerminalHeaders(): Record<string, string> {
    return { Accept: 'application/json;version=20230302' };
}

// ─────────────────────────────────────────────────────
// Core fetch with retry
// ─────────────────────────────────────────────────────
async function fetchWithRetry<T>(
    url: string,
    headers: Record<string, string>,
    retries = 2,
    backoffMs = 1500,
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) {
            await new Promise((r) => setTimeout(r, backoffMs * attempt));
        }

        const res = await fetch(url, { headers });

        if (res.status === 429) {
            if (attempt === retries) throw new RateLimitError();
            const retryAfter = res.headers.get('retry-after');
            const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : backoffMs * (attempt + 1);
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
        }

        if (!res.ok) {
            const body = await res.json().catch(() => ({})) as Record<string, unknown>;
            const message = (body?.error as string) ?? res.statusText;
            lastError = new UpstreamError(res.status, message, url);
            // Don't retry 4xx (except 429 handled above)
            if (res.status >= 400 && res.status < 500) throw lastError;
            continue;
        }

        return res.json() as Promise<T>;
    }

    throw lastError ?? new UpstreamError(500, 'All retries exhausted', url);
}

// ─────────────────────────────────────────────────────
// Public clients
// ─────────────────────────────────────────────────────

/** Fetch from CoinGecko REST API */
export async function cgFetch<T>(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>,
): Promise<T> {
    const url = buildUrl(config.COINGECKO_BASE_URL, path, params);
    return fetchWithRetry<T>(url, coinGeckoHeaders());
}

/** Fetch from GeckoTerminal API */
export async function gtFetch<T>(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>,
): Promise<T> {
    const url = buildUrl(config.GECKOTERMINAL_BASE_URL, path, params);
    return fetchWithRetry<T>(url, geckoTerminalHeaders());
}
