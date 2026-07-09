import React from 'react';
import { getCoin, getOHLC, getPools } from '@/lib/coingecko.actions';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import LiveDataWrapper from '@/components/LiveDataWrapper';
import Converter from '@/components/Converter';
import WatchlistButton from '@/components/WatchlistButton';
import { notFound } from 'next/navigation';

const Page = async ({ params }: NextPageProps) => {
    const { id } = await params;

    const [coinData, coinOHLCData] = await Promise.all([
        getCoin(id),
        getOHLC(id, 1),
    ]);

    if (!coinData) notFound();
    // After notFound() throws, coinData is guaranteed non-null below
    const coin = coinData!;

    const platform = coin.asset_platform_id
        ? coin.detail_platforms?.[coin.asset_platform_id]
        : null;
    const network = platform?.geckoterminal_url?.split('/')[3] || null;
    const contractAddress = platform?.contract_address || null;

    // Get pool data if available
    const pool = await getPools(id, network, contractAddress);

    const coinDetails = [
        {
            label: 'Market Cap',
            value: formatCurrency(coin.market_data?.market_cap?.usd || 0),
        },
        {
            label: 'Market Cap Rank',
            value: coin.market_cap_rank ? `# ${coin.market_cap_rank}` : '-',
        },
        {
            label: 'Total Volume',
            value: formatCurrency(coin.market_data?.total_volume?.usd || 0),
        },
        {
            label: 'Website',
            value: '-',
            link: coin.links?.homepage?.[0],
            linkText: 'Homepage',
        },
        {
            label: 'Explorer',
            value: '-',
            link: coin.links?.blockchain_site?.[0],
            linkText: 'Explorer',
        },
        {
            label: 'Community',
            value: '-',
            link: coin.links?.subreddit_url,
            linkText: 'Community',
        },
    ];

    return (
        <main id="coin-details-page">
            <section className="primary">
                <LiveDataWrapper
                    coinId={id}
                    poolId={pool?.id || ''}
                    coin={coin}
                    coinOHLCData={coinOHLCData}
                >
                    <h4>Exchange Listings</h4>
                </LiveDataWrapper>
            </section>

            <section className="secondary">
                <Converter
                    symbol={coin.symbol || ''}
                    icon={coin.image?.small || ''}
                    priceList={coin.market_data?.current_price || {}}
                />

                <WatchlistButton
                    coinId={coin.id}
                    coinName={coin.name}
                    coinSymbol={coin.symbol}
                    coinImage={coin.image?.small || ''}
                />

                <div className="details">
                    <h4>Coin Details</h4>

                    <ul className="details-grid">
                        {coinDetails.map(({ label, value, link, linkText }, index) => (
                            <li key={index}>
                                <p className="label">{label}</p>

                                {link ? (
                                    <div className="link">
                                        <Link href={link} target="_blank">
                                            {linkText || label}
                                        </Link>
                                        <ArrowUpRight size={16} />
                                    </div>
                                ) : (
                                    <p className="text-base font-medium">{value}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </main>
    );
};

export default Page;