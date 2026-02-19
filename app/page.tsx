import React, { Suspense } from "react";
import CoinOverview from "@/components/home/CoinOverview";
import TrendingCoins from "@/components/home/TrendingCoins";
import Categories from "@/components/home/Categories";
import {
    CategoriesFallback,
    CoinOverviewFallback,
    TrendingCoinsFallback,
} from "@/components/home/fallback";

const Page = async () => {
    return (
        <main className="main-container">
            <section className="home-grid">
                <Suspense fallback={<CoinOverviewFallback />}>
                    {/* Must be async component */}
                    <CoinOverview />
                </Suspense>

                <Suspense fallback={<TrendingCoinsFallback />}>
                    <TrendingCoins />
                </Suspense>
            </section>

            <section className="w-full mt-7 space-y-4">
                <Suspense fallback={<CategoriesFallback />}>
                    <Categories />
                </Suspense>
            </section>
        </main>
    );
};

export default Page;
