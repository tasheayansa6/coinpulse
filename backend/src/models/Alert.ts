import { Schema, model, Document } from 'mongoose';

export type AlertDirection = 'above' | 'below';

export interface IAlert extends Document {
    userId: string;
    coinId: string;
    coinName: string;
    coinSymbol: string;
    targetPrice: number;
    direction: AlertDirection;
    triggered: boolean;
    triggeredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
    {
        userId:      { type: String, required: true, index: true },
        coinId:      { type: String, required: true },
        coinName:    { type: String, required: true },
        coinSymbol:  { type: String, required: true },
        targetPrice: { type: Number, required: true },
        direction:   { type: String, enum: ['above', 'below'], required: true },
        triggered:   { type: Boolean, default: false },
        triggeredAt: { type: Date },
    },
    { timestamps: true },
);

AlertSchema.index({ userId: 1, triggered: 1 });
AlertSchema.index({ coinId: 1, triggered: 1 });

export const Alert = model<IAlert>('Alert', AlertSchema);
