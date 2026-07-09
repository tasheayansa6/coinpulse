import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // ── Images ────────────────────────────────────────
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'assets.coingecko.com',
            },
            {
                protocol: 'https',
                hostname: 'coin-images.coingecko.com',
            },
        ],
    },

    // ── Security Headers ──────────────────────────────
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                ],
            },
            {
                // API routes — allow cross-origin reads (useful for external clients)
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
                ],
            },
        ];
    },

    // ── Logging (Next.js 15+) ─────────────────────────
    logging: {
        fetches: {
            fullUrl: process.env.NODE_ENV === 'development',
        },
    },
};

export default nextConfig;
