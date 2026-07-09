import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
    getMarkets,
    getCoin,
    getOHLC,
    getTrending,
    getCategories,
    getSimplePrice,
    searchCoins,
} from '../services/coins.service';
import { sendSuccess, sendError } from './helpers';
import { AppError, NotFoundError } from '../lib/errors';

// ─── Validation schemas ───────────────────────────────
const marketsSchema = z.object({
    page: z.coerce.number().int().min(1).max(250).default(1),
    per_page: z.coerce.number().int().min(1).max(250).default(10),
    currency: z
        .string()
        .regex(/^[a-z]{2,10}$/)
        .default('usd'),
    order: z
        .enum([
            'market_cap_desc',
            'market_cap_asc',
            'volume_desc',
            'volume_asc',
            'id_asc',
            'id_desc',
        ])
        .default('market_cap_desc'),
    sparkline: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .default('false'),
});

const coinIdSchema = z.object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'Invalid coin ID format'),
});

const ohlcSchema = z.object({
    days: z
        .enum(['1', '7', '14', '30', '90', '180', '365', 'max'])
        .default('1'),
    currency: z
        .string()
        .regex(/^[a-z]{2,10}$/)
        .default('usd'),
});

const priceSchema = z.object({
    ids: z
        .string()
        .min(1)
        .transform((v) =>
            v
                .split(',')
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean),
        )
        .refine((ids) => ids.length > 0 && ids.length <= 50, {
            message: 'Provide between 1 and 50 comma-separated coin IDs',
        })
        .refine((ids) => ids.every((id) => /^[a-z0-9-]+$/.test(id)), {
            message: 'Invalid coin ID format',
        }),
    currencies: z.string().default('usd'),
});

const searchSchema = z.object({
    q: z.string().min(1).max(100),
});

const categoriesSchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ─── Route registration ───────────────────────────────
export async function coinsRoutes(app: FastifyInstance) {
    // GET /api/coins — paginated market list
    app.get('/coins', async (request, reply) => {
        const parsed = marketsSchema.safeParse(request.query);
        if (!parsed.success) {
            return sendError(reply, 400, parsed.error.errors[0].message);
        }

        try {
            const { page, per_page, currency, order, sparkline } = parsed.data;
            const result = await getMarkets({ page, perPage: per_page, currency, order, sparkline });
            return sendSuccess(reply, result.data, result.cached);
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // GET /api/coins/trending
    app.get('/coins/trending', async (_request, reply) => {
        try {
            const result = await getTrending();
            return sendSuccess(reply, result.data, result.cached);
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // GET /api/coins/categories
    app.get('/coins/categories', async (request, reply) => {
        const parsed = categoriesSchema.safeParse(request.query);
        if (!parsed.success) {
            return sendError(reply, 400, parsed.error.errors[0].message);
        }

        try {
            const result = await getCategories(parsed.data.limit);
            return sendSuccess(reply, result.data, result.cached);
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // GET /api/coins/price — simple bulk price
    app.get('/coins/price', async (request, reply) => {
        const parsed = priceSchema.safeParse(request.query);
        if (!parsed.success) {
            return sendError(reply, 400, parsed.error.errors[0].message);
        }

        try {
            const result = await getSimplePrice({
                ids: parsed.data.ids,
                currencies: parsed.data.currencies,
            });
            return sendSuccess(reply, result.data, result.cached);
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // GET /api/coins/search?q=
    app.get('/coins/search', async (request, reply) => {
        const parsed = searchSchema.safeParse(request.query);
        if (!parsed.success) {
            return sendError(reply, 400, parsed.error.errors[0].message);
        }

        try {
            const result = await searchCoins(parsed.data.q);
            return sendSuccess(reply, result.data, result.cached);
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // GET /api/coins/:id — full coin details
    app.get('/coins/:id', async (request, reply) => {
        const parsed = coinIdSchema.safeParse(request.params);
        if (!parsed.success) {
            return sendError(reply, 400, parsed.error.errors[0].message);
        }

        try {
            const result = await getCoin(parsed.data.id);
            return sendSuccess(reply, result.data, result.cached);
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // GET /api/coins/:id/ohlc
    app.get('/coins/:id/ohlc', async (request, reply) => {
        const idParsed = coinIdSchema.safeParse(request.params);
        if (!idParsed.success) {
            return sendError(reply, 400, idParsed.error.errors[0].message);
        }

        const qParsed = ohlcSchema.safeParse(request.query);
        if (!qParsed.success) {
            return sendError(reply, 400, qParsed.error.errors[0].message);
        }

        try {
            const { days, currency } = qParsed.data;
            const result = await getOHLC({
                coinId: idParsed.data.id,
                days: days === 'max' ? 'max' : parseInt(days, 10),
                currency,
            });
            return sendSuccess(reply, result.data, result.cached);
        } catch (err) {
            return handleError(reply, err);
        }
    });
}

// ─── Error handler ────────────────────────────────────
function handleError(reply: Parameters<typeof sendError>[0], err: unknown) {
    if (err instanceof NotFoundError) return sendError(reply, 404, err.message);
    if (err instanceof AppError) return sendError(reply, err.statusCode, err.message);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return sendError(reply, 500, message);
}
