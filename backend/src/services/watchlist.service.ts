import { Watchlist } from '../models/Watchlist';
import { NotFoundError } from '../lib/errors';

export async function getWatchlist(userId: string) {
    return Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();
}

export async function addToWatchlist(
    userId: string,
    coinId: string,
    coinName: string,
    coinSymbol: string,
    coinImage = '',
) {
    try {
        const doc = await Watchlist.findOneAndUpdate(
            { userId, coinId },
            { userId, coinId, coinName, coinSymbol, coinImage, addedAt: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        ).lean();
        return doc;
    } catch (err: unknown) {
        // Duplicate key on race condition — just return existing
        if ((err as { code?: number }).code === 11000) {
            return Watchlist.findOne({ userId, coinId }).lean();
        }
        throw err;
    }
}

export async function removeFromWatchlist(userId: string, coinId: string) {
    const result = await Watchlist.findOneAndDelete({ userId, coinId });
    if (!result) throw new NotFoundError(`${coinId} in watchlist`);
    return { removed: true, coinId };
}

export async function isInWatchlist(userId: string, coinId: string) {
    const exists = await Watchlist.exists({ userId, coinId });
    return { inWatchlist: !!exists };
}
