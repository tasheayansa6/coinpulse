import type { FastifyInstance } from 'fastify';
import { config } from '../config';
import { getIsConnected } from '../lib/db';

export async function healthRoutes(app: FastifyInstance) {
    app.get('/health', async (_request, reply) => {
        return reply.status(200).send({
            status: 'ok',
            timestamp: Date.now(),
            uptime: Math.floor(process.uptime()),
            environment: config.NODE_ENV,
            coingecko: {
                baseUrl: config.COINGECKO_BASE_URL,
                hasApiKey: !!config.COINGECKO_API_KEY,
            },
            database: {
                configured: !!config.MONGODB_URI,
                connected: getIsConnected(),
            },
            cache: {
                driver: config.REDIS_URL ? 'redis' : 'memory',
            },
        });
    });
}
