import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Lock, Unlock } from 'lucide-react';

// Mock data for demonstration
const mockMarkets = [
    {
        id: '1',
        question: 'Will Bitcoin reach $100,000 by end of 2024?',
        currentPrice: 0.67,
        volume24h: 125000,
        category: 'Crypto',
        signals: [
            {
                id: 's1',
                analyst: '7xKX...9pQz',
                direction: 1,
                confidence: 85,
                zScore: 1.8,
                price: 2.5,
                isPurchased: false,
            },
            {
                id: 's2',
                analyst: '4mNv...2kLp',
                direction: -1,
                confidence: 72,
                zScore: -1.2,
                price: 0,
                isPurchased: false,
            },
        ],
    },
    {
        id: '2',
        question: 'Will Ethereum ETF be approved in Q1 2025?',
        currentPrice: 0.45,
        volume24h: 89000,
        category: 'Crypto',
        signals: [
            {
                id: 's3',
                analyst: '9bRt...5xWq',
                direction: 1,
                confidence: 78,
                zScore: 1.4,
                price: 1.5,
                isPurchased: true,
            },
        ],
    },
    {
        id: '3',
        question: 'Will AI regulation pass in the US Senate?',
        currentPrice: 0.32,
        volume24h: 56000,
        category: 'Politics',
        signals: [],
    },
];

export default function MarketList() {
    const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">Live Markets</h2>
                    <p className="text-gray-400 mt-1">Browse prediction markets with AI-powered signals</p>
                </div>
                <div className="flex gap-2">
                    <select className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>All Categories</option>
                        <option>Crypto</option>
                        <option>Politics</option>
                        <option>Sports</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-4">
                {mockMarkets.map((market) => (
                    <div
                        key={market.id}
                        className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        {market.category}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                        ${(market.volume24h / 1000).toFixed(0)}k volume
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{market.question}</h3>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-white">{(market.currentPrice * 100).toFixed(0)}¢</div>
                                <div className="text-sm text-gray-400">Current Price</div>
                            </div>
                        </div>

                        {market.signals.length > 0 ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-gray-300">Available Signals ({market.signals.length})</h4>
                                    <button
                                        onClick={() => setSelectedMarket(selectedMarket === market.id ? null : market.id)}
                                        className="text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        {selectedMarket === market.id ? 'Hide' : 'Show'} Details
                                    </button>
                                </div>
                                {selectedMarket === market.id && (
                                    <div className="space-y-2">
                                        {market.signals.map((signal) => (
                                            <SignalCard key={signal.id} signal={signal} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                No signals available for this market yet
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function SignalCard({ signal }: { signal: any }) {
    const directionIcon = signal.direction === 1 ? <TrendingUp className="w-4 h-4" /> : signal.direction === -1 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />;
    const directionColor = signal.direction === 1 ? 'text-green-400' : signal.direction === -1 ? 'text-red-400' : 'text-gray-400';
    const directionBg = signal.direction === 1 ? 'bg-green-500/10 border-green-500/30' : signal.direction === -1 ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-500/10 border-gray-500/30';

    return (
        <div className="bg-black/30 border border-white/5 rounded-xl p-4 hover:bg-black/40 transition-all">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${directionBg} ${directionColor}`}>
                        {directionIcon}
                        <span className="font-medium">{signal.direction === 1 ? 'YES' : signal.direction === -1 ? 'NO' : 'NEUTRAL'}</span>
                    </div>
                    <div>
                        <div className="text-sm text-gray-400">Analyst: <span className="text-white font-mono">{signal.analyst}</span></div>
                        <div className="flex gap-4 mt-1">
                            <span className="text-xs text-gray-500">Confidence: <span className="text-blue-400 font-medium">{signal.confidence}%</span></span>
                            <span className="text-xs text-gray-500">Z-Score: <span className="text-purple-400 font-medium">{signal.zScore.toFixed(2)}</span></span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {signal.isPurchased ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400">
                            <Unlock className="w-4 h-4" />
                            <span className="font-medium">Unlocked</span>
                        </div>
                    ) : signal.price > 0 ? (
                        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Unlock for {signal.price} USDC
                        </button>
                    ) : (
                        <div className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium">
                            Free Signal
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
