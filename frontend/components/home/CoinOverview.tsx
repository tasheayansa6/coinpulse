import React from 'react';
import { getCoin, getOHLC } from '@/lib/coingecko.actions';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { CoinOverviewFallback } from './fallback';
import CandlestickChart from '@/components/CandlestickChart';

const CoinOverview = async () => {
    try {
        const [coin, coinOHLCData] = await Promise.all([
            getCoin('bitcoin'),
            getOHLC('bitcoin', 1),
        ]);

        if (!coin) return <CoinOverviewFallback />;

        return (
            <div id="coin-overview">
                <CandlestickChart data={coinOHLCData} coinId="bitcoin">
                    <div className="header pt-2">
                        <Image src={coin.image.large} alt={coin.name} width={56} height={56} />
                        <div className="info">
                            <p>
                                {coin.name} / {coin.symbol.toUpperCase()}
                            </p>
                            <h1>{formatCurrency(coin.market_data.current_price.usd)}</h1>
                        </div>
                    </div>
                </CandlestickChart>
            </div>
        );
    } catch (error) {
        console.error('Error fetching coin overview:', error);
        return <CoinOverviewFallback />;
    }
};

export default CoinOverview;
