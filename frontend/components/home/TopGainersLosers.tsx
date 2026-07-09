import { getMarkets } from '@/lib/coingecko.actions';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';

const TopGainersLosers = async () => {
    const coins = await getMarkets(1, 100);

    // Sort by 24h change
    const sorted = [...coins].sort(
        (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h,
    );

    const gainers = sorted.slice(0, 5);
    const losers  = sorted.slice(-5).reverse();

    const CoinRow = ({ coin }: { coin: CoinMarketData }) => {
        const isUp = coin.price_change_percentage_24h >= 0;
        return (
            <Link
                href={`/coins/${coin.id}`}
                className="flex items-center justify-between py-3 px-4 hover:bg-dark-400/50 transition-colors rounded-lg group"
            >
                <div className="flex items-center gap-3">
                    <Image src={coin.image} alt={coin.name} width={32} height={32} className="rounded-full" />
                    <div>
                        <p className="font-semibold text-sm group-hover:text-white transition-colors">
                            {coin.name}
                        </p>
                        <p className="text-xs text-purple-100/60 uppercase">{coin.symbol}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(coin.current_price)}</p>
                    <p className={cn('flex items-center justify-end gap-1 text-xs font-medium',
                        isUp ? 'text-green-500' : 'text-red-500')}>
                        {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {formatPercentage(coin.price_change_percentage_24h)}
                    </p>
                </div>
            </Link>
        );
    };

    return (
        <div id="top-gainers-losers" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gainers */}
            <div className="bg-dark-500 rounded-xl overflow-hidden">
                <div className="tabs-list px-4 pt-4 pb-0">
                    <h4 className="tabs-trigger text-green-500 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Top Gainers
                        <span className="text-xs text-purple-100/50 font-normal">(24h)</span>
                    </h4>
                </div>
                <div className="tabs-content px-2 pb-2 pt-1">
                    {gainers.map((coin) => <CoinRow key={coin.id} coin={coin} />)}
                </div>
            </div>

            {/* Losers */}
            <div className="bg-dark-500 rounded-xl overflow-hidden">
                <div className="tabs-list px-4 pt-4 pb-0">
                    <h4 className="tabs-trigger text-red-500 flex items-center gap-2">
                        <TrendingDown size={20} />
                        Top Losers
                        <span className="text-xs text-purple-100/50 font-normal">(24h)</span>
                    </h4>
                </div>
                <div className="tabs-content px-2 pb-2 pt-1">
                    {losers.map((coin) => <CoinRow key={coin.id} coin={coin} />)}
                </div>
            </div>
        </div>
    );
};

export default TopGainersLosers;
