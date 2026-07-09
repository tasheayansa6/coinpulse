
import React from 'react';
import DataTable from '@/components/DataTable';
import { cn } from '@/lib/utils';

export const CoinOverviewFallback = () => {
    return (
        <div id="coin-overview-fallback">
            <div className="header pt-2">
                <div className="header-image skeleton" />
                <div className="info">
                    <div className="header-line-sm skeleton" />
                    <div className="header-line-lg skeleton" />
                </div>
            </div>
            <div className="chart">
                <div className="chart-skeleton skeleton" />
            </div>
        </div>
    );
};

export const TrendingCoinsFallback = () => {
    const columns = [
        {
            header: 'Name',
            cell: () => (
                <div className="name-link">
                    <div className="name-image skeleton" />
                    <div className="name-line skeleton" />
                </div>
            ),
        },
        {
            header: '24h Change',
            cell: () => (
                <div className="price-change">
                    <div className="change-icon skeleton" />
                    <div className="change-line skeleton" />
                </div>
            ),
        },
        {
            header: 'Price',
            cell: () => <div className="price-line skeleton" />,
        },
    ];

    const dummyData = Array.from({ length: 6 }, (_, i) => ({ id: i }));

    return (
        <div id="trending-coins-fallback">
            <h4>Trending Coins</h4>
            <DataTable
                data={dummyData}
                columns={columns as any}
                rowKey={(item: any) => item.id}
                tableClassName="trending-coins-table"
            />
        </div>
    );
};

export const TopGainersLosersFallback = () => {
    const rows = Array.from({ length: 5 }, (_, i) => i);
    return (
        <div id="top-gainers-losers" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((col) => (
                <div key={col} className="bg-dark-500 rounded-xl overflow-hidden p-4 space-y-3">
                    <div className="h-7 w-36 skeleton rounded-md" />
                    {rows.map((i) => (
                        <div key={i} className="flex items-center justify-between px-2 py-2">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full skeleton" />
                                <div className="space-y-1.5">
                                    <div className="h-3.5 w-20 skeleton rounded" />
                                    <div className="h-3 w-12 skeleton rounded" />
                                </div>
                            </div>
                            <div className="space-y-1.5 text-right">
                                <div className="h-3.5 w-16 skeleton rounded" />
                                <div className="h-3 w-10 skeleton rounded ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
    const columns = [
        {
            header: 'Category',
            cellClassName: 'category-cell',
            cell: () => <div className="category-line skeleton" />,
        },
        {
            header: 'Top Gainers',
            cellClassName: 'top-gainers-cell',
            cell: () => (
                <div className="flex gap-1">
                    <div className="gainer-image skeleton" />
                    <div className="gainer-image skeleton" />
                    <div className="gainer-image skeleton" />
                </div>
            ),
        },
        {
            header: '24h Change',
            cellClassName: 'change-header-cell',
            cell: () => (
                <div className="change-cell">
                    <div className="change-icon skeleton" />
                    <div className="change-line skeleton" />
                </div>
            ),
        },
        {
            header: 'Market Cap',
            cellClassName: 'market-cap-cell',
            cell: () => <div className="value-skeleton-lg skeleton" />,
        },
        {
            header: '24h Volume',
            cellClassName: 'volume-cell',
            cell: () => <div className="value-skeleton-md skeleton" />,
        },
    ];

    const dummyData = Array.from({ length: 10 }, (_, i) => ({ id: i }));

    return (
        <div id="categories-fallback">
            <h4>Top Categories</h4>
            <DataTable
                data={dummyData}
                columns={columns as any}
                rowKey={(item: any) => item.id}
                tableClassName="mt-3"
            />
        </div>
    );
};
