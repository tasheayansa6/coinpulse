import React, { Suspense } from 'react';
import CoinOverview from '@/components/home/CoinOverview';
import TrendingCoins from '@/components/home/TrendingCoins';
import Categories from '@/components/home/Categories';
import TopGainersLosers from '@/components/home/TopGainersLosers';
import {
    CategoriesFallback,
    CoinOverviewFallback,
    TrendingCoinsFallback,
    TopGainersLosersFallback,
} from '@/components/home/fallback';

const Page = async () => {
    return (
        <main className="main-container">
            {/* Row 1 — Bitcoin overview + Trending */}
            <section className="home-grid">
                <Suspense fallback={<CoinOverviewFallback />}>
                    <CoinOverview />
                </Suspense>

                <Suspense fallback={<TrendingCoinsFallback />}>
                    <TrendingCoins />
                </Suspense>
            </section>

            {/* Row 2 — Top Gainers / Losers */}
            <section className="w-full">
                <Suspense fallback={<TopGainersLosersFallback />}>
                    <TopGainersLosers />
                </Suspense>
            </section>

            {/* Row 3 — Top Categories */}
            <section className="w-full space-y-4">
                <Suspense fallback={<CategoriesFallback />}>
                    <Categories />
                </Suspense>
            </section>
        </main>
    );
};

export default Page;
