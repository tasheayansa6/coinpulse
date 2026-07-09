// ─────────────────────────────────────────────────────
// Custom application errors
// ─────────────────────────────────────────────────────

export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly context?: Record<string, unknown>,
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(404, `${resource} not found`);
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(400, message);
        this.name = 'ValidationError';
    }
}

export class RateLimitError extends AppError {
    constructor() {
        super(429, 'Upstream rate limit reached — please retry shortly');
        this.name = 'RateLimitError';
    }
}

export class UpstreamError extends AppError {
    constructor(statusCode: number, message: string, url?: string) {
        super(502, `Upstream error [${statusCode}]: ${message}${url ? ` — ${url}` : ''}`);
        this.name = 'UpstreamError';
    }
}
