'use client';

import { useEffect, useRef, useState } from 'react';

// Define the missing types
export interface UseCoinGeckoWebSocketProps {
    coinId: string;
    poolId: string;
    liveInterval: string;
}

export interface ExtendedPriceData {
    usd: number;
    coin: string;
    price: number;
    change24h: number;
    marketCap: number;
    volume24h: number;
    timestamp: number;
}

export interface Trade {
    price: number;
    value: number;
    timestamp: number;
    type: string;
    amount: number;
}

export type OHLCData = [number, number, number, number, number];

export interface WebSocketMessage {
    type?: string;
    identifier?: string;
    c?: string;
    ch?: string;
    i?: string;
    p?: number;
    pp?: number;
    m?: number;
    v?: number;
    t?: number;
    pu?: number;
    vo?: number;
    ty?: string;
    to?: number;
    o?: number | string;
    h?: number | string;
    l?: number | string;
    c?: number | string;
}

export interface UseCoinGeckoWebSocketReturn {
    price: ExtendedPriceData | null;
    trades: Trade[];
    ohlcv: OHLCData | null;
    isConnected: boolean;
}

const WS_BASE = `${process.env.NEXT_PUBLIC_COINGECKO_WEBSOCKET_URL}?x_cg_pro_api_key=${process.env.NEXT_PUBLIC_COINGECKO_API_KEY}`;

export const useCoinGeckoWebSocket = ({
                                          coinId,
                                          poolId,
                                          liveInterval,
                                      }: UseCoinGeckoWebSocketProps): UseCoinGeckoWebSocketReturn => {
    const wsRef = useRef<WebSocket | null>(null);
    const subscribed = useRef<Set<string>>(new Set());

    const [price, setPrice] = useState<ExtendedPriceData | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [ohlcv, setOhlcv] = useState<OHLCData | null>(null);

    const [isWsReady, setIsWsReady] = useState(false);

    useEffect(() => {
        const ws = new WebSocket(WS_BASE);
        wsRef.current = ws;

        const send = (payload: Record<string, unknown>) => ws.send(JSON.stringify(payload));

        const handleMessage = (event: MessageEvent) => {
            const msg: WebSocketMessage = JSON.parse(event.data);

            if (msg.type === 'ping') {
                send({ type: 'pong' });
                return;
            }
            if (msg.type === 'confirm_subscription') {
                const { channel } = JSON.parse(msg?.identifier ?? '');
                subscribed.current.add(channel);
            }
            if (msg.c === 'C1') {
                setPrice({
                    usd: msg.p ?? 0,
                    coin: msg.i ?? '',
                    price: msg.p ?? 0,
                    change24h: msg.pp ?? 0,
                    marketCap: msg.m ?? 0,
                    volume24h: msg.v ?? 0,
                    timestamp: msg.t ?? 0,
                });
            }
            if (msg.c === 'G2') {
                const newTrade: Trade = {
                    price: msg.pu ?? 0,
                    value: msg.vo ?? 0,
                    timestamp: msg.t ?? 0,
                    type: msg.ty ?? '',
                    amount: msg.to ?? 0,
                };

                setTrades((prev) => [newTrade, ...prev].slice(0, 7));
            }
            if (msg.ch === 'G3') {
                const timestamp = msg.t ?? 0;

                const candle: OHLCData = [
                    timestamp,
                    Number(msg.o ?? 0),
                    Number(msg.h ?? 0),
                    Number(msg.l ?? 0),
                    Number(msg.c ?? 0),
                ];

                setOhlcv(candle);
            }
        };

        ws.onopen = () => setIsWsReady(true);
        ws.onmessage = handleMessage;
        ws.onclose = () => setIsWsReady(false);
        ws.onerror = () => setIsWsReady(false);

        return () => ws.close();
    }, []);

    useEffect(() => {
        if (!isWsReady) return;
        const ws = wsRef.current;
        if (!ws) return;

        const send = (payload: Record<string, unknown>) => ws.send(JSON.stringify(payload));

        const unsubscribeAll = () => {
            subscribed.current.forEach((channel) => {
                send({
                    command: 'unsubscribe',
                    identifier: JSON.stringify({ channel }),
                });
            });

            subscribed.current.clear();
        };

        const subscribe = (channel: string, data?: Record<string, unknown>) => {
            if (subscribed.current.has(channel)) return;

            send({ command: 'subscribe', identifier: JSON.stringify({ channel }) });

            if (data) {
                send({
                    command: 'message',
                    identifier: JSON.stringify({ channel }),
                    data: JSON.stringify(data),
                });
            }
        };

        queueMicrotask(() => {
            setPrice(null);
            setTrades([]);
            setOhlcv(null);

            unsubscribeAll();

            subscribe('CGSimplePrice', { coin_id: [coinId], action: 'set_tokens' });
        });

        const poolAddress = poolId?.replace('_', ':') ?? '';

        if (poolAddress) {
            subscribe('OnchainTrade', {
                'network_id:pool_addresses': [poolAddress],
                action: 'set_pools',
            });

            subscribe('OnchainOHLCV', {
                'network_id:pool_addresses': [poolAddress],
                interval: liveInterval,
                action: 'set_pools',
            });
        }
    }, [coinId, poolId, isWsReady, liveInterval]);

    return {
        price,
        trades,
        ohlcv,
        isConnected: isWsReady,
    };
};