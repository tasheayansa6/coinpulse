// =====================================================
// GLOBAL TYPE DECLARATIONS — CoinPulse (Next.js)
// This file is ambient — no imports allowed at top level.
// Data model types use inline import() expressions to pull
// from the server package without breaking ambient scope.
// =====================================================

// ─── Next.js Page Props ──────────────────────────────
declare type NextPageProps = {
    params: Promise<Record<string, string>>;
    searchParams: Promise<Record<string, string>>;
};

// ─── Periods ─────────────────────────────────────────
declare type Period =
    | 'daily'
    | 'weekly'
    | 'monthly'
    | '3months'
    | '6months'
    | 'yearly'
    | 'max';

// ─── OHLC ─────────────────────────────────────────────
// [timestamp_ms, open, high, low, close]
declare type OHLCData = [number, number, number, number, number];

// ─── Data model types (sourced from backend package) ───
declare type CoinMarketData   = import('../../backend/src/types/coingecko').CoinMarketData;
declare type CoinDetailsData  = import('../../backend/src/types/coingecko').CoinDetailsData;
declare type CoinTicker       = import('../../backend/src/types/coingecko').CoinTicker;
declare type TrendingCoinItem = import('../../backend/src/types/coingecko').TrendingCoinItem;
declare type TrendingResponse = import('../../backend/src/types/coingecko').TrendingResponse;
declare type TrendingCoin     = { item: TrendingCoinItem };
declare type Category         = import('../../backend/src/types/coingecko').Category;
declare type PoolData         = import('../../backend/src/types/coingecko').PoolData;
declare type SearchResult     = import('../../backend/src/types/coingecko').SearchResult;

// ─── Live Data (WebSocket) ────────────────────────────
declare interface ExtendedPriceData {
    usd: number;
    coin: string;
    price: number;
    change24h: number;
    marketCap: number;
    volume24h: number;
    timestamp: number;
}

declare interface Trade {
    price: number;
    value: number;
    timestamp: number;
    type: string;
    amount: number;
}

// ─── DataTable ────────────────────────────────────────
declare interface DataTableColumn<T> {
    header: string;
    cell: (row: T, rowIndex?: number) => import('react').ReactNode;
    cellClassName?: string;
    headClassName?: string;
}

declare interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];
    rowKey: (row: T, rowIndex: number) => string | number;
    tableClassName?: string;
    headerClassName?: string;
    headerRowClassName?: string;
    headerCellClassName?: string;
    bodyRowClassName?: string;
    bodyCellClassName?: string;
}

// ─── Component Props ──────────────────────────────────
declare interface LiveDataProps {
    children?: import('react').ReactNode;
    coinId: string;
    poolId: string;
    coin: CoinDetailsData;
    coinOHLCData: OHLCData[];
}

declare interface ConverterProps {
    symbol: string;
    icon: string;
    priceList: Record<string, number>;
}

declare interface LiveCoinHeaderProps {
    name: string;
    image: string;
    livePrice: number;
    livePriceChangePercentage24h: number;
    priceChangePercentage30d: number;
    priceChange24h: number;
}

declare interface CandlestickChartProps {
    children?: import('react').ReactNode;
    data: OHLCData[];
    coinId: string;
    height?: number;
    initialPeriod?: Period;
    liveOhlcv?: OHLCData | null;
    mode?: 'live' | 'historical';
    liveInterval?: '1s' | '1m';
    setLiveInterval?: (interval: '1s' | '1m') => void;
}

declare interface Pagination {
    currentPage: number;
    totalPages: number;
    hasMorePages: boolean;
}

// ─── API Response Envelopes ───────────────────────────
declare interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    cached: boolean;
    timestamp: number;
}

declare interface ApiErrorResponse {
    success: false;
    error: string;
    statusCode: number;
    timestamp: number;
}
