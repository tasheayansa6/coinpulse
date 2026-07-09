'use client';

import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CoinCardProps {
    coin: CoinMarketData;
    onWatchlistToggle?: (coin: CoinMarketData) => void;
    isWatchlisted?: boolean;
}

const CoinCard = ({ coin, onWatchlistToggle, isWatchlisted = false }: CoinCardProps) => {
    const isTrendingUp = coin.price_change_percentage_24h >= 0;

    const stats = [
        { label: 'Market Cap', value: formatCurrency(coin.market_cap) },
        { label: '24h Volume', value: formatCurrency(coin.total_volume) },
        { label: 'Rank', value: `# ${coin.market_cap_rank}` },
    ];

    return (
        <div id="coin-card" className="relative">
            {/* Whole card is clickable */}
            <Link href={`/coins/${coin.id}`} className="absolute inset-0 z-0" aria-label={`View ${coin.name}`} />

            <div className="header">
                <Image src={coin.image} alt={coin.name} width={48} height={48} className="rounded-full" />
                <div className="flex-1 min-w-0">
                    <h3 className="truncate">{coin.name}</h3>
                    <p>{coin.symbol}</p>
                </div>

                {/* Watchlist star — above the link overlay */}
                {onWatchlistToggle && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onWatchlistToggle(coin);
                        }}
                        className={cn(
                            'relative z-10 p-1 rounded-md transition-colors hover:bg-dark-400',
                            isWatchlisted ? 'text-yellow-500' : 'text-purple-100/40 hover:text-yellow-500',
                        )}
                        aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                        <Star size={16} fill={isWatchlisted ? 'currentColor' : 'none'} />
                    </button>
                )}
            </div>

            <div className="price-row">
                <p className="price">{formatCurrency(coin.current_price)}</p>
                <div className="change">
                    <Badge className={cn('badge', isTrendingUp ? 'badge-up' : 'badge-down')}>
                        {isTrendingUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {formatPercentage(coin.price_change_percentage_24h)}
                    </Badge>
                </div>
            </div>

            <ul className="stats">
                {stats.map((s) => (
                    <li key={s.label} className="stat-row">
                        <span className="label">{s.label}</span>
                        <span className="value">{s.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CoinCard;
