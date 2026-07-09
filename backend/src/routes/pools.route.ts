import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPool, getTopPools } from '../services/pools.service';
import { sendSuccess, sendError } from './helpers';
import { AppError, NotFoundError } from '../lib/errors';

// ─── Validation schemas ───────────────────────────────
const poolQuerySchema = z.object({
    coin_id: z.string().min(1).max(100),
    network: z.string().optional(),
    address: z.string().optional(),
});

const topPoolsSchema = z.object({
    network: z.string().min(1),
    token_address: z.string().min(1),
    page: z.coerce.number().int().min(1).max(10).default(1),
});

// ─── Route registration ───────────────────────────────
export async function poolsRoutes(app: FastifyInstance) {
    // GET /api/pools — get a pool for a coin (by address or search)
    app.get('/pools', async (request, reply) => {
        const parsed = poolQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            return sendError(reply, 400, parsed.error.errors[0].message);
        }

        const { coin_id, network, address } = parsed.data;

        try {
            const result = await getPool(coin_id, network ?? null, address ?? null);
            return sendSuccess(reply, result.data, result.cached);
        } catch (err) {
            if (err instanceof NotFoundError) return sendError(reply, 404, err.message);
            if (err instanceof AppError) return sendError(reply, err.statusCode, err.message);
            const message = err instanceof Error ? err.message : 'Internal server error';
            return sendError(reply, 500, message);
        }
    });

    // GET /api/pools/top — top pools for a token on a network
    app.get('/pools/top', async (request, reply) => {
        const parsed = topPoolsSchema.safeParse(request.query);
        if (!parsed.success) {
            return sendError(reply, 400, parsed.error.errors[0].message);
        }

        const { network, token_address, page } = parsed.data;

        try {
            const result = await getTopPools(network, token_address, page);
            return sendSuccess(reply, result.data, result.cached);
        } catch (err) {
            if (err instanceof AppError) return sendError(reply, err.statusCode, err.message);
            const message = err instanceof Error ? err.message : 'Internal server error';
            return sendError(reply, 500, message);
        }
    });
}
