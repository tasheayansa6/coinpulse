import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { config, isDev } from './config';
import { sendError } from './routes/helpers';
import { coinsRoutes } from './routes/coins.route';
import { poolsRoutes } from './routes/pools.route';
import { healthRoutes } from './routes/health.route';
import { watchlistRoutes } from './routes/watchlist.route';
import { alertsRoutes } from './routes/alerts.route';

export async function buildApp() {
    const app = Fastify({
        logger: {
            level: isDev ? 'info' : 'warn',
            ...(isDev && {
                transport: {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'HH:MM:ss',
                        ignore: 'pid,hostname',
                    },
                },
            }),
        },
    });

    // ── Security headers ──────────────────────────────
    await app.register(helmet, {
        contentSecurityPolicy: false,
    });

    // ── CORS ─────────────────────────────────────────
    const allowedOrigins = config.CORS_ORIGINS.split(',').map((o) => o.trim());

    await app.register(cors, {
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
                return cb(null, true);
            }
            return cb(new Error(`CORS: origin "${origin}" not allowed`), false);
        },
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // ── Rate limiting ─────────────────────────────────
    await app.register(rateLimit, {
        max: config.RATE_LIMIT_MAX,
        timeWindow: config.RATE_LIMIT_WINDOW_MS,
        errorResponseBuilder(_req, context) {
            return {
                success: false,
                error: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)}s`,
                statusCode: 429,
                timestamp: Date.now(),
            };
        },
    });

    // ── OpenAPI / Swagger docs ────────────────────────
    await app.register(swagger, {
        openapi: {
            openapi: '3.0.0',
            info: {
                title: 'CoinPulse API',
                description: 'Crypto data API — CoinGecko · GeckoTerminal · MongoDB',
                version: '1.0.0',
            },
            servers: [{ url: `http://localhost:${config.PORT}`, description: 'Local' }],
            tags: [
                { name: 'coins',     description: 'Market data' },
                { name: 'pools',     description: 'DEX pools (GeckoTerminal)' },
                { name: 'watchlist', description: 'User watchlists (MongoDB)' },
                { name: 'alerts',    description: 'Price alerts (MongoDB)' },
                { name: 'health',    description: 'Server health' },
            ],
        },
    });

    await app.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: { docExpansion: 'list', deepLinking: false },
    });

    // ── Global error handler ──────────────────────────
    app.setErrorHandler((error: FastifyError, _request, reply) => {
        app.log.error(error);
        const statusCode = error.statusCode ?? 500;
        return sendError(reply, statusCode, error.message ?? 'Internal server error');
    });

    // ── 404 handler ───────────────────────────────────
    app.setNotFoundHandler((_request, reply) => {
        return sendError(reply, 404, 'Route not found');
    });

    // ── Routes — all under /api ───────────────────────
    await app.register(healthRoutes,    { prefix: '/api' });
    await app.register(coinsRoutes,     { prefix: '/api' });
    await app.register(poolsRoutes,     { prefix: '/api' });
    await app.register(watchlistRoutes, { prefix: '/api' });
    await app.register(alertsRoutes,    { prefix: '/api' });

    return app;
}
