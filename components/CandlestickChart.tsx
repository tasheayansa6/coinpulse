'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
    getCandlestickConfig,
    getChartConfig,
    LIVE_INTERVAL_BUTTONS,
    PERIOD_BUTTONS,
    PERIOD_CONFIG,
} from '@/constants';

import {
    CandlestickSeries,
    createChart,
    IChartApi,
    ISeriesApi,
} from 'lightweight-charts';

import { fetcher } from '@/lib/coingecko.actions';
import { convertOHLCData } from '@/lib/utils';

const CandlestickChart = ({
                              children,
                              data,
                              coinId,
                              height = 360,
                              initialPeriod = 'daily',
                              liveOhlcv = null,
                              mode = 'historical',
                              liveInterval,
                              setLiveInterval,
                          }: CandlestickChartProps) => {

    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef =
        useRef<ISeriesApi<'Candlestick'> | null>(null);

    const prevOhlcDataLength = useRef<number>(
        data?.length || 0
    );

    const [period, setPeriod] =
        useState(initialPeriod);

    const [ohlcData, setOhlcData] =
        useState<OHLCData[]>(data ?? []);

    const [isPending, startTransition] =
        useTransition();

    /* =====================================================
       FETCH OHLC (FREE API SAFE)
    ===================================================== */
    const fetchOHLCData = async (
        selectedPeriod: Period
    ) => {
        try {
            // ✅ FREE API ONLY NEEDS DAYS
            const { days } =
                PERIOD_CONFIG[selectedPeriod];

            const newData =
                await fetcher<OHLCData[]>(
                    `coins/${coinId}/ohlc`,
                    {
                        vs_currency: 'usd',
                        days,
                    }
                );

            startTransition(() => {
                setOhlcData(newData ?? []);
            });

        } catch (error) {
            console.error(
                'Failed to fetch OHLC',
                error
            );
        }
    };

    const handlePeriodChange = (
        newPeriod: Period
    ) => {
        if (newPeriod === period) return;

        setPeriod(newPeriod);
        fetchOHLCData(newPeriod);
    };

    /* =====================================================
       CREATE CHART
    ===================================================== */
    useEffect(() => {

        const container =
            chartContainerRef.current;

        if (!container) return;

        const showTime =
            ['daily', 'weekly', 'monthly']
                .includes(period);

        const chart = createChart(container, {
            ...getChartConfig(height, showTime),
            width: container.clientWidth,
        });

        const series = chart.addSeries(
            CandlestickSeries,
            getCandlestickConfig()
        );

        const converted =
            ohlcData.map(item => [
                Math.floor(item[0] / 1000),
                item[1],
                item[2],
                item[3],
                item[4],
            ] as OHLCData);

        series.setData(
            convertOHLCData(converted)
        );

        chart.timeScale().fitContent();

        chartRef.current = chart;
        candleSeriesRef.current = series;

        const observer =
            new ResizeObserver(entries => {
                if (!entries.length) return;

                chart.applyOptions({
                    width:
                    entries[0]
                        .contentRect.width,
                });
            });

        observer.observe(container);

        return () => {
            observer.disconnect();
            chart.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
        };

    }, [height, period]);

    /* =====================================================
       UPDATE DATA
    ===================================================== */
    useEffect(() => {

        if (!candleSeriesRef.current) return;

        const converted =
            ohlcData.map(item => [
                Math.floor(item[0] / 1000),
                item[1],
                item[2],
                item[3],
                item[4],
            ] as OHLCData);

        let merged: OHLCData[];

        if (liveOhlcv) {
            const last =
                converted[
                converted.length - 1
                    ];

            if (
                last &&
                last[0] === liveOhlcv[0]
            ) {
                merged = [
                    ...converted.slice(0, -1),
                    liveOhlcv,
                ];
            } else {
                merged = [
                    ...converted,
                    liveOhlcv,
                ];
            }
        } else {
            merged = converted;
        }

        merged.sort(
            (a, b) => a[0] - b[0]
        );

        candleSeriesRef.current.setData(
            convertOHLCData(merged)
        );

        const changed =
            prevOhlcDataLength.current !==
            ohlcData.length;

        if (
            changed ||
            mode === 'historical'
        ) {
            chartRef.current
                ?.timeScale()
                .fitContent();

            prevOhlcDataLength.current =
                ohlcData.length;
        }

    }, [ohlcData, period, liveOhlcv, mode]);

    /* =====================================================
       UI
    ===================================================== */
    return (
        <div id="candlestick-chart">

            <div className="chart-header">

                <div className="flex-1">
                    {children}
                </div>

                <div className="button-group">
                    <span className="text-sm mx-2 font-medium text-purple-100/50">
                        Period:
                    </span>

                    {PERIOD_BUTTONS.map(
                        ({ value, label }) => (
                            <button
                                key={value}
                                className={
                                    period === value
                                        ? 'config-button-active'
                                        : 'config-button'
                                }
                                onClick={() =>
                                    handlePeriodChange(
                                        value
                                    )
                                }
                                disabled={isPending}
                            >
                                {label}
                            </button>
                        )
                    )}
                </div>

                {liveInterval && (
                    <div className="button-group">
                        <span className="text-sm mx-2 font-medium text-purple-100/50">
                            Update Frequency:
                        </span>

                        {LIVE_INTERVAL_BUTTONS.map(
                            ({ value, label }) => (
                                <button
                                    key={value}
                                    className={
                                        liveInterval === value
                                            ? 'config-button-active'
                                            : 'config-button'
                                    }
                                    onClick={() =>
                                        setLiveInterval?.(
                                            value
                                        )
                                    }
                                >
                                    {label}
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>

            <div
                ref={chartContainerRef}
                className="chart"
                style={{ height }}
            />
        </div>
    );
};

export default CandlestickChart;