'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { useUserId } from '@/hooks/useUserId';
import { cn, formatCurrency } from '@/lib/utils';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

interface Alert {
    _id: string;
    coinId: string;
    coinName: string;
    coinSymbol: string;
    targetPrice: number;
    direction: 'above' | 'below';
    triggered: boolean;
    triggeredAt?: string;
    createdAt: string;
}

interface SearchResult {
    id: string;
    name: string;
    symbol: string;
    thumb: string;
}

const AlertsPage = () => {
    const userId = useUserId();
    const [alerts, setAlerts]         = useState<Alert[]>([]);
    const [loading, setLoading]       = useState(false);
    const [showForm, setShowForm]     = useState(false);
    const [filter, setFilter]         = useState<'all' | 'active' | 'triggered'>('all');

    // Form state
    const [coinQuery, setCoinQuery]   = useState('');
    const [coinResults, setCoinResults] = useState<SearchResult[]>([]);
    const [selectedCoin, setSelectedCoin] = useState<SearchResult | null>(null);
    const [targetPrice, setTargetPrice] = useState('');
    const [direction, setDirection]   = useState<'above' | 'below'>('above');
    const [submitting, setSubmitting] = useState(false);

    const fetchAlerts = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res  = await fetch(`${BACKEND}/api/alerts/${userId}`);
            const json = await res.json() as { data?: Alert[] };
            setAlerts(json.data ?? []);
        } catch {
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

    // Search coins for form
    useEffect(() => {
        if (!coinQuery.trim()) { setCoinResults([]); return; }
        const t = setTimeout(async () => {
            try {
                const res  = await fetch(`${BACKEND}/api/coins/search?q=${encodeURIComponent(coinQuery)}`);
                const json = await res.json() as { data?: { coins?: SearchResult[] } };
                setCoinResults(json.data?.coins?.slice(0, 6) ?? []);
            } catch { setCoinResults([]); }
        }, 300);
        return () => clearTimeout(t);
    }, [coinQuery]);

    const deleteAlert = async (alertId: string) => {
        try {
            await fetch(`${BACKEND}/api/alerts/${userId}/${alertId}`, { method: 'DELETE' });
            setAlerts((prev) => prev.filter((a) => a._id !== alertId));
        } catch {/* silent */}
    };

    const createAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCoin || !targetPrice || !userId) return;
        setSubmitting(true);
        try {
            await fetch(`${BACKEND}/api/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    coinId:      selectedCoin.id,
                    coinName:    selectedCoin.name,
                    coinSymbol:  selectedCoin.symbol,
                    targetPrice: parseFloat(targetPrice),
                    direction,
                }),
            });
            setShowForm(false);
            setSelectedCoin(null);
            setCoinQuery('');
            setTargetPrice('');
            await fetchAlerts();
        } catch {/* silent */} finally {
            setSubmitting(false);
        }
    };

    const filtered = alerts.filter((a) => {
        if (filter === 'active')    return !a.triggered;
        if (filter === 'triggered') return a.triggered;
        return true;
    });

    return (
        <main className="main-container">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Bell size={24} className="text-purple-100" />
                    <h1 className="text-2xl md:text-3xl font-semibold">Price Alerts</h1>
                    {alerts.filter((a) => !a.triggered).length > 0 && (
                        <span className="bg-green-500 text-dark-900 text-xs font-bold px-2 py-0.5 rounded-full">
                            {alerts.filter((a) => !a.triggered).length} active
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-dark-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                >
                    <Plus size={16} />
                    New Alert
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <form onSubmit={createAlert} className="bg-dark-500 rounded-xl p-6 mb-6 border border-purple-600/30 space-y-4">
                    <h2 className="font-semibold text-lg">Create Price Alert</h2>

                    {/* Coin search */}
                    <div className="relative">
                        <label className="text-sm text-purple-100 block mb-1.5">Coin</label>
                        {selectedCoin ? (
                            <div className="flex items-center gap-3 bg-dark-400 rounded-lg px-4 py-3">
                                <Image src={selectedCoin.thumb} alt={selectedCoin.name} width={24} height={24} className="rounded-full" />
                                <span className="font-medium">{selectedCoin.name}</span>
                                <button type="button" onClick={() => { setSelectedCoin(null); setCoinQuery(''); }}
                                    className="ml-auto text-purple-100/50 hover:text-red-500 text-xs">✕</button>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    value={coinQuery}
                                    onChange={(e) => setCoinQuery(e.target.value)}
                                    placeholder="Search coin..."
                                    className="w-full bg-dark-400 rounded-lg px-4 py-3 text-sm outline-none placeholder:text-purple-100/40"
                                />
                                {coinResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-20 bg-dark-400 rounded-lg mt-1 overflow-hidden border border-purple-600/20">
                                        {coinResults.map((c) => (
                                            <button key={c.id} type="button"
                                                onClick={() => { setSelectedCoin(c); setCoinQuery(c.name); setCoinResults([]); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-500 transition-colors text-sm text-left">
                                                <Image src={c.thumb} alt={c.name} width={20} height={20} className="rounded-full" />
                                                <span>{c.name}</span>
                                                <span className="text-purple-100/50 uppercase text-xs">{c.symbol}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Direction + Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-purple-100 block mb-1.5">Alert when price is</label>
                            <div className="flex gap-2">
                                {(['above', 'below'] as const).map((d) => (
                                    <button key={d} type="button"
                                        onClick={() => setDirection(d)}
                                        className={cn('flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors capitalize',
                                            direction === d
                                                ? d === 'above' ? 'bg-green-500 text-dark-900' : 'bg-red-500/80 text-white'
                                                : 'bg-dark-400 text-purple-100 hover:bg-dark-400/80',
                                        )}>
                                        {d === 'above' ? <TrendingUp size={14} className="inline mr-1" /> : <TrendingDown size={14} className="inline mr-1" />}
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-purple-100 block mb-1.5">Target Price (USD)</label>
                            <input
                                type="number"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(e.target.value)}
                                placeholder="e.g. 100000"
                                step="any"
                                min="0"
                                required
                                className="w-full bg-dark-400 rounded-lg px-4 py-2.5 text-sm outline-none placeholder:text-purple-100/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="submit" disabled={!selectedCoin || !targetPrice || submitting}
                            className="bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-dark-900 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
                            {submitting ? 'Creating...' : 'Create Alert'}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)}
                            className="bg-dark-400 hover:bg-dark-400/70 text-purple-100 px-5 py-2.5 rounded-lg text-sm transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Filter tabs */}
            <div className="flex gap-2 mb-4">
                {(['all', 'active', 'triggered'] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={cn('px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors',
                            filter === f ? 'bg-dark-400 text-white' : 'text-purple-100/60 hover:text-purple-100',
                        )}>
                        {f}
                        <span className="ml-1.5 text-xs opacity-60">
                            ({f === 'all' ? alerts.length : f === 'active' ? alerts.filter(a => !a.triggered).length : alerts.filter(a => a.triggered).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Alerts list */}
            {loading && <div className="space-y-3">{Array.from({length:3}).map((_,i) => <div key={i} className="h-20 bg-dark-500 rounded-xl skeleton" />)}</div>}

            {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
                    <Bell size={40} className="text-purple-100/20" />
                    <p className="text-purple-100/60">No {filter !== 'all' ? filter : ''} alerts yet.</p>
                </div>
            )}

            <div className="space-y-3">
                {filtered.map((alert) => (
                    <div key={alert._id}
                        className={cn('flex items-center justify-between bg-dark-500 rounded-xl px-5 py-4 border transition-colors',
                            alert.triggered ? 'border-purple-600/10 opacity-60' : 'border-purple-600/20 hover:border-purple-600/40',
                        )}>
                        <div className="flex items-center gap-4">
                            {alert.triggered
                                ? <CheckCircle size={20} className="text-green-500 shrink-0" />
                                : <Bell size={20} className={cn('shrink-0', alert.direction === 'above' ? 'text-green-500' : 'text-red-500')} />
                            }
                            <div>
                                <p className="font-semibold">
                                    {alert.coinName}
                                    <span className="text-xs text-purple-100/50 ml-2 uppercase">{alert.coinSymbol}</span>
                                </p>
                                <p className="text-sm text-purple-100/70 flex items-center gap-1 mt-0.5">
                                    {alert.direction === 'above' ? <TrendingUp size={12} className="text-green-500" /> : <TrendingDown size={12} className="text-red-500" />}
                                    Alert when price goes
                                    <span className={cn('font-medium', alert.direction === 'above' ? 'text-green-500' : 'text-red-500')}>
                                        {alert.direction}
                                    </span>
                                    <span className="font-semibold text-white">{formatCurrency(alert.targetPrice)}</span>
                                </p>
                                {alert.triggered && alert.triggeredAt && (
                                    <p className="text-xs text-purple-100/40 mt-0.5">
                                        Triggered {new Date(alert.triggeredAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button onClick={() => deleteAlert(alert._id)}
                            className="p-2 rounded-lg text-purple-100/30 hover:text-red-500 hover:bg-dark-400 transition-all"
                            aria-label="Delete alert">
                            <Trash2 size={15} />
                        </button>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default AlertsPage;
