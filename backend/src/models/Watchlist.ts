import { Schema, model, Document } from 'mongoose';

export interface IWatchlist extends Document {
    userId: string;
    coinId: string;
    coinName: string;
    coinSymbol: string;
    coinImage: string;
    addedAt: Date;
}

const WatchlistSchema = new Schema<IWatchlist>(
    {
        userId:     { type: String, required: true, index: true },
        coinId:     { type: String, required: true },
        coinName:   { type: String, required: true },
        coinSymbol: { type: String, required: true },
        coinImage:  { type: String, default: '' },
        addedAt:    { type: Date,   default: Date.now },
    },
    { timestamps: true },
);

// One coin per user — no duplicates
WatchlistSchema.index({ userId: 1, coinId: 1 }, { unique: true });

export const Watchlist = model<IWatchlist>('Watchlist', WatchlistSchema);
