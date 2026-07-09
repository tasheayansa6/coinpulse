import type { FastifyReply } from 'fastify';
import type { ApiSuccessResponse, ApiErrorResponse } from '../types/api';

/** Send a successful JSON response */
export function sendSuccess<T>(
    reply: FastifyReply,
    data: T,
    cached = false,
    statusCode = 200,
): FastifyReply {
    const body: ApiSuccessResponse<T> = {
        success: true,
        data,
        cached,
        timestamp: Date.now(),
    };
    return reply.status(statusCode).send(body);
}

/** Send an error JSON response */
export function sendError(
    reply: FastifyReply,
    statusCode: number,
    message: string,
): FastifyReply {
    const body: ApiErrorResponse = {
        success: false,
        error: message,
        statusCode,
        timestamp: Date.now(),
    };
    return reply.status(statusCode).send(body);
}
