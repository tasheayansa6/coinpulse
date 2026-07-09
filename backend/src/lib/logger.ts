/**
 * Lightweight request logger for Fastify hooks.
 * Pino (built into Fastify) handles actual logging —
 * this module just provides convenience helpers.
 */

export function formatDuration(startMs: number): string {
    const ms = Date.now() - startMs;
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}
