import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';

interface ConfidenceMeterProps {
    confidence: number; // 0-100
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export default function ConfidenceMeter({ confidence, size = 'md', showLabel = true }: ConfidenceMeterProps) {
    // Determine color based on confidence
    const getColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 50) return 'text-blue-400';
        if (score >= 30) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 50) return 'bg-blue-500';
        if (score >= 30) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const color = getColor(confidence);
    const bgColor = getBgColor(confidence);

    // Calculate dimensions
    const width = size === 'lg' ? 200 : size === 'md' ? 120 : 80;
    const height = size === 'lg' ? 12 : size === 'md' ? 8 : 4;

    return (
        <div className="flex flex-col gap-1">
            {showLabel && (
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Confidence
                    </span>
                    <span className={`font-bold ${color}`}>{confidence.toFixed(1)}%</span>
                </div>
            )}

            <div className="relative bg-white/5 rounded-full overflow-hidden" style={{ width, height }}>
                {/* Background segments for context */}
                <div className="absolute inset-0 flex">
                    <div className="w-1/3 h-full border-r border-black/20 bg-red-500/10"></div>
                    <div className="w-1/3 h-full border-r border-black/20 bg-yellow-500/10"></div>
                    <div className="w-1/3 h-full bg-green-500/10"></div>
                </div>

                {/* The bar itself */}
                <div
                    className={`h-full ${bgColor} transition-all duration-500 ease-out relative shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                    style={{ width: `${confidence}%` }}
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                </div>
            </div>

            {size === 'lg' && (
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-1">
                    <span>Low</span>
                    <span>High</span>
                </div>
            )}
        </div>
    );
}
