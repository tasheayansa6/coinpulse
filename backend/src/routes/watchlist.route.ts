import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
} from '../services/watchlist.service';
import { sendSuccess, sendError } from './helpers';
import { AppError, NotFoundError } from '../lib/errors';

const addSchema = z.object({
    userId:     z.string().min(1),
    coinId:     z.string().min(1),
    coinName:   z.string().min(1),
    coinSymbol: z.string().min(1),
    coinImage:  z.string().optional(),
});

const userParamSchema = z.object({
    userId: z.string().min(1),
});

const coinParamSchema = z.object({
    userId: z.string().min(1),
    coinId: z.string().min(1),
});

export async function watchlistRoutes(app: FastifyInstance) {
    // GET /api/watchlist/:userId
    app.get('/watchlist/:userId', async (request, reply) => {
        const parsed = userParamSchema.safeParse(request.params);
        if (!parsed.success) return sendError(reply, 400, parsed.error.errors[0].message);

        try {
            const data = await getWatchlist(parsed.data.userId);
            return sendSuccess(reply, data);
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // POST /api/watchlist
    app.post('/watchlist', async (request, reply) => {
        const parsed = addSchema.safeParse(request.body);
        if (!parsed.success) return sendError(reply, 400, parsed.error.errors[0].message);

        try {
            const { userId, coinId, coinName, coinSymbol, coinImage } = parsed.data;
            const data = await addToWatchlist(userId, coinId, coinName, coinSymbol, coinImage);
            return sendSuccess(reply, data, false, 201);
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // DELETE /api/watchlist/:userId/:coinId
    app.delete('/watchlist/:userId/:coinId', async (request, reply) => {
        const parsed = coinParamSchema.safeParse(request.params);
        if (!parsed.success) return sendError(reply, 400, parsed.error.errors[0].message);

        try {
            const data = await removeFromWatchlist(parsed.data.userId, parsed.data.coinId);
            return sendSuccess(reply, data);
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // GET /api/watchlist/:userId/:coinId/check
    app.get('/watchlist/:userId/:coinId/check', async (request, reply) => {
        const parsed = coinParamSchema.safeParse(request.params);
        if (!parsed.success) return sendError(reply, 400, parsed.error.errors[0].message);

        try {
            const data = await isInWatchlist(parsed.data.userId, parsed.data.coinId);
            return sendSuccess(reply, data);
        } catch (err) {
            return handleError(reply, err);
        }
    });
}

function handleError(reply: Parameters<typeof sendError>[0], err: unknown) {
    if (err instanceof NotFoundError) return sendError(reply, 404, err.message);
    if (err instanceof AppError)      return sendError(reply, err.statusCode, err.message);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return sendError(reply, 500, message);
}
