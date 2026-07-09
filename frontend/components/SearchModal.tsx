'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────
interface SearchCoin {
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number | null;
    thumb: string;
}

interface PriceData {
    [coinId: string]: {
        usd?: number;
        usd_24h_change?: number;
    };
}

// ─── Component ────────────────────────────────────────
const SearchModal = () => {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const [open, setOpen]     = useState(false);
    const [query, setQuery]   = useState('');
    const [coins, setCoins]   = useState<SearchCoin[]>([]);
    const [prices, setPrices] = useState<PriceData>({});
    const [loading, setLoading] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [, startTransition] = useTransition();

    // ── Open/close helpers ────────────────────────────
    const openModal = () => {
        setOpen(true);
    };

    const closeModal = () => {
        setOpen(false);
        setQuery('');
        setCoins([]);
        setPrices({});
        setSelectedIdx(0);
    };

    // ── Focus input when modal opens ──────────────────
    useEffect(() => {
        if (open) {
            // small delay so Dialog animation doesn't steal focus
            const t = setTimeout(() => inputRef.current?.focus(), 80);
            return () => clearTimeout(t);
        }
    }, [open]);

    // ── Global keyboard shortcut Ctrl/Cmd+K ──────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // ── Debounced search ──────────────────────────────
    useEffect(() => {
        const q = query.trim();

        if (!q) {
            setCoins([]);
            setPrices({});
            setLoading(false);
            return;
        }

        setLoading(true);

        const timeout = setTimeout(async () => {
            try {
                const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

                const res  = await fetch(`${base}/api/coins/search?q=${encodeURIComponent(q)}`);
                const json = await res.json() as { data?: { coins?: SearchCoin[] } };
                const results = json?.data?.coins?.slice(0, 8) ?? [];
                setCoins(results);
                setSelectedIdx(0);

                if (results.length > 0) {
                    const ids = results.map((c) => c.id).join(',');
                    const pr  = await fetch(`${base}/api/coins/price?ids=${ids}&currencies=usd`);
                    const pj  = await pr.json() as { data?: PriceData };
                    setPrices(pj?.data ?? {});
                }
            } catch {
                setCoins([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [query]);

    // ── Navigate to coin ──────────────────────────────
    const handleSelect = useCallback(
        (coinId: string) => {
            closeModal();
            startTransition(() => router.push(`/coins/${coinId}`));
        },
        [router],
    );

    // ── Keyboard navigation inside results ───────────
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!coins.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIdx((i) => Math.min(i + 1, coins.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const coin = coins[selectedIdx];
            if (coin) handleSelect(coin.id);
        } else if (e.key === 'Escape') {
            closeModal();
        }
    };

    return (
        <div id="search-modal">
            {/* ── Trigger ── */}
            <button
                className="trigger"
                onClick={openModal}
                aria-label="Search coins"
            >
                <Search size={16} />
                <span>Search</span>
                <kbd className="kbd">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            {/* ── Dialog ── */}
            <Dialog open={open} onOpenChange={(v) => !v && closeModal()}>
                <DialogContent className="dialog p-0 gap-0 overflow-hidden">

                    {/* Input row */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                        {loading
                            ? <Loader2 size={16} className="shrink-0 animate-spin opacity-50" />
                            : <Search size={16} className="shrink-0 opacity-50" />
                        }
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search coins by name or symbol..."
                            className="w-full bg-transparent text-sm outline-none placeholder:text-purple-100/40"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                        />
                        {query && (
                            <button
                                onClick={() => { setQuery(''); setCoins([]); inputRef.current?.focus(); }}
                                className="text-purple-100/40 hover:text-purple-100 transition-colors text-xs shrink-0"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Results */}
                    <div className="list overflow-y-auto max-h-[400px]">

                        {/* Placeholder */}
                        {!query.trim() && (
                            <p className="empty">Type to search coins...</p>
                        )}

                        {/* No results */}
                        {query.trim() && !loading && coins.length === 0 && (
                            <p className="empty">No results for &ldquo;{query}&rdquo;</p>
                        )}

                        {/* Coin rows */}
                        {coins.length > 0 && (
                            <div className="group p-1">
                                <p className="heading px-2 py-1.5 text-xs font-medium opacity-60">
                                    <Search size={11} className="inline mr-1" />
                                    Results
                                </p>
                                {coins.map((coin, idx) => {
                                    const price  = prices[coin.id]?.usd;
                                    const change = prices[coin.id]?.usd_24h_change;
                                    const isUp   = (change ?? 0) >= 0;

                                    return (
                                        <button
                                            key={coin.id}
                                            onClick={() => handleSelect(coin.id)}
                                            onMouseEnter={() => setSelectedIdx(idx)}
                                            className={cn(
                                                'search-item w-full text-left',
                                                idx === selectedIdx && 'bg-dark-400',
                                            )}
                                        >
                                            {/* Coin info */}
                                            <div className="coin-info">
                                                <Image
                                                    src={coin.thumb}
                                                    alt={coin.name}
                                                    width={36}
                                                    height={36}
                                                    className="rounded-full"
                                                />
                                                <div>
                                                    <p className="font-medium text-sm">{coin.name}</p>
                                                    <span className="coin-symbol">{coin.symbol}</span>
                                                </div>
                                            </div>

                                            {/* Rank */}
                                            <p className="text-sm text-purple-100/50">
                                                {coin.market_cap_rank ? `#${coin.market_cap_rank}` : '—'}
                                            </p>

                                            {/* Price */}
                                            <p className="coin-price">
                                                {price ? formatCurrency(price) : '—'}
                                            </p>

                                            {/* 24h change */}
                                            <p className={cn('coin-change', isUp ? 'text-green-500' : 'text-red-500')}>
                                                {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                                                {change !== undefined ? formatPercentage(change) : '—'}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SearchModal;
