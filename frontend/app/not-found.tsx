import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="main-container flex flex-col items-center justify-center min-h-[70vh] text-center gap-6">
            <p className="text-8xl font-bold text-dark-400">404</p>
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold">Page not found</h1>
                <p className="text-purple-100/60">
                    The coin or page you&apos;re looking for doesn&apos;t exist.
                </p>
            </div>
            <Link
                href="/"
                className="px-6 py-2.5 bg-green-500 text-dark-900 font-semibold rounded-lg hover:bg-green-400 transition-colors"
            >
                Back to Home
            </Link>
        </main>
    );
}
