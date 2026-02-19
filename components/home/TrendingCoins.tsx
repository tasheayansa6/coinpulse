import { fetcher } from '@/lib/coingecko.actions';
import DataTable from '@/components/DataTable';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

type TrendingCoin = {
    item: {
        id: string;
        name: string;
        large: string;
        data: {
            price: number;
            price_change_percentage_24h: { usd: number };
        };
    };
};

export default async function TrendingCoins() {
    const trendingCoins = await fetcher<{ coins: TrendingCoin[] }>(
        'search/trending',
        undefined,
        300
    );

    const columns = [
        {
            header: 'Name',
            cell: (coin: TrendingCoin) => (
                <Link href={`/coins/${coin.item.id}`} className="flex items-center gap-2">
                    <Image src={coin.item.large} alt={coin.item.name} width={36} height={36} />
                    <p>{coin.item.name}</p>
                </Link>
            ),
        },
        {
            header: '24h Change',
            cell: (coin: TrendingCoin) => {
                const change = coin.item.data.price_change_percentage_24h.usd;
                const isUp = change > 0;
                return (
                    <div className={cn('flex items-center gap-1', isUp ? 'text-green-500' : 'text-red-500')}>
                        {formatPercentage(change)}
                        {isUp ? <TrendingUp width={16} height={16} /> : <TrendingDown width={16} height={16} />}
                    </div>
                );
            },
        },
        {
            header: 'Price',
            cell: (coin: TrendingCoin) => formatCurrency(coin.item.data.price),
        },
    ];

    return (
        <DataTable
            data={trendingCoins.coins.slice(0, 6)}
            columns={columns}
            rowKey={(coin) => coin.item.id}
            tableClassName="trending-coins-table"
        />
    );
}
