import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { usePythSignals } from '../hooks/usePythSignals';

export default function SignalList() {
    const { signals, loading, error } = usePythSignals();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-white">Loading Pyth signals...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-400">{error}</div>
            </div>
        );
    }

    if (signals.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">No signals published yet. Publish some via Solana Playground!</div>
            </div>
        );
    }

    // Transform signals to match component format
    const displaySignals = signals.map((signal) => ({
        id: signal.id,
        marketQuestion: `${signal.marketId} - Confidence Anomaly Detected`,
        analyst: 'Pyth Oracle',
        direction: signal.confidence < 90 ? -1 : 1,
        confidence: signal.confidence,
        zScore: 0,
        momentum: 0,
        volatility: 0,
        price: 0,
        timestamp: new Date(signal.timestamp * 1000).toISOString(),
        resolved: false,
        severity: signal.severity,
    }));

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
                {displaySignals.map((signal) => (
                    <div
                        key={signal.id}
                        className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    {/* Severity Badge */}
                                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${signal.severity === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                            signal.severity === 'High' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                                signal.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        }`}>
                                        <AlertTriangle className="w-3 h-3" />
                                        {signal.severity}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                        {new Date(signal.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{signal.marketQuestion}</h3>
                                <div className="text-sm text-gray-400">
                                    Source: <span className="text-white font-mono">{signal.analyst}</span>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${signal.confidence < 90
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                    : 'bg-green-500/10 border-green-500/30 text-green-400'
                                }`}>
                                {signal.confidence < 90 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                                <span className="font-bold text-lg">{signal.confidence}%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
                            <MetricCard label="Confidence" value={`${signal.confidence}%`} color="text-blue-400" />
                            <MetricCard label="Market" value={signal.marketQuestion.split('-')[0].trim()} color="text-purple-400" />
                            <MetricCard label="Severity" value={signal.severity} color={
                                signal.severity === 'Critical' ? 'text-red-400' :
                                    signal.severity === 'High' ? 'text-orange-400' :
                                        signal.severity === 'Medium' ? 'text-yellow-400' :
                                            'text-blue-400'
                            } />
                            <MetricCard label="Status" value="Active" color="text-green-400" />
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                                <span className="text-green-400 font-medium">On-Chain Signal</span>
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
