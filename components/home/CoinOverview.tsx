'use server';
import { fetcher } from '@/lib/coingecko.actions';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';

type CoinDetailsData = {
    id: string;
    name: string;
    symbol: string;
    image: { large: string };
    market_data: {
        current_price: { usd: number };
        price_change_percentage_24h: number;
    };
};

const CoinOverview = async () => {
    const coin = await fetcher<CoinDetailsData>('coins/bitcoin', {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false,
    });

    return (
        <div id="coin-overview" className="p-4 bg-white shadow rounded-lg">
            <div className="header flex items-center gap-4">
                <Image src={coin.image.large} alt={coin.name} width={64} height={64} />
                <div className="info">
                    <p className="text-lg font-semibold">
                        {coin.name} / {coin.symbol.toUpperCase()}
                    </p>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {formatCurrency(coin.market_data.current_price.usd)}
                    </h1>
                    <p
                        className={
                            coin.market_data.price_change_percentage_24h > 0
                                ? 'text-green-500'
                                : 'text-red-500'
                        }
                    >
                        {coin.market_data.price_change_percentage_24h.toFixed(2)}%
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CoinOverview;
