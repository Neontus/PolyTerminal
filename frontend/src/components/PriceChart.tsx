import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Area, AreaChart } from 'recharts';

interface PriceChartProps {
    currentPrice: number; // 0.0 to 1.0
    timeRange: '1H' | '1D' | '1W' | '1M';
    color?: string;
    historyOverride?: { time: number; price: number }[];
}

export default function PriceChart({ currentPrice, timeRange, color = '#22c55e', historyOverride }: PriceChartProps) {

    // Generate realistic looking mock history based on current price and time range
    const data = useMemo(() => {
        if (historyOverride && historyOverride.length > 0) {
            return historyOverride;
        }

        const points = 150; // More granular
        const now = Date.now();
        const history = [];
        let price = currentPrice;

        // Volatility based on time range (scaled down for more points)
        let volatility = 0.005;
        let timeStep = 1000 * 60;

        switch (timeRange) {
            case '1H': timeStep = 1000 * 24; volatility = 0.003; break; // ~24s per point
            case '1D': timeStep = 1000 * 60 * 10; volatility = 0.008; break;
            case '1W': timeStep = 1000 * 60 * 60; volatility = 0.02; break;
            case '1M': timeStep = 1000 * 60 * 60 * 5; volatility = 0.05; break;
        }

        // Generate backwards
        for (let i = 0; i < points; i++) {
            history.unshift({
                time: now - (i * timeStep),
                price: price
            });
            // Random walk with mean reversion tendency to keep it somewhat centered
            const change = (Math.random() - 0.5) * volatility;
            price = price * (1 + change);
            // Clamp
            price = Math.max(0.01, Math.min(0.99, price));
        }
        return history;
    }, [currentPrice, timeRange, historyOverride]);

    const formattedData = data.map(d => ({
        ...d,
        formattedTime: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        displayPrice: (d.price * 100).toFixed(1)
    }));

    const isPositive = currentPrice >= (formattedData[0]?.price || 0);
    const strokeColor = isPositive ? '#22c55e' : '#ef4444'; // Green or Red

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedData}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="formattedTime"
                        hide={true}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        orientation="right"
                        tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                        tickFormatter={(val) => `${val}¢`}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '0.25rem' }}
                        formatter={(val: string) => [`${val}¢`, 'Price']}
                        labelFormatter={(label) => label}
                        cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Area
                        type="step"
                        dataKey="displayPrice"
                        stroke={strokeColor}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        strokeWidth={2}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
