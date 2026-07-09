import { CoinSnapshot } from '../models/CoinSnapshot';
import type { CoinMarketData } from '../types/coingecko';

/** Save a batch of market coins as snapshots */
export async function saveSnapshots(coins: CoinMarketData[]) {
    const docs = coins.map((c) => ({
        coinId:    c.id,
        symbol:    c.symbol,
        name:      c.name,
        price:     c.current_price,
        marketCap: c.market_cap,
        volume24h: c.total_volume,
        change24h: c.price_change_percentage_24h,
        snapshotAt: new Date(),
    }));

    await CoinSnapshot.insertMany(docs, { ordered: false });
    return { saved: docs.length };
}

/** Get price history for a single coin (last N snapshots) */
export async function getCoinHistory(coinId: string, limit = 100) {
    return CoinSnapshot.find({ coinId })
        .sort({ snapshotAt: -1 })
        .limit(limit)
        .select('price change24h snapshotAt -_id')
        .lean();
}

/** Get the latest snapshot for each of the given coin IDs */
export async function getLatestSnapshots(coinIds: string[]) {
    return CoinSnapshot.aggregate([
        { $match: { coinId: { $in: coinIds } } },
        { $sort: { snapshotAt: -1 } },
        {
            $group: {
                _id: '$coinId',
                price:      { $first: '$price' },
                change24h:  { $first: '$change24h' },
                snapshotAt: { $first: '$snapshotAt' },
            },
        },
    ]);
}
