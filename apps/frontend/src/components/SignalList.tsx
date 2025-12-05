import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';

const mockSignals = [
    {
        id: 's1',
        marketQuestion: 'Will Bitcoin reach $100,000 by end of 2024?',
        analyst: '7xKX...9pQz',
        direction: 1,
        confidence: 85,
        zScore: 1.8,
        momentum: 12.5,
        volatility: 0.45,
        price: 2.5,
        timestamp: '2024-12-04T18:30:00Z',
        resolved: false,
    },
    {
        id: 's2',
        marketQuestion: 'Will Ethereum ETF be approved in Q1 2025?',
        analyst: '9bRt...5xWq',
        direction: 1,
        confidence: 78,
        zScore: 1.4,
        momentum: 8.2,
        volatility: 0.38,
        price: 1.5,
        timestamp: '2024-12-04T16:15:00Z',
        resolved: false,
    },
    {
        id: 's3',
        marketQuestion: 'Will Bitcoin reach $100,000 by end of 2024?',
        analyst: '4mNv...2kLp',
        direction: -1,
        confidence: 72,
        zScore: -1.2,
        momentum: -5.3,
        volatility: 0.52,
        price: 0,
        timestamp: '2024-12-04T14:45:00Z',
        resolved: true,
        outcome: true,
    },
];

export default function SignalList() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">Published Signals</h2>
                    <p className="text-gray-400 mt-1">On-chain prediction signals from verified analysts</p>
                </div>
                <div className="flex gap-2">
                    <select className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>All Signals</option>
                        <option>Active Only</option>
                        <option>Resolved</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-4">
                {mockSignals.map((signal) => (
                    <div
                        key={signal.id}
                        className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    {signal.resolved ? (
                                        signal.outcome ? (
                                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                                <CheckCircle className="w-3 h-3" />
                                                Correct
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                                <XCircle className="w-3 h-3" />
                                                Incorrect
                                            </span>
                                        )
                                    ) : (
                                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                            <Clock className="w-3 h-3" />
                                            Active
                                        </span>
                                    )}
                                    <span className="text-gray-400 text-sm">
                                        {new Date(signal.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{signal.marketQuestion}</h3>
                                <div className="text-sm text-gray-400">
                                    Analyst: <span className="text-white font-mono">{signal.analyst}</span>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${signal.direction === 1
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}>
                                {signal.direction === 1 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                <span className="font-bold text-lg">{signal.direction === 1 ? 'YES' : 'NO'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
                            <MetricCard label="Confidence" value={`${signal.confidence}%`} color="text-blue-400" />
                            <MetricCard label="Z-Score" value={signal.zScore.toFixed(2)} color="text-purple-400" />
                            <MetricCard label="Momentum" value={`${signal.momentum > 0 ? '+' : ''}${signal.momentum.toFixed(1)}%`} color={signal.momentum > 0 ? 'text-green-400' : 'text-red-400'} />
                            <MetricCard label="Volatility" value={signal.volatility.toFixed(2)} color="text-orange-400" />
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                                {signal.price > 0 ? (
                                    <span>Price: <span className="text-white font-medium">{signal.price} USDC</span></span>
                                ) : (
                                    <span className="text-green-400 font-medium">Free Signal</span>
                                )}
                            </div>
                            <button className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all">
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div>
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
        </div>
    );
}
