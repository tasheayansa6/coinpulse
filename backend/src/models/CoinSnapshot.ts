import { Schema, model, Document } from 'mongoose';

/**
 * CoinSnapshot — periodic price snapshots saved to Atlas.
 * Stored in the existing `coinpulse` collection.
 */
export interface ICoinSnapshot extends Document {
    coinId: string;
    symbol: string;
    name: string;
    price: number;
    marketCap: number;
    volume24h: number;
    change24h: number;
    snapshotAt: Date;
}

const CoinSnapshotSchema = new Schema<ICoinSnapshot>(
    {
        coinId:     { type: String, required: true, index: true },
        symbol:     { type: String, required: true },
        name:       { type: String, required: true },
        price:      { type: Number, required: true },
        marketCap:  { type: Number, default: 0 },
        volume24h:  { type: Number, default: 0 },
        change24h:  { type: Number, default: 0 },
        snapshotAt: { type: Date,   default: Date.now, index: true },
    },
    {
        timestamps: false,
        collection: 'coinpulse', // uses your existing collection
    },
);

CoinSnapshotSchema.index({ coinId: 1, snapshotAt: -1 });

export const CoinSnapshot = model<ICoinSnapshot>('CoinSnapshot', CoinSnapshotSchema);
