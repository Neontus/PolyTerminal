import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis, XAxis, ReferenceLine } from 'recharts';
import { AlertTriangle } from 'lucide-react';

interface ConfidenceChartProps {
    data: { timestamp: number; confidence: number; price: number }[];
    isAnomaly?: boolean;
    color?: string;
}

export default function ConfidenceChart({ data, isAnomaly, color = '#60A5FA' }: ConfidenceChartProps) {
    if (!data || data.length === 0) {
        return <div className="h-40 flex items-center justify-center text-gray-500 text-xs">No history data</div>;
    }

    // Format data for Recharts
    const chartData = data.map(d => ({
        ...d,
        time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }));

    return (
        <div className="w-full h-full overflow-hidden">
            {isAnomaly && (
                <div className="absolute top-0 right-0 z-10 flex items-center gap-1 bg-red-500/20 text-red-300 px-2 py-0.5 rounded text-xs border border-red-500/30 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Volatility Detection</span>
                </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <XAxis
                        dataKey="time"
                        hide
                    />
                    <YAxis
                        domain={[0, 100]}
                        hide
                    />
                    <Tooltip
                        cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeOpacity: 0.2 }}
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '12px', borderRadius: '8px' }}
                        itemStyle={{ color: '#94a3b8' }}
                        labelStyle={{ color: '#e2e8f0', marginBottom: '4px', display: 'block' }}
                        labelFormatter={(label) => `Time: ${label}`}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Confidence']}
                    />
                    <ReferenceLine y={50} stroke="#334155" strokeDasharray="3 3" />
                    <Line
                        type="monotone"
                        dataKey="confidence"
                        stroke={isAnomaly ? '#F87171' : color}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
