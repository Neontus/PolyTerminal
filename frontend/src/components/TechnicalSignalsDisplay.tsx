import type { SignalData, TechnicalSignals } from "../hooks/useTechnicalIndicators";
import { Activity, Zap, BarChart2, TrendingUp, AlertTriangle } from "lucide-react";

interface TechnicalSignalsProps {
    signals: TechnicalSignals | null;
}

export default function TechnicalSignalsDisplay({ signals }: TechnicalSignalsProps) {
    const items = [
        { key: 'rsi', icon: Activity },
        { key: 'macd', icon: BarChart2 },
        { key: 'zScore', icon: Zap },
        { key: 'momentum', icon: TrendingUp },
        { key: 'volatility', icon: AlertTriangle }
    ];

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                Technical Analysis
            </h3>

            {!signals ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-gray-500 text-xs italic">
                    Not enough price data for technical analysis.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {items.map(({ key, icon: Icon }) => {
                        // @ts-ignore
                        const data: SignalData = signals[key];
                        if (!data) return null; // Safety check

                        return (
                            <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                                    <Icon className="w-3 h-3" />
                                    {data.label}
                                </div>
                                <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-sm font-mono text-white">
                                        {typeof data.value === 'number' ? data.value.toFixed(2) : data.value}
                                    </span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40 ${data.color}`}>
                                        {data.signal}
                                    </span>
                                </div>
                                <div className={`text-[10px] truncate ${data.color.replace('text-', 'text-opacity-80 text-')}`}>
                                    {data.description}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
