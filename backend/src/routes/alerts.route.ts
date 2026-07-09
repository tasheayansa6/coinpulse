import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
    getAlerts,
    createAlert,
    deleteAlert,
    checkAlerts,
} from '../services/alerts.service';
import { sendSuccess, sendError } from './helpers';
import { AppError, NotFoundError } from '../lib/errors';

const createSchema = z.object({
    userId:      z.string().min(1),
    coinId:      z.string().min(1),
    coinName:    z.string().min(1),
    coinSymbol:  z.string().min(1),
    targetPrice: z.number().positive(),
    direction:   z.enum(['above', 'below']),
});

const userParamSchema = z.object({
    userId: z.string().min(1),
});

const deleteParamSchema = z.object({
    userId:  z.string().min(1),
    alertId: z.string().min(1),
});

const checkSchema = z.object({
    coinId:       z.string().min(1),
    currentPrice: z.coerce.number().positive(),
});

export async function alertsRoutes(app: FastifyInstance) {
    // GET /api/alerts/:userId
    app.get('/alerts/:userId', async (request, reply) => {
        const parsed = userParamSchema.safeParse(request.params);
        if (!parsed.success) return sendError(reply, 400, parsed.error.errors[0].message);

        const { active } = request.query as { active?: string };

        try {
            const data = await getAlerts(parsed.data.userId, active === 'true');
            return sendSuccess(reply, data);
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // POST /api/alerts
    app.post('/alerts', async (request, reply) => {
        const parsed = createSchema.safeParse(request.body);
        if (!parsed.success) return sendError(reply, 400, parsed.error.errors[0].message);

        try {
            const data = await createAlert(
                parsed.data.userId,
                parsed.data.coinId,
                parsed.data.coinName,
                parsed.data.coinSymbol,
                parsed.data.targetPrice,
                parsed.data.direction,
            );
            return sendSuccess(reply, data, false, 201);
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // DELETE /api/alerts/:userId/:alertId
    app.delete('/alerts/:userId/:alertId', async (request, reply) => {
        const parsed = deleteParamSchema.safeParse(request.params);
        if (!parsed.success) return sendError(reply, 400, parsed.error.errors[0].message);

        try {
            const data = await deleteAlert(parsed.data.userId, parsed.data.alertId);
            return sendSuccess(reply, data);
        } catch (err) {
            return handleError(reply, err);
        }
    });

    // POST /api/alerts/check — check if any alerts triggered for a coin price
    app.post('/alerts/check', async (request, reply) => {
        const parsed = checkSchema.safeParse(request.body);
        if (!parsed.success) return sendError(reply, 400, parsed.error.errors[0].message);

        try {
            const triggered = await checkAlerts(parsed.data.coinId, parsed.data.currentPrice);
            return sendSuccess(reply, { triggered, count: triggered.length });
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
