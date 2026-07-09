'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Star, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchModal from '@/components/SearchModal';

const NAV_LINKS = [
    { href: '/',          label: 'Home',      hideOnMobile: false },
    { href: '/coins',     label: 'All Coins', hideOnMobile: false },
    { href: '/watchlist', label: 'Watchlist', hideOnMobile: false, icon: Star },
    { href: '/alerts',    label: 'Alerts',    hideOnMobile: false, icon: Bell },
];

const Header = () => {
    const pathname  = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header>
            <div className="main-container inner">
                {/* Logo */}
                <Link href="/" onClick={() => setMenuOpen(false)}>
                    <Image src="/logo.svg" alt="CoinPulse logo" width={132} height={40} />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden sm:flex h-full items-center">
                    <Link href="/" className={cn('nav-link is-home', { 'is-active': pathname === '/' })}>
                        Home
                    </Link>

                    <SearchModal />

                    <Link href="/coins" className={cn('nav-link', { 'is-active': pathname === '/coins' })}>
                        All Coins
                    </Link>

                    <Link href="/watchlist" className={cn('nav-link flex items-center gap-1.5', { 'is-active': pathname === '/watchlist' })}>
                        <Star size={15} className={pathname === '/watchlist' ? 'text-yellow-500 fill-yellow-500' : ''} />
                        Watchlist
                    </Link>

                    <Link href="/alerts" className={cn('nav-link flex items-center gap-1.5', { 'is-active': pathname === '/alerts' })}>
                        <Bell size={15} />
                        Alerts
                    </Link>
                </nav>

                {/* Mobile: search + hamburger */}
                <div className="flex sm:hidden items-center gap-2">
                    <SearchModal />
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-2 text-purple-100 hover:text-white transition-colors"
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile drawer */}
            {menuOpen && (
                <div className="sm:hidden border-t border-dark-400 bg-dark-700">
                    <nav className="flex flex-col px-4 py-3 gap-1">
                        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMenuOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-purple-100 hover:text-white hover:bg-dark-400 transition-colors',
                                    pathname === href && 'text-white bg-dark-400',
                                )}
                            >
                                {Icon && <Icon size={17} className={
                                    href === '/watchlist' && pathname === '/watchlist' ? 'text-yellow-500 fill-yellow-500' : ''
                                } />}
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
