import 'dotenv/config';
import { z } from 'zod';

// ─── Schema ──────────────────────────────────────────
const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(4000),
    HOST: z.string().default('0.0.0.0'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    COINGECKO_BASE_URL: z.string().url().default('https://api.coingecko.com/api/v3'),
    COINGECKO_API_KEY: z.string().optional(),

    GECKOTERMINAL_BASE_URL: z
        .string()
        .url()
        .default('https://api.geckoterminal.com/api/v2'),

    MONGODB_URI: z.string().optional(),
    REDIS_URL: z.string().optional(),

    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
});

// ─── Validate & export ────────────────────────────────
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌  Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const config = parsed.data;

export const isDev = config.NODE_ENV === 'development';
export const isProd = config.NODE_ENV === 'production';
