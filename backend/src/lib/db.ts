import mongoose from 'mongoose';
import { config } from '../config';

let isConnected = false;

export async function connectDB(): Promise<void> {
    if (isConnected) return;

    if (!config.MONGODB_URI) {
        console.warn('[DB] MONGODB_URI not set — skipping MongoDB connection');
        return;
    }

    try {
        // serverSelectionTimeoutMS: fail fast if Atlas is unreachable
        // so the server still boots and other routes work
        await mongoose.connect(config.MONGODB_URI, {
            dbName: 'coinpulse',
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 10000,
        });

        isConnected = true;
        console.log('[DB] ✅  Connected to MongoDB Atlas');

        mongoose.connection.on('disconnected', () => {
            isConnected = false;
            console.warn('[DB] MongoDB disconnected — will auto-reconnect');
        });

        mongoose.connection.on('error', (err) => {
            console.error('[DB] MongoDB error:', err.message);
        });

    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[DB] ❌  MongoDB connection failed:', message);
        console.warn('[DB] Server will run without database features');
        // Don't throw — let the server start anyway
    }
}

export async function disconnectDB(): Promise<void> {
    if (!isConnected) return;
    await mongoose.disconnect();
    isConnected = false;
    console.log('[DB] Disconnected from MongoDB');
}

export function getIsConnected(): boolean {
    return isConnected;
}

export { mongoose };
