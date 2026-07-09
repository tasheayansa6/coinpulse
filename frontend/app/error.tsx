'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    useEffect(() => {
        console.error('[CoinPulse Error]', error);
    }, [error]);

    return (
        <main className="main-container flex flex-col items-center justify-center min-h-[70vh] text-center gap-6">
            <p className="text-6xl">⚠️</p>
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold">Something went wrong</h1>
                <p className="text-purple-100/60 max-w-sm">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="px-6 py-2.5 bg-green-500 text-dark-900 font-semibold rounded-lg hover:bg-green-400 transition-colors"
                >
                    Try Again
                </button>
                <Link
                    href="/"
                    className="px-6 py-2.5 bg-dark-400 text-purple-100 font-semibold rounded-lg hover:bg-dark-400/70 transition-colors"
                >
                    Go Home
                </Link>
            </div>
        </main>
    );
}
