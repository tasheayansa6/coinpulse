'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, TrendingUp, TrendingDown, Trash2, RefreshCw } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useUserId } from '@/hooks/useUserId';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

interface LivePrice {
    [coinId: string]: { usd?: number; usd_24h_change?: number };
}

const WatchlistPage = () => {
    const userId = useUserId();
    const { watchlist, loading, removeFromWatchlist, refresh } = useWatchlist();
    const [prices, setPrices] = useState<LivePrice>({});
    const [priceLoading, setPriceLoading] = useState(false);

    // Fetch live prices for all watched coins
    useEffect(() => {
        if (watchlist.length === 0) { setPrices({}); return; }
        const ids = watchlist.map((c) => c.coinId).join(',');
        setPriceLoading(true);
        fetch(`${BACKEND}/api/coins/price?ids=${ids}&currencies=usd`)
            .then((r) => r.json())
            .then((j: { data?: LivePrice }) => setPrices(j.data ?? {}))
            .catch(() => {/* silent */})
            .finally(() => setPriceLoading(false));
    }, [watchlist]);

    if (!userId) {
        return (
            <main className="main-container flex items-center justify-center min-h-[60vh]">
                <p className="text-purple-100">Loading...</p>
            </main>
        );
    }

    return (
        <main className="main-container">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Star size={24} className="text-yellow-500" fill="currentColor" />
                    <h1 className="text-2xl md:text-3xl font-semibold">My Watchlist</h1>
                </div>
                <button
                    onClick={refresh}
                    className="flex items-center gap-2 text-purple-100 hover:text-white transition-colors text-sm"
                >
                    <RefreshCw size={15} className={cn(loading && 'animate-spin')} />
                    Refresh
                </button>
            </div>

            {loading && watchlist.length === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-dark-500 rounded-xl p-5 h-44 skeleton" />
                    ))}
                </div>
            )}

            {!loading && watchlist.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
                    <Star size={48} className="text-purple-100/20" />
                    <h2 className="text-xl font-semibold text-purple-100">Your watchlist is empty</h2>
                    <p className="text-purple-100/60 max-w-sm">
                        Browse coins and click the ★ star to track your favorites here.
                    </p>
                    <Link
                        href="/coins"
                        className="mt-2 px-5 py-2.5 bg-green-500 text-dark-900 font-semibold rounded-lg hover:bg-green-400 transition-colors"
                    >
                        Browse Coins
                    </Link>
                </div>
            )}

            {watchlist.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {watchlist.map((item) => {
                        const price  = prices[item.coinId]?.usd;
                        const change = prices[item.coinId]?.usd_24h_change;
                        const isUp   = (change ?? 0) >= 0;

                        return (
                            <div key={item._id} className="relative bg-dark-500 rounded-xl p-5 border border-purple-600/20 hover:border-purple-600/50 transition-all group">
                                {/* Card link */}
                                <Link href={`/coins/${item.coinId}`} className="absolute inset-0 z-0 rounded-xl" />

                                {/* Remove button */}
                                <button
                                    onClick={(e) => { e.preventDefault(); removeFromWatchlist(item.coinId); }}
                                    className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-purple-100/30 hover:text-red-500 hover:bg-dark-400 transition-all opacity-0 group-hover:opacity-100"
                                    aria-label="Remove from watchlist"
                                >
                                    <Trash2 size={14} />
                                </button>

                                <div className="flex items-center gap-3 mb-4">
                                    <Image src={item.coinImage} alt={item.coinName} width={40} height={40} className="rounded-full" />
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{item.coinName}</p>
                                        <p className="text-xs text-purple-100/60 uppercase">{item.coinSymbol}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xl font-bold">
                                        {priceLoading ? (
                                            <span className="h-6 w-24 skeleton rounded inline-block" />
                                        ) : (
                                            price ? formatCurrency(price) : '—'
                                        )}
                                    </p>
                                    <p className={cn('flex items-center gap-1 text-sm font-medium',
                                        isUp ? 'text-green-500' : 'text-red-500')}>
                                        {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                                        {change !== undefined ? formatPercentage(change) : '—'}
                                        <span className="text-purple-100/40 font-normal">24h</span>
                                    </p>
                                </div>

                                <p className="text-xs text-purple-100/30 mt-3">
                                    Added {new Date(item.addedAt).toLocaleDateString()}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
};

export default WatchlistPage;
