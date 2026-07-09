// ─────────────────────────────────────────────────────
// CoinGecko + GeckoTerminal shared type definitions
// ─────────────────────────────────────────────────────

// OHLC: [timestamp_ms, open, high, low, close]
export type OHLCData = [number, number, number, number, number];

// ─── Markets ──────────────────────────────────────────
export interface CoinMarketData {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    fully_diluted_valuation: number | null;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    ath: number;
    ath_change_percentage: number;
    ath_date: string;
    atl: number;
    atl_change_percentage: number;
    atl_date: string;
    last_updated: string;
    sparkline_in_7d?: { price: number[] };
    price_change_percentage_1h_in_currency?: number;
    price_change_percentage_24h_in_currency?: number;
    price_change_percentage_7d_in_currency?: number;
}

// ─── Coin Details ─────────────────────────────────────
export interface CoinDetailsData {
    id: string;
    symbol: string;
    name: string;
    asset_platform_id?: string | null;
    market_cap_rank?: number | null;
    hashing_algorithm?: string | null;
    description?: { en?: string; [lang: string]: string | undefined };
    detail_platforms?: Record<
        string,
        {
            decimal_place?: number | null;
            contract_address?: string;
            geckoterminal_url?: string;
        }
    >;
    platforms?: Record<string, string>;
    links: {
        homepage: string[];
        whitepaper?: string;
        blockchain_site: string[];
        official_forum_url?: string[];
        chat_url?: string[];
        announcement_url?: string[];
        twitter_screen_name?: string;
        facebook_username?: string;
        telegram_channel_identifier?: string;
        subreddit_url?: string;
        repos_url?: { github?: string[]; bitbucket?: string[] };
    };
    image: {
        thumb: string;
        small: string;
        large: string;
    };
    genesis_date?: string | null;
    sentiment_votes_up_percentage?: number | null;
    sentiment_votes_down_percentage?: number | null;
    watchlist_portfolio_users?: number;
    market_data: {
        current_price: Record<string, number>;
        ath: Record<string, number>;
        ath_change_percentage: Record<string, number>;
        ath_date: Record<string, string>;
        atl: Record<string, number>;
        atl_change_percentage: Record<string, number>;
        atl_date: Record<string, string>;
        market_cap: Record<string, number>;
        market_cap_rank?: number | null;
        fully_diluted_valuation: Record<string, number>;
        total_volume: Record<string, number>;
        high_24h: Record<string, number>;
        low_24h: Record<string, number>;
        price_change_24h?: number;
        price_change_percentage_24h?: number;
        price_change_percentage_7d?: number;
        price_change_percentage_14d?: number;
        price_change_percentage_30d?: number;
        price_change_percentage_60d?: number;
        price_change_percentage_200d?: number;
        price_change_percentage_1y?: number;
        price_change_24h_in_currency?: Record<string, number>;
        price_change_percentage_1h_in_currency?: Record<string, number>;
        price_change_percentage_24h_in_currency?: Record<string, number>;
        price_change_percentage_7d_in_currency?: Record<string, number>;
        price_change_percentage_14d_in_currency?: Record<string, number>;
        price_change_percentage_30d_in_currency?: Record<string, number>;
        price_change_percentage_60d_in_currency?: Record<string, number>;
        price_change_percentage_200d_in_currency?: Record<string, number>;
        price_change_percentage_1y_in_currency?: Record<string, number>;
        total_supply?: number | null;
        max_supply?: number | null;
        circulating_supply?: number;
        last_updated?: string;
    };
    tickers?: CoinTicker[];
}

export interface CoinTicker {
    base: string;
    target: string;
    market: {
        name: string;
        identifier: string;
        has_trading_incentive: boolean;
        logo?: string;
    };
    last: number;
    volume: number;
    converted_last: Record<string, number>;
    converted_volume: Record<string, number>;
    trust_score?: string | null;
    bid_ask_spread_percentage?: number;
    timestamp: string;
    last_traded_at: string;
    last_fetch_at: string;
    is_anomaly: boolean;
    is_stale: boolean;
    trade_url?: string | null;
    coin_id: string;
    target_coin_id?: string;
}

// ─── Trending ─────────────────────────────────────────
export interface TrendingCoinItem {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    small: string;
    large: string;
    slug: string;
    price_btc: number;
    score: number;
    data: {
        price: number;
        price_btc: string;
        price_change_percentage_24h: Record<string, number>;
        market_cap: string;
        market_cap_btc: string;
        total_volume: string;
        total_volume_btc: string;
        sparkline: string;
        content: null | { title: string; description: string };
    };
}

export interface TrendingResponse {
    coins: Array<{ item: TrendingCoinItem }>;
    nfts: unknown[];
    categories: unknown[];
}

// ─── Category ─────────────────────────────────────────
export interface Category {
    id: string;
    name: string;
    market_cap: number;
    market_cap_change_24h: number;
    content?: string;
    top_3_coins: string[];
    volume_24h: number;
    updated_at: string;
}

// ─── Simple Price ─────────────────────────────────────
export type SimplePriceResponse = Record<string, Record<string, number>>;

// ─── Search ───────────────────────────────────────────
export interface SearchResult {
    coins: Array<{
        id: string;
        name: string;
        symbol: string;
        market_cap_rank: number | null;
        thumb: string;
        large: string;
    }>;
    exchanges: Array<{
        id: string;
        name: string;
        market_type: string;
        thumb: string;
        large: string;
    }>;
    categories: Array<{ id: number; name: string }>;
    nfts: Array<{ id: string; name: string; symbol: string; thumb: string }>;
}

// ─── GeckoTerminal Pool ───────────────────────────────
export interface PoolAttributes {
    base_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_usd: string;
    quote_token_price_native_currency: string;
    address: string;
    name: string;
    pool_created_at: string | null;
    fdv_usd: string | null;
    market_cap_usd: string | null;
    price_change_percentage: Record<string, string>;
    transactions: Record<
        string,
        { buys: number; sells: number; buyers: number; sellers: number }
    >;
    volume_usd: Record<string, string>;
    reserve_in_usd: string;
}

export interface PoolData {
    id: string;
    type: string;
    attributes: PoolAttributes;
    relationships?: Record<string, unknown>;
}
