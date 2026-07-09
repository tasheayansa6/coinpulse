export class CoinGeckoError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly url?: string,
    ) {
        super(`[CoinGecko ${statusCode}] ${message}${url ? ` — ${url}` : ''}`);
        this.name = 'CoinGeckoError';
    }
}
