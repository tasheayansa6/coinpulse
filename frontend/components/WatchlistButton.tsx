'use client';

import { Star } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { cn } from '@/lib/utils';

interface Props {
    coinId: string;
    coinName: string;
    coinSymbol: string;
    coinImage: string;
}

const WatchlistButton = ({ coinId, coinName, coinSymbol, coinImage }: Props) => {
    const { isWatchlisted, toggleWatchlist } = useWatchlist();
    const watched = isWatchlisted(coinId);

    const fakeCoin = {
        id: coinId, name: coinName, symbol: coinSymbol, image: coinImage,
        current_price: 0, market_cap: 0, market_cap_rank: 0,
        fully_diluted_valuation: null, total_volume: 0, high_24h: 0, low_24h: 0,
        price_change_24h: 0, price_change_percentage_24h: 0,
        market_cap_change_24h: 0, market_cap_change_percentage_24h: 0,
        circulating_supply: 0, total_supply: null, max_supply: null,
        ath: 0, ath_change_percentage: 0, ath_date: '',
        atl: 0, atl_change_percentage: 0, atl_date: '',
        last_updated: '',
    } as CoinMarketData;

    return (
        <button
            onClick={() => toggleWatchlist(fakeCoin)}
            className={cn(
                'flex items-center gap-2 w-full justify-center mt-4 py-3 px-5 rounded-lg font-semibold text-sm transition-all border',
                watched
                    ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                    : 'border-purple-600/30 bg-dark-500 text-purple-100 hover:border-yellow-500/40 hover:text-yellow-500',
            )}
        >
            <Star size={16} fill={watched ? 'currentColor' : 'none'} />
            {watched ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </button>
    );
};

export default WatchlistButton;
