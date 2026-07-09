'use client';

import { useState, useEffect } from 'react';

/**
 * Returns a stable anonymous user ID from localStorage.
 * In production, replace with your real auth user ID.
 */
export function useUserId(): string {
    const [userId, setUserId] = useState('');

    useEffect(() => {
        let id = localStorage.getItem('coinpulse_user_id');
        if (!id) {
            id = `user_${Math.random().toString(36).slice(2, 10)}`;
            localStorage.setItem('coinpulse_user_id', id);
        }
        setUserId(id);
    }, []);

    return userId;
}
