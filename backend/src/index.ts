import { buildApp } from './app';
import { config } from './config';
import { connectDB, disconnectDB } from './lib/db';

async function start() {
    // ── Connect to MongoDB first ──────────────────────
    if (config.MONGODB_URI) {
        await connectDB();
    } else {
        console.warn('[DB] MONGODB_URI not set — database features disabled');
    }

    // ── Start Fastify ─────────────────────────────────
    const app = await buildApp();

    try {
        await app.listen({ port: config.PORT, host: config.HOST });
        app.log.info(`🚀  CoinPulse API  →  http://localhost:${config.PORT}`);
        app.log.info(`📖  Swagger docs   →  http://localhost:${config.PORT}/docs`);
        app.log.info(`🗄️   MongoDB        →  ${config.MONGODB_URI ? 'connected' : 'disabled'}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

// ── Graceful shutdown ──────────────────────────────────
async function shutdown(signal: string) {
    console.log(`\n[${signal}] Shutting down...`);
    await disconnectDB();
    process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

start();
