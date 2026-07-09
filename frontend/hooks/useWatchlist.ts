'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserId } from './useUserId';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

export interface WatchlistCoin {
    _id: string;
    coinId: string;
    coinName: string;
    coinSymbol: string;
    coinImage: string;
    addedAt: string;
}

export function useWatchlist() {
    const userId = useUserId();
    const [watchlist, setWatchlist] = useState<WatchlistCoin[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchWatchlist = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res  = await fetch(`${BACKEND}/api/watchlist/${userId}`);
            const json = await res.json() as { data?: WatchlistCoin[] };
            setWatchlist(json.data ?? []);
        } catch {
            setWatchlist([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchWatchlist();
    }, [fetchWatchlist]);

    const addToWatchlist = useCallback(async (coin: CoinMarketData) => {
        if (!userId) return;
        try {
            await fetch(`${BACKEND}/api/watchlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    coinId:     coin.id,
                    coinName:   coin.name,
                    coinSymbol: coin.symbol,
                    coinImage:  coin.image,
                }),
            });
            await fetchWatchlist();
        } catch {/* silent */}
    }, [userId, fetchWatchlist]);

    const removeFromWatchlist = useCallback(async (coinId: string) => {
        if (!userId) return;
        try {
            await fetch(`${BACKEND}/api/watchlist/${userId}/${coinId}`, {
                method: 'DELETE',
            });
            setWatchlist((prev) => prev.filter((c) => c.coinId !== coinId));
        } catch {/* silent */}
    }, [userId]);

    const isWatchlisted = useCallback(
        (coinId: string) => watchlist.some((c) => c.coinId === coinId),
        [watchlist],
    );

    const toggleWatchlist = useCallback(async (coin: CoinMarketData) => {
        if (isWatchlisted(coin.id)) {
            await removeFromWatchlist(coin.id);
        } else {
            await addToWatchlist(coin);
        }
    }, [isWatchlisted, addToWatchlist, removeFromWatchlist]);

    return { watchlist, loading, isWatchlisted, toggleWatchlist, removeFromWatchlist, refresh: fetchWatchlist };
}
